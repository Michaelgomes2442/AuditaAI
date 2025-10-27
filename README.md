**AuditaAI Core — the local governance runtime for auditable AI.**  
Transforming AI oversight into verifiable computation through deterministic receipts and transparent policy evaluation.

# 🧠 AuditaAI Core  
**Verifiable Governance Runtime for AI Systems**

---

### **Purpose**
AuditaAI Core provides a **local-first backend** for evaluating, auditing, and verifying large-language-model (LLM) behavior.  
It turns raw model interactions into **deterministic receipts** and **verifiable governance metrics** — the foundation of accountable AI.

---

### **What It Is**
A lightweight **governance runtime**, not a research lab or full OS.  
It exposes a simple API that:

1. Accepts prompts or model outputs  
2. Applies policy and evaluation logic (CRIES metrics, rule checks, etc.)  
3. Produces a **Δ-Receipt** — a hash-chained, timestamped record proving what happened  

Everything runs locally or inside a container; no cloud dependency required.

---

### **Core Features**

| Capability | Description |
|-------------|-------------|
| 🧾 **Δ-Receipts** | Lamport-ordered receipts linking every evaluation with verifiable hashes |
| ⚖️ **Policy Engine** | JSON-based rules (`block`, `redact`, `route`, `escalate`) |
| 📊 **CRIES Metrics** | Coherence · Reliability · Integrity · Effectiveness · Security |
| 🧩 **LLM Comparison** | Run two models side-by-side and view governance deltas |
| 🪶 **Deterministic Logging** | Every transaction exportable as signed NDJSON receipts |
| 🔌 **REST API** | `/analyze`, `/compare`, `/receipts`, `/health` endpoints |
| 🧰 **Local-First** | Works offline with Neon or Dockerized Postgres |
| 🧱 **Framework-Ready** | Integrates easily with Next.js dashboards or enterprise compliance tools |

---

### **Quick Start**

```bash
# 1. Clone and enter the core folder
git clone https://github.com/Michaelgomes2442/AuditaAI.git
cd AuditaAI/backend

# 2. Install dependencies
pnpm install

# 3. Run migrations and start the server
pnpm prisma migrate dev
pnpm dev

# 4. Verify
curl http://localhost:3001/api/health
```
