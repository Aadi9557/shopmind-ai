// ─────────────────────────────────────────────────────
//  Route: Events — User Behavior Tracking
//  Tracks clicks, searches, platform preferences
// ─────────────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const { requireAuth, supabase } = require('../middleware/auth');

// POST /api/events — Track a user event
router.post('/', requireAuth, async (req, res) => {
  try {
    const { event_type, product_name, platform, query, metadata } = req.body;

    if (!event_type) return res.status(400).json({ error: 'event_type required' });

    await supabase.from('user_events').insert({
      user_id:      req.user.id,
      event_type,
      product_name: product_name || null,
      platform:     platform || null,
      query:        query || null,
      metadata:     metadata || {},
      created_at:   new Date().toISOString()
    });

    return res.json({ success: true });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
});

// GET /api/events/insights — Get user behavior insights
router.get('/insights', requireAuth, async (req, res) => {
  try {
    const { data: events } = await supabase
      .from('user_events')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!events?.length) return res.json({ success: true, insights: {} });

    // Most clicked platforms
    const platformCounts = {};
    const productCounts  = {};

    for (const e of events) {
      if (e.platform) platformCounts[e.platform] = (platformCounts[e.platform] || 0) + 1;
      if (e.product_name) productCounts[e.product_name] = (productCounts[e.product_name] || 0) + 1;
    }

    const topPlatform = Object.entries(platformCounts).sort((a,b)=>b[1]-a[1])[0]?.[0];
    const topProduct  = Object.entries(productCounts).sort((a,b)=>b[1]-a[1])[0]?.[0];

    return res.json({
      success: true,
      insights: {
        total_events:    events.length,
        top_platform:    topPlatform,
        top_product:     topProduct,
        platform_counts: platformCounts,
        recent_searches: events.filter(e => e.event_type === 'search').slice(0, 5).map(e => e.query)
      }
    });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
});

// GET /api/events/upgrade-stats — See how many people clicked upgrade
router.get('/upgrade-stats', async (req, res) => {
  try {
    // Simple admin check — only you can see this
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { createClient } = require('@supabase/supabase-js');
    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const { data } = await sb
      .from('user_events')
      .select('user_id, created_at, metadata')
      .eq('event_type', 'upgrade_click')
      .order('created_at', { ascending: false });

    return res.json({
      success: true,
      total_upgrade_clicks: data?.length || 0,
      unique_users: new Set(data?.map(e => e.user_id)).size,
      recent: data?.slice(0, 10) || [],
      message: data?.length >= 10
        ? '🔥 HIGH DEMAND — Add payment NOW!'
        : data?.length >= 5
        ? '📈 Growing interest — prepare payment'
        : '⏳ Early stage — monitor'
    });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;
