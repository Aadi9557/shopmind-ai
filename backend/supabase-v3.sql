-- ═══════════════════════════════════════════════════
--  ShopMind AI v3 — Supabase Schema Update
--  Run in: Supabase → SQL Editor → New Query
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_cats   TEXT[] DEFAULT '{}',
  avoided_brands   TEXT[] DEFAULT '{}',
  budget_min       INTEGER DEFAULT 0,
  budget_max       INTEGER DEFAULT 100000,
  price_sensitive  BOOLEAN DEFAULT true,
  total_searches   INTEGER DEFAULT 0,
  last_active      TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS search_cache (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query_hash  TEXT UNIQUE NOT NULL,
  query_text  TEXT NOT NULL,
  result      JSONB NOT NULL,
  hit_count   INTEGER DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE TABLE IF NOT EXISTS user_events (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type   TEXT NOT NULL,
  product_name TEXT,
  platform     TEXT,
  query        TEXT,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS price_watchlist (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name  TEXT NOT NULL,
  target_price  INTEGER NOT NULL,
  current_price INTEGER,
  platform      TEXT,
  buy_url       TEXT,
  alert_sent    BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cache_hash      ON search_cache(query_hash);
CREATE INDEX IF NOT EXISTS idx_cache_expires   ON search_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_events_user     ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_user  ON price_watchlist(user_id);

ALTER TABLE user_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_watchlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_profile"    ON user_profiles;
DROP POLICY IF EXISTS "own_events"     ON user_events;
DROP POLICY IF EXISTS "own_watchlist"  ON price_watchlist;
DROP POLICY IF EXISTS "cache_read"     ON search_cache;
DROP POLICY IF EXISTS "cache_insert"   ON search_cache;
DROP POLICY IF EXISTS "cache_update"   ON search_cache;

CREATE POLICY "own_profile"   ON user_profiles   FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_events"    ON user_events     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_watchlist" ON price_watchlist FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "cache_read"    ON search_cache    FOR SELECT USING (true);
CREATE POLICY "cache_insert"  ON search_cache    FOR INSERT WITH CHECK (true);
CREATE POLICY "cache_update"  ON search_cache    FOR UPDATE USING (true);
