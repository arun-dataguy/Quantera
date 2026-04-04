# Quantera — Deployment Guide

**Stack:** FastAPI (Railway) + React/Vite (Vercel) + PostgreSQL (Railway) + Stripe + Google OAuth

---

## Prerequisites

- [ ] GitHub repo pushed and up to date
- [ ] Railway account — [railway.app](https://railway.app)
- [ ] Vercel account — [vercel.com](https://vercel.com)
- [ ] Stripe account with production keys ready
- [ ] Google Cloud Console project with OAuth credentials

---

## Step 1 — Stripe Production Setup

Before deploying, switch Stripe from test mode to live mode.

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) → toggle **Test mode OFF**
2. **API Keys** → copy `sk_live_...` (Secret Key) and `pk_live_...` (Publishable Key)
3. **Products** → recreate your two products in live mode:
   - Pro — $9.99/month → copy the new `price_live_...` ID
   - Premium — $29.99/month → copy the new `price_live_...` ID
4. **Webhooks** → Add endpoint (do this after Railway deploys):
   - URL: `https://<your-railway-domain>/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the `whsec_...` signing secret

---

## Step 2 — Google OAuth Production Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → your project
2. **APIs & Services** → **Credentials** → your OAuth 2.0 Client
3. Under **Authorized redirect URIs**, add:
   ```
   https://<your-railway-domain>/api/auth/google/callback
   ```
4. Save. Keep your `Client ID` and `Client Secret` ready.

---

## Step 3 — Deploy Backend to Railway

### 3a. Create the Railway project

1. Go to [railway.app](https://railway.app) → **New Project**
2. **Deploy from GitHub repo** → select `Quantera`
3. When prompted for root directory, set it to **`backend`**
4. Railway will detect Python via nixpacks and use `railway.toml` automatically

### 3b. Add PostgreSQL

1. In your Railway project → **+ New** → **Database** → **PostgreSQL**
2. Click the PostgreSQL service → **Variables** tab → copy `DATABASE_URL`
3. It will look like: `postgresql://postgres:password@containers-us-west-xxx.railway.app:6543/railway`
4. **Change the scheme** from `postgresql://` to `postgresql+asyncpg://` for async compatibility

### 3c. Set environment variables

In your Railway backend service → **Variables** tab, add all of the following:

```
APP_ENV=production
SECRET_KEY=<generate: python -c "import secrets; print(secrets.token_hex(32))">
DATABASE_URL=postgresql+asyncpg://<rest of the Railway postgres URL>

FRONTEND_URL=https://<your-vercel-domain>.vercel.app

GOOGLE_CLIENT_ID=<from Google Console>
GOOGLE_CLIENT_SECRET=<from Google Console>
GOOGLE_REDIRECT_URI=https://<your-railway-domain>/api/auth/google/callback

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_live_...
STRIPE_PREMIUM_PRICE_ID=price_live_...

EMAIL_FROM=noreply@quantera.io
```

> **Note:** `FRONTEND_URL` controls CORS. Set it to your Vercel URL once you know it. You can redeploy Railway after Vercel is live.

### 3d. Deploy

1. Railway auto-deploys on push. Trigger manually via **Deploy** if needed.
2. Once deployed, copy your Railway domain (e.g. `quantera-backend-production.up.railway.app`)
3. Verify the backend is live:
   ```
   curl https://<your-railway-domain>/health
   # Expected: {"status":"ok","service":"quantera"}
   ```

---

## Step 4 — Deploy Frontend to Vercel

### 4a. Create the Vercel project

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import from GitHub → select `Quantera`
3. Set **Root Directory** to `frontend`
4. Vercel auto-detects Vite:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### 4b. Set environment variables

In Vercel project → **Settings** → **Environment Variables**, add:

```
VITE_API_URL=https://<your-railway-domain>/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_NEWS_API_KEY=ac418135e878478494b847ea5e9bf2b5
```

Set all three variables for **Production**, **Preview**, and **Development** environments.

### 4c. Deploy

1. Click **Deploy**
2. Once live, copy your Vercel domain (e.g. `quantera.vercel.app`)

---

## Step 5 — Post-deployment wiring

### Update Railway with the Vercel URL

1. Go back to Railway → **Variables**
2. Update `FRONTEND_URL` to your exact Vercel URL: `https://quantera.vercel.app`
3. Also update `GOOGLE_REDIRECT_URI` if it changed
4. Railway will auto-redeploy

### Add Stripe webhook

1. Go to Stripe Dashboard → **Webhooks** → **Add endpoint**
2. URL: `https://<your-railway-domain>/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the `whsec_...` secret → update `STRIPE_WEBHOOK_SECRET` in Railway

### Update Google OAuth redirect URI

1. Google Console → Credentials → your OAuth client
2. Add `https://<your-railway-domain>/api/auth/google/callback` to authorized redirect URIs
3. Save

---

## Step 6 — Smoke Tests

Run these checks after everything is live:

- [ ] `GET https://<railway-domain>/health` returns `{"status":"ok"}`
- [ ] Landing page loads at your Vercel URL
- [ ] Sign up with email works
- [ ] Sign in with Google works
- [ ] Dashboard loads with signals
- [ ] Intelligence Feed loads news articles
- [ ] Pricing page shows Pro and Premium plans
- [ ] Clicking "Upgrade" redirects to Stripe checkout
- [ ] Complete a test purchase with Stripe test card `4242 4242 4242 4242`
- [ ] Plan upgrades correctly after checkout
- [ ] Page refresh works on all routes (React Router — handled by `vercel.json`)

---

## Environment Variables Reference

### Backend (Railway)

| Variable | Description | Example |
|----------|-------------|---------|
| `APP_ENV` | Environment mode | `production` |
| `SECRET_KEY` | JWT signing secret | 64-char hex string |
| `DATABASE_URL` | PostgreSQL connection | `postgresql+asyncpg://...` |
| `FRONTEND_URL` | Vercel URL for CORS | `https://quantera.vercel.app` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | `GOCSPX-...` |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL | `https://<railway>/api/auth/google/callback` |
| `STRIPE_SECRET_KEY` | Stripe live secret | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing | `whsec_...` |
| `STRIPE_PRO_PRICE_ID` | Pro plan price ID | `price_live_...` |
| `STRIPE_PREMIUM_PRICE_ID` | Premium plan price ID | `price_live_...` |

### Frontend (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Railway backend URL | `https://<railway>/api` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe live public key | `pk_live_...` |
| `VITE_NEWS_API_KEY` | NewsAPI key | `ac418135e878...` |

---

## Troubleshooting

**CORS errors in browser**
- Verify `FRONTEND_URL` in Railway matches the exact Vercel domain (no trailing slash)
- Redeploy Railway after updating the variable

**Database connection errors**
- Ensure `DATABASE_URL` uses `postgresql+asyncpg://` not `postgresql://`
- Check Railway PostgreSQL service is running

**Google OAuth redirect mismatch**
- The redirect URI in Google Console must exactly match `GOOGLE_REDIRECT_URI` in Railway

**Stripe webhook 400 errors**
- Verify `STRIPE_WEBHOOK_SECRET` matches the secret from the Stripe webhook dashboard
- Ensure the webhook endpoint URL is `https://<railway-domain>/api/stripe/webhook`

**React routes return 404 on refresh**
- Confirm `frontend/vercel.json` is committed and deployed (rewrites all paths to `index.html`)

**Build fails on Vercel**
- Check Node version — Vercel defaults to Node 18, Vite 8 requires Node 18+

---

## Local Development (reference)

```bash
# Backend
cd backend
conda activate quantera
uvicorn app.main:app --reload --port 8003

# Frontend
cd frontend
npm run dev   # runs on port 5173
```
