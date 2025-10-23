# Conversation-Specific Lamport Receipt Chains

## Critical Understanding

**Each conversation instance has its own independent Lamport chain starting from 0.**

This means:
- Different users prompting GPT-4 = **different chains**
- Same user, different sessions with GPT-4 = **different chains**
- User A's GPT-4 conversation vs User B's GPT-4 conversation = **completely independent chains**

The Lamport counter is **NOT** shared across:
- ❌ All instances of a model (e.g., "all GPT-4 conversations")
- ❌ All conversations system-wide
- ❌ All users

The Lamport counter **IS** unique to:
- ✅ One specific user's conversation with one specific model instance
- ✅ Each real-time LLM analysis and response session
- ✅ Each conversation ID (uniquely identifies user + model + session)

## Architecture

### Conversation ID Structure
```
conv-{modelId}-{timestamp}-{random9chars}
```

Examples:
- `conv-gpt4-1729512345678-a3f9c2e1b`
- `conv-claude3-1729512345789-d4e7b8f2c`

### Per-Conversation Files

For conversation ID: `conv-gpt4-1729512345678-a3f9c2e1b`

```
receipts/
├── state_conv-gpt4-1729512345678-a3f9c2e1b.json          # Conversation state
├── registry_conv-gpt4-1729512345678-a3f9c2e1b.json       # Receipt registry
├── receipt_conv-gpt4-1729512345678-a3f9c2e1b_L1_*.ben    # Lamport 1 receipt
├── receipt_conv-gpt4-1729512345678-a3f9c2e1b_L2_*.ben    # Lamport 2 receipt
├── receipt_conv-gpt4-1729512345678-a3f9c2e1b_L3_*.ben    # Lamport 3 receipt
└── ...
```

### Conversation State File
**Path**: `receipts/state_{conversationId}.json`

```json
{
  "conversation_id": "conv-gpt4-1729512345678-a3f9c2e1b",
  "model_id": "gpt-4",
  "lamport": 5,
  "prev_hash": "e7c8a1f2b3d4c5e6f7a8b9c0d1e2f3a4...",
  "boot_time": "2025-10-21T12:00:00.000Z",
  "sigma": 0.7234,
  "omega": 0.88,
  "sigmaStar": 0.15,
  "total_events": 5,
  "last_updated": "2025-10-21T12:05:00.000Z"
}
```

### Receipt Structure
**Path**: `receipts/receipt_{conversationId}_L{lamport}_{timestamp}.ben`

```json
{
  "receipt_type": "Δ-ANALYSIS",
  "analysis_id": "ANALYSIS-conv-gpt4-1729512345678-a3f9c2e1b-L3-1729512456789",
  "conversation_id": "conv-gpt4-1729512345678-a3f9c2e1b",
  "lamport": 3,
  "prev_digest": "hash_from_lamport_2_receipt",
  "boot_time": "2025-10-21T12:00:00.000Z",
  "trace_id": "TRACE-1729512456789",
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
  "ts": "2025-10-21T12:04:16.789Z",
  "self_hash": "e7c8a1f2b3d4c5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0"
}
```

## API Endpoints

### 1. List All Conversations
**GET** `/api/receipts/conversations`

Lists all conversation instances with receipts.

**Response**:
```json
{
  "conversations": [
    {
      "conversationId": "conv-gpt4-1729512345678-a3f9c2e1b",
      "modelId": "gpt-4",
      "lamport": 5,
      "bootTime": "2025-10-21T12:00:00.000Z",
      "totalEvents": 5,
      "lastUpdated": "2025-10-21T12:05:00.000Z",
      "sigma": 0.7234,
      "omega": 0.88
    },
    {
      "conversationId": "conv-claude3-1729512345789-d4e7b8f2c",
      "modelId": "claude-3",
      "lamport": 3,
      "bootTime": "2025-10-21T12:10:00.000Z",
      "totalEvents": 3,
      "lastUpdated": "2025-10-21T12:12:00.000Z",
      "sigma": 0.6891,
      "omega": 0.85
    }
  ],
  "count": 2
}
```

### 2. Get Conversation Receipts
**GET** `/api/receipts/conversation/:conversationId`

Retrieves all receipts for a specific conversation instance.

**Example**: `GET /api/receipts/conversation/conv-gpt4-1729512345678-a3f9c2e1b`

**Response**:
```json
{
  "conversationId": "conv-gpt4-1729512345678-a3f9c2e1b",
  "modelId": "gpt-4",
  "receipts": [
    {
      "lamport": 1,
      "event": "Δ-ANALYSIS",
      "path": "/path/to/receipt_conv-gpt4-1729512345678-a3f9c2e1b_L1_*.ben",
      "self_hash": "4dfb4faec6f3b7...",
      "calc_hash": "4dfb4faec6f3b7...",
      "verified": true,
      "ts": "2025-10-21T12:00:30.000Z"
    },
    {
      "lamport": 2,
      "event": "Δ-ANALYSIS",
      "path": "/path/to/receipt_conv-gpt4-1729512345678-a3f9c2e1b_L2_*.ben",
      "self_hash": "e7c8a1f2b3d4...",
      "calc_hash": "e7c8a1f2b3d4...",
      "verified": true,
      "ts": "2025-10-21T12:02:15.000Z"
    }
  ],
  "count": 2,
  "state": {
    "conversation_id": "conv-gpt4-1729512345678-a3f9c2e1b",
    "model_id": "gpt-4",
    "lamport": 2,
    "prev_hash": "e7c8a1f2b3d4...",
    "boot_time": "2025-10-21T12:00:00.000Z",
    "sigma": 0.7234,
    "omega": 0.88,
    "sigmaStar": 0.15,
    "total_events": 2,
    "last_updated": "2025-10-21T12:02:15.000Z"
  },
  "chainVerified": true
}
```

### 3. Export Cryptographically Sealed Container
**GET** `/api/receipts/export/:conversationId`

Exports all receipts for a conversation in a cryptographically sealed container.

**Example**: `GET /api/receipts/export/conv-gpt4-1729512345678-a3f9c2e1b`

**Response**:
```json
{
  "container_type": "LAMPORT_RECEIPT_EXPORT",
  "conversation_id": "conv-gpt4-1729512345678-a3f9c2e1b",
  "model_id": "gpt-4",
  "export_timestamp": "2025-10-21T13:00:00.000Z",
  "boot_time": "2025-10-21T12:00:00.000Z",
  "lamport_range": {
    "start": 1,
    "end": 5,
    "total": 5
  },
  "chain_verified": true,
  "state": {
    "conversation_id": "conv-gpt4-1729512345678-a3f9c2e1b",
    "model_id": "gpt-4",
    "lamport": 5,
    "prev_hash": "e7c8a1f2b3d4...",
    "boot_time": "2025-10-21T12:00:00.000Z",
    "sigma": 0.7234,
    "omega": 0.88,
    "sigmaStar": 0.15,
    "total_events": 5,
    "last_updated": "2025-10-21T12:05:00.000Z"
  },
  "receipts": [
    {
      "receipt_type": "Δ-ANALYSIS",
      "analysis_id": "ANALYSIS-conv-gpt4-1729512345678-a3f9c2e1b-L1-1729512430000",
      "conversation_id": "conv-gpt4-1729512345678-a3f9c2e1b",
      "lamport": 1,
      "prev_digest": null,
      "boot_time": "2025-10-21T12:00:00.000Z",
      "cries": { "C": 0.72, "R": 0.68, "I": 0.74, "E": 0.69, "S": 0.70 },
      "model_id": "gpt-4",
      "ts": "2025-10-21T12:00:30.000Z",
      "self_hash": "4dfb4faec6f3b7..."
    }
  ],
  "registry": [
    {
      "lamport": 1,
      "event": "Δ-ANALYSIS",
      "path": "/path/to/receipt_conv-gpt4-1729512345678-a3f9c2e1b_L1_*.ben",
      "self_hash": "4dfb4faec6f3b7...",
      "calc_hash": "4dfb4faec6f3b7...",
      "verified": true,
      "ts": "2025-10-21T12:00:30.000Z"
    }
  ],
  "container_seal": "a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7f8"
}
```

### 4. Import Cryptographically Sealed Container
**POST** `/api/receipts/import`

Imports a sealed container and verifies all cryptographic seals.

**Request Body**: (entire container JSON from export)

**Response**:
```json
{
  "success": true,
  "conversationId": "conv-gpt4-1729512345678-a3f9c2e1b",
  "modelId": "gpt-4",
  "imported": 5,
  "total": 5,
  "receipts": [
    {
      "lamport": 1,
      "path": "/path/to/receipt_conv-gpt4-1729512345678-a3f9c2e1b_L1_imported_*.ben",
      "hash": "4dfb4faec6f3b7..."
    }
  ],
  "message": "Successfully imported 5 receipts for conversation conv-gpt4-1729512345678-a3f9c2e1b"
}
```

### 5. Parallel Prompt (with conversation tracking)
**POST** `/api/live-demo/parallel-prompt`

**Request Body**:
```json
{
  "prompt": "Explain quantum computing",
  "standardModelId": "gpt-4",
  "rosettaModelId": "gpt-4-rosetta",
  "conversationId": "my-session-12345"
}
```

If `conversationId` is provided, it will be used as a prefix:
- Standard: `my-session-12345-standard`
- Rosetta: `my-session-12345-rosetta`

If omitted, unique IDs are auto-generated:
- `conv-gpt-4-1729512345678-a3f9c2e1b`
- `conv-gpt-4-rosetta-1729512345789-d4e7b8f2c`

**Response**:
```json
{
  "success": true,
  "conversationIds": {
    "standard": "my-session-12345-standard",
    "rosetta": "my-session-12345-rosetta"
  },
  "standardResponse": {
    "content": "Quantum computing is...",
    "cries": { "C": 0.72, "R": 0.68, "I": 0.74, "E": 0.69, "S": 0.70, "overall": 0.7023 },
    "receipt": {
      "conversationId": "my-session-12345-standard",
      "lamport": 1,
      "hash": "4dfb4faec6f3b7...",
      "event": "Δ-ANALYSIS",
      "timestamp": "2025-10-21T12:00:30.000Z"
    }
  },
  "rosettaResponse": {
    "content": "Quantum computing leverages...",
    "cries": { "C": 0.85, "R": 0.82, "I": 0.87, "E": 0.84, "S": 0.86, "overall": 0.8423 },
    "receipt": {
      "conversationId": "my-session-12345-rosetta",
      "lamport": 1,
      "hash": "e7c8a1f2b3d4...",
      "event": "Δ-ANALYSIS",
      "timestamp": "2025-10-21T12:00:31.000Z"
    }
  }
}
```

## Use Cases

### 1. Research Audit Trail
A researcher wants to export all their GPT-4 conversation receipts:
```bash
# Get conversation ID from their session
conversationId="conv-gpt4-1729512345678-a3f9c2e1b"

# Export sealed container
curl http://localhost:3001/api/receipts/export/${conversationId} > my_research_audit.json

# Share with audit committee (cryptographically sealed)
```

### 2. Multi-User System
Different users ask the same model different questions:
- **User A → GPT-4**: Chain starts at L=0, `conv-gpt4-...-a3f9c2e1b`
- **User B → GPT-4**: Chain starts at L=0, `conv-gpt4-...-d4e7b8f2c`
- **User A → GPT-4** (new session): Chain starts at L=0, `conv-gpt4-...-e5g8h3i4j`

Each has completely independent Lamport chains.

### 3. Importing External Conversations
Receive a sealed container from another AuditaAI instance:
```bash
curl -X POST http://localhost:3001/api/receipts/import \
  -H "Content-Type: application/json" \
  -d @external_conversation.json

# Verifies:
# ✓ Container seal (SHA256)
# ✓ Lamport chain monotonicity
# ✓ Each receipt's self_hash
# ✓ Hash chain linkage (prev_digest → self_hash)
```

### 4. Conversation Search
Find all conversations for a specific model:
```bash
# List all conversations
curl http://localhost:3001/api/receipts/conversations

# Filter by model_id in your application
conversations.filter(c => c.modelId === 'gpt-4')
```

## Security Properties

### 1. Conversation Isolation
- ✅ One user cannot tamper with another user's Lamport chain
- ✅ Each conversation has independent cryptographic seal
- ✅ Container export includes full chain verification

### 2. Tamper Evidence
- ✅ Any modification to a receipt breaks `self_hash`
- ✅ Breaking `self_hash` breaks `prev_digest` chain
- ✅ Import will detect and reject tampered containers

### 3. Monotonicity
- ✅ Lamport counter only increments (never decreases)
- ✅ Cannot insert older receipts into chain
- ✅ Total ordering within each conversation

### 4. Cryptographic Sealing
- ✅ Receipt seal: SHA256 of receipt JSON
- ✅ Container seal: SHA256 of entire export
- ✅ Hash chain: `prev_digest` → previous `self_hash`

## Frontend Integration

### Display Conversation List
```tsx
const [conversations, setConversations] = useState([]);

useEffect(() => {
  fetch('http://localhost:3001/api/receipts/conversations')
    .then(res => res.json())
    .then(data => setConversations(data.conversations));
}, []);

// Render:
conversations.map(conv => (
  <div key={conv.conversationId}>
    <h3>{conv.modelId}</h3>
    <p>Lamport: {conv.lamport}</p>
    <p>Events: {conv.totalEvents}</p>
    <button onClick={() => exportConversation(conv.conversationId)}>
      Export
    </button>
  </div>
))
```

### Export Conversation
```tsx
async function exportConversation(conversationId: string) {
  const response = await fetch(
    `http://localhost:3001/api/receipts/export/${conversationId}`
  );
  const container = await response.json();
  
  // Download as JSON file
  const blob = new Blob([JSON.stringify(container, null, 2)], 
    { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${conversationId}.json`;
  a.click();
}
```

### Import Conversation
```tsx
async function importConversation(file: File) {
  const text = await file.text();
  const container = JSON.parse(text);
  
  const response = await fetch('http://localhost:3001/api/receipts/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(container)
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log(`Imported ${result.imported} receipts`);
  } else {
    console.error('Import failed:', result.error);
  }
}
```

## Testing

### Create Test Conversation
```bash
# Send parallel prompt (auto-generates conversation IDs)
curl -X POST http://localhost:3001/api/live-demo/parallel-prompt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Test prompt",
    "standardModelId": "test-model-1",
    "rosettaModelId": "test-model-2"
  }'

# Response includes conversationIds
```

### List Conversations
```bash
curl http://localhost:3001/api/receipts/conversations | python3 -m json.tool
```

### Export Specific Conversation
```bash
conversationId="conv-test-model-1-1729512345678-a3f9c2e1b"
curl http://localhost:3001/api/receipts/export/${conversationId} > export.json
```

### Verify Export Seal
```bash
# Extract container seal
seal=$(jq -r '.container_seal' export.json)

# Remove seal and recalculate
jq 'del(.container_seal)' export.json | sha256sum
# Should match $seal
```

---

**Status**: ✅ Implemented and Tested  
**Backend**: Running on port 3001  
**Last Updated**: 2025-10-21
