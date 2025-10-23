# AuditaAI Backend

The backend service implements an MVP pilot for AI model auditing and research stations, focused on establishing verifiable AI governance. This implementation uses the Rosetta Monolith's cognitive architecture to provide comprehensive model analysis, regulatory compliance tracking, and research capabilities.

## MVP Pilot Overview

### 1. Research Station Types

- **Basic Research Station** ($499/month)
  - Single model analysis
  - Basic CRIES metrics tracking
  - Up to 1000 audit records/day
  - 2 analyst seats
  
- **Professional Station** ($1499/month)
  - Multi-model comparative analysis
  - Advanced CRIES metrics with trend analysis
  - Up to 10,000 audit records/day
  - 5 analyst seats
  - Custom governance policies
  
- **Enterprise Research Hub** ($4999/month)
  - Full model ecosystem analysis
  - Real-time CRIES metrics with predictive analytics
  - Unlimited audit records
  - 20 analyst seats
  - Custom governance policies
  - Dedicated support

### 2. Analysis Capabilities

- **Model Behavior Analysis**
  - Input/output pattern tracking
  - Response consistency measurement
  - Edge case detection
  - Behavioral drift monitoring

- **Governance Tracking**
  - Real-time policy compliance
  - Regulatory alignment checking
  - Ethics boundary monitoring
  - Intervention point detection

- **Research Tools**
  - Interactive CRIES dashboard
  - Model comparison workbench
  - Custom test suite creation
  - Batch analysis processor
  - Export capabilities (CSV, JSON, PDF)

## Core Architecture - Rosetta Monolith Implementation

### 1. Tri-Track Integrity Model (vΩ3)

The system operates on three parallel tracks:

- **Track-A (BEN Core/Analyst)**:
  - Enforces policy (Π) and temporal (τ) constraints 
  - Computes stability windows (σ) and CRIES metrics
  - Proposes clarification requests
  - Provides core automation and verification

- **Track-B (AuditaAI Governor/Verifier)**:
  - Applies governance policies
  - Executes Z-Scan verification
  - Manages consent and trace IDs
  - Prepares promotion receipts

- **Track-C (LLM Executor/Reasoner)**:
  - Performs bounded execution steps under Track-B constraints
  - Emits Δ-SEQ-PLAN/EXEC/DONE receipts
  - Maintains deterministic handoffs with other tracks

### 1. Blockchain Event Network (BEN)

The system is built on the BEN architecture, which consists of:

- **Event Processing**: Audit events are processed through `ben_event.py`
- **Boot Sequence**: System initialization via `ben_boot.py`
- **Chain Verification**: Cryptographic verification through `verify_chain.py`
- **Hash Verification**: Block integrity checks via `verify_hash.py`
- **Audit Service**: Core service handling through `audit_service.py`

### 2. Monolithic Structure

The monolith combines several key components:

- **Backend Service**: Node.js/TypeScript server with WebSocket support
- **Governance Engine**: CRIES metrics calculation and audit flow
- **Prisma ORM**: Database interactions and schema management
- **BEN Integration**: Python-based blockchain verification

## Quick Start

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm prisma migrate dev

# Build TypeScript
pnpm build

# Start development server
pnpm dev
```

## Architecture Overview

### MVP Implementation Priorities

1. **Core Analysis Platform**
   - Real-time model monitoring system
   - Governance metric calculation engine
   - Alert and intervention framework
   - Research station workspaces
   - Data export and reporting system

2. **Pilot Features**
   ```typescript
   interface PilotFeatures {
     // Model Analysis
     behaviorTracking: {
       inputPatternAnalysis: boolean;    // Track input patterns
       outputConsistency: boolean;       // Measure response consistency
       driftDetection: boolean;          // Monitor behavioral drift
       anomalyDetection: boolean;        // Identify anomalies
     };
     
     // Governance
     complianceMonitoring: {
       regulatoryAlignment: boolean;     // Check regulatory compliance
       ethicsBoundaries: boolean;        // Monitor ethics metrics
       interventionPoints: boolean;       // Detect intervention needs
       auditTrail: boolean;             // Maintain audit records
     };
     
     // Research Tools
     analysisCapabilities: {
       criesDashboard: boolean;         // Interactive CRIES metrics
       modelComparison: boolean;        // Compare multiple models
       customTestSuites: boolean;       // Create custom tests
       batchProcessor: boolean;         // Run batch analyses
     };
   }
   ```

3. **Research Station Tiers**

2. **Band-1 (Adaptive Governance Layer)**
   - Advisory models with bounded policy updates
   - Temporal Governance Learning (TGL)
   - Causal Audit Graphs (CAG)
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