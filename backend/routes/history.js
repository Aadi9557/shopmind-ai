// ─────────────────────────────────────────────────────
//  Route: History — Chat history endpoints
// ─────────────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const { requireAuth, supabase } = require('../middleware/auth');

// GET /api/history — Get chats (10 for free, all for pro)
router.get('/', requireAuth, async (req, res) => {
  try {
    // Check user plan
    const { data: plan } = await supabase
      .from('user_plans')
      .select('plan')
      .eq('user_id', req.user.id)
      .single();

    const isPro = plan?.plan === 'pro';
    const limit = isPro ? 500 : 10;

    const { data, error } = await supabase
      .from('chats')
      .select('id, session_id, query, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return res.json({
      success: true,
      chats: data || [],
      plan: isPro ? 'pro' : 'free',
      history_limit: isPro ? 'unlimited' : 10
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/history/:id — Get single chat with full response
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Chat not found' });

    return res.json({ success: true, chat: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/history/session/:session_id — Get all chats in a session
router.get('/session/:session_id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('session_id', req.params.session_id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return res.json({ success: true, chats: data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/history — Clear all history
router.delete('/', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('user_id', req.user.id);

    if (error) throw error;
    return res.json({ success: true, message: 'History cleared' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/history/:id — Delete single chat
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    return res.json({ success: true, message: 'Chat deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
