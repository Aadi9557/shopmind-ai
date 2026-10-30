# ShopMind AI

An AI-assisted shopping research application built around product discovery, web search, and personalised product evaluation.

> **Project status:** Portfolio codebase under development. The repository contains a Node.js/Express backend, browser-based frontend, and integrations for Groq, Tavily, and Supabase. A clean installation and end-to-end production deployment have not been independently verified.

## Overview

ShopMind AI is designed to help users research products by combining AI-generated assistance with web search and product-scoring logic. The codebase also includes account, search-history, payment, event, and watchlist routes.

## Technology

- **Backend:** Node.js, Express
- **AI integration:** Groq API
- **Web search:** Tavily API
- **Authentication and data:** Supabase
- **Payments:** Razorpay integration present in the backend
- **Frontend:** HTML, CSS, JavaScript

## Repository structure

```text
shopmind-ai/
├── backend/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── css/
│   ├── js/
│   ├── index.html
│   ├── dashboard.html
│   ├── history.html
│   └── pricing.html
└── README.md
```

## Key code areas

| Area | Purpose |
|---|---|
| Product search | Search endpoint and product discovery workflow |
| AI service | Groq integration |
| Web research | Tavily search integration |
| Scoring and ranking | Product scoring and ranking services |
| User accounts | Authentication-related routes and middleware |
| Search history | Store and retrieve user search history |
| Watchlist | Product watchlist functionality |
| Payments | Payment route integration |

These are code-level capabilities indicated by the repository structure; actual behaviour and production readiness should be tested before describing them as fully operational features.

## Local setup

### 1. Requirements

- Node.js (LTS recommended)
- npm
- API credentials for the services you intend to enable
- A Supabase project for database/authentication features

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Create `backend/.env` locally. Do not commit this file.

Expected configuration includes the service credentials used by the backend, such as:

```env
PORT=3000
GROQ_API_KEY=your_groq_api_key
TAVILY_API_KEY=your_tavily_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

Only configure variables required by the code paths you use. Keep secret keys on the server; never expose service-role or payment secret keys in browser code, screenshots, commits, or public issues.

### 4. Start the server

```bash
npm start
```

The server is configured to use port 3000 by default. Open `http://localhost:3000`.

## API route groups

The Express application mounts these route groups:

- `/api/search`
- `/api/history`
- `/api/auth`
- `/api/payments`
- `/api/events`
- `/api/watchlist`
- `/api/health`

Inspect the route files for the exact request and response contracts.

## Security and deployment checklist

Before deploying publicly:

- Replace wildcard CORS (`origin: '*'`) with an explicit allowlist of trusted frontend origins.
- Confirm every protected route verifies authentication and authorisation server-side.
- Keep Supabase service-role and Razorpay secret keys exclusively on the backend.
- Review Supabase Row Level Security policies, especially insert/update/delete policies.
- Add request validation, rate limiting, secure error handling, and production logging.
- Test payment verification using server-side signature validation.
- Confirm `.env`, credentials, customer data, and generated logs are excluded from Git.

## Current limitations

This repository documents the implementation structure, not a verified hosted product. API availability, third-party quotas, pricing, deployment costs, and service limits change; consult each provider's current documentation.

## Author

**Aadi9557**

---

If you use or extend this project, configure your own service accounts and review each provider's terms and security guidance.
