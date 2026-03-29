// ─────────────────────────────────────────────────────
//  Route: Auth — User profile endpoint
// ─────────────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const { requireAuth, supabase } = require('../middleware/auth');

// GET /api/auth/me — Get current user profile
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    return res.json({
      success: true,
      user: {
        id:        req.user.id,
        email:     req.user.email,
        name:      req.user.user_metadata?.full_name || req.user.email?.split('@')[0],
        avatar:    req.user.user_metadata?.avatar_url || null,
        createdAt: req.user.created_at
      },
      profile: profile || {}
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
