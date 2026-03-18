# Lably — Enterprise Lab Results Translator

> AI-powered medical lab report simplification — built for production.

Lably lets patients upload their lab report PDFs and instantly get plain-English translations of every biomarker, powered by **Claude (Anthropic)**. Users can pay-per-report ($5) or subscribe ($9/mo) via **Stripe**, with results and history stored in **Supabase**.

---

## Stack

| Layer | Technology |
|-------|-----------|
| AI Engine | Anthropic Claude |
| Backend | Node.js + Express |
| Frontend | React + Vite |
| Database | Supabase (PostgreSQL + Auth) |
| Payments | Stripe (one-time + subscriptions) |
| Security | Helmet, CORS, Rate Limiting, JWT Auth |

---

## Project Structure

```
lably/
├── server/                  # Express API
│   ├── src/
│   │   ├── config/          # Env validation & app config
│   │   ├── middleware/      # Auth, rate limiter, error handler
│   │   ├── routes/          # API routes
│   │   └── services/        # Claude, PDF, Supabase, Stripe
│   ├── package.json
│   └── .env                 # Server env vars (git-ignored)
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── lab/         # MarkerCard, StatusBadge, etc.
│   │   │   ├── stripe/      # PricingModal, PaywallGate, etc.
│   │   │   └── LabUploader/ # Main upload component
│   │   ├── hooks/           # usePurchase
│   │   └── constants/       # Status colours
│   ├── vite.config.js
│   └── .env                 # Client env vars (git-ignored)
├── schema.sql               # Supabase DB schema
└── .env.example             # Template — copy to server/.env & client/.env
```

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/your-org/lably.git
cd lably
npm run install:all
```

### 2. Set up environment variables

```bash
# Server
cp .env.example server/.env
# Edit server/.env with your keys

# Client
cp .env.example client/.env
# Edit client/.env with your Supabase public keys
```

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `schema.sql`
3. Copy your **Project URL** and **Service Role Key** into `server/.env`
4. Copy your **Project URL** and **Anon Key** into `client/.env`

### 4. Set up Stripe

1. Create an account at [stripe.com](https://stripe.com)
2. Create two products:
   - **Lably Report** — one-time, ₹10.00 → copy Price ID to `STRIPE_PRICE_REPORT`
   - **Lably Monthly** — recurring, ₹200.00/month → copy Price ID to `STRIPE_PRICE_MONTHLY`
3. Set up a webhook at `https://your-domain.com/api/webhook` with events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

### 5. Set up Anthropic

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. Add to `server/.env` as `ANTHROPIC_API_KEY`

### 6. Run in development

```bash
npm run dev
# API: http://localhost:3001
# UI:  http://localhost:5173
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | None | Health check |
| `POST` | `/api/translate` | JWT | Translate a lab report PDF |
| `POST` | `/api/checkout/report` | JSON body | Create $5 checkout session |
| `POST` | `/api/checkout/subscribe` | JSON body | Create $9/mo subscription |
| `POST` | `/api/checkout/portal` | JSON body | Open Stripe billing portal |
| `POST` | `/api/webhook` | Stripe sig | Stripe webhook handler |

---

## Security

- **Helmet** — sets 11 HTTP security headers
- **CORS** — whitelisted origin only
- **Rate limiting** — 10 translate requests/hour per IP, 20 checkout/hour
- **JWT auth** — Supabase JWT verified server-side on every protected route
- **No PDF storage** — files processed in-memory and never persisted
- **Row-level security** — users can only read their own report history

---

## Deployment

### Backend (Railway / Render / Fly.io)

```bash
cd server
npm start
```

Set all environment variables in your hosting dashboard.

### Frontend (Vercel / Netlify)

```bash
cd client
npm run build
# Deploy the dist/ folder
```

Set `VITE_API_URL` to your deployed backend URL.

### Stripe Webhook

After deploying, update the webhook URL in the Stripe dashboard to your production URL.

---

## License

MIT
