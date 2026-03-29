// ─────────────────────────────────────────────────────
//  Service: Ranker — Hybrid AI + Rule-Based Engine
//  Cleans, validates, deduplicates and re-ranks products
// ─────────────────────────────────────────────────────

const { calculateOverallScore, normalizeScores } = require('./scoring');

// Extract numeric price from string like "₹15,499"
function parsePrice(priceStr) {
  if (!priceStr) return null;
  const num = parseInt(String(priceStr).replace(/[^0-9]/g, ''));
  return isNaN(num) ? null : num;
}

// Remove duplicate products (same brand + similar name)
function deduplicateProducts(products) {
  const seen = new Set();
  return products.filter(p => {
    const key = (p.brand + p.name).toLowerCase()
      .replace(/\s+/g, '')
      .substring(0, 30);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Remove products that exceed user budget
function filterByBudget(products, budgetMax) {
  if (!budgetMax) return products;
  const slack = 1.15; // allow 15% over budget
  return products.filter(p => {
    const price = parsePrice(p.best_price);
    if (!price) return true; // keep if can't parse price
    return price <= budgetMax * slack;
  });
}

// Validate that scores are reasonable
function validateScores(product) {
  const scores = product.scores || {};
  const keys = ['value', 'performance', 'reviews', 'brand', 'warranty', 'delivery'];
  let valid = true;
  for (const key of keys) {
    if (scores[key] === undefined || scores[key] < 0 || scores[key] > 10) {
      valid = false;
      break;
    }
  }
  return valid;
}

// Boost score for price-sensitive users
function applyPriceSensitivityBoost(products, priceSensitive) {
  if (!priceSensitive) return products;
  return products.map(p => ({
    ...p,
    scores: {
      ...p.scores,
      value: Math.min(10, (p.scores?.value || 0) * 1.1) // 10% boost to value score
    }
  }));
}

// Add explanation for why product is ranked where it is
function generateExplanation(product, rank, allProducts) {
  const score = Number(product.overall_score || 0).toFixed(1);
  const scores = product.scores || {};
  const price = parsePrice(product.best_price);

  // Find strongest dimension
  const dims = [
    { key: 'value', label: 'value for money' },
    { key: 'performance', label: 'performance' },
    { key: 'reviews', label: 'customer reviews' },
    { key: 'brand', label: 'brand reliability' },
    { key: 'warranty', label: 'warranty support' }
  ];
  const best = dims.reduce((a, b) =>
    (scores[a.key] || 0) > (scores[b.key] || 0) ? a : b
  );
  const worst = dims.reduce((a, b) =>
    (scores[a.key] || 0) < (scores[b.key] || 0) ? a : b
  );

  if (rank === 1) {
    return `Ranked #1 with a score of ${score}/10. Stands out especially for its ${best.label}. ${product.pros?.[0] || ''}`;
  }
  if (rank === 2) {
    const top = allProducts[0];
    return `Strong #2 pick. Excellent ${best.label} but slightly behind ${top?.name?.split(' ')[0] || '#1'} in overall score. Good alternative if ${top?.name?.split(' ')[0] || '#1'} is unavailable.`;
  }
  return `Ranked #${rank}. Good choice for ${best.label}. Watch out for ${worst.label}.`;
}

// Main ranking function
function rankProducts(products, { budgetMax, priceSensitive } = {}) {
  if (!products?.length) return [];

  let ranked = [...products];

  // Step 1 — Deduplicate
  ranked = deduplicateProducts(ranked);

  // Step 2 — Filter by budget
  if (budgetMax) ranked = filterByBudget(ranked, budgetMax);

  // Step 3 — Normalize scores
  ranked = ranked.map(p => ({
    ...p,
    scores: normalizeScores(p.scores)
  }));

  // Step 4 — Apply price sensitivity boost
  if (priceSensitive) ranked = applyPriceSensitivityBoost(ranked, true);

  // Step 5 — Recalculate overall scores
  ranked = ranked.map(p => ({
    ...p,
    overall_score: calculateOverallScore(p.scores)
  }));

  // Step 6 — Sort by overall score
  ranked.sort((a, b) => b.overall_score - a.overall_score);

  // Step 7 — Keep top 5
  ranked = ranked.slice(0, 5);

  // Step 8 — Re-rank and add explanations
  ranked = ranked.map((p, i) => ({
    ...p,
    rank: i + 1,
    explanation: generateExplanation(p, i + 1, ranked)
  }));

  return ranked;
}

module.exports = { rankProducts, parsePrice, generateExplanation };
