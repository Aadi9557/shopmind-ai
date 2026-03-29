# 🛍️ ShopMind AI v2 — Professional Edition

India's Elite AI Shopping Agent | Groq + Tavily + Supabase

---

## 📁 Folder Structure

```
shopmind-ai/
├── backend/
│   ├── server.js              ← Main server entry point
│   ├── package.json           ← Dependencies
│   ├── .env.example           ← Environment template
│   ├── middleware/
│   │   └── auth.js            ← JWT auth verification
│   ├── routes/
│   │   ├── search.js          ← Product search endpoint
│   │   ├── history.js         ← Chat history endpoints
│   │   └── auth.js            ← User profile endpoint
│   └── services/
│       ├── tavily.js          ← Web search service
│       ├── groq.js            ← AI analysis service
│       └── scoring.js         ← Product scoring logic
├── frontend/
│   ├── index.html             ← Login / Signup page
│   ├── dashboard.html         ← Main search page
│   ├── history.html           ← Search history page
│   ├── css/
│   │   └── style.css          ← Complete design system
│   └── js/
│       ├── auth.js            ← Supabase auth functions
│       ├── search.js          ← Search + render functions
│       └── history.js         ← History functions
└── README.md
```

---

## 🚀 Setup Guide

### Step 1 — Get Your Free API Keys

**Groq (Free AI):**
1. Go to console.groq.com
2. Sign up free
3. Click API Keys → Create Key
4. Copy key (starts with gsk_...)

**Tavily (Free Web Search):**
1. Go to app.tavily.com
2. Sign up free
3. Copy your API key from dashboard (starts with tvly-...)

**Supabase (Free Database):**
1. Go to supabase.com
2. Create new project
3. Go to Settings → API
4. Copy: Project URL, anon key, service_role key

---

### Step 2 — Setup Database

In Supabase → SQL Editor → New Query, paste and run:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  full_name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT,
  query TEXT,
  response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "chats_select" ON chats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "chats_insert" ON chats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chats_delete" ON chats FOR DELETE USING (auth.uid() = user_id);
```

---

### Step 3 — Configure Environment

```bash
cd backend
cp .env.example .env
```

Open `.env` and fill in all values:
```
GROQ_API_KEY=gsk_xxxxx
TAVILY_API_KEY=tvly-xxxxx
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
PORT=3000
```

---

### Step 4 — Add Supabase Keys to Frontend

Open `frontend/js/auth.js` and replace:
```javascript
const SUPABASE_URL      = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

---

### Step 5 — Install & Run

```bash
cd backend
npm install
npm start
```

Open: http://localhost:3000

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/search | Search products |
| GET | /api/history | Get user history |
| GET | /api/history/:id | Get single chat |
| DELETE | /api/history | Clear all history |
| DELETE | /api/history/:id | Delete single chat |
| GET | /api/auth/me | Get user profile |
| GET | /api/health | Health check |

---

## 🌐 Pages

| URL | Page |
|-----|------|
| / | Login / Signup |
| /dashboard | Main Search App |
| /history | Search History |

---

## 💰 Cost

| Service | Free Tier |
|---------|-----------|
| Groq AI | 14,400 requests/day |
| Tavily | 1,000 searches/month |
| Supabase | 500MB + 50K users |
| Hosting | Free on Render/Vercel |

**Total: ₹0 to start** ✅
