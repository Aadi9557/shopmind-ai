// ─────────────────────────────────────────────────────
//  Route: Payments — Razorpay + Plan Management
//  NOTE: Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET
//        to .env when you get Razorpay account
// ─────────────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const { requireAuth, supabase } = require('../middleware/auth');

// ── GET USER PLAN ────────────────────────────────────
router.get('/plan', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // Default free plan if no plan found
    const plan = data || {
      user_id:      req.user.id,
      plan:         'free',
      searches_today: 0,
      last_reset:   new Date().toDateString(),
      pro_expires:  null
    };

    // Check if pro plan expired
    if (plan.plan === 'pro' && plan.pro_expires) {
      const expired = new Date(plan.pro_expires) < new Date();
      if (expired) {
        plan.plan = 'free';
        await supabase.from('user_plans')
          .update({ plan: 'free', pro_expires: null })
          .eq('user_id', req.user.id);
      }
    }

    // Reset daily counter if new day
    const today = new Date().toDateString();
    if (plan.last_reset !== today) {
      plan.searches_today = 0;
      plan.last_reset = today;
      await supabase.from('user_plans')
        .upsert({ ...plan, searches_today: 0, last_reset: today });
    }

    const FREE_LIMIT = 10;
    const searches_left = plan.plan === 'pro'
      ? 999
      : Math.max(0, FREE_LIMIT - (plan.searches_today || 0));

    return res.json({
      success: true,
      plan:          plan.plan,
      searches_today: plan.searches_today || 0,
      searches_left,
      free_limit:    FREE_LIMIT,
      pro_expires:   plan.pro_expires,
      is_pro:        plan.plan === 'pro'
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── CREATE RAZORPAY ORDER ────────────────────────────
router.post('/create-order', requireAuth, async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.json({
        success: false,
        message: 'Payment system coming soon!',
        razorpay_configured: false
      });
    }

    const Razorpay = require('razorpay');
    const rzp = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const order = await rzp.orders.create({
      amount:   9900, // ₹99 in paise
      currency: 'INR',
      receipt:  `shopmind_${Date.now()}`
    });

    return res.json({
      success:             true,
      order,
      key_id:              process.env.RAZORPAY_KEY_ID,
      razorpay_configured: true
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── VERIFY PAYMENT & ACTIVATE PRO ───────────────────
router.post('/verify', requireAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify Razorpay signature
    const crypto = require('crypto');
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign).digest('hex');
    if (expectedSign !== razorpay_signature) throw new Error('Invalid payment signature');

    // Activate Pro for 30 days
    const pro_expires = new Date();
    pro_expires.setDate(pro_expires.getDate() + 30);

    await supabase.from('user_plans').upsert({
      user_id:    req.user.id,
      plan:       'pro',
      pro_expires: pro_expires.toISOString(),
      searches_today: 0,
      last_reset: new Date().toDateString(),
      payment_id: razorpay_payment_id || 'manual'
    });

    return res.json({ success: true, message: 'Pro plan activated!' });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── MANUAL ACTIVATE PRO (for testing) ───────────────
router.post('/activate-test', requireAuth, async (req, res) => {
  try {
    const pro_expires = new Date();
    pro_expires.setDate(pro_expires.getDate() + 30);

    await supabase.from('user_plans').upsert({
      user_id:    req.user.id,
      plan:       'pro',
      pro_expires: pro_expires.toISOString(),
      searches_today: 0,
      last_reset: new Date().toDateString(),
      payment_id: 'test_activation'
    });

    return res.json({ success: true, message: 'Pro plan activated for testing!' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
