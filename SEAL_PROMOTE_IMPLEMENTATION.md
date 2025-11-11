# Receipt Seal & Promote Implementation

## Status: ✅ COMPLETE

### Implementation Date
January 2025

## Overview
Added functionality to seal receipts to Merkle tree (permanent cryptographic commitment) and promote receipts to permanent filesystem storage.

## Changes Made

### 1. Backend Endpoints (server.js)

#### Added Imports
```javascript
import path from "path";
import fs from "fs/promises";
```

#### POST /api/pilot/receipt/:id/seal
- **Purpose**: Seal receipt to Merkle tree for immutability
- **Location**: Line ~3850 (before "END LIVE DEMO ENDPOINTS")
- **Functionality**:
  - Finds receipt by ID
  - Checks if already sealed (queries MerkleSealer table)
  - Batches up to 3 unsealed receipts
  - Computes Merkle root using `computeMerkleRoot()` helper
  - Creates `MerkleSeal` record with 3 leaf slots
  - Returns merkle root, sealed count, timestamp
- **Response**:
  ```json
  {
    "success": true,
    "merkleRoot": "sha256...",
    "sealedReceipts": 3,
    "timestamp": "2025-01-...",
    "message": "Successfully sealed N receipt(s) to Merkle tree"
  }
  ```

#### POST /api/pilot/receipt/:id/promote
- **Purpose**: Promote receipt to permanent filesystem storage
- **Location**: Line ~3920 (before "END LIVE DEMO ENDPOINTS")
- **Functionality**:
  - Finds receipt by ID with full data
  - Creates `/receipts/archive/` directory if missing
  - Generates filename: `receipt_{conversationId}_L{lamport}_{timestamp}.json`
  - Writes comprehensive JSON with all receipt fields + CRIES scores
  - Adds archival metadata (archivedAt, storageType, version)
  - Returns storage location and file size
- **Response**:
  ```json
  {
    "success": true,
    "storageLocation": "/path/to/receipts/archive/receipt_...",
    "filename": "receipt_abc123_L42_1234567890.json",
    "size": 1234,
    "message": "Receipt successfully promoted to permanent storage"
  }
  ```

### 2. Frontend UI (pilot/page.tsx)

#### Added Icon Import
```typescript
import { Database } from 'lucide-react';
```

#### Added Action Functions (Lines 370-418)
```typescript
const sealReceipt = async (receiptId: string) => {
  const response = await fetch(`${BACKEND_URL}/api/pilot/receipt/${receiptId}/seal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await response.json();
  if (data.success) {
    alert(`✅ Receipt sealed to Merkle tree!\nRoot: ${data.merkleRoot?.substring(0, 32)}...`);
    loadReceipts();
  } else {
    alert(`❌ Failed to seal receipt: ${data.error}`);
  }
};

const promoteReceipt = async (receiptId: string) => {
  const response = await fetch(`${BACKEND_URL}/api/pilot/receipt/${receiptId}/promote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await response.json();
  if (data.success) {
    alert(`✅ Receipt promoted to permanent storage!\nLocation: ${data.storageLocation}`);
    loadReceipts();
  } else {
    alert(`❌ Failed to promote receipt: ${data.error}`);
  }
};
```

#### Updated Receipt Card UI (Lines ~690-710)
Added action buttons with hover effect:
```tsx
<div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
  {/* Seal to Merkle Tree */}
  <button
    onClick={() => sealReceipt(receipt.id)}
    className="p-1.5 rounded border border-green-500 hover:bg-green-50"
    title="Seal to Merkle Tree"
  >
    <Shield className="w-3 h-3 text-green-600" />
  </button>
  
  {/* Promote to Permanent Storage */}
  <button
    onClick={() => promoteReceipt(receipt.id)}
    className="p-1.5 rounded border border-purple-500 hover:bg-purple-50"
    title="Promote to Permanent Storage"
  >
    <Database className="w-3 h-3 text-purple-600" />
  </button>
</div>
```

### 3. Socket.IO Initialization Fix

**Problem**: Live receipts not working because Socket.IO server was never initialized despite `io.emit()` calls existing.

**Solution**: Added Socket.IO server initialization (server.js line ~255)
```javascript
import { Server } from "socket.io";

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`🔌 Socket.IO client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`🔌 Socket.IO client disconnected: ${socket.id}`);
  });
  
  socket.on('error', (error) => {
    console.error(`🔌 Socket.IO error from ${socket.id}:`, error);
  });
});
```

## User Experience

### Seal Receipt
1. User hovers over receipt card
2. Green Shield button appears
3. Click → Backend batches unsealed receipts
4. Creates Merkle tree with up to 3 receipts
5. Stores in `MerkleSeal` table
6. Alert shows: "✅ Receipt sealed to Merkle tree! Root: sha256..."
7. Receipt list refreshes

### Promote Receipt
1. User hovers over receipt card
2. Purple Database button appears
3. Click → Backend writes full receipt JSON to filesystem
4. Saved to: `/receipts/archive/receipt_{conversationId}_L{lamport}_{timestamp}.json`
5. Alert shows: "✅ Receipt promoted to permanent storage! Location: /path/..."
6. Receipt list refreshes

## Technical Details

### Merkle Sealing Strategy
- **Batching**: Seals 3 receipts at once for efficient tree construction
- **Deduplication**: Checks `MerkleSealer` table to avoid double-sealing
- **Leaf Storage**: Stores receipt IDs and digests in `leaf_1`, `leaf_2`, `leaf_3` columns
- **Root Calculation**: Uses existing `computeMerkleRoot()` helper function

### Archive File Format
```json
{
  "id": "receipt-uuid",
  "lamport": 42,
  "timestamp": "2025-01-...",
  "conversationId": "session-abc123",
  "traceId": "run-xyz789",
  "persona": "Witness",
  "model": "gpt-4o",
  "prompt": "...",
  "output": "...",
  "currDigest": "sha256...",
  "prevDigest": "sha256...",
  "promptHash": "sha256...",
  "outputHash": "sha256...",
  "cries": {
    "coherence": 0.85,
    "rigor": 0.82,
    "integrity": 0.88,
    "empathy": 0.75,
    "strictness": 0.80,
    "omega": 0.82
  },
  "metadata": {
    "archivedAt": "2025-01-...",
    "storageType": "permanent",
    "version": "pilot-v1"
  }
}
```

## Database Schema Requirements

### MerkleSealer Table (Already Exists)
```prisma
model MerkleSealer {
  id                String   @id @default(cuid())
  merkle_root       String
  timestamp         DateTime
  leaf_1_receipt_id String?
  leaf_1_digest     String?
  leaf_2_receipt_id String?
  leaf_2_digest     String?
  leaf_3_receipt_id String?
  leaf_3_digest     String?
}
```

### GovernanceReceipt Table (Already Exists)
Used for querying receipts and extracting digest values.

## Testing Checklist

- [x] Backend endpoints created
- [x] Frontend UI buttons added
- [x] Frontend API calls implemented
- [x] Socket.IO server initialized
- [ ] Manual test: Seal receipt via UI
- [ ] Manual test: Promote receipt via UI
- [ ] Manual test: Live receipts display
- [ ] Verify: MerkleSealer records created
- [ ] Verify: Archive files written to filesystem
- [ ] Verify: Socket.IO connection logs appear

## Future Enhancements

1. **Schema Update**: Add `sealed` and `promoted` boolean flags to `GovernanceReceipt`
2. **UI Feedback**: Show sealed/promoted status on receipt cards (badge/icon)
3. **Batch Actions**: Multi-select receipts for bulk seal/promote
4. **Archive Browser**: UI to browse and restore archived receipts
5. **Seal Verification**: Visual Merkle tree viewer with proof paths
6. **Export Integration**: Include sealed/promoted status in exports

## Dependencies

- **Backend**: Express, Prisma, fs/promises, path
- **Frontend**: React, lucide-react (Shield, Database icons)
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.IO 4.8.1

## Related Files

- `/backend/server.js` - Endpoints implementation
- `/frontend/app/pilot/page.tsx` - UI and client logic
- `/backend/prisma/schema.prisma` - Database schema
- `RECEIPTS_LAB_QUICKSTART.md` - Receipt system documentation
