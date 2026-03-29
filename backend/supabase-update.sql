-- ═══════════════════════════════════════════════════
--  ShopMind AI — Supabase Update SQL
--  Run this in Supabase → SQL Editor → New Query
-- ═══════════════════════════════════════════════════

-- 1. User Plans table (tracks free/pro + daily count)
CREATE TABLE IF NOT EXISTS user_plans (
  user_id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan           TEXT DEFAULT 'free',
  searches_today INTEGER DEFAULT 0,
  last_reset     TEXT DEFAULT '',
  pro_expires    TIMESTAMPTZ,
  payment_id     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Price history table (for Pro users)
CREATE TABLE IF NOT EXISTS price_history (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  platform    TEXT,
  price       TEXT,
  url         TEXT,
  searched_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security
ALTER TABLE user_plans    ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Policies for user_plans
DROP POLICY IF EXISTS "user_plans_select" ON user_plans;
DROP POLICY IF EXISTS "user_plans_insert" ON user_plans;
DROP POLICY IF EXISTS "user_plans_update" ON user_plans;

CREATE POLICY "user_plans_select" ON user_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_plans_insert" ON user_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "user_plans_update" ON user_plans FOR UPDATE USING (auth.uid() = user_id);

-- Policies for price_history
DROP POLICY IF EXISTS "price_history_select" ON price_history;
DROP POLICY IF EXISTS "price_history_insert" ON price_history;

CREATE POLICY "price_history_select" ON price_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "price_history_insert" ON price_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Index for faster queries
CREATE INDEX IF NOT EXISTS user_plans_user_id_idx    ON user_plans(user_id);
CREATE INDEX IF NOT EXISTS price_history_user_id_idx ON price_history(user_id);
