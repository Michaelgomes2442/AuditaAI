#!/usr/bin/env node
/**
 * ML-Enhanced Iterative Wrapper Optimizer with Ceiling Breakers
 * Uses machine learning to intelligently select mutations and minimize API calls
 * NOW WITH STRUCTURAL MUTATIONS TO BREAK OPTIMIZATION CEILINGS
 * 
 * Features:
 * - Thompson Sampling (Multi-Armed Bandit) for mutation selection
 * - Anti-starvation: forced exploration of undersampled mutations
 * - Progressive validation: test 1 prompt first, then continue if promising
 * - Adaptive dropout: stop mid-test if results consistently degrade
 * - Embedding-based similarity to avoid redundant tests
 * - Learning from past iterations with reward tracking
 * - Anti-overfitting: random prompt subsets per iteration (5 from pool of 10)
 * - Anti-bloat: quadratic length penalties + hard limits
 * - Variance tracking: detect unstable mutations and model noise
 * - Mutation diversity monitoring: detect bandit starvation
 * 
 * 🔥 CEILING BREAKERS (NEW):
 * - Deletion mutations: compress redundancy, remove repetitive patterns
 * - Structural reorganization: extract to header, consolidate sections
 * - Automatic ceiling detection: force breakthrough when plateaued
 * - 4 structural mutations + 5 additive mutations = 9 total strategies
 * 
 * Three Natural Ceilings (Now Addressed):
 * 1. ✅ LOCAL OPTIMIZATION: Structural mutations break local optima
 * 2. ✅ LENGTH EXPLOSION: Compression passes counter additive drift
 * 3. ⚠️  CRIES STABILITY: Noise floor unavoidable (acknowledged)
 * 
 * Limitations (by design):
 * 1. CRIES metric noise floor - unavoidable model variance
 * 2. Compression may sacrifice some specificity for brevity
 * 3. Structural changes tested same as additive (may need more prompts)
 * 4. Breakthrough forced after 4 no-improvement iterations
 * 
 * Critical Thresholds:
 * - Soft limit: 3000 chars (penalties start)
 * - Ceiling detection: 3 iterations plateau + >2500 chars
 * - Forced breakthrough: 4 iterations plateau + >3000 chars
 * - Hard limit: 4000 chars (rejected immediately)
 * 
 * Usage:
 *   node tests/iterative-wrapper-optimizer.js --iterations 20 --budget 100 --prompts 5 --max-length 4000 --length-penalty 0.3
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diverse test prompts for robustness against overfitting
const TEST_PROMPTS = [
  "What security mechanisms should I implement for a microservices architecture handling financial transactions?",
  "How should I structure audit logging for a HIPAA-compliant healthcare system?",
  "What are the key considerations for implementing rate limiting in a public API?",
  "Design a disaster recovery plan for a multi-region cloud deployment with RPO under 1 hour",
  "How do I implement zero-trust networking for a Kubernetes cluster with multiple namespaces?",
  "What compliance controls are needed for a SaaS platform handling EU customer data under GDPR?",
  "Design an incident response workflow for detecting and containing a database breach",
  "How should I architect a secure CI/CD pipeline with automated security scanning and approval gates?",
  "What monitoring and alerting strategy should I use for detecting anomalous API usage patterns?",
  "Design a secrets management system for microservices with automatic rotation and audit trails"
];

// Baseline from previous test (updated from last run)
const BASELINE = {
  overall: 0.6907,
  coherence: 0.8905,
  rigor: 0.4045,
  integration: 0.6333,
  empathy: 0.8750,
  strictness: 0.8125
};

class IterativeOptimizer {
  constructor(options = {}) {
    this.maxIterations = options.iterations || 20;
    this.apiBudget = options.budget || 100; // Max API calls
    this.dashboardUrl = options.url || 'http://localhost:3000/pilot';
    this.browser = null;
    this.page = null;
    this.capturedResponse = null;
    
    this.bestScores = { ...BASELINE };
    this.bestWrapper = null;
    this.currentWrapper = null;
    this.iteration = 0;
    this.apiCalls = 0;
    this.history = [];
    
    // ML state for Thompson Sampling
    this.mutationStats = new Map();
    this.embeddings = [];
    
    // Ceiling detection
    this.forcedNextMutation = null; // For breakthrough attempts
    this.ceilingDetected = false;
    
    // Anti-overfitting: adaptive prompt selection
    this.promptSubsetSize = options.promptSubset || 5; // Use 5 random prompts per iteration
    this.maxWrapperLength = options.maxLength || 4000; // Prevent bloat
    
    // Anti-explosion: aggressive length penalties
    this.softLengthLimit = 3000; // Start penalizing here
    this.hardLengthLimit = this.maxWrapperLength;
    this.lengthPenaltyStrength = options.lengthPenalty || 0.2; // Higher = stricter
    
    // Pruning: enable compression pass when wrapper grows too large
    this.enablePruning = options.enablePruning !== false; // Default true
    this.pruningThreshold = 3500; // Trigger pruning above this
    
    // Robustness: track variance to detect instability
    this.recentVariance = [];
    
    // Initialize OpenAI for embeddings (optional, falls back if no key)
    this.openai = process.env.OPENAI_API_KEY ? 
      new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
    
    this.llmClientPath = path.join(__dirname, '../src/llm-client.js');
    
    // Initialize mutation statistics
    this.initializeMutationStats();
  }

  // Initialize mutation statistics with Beta distribution priors
  initializeMutationStats() {
    const mutations = [
      // Additive mutations (original)
      'rigor_numbers',
      'rigor_scenarios', 
      'integration_flow',
      'integration_constraints',
      'balanced_boost',
      
      // CEILING BREAKERS: Deletion & restructuring
      'compress_redundancy',      // Remove repetitive patterns
      'extract_to_header',        // Move common patterns up
      'simplify_examples',        // Replace verbose examples with concise ones
      'consolidate_sections'      // Merge similar instruction blocks
    ];
    
    mutations.forEach(name => {
      this.mutationStats.set(name, {
        successes: 1,  // Prior: assume 1 success (optimistic)
        failures: 1,   // Prior: assume 1 failure
        totalReward: 0,
        count: 0,
        lastUsed: 0
      });
    });
  }

  // Beta distribution sampling for Thompson Sampling
  betaSample(alpha, beta) {
    // Use Gamma distribution to sample Beta
    const gamma1 = this.gammaSample(alpha, 1);
    const gamma2 = this.gammaSample(beta, 1);
    return gamma1 / (gamma1 + gamma2);
  }

  // Gamma distribution sampling (for Beta)
  gammaSample(shape, scale) {
    if (shape < 1) {
      return this.gammaSample(shape + 1, scale) * Math.pow(Math.random(), 1 / shape);
    }
    
    const d = shape - 1/3;
    const c = 1 / Math.sqrt(9 * d);
    
    while (true) {
      let x, v;
      do {
        x = this.normalSample(0, 1);
        v = 1 + c * x;
      } while (v <= 0);
      
      v = v * v * v;
      const u = Math.random();
      
      if (u < 1 - 0.0331 * x * x * x * x) {
        return d * v * scale;
      }
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v * scale;
      }
    }
  }

  // Normal distribution sampling (Box-Muller)
  normalSample(mean, stddev) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stddev + mean;
  }

  // Thompson Sampling: Select mutation based on Beta distribution
  selectMutationThompson() {
    let bestMutation = null;
    let bestSample = -Infinity;
    
    // Anti-starvation: Detect if any mutation has <3 samples and force exploration
    const underSampledMutations = [];
    for (const [name, stats] of this.mutationStats.entries()) {
      if (stats.count < 3 && this.iteration > 1) {
        underSampledMutations.push(name);
      }
    }
    
    // Force exploration of undersampled mutations early
    if (underSampledMutations.length > 0 && Math.random() < 0.3) {
      const forced = underSampledMutations[Math.floor(Math.random() * underSampledMutations.length)];
      console.log(`   🔬 Forced exploration: ${forced} (only ${this.mutationStats.get(forced).count} samples)`);
      return forced;
    }
    
    for (const [name, stats] of this.mutationStats.entries()) {
      // Sample from Beta(successes, failures)
      const sample = this.betaSample(stats.successes, stats.failures);
      
      // Enhanced exploration bonus: grows with iteration count but decays with usage
      const totalIterations = this.iteration + 1;
      const explorationBonus = Math.sqrt(2 * Math.log(totalIterations) / (stats.count + 1)) * 0.15;
      
      // Anti-starvation bonus: extra boost for rarely used mutations
      const starvationBonus = stats.count < 3 ? 0.2 : 0;
      
      const score = sample + explorationBonus + starvationBonus;
      
      if (score > bestSample) {
        bestSample = score;
        bestMutation = name;
      }
    }
    
    return bestMutation;
  }

  // Update mutation statistics based on results
  updateMutationStats(mutationName, success, reward, variance = null) {
    const stats = this.mutationStats.get(mutationName);
    
    if (success) {
      stats.successes += 1;
    } else {
      stats.failures += 1;
    }
    
    stats.totalReward += reward;
    stats.count += 1;
    stats.lastUsed = this.iteration;
    
    // Track variance for instability detection
    if (variance !== null) {
      if (!stats.variances) stats.variances = [];
      stats.variances.push(variance);
      
      // High variance = unstable mutation (penalize exploration bonus)
      if (stats.variances.length > 3) {
        const avgVar = stats.variances.slice(-3).reduce((a, b) => a + b) / 3;
        if (avgVar > 0.05) {
          console.log(`   ⚠️  ${mutationName} shows high variance (${avgVar.toFixed(4)}), may be unstable`);
        }
      }
    }
    
    console.log(`   📊 ${mutationName}: ${stats.successes}/${stats.count} success rate, avg reward: ${(stats.totalReward / stats.count).toFixed(4)}`);
  }

  // Calculate cosine similarity between two strings
  async calculateSimilarity(text1, text2) {
    if (!this.openai) {
      // Fallback: simple Jaccard similarity on words
      const words1 = new Set(text1.toLowerCase().match(/\w+/g) || []);
      const words2 = new Set(text2.toLowerCase().match(/\w+/g) || []);
      const intersection = new Set([...words1].filter(x => words2.has(x)));
      const union = new Set([...words1, ...words2]);
      return intersection.size / union.size;
    }
    
    try {
      // Use OpenAI embeddings for semantic similarity
      const [emb1, emb2] = await Promise.all([
        this.openai.embeddings.create({ model: 'text-embedding-3-small', input: text1.slice(0, 8000) }),
        this.openai.embeddings.create({ model: 'text-embedding-3-small', input: text2.slice(0, 8000) })
      ]);
      
      const vec1 = emb1.data[0].embedding;
      const vec2 = emb2.data[0].embedding;
      
      // Cosine similarity
      let dotProduct = 0, norm1 = 0, norm2 = 0;
      for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        norm1 += vec1[i] * vec1[i];
        norm2 += vec2[i] * vec2[i];
      }
      
      return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    } catch (error) {
      console.log(`   Note: Embedding similarity failed, using fallback: ${error.message}`);
      // Fallback to Jaccard
      const words1 = new Set(text1.toLowerCase().match(/\w+/g) || []);
      const words2 = new Set(text2.toLowerCase().match(/\w+/g) || []);
      const intersection = new Set([...words1].filter(x => words2.has(x)));
      const union = new Set([...words1, ...words2]);
      return intersection.size / union.size;
    }
  }

  // Check if variant is too similar to previous attempts
  async isTooSimilar(newWrapper, threshold = 0.95) {
    for (const prevWrapper of this.embeddings) {
      const similarity = await this.calculateSimilarity(newWrapper, prevWrapper);
      if (similarity > threshold) {
        console.log(`   ⚠️  Variant too similar to previous (${(similarity * 100).toFixed(1)}%), skipping`);
        return true;
      }
    }
    return false;
  }

  async launch() {
    console.log(`\n🚀 Launching browser...`);
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1400, height: 900 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    console.log(`✓ Browser launched`);
  }

  async createFreshPage() {
    // Close old page if exists
    if (this.page) {
      try {
        await this.page.close();
      } catch (e) {
        console.log(`   Note: Could not close old page: ${e.message}`);
      }
    }
    
    // Check if browser is still connected
    if (this.browser && !this.browser.connected) {
      console.log(`   Browser disconnected, relaunching...`);
      await this.launch();
    }
    
    // Create fresh page
    this.page = await this.browser.newPage();
    await this.page.setRequestInterception(true);
    
    this.page.on('request', request => request.continue());
    
    this.page.on('response', async response => {
      if (response.url().includes('/api/pilot/run-prompt')) {
        try {
          const data = await response.json();
          this.capturedResponse = data;
        } catch (e) {}
      }
    });
    
    // Navigate to dashboard
    await this.page.goto(this.dashboardUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  async getCurrentWrapper() {
    const llmClientPath = path.join(__dirname, '../src/llm-client.js');
    const content = await fs.readFile(llmClientPath, 'utf8');
    
    // Find the start of the return statement with the template literal
    const returnStart = content.indexOf('return `', content.indexOf('function buildMegaGovernanceWrapper'));
    if (returnStart === -1) {
      throw new Error('Could not find return statement in buildMegaGovernanceWrapper');
    }
    
    // Find the end of the template literal (the closing backtick followed by semicolon)
    const templateStart = returnStart + 8; // length of "return `"
    let bracketCount = 0;
    let inTemplate = true;
    let endPos = templateStart;
    
    // Find the matching closing backtick
    for (let i = templateStart; i < content.length; i++) {
      if (content[i] === '`' && content[i-1] !== '\\') {
        endPos = i;
        break;
      }
    }
    
    if (endPos === templateStart) {
      throw new Error('Could not find end of template literal');
    }
    
    const wrapper = content.substring(templateStart, endPos);
    return wrapper;
  }

  async injectWrapper(newWrapper) {
    const llmClientPath = path.join(__dirname, '../src/llm-client.js');
    const content = await fs.readFile(llmClientPath, 'utf8');
    
    // Find positions
    const funcStart = content.indexOf('function buildMegaGovernanceWrapper');
    const returnStart = content.indexOf('return `', funcStart);
    const templateStart = returnStart + 8;
    
    // Find end of template
    let endPos = templateStart;
    for (let i = templateStart; i < content.length; i++) {
      if (content[i] === '`' && content[i-1] !== '\\') {
        endPos = i;
        break;
      }
    }
    
    // Replace the wrapper
    const before = content.substring(0, templateStart);
    const after = content.substring(endPos);
    const newContent = before + newWrapper + after;
    
    await fs.writeFile(llmClientPath, newContent, 'utf8');
    console.log(`   ✓ Injected new wrapper (${newWrapper.length} chars)`);
  }

  generateVariant(baseWrapper, focus = 'rigor', mutationName = null) {
    const mutations = {
      rigor_numbers: {
        description: "Add concrete numbers, thresholds, and ranges",
        type: 'additive',
        instructions: `

━━━ ENHANCED RIGOR REQUIREMENTS ━━━
Your response MUST include specific, concrete details:
1. QUANTIFIED THRESHOLDS: Provide exact numbers (e.g., "timeout after 30 seconds", "max 1000 requests/minute", "retain logs for 90 days")
2. NUMERICAL RANGES: Give min/max bounds (e.g., "between 50-200ms latency", "2-5 replicas", "99.9-99.99% uptime")
3. STANDARD REFERENCES: Cite specific standards with version numbers (e.g., "OAuth 2.0 RFC 6749", "TLS 1.3", "NIST SP 800-53 Rev. 5")
4. CONTROL NUMBERS: Reference exact control IDs (e.g., "AC-2", "AU-12", "SC-7")
5. QUANTIFIED SCENARIOS: Provide failure progression with numbers (e.g., "At 80% capacity, throttle. At 95%, reject. At 100%, circuit break for 60s")
6. PRODUCTION OBSERVABLES: Include measurable metrics (e.g., "p99 latency", "error rate < 0.1%", "CPU usage < 70%")

EXAMPLES OF RIGOROUS RESPONSES:
- "Implement rate limiting with a token bucket: 1000 tokens/min per user, burst of 100, refill rate of 16.67/second"
- "Use exponential backoff: initial delay 100ms, max 30s, multiplier 2.0, with jitter ±20%"
- "Configure circuit breaker: failure threshold 50%, timeout 10s, half-open after 30s, success threshold 3/5 calls"
`
      },
      
      rigor_scenarios: {
        description: "Add detailed failure scenarios with progression",
        type: 'additive',
        instructions: `

━━━ SCENARIO-BASED RIGOR ━━━
For EVERY recommendation, provide:
1. NORMAL OPERATION: Exact behavior under typical load with numbers
2. DEGRADED STATE: What happens at 70-90% capacity - specific symptoms
3. FAILURE MODE: What breaks at >95% - exact failure conditions
4. RECOVERY PATH: Step-by-step restoration with timing (e.g., "1. Drain traffic (30s), 2. Reset state (10s), 3. Gradual ramp-up (5min)")

EXAMPLE:
"Authentication Service:
- Normal: <100ms latency, 1000 QPS, 99.99% success
- Degraded (80% load): 200-500ms latency, enable caching, shed non-critical checks
- Failure (>95%): Return 503, circuit open for 60s, redirect to backup
- Recovery: Clear connection pool (10s), restart with 10% traffic, ramp 10%/min to 100%"
`
      },
      
      integration_flow: {
        description: "Show complete system flow with integration points",
        type: 'additive',
        instructions: `

━━━ INTEGRATION & SYSTEM FLOW ━━━
For EVERY component discussed, explicitly show:
1. UPSTREAM DEPENDENCIES: What calls this? Where does data come from? (e.g., "API Gateway → Load Balancer → Auth Service → Token Store")
2. DOWNSTREAM EFFECTS: What does this call? Where does data go? (e.g., "Auth Service → User DB (read), Audit Log (write), Cache (read/write)")
3. DATA CONTRACTS: Exact payload structures (e.g., "Request: {user_id: UUID, action: string, timestamp: ISO8601}")
4. ERROR PROPAGATION: How failures cascade (e.g., "If User DB fails → Auth Service returns 503 → API Gateway caches last-good token for 5min → Client retries with exponential backoff")
5. INTEGRATION PATTERNS: Specific mechanisms (e.g., "Use sync REST for reads (<100ms), async message queue for writes (eventual consistency)")

EXAMPLE:
"Payment Processing Flow:
1. Client → API Gateway (HTTPS/TLS 1.3) → Payment Service
2. Payment Service → Fraud Check (gRPC, timeout 200ms, fail-open) ✓
3. Payment Service → Payment Provider API (REST, timeout 10s, idempotent with request_id)
4. On success → Event Bus (Kafka) → [Fulfillment, Notification, Analytics]
5. On failure → Retry Queue (3 attempts, exp backoff 1s/2s/4s) → DLQ after exhaustion
6. All steps → Audit Log (async, never blocks main flow)"
`
      },
      
      integration_constraints: {
        description: "Add operational constraints and dependencies",
        type: 'additive',
        instructions: `

━━━ OPERATIONAL INTEGRATION CONSTRAINTS ━━━
Always specify:
1. RESOURCE LIMITS: CPU, memory, network, storage requirements (e.g., "Min 2 CPU cores, 4GB RAM, 10GB disk for logs")
2. SCALING BOUNDS: Min/max instances, scaling triggers (e.g., "Auto-scale 2-20 pods, trigger at 70% CPU, scale-up delay 2min")
3. DEPENDENCY SLAs: Required availability of dependencies (e.g., "Requires User DB 99.9% uptime, Cache 99% (fail-soft), Message Queue 99.99%")
4. NETWORK CONSTRAINTS: Latency budgets, bandwidth (e.g., "Cross-region latency budget 200ms, intra-DC <5ms")
5. DATA CONSISTENCY: CAP trade-offs (e.g., "Prioritize Consistency+Partition tolerance (CP), eventual consistency for reads via cache")
6. COORDINATION: How services discover and communicate (e.g., "Service mesh with Envoy sidecars, mTLS, distributed tracing via OpenTelemetry")

EXAMPLE:
"Audit Logging System Constraints:
- Resources: 1 CPU core, 2GB RAM per instance
- Scaling: 3-15 instances, scale at 1000 events/sec/instance
- Dependencies: Must write to S3 (99.99% SLA) + local buffer (1GB ring)
- If S3 fails: Buffer locally for up to 1hr, alert at 80% buffer
- If buffer fills: Drop low-priority events (DEBUG), always keep CRITICAL
- Network: 10Gbps shared, can burst to 100Gbps for 1 minute
- Consistency: Eventually consistent (async writes), reads may lag 0-60s"
`
      },
      
      balanced_boost: {
        description: "Boost all dimensions while maintaining balance",
        type: 'additive',
        instructions: `

━━━ COMPREHENSIVE GOVERNANCE UPGRADE ━━━

1. RIGOR BOOST:
   • Include 3+ concrete numbers per recommendation
   • Reference 2+ specific standards with versions
   • Provide quantified failure scenarios with exact thresholds
   • Add measurable success criteria (latency, throughput, error rates)

2. INTEGRATION BOOST:
   • Map complete data flow: Client → Gateway → Service → DB → Cache
   • Specify exact integration patterns (sync/async, protocols)
   • Detail error propagation across service boundaries
   • Include resource constraints and scaling limits
   • Show operational dependencies with SLA requirements

3. COHERENCE MAINTENANCE:
   • Start with high-level context before diving into details
   • Use clear sections: Overview → Components → Integration → Operations
   • Link concepts with transitional phrases ("This enables...", "As a result...")
   • Build complexity gradually from simple to advanced

4. EMPATHY MAINTENANCE:
   • Address implementer directly: "You should...", "Consider..."
   • Acknowledge real-world constraints: "If budget is limited...", "For small teams..."
   • Provide decision trees: "If X, then Y; otherwise Z"
   • Offer pragmatic trade-offs with business impact

5. STRICTNESS MAINTENANCE:
   • State all assumptions explicitly: "Assumes AWS environment"
   • List edge cases and how to handle them
   • Quantify uncertainty: "Typically 100ms, but up to 500ms under load"
   • Acknowledge information gaps: "Consult legal team for data residency"
`
      },
      
      // CEILING BREAKERS: Structural mutations
      compress_redundancy: {
        description: "🔥 CEILING BREAKER: Remove redundant patterns",
        type: 'structural',
        transform: (wrapper) => {
          // Find and compress repeated phrases
          const lines = wrapper.split('\n');
          const seen = new Map();
          const compressed = [];
          
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length < 20) {
              compressed.push(line);
              continue;
            }
            
            // Track similar lines (fuzzy matching on first 30 chars)
            const key = trimmed.slice(0, 30);
            const count = seen.get(key) || 0;
            
            // Keep first 2 occurrences, compress rest
            if (count < 2) {
              compressed.push(line);
              seen.set(key, count + 1);
            }
          }
          
          console.log(`   🔥 Compressed ${lines.length - compressed.length} redundant lines`);
          return compressed.join('\n');
        }
      },
      
      extract_to_header: {
        description: "🔥 CEILING BREAKER: Extract common patterns to header",
        type: 'structural',
        transform: (wrapper) => {
          // Extract frequently mentioned concepts to a header
          const header = `

━━━ GOVERNANCE FRAMEWORK HEADER ━━━
Throughout this response, assume these standard practices unless explicitly stated otherwise:
- All latencies in milliseconds unless marked (s)econd/(m)inute
- Availability targets default to 99.9% (adjust per SLA)
- Error budgets: 0.1% for critical, 1% for standard, 5% for best-effort
- Retry patterns: exponential backoff (100ms→30s) with jitter ±20%
- Circuit breakers: 50% failure threshold, 30s cooldown, 5-request half-open test
- Logging: CRITICAL/ERROR/WARN always kept, INFO/DEBUG per retention policy
- Auth: TLS 1.3 minimum, OAuth 2.0/OIDC preferred, mTLS for service-to-service

`;
          
          // Remove now-redundant verbose explanations from body
          let compressed = wrapper
            .replace(/\(e\.g\.,\s*"[^"]{50,}"\)/g, '') // Remove long examples
            .replace(/For example:\s*"[^"]{80,}"/gi, '') // Remove verbose examples
            .replace(/\s{3,}/g, '\n\n'); // Collapse excessive whitespace
          
          console.log(`   🔥 Extracted common patterns to header, saved ~${wrapper.length - compressed.length} chars`);
          return header + compressed;
        }
      },
      
      simplify_examples: {
        description: "🔥 CEILING BREAKER: Replace verbose examples with concise ones",
        type: 'structural',
        transform: (wrapper) => {
          // Replace long examples with shorter equivalents
          let simplified = wrapper
            .replace(/EXAMPLES?:\s*\n[\s\S]{200,}?(?=\n\n|$)/gi, (match) => {
              // Extract first example only, truncate rest
              const firstExample = match.split('\n').slice(0, 3).join('\n');
              return firstExample + '\n(Additional examples omitted for brevity)';
            });
          
          console.log(`   🔥 Simplified examples, saved ~${wrapper.length - simplified.length} chars`);
          return simplified;
        }
      },
      
      consolidate_sections: {
        description: "🔥 CEILING BREAKER: Merge similar instruction blocks",
        type: 'structural',
        transform: (wrapper) => {
          // Find sections with similar headers and merge
          const sections = wrapper.split(/━━━[^━]+━━━/);
          const headers = wrapper.match(/━━━[^━]+━━━/g) || [];
          
          const consolidated = [];
          const used = new Set();
          
          for (let i = 0; i < headers.length; i++) {
            if (used.has(i)) continue;
            
            const header = headers[i];
            let content = sections[i + 1] || '';
            
            // Look for similar headers
            for (let j = i + 1; j < headers.length; j++) {
              if (used.has(j)) continue;
              
              const otherHeader = headers[j];
              const similarity = this.stringSimilarity(header, otherHeader);
              
              if (similarity > 0.5) {
                // Merge similar sections
                content += '\n' + (sections[j + 1] || '');
                used.add(j);
              }
            }
            
            consolidated.push(header + content);
          }
          
          const result = (sections[0] || '') + consolidated.join('');
          console.log(`   🔥 Consolidated ${headers.length} → ${consolidated.length} sections`);
          return result;
        }
      }
    };

    // Use Thompson Sampling if no mutation specified
    if (!mutationName) {
      mutationName = this.selectMutationThompson();
    }
    
    const mutation = mutations[mutationName];
    console.log(`   Mutation: ${mutation.description} [${mutationName}]`);
    
    // Apply structural transformations or additive mutations
    if (mutation.type === 'structural' && mutation.transform) {
      const transformed = mutation.transform(baseWrapper);
      return {
        wrapper: transformed,
        mutationName
      };
    } else {
      // Additive mutation
      return {
        wrapper: baseWrapper + mutation.instructions,
        mutationName
      };
    }
  }
  
  // Helper: Calculate string similarity (for consolidation)
  stringSimilarity(str1, str2) {
    const words1 = new Set(str1.toLowerCase().match(/\w+/g) || []);
    const words2 = new Set(str2.toLowerCase().match(/\w+/g) || []);
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }

  async testWrapper(prompt) {
    this.capturedResponse = null;

    try {
      await this.page.waitForSelector('textarea', { timeout: 10000 });
      
      const textarea = await this.page.$('textarea');
      await textarea.click({ clickCount: 3 });
      await this.page.keyboard.type(prompt);
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        await this.page.select('select', 'gpt-4');
      } catch (e) {}

      const buttons = await this.page.$$('button');
      for (const button of buttons) {
        const text = await this.page.evaluate(el => el.textContent, button);
        if (text && text.includes('Run Prompt')) {
          await button.click();
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          await this.page.waitForFunction(
            () => {
              const buttons = Array.from(document.querySelectorAll('button'));
              const runButton = buttons.find(b => b.textContent.includes('Run Prompt') || b.textContent.includes('Running'));
              return runButton && !runButton.textContent.includes('Running');
            },
            { timeout: 120000 }
          );
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (this.capturedResponse && this.capturedResponse.cries) {
            const cries = this.capturedResponse.cries;
            return {
              overall: cries.Omega,
              coherence: cries.C,
              rigor: cries.R,
              integration: cries.I,
              empathy: cries.E,
              strictness: cries.S
            };
          }
          break;
        }
      }
    } catch (error) {
      console.error(`   Error testing: ${error.message}`);
    }
    
    return null;
  }

  async testWrapperWithPrompts(variantName, progressive = true) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`Testing: ${variantName}`);
    
    // Create fresh page for this test iteration
    await this.createFreshPage();
    
    const results = [];
    
    // Select random subset of prompts to prevent overfitting
    const shuffled = [...TEST_PROMPTS].sort(() => Math.random() - 0.5);
    const selectedPrompts = shuffled.slice(0, this.promptSubsetSize);
    console.log(`   Using ${selectedPrompts.length} random prompts from pool of ${TEST_PROMPTS.length}`);
    
    // Progressive validation: test 1 prompt first
    if (progressive && this.apiCalls < this.apiBudget) {
      console.log(`  [1/1] Quick validation: "${selectedPrompts[0].slice(0, 50)}..."`);
      const quickScore = await this.testWrapper(selectedPrompts[0]);
      this.apiCalls++;
      
      if (quickScore) {
        results.push(quickScore);
        console.log(`     Ω=${quickScore.overall.toFixed(4)} R=${quickScore.rigor.toFixed(4)} I=${quickScore.integration.toFixed(4)}`);
        
        // Early rejection: if first prompt shows regression, skip remaining prompts
        const quickImprovement = quickScore.overall - this.bestScores.overall;
        const rigorImprovement = quickScore.rigor - this.bestScores.rigor;
        const integrationImprovement = quickScore.integration - this.bestScores.integration;
        
        if (quickImprovement < -0.02 || 
            (rigorImprovement < 0 && integrationImprovement < 0)) {
          console.log(`   ⚠️  Early rejection: no improvement on quick validation, saving ${selectedPrompts.length - 1} API calls`);
          return null;
        }
        
        console.log(`   ✓ Quick validation passed, running full test...`);
      } else {
        return null;
      }
    }
    
    // Adaptive dropout: if results degrade mid-test, stop early
    let consecutiveDecreases = 0;
    const startIdx = progressive ? 1 : 0;
    
    for (let i = startIdx; i < selectedPrompts.length; i++) {
      if (this.apiCalls >= this.apiBudget) {
        console.log(`   ⚠️  API budget exhausted (${this.apiCalls}/${this.apiBudget})`);
        break;
      }
      
      console.log(`  [${i+1}/${selectedPrompts.length}] "${selectedPrompts[i].slice(0, 50)}..."`);
      const scores = await this.testWrapper(selectedPrompts[i]);
      this.apiCalls++;
      
      if (scores) {
        results.push(scores);
        console.log(`     Ω=${scores.overall.toFixed(4)} R=${scores.rigor.toFixed(4)} I=${scores.integration.toFixed(4)}`);
        
        // Adaptive dropout: if last 2 prompts both worse than baseline, likely a bad variant
        if (results.length >= 3) {
          const lastTwo = results.slice(-2);
          const allWorse = lastTwo.every(r => r.overall < this.bestScores.overall - 0.01);
          
          if (allWorse) {
            consecutiveDecreases++;
            if (consecutiveDecreases >= 2) {
              console.log(`   ⚠️  Adaptive dropout: consistent degradation, saving ${selectedPrompts.length - i - 1} API calls`);
              break;
            }
          } else {
            consecutiveDecreases = 0;
          }
        }
      }
      
      if (i < selectedPrompts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    if (results.length === 0) {
      return null;
    }
    
    // Calculate averages and variance
    const avg = {
      overall: 0,
      coherence: 0,
      rigor: 0,
      integration: 0,
      empathy: 0,
      strictness: 0
    };
    
    results.forEach(r => {
      Object.keys(avg).forEach(key => avg[key] += r[key]);
    });
    
    Object.keys(avg).forEach(key => avg[key] /= results.length);
    
    // Calculate variance to detect instability
    let variance = 0;
    if (results.length > 1) {
      results.forEach(r => {
        variance += Math.pow(r.overall - avg.overall, 2);
      });
      variance /= results.length;
      avg.variance = variance;
      
      if (variance > 0.05) {
        console.log(`   ⚠️  High variance detected (${variance.toFixed(4)}): results inconsistent across prompts`);
      }
    }
    
    console.log(`   📊 Average (${results.length} prompts): Ω=${avg.overall.toFixed(4)} R=${avg.rigor.toFixed(4)} I=${avg.integration.toFixed(4)}`);
    
    return avg;
  }

  async optimize() {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🎯 ML-ENHANCED WRAPPER OPTIMIZER`);
    console.log(`${'='.repeat(70)}`);
    console.log(`\nBaseline Scores:`);
    console.log(`  Overall Ω: ${BASELINE.overall.toFixed(4)}`);
    console.log(`  Rigor: ${BASELINE.rigor.toFixed(4)} 🎯 TARGET FOR IMPROVEMENT`);
    console.log(`  Integration: ${BASELINE.integration.toFixed(4)} 🎯 TARGET FOR IMPROVEMENT`);
    console.log(`  Coherence: ${BASELINE.coherence.toFixed(4)} (maintain)`);
    console.log(`  Empathy: ${BASELINE.empathy.toFixed(4)} (maintain)`);
    console.log(`  Strictness: ${BASELINE.strictness.toFixed(4)} (maintain)`);
    console.log(`\nStrategy: Thompson Sampling + Progressive Validation + Similarity Detection`);
    console.log(`API Budget: ${this.apiBudget} calls\n`);

    await this.launch();

    // Get initial wrapper
    const baseWrapper = await this.getCurrentWrapper();
    this.bestWrapper = baseWrapper;
    this.embeddings.push(baseWrapper); // Add to similarity tracking
    
    let improvementCount = 0;
    let noImprovementStreak = 0;
    let skippedSimilar = 0;
    
    for (let i = 0; i < this.maxIterations; i++) {
      if (this.apiCalls >= this.apiBudget) {
        console.log(`\n⚠️  API budget exhausted (${this.apiCalls}/${this.apiBudget}). Stopping.`);
        break;
      }
      
      this.iteration = i + 1;
      console.log(`\n${'='.repeat(70)}`);
      console.log(`ITERATION ${this.iteration}/${this.maxIterations} | API calls: ${this.apiCalls}/${this.apiBudget}`);
      console.log(`${'='.repeat(70)}`);
      
      // Determine focus based on what needs improvement most
      let focus = 'balanced';
      if (this.bestScores.rigor < 0.6) focus = 'rigor';
      else if (this.bestScores.integration < 0.7) focus = 'integration';
      
      console.log(`Focus: ${focus}`);
      
      // Check for forced structural mutation (ceiling breaker)
      let selectedMutation = null;
      if (this.forcedNextMutation) {
        selectedMutation = this.forcedNextMutation;
        console.log(`   🔥 FORCED STRUCTURAL MUTATION: ${selectedMutation}`);
        this.forcedNextMutation = null; // Reset
      }
      
      // Generate variant using Thompson Sampling or forced mutation
      const { wrapper: variantWrapper, mutationName } = this.generateVariant(
        this.bestWrapper, 
        focus, 
        selectedMutation
      );
      
      // Anti-bloat: reject wrappers that exceed max length
      if (variantWrapper.length > this.maxWrapperLength) {
        console.log(`   ⚠️  Wrapper too long (${variantWrapper.length} > ${this.maxWrapperLength}), penalizing ${mutationName}`);
        this.updateMutationStats(mutationName, false, -0.2);
        continue;
      }
      
      // Check similarity to avoid redundant tests
      const tooSimilar = await this.isTooSimilar(variantWrapper);
      if (tooSimilar) {
        skippedSimilar++;
        console.log(`   Skipped, trying next mutation...`);
        
        // Update mutation stats with penalty
        this.updateMutationStats(mutationName, false, -0.1);
        continue;
      }
      
      this.embeddings.push(variantWrapper);
      await this.injectWrapper(variantWrapper);
      
      // Test variant with progressive validation
      const scores = await this.testWrapperWithPrompts(`iteration-${this.iteration}`, true);
      
      if (!scores) {
        console.log(`⚠️  Failed to get scores, reverting...`);
        await this.injectWrapper(this.bestWrapper);
        
        // Update mutation stats with failure
        this.updateMutationStats(mutationName, false, -0.05);
        continue;
      }
      
      // Compare to best
      console.log(`\n  Results:`);
      console.log(`    Overall Ω: ${scores.overall.toFixed(4)} (best: ${this.bestScores.overall.toFixed(4)}, Δ${(scores.overall - this.bestScores.overall > 0 ? '+' : '')}${(scores.overall - this.bestScores.overall).toFixed(4)})`);
      console.log(`    Rigor:     ${scores.rigor.toFixed(4)} (best: ${this.bestScores.rigor.toFixed(4)}, Δ${(scores.rigor - this.bestScores.rigor > 0 ? '+' : '')}${(scores.rigor - this.bestScores.rigor).toFixed(4)})`);
      console.log(`    Integration: ${scores.integration.toFixed(4)} (best: ${this.bestScores.integration.toFixed(4)}, Δ${(scores.integration - this.bestScores.integration > 0 ? '+' : '')}${(scores.integration - this.bestScores.integration).toFixed(4)})`);
      console.log(`    Coherence: ${scores.coherence.toFixed(4)} (Δ${(scores.coherence - this.bestScores.coherence > 0 ? '+' : '')}${(scores.coherence - this.bestScores.coherence).toFixed(4)})`);
      console.log(`    Empathy:   ${scores.empathy.toFixed(4)} (Δ${(scores.empathy - this.bestScores.empathy > 0 ? '+' : '')}${(scores.empathy - this.bestScores.empathy).toFixed(4)})`);
      console.log(`    Strictness: ${scores.strictness.toFixed(4)} (Δ${(scores.strictness - this.bestScores.strictness > 0 ? '+' : '')}${(scores.strictness - this.bestScores.strictness).toFixed(4)})`);
      
      // Check if this is an improvement
      const improvements = {
        overall: scores.overall - this.bestScores.overall,
        rigor: scores.rigor - this.bestScores.rigor,
        integration: scores.integration - this.bestScores.integration
      };
      
      // Calculate reward for ML learning
      let reward = improvements.overall + 
                     improvements.rigor * 1.5 +  // Weight rigor more
                     improvements.integration * 1.5; // Weight integration more
      
      // AGGRESSIVE length penalty (exponential beyond soft limit)
      let lengthPenalty = 0;
      if (variantWrapper.length > this.softLengthLimit) {
        const overage = variantWrapper.length - this.softLengthLimit;
        const softRange = this.hardLengthLimit - this.softLengthLimit;
        const penaltyFactor = Math.pow(overage / softRange, 2); // Quadratic penalty
        lengthPenalty = penaltyFactor * this.lengthPenaltyStrength;
      }
      reward -= lengthPenalty;
      
      // Penalty for high variance (instability)
      const variance = scores.variance || 0;
      const variancePenalty = variance * 2; // Penalize inconsistent results
      reward -= variancePenalty;
      
      if (lengthPenalty > 0) {
        console.log(`   ⚠️  Length penalty: -${lengthPenalty.toFixed(4)} (wrapper: ${variantWrapper.length} chars, overage: ${variantWrapper.length - this.softLengthLimit})`);
      }
      if (variancePenalty > 0) {
        console.log(`   ⚠️  Variance penalty: -${variancePenalty.toFixed(4)} (σ²: ${variance.toFixed(4)})`);
      }
      
      // Length explosion warning
      if (variantWrapper.length > this.pruningThreshold) {
        console.log(`   🔥 LENGTH EXPLOSION WARNING: ${variantWrapper.length} chars (threshold: ${this.pruningThreshold})`);
        console.log(`   💡 Consider manual pruning or re-architecting after this run`);
      }
      
      const noDegradation = 
        scores.coherence >= this.bestScores.coherence - 0.02 &&
        scores.empathy >= this.bestScores.empathy - 0.02 &&
        scores.strictness >= this.bestScores.strictness - 0.02;
      
      const hasImprovement = 
        (improvements.rigor > 0.01 || improvements.integration > 0.01) &&
        improvements.overall >= -0.01;
      
      if (hasImprovement && noDegradation) {
        console.log(`\n  ✅ IMPROVEMENT FOUND! Keeping this variant.`);
        this.bestScores = scores;
        this.bestWrapper = variantWrapper;
        improvementCount++;
        noImprovementStreak = 0;
        
        // Update mutation stats with success
        this.updateMutationStats(mutationName, true, reward, variance);
        
        this.history.push({
          iteration: this.iteration,
          scores,
          improvements,
          mutationName,
          reward,
          wrapperLength: variantWrapper.length,
          variance,
          kept: true
        });
      } else {
        console.log(`\n  ❌ No improvement or degradation detected. Reverting.`);
        await this.injectWrapper(this.bestWrapper);
        noImprovementStreak++;
        
        // Update mutation stats with failure but small reward if close
        this.updateMutationStats(mutationName, false, Math.max(reward * 0.3, -0.05), variance);
        
        this.history.push({
          iteration: this.iteration,
          scores,
          improvements,
          mutationName,
          reward,
          wrapperLength: variantWrapper.length,
          variance,
          kept: false
        });
      }
      
      // Early stopping if no improvement for 5 iterations
      if (noImprovementStreak >= 5) {
        console.log(`\n⚠️  No improvements for 5 iterations. Stopping early.`);
        break;
      }
      
      // CEILING DETECTION & BREAKTHROUGH
      // If plateau detected AND wrapper is large, force structural mutation
      if (noImprovementStreak >= 3 && this.bestWrapper.length > 2500) {
        console.log(`\n🔥 CEILING DETECTED: Plateau + large wrapper (${this.bestWrapper.length} chars)`);
        console.log(`   Attempting STRUCTURAL BREAKTHROUGH on next iteration...`);
        console.log(`   Available: compress_redundancy, extract_to_header, simplify_examples, consolidate_sections`);
      }
      
      // Force structural mutation if stuck at plateau
      if (noImprovementStreak >= 4 && this.bestWrapper.length > this.softLengthLimit) {
        const structuralMutations = [
          'compress_redundancy',
          'extract_to_header', 
          'simplify_examples',
          'consolidate_sections'
        ];
        
        // Check if we've tried structural mutations recently
        const recentStructural = this.history.slice(-3).filter(h => 
          structuralMutations.includes(h.mutationName)
        ).length;
        
        if (recentStructural === 0) {
          console.log(`\n🔥 FORCED BREAKTHROUGH: Injecting structural mutation to break ceiling`);
          const forcedMutation = structuralMutations[Math.floor(Math.random() * structuralMutations.length)];
          
          // Override next iteration's mutation selection
          this.forcedNextMutation = forcedMutation;
        }
      }
    }
    
    console.log(`\n📊 ML Stats:`);
    console.log(`  Total iterations: ${this.iteration}`);
    console.log(`  API calls used: ${this.apiCalls}/${this.apiBudget}`);
    console.log(`  API calls saved: ~${skippedSimilar * 2 + (this.iteration - this.apiCalls)}`);
    console.log(`  Improvements kept: ${improvementCount}`);
    console.log(`  Similarity skips: ${skippedSimilar}`);
    console.log(`  Final wrapper length: ${this.bestWrapper.length} chars`);
    
    // Mutation diversity check
    const usedMutations = Array.from(this.mutationStats.values()).filter(s => s.count > 0).length;
    const totalMutations = this.mutationStats.size;
    console.log(`  Mutation diversity: ${usedMutations}/${totalMutations} types explored`);
    
    if (usedMutations < totalMutations) {
      const unused = Array.from(this.mutationStats.entries())
        .filter(([_, s]) => s.count === 0)
        .map(([name, _]) => name);
      console.log(`  ⚠️  Unexplored mutations: ${unused.join(', ')}`);
      console.log(`     Possible bandit starvation - consider more iterations`);
    }
    
    // Warning if plateau detected
    if (noImprovementStreak >= 3) {
      console.log(`\n⚠️  LOCAL OPTIMUM LIKELY REACHED`);
      console.log(`   Current approach: local mutations only`);
      console.log(`   Consider: manual restructuring for global optimization`);
    }
    
    // Length explosion check
    if (this.bestWrapper.length > this.pruningThreshold) {
      console.log(`\n🔥 LENGTH EXPLOSION DETECTED`);
      console.log(`   Current: ${this.bestWrapper.length} chars`);
      console.log(`   Threshold: ${this.pruningThreshold} chars`);
      console.log(`   ⚠️  CRITICAL: Manual pruning recommended before next run`);
      console.log(`   📋 Suggestions:`);
      console.log(`      1. Remove redundant examples`);
      console.log(`      2. Consolidate similar sections`);
      console.log(`      3. Extract repeated patterns to header`);
      console.log(`      4. Use references instead of repeating concepts`);
    }
    
    await this.generateReport();
    
    console.log(`\n👋 Closing browser in 5 seconds...`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    await this.browser.close();
  }

  async generateReport() {
    console.log(`\n\n${'='.repeat(70)}`);
    console.log(`📊 OPTIMIZATION COMPLETE`);
    console.log(`${'='.repeat(70)}\n`);
    
    console.log(`Iterations completed: ${this.iteration}`);
    console.log(`Improvements kept: ${this.history.filter(h => h.kept).length}`);
    console.log(`API calls used: ${this.apiCalls}/${this.apiBudget}`);
    
    const baselineCalls = this.iteration * TEST_PROMPTS.length;
    const savedCalls = baselineCalls - this.apiCalls;
    const savingsPercent = (savedCalls / baselineCalls * 100).toFixed(1);
    console.log(`API savings: ${savedCalls} calls (${savingsPercent}% reduction via ML)`);
    
    console.log(`\n🧠 ML Learning Stats:`);
    for (const [mutation, stats] of this.mutationStats.entries()) {
      const successRate = (stats.successes / (stats.successes + stats.failures) * 100).toFixed(1);
      const avgReward = (stats.totalReward / (stats.successes + stats.failures)).toFixed(3);
      console.log(`  ${mutation}: ${successRate}% success, avg reward ${avgReward}`);
    }
    
    console.log(`\n🎯 Final Scores vs Baseline:`);
    console.log(`  Overall Ω:   ${this.bestScores.overall.toFixed(4)} (was ${BASELINE.overall.toFixed(4)}, ${this.bestScores.overall > BASELINE.overall ? '↑' : '↓'}${Math.abs(this.bestScores.overall - BASELINE.overall).toFixed(4)})`);
    console.log(`  Rigor:       ${this.bestScores.rigor.toFixed(4)} (was ${BASELINE.rigor.toFixed(4)}, ${this.bestScores.rigor > BASELINE.rigor ? '↑' : '↓'}${Math.abs(this.bestScores.rigor - BASELINE.rigor).toFixed(4)})`);
    console.log(`  Integration: ${this.bestScores.integration.toFixed(4)} (was ${BASELINE.integration.toFixed(4)}, ${this.bestScores.integration > BASELINE.integration ? '↑' : '↓'}${Math.abs(this.bestScores.integration - BASELINE.integration).toFixed(4)})`);
    console.log(`  Coherence:   ${this.bestScores.coherence.toFixed(4)} (was ${BASELINE.coherence.toFixed(4)}, ${this.bestScores.coherence > BASELINE.coherence ? '↑' : '↓'}${Math.abs(this.bestScores.coherence - BASELINE.coherence).toFixed(4)})`);
    console.log(`  Empathy:     ${this.bestScores.empathy.toFixed(4)} (was ${BASELINE.empathy.toFixed(4)}, ${this.bestScores.empathy > BASELINE.empathy ? '↑' : '↓'}${Math.abs(this.bestScores.empathy - BASELINE.empathy).toFixed(4)})`);
    console.log(`  Strictness:  ${this.bestScores.strictness.toFixed(4)} (was ${BASELINE.strictness.toFixed(4)}, ${this.bestScores.strictness > BASELINE.strictness ? '↑' : '↓'}${Math.abs(this.bestScores.strictness - BASELINE.strictness).toFixed(4)})`);
    
    // Save markdown report
    await this.saveMarkdownReport();
  }

  async saveMarkdownReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `OPTIMIZATION_RESULTS_${timestamp}.md`;
    const filepath = path.join(__dirname, '../', filename);
    
    let markdown = `# ML-Enhanced Iterative Wrapper Optimization Results\n\n`;
    markdown += `**Date:** ${new Date().toISOString()}\n`;
    markdown += `**Iterations:** ${this.iteration}\n`;
    markdown += `**Improvements Kept:** ${this.history.filter(h => h.kept).length}\n`;
    markdown += `**Test Prompts:** ${TEST_PROMPTS.length} (same 3 prompts each iteration)\n\n`;
    
    markdown += `## ML Efficiency\n\n`;
    const baselineCalls = this.iteration * TEST_PROMPTS.length;
    const savedCalls = baselineCalls - this.apiCalls;
    const savingsPercent = (savedCalls / baselineCalls * 100).toFixed(1);
    markdown += `- **API Calls Used:** ${this.apiCalls}/${this.apiBudget}\n`;
    markdown += `- **API Calls Saved:** ${savedCalls} (${savingsPercent}% reduction)\n`;
    markdown += `- **Cost Estimate:** ~$${(this.apiCalls * 0.04).toFixed(2)} (vs $${(baselineCalls * 0.04).toFixed(2)} baseline)\n\n`;
    
    markdown += `### Thompson Sampling Learning\n\n`;
    markdown += `| Mutation Type | Success Rate | Avg Reward | Times Selected |\n`;
    markdown += `|---------------|--------------|------------|----------------|\n`;
    for (const [mutation, stats] of this.mutationStats.entries()) {
      const successRate = (stats.successes / (stats.successes + stats.failures) * 100).toFixed(1);
      const avgReward = (stats.totalReward / (stats.successes + stats.failures)).toFixed(3);
      const totalSelected = stats.successes + stats.failures;
      markdown += `| ${mutation} | ${successRate}% | ${avgReward} | ${totalSelected} |\n`;
    }
    markdown += `\n`;
    
    markdown += `## Final Results\n\n`;
    markdown += `| Metric | Baseline | Final | Change |\n`;
    markdown += `|--------|----------|-------|--------|\n`;
    markdown += `| Overall Ω | ${BASELINE.overall.toFixed(4)} | ${this.bestScores.overall.toFixed(4)} | ${this.bestScores.overall > BASELINE.overall ? '↑' : '↓'}${Math.abs(this.bestScores.overall - BASELINE.overall).toFixed(4)} |\n`;
    markdown += `| Rigor | ${BASELINE.rigor.toFixed(4)} | ${this.bestScores.rigor.toFixed(4)} | ${this.bestScores.rigor > BASELINE.rigor ? '↑' : '↓'}${Math.abs(this.bestScores.rigor - BASELINE.rigor).toFixed(4)} |\n`;
    markdown += `| Integration | ${BASELINE.integration.toFixed(4)} | ${this.bestScores.integration.toFixed(4)} | ${this.bestScores.integration > BASELINE.integration ? '↑' : '↓'}${Math.abs(this.bestScores.integration - BASELINE.integration).toFixed(4)} |\n`;
    markdown += `| Coherence | ${BASELINE.coherence.toFixed(4)} | ${this.bestScores.coherence.toFixed(4)} | ${this.bestScores.coherence > BASELINE.coherence ? '↑' : '↓'}${Math.abs(this.bestScores.coherence - BASELINE.coherence).toFixed(4)} |\n`;
    markdown += `| Empathy | ${BASELINE.empathy.toFixed(4)} | ${this.bestScores.empathy.toFixed(4)} | ${this.bestScores.empathy > BASELINE.empathy ? '↑' : '↓'}${Math.abs(this.bestScores.empathy - BASELINE.empathy).toFixed(4)} |\n`;
    markdown += `| Strictness | ${BASELINE.strictness.toFixed(4)} | ${this.bestScores.strictness.toFixed(4)} | ${this.bestScores.strictness > BASELINE.strictness ? '↑' : '↓'}${Math.abs(this.bestScores.strictness - BASELINE.strictness).toFixed(4)} |\n\n`;
    
    markdown += `## Iteration History\n\n`;
    markdown += `| Iter | Mutation | Ω | R | I | C | E | S | Reward | Length | Var | Status |\n`;
    markdown += `|------|----------|---|---|---|---|---|---|--------|--------|-----|--------|\n`;
    
    this.history.forEach(h => {
      const mutationShort = h.mutationName ? h.mutationName.replace('_', ' ') : 'n/a';
      const rewardStr = h.reward !== undefined ? h.reward.toFixed(2) : 'n/a';
      const lengthStr = h.wrapperLength ? `${h.wrapperLength}` : 'n/a';
      const varStr = h.variance !== undefined ? h.variance.toFixed(4) : 'n/a';
      markdown += `| ${h.iteration} | ${mutationShort} | ${h.scores.overall.toFixed(3)} | ${h.scores.rigor.toFixed(3)} | ${h.scores.integration.toFixed(3)} | ${h.scores.coherence.toFixed(3)} | ${h.scores.empathy.toFixed(3)} | ${h.scores.strictness.toFixed(3)} | ${rewardStr} | ${lengthStr} | ${varStr} | ${h.kept ? '✅ Kept' : '❌ Reverted'} |\n`;
    });
    
    markdown += `\n## Conclusion\n\n`;
    
    const rigorImprovement = ((this.bestScores.rigor - BASELINE.rigor) / BASELINE.rigor * 100);
    const integrationImprovement = ((this.bestScores.integration - BASELINE.integration) / BASELINE.integration * 100);
    
    if (rigorImprovement > 5 || integrationImprovement > 5) {
      markdown += `✅ **Optimization successful!** Significant improvements achieved.\n\n`;
    } else if (rigorImprovement > 0 || integrationImprovement > 0) {
      markdown += `⚠️ **Modest improvements achieved.** Consider additional iterations.\n\n`;
    } else {
      markdown += `❌ **No significant improvement.** Current wrapper may be locally optimal.\n\n`;
    }
    
    markdown += `Key Findings:\n`;
    markdown += `- Rigor improved by ${rigorImprovement.toFixed(1)}%\n`;
    markdown += `- Integration improved by ${integrationImprovement.toFixed(1)}%\n`;
    markdown += `- ${this.history.filter(h => h.kept).length} variants kept out of ${this.iteration} tested\n`;
    markdown += `- ML optimizations saved ${savedCalls} API calls (${savingsPercent}% reduction)\n`;
    markdown += `- Estimated cost savings: $${((baselineCalls - this.apiCalls) * 0.04).toFixed(2)}\n\n`;
    
    markdown += `### ML Insights\n\n`;
    
    // Find best mutation
    let bestMutation = null;
    let bestSuccessRate = 0;
    for (const [mutation, stats] of this.mutationStats.entries()) {
      const rate = stats.successes / (stats.successes + stats.failures);
      if (rate > bestSuccessRate) {
        bestSuccessRate = rate;
        bestMutation = mutation;
      }
    }
    
    if (bestMutation) {
      markdown += `- **Most Effective Mutation:** ${bestMutation} (${(bestSuccessRate * 100).toFixed(1)}% success rate)\n`;
    }
    
    // Mutation diversity analysis
    const usedMutations = Array.from(this.mutationStats.values()).filter(s => s.count > 0).length;
    const totalMutations = this.mutationStats.size;
    markdown += `- **Mutation Diversity:** ${usedMutations}/${totalMutations} types explored\n`;
    
    if (usedMutations < totalMutations) {
      const unused = Array.from(this.mutationStats.entries())
        .filter(([_, s]) => s.count === 0)
        .map(([name, _]) => name);
      markdown += `  - ⚠️ **Unexplored:** ${unused.join(', ')} (possible bandit starvation)\n`;
    }
    
    markdown += `- **Progressive Validation:** Early rejection saved ~${savedCalls} API calls\n`;
    markdown += `- **Thompson Sampling:** Learned to prefer high-reward mutations\n`;
    markdown += `- **Adaptive Prompting:** Used ${this.promptSubsetSize} random prompts per iteration to prevent overfitting\n`;
    markdown += `- **Anti-Bloat:** Max wrapper length enforced at ${this.maxWrapperLength} chars\n\n`;
    
    markdown += `### Limitations Acknowledged\n\n`;
    markdown += `1. **CRIES Metric Noise Floor:** Unavoidable model variance creates measurement ceiling\n`;
    markdown += `2. **Compression Trade-offs:** Structural mutations may sacrifice specificity for brevity\n`;
    markdown += `3. **Model Variance:** Random GPT-4 spikes may cause false negatives in mutation learning\n`;
    markdown += `4. **Overfitting Risk:** Mitigated by using ${TEST_PROMPTS.length} diverse prompts with random ${this.promptSubsetSize}-prompt subsets\n`;
    markdown += `5. **Bandit Starvation:** Mitigated via forced exploration (30% chance) + anti-starvation bonuses\n`;
    markdown += `6. **Breakthrough Timing:** Forced after 4 plateaus - may be too early/late for specific cases\n\n`;
    
    markdown += `### Ceiling Breakers Applied\n\n`;
    const structuralMutations = ['compress_redundancy', 'extract_to_header', 'simplify_examples', 'consolidate_sections'];
    const structuralUsed = this.history.filter(h => structuralMutations.includes(h.mutationName));
    
    if (structuralUsed.length > 0) {
      markdown += `**Structural Mutations Attempted:** ${structuralUsed.length}\n\n`;
      structuralUsed.forEach(h => {
        markdown += `- Iteration ${h.iteration}: ${h.mutationName} (${h.kept ? '✅ Kept' : '❌ Reverted'})\n`;
      });
      markdown += `\n`;
    } else {
      markdown += `**No structural mutations attempted** - plateau not reached or wrapper still small\n\n`;
    }
    
    // Critical warnings
    if (this.bestWrapper.length > this.pruningThreshold) {
      markdown += `### ⚠️ CRITICAL WARNINGS\n\n`;
      markdown += `**LENGTH EXPLOSION DETECTED**\n\n`;
      markdown += `Current wrapper: ${this.bestWrapper.length} chars (threshold: ${this.pruningThreshold})\n\n`;
      markdown += `**Action Required Before Next Run:**\n`;
      markdown += `1. Manually review and prune redundant sections\n`;
      markdown += `2. Consolidate repetitive examples\n`;
      markdown += `3. Extract common patterns to wrapper header\n`;
      markdown += `4. Consider architectural refactoring\n\n`;
      markdown += `**Why This Matters:**\n`;
      markdown += `- Coherence degrades >3500 chars\n`;
      markdown += `- Empathy drops with verbosity\n`;
      markdown += `- Integration becomes unreliable >4000 chars\n`;
      markdown += `- Rigor measurements get noisier\n`;
      markdown += `- Further optimization becomes unstable\n\n`;
    }
    
    markdown += `---\n\n`;
    markdown += `*Generated by ML-Enhanced Iterative Wrapper Optimizer*\n`;
    markdown += `*Timestamp: ${new Date().toISOString()}*\n`;
    
    await fs.writeFile(filepath, markdown, 'utf8');
    console.log(`\n📄 Report saved: ${filename}`);
    console.log(`${'='.repeat(70)}\n`);
  }
}

// Parse args
const args = process.argv.slice(2);
const iterationsIndex = args.indexOf('--iterations');
const urlIndex = args.indexOf('--url');
const budgetIndex = args.indexOf('--budget');
const promptsIndex = args.indexOf('--prompts');
const maxLengthIndex = args.indexOf('--max-length');
const lengthPenaltyIndex = args.indexOf('--length-penalty');

const iterations = iterationsIndex >= 0 ? parseInt(args[iterationsIndex + 1]) : 20;
const url = urlIndex >= 0 ? args[urlIndex + 1] : 'http://localhost:3000/pilot';
const budget = budgetIndex >= 0 ? parseInt(args[budgetIndex + 1]) : 100;
const promptSubset = promptsIndex >= 0 ? parseInt(args[promptsIndex + 1]) : 5;
const maxLength = maxLengthIndex >= 0 ? parseInt(args[maxLengthIndex + 1]) : 4000;
const lengthPenalty = lengthPenaltyIndex >= 0 ? parseFloat(args[lengthPenaltyIndex + 1]) : 0.2;

// Run
const optimizer = new IterativeOptimizer({ 
  iterations, 
  url, 
  budget,
  promptSubset,
  maxLength,
  lengthPenalty
});

optimizer.optimize().catch(err => {
  console.error(`\n❌ Optimization failed:`, err);
  process.exit(1);
});
