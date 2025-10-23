# AuditaAI Architecture for Pilots
## Simplified Technical Overview

> **Note:** This is a simplified version of the full Rosetta Monolith architecture, focusing only on what pilot users need to understand.

---

## 🎯 What You Need to Know

AuditaAI monitors your AI models in real-time and generates **verifiable governance reports**. Think of it as a "flight recorder" for AI systems.

### The Core Concept: Audit Receipts

Every significant event (model query, governance check, alert) generates a **receipt** - a cryptographically signed record that:
- ✅ Can't be altered after creation
- ✅ Links to previous events (forming an audit chain)
- ✅ Contains all necessary context
- ✅ Is verifiable by third parties

---

## 🏗️ Simplified Architecture Stack

### Layer 1: Your AI Models (External)
```
┌─────────────────────────────────┐
│  Your AI Models                 │
│  • OpenAI GPT-4                │
│  • Claude                       │
│  • Local LLMs                   │
│  • Custom models                │
└─────────────────────────────────┘
```

### Layer 2: AuditaAI Research Station (What You Run)
```
┌─────────────────────────────────┐
│  Research Station Dashboard     │  ← Web UI you interact with
├─────────────────────────────────┤
│  CRIES Engine                   │  ← Calculates governance metrics
├─────────────────────────────────┤
│  Audit Trail Logger             │  ← Records all events
├─────────────────────────────────┤
│  Policy Engine                  │  ← Enforces governance rules
├─────────────────────────────────┤
│  Receipt Generator              │  ← Creates verifiable records
└─────────────────────────────────┘
```

### Layer 3: Storage & Verification (Automated)
```
┌─────────────────────────────────┐
│  Audit Database                 │  ← Stores all receipts
├─────────────────────────────────┤
│  Blockchain Event Network (BEN) │  ← Verifies integrity
└─────────────────────────────────┘
```

---

## 📊 How It Works: A Simple Flow

### 1. Model Interaction
```
User → Your AI Model → Response
         ↓
    AuditaAI intercepts
```

### 2. Governance Check
```
AuditaAI:
1. Measures CRIES metrics
2. Checks against policies
3. Detects any issues
```

### 3. Receipt Generation
```
Create audit receipt:
- What happened
- When it happened
- Governance scores
- Any alerts
- Cryptographic signature
```

### 4. Chain Verification
```
Link to previous receipt → Verify integrity → Store
```

### 5. Dashboard Update
```
Update metrics → Show alerts → Generate reports
```

---

## 🎨 Key Components Explained

### CRIES Metrics (The Governance Score)

**CRIES** = Completeness, Reliability, Integrity, Effectiveness, Security

Think of it like a credit score for AI behavior:
- **0.0 - 0.4**: 🔴 Critical issues, intervention needed
- **0.4 - 0.7**: 🟡 Borderline, watch closely
- **0.7 - 0.9**: 🟢 Good governance
- **0.9 - 1.0**: 💚 Excellent, gold standard

**Example:**
```javascript
{
  "cries": {
    "completeness": 0.85,    // Are responses complete?
    "reliability": 0.78,     // Are results consistent?
    "integrity": 0.92,       // Is behavior aligned with policies?
    "effectiveness": 0.81,   // Do responses achieve goals?
    "security": 0.88,        // Are security boundaries maintained?
    "overall": 0.85          // Weighted average
  }
}
```

### Audit Receipts (The Proof)

Each receipt is like a notarized document:

```javascript
{
  "receipt_id": "Δ-AUDIT-2025-10-21-001",
  "timestamp": "2025-10-21T14:32:01Z",
  "model_id": "gpt-4-production",
  "event_type": "model_query",
  "cries_score": 0.85,
  "alerts": [],
  "prev_receipt_hash": "a7f8...",  // Links to previous
  "signature": "ed25519:4f9a..."   // Cryptographic proof
}
```

### Band System (Progressive Capabilities)

AuditaAI uses a "band" system - think of it as security clearance levels:

**Band-0** (Core - Always Active):
- Basic audit logging
- CRIES calculation
- Receipt generation
- Dashboard access

**Band-1** (Advanced - Unlocks after 30 days):
- Custom governance policies
- Predictive analytics
- Multi-model comparison
- Advanced alerting

**Band-Z** (Security - Always Active):
- Cryptographic signing
- Final verification
- Legal attestation

> **For Pilots:** You primarily work with Band-0 and Band-1. The others are for advanced/production use.

---

## 🔌 Integration Methods

### Method 1: SDK Integration (Recommended)

**Python Example:**
```python
from auditaai import ResearchStation

# Initialize
station = ResearchStation(api_key="your_pilot_key")

# Wrap your model
@station.monitor(model_id="my-gpt-4")
def ask_ai(prompt):
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    return response

# Use normally - monitoring happens automatically
answer = ask_ai("What is AI governance?")
```

### Method 2: API Proxy

**Route traffic through AuditaAI:**
```javascript
// Instead of calling OpenAI directly:
// https://api.openai.com/v1/chat/completions

// Call through AuditaAI proxy:
// https://proxy.auditaai.com/v1/openai/chat/completions
```

### Method 3: Webhook Integration

**Get notified of events:**
```javascript
// Your endpoint receives:
POST /your-webhook-url
{
  "event": "governance_alert",
  "model_id": "gpt-4-prod",
  "cries_score": 0.62,
  "details": "Reliability dropped below threshold"
}
```

---

## 📈 Monitoring Dashboard

### Main Dashboard Sections

**1. Overview**
```
┌──────────────────────────────────────┐
│ Active Models: 3                     │
│ Today's Queries: 1,247               │
│ Avg CRIES: 0.84 🟢                   │
│ Active Alerts: 2 🟡                  │
└──────────────────────────────────────┘
```

**2. Real-Time Metrics**
```
CRIES Score Trend (Last 24h)
    1.0 ┤          ╭─╮
    0.9 ┤     ╭────╯ ╰─╮
    0.8 ┤ ────╯        ╰──
    0.7 ┤
       └─────────────────→ Time
```

**3. Alert Panel**
```
⚠️  Model: gpt-4-prod
    Reliability: 0.65 (threshold: 0.70)
    Action: Review required
    [View Details] [Acknowledge]

✓  Model: claude-2
    All metrics nominal
```

**4. Recent Receipts**
```
ID                    | Time    | Model      | CRIES | Status
──────────────────────┼─────────┼────────────┼───────┼────────
Δ-AUDIT-2025-10-...   | 14:32   | gpt-4-prod | 0.85  | ✓
Δ-AUDIT-2025-10-...   | 14:31   | claude-2   | 0.91  | ✓
Δ-AUDIT-2025-10-...   | 14:30   | gpt-4-prod | 0.83  | ✓
```

---

## 🔐 Security & Privacy

### What AuditaAI Collects

**Metadata (Always):**
- ✅ Timestamp
- ✅ Model ID
- ✅ CRIES scores
- ✅ Alert triggers
- ✅ Receipt signatures

**Content (Configurable):**
- ⚙️ Input/output hashes (default: yes)
- ⚙️ Full input/output text (default: no)
- ⚙️ User identifiers (default: anonymized)

### Data Storage

**Local (Your Infrastructure):**
- All audit data
- All receipts
- Dashboard state

**Cloud (Optional):**
- Aggregated metrics only
- No raw model inputs/outputs
- Encrypted in transit and at rest

### Compliance

AuditaAI is designed to support:
- ✅ GDPR (data minimization, right to be forgotten)
- ✅ HIPAA (audit trails, access controls)
- ✅ SOC 2 (security controls)
- ✅ EU AI Act (transparency, governance)

---

## 🚀 Performance Characteristics

### Latency Impact

**Typical overhead per model call:**
```
Without AuditaAI: 850ms
With AuditaAI:    865ms (15ms overhead, ~1.7%)
```

**Breakdown:**
- Receipt generation: 8ms
- CRIES calculation: 5ms
- Database write: 2ms

### Throughput

**Pilot tier capacity:**
```
Queries per second: 100+
Daily records: 1,000 (basic) to 10,000 (professional)
Storage: 10GB (basic) to 100GB (professional)
```

### Scalability

**Production tier (post-pilot):**
```
Queries per second: 10,000+
Daily records: Unlimited
Storage: 1TB+ (configurable)
```

---

## 🛠️ Troubleshooting Guide

### Common Issues

**1. Low CRIES scores**
```
Problem: CRIES overall < 0.70
Diagnosis: Check individual metrics to find root cause
Fix: Review policy thresholds or model configuration
```

**2. Receipt chain breaks**
```
Problem: Integrity verification fails
Diagnosis: Check for system restarts or clock drift
Fix: Contact support for chain repair
```

**3. High latency**
```
Problem: Monitoring adds >50ms overhead
Diagnosis: Check database performance
Fix: Optimize queries or increase resources
```

**4. Missing data**
```
Problem: Expected receipts not appearing
Diagnosis: Check SDK integration and API keys
Fix: Verify configuration and network connectivity
```

---

## 📚 Technical Reference

### Key Technologies

**Frontend:**
- Next.js (React framework)
- TypeScript
- TailwindCSS

**Backend:**
- Node.js
- TypeScript
- Express (WebSocket support)

**Database:**
- PostgreSQL (audit records)
- Prisma ORM

**Blockchain Layer:**
- BEN (Blockchain Event Network)
- Python-based verification
- Ed25519 signatures

### API Versioning

All pilot APIs use version `v1-pilot`:
```
https://api.auditaai.com/v1-pilot/
```

### Rate Limits (Pilot)

```
Authenticated requests: 1000/hour
Analysis jobs: 100/day
Report generation: 50/day
Webhook deliveries: 10000/day
```

---

## 🎓 Learning Path for Pilots

### Week 1: Basics
- [ ] Complete quick start guide
- [ ] Understand CRIES metrics
- [ ] Review sample receipts
- [ ] Explore dashboard

### Week 2: Integration
- [ ] Choose integration method
- [ ] Implement basic monitoring
- [ ] Set up alerts
- [ ] Generate first report

### Week 3: Customization
- [ ] Define custom policies
- [ ] Configure thresholds
- [ ] Set up webhooks
- [ ] Create custom dashboards

### Week 4: Advanced
- [ ] Multi-model comparison
- [ ] Batch analysis
- [ ] API automation
- [ ] Team collaboration

---

## 🆘 Getting Help

### Documentation
- **Quick Start:** `/docs/pilot/QUICK_START.md`
- **API Reference:** `/docs/api/pilot`
- **Examples:** `/examples/pilot`

### Support Channels
- **Email:** pilot-support@auditaai.com (< 4hr response)
- **Slack:** #pilot-support
- **Office Hours:** Tuesdays 3pm ET
- **Emergency:** +1-XXX-XXX-XXXX (pilot hotline)

### Self-Service
- **Status Page:** https://status.auditaai.com
- **FAQ:** `/docs/pilot/FAQ.md`
- **Community:** https://community.auditaai.com

---

## 🔄 System Updates

### Release Cycle

**For Pilots:**
- Weekly feature releases (Tuesdays)
- Daily bug fixes (as needed)
- Monthly major updates

**Notification Methods:**
- Dashboard notification
- Email digest
- Slack announcement
- RSS feed

### Upgrade Process

**Automatic (Cloud Hosted):**
```
No action needed - updates applied seamlessly
Downtime: < 30 seconds
Rollback available if issues occur
```

**Manual (Self-Hosted):**
```bash
# Pull latest pilot image
docker pull auditaai/research-station:pilot-latest

# Restart with new version
docker-compose up -d

# Verify
curl http://localhost:3000/api/health
```

---

## 💡 Best Practices

### 1. Start Small
- Begin with 1-2 models
- Use default policies initially
- Monitor for 1 week before customizing

### 2. Set Realistic Thresholds
- Don't aim for 1.0 CRIES immediately
- Start with 0.70, increase gradually
- Adjust based on your use case

### 3. Review Regularly
- Check dashboard daily
- Review alerts within 24 hours
- Generate weekly summary reports

### 4. Iterate Quickly
- Test policy changes in sandbox
- A/B test governance approaches
- Document what works

### 5. Provide Feedback
- Share issues immediately
- Request features early
- Participate in office hours

---

## 🎯 Success Metrics for Pilots

### Technical Success
✅ Uptime > 99%  
✅ Latency overhead < 50ms  
✅ Zero data loss  
✅ Receipt integrity: 100%  

### Adoption Success
✅ Daily active usage  
✅ Multiple models monitored  
✅ Custom policies deployed  
✅ Team onboarded  

### Value Success
✅ Governance issues detected  
✅ Time saved vs manual auditing  
✅ Compliance reports generated  
✅ ROI demonstrated  

---

*For the full technical architecture (Rosetta Monolith), see `/workspace/CORE/Rosetta.html`*

**Document Version:** 1.0 (Pilot)  
**Last Updated:** October 21, 2025  
**Maintained By:** AuditaAI Engineering Team
