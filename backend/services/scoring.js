// ─────────────────────────────────────────────────────
//  Service: Scoring — Product Score Calculation
// ─────────────────────────────────────────────────────

// Weights for each scoring criteria
const WEIGHTS = {
  value:       0.25, // Value for money
  performance: 0.20, // Speed/quality/specs
  reviews:     0.20, // Customer sentiment
  brand:       0.15, // Brand reliability in India
  warranty:    0.10, // Warranty & support
  delivery:    0.10  // Availability & delivery speed
};

// Calculate weighted overall score
function calculateOverallScore(scores) {
  if (!scores) return 0;
  let total = 0;
  for (const [key, weight] of Object.entries(WEIGHTS)) {
    total += (scores[key] || 0) * weight;
  }
  return Math.round(total * 10) / 10;
}

// Validate and normalize scores (ensure 0-10 range)
function normalizeScores(scores) {
  if (!scores) return {};
  const normalized = {};
  for (const key of Object.keys(WEIGHTS)) {
    const val = parseFloat(scores[key]) || 0;
    normalized[key] = Math.min(10, Math.max(0, val));
  }
  return normalized;
}

// Get score label
function getScoreLabel(score) {
  if (score >= 9)   return { label: 'Exceptional', color: '#2ecc71' };
  if (score >= 8)   return { label: 'Excellent',   color: '#27ae60' };
  if (score >= 7)   return { label: 'Good',         color: '#f39c12' };
  if (score >= 6)   return { label: 'Average',      color: '#e67e22' };
  return            { label: 'Below Average',        color: '#e74c3c' };
}

module.exports = { calculateOverallScore, normalizeScores, getScoreLabel, WEIGHTS };
