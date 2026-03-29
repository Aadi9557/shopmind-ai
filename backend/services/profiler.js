// ─────────────────────────────────────────────────────
//  Service: Profiler — User Intelligence System
//  Learns user preferences from every search
//  Personalizes future results automatically
// ─────────────────────────────────────────────────────

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Get user profile (preferences)
async function getProfile(userId) {
  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    return data || {
      user_id:         userId,
      preferred_cats:  [],
      avoided_brands:  [],
      budget_min:      0,
      budget_max:      100000,
      price_sensitive: true,
      total_searches:  0
    };
  } catch { return null; }
}

// Extract budget from query
function extractBudget(query) {
  const q = query.toLowerCase();

  // Match patterns like "under ₹15,000" or "below 5000" or "₹2000"
  const patterns = [
    /under\s*[₹rs.]?\s*([\d,]+)/i,
    /below\s*[₹rs.]?\s*([\d,]+)/i,
    /less\s*than\s*[₹rs.]?\s*([\d,]+)/i,
    /budget\s*[₹rs.]?\s*([\d,]+)/i,
    /[₹rs.]\s*([\d,]+)/i
  ];

  for (const pattern of patterns) {
    const match = q.match(pattern);
    if (match) {
      return parseInt(match[1].replace(/,/g, ''));
    }
  }
  return null;
}

// Extract category from query
function extractCategory(query) {
  const q = query.toLowerCase();
  const catMap = {
    'phone': 'Electronics', 'mobile': 'Electronics', 'laptop': 'Electronics',
    'earbuds': 'Electronics', 'headphone': 'Electronics', 'tv': 'Electronics',
    'camera': 'Electronics', 'tablet': 'Electronics', 'watch': 'Electronics',
    'shoes': 'Fashion', 'kurta': 'Fashion', 'jeans': 'Fashion',
    'shirt': 'Fashion', 'dress': 'Fashion', 'saree': 'Fashion',
    'face wash': 'Beauty', 'skincare': 'Beauty', 'shampoo': 'Beauty',
    'serum': 'Beauty', 'moisturizer': 'Beauty', 'perfume': 'Beauty',
    'dal': 'Grocery', 'daal': 'Grocery', 'rice': 'Grocery',
    'atta': 'Grocery', 'oil': 'Grocery', 'ghee': 'Grocery',
    'protein': 'Health', 'vitamin': 'Health', 'medicine': 'Health',
    'sofa': 'Furniture', 'bed': 'Furniture', 'chair': 'Furniture',
    'baby': 'Baby', 'diaper': 'Baby', 'toy': 'Baby'
  };

  for (const [keyword, cat] of Object.entries(catMap)) {
    if (q.includes(keyword)) return cat;
  }
  return null;
}

// Update user profile after a search
async function updateProfile(userId, query, results) {
  try {
    const profile = await getProfile(userId) || {};
    const budget  = extractBudget(query);
    const cat     = extractCategory(query);

    // Build updates
    const updates = {
      user_id:        userId,
      total_searches: (profile.total_searches || 0) + 1,
      last_active:    new Date().toISOString(),
      updated_at:     new Date().toISOString()
    };

    // Update budget range
    if (budget) {
      updates.budget_max = Math.round(
        ((profile.budget_max || 100000) * 0.7) + (budget * 0.3)
      );
      updates.price_sensitive = budget < 20000;
    }

    // Update preferred categories
    if (cat) {
      const cats = new Set(profile.preferred_cats || []);
      cats.add(cat);
      updates.preferred_cats = [...cats].slice(-5); // keep last 5
    }

    await supabase.from('user_profiles').upsert(updates);

  } catch(e) { console.warn('Profile update failed:', e.message); }
}

// Build personalized system context for Groq
function buildPersonalizedContext(profile) {
  if (!profile) return '';

  const parts = [];

  if (profile.budget_max && profile.budget_max < 100000) {
    parts.push(`User typically searches in ₹${profile.budget_max.toLocaleString('en-IN')} budget range`);
  }

  if (profile.price_sensitive) {
    parts.push('User is price-sensitive — prioritize value for money');
  }

  if (profile.preferred_cats?.length) {
    parts.push(`User frequently searches: ${profile.preferred_cats.join(', ')}`);
  }

  if (profile.avoided_brands?.length) {
    parts.push(`User prefers to avoid: ${profile.avoided_brands.join(', ')}`);
  }

  if (!parts.length) return '';
  return '\nUSER CONTEXT:\n' + parts.map(p => `- ${p}`).join('\n');
}

module.exports = { getProfile, updateProfile, buildPersonalizedContext, extractBudget, extractCategory };
