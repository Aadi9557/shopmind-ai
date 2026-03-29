// ─────────────────────────────────────────────────────
//  Service: Tavily — Web Search + Direct Product Links
//  Covers ALL 25+ Indian platforms
// ─────────────────────────────────────────────────────

// All domains Tavily will search
const INDIAN_DOMAINS = [
  // E-Commerce
  'amazon.in', 'flipkart.com', 'meesho.com', 'croma.com',
  'jiomart.com', 'nykaa.com', 'myntra.com', 'tatacliq.com',
  'reliancedigital.in', 'vijaysales.com', 'snapdeal.com',
  'bigbasket.com', 'blinkit.com', 'purplle.com', 'ajio.com',
  'firstcry.com', 'pepperfry.com', 'urbanladder.com',
  'pharmeasy.in', '1mg.com', 'lenskart.com', 'caratlane.com',
  'bewakoof.com', 'mamaearth.in', 'boat-lifestyle.com',
  // Review & Comparison
  'digit.in', '91mobiles.com', 'gadgets360.com', 'ndtv.com',
  'smartprix.com', 'mysmartprice.com', 'pricedekho.com',
  // Community
  'reddit.com', 'quora.com', 'mouthshut.com', 'bgr.in'
];

// Direct product URL detection rules for every platform
// These patterns detect when a URL is a PRODUCT PAGE (not homepage/search)
const DIRECT_URL_PATTERNS = [
  // ── E-COMMERCE ──────────────────────────────────────
  {
    platform: 'Amazon India',
    domain: 'amazon.in',
    check: u => u.includes('/dp/') || u.includes('/gp/product/')
  },
  {
    platform: 'Flipkart',
    domain: 'flipkart.com',
    // Flipkart product pages: /product-name/p/ITMXXXXXXX
    check: u => /flipkart\.com\/.+\/p\/itm/.test(u) || 
                (/flipkart\.com\/.+\/p\//.test(u) && !u.includes('/search') && !u.includes('?q='))
  },
  {
    platform: 'Myntra',
    domain: 'myntra.com',
    // Myntra product pages end with a number: /brand/product/12345678
    check: u => /myntra\.com\/.+\/.+\/\d{7,}/.test(u)
  },
  {
    platform: 'Nykaa',
    domain: 'nykaa.com',
    // Nykaa: /product-name/p/XXXXX or /buy/brand/product
    check: u => (u.includes('/p/') && !u.includes('/search') && !u.includes('?q=')) ||
                u.includes('/buy/')
  },
  {
    platform: 'Croma',
    domain: 'croma.com',
    // Croma: /brand-product-name/p/XXXXXX
    check: u => /croma\.com\/.+-p-\d+/.test(u) || 
                (/croma\.com\/.+\/p\//.test(u) && !u.includes('/search'))
  },
  {
    platform: 'Meesho',
    domain: 'meesho.com',
    // Meesho: /product-name/p/XXXXXX
    check: u => /meesho\.com\/.+\/p\/\d+/.test(u)
  },
  {
    platform: 'Tata Cliq',
    domain: 'tatacliq.com',
    // Tata Cliq: /brand/product/p-mpXXXXXX
    check: u => u.includes('/p-mp') || 
                (u.includes('/buy/') && !u.includes('/search'))
  },
  {
    platform: 'Reliance Digital',
    domain: 'reliancedigital.in',
    // Reliance: /product-name/p/XXXXXX
    check: u => /reliancedigital\.in\/.+\/p\/\d+/.test(u)
  },
  {
    platform: 'Ajio',
    domain: 'ajio.com',
    // Ajio: /brand/product/p/XXXXXX
    check: u => /ajio\.com\/.+\/p\/[A-Z0-9]+/.test(u)
  },
  {
    platform: 'Purplle',
    domain: 'purplle.com',
    // Purplle: /product/brand-name/XXXXX
    check: u => u.includes('/product/') && !u.includes('/search')
  },
  {
    platform: 'BigBasket',
    domain: 'bigbasket.com',
    // BigBasket: /pd/XXXXX/product-name
    check: u => u.includes('/pd/') || 
                (/bigbasket\.com\/p\//.test(u) && !u.includes('/ps/'))
  },
  {
    platform: 'Blinkit',
    domain: 'blinkit.com',
    // Blinkit: /prn/product-name/prid/XXXXX
    check: u => u.includes('/prn/') && u.includes('/prid/')
  },
  {
    platform: 'Pepperfry',
    domain: 'pepperfry.com',
    // Pepperfry: /product/product-name-XXXXX.html
    check: u => (u.includes('.html') && u.includes('/product')) ||
                u.includes('/furniture/')
  },
  {
    platform: 'Urban Ladder',
    domain: 'urbanladder.com',
    // Urban Ladder: /products/product-name
    check: u => u.includes('/products/') && !u.includes('/search')
  },
  {
    platform: 'FirstCry',
    domain: 'firstcry.com',
    // FirstCry: /store/product-name-XXXXX.aspx
    check: u => u.includes('.aspx') || /firstcry\.com\/store\/.+-\d+/.test(u)
  },
  {
    platform: 'PharmEasy',
    domain: 'pharmeasy.in',
    // PharmEasy: /product/product-name-XXXXX
    check: u => u.includes('/product/') && !u.includes('/search')
  },
  {
    platform: '1mg',
    domain: '1mg.com',
    // 1mg: /drugs/product-name-XXXXX or /otc/product-name-XXXXX
    check: u => u.includes('/drugs/') || u.includes('/otc/')
  },
  {
    platform: 'Snapdeal',
    domain: 'snapdeal.com',
    // Snapdeal: /product/product-name/XXXXX
    check: u => /snapdeal\.com\/product\/.+\/\d+/.test(u)
  },
  {
    platform: 'Vijay Sales',
    domain: 'vijaysales.com',
    // Vijay Sales: /product/brand-product-name
    check: u => u.includes('/product/') && !u.includes('/search')
  },
  {
    platform: 'JioMart',
    domain: 'jiomart.com',
    // JioMart: /p/product-name-XXXXX
    check: u => /jiomart\.com\/p\/.+-\d+/.test(u)
  },
  {
    platform: 'Lenskart',
    domain: 'lenskart.com',
    // Lenskart: /p/XXXXX-brand-product
    check: u => /lenskart\.com\/[a-z-]+\/p\/\d+/.test(u)
  },
  {
    platform: 'Bewakoof',
    domain: 'bewakoof.com',
    check: u => u.includes('/p/') && !u.includes('/search')
  },
  {
    platform: 'Mamaearth',
    domain: 'mamaearth.in',
    check: u => u.includes('/products/') && !u.includes('/search')
  },
  {
    platform: 'boAt',
    domain: 'boat-lifestyle.com',
    check: u => u.includes('/products/') && !u.includes('/search')
  },
];

// ── EXTRACT DIRECT URL FROM ANY URL ─────────────────
function extractDirectUrl(url) {
  if (!url) return null;
  for (const p of DIRECT_URL_PATTERNS) {
    if (url.includes(p.domain) && p.check(url)) {
      return { platform: p.platform, url, isDirect: true };
    }
  }
  return null;
}

// ── GENERAL PRODUCT SEARCH ───────────────────────────
async function searchProducts(query) {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: `${query} India buy online 2025`,
        search_depth: 'advanced',
        max_results: 10,
        include_domains: INDIAN_DOMAINS
      })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.results || [];
  } catch (err) {
    console.error('Tavily search error:', err.message);
    return [];
  }
}

// ── SEARCH FOR DIRECT PRODUCT LINKS ─────────────────
// Searches specifically for product pages across all platforms
async function searchDirectLinks(productName) {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: `"${productName}" buy online India`,
        search_depth: 'advanced',
        max_results: 20,
        include_domains: [
          'amazon.in', 'flipkart.com', 'meesho.com', 'croma.com',
          'nykaa.com', 'myntra.com', 'tatacliq.com', 'reliancedigital.in',
          'ajio.com', 'purplle.com', 'bigbasket.com', 'blinkit.com',
          'firstcry.com', 'pepperfry.com', 'urbanladder.com',
          'pharmeasy.in', '1mg.com', 'snapdeal.com', 'vijaysales.com',
          'jiomart.com', 'lenskart.com', 'bewakoof.com',
          'mamaearth.in', 'boat-lifestyle.com'
        ]
      })
    });

    const data = await response.json();
    const results = data.results || [];
    const directLinks = [];
    const seen = new Set();

    for (const r of results) {
      const match = extractDirectUrl(r.url);
      if (match && !seen.has(match.platform)) {
        seen.add(match.platform);
        directLinks.push({
          platform: match.platform,
          url: r.url,
          title: r.title,
          isDirect: true
        });
      }
    }

    console.log(`   🔗 ${directLinks.length} direct links found for: ${productName}`);
    return directLinks;

  } catch (err) {
    console.error('Direct link error:', err.message);
    return [];
  }
}

// ── BUILD SEARCH URL WITH PRICE RANGE (ALL PLATFORMS) ─
// Strategy:
// Tier 1 — Platform has native price filter URL → use it
// Tier 2 — Platform has no filter but supports query → add price keyword in query
// Tier 3 — No support → fallback to Google Shopping with price filter
function buildSearchUrl(platform, productName, priceMin, priceMax) {
  const encoded    = encodeURIComponent(productName);

  // For platforms without URL price filters, add price range to search query
  // e.g. "earbuds under 2000" — works on almost every search engine
  const priceKeyword = priceMax
    ? encodeURIComponent(`${productName} under ${priceMax}`)
    : encoded;

  // Amazon paise conversion (Amazon uses paise = rupees × 100)
  const amzMin = Math.round((priceMin || 0) * 100);
  const amzMax = priceMax ? Math.round(priceMax * 100) : '';

  const urls = {

    // ── TIER 1: Native price filter URLs ─────────────

    // Amazon — rh=p_36:MIN-MAX (in paise)
    'Amazon India': priceMax
      ? `https://www.amazon.in/s?k=${encoded}&rh=p_36%3A${amzMin}-${amzMax}`
      : `https://www.amazon.in/s?k=${encoded}`,

    // Flipkart — price range facet
    'Flipkart': priceMax
      ? `https://www.flipkart.com/search?q=${encoded}&p%5B%5D=facets.price_range.from%3D${priceMin||0}%26facets.price_range.to%3D${priceMax}`
      : `https://www.flipkart.com/search?q=${encoded}`,

    // Myntra — Price facet filter
    'Myntra': priceMax
      ? `https://www.myntra.com/${encoded}?f=Price%3A${priceMin||0}%20TO%20${priceMax}`
      : `https://www.myntra.com/${encoded}`,

    // Nykaa — price_min & price_max params
    'Nykaa': priceMax
      ? `https://www.nykaa.com/search/result/?q=${encoded}&price_min=${priceMin||0}&price_max=${priceMax}`
      : `https://www.nykaa.com/search/result/?q=${encoded}`,

    // Ajio — Price_numeric facet
    'Ajio': priceMax
      ? `https://www.ajio.com/search/?text=${encoded}&mcat=Price_numeric%5B${priceMin||0}+TO+${priceMax}%5D`
      : `https://www.ajio.com/search/?text=${encoded}`,

    // Meesho — priceMin & priceMax params
    'Meesho': priceMax
      ? `https://www.meesho.com/search?q=${encoded}&priceMin=${priceMin||0}&priceMax=${priceMax}`
      : `https://www.meesho.com/search?q=${encoded}`,

    // Pepperfry — price_from & price_to
    'Pepperfry': priceMax
      ? `https://www.pepperfry.com/catalogsearch/result/?q=${encoded}&price_from=${priceMin||0}&price_to=${priceMax}`
      : `https://www.pepperfry.com/catalogsearch/result/?q=${encoded}`,

    // Snapdeal — lf & hf (low filter / high filter)
    'Snapdeal': priceMax
      ? `https://www.snapdeal.com/search?keyword=${encoded}&minimum_price=${priceMin||0}&maximum_price=${priceMax}`
      : `https://www.snapdeal.com/search?keyword=${encoded}`,

    // Purplle — price range params
    'Purplle': priceMax
      ? `https://www.purplle.com/search?q=${encoded}&price_min=${priceMin||0}&price_max=${priceMax}`
      : `https://www.purplle.com/search?q=${encoded}`,

    // ── TIER 2: Add price keyword to search query ─────
    // These platforms don't support URL price filters
    // but adding "under XXXX" to query gives relevant results

    // Croma — price keyword in search
    'Croma': `https://www.croma.com/searchB?q=${priceKeyword}`,

    // Tata Cliq — price keyword
    'Tata Cliq': `https://www.tatacliq.com/search/?searchCategory=all&text=${priceKeyword}`,

    // Reliance Digital — price keyword
    'Reliance Digital': `https://www.reliancedigital.in/search?q=${priceKeyword}`,

    // Vijay Sales — price keyword
    'Vijay Sales': `https://www.vijaysales.com/search/${priceKeyword}`,

    // BigBasket — price keyword
    'BigBasket': `https://www.bigbasket.com/ps/?q=${priceKeyword}`,

    // Blinkit — price keyword
    'Blinkit': `https://blinkit.com/s/?q=${priceKeyword}`,

    // JioMart — price keyword
    'JioMart': `https://www.jiomart.com/search/${priceKeyword}`,

    // Urban Ladder — price keyword
    'Urban Ladder': `https://www.urbanladder.com/search?q=${priceKeyword}`,

    // FirstCry — price keyword
    'FirstCry': `https://www.firstcry.com/search?q=${priceKeyword}`,

    // PharmEasy — price keyword
    'PharmEasy': `https://pharmeasy.in/search/all?name=${priceKeyword}`,

    // 1mg — price keyword
    '1mg': `https://www.1mg.com/search/all?name=${priceKeyword}`,

    // Lenskart — price keyword
    'Lenskart': `https://www.lenskart.com/search/?q=${priceKeyword}`,

    // Bewakoof — price keyword
    'Bewakoof': `https://www.bewakoof.com/search?q=${priceKeyword}`,

    // Mamaearth — price keyword
    'Mamaearth': `https://mamaearth.in/search?q=${priceKeyword}`,

    // boAt — price keyword
    'boAt': `https://www.boat-lifestyle.com/search?q=${priceKeyword}`,

  };

  // ── TIER 3: Fallback — Google Shopping with price filter
  return urls[platform]
    || `https://www.google.com/search?q=${priceKeyword}+buy+online+India&tbm=shop`;
}

module.exports = { searchProducts, searchDirectLinks, buildSearchUrl, extractDirectUrl };
