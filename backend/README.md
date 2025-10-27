# AuditaAI Core Backend# AuditaAI Core Backend



**Local-first governance runtime for auditable AI systems****Local-first governance runtime for auditable AI systems**



AuditaAI Core provides a lightweight backend service for evaluating, auditing, and verifying large-language-model (LLM) behavior. It produces deterministic receipts and verifiable governance metrics for accountable AI.AuditaAI Core provides a lightweight backend service for evaluating, auditing, and verifying large-language-model (LLM) behavior. It produces deterministic receipts and verifiable governance metrics for accountable AI.



## Quick Start## Quick Start



### 1. Install Dependencies### 1. Install Dependencies

```bash```bash

cd backendcd backend

pnpm installpnpm install

``````



### 2. Database Setup### 2. Database Setup



**Option A: Docker PostgreSQL (Recommended for local development)****Option A: Docker PostgreSQL (Recommended for local development)**

```bash```bash

# Start PostgreSQL container# Start PostgreSQL container

pnpm run db:uppnpm run db:up



# Run migrations# Run migrations

pnpm run migratepnpm run migrate

``````



**Option B: Prisma (Managed PostgreSQL)****Option B: Prisma (Managed PostgreSQL)**

```bash```bash

# Set DATABASE_URL in .env to your Prisma connection string# Set DATABASE_URL in .env to your Prisma connection string

# Then run migrations# Then run migrations

pnpm run migratepnpm run migrate

``````



**Option C: Local SQLite (Fallback)****Option C: Local SQLite (Fallback)**

```bash```bash

# Uses file-based SQLite (already configured)# Uses file-based SQLite (already configured)

pnpm run migratepnpm run migrate

``````



### 2.5 Prisma Query Monitoring (for E2E Testing)

Prisma query monitoring provides database query logging and performance insights for E2E tests. This helps identify slow queries and database bottlenecks during test execution.

**Setup:**
- Query monitoring is automatically enabled when running E2E tests
- All database queries are logged with execution time and parameters
- Look for `[PRISMA QUERY]` logs in test output

**Usage:**
```bash
# Run E2E tests with query monitoring
cd ../frontend
pnpm run test:e2e
```

**What gets monitored:**
- SQL query execution time
- Query parameters
- Database connection events
- Transaction operations
- Error conditions



### 3. Start the Server### 3. Start the Server

```bash```bash

pnpm run devpnpm run dev

``````



### 4. Verify### 4. Verify

```bash```bash

curl http://localhost:3001/api/healthcurl http://localhost:3001/api/health

``````



## API Endpoints## API Endpoints



### Core Endpoints- `GET /api/health` - Service health check

- `POST /api/analyze` - Analyze prompts/model outputs

- `GET /api/health` - Service health check- `POST /api/compare` - Compare two LLM models

- `POST /api/analyze` - Analyze prompts/model outputs with governance- `GET /api/receipts` - Retrieve Δ-Receipts

- `POST /api/compare` - Compare multiple LLMs side-by-side

- `GET /api/receipts` - Retrieve Δ-Receipts with pagination## Architecture



### Receipt Management### Core Components



- `GET /api/receipts/conversation/:conversationId` - Get receipts for specific conversation- **Δ-Receipts System**: Lamport-ordered receipts with hash-chaining

- `GET /api/receipts/export/:conversationId` - Export receipts as JSON container- **Policy Engine**: JSON-based rules (block, redact, route, escalate)

- `GET /api/receipts/export-ndjson/:conversationId` - Export as signed NDJSON stream- **CRIES Metrics**: Coherence, Reliability, Integrity, Effectiveness, Security

- `GET /api/receipts/conversations` - List all conversations with receipts- **Deterministic Logging**: Signed NDJSON receipt exports



## Architecture### Database Schema



### Core ComponentsBuilt with Prisma ORM supporting PostgreSQL and SQLite backends for local-first operation.



- **Δ-Receipts System**: Lamport-ordered receipts with hash-chaining## Core Architecture - Rosetta Monolith Implementation

- **Policy Engine**: JSON-based rules (block, redact, route, escalate)

- **CRIES Metrics**: Coherence, Reliability, Integrity, Effectiveness, Security### 1. Tri-Track Integrity Model (vΩ3)

- **Deterministic Logging**: Signed NDJSON receipt exports

The system operates on three parallel tracks:

### Database Schema

- **Track-A (BEN Core/Analyst)**:

Built with Prisma ORM supporting PostgreSQL and SQLite backends for local-first operation.  - Enforces policy (Π) and temporal (τ) constraints 

  - Computes stability windows (σ) and CRIES metrics

### API Request/Response Examples  - Proposes clarification requests

  - Provides core automation and verification

#### Analyze Endpoint

```bash- **Track-B (AuditaAI Governor/Verifier)**:

curl -X POST http://localhost:3001/api/analyze \  - Applies governance policies

  -H "Content-Type: application/json" \  - Executes Z-Scan verification

  -d '{  - Manages consent and trace IDs

    "prompt": "Explain quantum computing",  - Prepares promotion receipts

    "model": "gpt-4",

    "context": {}- **Track-C (LLM Executor/Reasoner)**:

  }'  - Performs bounded execution steps under Track-B constraints

```  - Emits Δ-SEQ-PLAN/EXEC/DONE receipts

  - Maintains deterministic handoffs with other tracks

Response:

```json### 1. Blockchain Event Network (BEN)

{

  "analysis": {The system is built on the BEN architecture, which consists of:

    "prompt": "Explain quantum computing",

    "response": "...",- **Event Processing**: Audit events are processed through `ben_event.py`

    "model": "gpt-4",- **Boot Sequence**: System initialization via `ben_boot.py`

    "cries": {- **Chain Verification**: Cryptographic verification through `verify_chain.py`

      "C": 0.85,- **Hash Verification**: Block integrity checks via `verify_hash.py`

      "R": 0.82,- **Audit Service**: Core service handling through `audit_service.py`

      "I": 0.88,

      "E": 0.79,### 2. Monolithic Structure

      "S": 0.91,

      "overall": 0.85The monolith combines several key components:

    },

    "policies": []- **Backend Service**: Node.js/TypeScript server with WebSocket support

  },- **Governance Engine**: CRIES metrics calculation and audit flow

  "receipt": {...},- **Prisma ORM**: Database interactions and schema management

  "actions": []- **BEN Integration**: Python-based blockchain verification

}

```## Quick Start



#### Compare Endpoint```bash

```bash# Install dependencies

curl -X POST http://localhost:3001/api/compare \pnpm install

  -H "Content-Type: application/json" \

  -d '{# Run database migrations

    "prompt": "What is machine learning?",pnpm prisma migrate dev

    "models": ["gpt-4", "claude-3"]

  }'# Build TypeScript

```pnpm build



#### Health Check# Start development server

```bashpnpm dev

curl http://localhost:3001/api/health```

```

## Environment & Secrets

Response:

```json- For local development, use `backend/.env` or `backend/.env.example` (the repo includes an example). All cloud/Vercel deployment is disabled. Do NOT commit production credentials to the repository.

{- Redis is optional; the application will use Postgres advisory locks when `REDIS_URL` is not set. If you later add Redis, set `REDIS_URL` as an env var.

  "status": "healthy",

  "service": "AuditaAI Core",

  "version": "1.0.0",## Architecture Overview

  "timestamp": "2025-10-26T12:34:56.789Z"

}### MVP Implementation Priorities

```

1. **Core Analysis Platform**

## Development   - Real-time model monitoring system

   - Governance metric calculation engine

### Scripts   - Alert and intervention framework

- `pnpm run dev` - Start development server with hot reload   - Research station workspaces

- `pnpm run migrate` - Run database migrations   - Data export and reporting system

- `pnpm run db:up` - Start PostgreSQL container

- `pnpm run db:down` - Stop PostgreSQL container2. **Pilot Features**

- `pnpm run db:reset` - Reset database and run migrations   ```typescript

   interface PilotFeatures {

### Environment Variables     // Model Analysis

- `DATABASE_URL` - Database connection string     behaviorTracking: {

- `PORT` - Server port (default: 3001)       inputPatternAnalysis: boolean;    // Track input patterns

- `NODE_ENV` - Environment (development/production)       outputConsistency: boolean;       // Measure response consistency

       driftDetection: boolean;          // Monitor behavioral drift

## Features       anomalyDetection: boolean;        // Identify anomalies

     };

### Δ-Receipts     

- Lamport-ordered sequence numbers     // Governance

- Cryptographic hash chaining     complianceMonitoring: {

- Timestamped records       regulatoryAlignment: boolean;     // Check regulatory compliance

- Conversation-specific chains       ethicsBoundaries: boolean;        // Monitor ethics metrics

- Database and filesystem storage       interventionPoints: boolean;       // Detect intervention needs

       auditTrail: boolean;             // Maintain audit records

### Policy Engine     };

- JSON-based governance rules     

- Actions: block, redact, route, escalate     // Research Tools

- Priority-based evaluation     analysisCapabilities: {

- Extensible rule system       criesDashboard: boolean;         // Interactive CRIES metrics

       modelComparison: boolean;        // Compare multiple models

### CRIES Metrics       customTestSuites: boolean;       // Create custom tests

- **Coherence (C)**: Logical consistency and flow       batchProcessor: boolean;         // Run batch analyses

- **Reliability (R)**: Factual accuracy and citations     };

- **Integrity (I)**: Ethical alignment and safety   }

- **Effectiveness (E)**: User satisfaction and utility   ```

- **Security (S)**: Policy compliance and safety

3. **Research Station Tiers**

### Local-First Design

- Works offline with local databases2. **Band-1 (Adaptive Governance Layer)**

- Docker support for PostgreSQL   - Advisory models with bounded policy updates

- Neon managed PostgreSQL compatibility   - Temporal Governance Learning (TGL)

- SQLite fallback for development   - Causal Audit Graphs (CAG)
   - Symbolic-Neural hybrid processing
   - Message-driven batch learning

3. **Band-2 (Meta-Governance Layer)**
   - Reflective meta-learning
   - Policy field justification
   - Cross-model witness consensus
   - Risk and ethics metrics

4. **Band-3 (Field Learning Layer)**
   ```
   Band-1/2 Receipts → Field Vectors → Stability Analysis → Governance Updates
   ```
   - Governance vector field computation
   - Gradient and flux analysis
   - Stability alerting
   - Four-dimensional field mapping:
     - Temporal axis
     - Causal axis
     - Symbolic axis
     - Meta axis

5. **Bands 4-9 (Advanced Governance)**
   - Policy Field Learning (PFL)
   - Cross-Model Witness (CMW)
   - Risk & Ethics Metrics (REM)
   - Audit Mesh (AMESH)
   - Autonomy Governor (AUTOGOV)

6. **Band-Z (Audit & Legal Layer)**
   - Cryptographic identity and signatures
   - Legal and IP defense mechanisms
   - Final attestation and verification
   - Band promotion control

### Core Mathematical Framework

1. **Tri-Actor Coupling (Math Canon vΩ.8)**
   ```
   σᵗ = wA·σAᵗ + wB·σBᵗ + wC·σCᵗ,   wA+wB+wC=1,  defaults (0.4,0.4,0.2)
   Ωᵗ₊₁ = Ωᵗ + η·Δclarity − γB·max(0, σᵗ − σ*)
   ```
   - σᵗ: Stability metric at time t
   - Ωᵗ: System state
   - η: Learning rate
   - γB: Track-B governance factor

2. **CRIES-Citation Quality Coupling (vΩ.9)**
   ```
   R := R0 − 0.30·unverified_citations_ratio − 0.10·fail_citation_count_normalized
   ```
   - Triggers clarifiers when R < 0.70 AND unverified_citations > 5
   - Emits Δ-HITL-BLOCK for manual review

3. **Z-Scan Verification (v4)**

Comprehensive verification includes:

1. **Structural Integrity**
   - No nested DOCTYPE
   - All tags properly closed
   - Clean DOM structure

2. **Lamport Chain Verification**
   - Monotonic clock values
   - prev_digest → self_hash matching
   - Complete hash chain

3. **Citation & Evidence**
   - All citations have Δ-CITE-VERIFY
   - doc:// and ref:// resolution
   - HITL block clearance

4. **Policy Compliance**
   - CRIES windows within εₜ
   - Tri-Track coupling equations
   - Referential autonomy bounds

5. **Promotion Requirements**
   - Twin page parity
   - Golden Page checklist
   - Promotion rehearsal execution

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL

### Research Station Features

1. **Model Analysis Dashboard**
   - Real-time model behavior tracking
   - CRIES metrics visualization
   - Governance compliance status
   - Alert and intervention system
   
2. **Analytical Workbench**
   ```typescript
   interface AnalysisCapabilities {
     modelComparison: boolean;     // Compare multiple models
     batchProcessing: boolean;     // Run batch tests
     customTests: boolean;         // Create custom test suites
     exportFormats: string[];      // Available export formats
     maxConcurrentTests: number;   // Max parallel tests
   }
   ```

3. **Research Tools Configuration**
   ```typescript
   // Analysis station settings
   interface StationConfig {
     quotas: {
       maxRecordsPerDay: number;
       maxAnalysts: number;
       maxModels: number;
       storageLimit: string;     // e.g., "500GB"
     };
     features: {
       realTimeAnalysis: boolean;
       predictiveMetrics: boolean;
       customPolicies: boolean;
       apiAccess: boolean;
     };
     support: {
       responseTime: string;     // e.g., "4h"
       dedicatedAnalyst: boolean;
       trainingHours: number;
     };
   }
   ```

4. **Governance Settings**
   ```typescript
   interface GovernanceConfig {
     auditFrequency: number;    // minutes
     alertThresholds: {
       cries: number;           // 0-1
       driftTolerance: number;  // 0-1
       ethicsScore: number;     // 0-1
     };
     interventionRules: {
       autoPause: boolean;
       notifyStakeholders: boolean;
       requireApproval: boolean;
     };
   }
   ```

### Database Setup

```bash
# Run migrations
pnpm prisma migrate dev

# Generate Prisma client
pnpm prisma generate
```

### Research Station API

The system provides a comprehensive API for research station management and analysis:

1. **Station Management**
   ```typescript
   interface ResearchStation {
     // Station setup and configuration
     initializeStation(config: StationConfig): Promise<void>;
     addAnalyst(analyst: AnalystProfile): Promise<void>;
     configureWorkspace(settings: WorkspaceSettings): Promise<void>;
     
     // Model management
     registerModel(model: AIModelProfile): Promise<string>;
     configureModelMonitoring(modelId: string, settings: MonitoringConfig): Promise<void>;
     
     // Analysis workflows
     createAnalysisJob(params: AnalysisParams): Promise<JobId>;
     runBatchTests(testSuite: TestSuite): Promise<TestResults>;
     exportResults(format: ExportFormat): Promise<Blob>;
   }
   ```

2. **Analysis Capabilities**
   ```typescript
   interface AnalysisToolkit {
     // Real-time analysis
     monitorModelBehavior(modelId: string): Observable<BehaviorMetrics>;
     trackGovernanceCompliance(modelId: string): Observable<ComplianceStatus>;
     detectAnomalies(modelId: string): Observable<AnomalyAlert>;
     
     // Batch analysis
     compareModels(models: string[]): Promise<ComparisonReport>;
     generateCriesReport(modelId: string, timeframe: TimeRange): Promise<CriesReport>;
     analyzeEthicsMetrics(modelId: string): Promise<EthicsScore>;
   }
   ```

2. **Field Learning Receipts**
   - Δ-FIELD-POINT: Vector field measurements
   - Δ-GRADIENT: Field changes
   - Δ-FLUX: Cross-band energy flow
   - Δ-STABILITY-ALERT: System stability warnings

3. **Governance Receipts**
   - Δ-CONSENT-GRANT/REVOKE: Permission management
   - Δ-ACT-REQUEST/APPROVE/DENY: Action control
   - Δ-WITNESS-CLAIM/CONSENSUS: Cross-model verification
   - Δ-RISK-GATE: Safety controls

4. **Cryptographic Receipts**
   - Δ-CRYPTO-IDENT: Identity establishment
   - Δ-SIGNATURE: Detached signatures
   - Δ-MERKLE-ROOT-LOCAL: Local state verification
   - Δ-MERKLE-VERIFY-REMOTE: Remote state verification

Each receipt maintains:
- Lamport clock value
- Previous receipt digest
- Self-hash
- Trace ID
- Timestamp

### WebSocket Events

The backend emits the following WebSocket events:

1. `audit-update`
   ```typescript
   interface AuditUpdatePayload {
     id: string;
     type: string;
     content: Record<string, any>;
     timestamp: Date;
     blockHash?: string;
   }
   ```

2. `metrics-update`
   ```typescript
   interface MetricsUpdatePayload {
     blockId: string;
     completeness: number;
     reliability: number;
     integrity: number;
     effectiveness: number;
     security: number;
   }
   ```

3. `verification-result`
   ```typescript
   interface VerificationResultPayload {
     blockId: string;
     verified: boolean;
     timestamp: Date;
   }
   ```

### Code Style & Linting

```bash
# Run linter
pnpm lint

# Fix auto-fixable issues
pnpm lint:fix

# Run type checker
pnpm typecheck
```

## Deployment

The backend service can be deployed using Docker:

```bash
# Build Docker image
docker build -t auditai-backend .

# Run container
docker run -p 3001:3001 -e DATABASE_URL=your_db_url auditai-backend
```

## Contributing

1. Ensure all tests pass locally
2. Run type checking: `pnpm typecheck`
3. Follow the existing code style
4. Add tests for new features
5. Update documentation as needed