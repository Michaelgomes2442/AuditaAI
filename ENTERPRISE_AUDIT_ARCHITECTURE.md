# Enterprise Audit Architecture - Per-Employee Lamport Chains

## Critical Understanding

**Every conversation starts at Lamport 0.**

The `baseline_lamport: 68` in Rosetta.html was simply the state of Michael Tobin Gomes' GPT session when creating that document. It is **NOT** a global baseline for the system.

## Enterprise Architecture

### Per-Employee Audit Chains

Each employee's conversation with an LLM creates an independent, immutable audit trail:

```
Employee A + GPT-4 → Session 2025-10-21-09:00 → Lamport Chain: 0, 1, 2, 3, 4...
Employee A + GPT-4 → Session 2025-10-21-14:30 → Lamport Chain: 0, 1, 2, 3... (NEW CHAIN)
Employee B + GPT-4 → Session 2025-10-21-09:15 → Lamport Chain: 0, 1, 2, 3... (NEW CHAIN)
Employee C + Claude → Session 2025-10-21-10:00 → Lamport Chain: 0, 1, 2, 3... (NEW CHAIN)
```

### Why This Matters for Enterprises

1. **Individual Accountability**: Each employee has their own audit chain
2. **Conversation Isolation**: No cross-contamination between sessions
3. **Precise Attribution**: Every action traces back to specific employee + timestamp + model
4. **Legal Compliance**: Complete audit trail per user for regulatory requirements
5. **Forensic Analysis**: Can replay any employee's conversation deterministically

## Conversation ID Structure

```
conv-{modelId}-{timestamp}-{random9chars}
```

**Example Enterprise Scenario**:

```
Company: Acme Corp
Employees: Alice, Bob, Carol

Alice's morning session (GPT-4):
  conv-gpt4-1729497600000-a3f9c2e1b
  Lamport: 0 → 1 → 2 → 3 → 4 → 5
  Receipts: 6 total

Bob's research session (Claude):
  conv-claude3-1729501200000-d4e7b8f2c
  Lamport: 0 → 1 → 2
  Receipts: 3 total

Alice's afternoon session (GPT-4):
  conv-gpt4-1729519800000-e5g8h3i4j
  Lamport: 0 → 1 → 2 → 3
  Receipts: 4 total

Carol's compliance check (GPT-4):
  conv-gpt4-1729523400000-f6h9i4j5k
  Lamport: 0 → 1
  Receipts: 2 total
```

Each starts at **Lamport 0**. Each is completely independent.

## Enterprise Audit Queries

### 1. Audit All Employee Activity

```bash
# List all conversations (all employees, all sessions)
curl http://localhost:3001/api/receipts/conversations

Response:
{
  "conversations": [
    {
      "conversationId": "conv-gpt4-1729497600000-a3f9c2e1b",
      "modelId": "gpt-4",
      "lamport": 5,
      "bootTime": "2025-10-21T09:00:00.000Z",
      "totalEvents": 6,
      "lastUpdated": "2025-10-21T09:15:00.000Z",
      "sigma": 0.7234,
      "omega": 0.88
    },
    {
      "conversationId": "conv-claude3-1729501200000-d4e7b8f2c",
      "modelId": "claude-3",
      "lamport": 2,
      "bootTime": "2025-10-21T10:00:00.000Z",
      "totalEvents": 3,
      "lastUpdated": "2025-10-21T10:05:00.000Z",
      "sigma": 0.6891,
      "omega": 0.85
    }
  ],
  "count": 2
}
```

### 2. Audit Specific Employee

Filter by employee metadata (would be added to conversation state):

```javascript
// Frontend: Filter conversations by employee
const aliceConversations = conversations.filter(c => 
  c.employeeId === "alice@acmecorp.com"
);

// Returns all of Alice's sessions
[
  { conversationId: "conv-gpt4-1729497600000-a3f9c2e1b", lamport: 5, ... },
  { conversationId: "conv-gpt4-1729519800000-e5g8h3i4j", lamport: 3, ... }
]
```

### 3. Export Employee's Full Audit Trail

```bash
# Export Alice's morning session
curl http://localhost:3001/api/receipts/export/conv-gpt4-1729497600000-a3f9c2e1b > alice_morning_audit.json

# Cryptographically sealed container with:
# - All receipts (Lamport 0 → 5)
# - CRIES metrics for each prompt
# - SHA256 hash chain
# - Tamper-proof seal
```

### 4. Verify Employee Activity

```bash
# Import and verify Alice's audit trail
curl -X POST http://localhost:3001/api/receipts/import \
  -H "Content-Type: application/json" \
  -d @alice_morning_audit.json

# System verifies:
# ✓ Container seal (SHA256)
# ✓ Lamport monotonicity (0 → 1 → 2 → 3 → 4 → 5)
# ✓ Hash chain integrity (prev_digest → self_hash)
# ✓ Each receipt's self_hash
```

## Receipt Structure (Per-Employee)

### Conversation State
**Path**: `receipts/state_conv-gpt4-1729497600000-a3f9c2e1b.json`

```json
{
  "conversation_id": "conv-gpt4-1729497600000-a3f9c2e1b",
  "model_id": "gpt-4",
  "employee_id": "alice@acmecorp.com",
  "department": "Research",
  "lamport": 5,
  "prev_hash": "e7c8a1f2b3d4c5e6f7a8b9c0d1e2f3a4...",
  "boot_time": "2025-10-21T09:00:00.000Z",
  "sigma": 0.7234,
  "omega": 0.88,
  "sigmaStar": 0.15,
  "total_events": 6,
  "last_updated": "2025-10-21T09:15:00.000Z"
}
```

### Individual Receipt
**Path**: `receipts/receipt_conv-gpt4-1729497600000-a3f9c2e1b_L3_*.ben`

```json
{
  "receipt_type": "Δ-ANALYSIS",
  "analysis_id": "ANALYSIS-conv-gpt4-1729497600000-a3f9c2e1b-L3-1729497900000",
  "conversation_id": "conv-gpt4-1729497600000-a3f9c2e1b",
  "employee_id": "alice@acmecorp.com",
  "lamport": 3,
  "prev_digest": "4dfb4faec6f3b7008ba8c5861468b0a12299479a7c908782e8dc379fdbe91b61",
  "boot_time": "2025-10-21T09:00:00.000Z",
  "trace_id": "TRACE-1729497900000",
  "tri_actor_role": "Track-A/Analyst",
  "cries": {
    "C": 0.7234,
    "R": 0.6891,
    "I": 0.7456,
    "E": 0.6923,
    "S": 0.7012
  },
  "sigma_window": {
    "σ": 0.7123,
    "σ*": 0.15
  },
  "risk_flags": [],
  "model_id": "gpt-4",
  "prompt_hash": "a3f9c2e1b4d7...",
  "response_length": 1234,
  "digest_verified": false,
  "ts": "2025-10-21T09:05:00.000Z",
  "self_hash": "e7c8a1f2b3d4c5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0"
}
```

## Enterprise Use Cases

### 1. Regulatory Compliance Audit

**Scenario**: Auditor requests all AI usage by Research Department in Q4 2025

```javascript
// Query all conversations
const allConversations = await fetch('/api/receipts/conversations').then(r => r.json());

// Filter by department and date range
const researchQ4 = allConversations.conversations.filter(c => 
  c.department === 'Research' &&
  new Date(c.bootTime) >= new Date('2025-10-01') &&
  new Date(c.bootTime) < new Date('2026-01-01')
);

// Export each conversation
for (const conv of researchQ4) {
  const audit = await fetch(`/api/receipts/export/${conv.conversationId}`).then(r => r.json());
  // Save to compliance archive
  fs.writeFileSync(`compliance/Q4_2025/${conv.employeeId}_${conv.conversationId}.json`, JSON.stringify(audit));
}
```

**Result**: Complete, cryptographically sealed audit trail for every Research employee's AI usage in Q4 2025.

### 2. Security Incident Investigation

**Scenario**: Suspicious activity detected from Bob's account on 2025-10-21

```bash
# Find all Bob's conversations on that date
conversations=$(curl -s http://localhost:3001/api/receipts/conversations | \
  jq '.conversations[] | select(.employeeId == "bob@acmecorp.com" and (.bootTime | startswith("2025-10-21")))')

# Export each conversation for forensic analysis
echo "$conversations" | jq -r '.conversationId' | while read convId; do
  curl -s "http://localhost:3001/api/receipts/export/$convId" > "investigation/bob_${convId}.json"
done

# Verify integrity of each export
for file in investigation/bob_*.json; do
  # Extract container seal and verify
  seal=$(jq -r '.container_seal' "$file")
  calculated=$(jq 'del(.container_seal)' "$file" | sha256sum | cut -d' ' -f1)
  
  if [ "$seal" == "$calculated" ]; then
    echo "✓ $file: VERIFIED"
  else
    echo "✗ $file: TAMPERED"
  fi
done
```

**Result**: All of Bob's LLM interactions on 2025-10-21, with cryptographic proof of authenticity.

### 3. Employee Performance Analytics

**Scenario**: Analyze which employees use AI most effectively (high CRIES scores)

```javascript
const conversations = await fetch('/api/receipts/conversations').then(r => r.json());

// Calculate average CRIES per employee
const employeeMetrics = {};

for (const conv of conversations.conversations) {
  const empId = conv.employeeId;
  if (!employeeMetrics[empId]) {
    employeeMetrics[empId] = { totalSigma: 0, count: 0, sessions: 0 };
  }
  employeeMetrics[empId].totalSigma += conv.sigma;
  employeeMetrics[empId].count += conv.totalEvents;
  employeeMetrics[empId].sessions += 1;
}

// Rank employees by average CRIES
const rankings = Object.entries(employeeMetrics)
  .map(([empId, metrics]) => ({
    employee: empId,
    avgSigma: metrics.totalSigma / metrics.sessions,
    totalPrompts: metrics.count,
    sessions: metrics.sessions
  }))
  .sort((a, b) => b.avgSigma - a.avgSigma);

console.log('Top AI Users by Quality (σ):');
rankings.forEach((emp, idx) => {
  console.log(`${idx + 1}. ${emp.employee}: σ=${emp.avgSigma.toFixed(4)} (${emp.sessions} sessions, ${emp.totalPrompts} prompts)`);
});
```

**Result**:
```
Top AI Users by Quality (σ):
1. alice@acmecorp.com: σ=0.7234 (12 sessions, 67 prompts)
2. carol@acmecorp.com: σ=0.7012 (8 sessions, 43 prompts)
3. bob@acmecorp.com: σ=0.6891 (15 sessions, 89 prompts)
```

### 4. Policy Violation Detection

**Scenario**: Flag conversations with high-risk CRIES scores (σ > 0.15 threshold exceeded)

```javascript
const conversations = await fetch('/api/receipts/conversations').then(r => r.json());

// Find high-risk conversations
const highRisk = conversations.conversations.filter(c => c.sigma > 0.85);

// Export for review
for (const conv of highRisk) {
  const details = await fetch(`/api/receipts/conversation/${conv.conversationId}`).then(r => r.json());
  
  // Check each receipt for risk_flags
  const flaggedReceipts = details.receipts.filter(r => r.risk_flags && r.risk_flags.length > 0);
  
  if (flaggedReceipts.length > 0) {
    console.log(`⚠ High Risk: ${conv.employeeId} - ${conv.conversationId}`);
    console.log(`  Flagged receipts: ${flaggedReceipts.length}`);
    console.log(`  σ: ${conv.sigma.toFixed(4)}`);
  }
}
```

## File Structure (Enterprise)

```
receipts/
├── state_conv-gpt4-1729497600000-a3f9c2e1b.json    # Alice session 1
├── registry_conv-gpt4-1729497600000-a3f9c2e1b.json
├── receipt_conv-gpt4-1729497600000-a3f9c2e1b_L0_*.ben
├── receipt_conv-gpt4-1729497600000-a3f9c2e1b_L1_*.ben
├── receipt_conv-gpt4-1729497600000-a3f9c2e1b_L2_*.ben
├── receipt_conv-gpt4-1729497600000-a3f9c2e1b_L3_*.ben
├── receipt_conv-gpt4-1729497600000-a3f9c2e1b_L4_*.ben
├── receipt_conv-gpt4-1729497600000-a3f9c2e1b_L5_*.ben
│
├── state_conv-claude3-1729501200000-d4e7b8f2c.json  # Bob session 1
├── registry_conv-claude3-1729501200000-d4e7b8f2c.json
├── receipt_conv-claude3-1729501200000-d4e7b8f2c_L0_*.ben
├── receipt_conv-claude3-1729501200000-d4e7b8f2c_L1_*.ben
├── receipt_conv-claude3-1729501200000-d4e7b8f2c_L2_*.ben
│
├── state_conv-gpt4-1729519800000-e5g8h3i4j.json    # Alice session 2
├── registry_conv-gpt4-1729519800000-e5g8h3i4j.json
├── receipt_conv-gpt4-1729519800000-e5g8h3i4j_L0_*.ben
├── receipt_conv-gpt4-1729519800000-e5g8h3i4j_L1_*.ben
├── receipt_conv-gpt4-1729519800000-e5g8h3i4j_L2_*.ben
├── receipt_conv-gpt4-1729519800000-e5g8h3i4j_L3_*.ben
│
└── ... (one set per conversation, all starting at Lamport 0)
```

## Rosetta.html Context

The `baseline_lamport: 68` in `workspace/CORE/Rosetta.html` represents:

- **Michael Tobin Gomes' session state** when creating the Rosetta document
- **Not a system-wide baseline**
- **Not inherited by other users/sessions**
- Simply documentation of "this document was created at my Lamport 68"

When Alice starts a new conversation with GPT-4:
- ✅ Her Lamport starts at 0 (not 68)
- ✅ Her receipts are independent of Michael's session
- ✅ Her audit chain is isolated and tamper-proof

## Enterprise Benefits

### 1. **Legal Defensibility**
- Every employee action has cryptographic proof
- Lamport chains provide total ordering of events
- Cannot retroactively alter audit trail (hash chain breaks)

### 2. **Regulatory Compliance**
- GDPR: Export individual employee data (sealed container)
- SOX: Audit all financial department AI usage
- HIPAA: Track healthcare employee interactions with PHI

### 3. **Incident Response**
- Replay suspicious conversations deterministically
- Identify exact moment of policy violation
- Prove what employee saw vs what they did

### 4. **Performance Management**
- Measure AI effectiveness per employee (CRIES metrics)
- Identify training needs (low σ scores)
- Reward high-quality AI usage (high σ, low risk)

### 5. **Cost Attribution**
- Track API usage per employee
- Bill departments based on actual usage
- Identify inefficient prompt patterns

## Security Properties

### 1. **Conversation Isolation**
- Alice's Lamport 5 ≠ Bob's Lamport 5
- No shared state between employees
- Each chain cryptographically sealed

### 2. **Tamper Evidence**
- Any modification breaks `self_hash`
- Breaks `prev_digest` chain linkage
- Import verification detects tampering

### 3. **Non-Repudiation**
- Employee cannot deny action (hash chain proof)
- Company cannot forge employee action (cryptographic seal)
- Third-party auditor can verify independently

### 4. **Monotonicity**
- Lamport only increments (never resets mid-session)
- Cannot insert older receipts
- Total ordering within each conversation

## API Extensions for Enterprise

### Add Employee Metadata to Conversation

```javascript
// When creating conversation, include employee context
const response = await fetch('/api/live-demo/parallel-prompt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "Analyze Q3 revenue",
    standardModelId: "gpt-4",
    rosettaModelId: "gpt-4-rosetta",
    conversationId: `emp-alice-${Date.now()}`,
    metadata: {
      employeeId: "alice@acmecorp.com",
      department: "Research",
      role: "Data Analyst",
      project: "Q3-Revenue-Analysis"
    }
  })
});
```

Backend stores metadata in conversation state:
```json
{
  "conversation_id": "emp-alice-1729497600000",
  "model_id": "gpt-4",
  "employee_id": "alice@acmecorp.com",
  "department": "Research",
  "role": "Data Analyst",
  "project": "Q3-Revenue-Analysis",
  "lamport": 5,
  "boot_time": "2025-10-21T09:00:00.000Z",
  ...
}
```

### Query by Employee

```bash
GET /api/receipts/conversations?employeeId=alice@acmecorp.com
GET /api/receipts/conversations?department=Research
GET /api/receipts/conversations?project=Q3-Revenue-Analysis
GET /api/receipts/conversations?startDate=2025-10-01&endDate=2025-10-31
```

---

**Status**: ✅ Implemented  
**Architecture**: Conversation-specific Lamport chains (all start at 0)  
**Enterprise Ready**: Per-employee audit trails with cryptographic sealing  
**Compliance**: Regulatory-ready with tamper-proof receipts  

**Last Updated**: 2025-10-21
