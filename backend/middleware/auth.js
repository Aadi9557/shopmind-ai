// ─────────────────────────────────────────────────────
//  Middleware: Auth — Verifies Supabase JWT token
// ─────────────────────────────────────────────────────

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided. Please login.' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired session. Please login again.' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Auth check failed: ' + err.message });
  }
}

module.exports = { requireAuth, supabase };
