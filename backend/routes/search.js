// ─────────────────────────────────────────────────────
//  Route: Search — Full Intelligence Pipeline
//  Cache → Profile → Search → AI → Rank → Explain
// ─────────────────────────────────────────────────────

const express  = require('express');
const router   = express.Router();
const { requireAuth, supabase } = require('../middleware/auth');
const { searchProducts, searchDirectLinks, buildSearchUrl } = require('../services/tavily');
const { analyzeProducts }       = require('../services/groq');
const { getCache, setCache }    = require('../services/cache');
const { getProfile, updateProfile, buildPersonalizedContext, extractBudget } = require('../services/profiler');
const { rankProducts }          = require('../services/ranker');

const FREE_LIMIT = 10;

// ── SEARCH LIMIT CHECK ───────────────────────────────
async function checkAndIncrementLimit(userId) {
  const today = new Date().toDateString();
  let { data: plan } = await supabase
    .from('user_plans').select('*').eq('user_id', userId).single();

  if (!plan) {
    plan = { user_id: userId, plan: 'free', searches_today: 0, last_reset: today };
    await supabase.from('user_plans').insert(plan);
  }

  if (plan.plan === 'pro' && plan.pro_expires && new Date(plan.pro_expires) < new Date()) {
    plan.plan = 'free';
    await supabase.from('user_plans').update({ plan: 'free' }).eq('user_id', userId);
  }

  if (plan.plan === 'pro') return { allowed: true, plan: 'pro', searches_left: 999 };

  if (plan.last_reset !== today) {
    plan.searches_today = 0;
    plan.last_reset = today;
  }

  if (plan.searches_today >= FREE_LIMIT) {
    return { allowed: false, plan: 'free', searches_today: plan.searches_today, searches_left: 0 };
  }

  const newCount = (plan.searches_today || 0) + 1;
  await supabase.from('user_plans').upsert({
    user_id: userId, plan: 'free',
    searches_today: newCount, last_reset: today
  });

  return { allowed: true, plan: 'free', searches_today: newCount, searches_left: FREE_LIMIT - newCount };
}

// POST /api/search
router.post('/', requireAuth, async (req, res) => {
  const startTime = Date.now();
  try {
    const { query, language = 'en', session_id } = req.body;
    if (!query?.trim()) return res.status(400).json({ error: 'Search query required' });

    // ── STEP 0: LIMIT CHECK (disabled for testing) ───
    // ── SEARCH LIMIT ─────────────────────────────────
    const limitCheck = await checkAndIncrementLimit(req.user.id);
    if (!limitCheck.allowed) {
      return res.status(403).json({
        error: 'limit_reached',
        message: `You have used all 10 free searches today. Upgrade to Pro for unlimited!`,
        searches_today: limitCheck.searches_today,
        searches_left: 0,
        upgrade_url: '/pricing'
      });
    }

    console.log(`\n🔍 "${query}" | ${req.user.email}`);

    // ── STEP 1: CACHE CHECK ──────────────────────────
    const cached = await getCache(query);
    if (cached) {
      console.log('  ⚡ Returning cached result');
      return res.json({
        success: true,
        data: cached,
        session_id: session_id || `session_${Date.now()}`,
        cached: true,
        response_ms: Date.now() - startTime,
        ...limitCheck
      });
    }

    // ── STEP 2: LOAD USER PROFILE ────────────────────
    const profile = await getProfile(req.user.id);
    const userContext = buildPersonalizedContext(profile);
    const userBudget  = extractBudget(query) || profile?.budget_max;
    if (userContext) console.log('  👤 User context applied');

    // ── STEP 3: WEB SEARCH ───────────────────────────
    console.log('  📡 Searching web...');
    const searchResults = await searchProducts(query);
    if (!searchResults.length) {
      return res.json({ success: false, error: 'No results found. Try a more specific search.' });
    }
    console.log(`  ✅ ${searchResults.length} results`);

    // ── STEP 4: AI ANALYSIS ──────────────────────────
    console.log('  🤖 AI analyzing with user context...');
    const { data: analyzed } = await analyzeProducts(query, searchResults, language, userContext);

    // ── STEP 5: HYBRID RANKING ───────────────────────
    console.log('  📊 Hybrid ranking...');
    analyzed.products = rankProducts(analyzed.products, {
      budgetMax:      userBudget,
      priceSensitive: profile?.price_sensitive
    });

    // ── STEP 6: DIRECT PRODUCT LINKS ─────────────────
    console.log('  🔗 Finding direct links...');
    const q = query.toLowerCase();
    const isElectronics = /phone|mobile|laptop|tv|earbuds|headphone|smartwatch|watch|camera|ac|refrigerator|fridge|washing|speaker|tablet|computer|monitor|charger/.test(q);
    const isFashion     = /shirt|dress|shoes|shoe|kurta|saree|jeans|clothing|fashion|footwear|sneaker|tshirt|pant|jacket/.test(q);
    const isBeauty      = /skincare|face.?wash|serum|cream|moisturizer|makeup|beauty|shampoo|hair|perfume|deodorant|sunscreen|lotion/.test(q);
    const isGrocery     = /grocery|food|vegetable|fruit|rice|dal|daal|atta|flour|oil|spice|snack|masala|ghee|milk|curd|sugar|tea|coffee|pulses|moong|chana|poha/.test(q);
    const isFurniture   = /sofa|bed|mattress|chair|table|wardrobe|shelf|furniture|desk|cabinet/.test(q);
    const isBaby        = /baby|diaper|toy|kid|child|infant|toddler|stroller/.test(q);
    const isMedicine    = /medicine|vitamin|supplement|protein|health|pharma|tablet|capsule|ayurvedic/.test(q);

    const categoryPlatforms =
      isElectronics ? ['Amazon India','Flipkart','Croma','Reliance Digital','Tata Cliq','Vijay Sales'] :
      isFashion     ? ['Myntra','Ajio','Amazon India','Flipkart','Meesho'] :
      isBeauty      ? ['Nykaa','Purplle','Amazon India','Flipkart','Myntra'] :
      isGrocery     ? ['BigBasket','JioMart','Blinkit','Amazon India','Flipkart'] :
      isFurniture   ? ['Pepperfry','Urban Ladder','Amazon India','Flipkart'] :
      isBaby        ? ['FirstCry','Amazon India','Flipkart','Meesho'] :
      isMedicine    ? ['PharmEasy','1mg','Amazon India','Flipkart'] :
                      ['Amazon India','Flipkart','Meesho','Tata Cliq','Snapdeal'];

    if (analyzed.products?.length) {
      for (const product of analyzed.products) {
        const name  = product.name || '';
        const price = product.best_price || '';
        const directLinks = await searchDirectLinks(name);
        const finalLinks  = [];
        const used = new Set();

        for (const link of directLinks) {
          if (!used.has(link.platform)) {
            used.add(link.platform);
            finalLinks.push({ platform: link.platform, url: link.url, price, isDirect: true });
          }
        }
        // Extract price range from product
        const rawPrice = parseInt(String(product.best_price||'').replace(/[^0-9]/g,'')) || 0;
        const priceMin = rawPrice ? Math.floor(rawPrice * 0.8) : 0;
        const priceMax = rawPrice ? Math.ceil(rawPrice * 1.2) : 0;

        for (const platform of categoryPlatforms) {
          if (!used.has(platform)) {
            used.add(platform);
            // Pass price range so user lands on filtered search page
            finalLinks.push({
              platform,
              url: buildSearchUrl(platform, name, priceMin, priceMax),
              price,
              isDirect: false
            });
          }
          if (finalLinks.length >= 5) break;
        }
        product.buy_links = finalLinks;
      }
    }

    // ── STEP 7: CACHE RESULT ─────────────────────────
    await setCache(query, analyzed);

    // ── STEP 8: UPDATE USER PROFILE ──────────────────
    updateProfile(req.user.id, query, analyzed).catch(() => {});

    // ── STEP 9: SAVE TO HISTORY ──────────────────────
    const chatSession = session_id || `session_${Date.now()}`;
    await supabase.from('chats').insert({
      user_id: req.user.id,
      session_id: chatSession,
      query,
      response: analyzed,
      created_at: new Date().toISOString()
    }).then(({ error }) => {
      if (error) console.warn('  ⚠️ History save error:', error.message);
    });

    const ms = Date.now() - startTime;
    console.log(`  ✅ Done in ${ms}ms\n`);

    return res.json({
      success:     true,
      data:        analyzed,
      session_id:  chatSession,
      cached:      false,
      response_ms: ms,
      personalized: !!userContext,
      ...limitCheck
    });

  } catch(err) {
    console.error('❌ Search error:', err.message);
    if (err.message?.includes('401')) return res.status(401).json({ error: 'Invalid API Key.' });
    if (err.message?.includes('rate'))return res.status(429).json({ error: 'Too many requests. Wait a moment.' });
    return res.status(500).json({ error: err.message || 'Something went wrong' });
  }
});

module.exports = router;
