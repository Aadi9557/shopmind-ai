// ─────────────────────────────────────────────────────
//  Route: Watchlist — Price Drop Tracking
//  Users can save products and get alerts when price drops
// ─────────────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const { requireAuth, supabase } = require('../middleware/auth');

// GET /api/watchlist — Get user's watchlist
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('price_watchlist')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json({ success: true, watchlist: data || [] });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
});

// POST /api/watchlist — Add product to watchlist (Pro only)
router.post('/', requireAuth, async (req, res) => {
  try {
    // Check plan
    const { data: plan } = await supabase
      .from('user_plans')
      .select('plan')
      .eq('user_id', req.user.id)
      .single();

    if (plan?.plan !== 'pro') {
      return res.status(403).json({
        error: 'pro_required',
        message: 'Price watchlist is a Pro feature. Upgrade for ₹99/month!',
        upgrade_url: '/pricing'
      });
    }

    const { product_name, target_price, current_price, platform, buy_url } = req.body;
    if (!product_name || !target_price) {
      return res.status(400).json({ error: 'product_name and target_price are required' });
    }

    // Check if already in watchlist
    const { data: existing } = await supabase
      .from('price_watchlist')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('product_name', product_name)
      .single();

    if (existing) {
      return res.json({ success: true, message: 'Already in watchlist', already_exists: true });
    }

    const { data, error } = await supabase
      .from('price_watchlist')
      .insert({
        user_id:       req.user.id,
        product_name,
        target_price:  parseInt(target_price),
        current_price: parseInt(current_price) || null,
        platform:      platform || null,
        buy_url:       buy_url || null,
        alert_sent:    false,
        created_at:    new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, item: data, message: 'Added to watchlist!' });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
});

// DELETE /api/watchlist/:id — Remove from watchlist
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('price_watchlist')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    return res.json({ success: true, message: 'Removed from watchlist' });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;
