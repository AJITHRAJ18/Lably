# Lably — AI-Powered Lab Report Translator

Lably is a production-ready, privacy-focused platform that helps patients understand their medical lab reports in plain English. Just upload your PDF — Lably explains each biomarker in calm, clear language.

**Key Features:**
- **PDF Upload:** Patients upload lab reports to get instant, AI-generated explanations for each biomarker.
- **Simple Language:** All results are translated for non-specialists—no jargon or alarming language.
- **Payments:** Users can pay per report (₹10, or $5) or subscribe monthly via Stripe (₹200, or $9/mo).
- **Report History:** Personal results saved on Supabase; strict row-level security ensures users only access their own history.
- **Secure:** Sensitive files are processed in-memory and never stored. Security-first backend (Helmet, CORS, JWT, rate limiting).

---

## Stack

| Layer      | Technology                    |
|------------|------------------------------|
| AI Engine  | Gemini                       |
| Backend    | Node.js + Express            |
| Frontend   | React + Vite                 |
| Database   | Supabase (PostgreSQL + Auth) |
| Payments   | Razorpay                     |
| Security   | Helmet, CORS, JWT, RLS       |

---

## Project Structure

```
lably/
├── server/                  # Express API (Node.js)
│   ├── src/
│   │   ├── config/          # App/env config
│   │   ├── middleware/      # Auth, rate limiter, error handler
│   │   ├── routes/          # API endpoints
│   │   └── services/        # Claude, PDF parsing, DB, Stripe
│   ├── package.json
│   └── .env                 # Server env vars (not versioned)
├── client/                  # React (Vite) UI
│   ├── src/
│   │   ├── components/      # Lab upload, results, payment UI
│   │   ├── hooks/           # Custom hooks (e.g. purchase logic)
│   │   └── constants/       # UI constants
│   ├── vite.config.js
│   └── .env                 # Client env vars (not versioned)
├── schema.sql               # Supabase DB schema
└── .env.example             # Template for setup
```

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/AJITHRAJ18/Lably.git
cd Lably
npm run install:all
```

### 2. Setup Environment Variables

- Copy `.env.example` to `server/.env` and `client/.env`
- Fill in keys for Supabase, Stripe, and Anthropic

### 3. Supabase Setup

- Create project at [supabase.com](https://supabase.com)
- Run `schema.sql` in SQL Editor
- Populate `.env` files with your Supabase keys

### 4. Run in Development

```bash
npm run dev
# API runs at: http://localhost:3001
# UI runs at:  http://localhost:5173
```

---

## API Endpoints

| Method | Endpoint                | Auth     | Description                        |
|--------|-------------------------|----------|------------------------------------|
| GET    | `/api/health`           | None     | Health check                       |
| POST   | `/api/translate`        | JWT      | Translate lab report PDF           |
| POST   | `/api/checkout/report`  | JSON     | Start $5 checkout session          |
| POST   | `/api/checkout/subscribe` | JSON   | Start $9/mo subscription           |
---

## Security

- **Helmet:** Sets HTTP security headers
- **CORS:** Only whitelisted origins
- **Rate Limiting:** 10 translations/hour/IP, 20 checkouts/hour
- **JWT Auth:** Every protected route checked for Supabase JWT
- **No PDF Storage:** Files processed in memory, never persisted
- **Row-Level Security:** Users access only their own data

---

## Deployment

### Backend (Render)

```bash
cd server
npm start
```
Set env variables via hosting dashboard.

### Frontend (Render)

```bash
cd client
npm run build
# Deploy the dist/ folder
```
Set `VITE_API_URL` to deployed backend URL.

---

## License

MIT
