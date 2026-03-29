// ═══════════════════════════════════════════════════════
//  ShopMind AI — Main Backend Server v1
// ═══════════════════════════════════════════════════════

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ── API ROUTES ──────────────────────────────────────────
app.use('/api/search',    require('./routes/search'));
app.use('/api/history',   require('./routes/history'));
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/payments',  require('./routes/payments'));
app.use('/api/events',    require('./routes/events'));
app.use('/api/watchlist', require('./routes/watchlist'));

// ── HEALTH CHECK ────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({
  status: 'ok', version: '3.0',
  groq:      !!process.env.GROQ_API_KEY,
  tavily:    !!process.env.TAVILY_API_KEY,
  supabase:  !!process.env.SUPABASE_URL,
  razorpay:  !!process.env.RAZORPAY_KEY_ID,
  timestamp: new Date().toISOString()
}));

// ── FRONTEND ROUTES ─────────────────────────────────────
app.get('/dashboard', (req,res) => res.sendFile(path.join(__dirname,'..','frontend','dashboard.html')));
app.get('/history',   (req,res) => res.sendFile(path.join(__dirname,'..','frontend','history.html')));
app.get('/pricing',   (req,res) => res.sendFile(path.join(__dirname,'..','frontend','pricing.html')));
app.get('*',          (req,res) => res.sendFile(path.join(__dirname,'..','frontend','index.html')));

app.listen(PORT, () => {
  console.log('');
  console.log('  ╔════════════════════════════════════════════╗');
  console.log('  ║   🛍️  ShopMind AI v1 — Intelligence Update ║');
  console.log('  ╚════════════════════════════════════════════╝');
  console.log('');
  console.log(`  🌐  URL:       http://localhost:${PORT}`);
  console.log(`  🤖  Groq:      ${process.env.GROQ_API_KEY    ? '✅' : '❌ Missing'}`);
  console.log(`  🔍  Tavily:    ${process.env.TAVILY_API_KEY  ? '✅' : '❌ Missing'}`);
  console.log(`  🗄️   Supabase:  ${process.env.SUPABASE_URL   ? '✅' : '❌ Missing'}`);
  console.log(`  💳  Razorpay:  ${process.env.RAZORPAY_KEY_ID ? '✅' : '⏳ Add when ready'}`);
  console.log('');
  console.log('  🧠  New in v3:');
  console.log('      ⚡ Query caching (memory + DB)');
  console.log('      👤 User intelligence + personalization');
  console.log('      📊 Hybrid ranking engine');
  console.log('      🔔 Price watchlist system');
  console.log('      📈 Behavior tracking');
  console.log('');
});
