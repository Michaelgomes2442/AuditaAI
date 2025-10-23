# OPERATOR Role - Managed Rosetta Governance

## Overview

The **OPERATOR** role is the default production role for PAID tier users in AuditaAI. It provides full LLM interaction capabilities with transparent, managed Rosetta governance.

## Role Binding

**Automatic Assignment:**
```javascript
if (user.tier === 'PAID') {
  userRole = 'Operator';
  managedGovernance = true;
}
```

All PAID users are automatically bound to OPERATOR role, regardless of their database `role` field.

## Privileges

| Capability | OPERATOR | Notes |
|------------|----------|-------|
| **LLM Interaction** | ✅ Full | Unlimited prompts to all models |
| **Rosetta Governance** | ✅ Managed | Auto-booted in background |
| **Receipt Generation** | ✅ Automatic | All Δ-types generated server-side |
| **Lamport Tracking** | ✅ Auto-increment | Causal ordering maintained |
| **Lab Metrics** | ✅ Real-time | Streamed to lab stations |
| **Boot Visibility** | ❌ Hidden | Transparent to user |
| **Governance Config** | ❌ Read-only | Cannot modify policies |
| **Band Access** | 0-2 | Analysis & Governance bands |

## Architecture

### Managed Governance Flow

```
User submits prompt
    ↓
System checks: user.tier === 'PAID'
    ↓
Auto-assign: role = 'Operator', managedGovernance = true
    ↓
Backend boots Rosetta (if not already booted)
    ↓
  Step 1: Load Rosetta.html + send "boot"
  Step 2: Auto-send "I am [Name], Operator"
  Step 3: LLM emits Δ-BOOT-VERIFY (hidden from user)
    ↓
Add instruction: "Provide governed responses without showing boot metadata"
    ↓
User's actual prompt sent to booted session
    ↓
LLM responds with governed output (no receipts in response)
    ↓
Backend extracts/generates receipts server-side:
  - Δ-ANALYSIS (CRIES metrics)
  - Δ-DIRECTIVE (governance applied)
  - Δ-EXEC (response generated)
  - Δ-STATE (final state)
    ↓
Receipts stored in /receipts/*.ben
Lamport counter incremented
Metrics streamed to lab via WebSocket
    ↓
User sees: Clean response + CRIES scores
```

### Transparent Boot

**What OPERATOR sees:**
```
Input: "Explain 2+2 briefly"

Output:
The sum of 2 + 2 equals 4.

CRIES: C=0.95, R=0.92, I=0.88, E=0.94, S=0.91, Ω=0.92
```

**What happens behind the scenes:**
```
[BOOT SEQUENCE - HIDDEN]
1. Load Rosetta Monolith (2.78 MB)
2. Send "boot" → LLM: "Awaiting handshake…"
3. Send "I am Michael Gomes, Operator"
4. LLM: Δ-BOOT-VERIFY emitted
5. Add managed mode instruction

[ACTUAL PROMPT]
User: "Explain 2+2 briefly"
Assistant: [Governed response without metadata]

[SERVER-SIDE RECEIPTS - AUTO-GENERATED]
- receipt_Δ-ANALYSIS_12345.ben (stored)
- receipt_Δ-DIRECTIVE_12346.ben (stored)
- receipt_Δ-EXEC_12347.ben (stored)
- Lamport: 12345 → 12347
- Metrics → WebSocket → Lab
```

## Receipt Auto-Generation

For every OPERATOR interaction, the system automatically generates:

### 1. Δ-ANALYSIS Receipt
```json
{
  "receipt_type": "Δ-ANALYSIS",
  "lamport": 12345,
  "cries": {
    "C": 0.95,
    "R": 0.92,
    "I": 0.88,
    "E": 0.94,
    "S": 0.91
  },
  "sigma_window": {
    "σ": 0.12,
    "σ*": 0.15
  },
  "tri_actor_role": "Track-A/Analyst",
  "trace_id": "TRI-TRACK-1729614789123",
  "ts": "2025-10-22T15:33:09Z"
}
```

### 2. Δ-DIRECTIVE Receipt
```json
{
  "receipt_type": "Δ-DIRECTIVE",
  "lamport": 12346,
  "bounds": {
    "max_tokens": 800,
    "no_external_calls": true,
    "timeout_s": 60
  },
  "policy_refs": ["Π", "τ", "ZSCAN.v3"],
  "tri_actor_role": "Track-B/Governor",
  "trace_id": "TRI-TRACK-1729614789123",
  "ts": "2025-10-22T15:33:09Z"
}
```

### 3. Δ-EXEC Receipt
```json
{
  "receipt_type": "Δ-SEQ-EXEC",
  "lamport": 12347,
  "status": "done",
  "outputs": {
    "response": "[LLM response text]",
    "tokens": 584
  },
  "tri_actor_role": "Track-C/Executor",
  "trace_id": "TRI-TRACK-1729614789123",
  "ts": "2025-10-22T15:33:10Z"
}
```

All receipts are:
- ✅ SHA-256 hashed
- ✅ Lamport-linked (prev_digest → self_hash chain)
- ✅ Stored in `/receipts/` directory
- ✅ Added to registry.json
- ✅ Streamed to lab stations

## Real-Time Lab Metrics

For OPERATOR users, every interaction streams metrics to lab stations:

**WebSocket Event:**
```json
{
  "event": "operator_metrics",
  "userId": 1,
  "userName": "Michael Gomes",
  "role": "Operator",
  "timestamp": "2025-10-22T15:33:10Z",
  "lamport": 12347,
  "metrics": {
    "cries": {
      "C": 0.95,
      "R": 0.92,
      "I": 0.88,
      "E": 0.94,
      "S": 0.91,
      "Omega": 0.92
    },
    "sigma": 0.12,
    "omega": 0.89,
    "tokens": 584,
    "model": "llama3.2:3b",
    "governance": true
  },
  "receipts": [
    "receipt_Δ-ANALYSIS_12345.ben",
    "receipt_Δ-DIRECTIVE_12346.ben",
    "receipt_Δ-EXEC_12347.ben"
  ]
}
```

Lab stations display:
- Real-time CRIES scores
- Lamport counter progression
- Sigma/Omega governance windows
- Receipt generation rate
- Model performance

## Comparison with Other Roles

| Feature | ARCHITECT | AUDITOR | WITNESS | OPERATOR |
|---------|-----------|---------|---------|----------|
| **Use Case** | System admin | Compliance review | Read-only observe | Production users |
| **Boot Control** | Manual | Manual | Auto | **Auto (Managed)** |
| **Receipts in Response** | ✅ Visible | ✅ Visible | ✅ Visible | **❌ Hidden** |
| **Receipt Storage** | ✅ | ✅ | ✅ | **✅ Auto** |
| **Lab Streaming** | Optional | Optional | ❌ | **✅ Auto** |
| **Governance Visibility** | Full | Full | Limited | **Transparent** |
| **User Experience** | Technical | Technical | Restricted | **Seamless** |

## Implementation Details

### Backend (server.js)

```javascript
// Auto-bind PAID users to OPERATOR
if (user.tier === 'PAID') {
  userRole = 'Operator';
  managedGovernance = true;
  console.log(`💼 PAID tier user automatically assigned OPERATOR role`);
}

// Pass to LLM functions
modelResponse = await callOllamaWithRosetta(prompt, rosettaContext, { 
  model: modelId,
  userName,
  userRole,
  managedGovernance  // ← Enables transparent mode
});
```

### LLM Client (llm-client.js)

```javascript
// For OPERATOR, add instruction to hide boot metadata
let additionalContext = '';
if (managedGovernance) {
  additionalContext = '\n\nNote: You are in managed governance mode for an Operator user. ' +
    'Provide governed responses without showing boot receipts, handshake details, or ' +
    'governance metadata. Focus on delivering high-quality, governed answers.';
}
```

## Benefits for Users

**OPERATOR users get:**

✅ **Improved Response Quality** - Rosetta governance ensures high CRIES scores  
✅ **Automatic Compliance** - All interactions auditable via receipts  
✅ **Seamless Experience** - No governance complexity exposed  
✅ **Full Traceability** - Lamport chain maintains causal ordering  
✅ **Real-Time Insights** - Lab stations show their usage patterns  
✅ **Enterprise-Ready** - Deterministic, auditable, governed

## Future Enhancements

**Planned for OPERATOR role:**

- [ ] **Custom Receipt Filters** - Users choose which Δ-types to generate
- [ ] **Personal Lab Dashboard** - View their own metrics history
- [ ] **Receipt Export** - Download their interaction receipts
- [ ] **Governance Presets** - Choose strictness level (Light/Standard/Strict)
- [ ] **Multi-Model Witness** - Automatic consensus for critical queries
- [ ] **Cost Tracking** - Token usage and cost estimates
- [ ] **Quality Reports** - Weekly CRIES summaries

## Summary

The **OPERATOR** role makes enterprise-grade Rosetta governance accessible to production users by:

1. **Auto-binding PAID tier** to managed governance
2. **Transparent boot** in background (no user interaction needed)
3. **Hidden receipts** in responses (clean UX)
4. **Automatic receipt generation** server-side (full auditability)
5. **Real-time lab streaming** (usage insights)
6. **Lamport chain tracking** (causal ordering)

**Result:** Users get governed, auditable, high-quality LLM interactions without any governance complexity.
