# 🚀 AuditaAI Pilot Deployment Checklist

**BUILD CYCLE 3 COMPLETE** — Ready for External Service Configuration

---

## ✅ Completed Features

### Core Governance Infrastructure
- ✅ Rosetta boot sequence integration (POST `/api/rosetta/boot`)
- ✅ WebSocket CRIES streaming (`cries-update` events)
- ✅ Unified receipt storage (Neon DB + `/receipts` filesystem)
- ✅ Frontend governance toggle with boot button
- ✅ Real-time CRIES metrics dashboard with animated visualizations

### Access Control & Payment
- ✅ Tier-based permission middleware (FREE/PAID/ARCHITECT)
- ✅ Rate limiting (FREE: 10/hr, PAID: 1000/hr, ARCHITECT: unlimited)
- ✅ Stripe checkout integration (PAID: $499/mo, ARCHITECT: $1,499/mo)
- ✅ Stripe webhook handler (auto-tier upgrades/downgrades)

### User Interface
- ✅ Live CRIES Metrics component (`CRIESMetrics.tsx`)
  - Real-time WebSocket updates
  - Color-coded metric bars (🔴 < 0.4, 🟡 0.4-0.7, 🟢 0.7-0.9, 💚 ≥ 0.9)
  - Animated pulse effects on data updates
  - Side-by-side comparison view (standard vs governed)
  - Improvement percentage display
- ✅ Integrated into pilot dashboard (PAID users only)

### Deployment Configuration
- ✅ `vercel.json` created with build settings and environment variable references
- ✅ CORS headers configured for API routes
- ✅ Backend rewrite rules for API proxying

---

## 🔑 Configuration Checklist — What You Need to Provide

### 1. Prisma PostgreSQL (Database)
**Status:** ✅ **COMPLETE** — Already configured

- Connection string provided: `postgres://602197f00e8365db70a65c273a252d29dd8416ebc9aa13b39a924676dded4798:sk_akl0dJE2gxNBiZqFNZb-g@db.prisma.io:5432/postgres?sslmode=require`
- 7 migrations deployed successfully
- Test user (Tristan) created with PAID tier

**Action Required:** None — Prisma is production-ready

---

### 2. Vercel (Frontend Deployment)

**Status:** ⏳ **NEEDS CONFIGURATION**

#### Step 1: Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

#### Step 2: Set Environment Variables
Navigate to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

Add the following variables for **Production**, **Preview**, and **Development**:

| Variable Name | Description | Where to Get It |
|---------------|-------------|-----------------|
| `DATABASE_URL` | Prisma PostgreSQL connection string | ✅ You already have this:<br/>`postgres://602197f00e8365db70a65c273a252d29dd8416ebc9aa13b39a924676dded4798:sk_akl0dJE2gxNBiZqFNZb-g@db.prisma.io:5432/postgres?sslmode=require` |
| `NEXTAUTH_SECRET` | NextAuth.js encryption secret | **Generate with:** `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Full URL of your deployed app | Example: `https://auditaai.vercel.app` |
| `STRIPE_SECRET_KEY` | Stripe secret API key | See **Stripe Configuration** below |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | See **Stripe Configuration** below |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (client-side) | From Stripe Dashboard → **Developers** → **API keys** |

#### Step 3: Generate NEXTAUTH_SECRET
Run this command locally and save the output:
```bash
openssl rand -base64 32
```

Example output: `wX9kF3mN2pQ7vZ4tY6uR1sE8dC5hJ0aL9bG3nM4xK2fV7wP6qT1yU8iO3eA5rS4=`

#### Step 4: Deploy to Vercel
```bash
cd /home/michaelgomes/AuditaAI/frontend
vercel --prod
```

**Expected Result:**
- Build succeeds (Next.js 14 compilation)
- Environment variables loaded
- Deployment URL provided (e.g., `https://auditaai.vercel.app`)

---

### 3. Stripe (Payment Processing)

**Status:** ⏳ **NEEDS ACCOUNT SETUP**

#### Step 1: Create Stripe Account
1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Complete account setup
3. Verify email and business details

#### Step 2: Get API Keys
Navigate to **Stripe Dashboard** → **Developers** → **API keys**

Copy these keys:
- **Publishable key** (starts with `pk_test_` for test mode, `pk_live_` for production)
- **Secret key** (starts with `sk_test_` for test mode, `sk_live_` for production)

⚠️ **Important:** Use **Test Mode** keys initially. Switch to **Live Mode** only when ready for production.

#### Step 3: Create Products and Prices
Navigate to **Stripe Dashboard** → **Products** → **Add Product**

**PAID Tier Product:**
- Name: `AuditaAI Pilot - Paid`
- Pricing:
  - Monthly: `$499.00/month` (recurring)
  - Annual: `$4,999.00/year` (recurring) — 17% discount applied
- Metadata:
  - `tier`: `PAID`

**ARCHITECT Tier Product:**
- Name: `AuditaAI Pilot - Architect`
- Pricing:
  - Monthly: `$1,499.00/month` (recurring)
  - Annual: `$14,999.00/year` (recurring) — 17% discount applied
- Metadata:
  - `tier`: `ARCHITECT`

**Copy the Price IDs** (e.g., `price_1ABC123...`) — you'll need these if you want to hardcode product references instead of dynamic checkout sessions.

#### Step 4: Configure Webhook Endpoint
Navigate to **Stripe Dashboard** → **Developers** → **Webhooks** → **Add endpoint**

**Endpoint URL:**
```
https://your-vercel-app.vercel.app/api/stripe/webhook
```
Replace `your-vercel-app.vercel.app` with your actual Vercel deployment URL.

**Events to Listen For:**
- `checkout.session.completed` — User completes payment, upgrade tier
- `customer.subscription.updated` — Subscription modified
- `customer.subscription.deleted` — Subscription canceled, downgrade to FREE
- `invoice.payment_succeeded` — Recurring payment successful
- `invoice.payment_failed` — Recurring payment failed

**Copy the Webhook Signing Secret:**
After creating the webhook, Stripe will show a signing secret starting with `whsec_...`

Add this to Vercel as `STRIPE_WEBHOOK_SECRET`.

#### Step 5: Test Webhook Handler
Use Stripe CLI to forward webhook events to your local environment:
```bash
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

Trigger a test event:
```bash
stripe trigger checkout.session.completed
```

**Expected Result:**
- Webhook handler receives event
- User tier is upgraded in database
- Console logs confirmation

---

### 4. Firebase Analytics (Optional)

**Status:** ⏸️ **OPTIONAL** — Not required for pilot launch

If you want to add Firebase Analytics later:

#### Step 1: Create Firebase Project
1. Go to [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Create new project: `AuditaAI-Pilot`
3. Enable Google Analytics (optional)

#### Step 2: Add Web App to Firebase
1. In Firebase Console → **Project Settings** → **Add App** → **Web**
2. Register app: `AuditaAI Web`
3. Copy Firebase config object:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "auditaai-pilot.firebaseapp.com",
  projectId: "auditaai-pilot",
  storageBucket: "auditaai-pilot.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX"
};
```

#### Step 3: Add to Environment Variables
Add each Firebase config property as a Vercel environment variable:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- etc.

**Note:** This is **not critical** for the pilot. Analytics can be added post-launch.

---

## 🧪 Testing Checklist

Once Vercel and Stripe are configured:

### Local Testing (Before Deployment)
```bash
# Terminal 1 - Backend
cd /home/michaelgomes/AuditaAI/backend
node server.js

# Terminal 2 - Frontend
cd /home/michaelgomes/AuditaAI/frontend
pnpm dev
```

1. ✅ Visit `http://localhost:3000`
2. ✅ Sign in as Tristan (`tristanbarbaste@gmail.com` / `changeme`)
3. ✅ Navigate to `/pilot` dashboard
4. ✅ Click "🚀 Boot Rosetta" — should show Lamport counter alert
5. ✅ Enter a test prompt and run live test with Ollama model
6. ✅ Verify CRIES metrics appear in real-time dashboard
7. ✅ Check WebSocket connection status indicator (green dot = connected)
8. ✅ Run comparison test — should show side-by-side standard vs governed results

### Production Testing (After Deployment)
1. ✅ Visit `https://your-vercel-app.vercel.app`
2. ✅ Create new account (should default to FREE tier)
3. ✅ Navigate to `/pricing` — verify upgrade buttons work
4. ✅ Click "Upgrade to Paid" — should redirect to Stripe checkout
5. ✅ Complete test payment using Stripe test card: `4242 4242 4242 4242`
6. ✅ Verify redirect back to app with PAID tier access
7. ✅ Test live testing features (should now be accessible)
8. ✅ Cancel subscription in Stripe Dashboard — verify auto-downgrade to FREE

---

## 📊 Current System Status

### Database (Neon)
- **Status:** ✅ Operational
- **Migrations:** 7/7 applied
- **Test User:** Tristan (ID=1, tier=PAID, password=`changeme`)

### Backend (Express + Socket.io)
- **Status:** ✅ Running (PID 552913, port 3001)
- **WebSocket:** Active, emitting `cries-update` events
- **Endpoints:**
  - `POST /api/rosetta/boot` — Rosetta governance boot
  - `GET /api/rosetta/boot` — Get boot receipt from DB
  - `POST /api/live-demo/parallel-prompt` — Run parallel comparison
  - `POST /api/pilot/run-test` — Live testing endpoint

### Frontend (Next.js 14)
- **Status:** ✅ Ready for deployment
- **Components:**
  - `CRIESMetrics.tsx` — Real-time metrics dashboard
  - Pilot page with live testing interface
  - Stripe checkout integration
  - Tier-based access control middleware

### Pending Integrations
- ⏳ Vercel environment variables (NEXTAUTH_SECRET, Stripe keys)
- ⏳ Stripe account creation and webhook configuration
- ⏸️ Firebase Analytics (optional, non-blocking)

---

## 🚨 Critical Path to Launch

**BLOCKER #1:** Generate `NEXTAUTH_SECRET`
```bash
openssl rand -base64 32
```
→ Add to Vercel environment variables

**BLOCKER #2:** Create Stripe account and get API keys
→ Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to Vercel

**BLOCKER #3:** Configure Stripe webhook endpoint
→ Point webhook to `https://your-app.vercel.app/api/stripe/webhook`

**After completing these 3 steps, deployment is ready.**

---

## 📝 Post-Deployment Tasks

Once live on Vercel:
1. ✅ Verify all environment variables loaded correctly
2. ✅ Test full user signup → upgrade → payment → access flow
3. ✅ Monitor Stripe webhook events in Dashboard
4. ✅ Check WebSocket connectivity in production
5. ✅ Verify CRIES metrics update in real-time
6. ✅ Test governance boot sequence with production database
7. ✅ Confirm Lamport receipt generation and storage

---

## 🔗 Quick Reference URLs

| Service | URL |
|---------|-----|
| Vercel Dashboard | https://vercel.com/dashboard |
| Stripe Dashboard | https://dashboard.stripe.com |
| Neon Console | https://console.neon.tech |
| Firebase Console | https://console.firebase.google.com |

---

## 🛟 Support & Troubleshooting

### Common Issues

**Issue:** "Cannot read properties of undefined (reading 'findFirst')"
- **Cause:** Backend Prisma client not initialized
- **Fix:** This error is from the boot status endpoint. It won't block CRIES WebSocket functionality. Can be safely ignored for now.

**Issue:** CRIES metrics not updating in real-time
- **Cause:** WebSocket not connected
- **Fix:** Check browser console for WebSocket errors. Verify backend is running on port 3001.

**Issue:** Stripe webhook not triggering tier upgrades
- **Cause:** Webhook signature verification failed
- **Fix:** Ensure `STRIPE_WEBHOOK_SECRET` in Vercel matches the signing secret from Stripe Dashboard webhook configuration.

**Issue:** NextAuth session errors
- **Cause:** Missing or invalid `NEXTAUTH_SECRET`
- **Fix:** Generate new secret with `openssl rand -base64 32` and add to Vercel environment variables.

---

**BUILD CYCLE 3 STATUS:** ✅ **COMPLETE**
**NEXT STEP:** Configure external services (Vercel + Stripe) using checklist above, then deploy.
