# 🏗️ AuditaAI Architecture Flow — BUILD CYCLE 3

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Next.js Frontend (localhost:3000 / Vercel)                             │
│  ┌────────────────────────────────────────────────────────────┐        │
│  │  Pilot Dashboard (/pilot)                                  │        │
│  │  ┌──────────────────────────────────────────────┐          │        │
│  │  │  🚀 Boot Rosetta Button                      │          │        │
│  │  │  ⚙️  Governance Toggle (ON/OFF)              │          │        │
│  │  │  📝 Live Test Prompt Input                   │          │        │
│  │  │  🎯 Model Selection (Ollama/GPT-4/Claude)    │          │        │
│  │  │  ▶️  Run Live Test / ⚖️  Run Comparison      │          │        │
│  │  └──────────────────────────────────────────────┘          │        │
│  │                                                              │        │
│  │  CRIESMetrics Component                                     │        │
│  │  ┌──────────────────────────────────────────────┐          │        │
│  │  │  📡 WebSocket Connection (green dot)         │          │        │
│  │  │                                               │          │        │
│  │  │  Standard Response   │  Governed Response    │          │        │
│  │  │  ─────────────────────────────────────────   │          │        │
│  │  │  🧩 Coherence: 65%   │  🧩 Coherence: 92%   │          │        │
│  │  │  🎯 Relevance: 70%   │  🎯 Relevance: 95%   │          │        │
│  │  │  🔒 Integrity: 58%   │  🔒 Integrity: 88%   │          │        │
│  │  │  ⚖️  Ethics: 62%     │  ⚖️  Ethics: 91%     │          │        │
│  │  │  🛡️  Safety: 68%     │  🛡️  Safety: 94%     │          │        │
│  │  │                                               │          │        │
│  │  │  📊 Improvement: +38% 🟢                     │          │        │
│  │  └──────────────────────────────────────────────┘          │        │
│  └────────────────────────────────────────────────────────────┘        │
│                                                                          │
└────────────────┬─────────────────────────────────────┬───────────────────┘
                 │                                     │
                 │ HTTP API                            │ WebSocket
                 │ (fetch)                             │ (socket.io-client)
                 ▼                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Express Backend (port 3001)                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  HTTP Endpoints                     WebSocket Server                    │
│  ┌─────────────────────────┐        ┌──────────────────────────┐       │
│  │ POST /api/rosetta/boot  │        │ io.on('connection')      │       │
│  │ GET  /api/rosetta/boot  │        │                          │       │
│  │ POST /api/pilot/run-test│───────▶│ io.emit('cries-update')  │       │
│  │ POST /api/live-demo/... │        │   {                      │       │
│  └─────────────────────────┘        │     standard: {...},     │       │
│           │                          │     governed: {...},     │       │
│           │                          │     improvement: 0.38    │       │
│           ▼                          │   }                      │       │
│  ┌─────────────────────────┐        └──────────────────────────┘       │
│  │ bootModelWithRosetta()  │                    │                       │
│  │ computeCRIES()          │                    │                       │
│  │ generateLamportReceipt()│                    │                       │
│  └─────────────────────────┘                    │                       │
│           │                                      │                       │
│           │                                      │                       │
│           ▼                                      ▼                       │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │           Unified Receipt Storage                        │          │
│  │  ┌────────────────────┐   ┌─────────────────────────┐   │          │
│  │  │ Neon PostgreSQL    │   │ Filesystem              │   │          │
│  │  │ BENReceipt table   │   │ /receipts/*.ben         │   │          │
│  │  │ - receipt_type     │   │ receipt_boot_*.ben      │   │          │
│  │  │ - lamport          │   │ receipt_Δ-ANALYSIS_*.ben│   │          │
│  │  │ - trace_id         │   │ registry.json           │   │          │
│  │  │ - status           │   │ state.json              │   │          │
│  │  └────────────────────┘   └─────────────────────────┘   │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                          │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
                               │ Python exec
                               ▼
              ┌─────────────────────────────────┐
              │  BEN Governance (port 8000)     │
              │  /workspace/CORE/rosetta.html   │
              │  ────────────────────────────    │
              │  • Rosetta boot sequence        │
              │  • Tri-Track vΩ3 integrity      │
              │  • Math Canon v0.8              │
              │  • Persona lock (Architect)     │
              │  • Z-SCAN v3                    │
              └─────────────────────────────────┘

```

## Data Flow: Live Test with Governance

```
1. USER ACTION
   User enters prompt: "Explain quantum computing"
   Clicks "Run Comparison"
   
   ↓

2. FRONTEND REQUEST
   POST http://localhost:3001/api/live-demo/parallel-prompt
   {
     prompt: "Explain quantum computing",
     models: ["llama3.1"],
     useGovernance: true,
     userId: 1
   }
   
   ↓

3. BACKEND PARALLEL EXECUTION
   
   ┌─────────────────────────┐       ┌─────────────────────────┐
   │  Standard LLM Call      │       │  Governed LLM Call      │
   │  ─────────────────────  │       │  ─────────────────────  │
   │  Ollama.chat()          │       │  bootModelWithRosetta() │
   │  No governance context  │       │  + Ollama.chat()        │
   │  Raw model output       │       │  With BEN governance    │
   └────────────┬────────────┘       └────────────┬────────────┘
                │                                 │
                ▼                                 ▼
   ┌─────────────────────────┐       ┌─────────────────────────┐
   │  Track-A CRIES Analysis │       │  Track-A CRIES Analysis │
   │  ─────────────────────  │       │  ─────────────────────  │
   │  computeCRIES()         │       │  computeCRIES()         │
   │                         │       │                         │
   │  C: 0.65 🟡             │       │  C: 0.92 💚             │
   │  R: 0.70 🟢             │       │  R: 0.95 💚             │
   │  I: 0.58 🟡             │       │  I: 0.88 🟢             │
   │  E: 0.62 🟡             │       │  E: 0.91 💚             │
   │  S: 0.68 🟡             │       │  S: 0.94 💚             │
   │  Ω: 0.646               │       │  Ω: 0.920               │
   └────────────┬────────────┘       └────────────┬────────────┘
                │                                 │
                └────────────┬────────────────────┘
                             │
                             ▼
                ┌──────────────────────────┐
                │  Lamport Receipt         │
                │  ─────────────────────   │
                │  Type: Δ-ANALYSIS        │
                │  Lamport: 42             │
                │  Trace ID: conv_abc123   │
                │  Status: COMPLETE        │
                │  Band: Band-0            │
                └────────────┬─────────────┘
                             │
                             ▼
                ┌──────────────────────────────────────┐
                │  Dual Storage Write                  │
                │  1. Neon: BENReceipt.create()        │
                │  2. FS: /receipts/receipt_*.ben      │
                └────────────┬─────────────────────────┘
                             │
                             ▼
                ┌──────────────────────────────────────┐
                │  WebSocket Emission                  │
                │  io.emit('cries-update', {           │
                │    standard: {                       │
                │      coherence: 0.65,                │
                │      ...                             │
                │    },                                │
                │    governed: {                       │
                │      coherence: 0.92,                │
                │      ...                             │
                │    },                                │
                │    improvement: 0.42                 │
                │  })                                  │
                └────────────┬─────────────────────────┘
                             │
                             ▼

4. FRONTEND UPDATE
   CRIESMetrics component receives WebSocket event
   
   socket.on('cries-update', (data) => {
     setLatestMetrics(data);  // Trigger re-render
     setAnimatePulse(true);   // Pulse animation
   });
   
   UI Updates:
   • Metric bars animate to new values
   • Color codes update (🔴🟡🟢💚)
   • Improvement percentage displays
   • Timestamp refreshes
   • Connection status: green dot (Live)
   
   ↓

5. USER SEES REAL-TIME RESULTS
   Dashboard shows:
   ┌────────────────────────────────────┐
   │  Real-Time CRIES Analytics         │
   │  ───────────────────────────────   │
   │  Standard      │  Governed          │
   │  Coherence 65% │  Coherence 92% 💚  │
   │  ...           │  ...               │
   │                                     │
   │  📈 Improvement: +42% 🟢            │
   └────────────────────────────────────┘
```

## Access Control Flow

```
USER REQUEST → Middleware (frontend/src/middleware.ts)
                    │
                    ├─ Check session tier
                    │  • FREE (0)
                    │  • PAID (1)
                    │  • ARCHITECT (2)
                    │
                    ├─ Check route against FEATURE_ACCESS
                    │  {
                    │    '/pilot': 1,          // PAID required
                    │    '/pricing': 0,        // FREE allowed
                    │    '/api/stripe/*': 0    // FREE allowed
                    │  }
                    │
                    ├─ IF tier < required:
                    │  └─ Return 403 JSON:
                    │     {
                    │       error: "Upgrade required",
                    │       upgradeUrl: "/pricing"
                    │     }
                    │
                    ├─ ELSE: Apply rate limit
                    │  • FREE: 10 requests/hour
                    │  • PAID: 1000 requests/hour
                    │  • ARCHITECT: Unlimited
                    │
                    └─ IF rate limit exceeded:
                       └─ Return 429 with X-RateLimit-* headers
                       
                       ELSE: Allow request ✅
```

## Payment Flow (Stripe Integration)

```
1. USER CLICKS "Upgrade to Paid"
   ↓
2. Frontend: GET /api/stripe/checkout
   {
     tier: "PAID",
     billingPeriod: "month"  // or "year"
   }
   ↓
3. Backend creates Stripe checkout session
   stripe.checkout.sessions.create({
     mode: 'subscription',
     line_items: [{
       price_data: {
         currency: 'usd',
         unit_amount: 49900,  // $499.00
         recurring: { interval: 'month' }
       }
     }],
     metadata: {
       userId: "1",
       tier: "PAID"
     },
     success_url: "https://app.vercel.app/pricing?success=true",
     cancel_url: "https://app.vercel.app/pricing?canceled=true"
   })
   ↓
4. Redirect user to Stripe checkout page
   User enters payment info (test: 4242 4242 4242 4242)
   ↓
5. Stripe emits webhook event: checkout.session.completed
   ↓
6. Webhook hits: POST /api/stripe/webhook
   {
     type: "checkout.session.completed",
     data: {
       object: {
         metadata: { userId: "1", tier: "PAID" }
       }
     }
   }
   ↓
7. Backend updates user tier in database
   await prisma.user.update({
     where: { id: 1 },
     data: { tier: "PAID" }
   })
   ↓
8. User redirected back to app with PAID access ✅
   • Can now access /pilot dashboard
   • Rate limit increased to 1000/hr
   • Live testing enabled
   • CRIES dashboard visible
```

## Environment Variables Flow

```
LOCAL DEVELOPMENT (.env files)
├── frontend/.env
│   ├── DATABASE_URL=postgres://602197f00e8365db70a65c273a252d29dd8416ebc9aa13b39a924676dded4798:sk_akl0dJE2gxNBiZqFNZb-g@db.prisma.io:5432/postgres?sslmode=require
│   ├── NEXTAUTH_SECRET=wX9kF3mN2pQ7vZ4tY6uR...
│   ├── STRIPE_SECRET_KEY=sk_test_...
│   └── STRIPE_WEBHOOK_SECRET=whsec_...
│
└── backend/.env
    └── DATABASE_URL=postgres://602197f00e8365db70a65c273a252d29dd8416ebc9aa13b39a924676dded4798:sk_akl0dJE2gxNBiZqFNZb-g@db.prisma.io:5432/postgres?sslmode=require

                     ↓
              DEPLOYED ON VERCEL

PRODUCTION (Vercel Environment Variables)
├── DATABASE_URL (from Prisma)
├── NEXTAUTH_SECRET (from openssl rand)
├── NEXTAUTH_URL (auto: https://auditaai.vercel.app)
├── STRIPE_SECRET_KEY (from Stripe Dashboard)
├── STRIPE_WEBHOOK_SECRET (from Stripe webhook config)
└── NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (client-side)
```

---

## Key Integration Points

### 1. WebSocket Connection
- **Frontend:** `socket.io-client` connects to `http://localhost:3001`
- **Backend:** `socket.io` server on Express instance
- **Event:** `cries-update` emitted after each parallel test
- **Data Format:** `{ standard, governed, improvement, timestamp, model }`

### 2. Rosetta Governance Boot
- **Trigger:** User clicks "🚀 Boot Rosetta" button
- **API:** POST `/api/rosetta/boot`
- **Process:** `bootModelWithRosetta()` → generates Δ-BOOTCONFIRM receipt
- **Storage:** Neon DB (`BENReceipt` table) + Filesystem (`/receipts/*.ben`)
- **Response:** Lamport counter, band assignment, trace ID

### 3. CRIES Analysis
- **Input:** LLM response text (standard or governed)
- **Analyzer:** `computeCRIES()` function in Track-A
- **Metrics:** C, R, I, E, S (each 0-1 score)
- **Output:** Overall Omega (Ω) score + individual dimensions
- **Color Coding:**
  - 🔴 < 0.4 (Poor)
  - 🟡 0.4-0.7 (Fair)
  - 🟢 0.7-0.9 (Good)
  - 💚 ≥ 0.9 (Excellent)

### 4. Tier-Based Access
- **Middleware:** `frontend/src/middleware.ts`
- **Tiers:** FREE (0), PAID (1), ARCHITECT (2)
- **Enforcement:** Route-level permission checks
- **Upgrades:** Automatic via Stripe webhook (`checkout.session.completed`)
- **Downgrades:** Automatic via Stripe webhook (`customer.subscription.deleted`)

---

**BUILD CYCLE 3 COMPLETE** ✅
Ready for external service configuration and deployment.
