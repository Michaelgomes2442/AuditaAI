# Receipt Storage Architecture

## Overview

AuditaAI uses a **hybrid storage approach** for governance receipts:

1. **Primary Storage: PostgreSQL** - Fast queries, live dashboards, analytics
2. **Secondary Storage: File System** - Compliance, external verification, backups
3. **Cache Layer: File System** - Session performance optimization

## Directory Structure

```
backend/
├── data/
│   └── receipts/
│       ├── archives/     # Long-term compliance archives
│       └── exports/      # User-requested exports
└── cache/
    └── receipts/         # Session performance cache
```

## Storage Strategy

### PostgreSQL (Primary)

**Purpose:** Live operational data, fast queries, dashboard updates

**Tables:**
- `governance_receipts` - CRIES governance receipts (Δ-BOOT, Δ-SYNCPOINT, Δ-ANALYSIS, etc.)
- `ben_receipts` - BEN event receipts (cryptographic audit trail)
- `merkle_seals` - Merkle root seals for batched verification

**Advantages:**
- ✅ Fast indexed queries
- ✅ ACID transactions
- ✅ Built-in backup/replication
- ✅ Perfect for dashboards and real-time analytics

**Usage:**
```javascript
// Query receipts from PostgreSQL
const receipts = await prisma.governanceReceipt.findMany({
  where: { session_id: 'abc123' },
  orderBy: { lamport: 'asc' }
});
```

### File System (Secondary)

**Purpose:** Compliance archives, external verification, long-term storage

**Directories:**

#### `/backend/data/receipts/archives/`
Long-term compliance archives (immutable, timestamped)

**Usage:** 
- Automatic daily/weekly archival
- Regulatory compliance (e.g., GDPR, SOC2)
- External auditor access

**Naming Convention:**
```
archive-YYYY-MM-DD-HHmmss.ndjson
```

#### `/backend/data/receipts/exports/`
User-requested exports (manual downloads, API exports)

**Usage:**
- User clicks "Export Receipts" button
- API calls to `/api/pilot/export-receipts`
- Manual compliance reviews

**Naming Convention:**
```
receipts-{sessionId}-{timestamp}.json
```

### Cache Layer

#### `/backend/cache/receipts/`
Session performance optimization

**Usage:**
- Temporary session data
- Performance buffers
- Short-lived (1-7 days)

**Cleanup Policy:**
- Auto-delete files older than 7 days
- Low priority for backups

## Git Configuration

All receipt **content** is ignored by git, but the **directory structure** is tracked:

```gitignore
# Ignore receipt contents
backend/data/receipts/*
backend/cache/receipts/*

# Track directory structure
!backend/data/receipts/.gitkeep
!backend/data/receipts/archives/.gitkeep
!backend/data/receipts/exports/.gitkeep
!backend/cache/receipts/.gitkeep
```

## API Endpoints

### Export Receipts
```
GET /api/pilot/export-receipts?sessionId=xxx&runId=xxx&format=json
```

**Response:** Downloadable JSON bundle containing:
- All receipts for session/run
- BEN receipts
- Merkle seals
- Chain metadata
- Verification instructions

**Example:**
```bash
curl "http://localhost:3001/api/pilot/export-receipts?sessionId=abc123" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o receipts-export.json
```

## Implementation Details

### Current State

✅ **Complete:**
- PostgreSQL schema (governance_receipts, ben_receipts, merkle_seals)
- Directory structure created
- Git configuration updated
- Export API endpoint (`/api/pilot/export-receipts`)

⏳ **Optional Future Enhancements:**
- Automatic archival cron job
- File system export option in export API
- Cleanup policies for old files
- Archive compression (gzip)

### Adding File System Exports

To optionally save exports to the file system:

```javascript
// In /api/pilot/export-receipts endpoint
const fs = require('fs').promises;
const path = require('path');

// After building exportBundle...
const exportPath = path.join(
  process.env.AUDITAAI_HOME || __dirname,
  'data/receipts/exports',
  `receipts-${sessionId || runId || 'export'}-${Date.now()}.json`
);

await fs.writeFile(exportPath, JSON.stringify(exportBundle, null, 2), 'utf8');
console.log(`✅ Receipt export saved to: ${exportPath}`);
```

## Verification Workflow

1. **Query PostgreSQL** for live data
2. **Export to file** for compliance/auditing
3. **Verify chain integrity** using exported receipts
4. **Archive periodically** for long-term storage

## Example: Complete Export & Verify

```bash
# 1. Export receipts for a session
curl "http://localhost:3001/api/pilot/export-receipts?sessionId=session123" \
  -H "Authorization: Bearer TOKEN" \
  -o receipts.json

# 2. Verify chain integrity
node backend/src/verify-receipt-chain.js receipts.json

# 3. Archive for compliance
mv receipts.json backend/data/receipts/archives/archive-$(date +%Y-%m-%d-%H%M%S).json
```

## Troubleshooting

### Receipts not showing up in exports
- Check PostgreSQL: `SELECT COUNT(*) FROM governance_receipts WHERE session_id='xxx';`
- Verify Lamport chain is continuous
- Check for BEN receipt linkage

### File system exports failing
- Verify directory permissions: `ls -la backend/data/receipts/`
- Check disk space: `df -h`
- Verify AUDITAAI_HOME env var

### Git tracking receipt files
- Run: `git check-ignore -v path/to/file`
- Verify .gitignore patterns are correct
- Use `git rm --cached` to remove tracked files

## Best Practices

1. **Always use PostgreSQL as primary source of truth**
2. **Export to file system for compliance/archives only**
3. **Never commit receipt files to git**
4. **Archive periodically (daily/weekly)**
5. **Verify chain integrity before archiving**
6. **Implement cleanup policies for old exports**

## Next Steps

- [ ] Add automatic archival cron job
- [ ] Implement cleanup policy (delete exports older than 30 days)
- [ ] Add file system export option to export API
- [ ] Create archive compression (gzip)
- [ ] Add archive integrity checks
- [ ] Integrate with CRIES v3 for high-risk evaluation exports

---

**Last Updated:** 2025-01-14  
**Status:** ✅ Storage architecture established and committed  
**Commit:** bae9860
