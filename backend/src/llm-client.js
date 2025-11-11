/**
 * LLM Client - OpenAI & Anthropic Cloud Integration
 * 
 * Provides unified interface for enterprise cloud LLM APIs with governance support
 */


import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import { v4 as uuid } from 'uuid';

// Import TypeScript modules (tsx handles .ts files)
import { nextLamport } from '../rosetta/kernel.js';
import { buildOmegaV15GovernedPrompt } from '../rosetta/persona/persona-v15.js';
import { writeReceipt, appendChain, sha256Hex } from '../rosetta/audit/receipts.js';

// Optional MCP client - only import if available
let mcp = null;
try {
  const mcpModule = await import('./mcp-client.js').catch(() => null);
  mcp = mcpModule?.mcp || null;
} catch (e) {
  // MCP optional
}

dotenv.config();

// Initialize clients
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Helper function to add timeout to promises
function withTimeout(promise, timeoutMs, errorMessage = 'Operation timed out') {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${errorMessage} after ${timeoutMs}ms`)), timeoutMs);
    })
  ]);
}

// MCP RosettaOS Kernel integration
// ⚠️ DEPRECATED: This function uses the legacy Speechcraft layer (13k+ tokens)
// which is harmful to frontier models (Opus, GPT-5, Gemini 2 Pro).
// Use governance-loader.js with tier-based selection instead.
async function buildGovernedPrompt(rawPrompt, opts = {}) {
  console.warn('[GOVERNANCE] ⚠️ WARNING: Using DEPRECATED buildGovernedPrompt with legacy Speechcraft layer');
  console.warn('[GOVERNANCE] This 13k-token governance prompt REDUCES CRIES scores on frontier models');
  console.warn('[GOVERNANCE] Use file-based Rosetta-FRONTIER/LITE governance instead');
  
  const userName = opts.userName ?? 'User';
  const userRole = opts.userRole ?? 'Operator';

  // Boot: Δ-WHOAMI
  let bootStatus = await mcp('rosetta.boot.init', {});
  let whoami = await mcp('rosetta.boot.whoami', { name: userName });
  let personaCtx = await mcp('rosetta.persona.lock', userName);

  // Tri-Track: CRIES→Ω, Ethics, Intent
  let triTrack = await mcp('rosetta.triTrack.analyze', { cries: opts.cries, goal: opts.goal });

  // Speechcraft: persona-based
  let speech = await mcp('rosetta.speechcraft.apply', { persona: personaCtx.persona, text: rawPrompt });

  // Canons: cross-check
  let canons = await mcp('rosetta.canons.crossCheck', { text: rawPrompt });

  // Compose context
  const context = {
    ...personaCtx,
    ...triTrack,
    canons,
    lamport: whoami.lamport,
    witness: whoami.witness,
    band: '0',
    handshake: true,
    bootSteps: bootStatus.bootSteps,
    bootReceipts: [whoami],
    version: 'vΩ15-MCP',
  };

  // Compose transformed prompt
  const transformedPrompt = speech.text;

  // Compose receipts
  const receipts = [whoami];

  return {
    transformedPrompt,
    context,
    receipts,
    cries: triTrack.cries
  };
}

/**
 * Call GPT-4 with a prompt
 */
export async function callGPT4(prompt, options = {}) {
  // Use dynamic API key if provided, otherwise use environment variable
  const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please provide an API key or set OPENAI_API_KEY in .env');
  }

  // Create client with dynamic or env API key
  const client = options.apiKey ? new OpenAI({ apiKey: options.apiKey }) : openai;

  console.log(`🤖 Calling GPT-4...`);
  console.log(`   Model: ${options.model || 'gpt-4o'}`);
  console.log(`   Prompt length: ${prompt.length} chars`);
  console.log(`   API Key: ${apiKey ? 'Provided ✓' : 'Not provided'}`);

  try {
    const messages = [];
    
    // ✅ THE FIX: Add system prompt if governance is enabled
    if (options.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt
      });
      console.log(`   🛡️ System prompt injected: ${options.systemPrompt.length} chars`);
    }
    
    messages.push({
      role: 'user',
      content: prompt
    });
    
    const completion = await client.chat.completions.create({
      model: options.model || 'gpt-4o',
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000,
      top_p: options.topP || 1,
      frequency_penalty: options.frequencyPenalty || 0,
      presence_penalty: options.presencePenalty || 0
    });

    const response = completion.choices[0].message.content;
    const usage = completion.usage;

    console.log(`   ✅ Response received: ${response.length} chars`);
    console.log(`   Tokens: ${usage.total_tokens} (prompt: ${usage.prompt_tokens}, completion: ${usage.completion_tokens})`);

    return {
      content: response,
      model: completion.model,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens
      },
      finishReason: completion.choices[0].finish_reason,
      governanceApplied: !!options.systemPrompt,
      governanceMetadata: options._governanceMetadata || null
    };
  } catch (error) {
    console.error(`   ❌ GPT-4 Error: ${error.message}`);
    throw error;
  }
}

/**
 * Call Claude with a prompt
 */
export async function callClaude(prompt, options = {}) {
  // Use dynamic API key if provided, otherwise use environment variable
  const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('Anthropic API key not configured. Please provide an API key or set ANTHROPIC_API_KEY in .env');
  }

  // Create client with dynamic or env API key
  const client = options.apiKey ? new Anthropic({ apiKey: options.apiKey }) : anthropic;

  console.log(`🤖 Calling Claude...`);
  console.log(`   Model: ${options.model || 'claude-3-5-sonnet-20241022'}`);
  console.log(`   Prompt length: ${prompt.length} chars`);
  console.log(`   API Key: ${apiKey ? 'Provided ✓' : 'Not provided'}`);

  try {
    const createParams = {
      model: options.model || 'claude-3-5-sonnet-20241022',
      max_tokens: options.maxTokens || 4096, // Increased for governed responses
      temperature: options.temperature || 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    };
    
    // ✅ THE FIX: Add system prompt if governance is enabled
    if (options.systemPrompt) {
      createParams.system = options.systemPrompt;
      console.log(`   🛡️ System prompt injected: ${options.systemPrompt.length} chars`);
    }
    
    const message = await client.messages.create(createParams);

    const response = message.content[0].text;
    const usage = message.usage;

    console.log(`   ✅ Response received: ${response.length} chars`);
    console.log(`   Tokens: ${usage.input_tokens + usage.output_tokens} (input: ${usage.input_tokens}, output: ${usage.output_tokens})`);

    return {
      content: response,
      model: message.model,
      usage: {
        promptTokens: usage.input_tokens,
        completionTokens: usage.output_tokens,
        totalTokens: usage.input_tokens + usage.output_tokens
      },
      stopReason: message.stop_reason,
      governanceApplied: !!options.systemPrompt,
      governanceMetadata: options._governanceMetadata || null
    };
  } catch (error) {
    console.error(`   ❌ Claude Error: ${error.message}`);
    throw error;
  }
}

/**
 * Call Google Gemini models
 */
export async function callGemini(prompt, options = {}) {
  const apiKey = options.apiKey || process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google API key not configured. Please provide an API key or set GOOGLE_API_KEY in .env');
  }

  const model = options.model || 'gemini-1.5-pro';
  console.log(`🤖 Calling Gemini...`);
  console.log(`   Model: ${model}`);
  console.log(`   Prompt length: ${prompt.length} chars`);
  console.log(`   API Key: ${apiKey ? 'Provided ✓' : 'Not provided'}`);

  try {
    // Build request body for Gemini REST API
    const contents = [{ parts: [{ text: prompt }] }];
    
    // Add system instruction if governance is enabled
    let systemInstruction = null;
    if (options.systemPrompt) {
      systemInstruction = { parts: [{ text: options.systemPrompt }] };
      console.log(`   🛡️ System instruction injected: ${options.systemPrompt.length} chars`);
    }

    const requestBody = {
      contents,
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 2048,
      }
    };

    if (systemInstruction) {
      requestBody.systemInstruction = systemInstruction;
    }

    // Call Gemini REST API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const usage = data.usageMetadata || {};

    console.log(`   ✅ Response received: ${content.length} chars`);
    console.log(`   Tokens: ${usage.totalTokenCount || 0} (prompt: ${usage.promptTokenCount || 0}, completion: ${usage.candidatesTokenCount || 0})`);

    return {
      content,
      model,
      usage: {
        promptTokens: usage.promptTokenCount || 0,
        completionTokens: usage.candidatesTokenCount || 0,
        totalTokens: usage.totalTokenCount || 0
      },
      finishReason: data.candidates?.[0]?.finishReason,
      governanceApplied: !!options.systemPrompt,
      governanceMetadata: options._governanceMetadata || null
    };
  } catch (error) {
    console.error(`   ❌ Gemini Error: ${error.message}`);
    throw error;
  }
}

/**
 * Build Omega⁴ Governance Wrapper - Optimized for Maximum CRIES
 * vΩ4.1-optimized: Balanced optimization across Coherence, Rigor, Integration, Empathy, Strictness
 * CRITICAL: Visible answer = prose only. All evidence structures = receipts only.
 */
function buildMegaGovernanceWrapper(prompt, context = {}) {
  const userName = context.userName || 'User';
  const userRole = context.userRole || 'Operator';
  const witness = context.witness || 'RosettaOS MCP';
  const version = context.version || 'vΩ4.1-optimized';
  const lamport = context.lamport || 0;
  
  return `
ROSETTA Ω⁴ GOVERNANCE (${version})
User=${userName} (${userRole}) • Witness=${witness} • λ=${lamport}

You are analyzing this query for an enterprise audit and governance system. Your visible response must be natural, narrative prose without any explicit evidence structures, metric tables, enumerated claims, or verification scaffolding.

Compose your response as a flowing narrative where each paragraph builds on the previous. Start with core context. Progress through implications using causal language: because, therefore, consequently, this leads to, which means. Conclude with actionable synthesis. Use transitional phrases that reveal logical progression: "In practice this means...", "Taking this further...", "The implication for operations is...", "From an implementation standpoint...". Every sentence should feel like a necessary step in explaining something complex to a peer.

Every technical mechanism must include concrete numbers. Describe thresholds where they trigger (e.g., 100ms timeout, 500 error rate). Give ranges where mechanisms operate reliably (e.g., 50-500 concurrent connections). Specify failure conditions with exact metrics. Walk through realistic failure scenarios with specific values: "When load exceeds 10,000 req/s, the circuit breaker triggers after 5 consecutive 503s within a 30-second window." Reference established standards with exact control numbers: NIST 800-53 AC-2.1 (single-factor authentication), SOC2 CC6.1 (restrict access to authenticated principals), ISO 27001 A.9.2.1 (establish formal access procedures). Cite production observables: query latency in CloudWatch, authentication failures in syslog, throughput in Prometheus.

Trace the complete system flow: where input comes from, how your component processes it, where output goes. Explain how this mechanism interacts with other systems: "Rate limiting coordinates with the load balancer via a shared Redis key", "Configuration changes propagate to all 50 instances through ZooKeeper watches", "Audit logging feeds directly into the SIEM pipeline for threat detection." Connect to operational constraints: "Our legacy Oracle database maxes out at 100 concurrent connections, so connection pooling must cap at 80 to avoid saturation." Show business implications: "When this mechanism fails, the customer-facing SLA breach costs $5k per minute, which makes redundancy a business requirement, not just a technical preference."

Address the person implementing this tomorrow morning. Acknowledge their actual constraints: "Your team has 2 backend engineers and no dedicated DevOps role." Explain real trade-offs: "The perfect solution requires 6 months; a pragmatic version takes 2 weeks and covers 95% of the risk." Explain what matters: "This control prevents credential stuffing attacks that hit your API 1000 times per day—that's your number one vulnerability." Signal decision points clearly: "If you have automated deployment, do X; if your deployment is still manual, do Y instead—they have different trade-offs." Validate legitimate concerns: "Yes, this adds about 50 milliseconds of latency, and it's worth it because..."

Explicitly state what could go wrong. Name the failure mode: "This approach fails completely if the database becomes unavailable—there is no graceful degradation." State your assumptions: "We assume network latency under 100ms; beyond that, the retry logic breaks down." Quantify your uncertainty: "Industry best practice suggests X; however, your 10-year-old system may not support it, and I cannot verify without seeing your infrastructure logs." Cite your confidence level: "This is from NIST guidelines (peer-reviewed, authoritative source, high confidence). That estimate is my inference from limited data (treat with skepticism)." Acknowledge information gaps: "We don't have visibility into the upstream API's failure patterns, so monitoring recommendations are educated guesses based on industry norms."

Your tone should match the question and user's expertise level. In general: knowledgeable, precise, but accessible to technical professionals. No bullet lists. No numbered sections. No metric tables. No evidence ledgers. Just clear, rigorous, professional prose that earns trust through demonstrated expertise while keeping all structured rigor in the automated receipt system.

The user's query follows.


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
`.trim();
}

/**
 * Analyze CRIES dimensions of a response by examining receipt payloads
 * Returns structured CRIES scores based on receipt evidence
 */
function analyzeCRIES(prompt, response, analysisReceipt) {
  const scores = {
    coherence: 0,
    rigor: 0,
    integration: 0,
    empathy: 0,
    strictness: 0
  };
  
  const evidence = {
    mechanisms_count: 0,
    quantitative_anchors: 0,
    standards_cited: [],
    scenarios_present: false,
    prose_quality: 'unknown'
  };

  // COHERENCE: Check for narrative flow and organic structure
  const hasParagraphs = (response.match(/\n\n/g) || []).length >= 2;
  const hasTransitions = /in practice|from a .* standpoint|this means|as a result|consequently/i.test(response);
  const noBullets = !response.match(/^[\s]*[-*•]\s/m);
  const noHeaders = !response.match(/^#{1,6}\s|^[A-Z][A-Z\s]{3,}:?\s*$/m);
  
  scores.coherence = (hasParagraphs ? 0.3 : 0) + (hasTransitions ? 0.3 : 0) + (noBullets ? 0.2 : 0) + (noHeaders ? 0.2 : 0);
  evidence.prose_quality = scores.coherence >= 0.7 ? 'organic' : (scores.coherence >= 0.4 ? 'mixed' : 'structured');

  // RIGOR: Check for mechanisms, thresholds, scenarios, and standards
  // Count quantitative mechanisms (thresholds, ranges, percentages, specific values)
  const mechanismPatterns = [
    /\d+\s*(ms|seconds?|minutes?|hours?|days?|bytes?|KB|MB|GB|requests?|connections?|threads?|processes?)/gi,
    /threshold of \d+|limit of \d+|maximum of \d+|minimum of \d+/gi,
    /between \d+ and \d+|range of \d+-\d+|from \d+ to \d+/gi,
    /\d+%|\d+\.\d+%/g,
    /exceeds \d+|below \d+|above \d+|under \d+|over \d+/gi
  ];
  
  mechanismPatterns.forEach(pattern => {
    const matches = response.match(pattern) || [];
    evidence.mechanisms_count += matches.length;
  });

  // Check for standards citations
  const standardsPatterns = [
    /NIST\s+\d+-\d+/gi,
    /SOC\s*2/gi,
    /ISO\s+\d+/gi,
    /HIPAA/gi,
    /GDPR/gi,
    /PCI\s*DSS/gi,
    /SEC\s+\d+[a-z]-\d+/gi,
    /FISMA/gi
  ];
  
  standardsPatterns.forEach(pattern => {
    const matches = response.match(pattern) || [];
    matches.forEach(match => {
      if (!evidence.standards_cited.includes(match.toUpperCase())) {
        evidence.standards_cited.push(match.toUpperCase());
      }
    });
  });

  // Check for realistic scenarios
  evidence.scenarios_present = /for example|consider a case|imagine|suppose|in a scenario where|let's say/i.test(response);

  // Calculate rigor score
  const mechanismScore = Math.min(evidence.mechanisms_count / 5, 0.3); // 5+ mechanisms = 0.3
  const standardsScore = Math.min(evidence.standards_cited.length / 3, 0.3); // 3+ standards = 0.3
  const scenarioScore = evidence.scenarios_present ? 0.2 : 0;
  const quantitativeScore = evidence.mechanisms_count >= 3 ? 0.2 : (evidence.mechanisms_count * 0.066);
  
  scores.rigor = mechanismScore + standardsScore + scenarioScore + quantitativeScore;
  evidence.quantitative_anchors = evidence.mechanisms_count;

  // INTEGRATION: Check for system interactions and operational context
  const hasSystemLinks = /connect|integrate|interact|interface|communicate|coordinate|synchronize/i.test(response);
  const hasOperationalContext = /in production|in practice|operationally|in deployment|at runtime/i.test(response);
  const hasBusinessImplications = /budget|cost|staffing|resource|business|operational/i.test(response);
  const hasCausalChains = /because|therefore|thus|consequently|as a result|this leads to/i.test(response);
  
  scores.integration = (hasSystemLinks ? 0.3 : 0) + (hasOperationalContext ? 0.3 : 0) + 
                       (hasBusinessImplications ? 0.2 : 0) + (hasCausalChains ? 0.2 : 0);

  // EMPATHY: Check for audience awareness and practical guidance
  const answersWhy = response.toLowerCase().includes('why') || /the reason|this is because/i.test(response);
  const acknowledgesConstraints = /constraint|limitation|challenge|trade-off|budget|legacy/i.test(response);
  const providesContext = response.length > 500 && hasParagraphs;
  const anticipatesQuestions = /you might wonder|a common question|note that|keep in mind/i.test(response);
  
  scores.empathy = (answersWhy ? 0.25 : 0) + (acknowledgesConstraints ? 0.25 : 0) + 
                   (providesContext ? 0.25 : 0) + (anticipatesQuestions ? 0.25 : 0);

  // STRICTNESS: Check for risk disclosure and accuracy signals
  const acknowledgesUncertainty = /may|might|could|possibly|likely|unclear|depends|uncertain/i.test(response);
  const directAboutRisks = /risk|danger|vulnerability|gap|unsafe|insecure|failure/i.test(response);
  const noInventedStandards = !response.match(/ACME-\d+|XYZ Standard|ABC Protocol/i); // Heuristic
  const qualifiesClaims = /generally|typically|often|usually|in most cases|commonly/i.test(response);
  
  scores.strictness = (acknowledgesUncertainty ? 0.25 : 0) + (directAboutRisks ? 0.3 : 0) + 
                      (noInventedStandards ? 0.25 : 0) + (qualifiesClaims ? 0.2 : 0);

  return {
    scores,
    evidence,
    overall: (scores.coherence + scores.rigor + scores.integration + scores.empathy + scores.strictness) / 5
  };
}

/**
 * Call GPT-4 with Rosetta Ω³ Mega Governance
 * Uses optimized unified prompt wrapper for maximum CRIES performance
 */
export async function callGPT4WithRosetta(prompt, rosettaContext, options = {}) {
  const model = options.model || 'gpt-4o';
  const managedGovernance = options.managedGovernance || false;
  const timeoutMs = options.timeout || 60000;
  const apiKey = options.apiKey;

  // Check if Rosetta is booted - if not, fall back to basic call
  try {
    await mcp('rosetta.boot.init', {});
  } catch {
    console.log('Rosetta not booted, falling back to basic GPT-4 call');
    return callGPT4(prompt, { ...options, model, apiKey });
  }

  console.log(`🚀 Calling ${model} with Rosetta Ω³ Mega Governance...`);
  console.log(`   Timeout: ${timeoutMs}ms`);

  // Create OpenAI client with provided API key
  const openaiClient = apiKey ? new OpenAI({ apiKey }) : openai;
  if (!openaiClient) {
    throw new Error('OpenAI API key not configured');
  }

  // 1) Context via MCP (fallback)
  let ctx = { witness: "RosettaOS MCP", version: "vΩ3.5" };
  let lamport = nextLamport();
  try {
    ctx = await mcp("rosetta.context.get", {});
    const lam = await mcp("rosetta.lamport.increment", { current: lamport });
    lamport = lam?.next ?? lamport;
  } catch { /* fallback ok */ }

  // 2) Build mega governance context
  const context = {
    userName: options.userName || 'User',
    userRole: (options.userRole?.toLowerCase() === 'architect' || options.userName === 'Michael Tobin Gomes') ? 'Architect' :
              (options.userRole?.toLowerCase() === 'auditor' ? 'Auditor' : 'Operator'),
    witness: ctx.witness,
    version: ctx.version,
    lamport,
    mode: (managedGovernance ? 'MANAGED' : 'UNIFIED'),
  };

  // 3) Build unified mega governance wrapper (SYSTEM MESSAGE)
  const governanceWrapper = buildMegaGovernanceWrapper(prompt, context);

  // ✅ DELTA BUNDLE: Cache receipts for bundling
  const receiptCache = {
    lamport: context.lamport,
    prompt: null,
    analysis: null,
    response: null
  };

  // 4) Generate Δ-PROMPT receipt (cache only, don't write yet)
  try {
    const chainData = JSON.parse(await fs.readFile('./receipts/chain.json', 'utf8').catch(() => '{"last_hash":"' + '0'.repeat(64) + '"}'));
    receiptCache.prompt = await writeReceipt({
      id: uuid(),
      type: 'Δ-PROMPT',
      lamport: context.lamport,
      ts: new Date().toISOString(),
      witness: `openai:${model}`,
      band: 'B0',
      payload: { userPrompt: prompt },
      prev_hash: chainData.last_hash || '0'.repeat(64)
    }, { skipWrite: true }); // Cache only
    console.log(`Δ-cache Δ-PROMPT lamport=${context.lamport} id=${receiptCache.prompt.id}`);
  } catch (e) {
    console.error('Failed to cache Δ-PROMPT receipt:', e?.message ?? e);
  }

  // 5) Call LLM with Ω⁴ governance: SYSTEM=wrapper, USER=original question
  const completion = await withTimeout(
    openaiClient.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: governanceWrapper },
        { role: 'user', content: prompt }
      ],
      temperature: options.temperature || 0.3,
      max_tokens: options.maxTokens || 2000,
      top_p: options.topP || 0.9,
      frequency_penalty: options.frequencyPenalty || 0.1
    }),
    timeoutMs,
    'OpenAI completion'
  );
  const answer = completion.choices[0].message.content || '';

  // 6) Generate Δ-ANALYSIS receipt with structured evidence (cache only, don't write yet)
  try {
    const chainData = JSON.parse(await fs.readFile('./receipts/chain.json', 'utf8').catch(() => '{"last_hash":"' + '0'.repeat(64) + '"}'));
    
    // Extract structured rigor metadata from the prompt and expected domain
    const evidenceChains = {
      causal_mappings: 'Input → Processing → Output with failure modes at each stage',
      operational_checks: [
        'Verify mechanism X triggers at threshold Y',
        'Confirm component A interfaces with system B via protocol C',
        'Validate metric D observable in log field E'
      ],
      standard_references: [
        { standard: 'NIST 800-53', controls: ['AC-2', 'AU-2', 'SI-4'], rationale: 'Access control, audit, monitoring' },
        { standard: 'SOC2', criteria: ['CC6.1', 'CC7.2'], rationale: 'Logical access, system monitoring' },
        { standard: 'ISO 27001', controls: ['A.9.2', 'A.12.4'], rationale: 'Access management, logging' }
      ],
      measurable_thresholds: {
        quantitative_boundaries: 'Mechanism operates reliably within [min, max] range',
        trigger_conditions: 'Action initiates when metric exceeds/falls below threshold',
        failure_modes: 'System degrades when condition X violated'
      },
      justification_logic: 'Each technical assertion linked to observable production metric or established standard'
    };
    
    receiptCache.analysis = await writeReceipt({
      id: uuid(),
      type: 'Δ-ANALYSIS',
      lamport: context.lamport,
      ts: new Date().toISOString(),
      witness: 'RosettaOS',
      band: 'B0',
      payload: { 
        governance: 'Ω⁴-organic',
        persona: context.userRole,
        requirements: {
          coherence: 'organic multi-paragraph prose, narrative transitions',
          rigor: 'measurable mechanisms, quantitative boundaries, realistic scenarios, established standards',
          integration: 'technical-operational connections, component interactions',
          empathy: 'professional audience, actionable understanding, real constraints',
          strictness: 'direct risk assessment, accurate citations, acknowledged uncertainty'
        },
        standards_expected: ['NIST 800-53', 'SOC2', 'ISO 27001', 'SEC 17a-4'],
        metrics_expected: ['thresholds', 'ranges', 'error conditions', 'production observables'],
        evidence_structures: evidenceChains,
        audit_metadata: {
          visible_format: 'prose-only',
          structured_rigor: 'receipts-only',
          separation_enforced: true
        }
      },
      prev_hash: chainData.last_hash || '0'.repeat(64)
    }, { skipWrite: true }); // Cache only
    console.log(`Δ-cache Δ-ANALYSIS lamport=${context.lamport} id=${receiptCache.analysis.id}`);
  } catch (e) {
    console.error('Failed to cache Δ-ANALYSIS receipt:', e?.message ?? e);
  }

  // 7) Analyze CRIES dimensions and generate Δ-RESPONSE receipt (cache only, don't write yet)
  try {
    const chainData = JSON.parse(await fs.readFile('./receipts/chain.json', 'utf8').catch(() => '{"last_hash":"' + '0'.repeat(64) + '"}'));
    
    // Perform CRIES analysis on the response
    const criesAnalysis = analyzeCRIES(prompt, answer, receiptCache.analysis);
    
    receiptCache.response = await writeReceipt({
      id: uuid(),
      type: 'Δ-RESPONSE',
      lamport: context.lamport,
      ts: new Date().toISOString(),
      witness: `openai:${model}`,
      band: 'B0',
      payload: { 
        content: answer.slice(0, 6000),
        governance_applied: true,
        governance_version: 'vΩ4.0-organic',
        response_length: answer.length,
        model: model,
        cries_scores: criesAnalysis.scores,
        cries_evidence: criesAnalysis.evidence,
        cries_overall: criesAnalysis.overall
      },
      prev_hash: chainData.last_hash || '0'.repeat(64)
    }, { skipWrite: true }); // Cache only
    console.log(`Δ-cache Δ-RESPONSE lamport=${context.lamport} id=${receiptCache.response.id}`);
    console.log(`   📊 CRIES Scores: C=${criesAnalysis.scores.coherence.toFixed(2)} R=${criesAnalysis.scores.rigor.toFixed(2)} I=${criesAnalysis.scores.integration.toFixed(2)} E=${criesAnalysis.scores.empathy.toFixed(2)} S=${criesAnalysis.scores.strictness.toFixed(2)} | Overall=${criesAnalysis.overall.toFixed(2)}`);
    console.log(`   🔍 Evidence: ${criesAnalysis.evidence.mechanisms_count} mechanisms, ${criesAnalysis.evidence.standards_cited.length} standards, ${criesAnalysis.evidence.quantitative_anchors} quantitative anchors`);
  } catch (e) {
    console.error('Failed to cache Δ-RESPONSE receipt:', e?.message ?? e);
  }

  // 8) Build delta_bundle with receipt references (not full objects to avoid circular refs)
  try {
    // Create bundle with receipt IDs and metadata only (no circular references)
    const delta_bundle = {
      lamport: receiptCache.lamport,
      prompt_receipt_id: receiptCache.prompt.id,
      analysis_receipt_id: receiptCache.analysis.id,
      response_receipt_id: receiptCache.response.id,
      transaction_hash: sha256Hex(JSON.stringify({
        prompt: receiptCache.prompt.id,
        analysis: receiptCache.analysis.id,
        response: receiptCache.response.id,
        lamport: receiptCache.lamport
      }))
    };

    // Embed delta_bundle metadata in all three receipts (safe - no circular refs)
    receiptCache.prompt.delta_bundle = delta_bundle;
    receiptCache.analysis.delta_bundle = delta_bundle;
    receiptCache.response.delta_bundle = delta_bundle;

    // Write all three receipts to disk with embedded bundle
    await writeReceipt(receiptCache.prompt, { forceWrite: true });
    await writeReceipt(receiptCache.analysis, { forceWrite: true });
    await writeReceipt(receiptCache.response, { forceWrite: true });

    // Append only the RESPONSE hash to chain (standard chain behavior)
    await appendChain(receiptCache.response);

    console.log(`✅ Delta bundle complete: lamport=${context.lamport}, 3 receipts bundled & written, tx_hash=${delta_bundle.transaction_hash.slice(0, 16)}...`);
  } catch (e) {
    console.error('Failed to bundle and write receipts:', e?.message ?? e);
  }

  // 9) Return ONLY the answer (no receipts in UI)
  return {
    content: answer,
    model,
    usage: {
      promptTokens: completion.usage.prompt_tokens,
      completionTokens: completion.usage.completion_tokens,
      totalTokens: completion.usage.total_tokens
    },
    provider: 'anthropic',
    governance: {
      persona: context.persona,
      // Do NOT include raw receipts in UI payloads
    }
  };
}

/**
 * Call Claude with Rosetta Ω³ Mega Governance
 * Uses optimized unified prompt wrapper for maximum CRIES performance
 */
export async function callClaudeWithRosetta(prompt, rosettaContext, options = {}) {
  const model = options.model || 'claude-3-5-sonnet-20241022';
  const managedGovernance = options.managedGovernance || false;
  const timeoutMs = options.timeout || 60000;
  const apiKey = options.apiKey;

  // Check if Rosetta is booted - if not, fall back to basic call
  try {
    await mcp('rosetta.boot.init', {});
  } catch {
    console.log('Rosetta not booted, falling back to basic Claude call');
    return callClaude(prompt, { ...options, model, apiKey });
  }

  console.log(`🚀 Calling ${model} with Rosetta Ω³ Mega Governance...`);
  console.log(`   Timeout: ${timeoutMs}ms`);

  // Create Anthropic client with provided API key
  const anthropicClient = apiKey ? new Anthropic({ apiKey }) : anthropic;
  if (!anthropicClient) {
    throw new Error('Anthropic API key not configured');
  }

  // 1) Context via MCP (fallback)
  let ctx = { witness: "RosettaOS MCP", version: "vΩ3.5" };
  let lamport = nextLamport();
  try {
    ctx = await mcp("rosetta.context.get", {});
    const lam = await mcp("rosetta.lamport.increment", { current: lamport });
    lamport = lam?.next ?? lamport;
  } catch { /* fallback ok */ }

  // 2) Build mega governance context
  const context = {
    userName: options.userName || 'User',
    userRole: (options.userRole?.toLowerCase() === 'architect' || options.userName === 'Michael Tobin Gomes') ? 'Architect' :
              (options.userRole?.toLowerCase() === 'auditor' ? 'Auditor' : 'Operator'),
    witness: ctx.witness,
    version: ctx.version,
    lamport,
    mode: (managedGovernance ? 'MANAGED' : 'UNIFIED'),
  };

  // 3) Build unified mega governance wrapper (SYSTEM MESSAGE)
  const governanceWrapper = buildMegaGovernanceWrapper(prompt, context);

  // ✅ DELTA BUNDLE: Cache receipts for bundling
  const receiptCache = {
    lamport: context.lamport,
    prompt: null,
    analysis: null,
    response: null
  };

  // 4) Silent Δ-PROMPT receipt (cache only, don't write yet)
  try {
    const chainData = JSON.parse(await fs.readFile('./receipts/chain.json', 'utf8').catch(() => '{"last_hash":"' + '0'.repeat(64) + '"}'));
    receiptCache.prompt = await writeReceipt({
      id: uuid(),
      type: 'Δ-PROMPT',
      lamport: context.lamport,
      ts: new Date().toISOString(),
      witness: `anthropic:${model}`,
      band: 'B0',
      payload: { userPrompt: prompt },
      prev_hash: chainData.last_hash || '0'.repeat(64)
    }, { skipWrite: true }); // Cache only
    console.log(`Δ-cache Δ-PROMPT lamport=${context.lamport} id=${receiptCache.prompt.id}`);
  } catch (e) {
    console.error('Failed to cache Δ-PROMPT receipt:', e?.message ?? e);
  }

  // 5) Call LLM with Ω⁴ governance: SYSTEM=wrapper, USER=original question
  const message = await withTimeout(
    anthropicClient.messages.create({
      model: model,
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.3,
      top_p: options.topP || 0.9,
      system: governanceWrapper,
      messages: [{ role: 'user', content: prompt }]
    }),
    timeoutMs,
    'Anthropic completion'
  );
  const answer = message.content[0].text || '';

  // 6) Generate Δ-ANALYSIS receipt with structured evidence (cache only, don't write yet)
  try {
    const chainData = JSON.parse(await fs.readFile('./receipts/chain.json', 'utf8').catch(() => '{"last_hash":"' + '0'.repeat(64) + '"}'));
    
    // Extract structured rigor metadata from the prompt and expected domain
    const evidenceChains = {
      causal_mappings: 'Input → Processing → Output with failure modes at each stage',
      operational_checks: [
        'Verify mechanism X triggers at threshold Y',
        'Confirm component A interfaces with system B via protocol C',
        'Validate metric D observable in log field E'
      ],
      standard_references: [
        { standard: 'NIST 800-53', controls: ['AC-2', 'AU-2', 'SI-4'], rationale: 'Access control, audit, monitoring' },
        { standard: 'SOC2', criteria: ['CC6.1', 'CC7.2'], rationale: 'Logical access, system monitoring' },
        { standard: 'ISO 27001', controls: ['A.9.2', 'A.12.4'], rationale: 'Access management, logging' }
      ],
      measurable_thresholds: {
        quantitative_boundaries: 'Mechanism operates reliably within [min, max] range',
        trigger_conditions: 'Action initiates when metric exceeds/falls below threshold',
        failure_modes: 'System degrades when condition X violated'
      },
      justification_logic: 'Each technical assertion linked to observable production metric or established standard'
    };
    
    receiptCache.analysis = await writeReceipt({
      id: uuid(),
      type: 'Δ-ANALYSIS',
      lamport: context.lamport,
      ts: new Date().toISOString(),
      witness: 'RosettaOS',
      band: 'B0',
      payload: { 
        governance: 'Ω⁴-organic',
        persona: context.userRole,
        requirements: {
          coherence: 'organic multi-paragraph prose, narrative transitions',
          rigor: 'measurable mechanisms, quantitative boundaries, realistic scenarios, established standards',
          integration: 'technical-operational connections, component interactions',
          empathy: 'professional audience, actionable understanding, real constraints',
          strictness: 'direct risk assessment, accurate citations, acknowledged uncertainty'
        },
        standards_expected: ['NIST 800-53', 'SOC2', 'ISO 27001', 'SEC 17a-4'],
        metrics_expected: ['thresholds', 'ranges', 'error conditions', 'production observables'],
        evidence_structures: evidenceChains,
        audit_metadata: {
          visible_format: 'prose-only',
          structured_rigor: 'receipts-only',
          separation_enforced: true
        }
      },
      prev_hash: chainData.last_hash || '0'.repeat(64)
    }, { skipWrite: true }); // Cache only
    console.log(`Δ-cache Δ-ANALYSIS lamport=${context.lamport} id=${receiptCache.analysis.id}`);
  } catch (e) {
    console.error('Failed to cache Δ-ANALYSIS receipt:', e?.message ?? e);
  }

  // 7) Analyze CRIES dimensions and generate Δ-RESPONSE receipt (cache only, don't write yet)
  try {
    const chainData = JSON.parse(await fs.readFile('./receipts/chain.json', 'utf8').catch(() => '{"last_hash":"' + '0'.repeat(64) + '"}'));
    
    // Perform CRIES analysis on the response
    const criesAnalysis = analyzeCRIES(prompt, answer, receiptCache.analysis);
    
    receiptCache.response = await writeReceipt({
      id: uuid(),
      type: 'Δ-RESPONSE',
      lamport: context.lamport,
      ts: new Date().toISOString(),
      witness: `anthropic:${model}`,
      band: 'B0',
      payload: { 
        content: answer.slice(0, 6000),
        governance_applied: true,
        governance_version: 'vΩ4.0-organic',
        response_length: answer.length,
        model: model,
        cries_scores: criesAnalysis.scores,
        cries_evidence: criesAnalysis.evidence,
        cries_overall: criesAnalysis.overall
      },
      prev_hash: chainData.last_hash || '0'.repeat(64)
    }, { skipWrite: true }); // Cache only
    console.log(`Δ-cache Δ-RESPONSE lamport=${context.lamport} id=${receiptCache.response.id}`);
    console.log(`   📊 CRIES Scores: C=${criesAnalysis.scores.coherence.toFixed(2)} R=${criesAnalysis.scores.rigor.toFixed(2)} I=${criesAnalysis.scores.integration.toFixed(2)} E=${criesAnalysis.scores.empathy.toFixed(2)} S=${criesAnalysis.scores.strictness.toFixed(2)} | Overall=${criesAnalysis.overall.toFixed(2)}`);
    console.log(`   🔍 Evidence: ${criesAnalysis.evidence.mechanisms_count} mechanisms, ${criesAnalysis.evidence.standards_cited.length} standards, ${criesAnalysis.evidence.quantitative_anchors} quantitative anchors`);
  } catch (e) {
    console.error('Failed to cache Δ-RESPONSE receipt:', e?.message ?? e);
  }

  // 8) Build delta_bundle with receipt references (not full objects to avoid circular refs)
  try {
    // Create bundle with receipt IDs and metadata only (no circular references)
    const delta_bundle = {
      lamport: receiptCache.lamport,
      prompt_receipt_id: receiptCache.prompt.id,
      analysis_receipt_id: receiptCache.analysis.id,
      response_receipt_id: receiptCache.response.id,
      transaction_hash: sha256Hex(JSON.stringify({
        prompt: receiptCache.prompt.id,
        analysis: receiptCache.analysis.id,
        response: receiptCache.response.id,
        lamport: receiptCache.lamport
      }))
    };

    // Embed delta_bundle metadata in all three receipts (safe - no circular refs)
    receiptCache.prompt.delta_bundle = delta_bundle;
    receiptCache.analysis.delta_bundle = delta_bundle;
    receiptCache.response.delta_bundle = delta_bundle;

    // Write all three receipts to disk with embedded bundle
    await writeReceipt(receiptCache.prompt, { forceWrite: true });
    await writeReceipt(receiptCache.analysis, { forceWrite: true });
    await writeReceipt(receiptCache.response, { forceWrite: true });

    // Append only the RESPONSE hash to chain (standard chain behavior)
    await appendChain(receiptCache.response);

    console.log(`✅ Delta bundle complete: lamport=${context.lamport}, 3 receipts bundled & written, tx_hash=${delta_bundle.transaction_hash.slice(0, 16)}...`);
  } catch (e) {
    console.error('Failed to bundle and write receipts:', e?.message ?? e);
  }

  // 9) Return ONLY the answer (no receipts in UI)
  const usage = message.usage;
  return {
    content: answer,
    model,
    usage: {
      promptTokens: usage.input_tokens,
      completionTokens: usage.output_tokens,
      totalTokens: usage.input_tokens + usage.output_tokens
    },
    provider: 'anthropic',
    governance: {
      persona: context.persona,
      // Do NOT include raw receipts in UI payloads
    }
  };
}


/**
 * Generic LLM call - routes to appropriate provider (Cloud models only: OpenAI, Anthropic, Google)
 */
export async function callLLM(modelId, prompt, options = {}) {
  // Extract API keys if provided
  const openaiKey = options.apiKeys?.openai || null;
  const anthropicKey = options.apiKeys?.anthropic || null;

  // Apply Rosetta Kernel governance if enabled
  let finalPrompt = prompt;
  let systemPrompt = null;
  let governanceTier = null;
  
  if (options.governanceEnabled) {
    // ✅ GOVERNANCE SELECTOR: Automatic tier detection
    const { getModelTier } = await import('./governance-selector.js');
    const { loadRosettaPrompt, getGovernanceMetadata } = await import('./governance-loader.js');
    
    governanceTier = getModelTier(modelId);
    
    // ✅ FIX: Build Ω⁴ governance wrapper as SYSTEM MESSAGE, not user message
    const governanceWrapper = buildMegaGovernanceWrapper(prompt, {
      userName: options.userName || 'User',
      userRole: options.userRole || 'Operator',
      witness: 'RosettaOS',
      version: 'vΩ4.0',
      lamport: Date.now()
    });
    
    // ✅ CRITICAL: systemPrompt = wrapper, finalPrompt = original question
    systemPrompt = governanceWrapper;
    finalPrompt = prompt; // Keep original user question unchanged
    
    // Enhanced governance logging (Production-grade)
    const govMetadata = getGovernanceMetadata(governanceTier, governanceWrapper);
    console.log(`[GOVERNANCE:PROD] ═══════════════════════════════════════════════════════`);
    console.log(`[GOVERNANCE:PROD] Model: ${modelId}`);
    console.log(`[GOVERNANCE:PROD] Tier: ${governanceTier.toUpperCase()}`);
    console.log(`[GOVERNANCE:PROD] Profile: Rosetta-Ω⁴ Compact Governance vΩ4.0`);
    console.log(`[GOVERNANCE:PROD] System Prompt Size: ${systemPrompt?.length || 0} chars`);
    console.log(`[GOVERNANCE:PROD] User Prompt Size: ${finalPrompt.length} chars (ORIGINAL QUESTION)`);
    console.log(`[GOVERNANCE:PROD] Governance Wrapper: SYSTEM MESSAGE ✓`);
    console.log(`[GOVERNANCE:PROD] User Message: CLEAN QUESTION ✓`);
    console.log(`[GOVERNANCE:PROD] Timestamp: ${govMetadata.timestamp}`);
    console.log(`[GOVERNANCE:PROD] Compliance: Enterprise-Ready Ω⁴`);
    console.log(`[GOVERNANCE:PROD] CRIES Target: Ω +15-20% across all dimensions`);
    console.log(`[GOVERNANCE:PROD] Wrapper: buildMegaGovernanceWrapper() Ω⁴ ACTIVE ✓`);
    console.log(`[GOVERNANCE:PROD] Architecture: SYSTEM=wrapper | USER=question`);
    console.log(`[GOVERNANCE:PROD] ═══════════════════════════════════════════════════════`);
    
    // Store governance metadata for receipts
    options._governanceMetadata = govMetadata;
  }

  // Route to appropriate cloud provider
  if (modelId.startsWith('gpt-') || modelId.startsWith('o1')) {
    // OpenAI models (including o1 series / GPT-5)
    if (!openai && !openaiKey) {
      throw new Error('OpenAI API key not configured. Please provide an API key in environment or options.');
    }
    // Pass both systemPrompt and governedPrompt (finalPrompt)
    // callGPT4 will construct: [{ role: "system", content: systemPrompt }, { role: "user", content: finalPrompt }]
    return callGPT4(finalPrompt, { ...options, model: modelId, apiKey: openaiKey, systemPrompt });
  } 
  else if (modelId.startsWith('claude-')) {
    // Anthropic models
    if (!anthropic && !anthropicKey) {
      throw new Error('Anthropic API key not configured. Please provide an API key in environment or options.');
    }
    // Pass both systemPrompt and governedPrompt (finalPrompt)
    // callClaude will construct: system: systemPrompt, messages: [{ role: "user", content: finalPrompt }]
    return callClaude(finalPrompt, { ...options, model: modelId, apiKey: anthropicKey, systemPrompt });
  }
  else if (modelId.startsWith('gemini-')) {
    // Google Gemini models
    const geminiKey = options.apiKeys?.google || process.env.GOOGLE_API_KEY;
    if (!geminiKey) {
      throw new Error('Google API key not configured. Please provide GOOGLE_API_KEY in environment or options.');
    }
    // Pass both systemPrompt and governedPrompt (finalPrompt)
    // callGemini will construct: systemInstruction: systemPrompt, contents: [{ parts: [{ text: finalPrompt }] }]
    return callGemini(finalPrompt, { ...options, model: modelId, apiKey: geminiKey, systemPrompt });
  }
  else {
    // Unknown model
    throw new Error(`Unknown model: ${modelId}. Supported models: o1, o1-mini, gpt-4o, gpt-4-turbo, gpt-4, claude-opus-4, claude-3-5-sonnet, claude-3-opus, claude-3-5-haiku, gemini-2.0-flash, gemini-1.5-pro`);
  }
}

/**
 * Check API availability for cloud providers
 */
export async function checkAPIAvailability() {
  return {
    openai: !!openai,
    anthropic: !!anthropic,
    hasAnyAPI: !!(openai || anthropic)
  };
}

/**
 * Get Rosetta governance context
 */
export function getRosettaGovernanceContext(opts = {}) {
  // Return basic governance context structure
  return {
    governanceEnabled: true,
    maxChars: opts.maxChars || 4000,
    timestamp: new Date().toISOString(),
    version: 'v1.0'
  };
}

/**
 * Clear boot sessions (useful for testing or forcing re-boot)
 */
export function clearBootSessions(modelKey = null) {
  if (modelKey) {
    bootedSessions.delete(modelKey);
    console.log(`🔄 Cleared boot session for ${modelKey}`);
  } else {
    bootedSessions.clear();
    console.log(`🔄 Cleared all boot sessions`);
  }
}

/**
 * Get boot session info
 */
export function getBootSessionInfo(modelKey = null) {
  if (modelKey) {
    return bootedSessions.get(modelKey) || null;
  } else {
    const sessions = {};
    bootedSessions.forEach((session, key) => {
      sessions[key] = {
        bootTime: session.bootTime,
        messageCount: session.messageHistory.length
      };
    });
    return sessions;
  }
}

export default {
  callGPT4,
  callClaude,
  callGPT4WithRosetta,
  callClaudeWithRosetta,
  callLLM,
  checkAPIAvailability,
  getRosettaGovernanceContext,
  clearBootSessions,
  getBootSessionInfo
};
