// ─────────────────────────────────────────────────────
//  Service: Cache — Query-level result caching
//  Stores in Supabase with 24hr expiry
//  In-memory layer for ultra-fast repeat hits
// ─────────────────────────────────────────────────────

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// In-memory cache for this server session (ultra fast)
const memCache = new Map();
const MEM_TTL = 60 * 60 * 1000; // 1 hour in ms

// Hash a query for consistent lookup
function hashQuery(query) {
  const normalized = query.toLowerCase().trim()
    .replace(/[₹,]/g, '')
    .replace(/\s+/g, ' ');
  return crypto.createHash('md5').update(normalized).digest('hex');
}

// Get from cache (memory first, then DB)
async function getCache(query) {
  const hash = hashQuery(query);

  // Check memory first
  const mem = memCache.get(hash);
  if (mem && Date.now() - mem.timestamp < MEM_TTL) {
    console.log('  ⚡ Memory cache hit!');
    return { ...mem.data, cached: true, cache_source: 'memory' };
  }

  // Check Supabase
  try {
    const { data, error } = await supabase
      .from('search_cache')
      .select('result, hit_count, created_at')
      .eq('query_hash', hash)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) return null;

    // Increment hit count
    await supabase.from('search_cache')
      .update({ hit_count: (data.hit_count || 1) + 1 })
      .eq('query_hash', hash);

    // Store in memory too
    memCache.set(hash, { data: data.result, timestamp: Date.now() });

    console.log(`  📦 DB cache hit! (${data.hit_count} total hits)`);
    return { ...data.result, cached: true, cache_source: 'database' };

  } catch { return null; }
}

// Save to cache
async function setCache(query, result) {
  const hash = hashQuery(query);

  // Save to memory
  memCache.set(hash, { data: result, timestamp: Date.now() });

  // Save to Supabase
  try {
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    await supabase.from('search_cache').upsert({
      query_hash: hash,
      query_text: query,
      result:     result,
      hit_count:  1,
      created_at: new Date().toISOString(),
      expires_at: expires.toISOString()
    }, { onConflict: 'query_hash' });

  } catch(e) { console.warn('Cache save failed:', e.message); }
}

// Clear expired cache (run periodically)
async function clearExpired() {
  try {
    await supabase.from('search_cache')
      .delete()
      .lt('expires_at', new Date().toISOString());
    // Clear old memory entries
    for (const [key, val] of memCache.entries()) {
      if (Date.now() - val.timestamp > MEM_TTL) memCache.delete(key);
    }
  } catch {}
}

// Auto-clear expired cache every hour
setInterval(clearExpired, 60 * 60 * 1000);

module.exports = { getCache, setCache, hashQuery };
