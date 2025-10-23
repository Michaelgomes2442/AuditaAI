# 🎯 AuditaAI - AI Governance Platform for Research Labs & Pilots

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-pilot_ready-green.svg)
![Demo](https://img.shields.io/badge/live_demo-available-brightgreen.svg)
![Free Models](https://img.shields.io/badge/free_models-ollama-orange.svg)

**Verifiable AI Governance with Real-Time CRIES Metrics**

[Live Demo](http://localhost:3000/pilot) • [Documentation](./PILOT_DOCS_INDEX.md) • [Quick Start](#-quick-start) • [FREE Models](./FREE_LOCAL_MODELS.md) • [Pilot Program](./PILOT_QUICK_REFERENCE.md)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Quick Start](#-quick-start)
- [🆓 Free Local Models](#-free-local-models-new)
- [Features](#-features)
- [Demo Capabilities](#-demo-capabilities)
- [Architecture](#-architecture)
- [Documentation](#-documentation)
- [Pilot Program](#-pilot-program)
- [Support](#-support)

---

## 🎯 Overview

AuditaAI is a **research station platform** for AI governance that provides:

✅ **Real-time monitoring** of AI model behavior  
✅ **CRIES metrics** (Completeness, Reliability, Integrity, Effectiveness, Security)  
✅ **Cryptographic audit trails** for compliance  
✅ **Multi-model comparison** for research  
✅ **Live demo mode** for presentations  
✅ **🆓 FREE local AI models** via Ollama (no API keys needed!)

Perfect for:
- 🎓 Academic research labs
- 🏢 Corporate AI teams
- 🏛️ Regulatory bodies
- 🛡️ Ethics boards
- 💼 Investor demos (no API costs!)

---

## 🆓 Free Local Models (NEW!)

**Run AuditaAI demos for FREE** - no API keys, no costs!

```bash
# Install Ollama (takes 2 minutes)
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a free model
ollama pull llama3.2:3b

# Start AuditaAI - free models auto-detected!
npm run dev
```

✨ **Benefits:**
- 🆓 **Zero cost** - run unlimited tests
- � **100% private** - data stays local
- ⚡ **Fast** - no network latency
- 🎯 **Perfect for demos** - impress investors without API spend

📖 **[Full Setup Guide →](./FREE_LOCAL_MODELS.md)**

---

## �🚀 Quick Start

### Option 1: Free Local Models (Recommended for Demos)

```bash
# 1. Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3.2:3b

# 2. Install dependencies
npm install

# 3. Start the platform
npm run dev
```

### Option 2: Paid APIs (OpenAI/Anthropic)

```bash
# 1. Configure API keys
cp backend/.env.example backend/.env
# Edit .env and add your OPENAI_API_KEY or ANTHROPIC_API_KEY

# 2. Install and start
npm install
npm run dev
```

### One-Command Demo Launch

```bash
./start-pilot-demo.sh
```

This will:
1. ✅ Install dependencies
2. ✅ Start backend (port 3001)
3. ✅ Start frontend (port 3000)
4. ✅ Open pilot demo at `/pilot`

### Manual Setup

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
pnpm install
pnpm dev
```

**Browser:**
```
http://localhost:3000/pilot
```

---

## ✨ Features

### For Research Labs

#### Real-Time Monitoring
```typescript
{
  "model": "GPT-4 Research Station",
  "cries": {
    "overall": 0.87,
    "completeness": 0.87,
    "reliability": 0.82,
    "integrity": 0.91,
    "effectiveness": 0.85,
    "security": 0.88
  },
  "status": "active",
  "alerts": 0
}
```

#### Governance Testing
- Click "Run Test" to analyze any model
- See immediate CRIES score updates
- Generate audit trail automatically
- Export results in PDF/CSV/JSON

#### Multi-Model Comparison
| Model | Overall | Completeness | Reliability | Status |
|-------|---------|--------------|-------------|--------|
| GPT-4 | 0.87 | 0.87 | 0.82 | 🟢 Active |
| Claude | 0.91 | 0.92 | 0.89 | 🟢 Active |
| Llama | 0.71 | 0.71 | 0.65 | 🟡 Alert |

---

## 🎬 Demo Capabilities

### Live Demo Mode

**What It Does:**
- Updates CRIES scores every 3 seconds
- Simulates real-time model monitoring
- Shows governance alerts in action
- Perfect for Zoom presentations

**How to Use:**
1. Navigate to `/pilot`
2. Click "Start Live Demo"
3. Watch metrics update in real-time
4. Click "Run Test" to show analysis
5. Switch tabs to explore views

### Pre-Configured Models

**1. GPT-4 Research Station**
- High-performance baseline
- CRIES: 0.87 (Good)
- Status: Active ✅

**2. Claude Ethics Lab**
- Ethics-focused configuration
- CRIES: 0.91 (Excellent)
- Status: Active ✅

**3. Llama Compliance Test**
- Demonstrates governance alerts
- CRIES: 0.71 (Needs Review)
- Status: Alert ⚠️

### Interactive Features

✅ Start/Stop Live Demo  
✅ Auto-Refresh Toggle  
✅ Run Governance Tests  
✅ View Alerts & Events  
✅ Compare Models  
✅ Color-Coded Metrics  

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 15 (React framework)
- TypeScript
- TailwindCSS
- Radix UI components

**Backend:**
- Node.js + Express
- Prisma ORM
- PostgreSQL
- WebSocket ready

**Governance Engine:**
- BEN (Blockchain Event Network)
- Python-based verification
- Ed25519 signatures
- Lamport clock ordering

### System Layers

```
┌─────────────────────────────────┐
│   Frontend Dashboard            │  ← User Interface
├─────────────────────────────────┤
│   Pilot Demo API                │  ← Demo Endpoints
├─────────────────────────────────┤
│   CRIES Engine                  │  ← Metrics Calculation
├─────────────────────────────────┤
│   Audit Trail Logger            │  ← Event Recording
├─────────────────────────────────┤
│   BEN Verification              │  ← Blockchain Verification
└─────────────────────────────────┘
```

### API Endpoints

```
GET  /api/pilot/demo-models      # Get demo data
POST /api/pilot/start-demo        # Start live mode
POST /api/pilot/stop-demo         # Stop live mode
POST /api/pilot/run-test          # Run governance test
GET  /api/pilot/stats             # Get statistics
POST /api/pilot/reset-demo        # Reset state
```

---

## 📚 Documentation

### Quick References

| Document | Purpose | Audience |
|----------|---------|----------|
| [PILOT_DEMO_GUIDE.md](./PILOT_DEMO_GUIDE.md) | Live demo instructions | Sales, Demo presenters |
| [PILOT_QUICK_REFERENCE.md](./PILOT_QUICK_REFERENCE.md) | Pilot program details | Partners, Prospects |
| [PILOT_ARCHITECTURE.md](./PILOT_ARCHITECTURE.md) | Technical overview | Engineers, Researchers |
| [MVP_PILOT_REVIEW.md](./MVP_PILOT_REVIEW.md) | Strategic review | Leadership, Investors |
| [PILOT_DOCS_INDEX.md](./PILOT_DOCS_INDEX.md) | Documentation hub | Everyone |

### Learning Paths

**For Demo Presenters:**
1. Read [PILOT_DEMO_GUIDE.md](./PILOT_DEMO_GUIDE.md)
2. Practice demo flow 2-3 times
3. Review common questions

**For Engineers:**
1. Read [PILOT_ARCHITECTURE.md](./PILOT_ARCHITECTURE.md)
2. Explore API endpoints
3. Review component structure

**For Researchers:**
1. Read [PILOT_QUICK_REFERENCE.md](./PILOT_QUICK_REFERENCE.md)
2. Try interactive features
3. Review use case examples

---

## 🤝 Pilot Program

### Three Tiers Available

#### 🔵 Alpha Tier (Academic)
- **Cost:** Free
- **Duration:** 3 months
- **Spots:** 2-3 available
- **Features:** Core monitoring + Support
- **Perfect for:** University research labs

#### 🟣 Beta Tier (Corporate)
- **Cost:** $749/month (50% off)
- **Duration:** 6 months
- **Spots:** 5-10 available
- **Features:** Advanced analytics + Custom policies
- **Perfect for:** Corporate AI teams

#### 🟢 Regulatory Tier (Government)
- **Cost:** Custom
- **Duration:** 6 months
- **Spots:** 2-3 available
- **Features:** Unlimited + On-premise
- **Perfect for:** Standards bodies, Regulators

### How to Apply

1. **View the demo:** Visit `/pilot`
2. **Review docs:** Read pilot quick reference
3. **Apply:** Email pilot@auditaai.com
4. **Schedule:** Intro call within 3-5 days
5. **Onboard:** Begin pilot in Week 1

### What You Get

✅ Free or discounted access  
✅ Direct engineering support  
✅ Weekly check-ins  
✅ Co-authored case study  
✅ Priority features  
✅ Founding partner status  

---

## 🎓 Use Cases

### Academic Research
```
✓ Track model behavior across experiments
✓ Generate audit trails for peer review
✓ Include CRIES reports in publications
✓ Verify reproducibility claims
```

### Corporate Compliance
```
✓ Monitor production models 24/7
✓ Detect governance issues early
✓ Generate quarterly compliance reports
✓ Reduce audit time by 10x
```

### Regulatory Testing
```
✓ Run standardized governance tests
✓ Generate compliance certificates
✓ Maintain cryptographic audit chains
✓ Export for regulatory review
```

### Ethics Boards
```
✓ Real-time ethics monitoring
✓ Alert on boundary violations
✓ Document review decisions
✓ Maintain accountability records
```

---

## 🔧 Development

### Setup

```bash
# Clone repository
git clone https://github.com/auditaai/platform.git
cd platform

# Install dependencies
cd backend && npm install
cd ../frontend && pnpm install

# Setup database
cd frontend
pnpm prisma migrate dev

# Start services
./start-pilot-demo.sh
```

### Project Structure

```
AuditaAI/
├── backend/                  # Node.js backend
│   ├── server.js            # Main server + pilot endpoints
│   └── src/                 # Source files
├── frontend/                # Next.js frontend
│   └── src/
│       ├── app/
│       │   ├── pilot/       # Demo dashboard
│       │   └── pilot-info/  # Landing page
│       └── components/      # UI components
├── ben_governance/          # Python governance engine
├── docs/                    # Documentation
└── *.md                     # Pilot documentation
```

### Testing

```bash
# Frontend tests
cd frontend
pnpm test:e2e

# Backend health check
curl http://localhost:3001/health

# Pilot demo check
curl http://localhost:3001/api/pilot/stats
```

---

## 🐛 Troubleshooting

### Backend Won't Start

```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill existing process
kill -9 $(lsof -t -i:3001)

# Restart
cd backend && npm start
```

### Frontend Won't Load

```bash
# Check if port 3000 is in use
lsof -i :3000

# Clear Next.js cache
cd frontend
rm -rf .next
pnpm dev
```

### Demo Stuck

```bash
# Reset demo state
curl -X POST http://localhost:3001/api/pilot/reset-demo

# Or refresh browser and stop demo
```

---

## 📊 Metrics & Monitoring

### CRIES Score Interpretation

| Score | Color | Status | Action |
|-------|-------|--------|--------|
| 0.9+ | 🟢 Green | Excellent | Monitor |
| 0.7-0.9 | 🟡 Yellow | Good | Watch |
| < 0.7 | 🔴 Red | Needs Review | Intervene |

### Dashboard Views

1. **Models Dashboard** - Individual model monitoring
2. **Alerts & Events** - Governance notifications
3. **Model Comparison** - Side-by-side analysis

---

## 🌐 Deployment

### Vercel Deployment Setup

1. **Connect Repository to Vercel**
   - Import your GitHub repository: `Michaelgomes2442/AuditaAI`
   - Set root directory to: `frontend`
   - Framework preset: `Next.js`

2. **Configure Environment Variables**
   In your Vercel dashboard, go to Project Settings → Environment Variables and add:

   ```bash
   # Database (Required)
   DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

   # NextAuth (Required)
   NEXTAUTH_URL=https://auditaai.vercel.app
   NEXTAUTH_SECRET=your-secure-random-secret-here

   # API Configuration (Required)
   NEXT_PUBLIC_API_URL=https://auditaai.vercel.app/api

   # Stripe Payments (Required for paid features)
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...

   # Email Notifications (Required for notifications)
   RESEND_API_KEY=re_...
   RESEND_FROM_EMAIL=AuditaAI <noreply@auditaai.com>

   # Optional: OpenAI API (for AI features)
   OPENAI_API_KEY=sk-...
   ```

3. **Stripe Webhook Configuration**
   - Create webhook endpoint: `https://auditaai.vercel.app/api/stripe/webhook`
   - Events to listen for: `checkout.session.completed`, `invoice.payment_succeeded`
   - Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

4. **Deploy**
   - Vercel will automatically build and deploy on every push to `main`
   - Monitor deployment in Vercel dashboard

### Local Development
```bash
./start-pilot-demo.sh
```

### Docker (Coming Soon)
```bash
docker-compose up
```

### Production (Enterprise)
Contact: enterprise@auditaai.com

---

## 📞 Support

### Pilot Program
- **Email:** pilot@auditaai.com
- **Application:** [Apply Here](mailto:pilot@auditaai.com)
- **Schedule:** [Book Demo](https://cal.com/auditaai/pilot)

### Technical Support
- **Email:** pilot-support@auditaai.com
- **Docs:** [Documentation Hub](./PILOT_DOCS_INDEX.md)
- **Response Time:** < 4 hours (business hours)

### Community
- **Slack:** auditaai-pilots.slack.com
- **GitHub:** [Issues](https://github.com/auditaai/platform/issues)
- **Office Hours:** Tuesdays 3pm ET

---

## 📅 Roadmap

### Current (v1.0) - October 2025
✅ Live demo mode  
✅ Three pre-configured models  
✅ Real-time CRIES monitoring  
✅ Interactive governance testing  
✅ Multi-view dashboard  

### Next (v1.1) - November 2025
🔜 PDF report export  
🔜 WebSocket real-time updates  
🔜 Historical trend charts  
🔜 Custom policy builder  

### Future (v2.0) - Q1 2026
🔮 Production integrations  
🔮 Multi-tenant support  
🔮 Advanced analytics  
🔮 Mobile app  

---

## 🏆 Recognition

**Founding Pilot Partners:**
- [Your organization could be here]

**Academic Partners:**
- [Your university could be here]

**Regulatory Partners:**
- [Your agency could be here]

---

## 📜 License

Copyright © 2025 AuditaAI

This software is proprietary. Pilot access granted under separate agreement.

For licensing inquiries: licensing@auditaai.com

---

## 🙏 Acknowledgments

Built on the **Rosetta Monolith** architecture - a comprehensive AI governance framework with:
- Tri-Track Integrity Model
- BEN (Blockchain Event Network)
- CRIES governance metrics
- Band-based security layers

---

<div align="center">

**Ready to Get Started?**

[View Live Demo](http://localhost:3000/pilot) • [Apply for Pilot](mailto:pilot@auditaai.com) • [Read Docs](./PILOT_DOCS_INDEX.md)

Made with ❤️ by the AuditaAI Team

</div>
