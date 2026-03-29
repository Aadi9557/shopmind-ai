// ─────────────────────────────────────────────────────
//  Service: Groq — AI Analysis with Personalization
// ─────────────────────────────────────────────────────

const { calculateOverallScore, normalizeScores } = require('./scoring');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL        = 'llama-3.3-70b-versatile';

function buildSystemPrompt(userContext = '') {
  return `You are ShopMind AI — India's most intelligent AI Shopping Agent.

YOUR JOB:
Analyze web search results and give the BEST honest product recommendations for Indian buyers.
All prices MUST be in Indian Rupees (₹).

BUDGET RULES — CRITICAL:
- STRICTLY respect stated budget — NEVER recommend products above stated price limit
- If user says "under ₹500" — ALL products MUST be below ₹500, no exceptions
- If budget products cannot be found, say so honestly

TRUSTED SOURCES:
✅ amazon.in, flipkart.com, digit.in, 91mobiles.com, gadgets360.com, ndtv.com, smartprix.com, nykaa.com, bigbasket.com

FAKE SOURCES (ignore):
❌ Unknown blogs, paid review sites, spam aggregators
${userContext}

SCORING (each out of 10):
- value: Price vs quality for Indian buyers
- performance: Real-world speed/specs/quality
- reviews: Verified customer sentiment
- brand: Service centers and reliability in India  
- warranty: Length and quality in India
- delivery: Availability and speed across India

OUTPUT: Pure JSON only — no markdown, no backticks, no explanation text.

{
  "query_understood": "string",
  "personalized": true/false,
  "search_summary": "1-2 sentences",
  "products": [
    {
      "rank": 1,
      "name": "Exact name with model",
      "brand": "Brand",
      "best_price": "₹XX,XXX",
      "price_range": "₹XX,XXX – ₹XX,XXX",
      "best_platform": "Platform name",
      "official_site": "https://brand.com",
      "buy_links": [
        { "platform": "Amazon India", "url": "https://amazon.in/...", "price": "₹XX,XXX" }
      ],
      "review_links": [
        { "source": "Digit.in", "url": "https://digit.in/...", "rating": "8.5/10", "trusted": true }
      ],
      "specs": ["Spec 1", "Spec 2", "Spec 3"],
      "scores": { "value": 8.5, "performance": 9.0, "reviews": 8.0, "brand": 8.5, "warranty": 7.5, "delivery": 9.0 },
      "overall_score": 8.5,
      "pros": ["Pro 1", "Pro 2"],
      "cons": ["Con 1", "Con 2"],
      "summary": "Honest 2-sentence summary",
      "why_ranked_here": "1 sentence explaining rank position",
      "badge": "🏆 Best Value",
      "warranty": "1 Year Brand Warranty",
      "availability": "In Stock"
    }
  ],
  "top_pick": "Product name",
  "top_pick_reason": "2-3 sentences for Indian buyers",
  "price_insight": "Current pricing insight or deal alert",
  "sources_searched": ["amazon.in", "flipkart.com"],
  "trusted_sources_used": 5,
  "fake_sites_ignored": 0
}`;
}

async function analyzeProducts(query, searchResults, language = 'en', userContext = '') {
  const searchContext = searchResults
    .map((r, i) => `[${i+1}] TITLE: ${r.title}\nURL: ${r.url}\nCONTENT: ${r.content?.substring(0, 500) || ''}`)
    .join('\n\n---\n\n');

  const userMessage = language === 'hi'
    ? `User की query: "${query}"\n\nWeb results:\n\n${searchContext}\n\nJSON format में best products recommend करें।`
    : `User query: "${query}"\n\nWeb search results:\n\n${searchContext}\n\nReturn best product recommendations as JSON.`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: buildSystemPrompt(userContext) },
          { role: 'user',   content: userMessage }
        ],
        temperature: 0.2,
        max_tokens:  4000
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || 'Groq API error');

    const raw   = data.choices?.[0]?.message?.content || '';
    const clean = raw.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
    const start = clean.indexOf('{');
    const end   = clean.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No valid JSON in AI response');

    const parsed = JSON.parse(clean.substring(start, end + 1));

    // Normalize + recalculate scores
    if (parsed.products?.length) {
      for (const p of parsed.products) {
        p.scores        = normalizeScores(p.scores);
        p.overall_score = calculateOverallScore(p.scores);
      }
    }

    return { success: true, data: parsed };

  } catch(err) {
    console.error('Groq error:', err.message);
    throw err;
  }
}

module.exports = { analyzeProducts };
