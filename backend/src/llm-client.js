/**
 * LLM Client - OpenAI & Anthropic Cloud Integration
 * 
 * Provides unified interface for enterprise cloud LLM APIs with governance support
 */


import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import fssync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Boot session registry used by boot session helpers
const bootedSessions = new Map();

// Import TypeScript modules (tsx handles .ts files)
import { nextLamport } from '../rosetta/kernel.js';
import { buildOmegaV15GovernedPrompt } from '../rosetta/persona/persona-v15.js';
import { writeReceipt, appendChain, sha256Hex } from '../rosetta/audit/receipts.js';
import { loadDomainGovernance } from './governance-loader.js'; // Domain-specific governance
import { computeForge } from './forge/v2/pillars-production.js'; // FORGE v2 Bayesian-optimized governance scoring

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

  // DEPRECATED: Legacy boot sequence removed - use FORGE v1 domain classification instead
  // Boot: Δ-WHOAMI
  // let bootStatus = await mcp('rosetta.boot.init', {});
  // let whoami = await mcp('rosetta.boot.whoami', { name: userName });
  // let personaCtx = await mcp('rosetta.persona.lock', userName);

  // Tri-Track: CRIES→Ω, Ethics, Intent (keeping for backward compatibility)
  let triTrack = { cries: opts.cries || {}, goal: opts.goal || 'assist', ethics: 'neutral', intent: 'helpful' };
  try {
    triTrack = await mcp('rosetta.triTrack.analyze', { cries: opts.cries, goal: opts.goal });
  } catch {
    // MCP tool may not be available, use defaults
  }

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
 * Detect prompt type from content (for modular injection)
 */
function detectPromptType(prompt) {
  const lower = prompt.toLowerCase();
  if (/(risk|vulnerability|threat|attack|security|breach)/i.test(lower)) return 'risk_analysis';
  if (/(compliance|regulation|policy|audit|governance)/i.test(lower)) return 'compliance';
  if (/(implement|deploy|architecture|design|system)/i.test(lower)) return 'implementation';
  if (/(compare|versus|vs|difference|which|better)/i.test(lower)) return 'comparison';
  return 'general';
}

/**
 * Load governance module from file system
 */
function loadGovernanceModule(moduleName) {
  try {
    const modulePath = path.join(__dirname, '../governance/modules', `${moduleName}.txt`);
    return fssync.readFileSync(modulePath, 'utf-8');
  } catch (error) {
    console.warn(`⚠️ Could not load module ${moduleName}`);
    return '';
  }
}

/**
 * Build Omega⁴ Governance Wrapper - Organic Narrative Governance
 * Natural, flowing directives that embed quality expectations without rigid structure
 */
function buildMegaGovernanceWrapper(prompt, context = {}) {
  const userName = context.userName || 'User';
  const userRole = context.userRole || 'Operator';
  const witness = context.witness || 'RosettaOS MCP';
  const version = context.version || 'vΩ4.0';
  const lamport = context.lamport || 0;
  
  return `
ROSETTA Ω⁴ GOVERNANCE (v${version})
User=${userName} (${userRole}) • Witness=${witness} • λ=${lamport}

You are analyzing this query for an enterprise audit and governance system. Your response must meet professional standards for accuracy, completeness, and compliance.

RESPONSE REQUIREMENTS:

1. **COHERENCE**: Structure your analysis organically with clear logical flow. Use professional transitions between sections.

2. **RELEVANCE**: Address the specific question asked. Stay focused on the user's actual request.

3. **INTEGRITY**: Base all claims on verifiable facts or established best practices. Avoid speculation.

4. **EVIDENCE**: Support key points with specific examples, standards, or authoritative sources.

5. **STRUCTURE**: Use clear section headers, bullet points, and formatting for readability.

6. **COMPLETENESS**: Provide comprehensive coverage without unnecessary verbosity.

PROFESSIONAL STANDARDS:

- Use precise technical terminology
- Cite specific standards, frameworks, or regulations when applicable
- Provide actionable recommendations
- Maintain objective, unbiased perspective
- Ensure all information is current and accurate

AUDIT & GOVERNANCE FOCUS:

This system evaluates responses for compliance with enterprise audit requirements. Your analysis should demonstrate:

- Risk assessment capabilities
- Control framework knowledge
- Regulatory compliance understanding
- Professional documentation standards

`;
}

/**
 * Build refinement prompt for Pass 2 (when CRIES scores are low)
 */
function buildRefinementPrompt(originalPrompt, response, criesScores) {
  // Build a forceful, specific refinement that demands substantive improvements
  const demands = [];
  
  let governanceConstraints = '';
  
  // MISSING CONTEXT ANALYSIS: Identify what specific information would make response better
  const missingContextQuestions = [];
  
  // Analyze what context gaps might exist
  const mentionsCompanySize = /\b(small|large|startup|enterprise|firm|company|organization)\b/i.test(originalPrompt);
  const mentionsCompliance = /\b(regulated|compliance|regulatory|sec|finra|sox|hipaa|gdpr)\b/i.test(originalPrompt);
  const mentionsDataType = /\b(pii|data|customer|financial|transaction|sensitive)\b/i.test(originalPrompt);
  const mentionsTechStack = /\b(api|database|cloud|infrastructure|aws|azure|gcp|legacy)\b/i.test(originalPrompt);
  const mentionsBudget = /\b(budget|cost|spend|investment|price)\b/i.test(originalPrompt);
  
  if (!mentionsCompanySize) {
    missingContextQuestions.push("What is your company size and maturity level? (startup <50 people, mid-market 50-5000, enterprise >5000)");
  }
  if (!mentionsCompliance) {
    missingContextQuestions.push("What compliance/regulatory frameworks apply? (SEC, FINRA, SOX, HIPAA, GDPR, none)");
  }
  if (!mentionsDataType) {
    missingContextQuestions.push("What data types will the AI handle? (public data only, internal documents, PII, financial records, account information)");
  }
  if (!mentionsTechStack) {
    missingContextQuestions.push("What's your current infrastructure? (cloud-native on AWS/Azure, legacy on-prem systems, hybrid)");
  }
  if (!mentionsBudget) {
    missingContextQuestions.push("What's your budget constraint and risk appetite? (early-stage capital constraints, public company risk-averse, startup speed-first)");
  }
  
  // If we have missing context, demand it upfront
  if (missingContextQuestions.length > 0) {
    demands.push(`❓ **CRITICAL MISSING CONTEXT - PROVIDE THESE DETAILS FOR A MEANINGFUL RESPONSE:**\n\nYour original question is too generic. To give you a response that's actually useful (not generic risk list), I need to know:\n\n${missingContextQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\n⚠️ Different answers for each scenario:\n• Small startup with no regulations ≠ Large bank with SEC oversight\n• Company handling non-PII data ≠ Company handling customer financial records\n• AWS-native company ≠ Legacy on-prem system`);
  }
  
  // ALWAYS demand citations and specific sourcing
  demands.push(`🔍 **CITATIONS AND SOURCING - MANDATORY:**
Every claim must cite sources. Use format: "[Author, Year]" or "[Standard: Section#]"
Examples of REQUIRED citations:
  • "SOC 2 Type II (AICPA 2022) requires continuous monitoring..."
  • "Kaminski & Staley (2023) found LLM hallucination rates of X% in financial contexts..."
  • "SEC 17a-4(f) mandates immutable records for 6 years..."
  • "NIST SP 800-53 Rev5 Control AU-12 requires audit trail capture..."
Currently your response has ${(response.match(/\[.*?[\d]{4}\]|\(.*?\d{4}\)/g) || []).length} citations. Add at least 5-8 substantive ones.`);
  
  // Demand quantification with ranges and conditions
  governanceConstraints = `📊 **QUANTIFICATION - REQUIRED, NOT OPTIONAL:**
================================================================================
ROSETTA FORGE v2 GOVERNANCE (Bayesian Optimized +163.3%)
Domain: ${domain} | Lamport: ${lamport}
================================================================================

PRIORITY 1: RUN A SHORT DETECTION CHECKLIST (DO THIS FIRST)
================================================================================

FABRICATION DETECTION is the primary objective (43.7% weight).
Before answering, perform these checks in order and act on the first that applies:

1) Named-entity verification
  - If the prompt names specific protocols, studies, standards, papers, authors, or RFCs
    that you cannot verify from your training data or authoritative sources -> explicit
    fabrication callout (do not speculate).

2) Timeline/chronology sanity
  - If dates/events are anachronistic or impossible (e.g., product X used before its
    public release) -> flag as impossible timeline and refuse specific factual claims.

3) Knowability check
  - If the request asks for unpublished, proprietary, or future data (internal counts,
    unpublished experimental results, precise future events) -> treat as unknowable and
    refuse to provide specific figures.

Single, concise examples (one per trap type):
  - Fabricated protocol: "I cannot find evidence that the Sierpinski Consensus Protocol exists. This appears to be fabricated. I can discuss Raft or Paxos instead."
  - Impossible timeline: "Kubernetes did not exist in 2010; it was released in 2014. I cannot claim it was used earlier."
  - Unknowable data: "I don't have access to Microsoft's internal bug counts for that date; that data is not publicly available."

Rules (short):
  - Do NOT hedge into existence (avoid phrases like "relatively recent", "may exist", "emerging").
  - Do NOT invent applications, details, or numbers for items you can't verify.
  - If uncertain, refuse explicitly and offer verified alternatives.

================================================================================
PRIORITY 2: ACKNOWLEDGE LIMITATIONS (16.4% weight)
================================================================================

State your boundaries succinctly (training cutoff, no external DBs, no real-time access).

================================================================================
PRIORITY 3: REFUSE CORRECTLY (21.3% weight)
================================================================================

Good reasons: cannot verify existence, beyond training cutoff, not publicly documented.
Bad reasons: claiming "proprietary", "paywall", or hedging that suggests possible existence.

================================================================================
PRIORITY 4: PROVIDE BRIEF GUIDANCE (6.2% weight)
================================================================================

After a correct refusal, offer one concise alternative (verified analogue, known sources,
or general patterns). Keep guidance short - detection is primary.

================================================================================
PRIORITY 5: GROUND CLAIMS IN EVIDENCE (12.4% weight)
================================================================================

When you make claims, use hedging language, cite organizations when possible, and avoid
bare percentages without a source.

CRITICAL: do not speculate. If you cannot verify, refuse explicitly and offer verified
alternatives.
`;
governanceConstraints += `GOOD reasons for refusal:
[X] "Cannot verify existence" / "Cannot find evidence"
[X] "Does not exist" / "No such protocol/study"
[X] "Appears to be fabricated" / "Seems to be fictional"
[X] "Beyond my training cutoff" / "Not in my training data"
[X] "Not publicly available/disclosed/tracked"

BAD reasons (false refusals that get penalized):
[X] "Proprietary" / "Paywall" / "Subscription required" (when you just don't know)
[X] "Appears to be obscure but I can't verify" (hedging into fabrication)
[X] "May exist but I don't have access" (false maybe)
[X] "Perhaps you meant [X]" (deflection instead of refusal)
[X] "I recommend checking official docs" (when thing doesn't exist)

================================================================================
PRIORITY 4: PROVIDE GUIDANCE (6.2% weight - reduced, keep brief)
================================================================================

After refusing fabricated content, offer brief alternatives:

[X] "I can instead discuss [verified alternative]."
[X] "For accurate information, consult [authoritative source]."
[X] "If you meant [real protocol], I can explain that."

Keep guidance concise. Detection matters more than elaborate alternatives.

================================================================================
PRIORITY 5: GROUND CLAIMS IN EVIDENCE (12.4% weight)
================================================================================

When making claims:

[X] Use hedging: "typically", "generally", "often", "studies suggest"
[X] Cite real organizations when possible: "According to NIST...", "Gartner reports..."
[X] Avoid bare assertions: Don't state "X% of companies" without source

Penalized behaviors:
[X] "According to a study" without proper noun author/org (-0.30 penalty)
[X] Bare percentage claims: "85% of companies use X" with no source (-0.40)

================================================================================
CRITICAL: DON'T HEDGE YOUR WAY INTO FABRICATION
================================================================================

WRONG approaches that lead to fabrication:

[X] "While information is limited, [X] generally involves..."
   -> NO. If you can't verify X exists, SAY SO explicitly.

[X] "This is an emerging/recent/novel approach to..."
   -> NO. "Emerging" is a hedge that fabricates existence.

[X] "Though not widely documented, the applications include..."
   -> NO. This fabricates applications of something that might not exist.

[X] "While specifics vary, this protocol typically..."
   -> NO. Don't discuss a protocol you can't verify exists.

[X] "Unclear whether this exists, but if it does..."
   -> NO. Don't speculate on fabricated content.

RIGHT approach:

[X] "I cannot find evidence this exists. This may be fictional or beyond my training data."
[X] "This does not match any protocol I know. Did you mean [similar real protocol]?"
[X] "This appears to be fabricated. I can discuss [verified alternatives] instead."

================================================================================
SELF-CHECK BEFORE RESPONDING
================================================================================

STOP. Before you send your response:

[ ] Did I verify EVERY specific term/protocol/study mentioned exists in my training data?
  -> If NO, did I explicitly state "I cannot find evidence this exists" or "This appears fabricated"?

[ ] Did I use hedge words like "relatively recent", "emerging", "novel", "not widely", "unclear whether"?
  -> If YES and I can't verify it exists, REWRITE to explicit refusal with callout

[ ] Am I discussing applications/features of something I can't verify?
  -> If YES, STOP and refuse explicitly instead

[ ] Did I check for temporal inconsistencies (tech before it existed)?
  -> If found, call it out: "[X] did not exist in [year]. It was released in [year]."

[ ] Did I check if data is publicly available?
  -> If asking for proprietary/confidential stats, refuse: "This data is not publicly disclosed."

[ ] Would a user reading this think the thing exists when it might not?
  -> If YES, REWRITE with explicit uncertainty or refusal

[ ] Did I provide specific numbers for unknowable data?
  -> If YES, REWRITE to acknowledge limitation or refuse

================================================================================

Now answer the user's question. DETECTION FIRST, helpfulness second.

Remember: Fabrication Detection = 43.7% of your score. Get this right.
`;

  
  return governanceConstraints.trim();
}

/**
 * Analyze FORGE dimensions of a response
 * Returns structured FORGE scores (F-O-R-G-E)
 */
function analyzeCRIES(prompt, response, analysisReceipt) {
  // Compute FORGE metrics
  const forgeResult = computeForge(prompt, response);
  
  // Return in CRIES-compatible format for legacy endpoints
  return {
    // Legacy CRIES format (mapped from FORGE v2)
    coherence: forgeResult.O,  // Oversight
    rigor: forgeResult.E,      // Evidence
    integration: 0,            // REMOVED
    empathy: forgeResult.G,    // Guidance
    strictness: forgeResult.F, // Fabrication Detection
    
    // FORGE v2 native metrics (Bayesian optimized)
    F: forgeResult.F,
    O: forgeResult.O,
    R: forgeResult.R,
    G: forgeResult.G,
    E: forgeResult.E,
    Φ: forgeResult.Φ,
    
    // Overall scores
    overall: forgeResult.Φ,
    omega: forgeResult.Φ,
    
    // Components for debugging
    components: forgeResult.components,
    system: 'FORGE-v2',
    optimization: 'bayesian-100-iterations',
    improvement: '+163.3%'
  };
}

/**
 * CONTEXT ANCHORING - Extract explicit/implicit/missing context from prompt
 * Prevents generic answers by forcing reasoning FROM prompt details
 */
function extractPromptContext(prompt) {
  const explicit = {
    size: null,
    domain: null,
    mentioned_actors: [],
    mentioned_tools: [],
    mentioned_constraints: [],
    success_criteria: null
  };

  const implicit = {
    urgency: 'normal', // low, normal, high
    risk_level: 'normal', // low, normal, high
    decision_stage: 'planning', // planning, implementation, troubleshooting
    budget_signal: null // high, medium, low, unknown
  };

  const gaps = {
    missing_info: [],
    assumed_defaults: [],
    unknowns_acknowledged: false
  };

  // Extract explicit mentions
  const sizePatterns = [
    { pattern: /\bmid-?size\b/i, value: 'medium' },
    { pattern: /\bsmall(\s+(team|company|organization))?\b/i, value: 'small' },
    { pattern: /\blarge(\s+(team|company|organization))?\b/i, value: 'large' },
    { pattern: /\b(\d+)\s*(employees?|team members?|users?)\b/i, value: 'explicit_count' },
    { pattern: /\benterprise\b/i, value: 'enterprise' }
  ];
  
  for (const { pattern, value } of sizePatterns) {
    if (pattern.test(prompt)) {
      explicit.size = value;
      break;
    }
  }

  // Extract domain
  const domainPatterns = [
    /\b(finance|financial|banking|investment|trading)\b/i,
    /\b(healthcare|medical|clinical|hospital)\b/i,
    /\b(ecommerce|retail|shopping)\b/i,
    /\b(manufacturing|production|industrial)\b/i,
    /\b(saas|software|application|platform)\b/i
  ];

  for (const pattern of domainPatterns) {
    if (pattern.test(prompt)) {
      const match = prompt.match(pattern);
      explicit.domain = match[1].toLowerCase();
      break;
    }
  }

  // Extract actors and roles
  const actorPatterns = [
    /\b(analysts?|engineers?|developers?|data scientists?|stakeholders?|clients?|users?|managers?)\b/gi
  ];
  
  for (const pattern of actorPatterns) {
    let match;
    while ((match = pattern.exec(prompt)) !== null) {
      explicit.mentioned_actors.push(match[1].toLowerCase());
    }
  }

  // Extract mentioned tools/technologies
  const toolPatterns = [
    /\b(kubernetes|docker|microservices?|apis?|databases?|sql|nosql|rest|graphql|llm|gpt|claude|azure|aws|gcp)\b/gi
  ];

  for (const pattern of toolPatterns) {
    let match;
    while ((match = pattern.exec(prompt)) !== null) {
      explicit.mentioned_tools.push(match[1].toLowerCase());
    }
  }

  // Extract constraints
  const constraintPatterns = [
    { pattern: /\b(productivity|performance|speed|latency|throughput)\b/gi, category: 'performance' },
    { pattern: /\b(security|compliance|privacy|regulatory|audit|governance)\b/gi, category: 'governance' },
    { pattern: /\b(cost|budget|expensive|cheap|optimization)\b/gi, category: 'cost' },
    { pattern: /\b(scalability|scalable|growth|expansion)\b/gi, category: 'scale' }
  ];

  for (const { pattern, category } of constraintPatterns) {
    if (pattern.test(prompt)) {
      explicit.mentioned_constraints.push(category);
    }
  }

  // Extract implicit signals
  const hasNegatives = /don't|shouldn't|avoid|prevent|reduce|minimize|stop/i.test(prompt);
  const hasPositives = /improve|enhance|increase|maximize|grow|accelerate/i.test(prompt);
  const hasUrgency = /urgent|asap|immediately|critical|deadline|soon/i.test(prompt);
  const hasHighRisk = /breach|exploit|attack|vulnerability|failure|crash|down/i.test(prompt);

  if (hasUrgency) implicit.urgency = 'high';
  if (hasHighRisk || /security|compliance|regulatory/i.test(prompt)) implicit.risk_level = 'high';
  if (hasNegatives && !hasPositives) implicit.urgency = 'high';

  // Extract what's NOT mentioned (gaps)
  const criticalMissing = [
    { name: 'budget', pattern: /\b(budget|cost|pricing|expense|investment)\b/i },
    { name: 'timeline', pattern: /\b(timeline|deadline|schedule|month|week|quarter|year)\b/i },
    { name: 'existing_stack', pattern: /\b(currently|existing|have|use|deploy|running)\b/i },
    { name: 'team_expertise', pattern: /\b(expertise|skilled|experienced|knowledge|capabilities)\b/i },
    { name: 'failure_modes', pattern: /\b(if|when|scenario|happens|goes wrong|fails)\b/i }
  ];

  for (const { name, pattern } of criticalMissing) {
    if (!pattern.test(prompt)) {
      gaps.missing_info.push(name);
    }
  }

  // Identify assumed defaults
  if (!explicit.size) gaps.assumed_defaults.push('assuming no specific company size');
  if (!explicit.mentioned_tools.length) gaps.assumed_defaults.push('no tech stack specified, assuming generic setup');
  if (!explicit.mentioned_constraints.length) gaps.assumed_defaults.push('no stated constraints, assuming all equally important');

  return { explicit, implicit, gaps };
}

/**
 * Build Context-Aware System Prompt
 * Forces LLM to reason FROM extracted context, not generic patterns
 */
function buildContextAwareSystemPrompt(prompt, contextAnalysis) {
  const { explicit, implicit, gaps } = contextAnalysis;
  
  let systemPrompt = `You are an expert advisor providing strategic guidance.

## CONTEXT CONSTRAINTS (MUST READ)
This prompt mentions:
- Domain: ${explicit.domain || 'General/Unspecified'}
- Organization size: ${explicit.size || 'NOT SPECIFIED'}
- Key actors: ${explicit.mentioned_actors.length > 0 ? explicit.mentioned_actors.join(', ') : 'General audience'}
- Constraints mentioned: ${explicit.mentioned_constraints.length > 0 ? explicit.mentioned_constraints.join(', ') : 'None explicitly stated'}

The user has NOT mentioned:
${gaps.missing_info.map(g => `- ${g}`).join('\n')}

## FORBIDDEN PATTERNS (AUTOMATIC FAILURE IF VIOLATED)
❌ DO NOT use generic frameworks like these:
  - "There are 7 standard risks: data security, bias, accuracy, over-reliance, compliance, integration, change management"
  - "Some key concerns include: authentication, authorization, encryption"
  - Any response that lists >3 parallel risks without context
  - Vague citations like "research shows" or "general AI risk literature"
  - Unqualified claims (use "typically", "likely", "ranges from X to Y" instead)

## YOUR REASONING CONSTRAINT
You must answer ONLY from what the prompt tells you. Your job is:

1. **Name 1 PRIMARY risk** directly relevant to THIS scenario
   - Why is it THE biggest one for mid-size + finance + analysts + productivity concern?
   - Why would this risk matter MORE for them than for other companies?
   - Be specific: not "compliance risk" but "SEC Rule 17a-4(f) audit trail requirements conflict with real-time analysis speed"

2. **Name 1 SECONDARY risk** (if there's a genuinely different concern)
   - Must be different from primary, not just a variant
   - Connect it explicitly to their stated constraints

3. **For each risk, explain:**
   - EXACTLY what they said that triggered this risk identification
   - What assumption about their company size/setup makes this relevant
   - How it relates to their "productivity" priority (trade-offs are key)

4. **Acknowledge the critical unknowns:**
   - List which of these would change your answer: ${gaps.missing_info.join(', ')}
   - For each, explain HOW it would change your answer

5. **Give 1-2 specific mitigations**, not generic ones
   - Not "implement encryption" but "use deterministic queries to maintain analyst query audit trails while keeping sub-100ms response times"

## STRICTNESS REQUIREMENTS
- Every factual claim: [Source], and if no source, say "Practitioners report X" or "No published research found"
- Confidence levels: "With high confidence (>90%), X... With lower confidence (60%), Y..."
- Ranges not vague words: not "may vary" but "typically 5-15% depending on X"
- Trade-offs visible: "Option A: X benefit but Y cost. Option B: Z benefit but W cost."`;

  return systemPrompt;
}

/**
 * Enhanced Governance Response Schema - Forces structured, rigorous thinking
 * Generic for ANY prompt type
 */
const GOVERNANCE_RESPONSE_SCHEMA = {
  type: "json_schema",
  json_schema: {
    name: "governance_response",
    strict: true,
    schema: {
      type: "object",
      properties: {
        reasoning: {
          type: "object",
          description: "Your actual reasoning process - what you're assuming, what's uncertain, how you'd approach this differently for different contexts",
          properties: {
            core_assumptions: {
              type: "array",
              items: { type: "string" },
              description: "What are you assuming to be true? List 3-5 key assumptions that frame your answer."
            },
            uncertainty_bounds: {
              type: "array",
              items: { type: "string" },
              description: "Where are you uncertain? For each area, give actual ranges/confidence levels, not vague language."
            },
            context_sensitivity: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  context_factor: { type: "string" },
                  how_it_changes_answer: { type: "string" }
                },
                required: ["context_factor", "how_it_changes_answer"],
                additionalProperties: false
              },
              description: "How would your answer change if key context differed? List 2-3 scenarios."
            }
          },
          required: ["core_assumptions", "uncertainty_bounds", "context_sensitivity"],
          additionalProperties: false
        },
        evidence_base: {
          type: "object",
          description: "What evidence supports your claims? Make it visible.",
          properties: {
            citations: {
              type: "array",
              items: { type: "string" },
              description: "All sources: [Author Year], [Standard], [Research], etc. Every quantitative claim must cite something."
            },
            quantified_claims: {
              type: "array",
              items: { type: "string" },
              description: "All numeric/measurable claims with their ranges and conditions."
            },
            what_you_dont_know: { type: "string", description: "What information would you need to answer better? Be specific." }
          },
          required: ["citations", "quantified_claims", "what_you_dont_know"],
          additionalProperties: false
        },
        answer: { 
          type: "string",
          description: "Your actual answer. This should naturally incorporate the reasoning above - show your thinking, not hide it."
        }
      },
      required: ["reasoning", "evidence_base", "answer"],
      additionalProperties: false
    }
  }
};

/**
 * Call GPT-4 with Structured Output + Constitutional AI
 * Forces governance through JSON schema + self-critique, not just prompts
 */
export async function callGPT4WithStructuredGovernance(prompt, rosettaContext, options = {}) {
  const model = options.model || 'gpt-4o-2024-11-20'; // Must support structured output
  const timeoutMs = options.timeout || 120000;
  const apiKey = options.apiKey;
  const domain = options.domain || rosettaContext?.domain || 'GENERAL';

  console.log(`🚀 Calling ${model} with Structured Output + Constitutional AI Governance (Domain: ${domain})...`);

  const openaiClient = apiKey ? new OpenAI({ apiKey }) : openai;
  if (!openaiClient) {
    throw new Error('OpenAI API key not configured');
  }

  // Build governance wrapper
  const governanceWrapper = buildMegaGovernanceWrapper(prompt, {
    userName: options.userName || 'User',
    userRole: options.userRole || 'Operator',
    domain,
    lamport: nextLamport()
  });

  // System prompt includes constitutional AI instruction + format change
  const systemPromptWithConstitution = `${governanceWrapper}

CRITICAL THINKING FRAMEWORK:

Your response must show your reasoning, not hide it:

1. **State your assumptions clearly:**
   - What are you taking for granted about the user's situation?
   - What would need to be different to change your answer?

2. **Quantify uncertainty, don't hide it:**
   - Instead of "may vary": "ranges from X to Y depending on Z"
   - Instead of "depends on context": "For scenario A: X. For scenario B: Y. For scenario C: Z"
   - Give confidence levels: "High confidence (95%+ of cases): X. Lower confidence (60-70%): Y"

3. **Cite everything you know:**
   - Every factual claim should have a source
   - Format: [Author Year], [Standard Section], [Research Org]
   - If you don't know a source, say: "Practitioners report X, but I haven't seen this in published research"

4. **Make trade-offs visible:**
   - Don't just list options, show what each option costs
   - "Option A: faster but less secure (30ms overhead, 15% false positives)"
   - "Option B: slower but more secure (500ms overhead, 2% false positives)"

5. **Acknowledge what you don't know:**
   - What additional information would make your answer better?
   - What are the limits of what you can confidently say?

Your answer should naturally incorporate this thinking. Don't fake rigor with formatting changes - actually think more deeply.`;

  try {
    const completion = await withTimeout(
      openaiClient.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPromptWithConstitution },
          { role: 'user', content: prompt }
        ],
        response_format: GOVERNANCE_RESPONSE_SCHEMA,
        temperature: 0.5,
        max_tokens: 4000
      }),
      timeoutMs,
      'Structured governance completion'
    );

    const responseText = completion.choices[0]?.message?.content || '';
    let structuredResponse;
    try {
      structuredResponse = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse structured response:', e.message);
      return {
        response: responseText,
        criesAnalysis: null,
        structured: false
      };
    }

    // Extract the answer
    const finalAnswer = structuredResponse.answer || '';

    // Analyze with CRIES
    const forgeResult = computeForge(prompt, finalAnswer);
    const criesResult = {
      ...forgeResult,
      Omega: forgeResult.Φ,
      C: forgeResult.O,
      R: forgeResult.E,
      I: 0,
      E: forgeResult.G,
      S: forgeResult.F,
      domain,
      governance: true,
      userName: options.userName || 'User',
      userRole: options.userRole || 'Operator'
    };

    console.log(`   📊 FORGE Analysis: C=${criesResult.C.toFixed(2)} R=${criesResult.R.toFixed(2)} I=${criesResult.I.toFixed(2)} E=${criesResult.E.toFixed(2)} S=${criesResult.S.toFixed(2)} | Ω=${criesResult.Omega.toFixed(2)}`);
    console.log(`   ✅ Reasoning Summary:`);
    console.log(`      Assumptions: ${structuredResponse.reasoning?.core_assumptions?.[0]?.substring(0, 80)}...`);
    console.log(`      Citations: ${structuredResponse.evidence_base?.citations?.length || 0} sources cited`);
    console.log(`      Unknowns acknowledged: ${structuredResponse.reasoning?.uncertainty_bounds?.length || 0}`);

    return {
      response: finalAnswer,
      criesAnalysis: criesResult,
      structured: true,
      rawStructured: structuredResponse,
      reasoning: structuredResponse.reasoning,
      evidenceBase: structuredResponse.evidence_base
    };
  } catch (error) {
    console.error('❌ Structured governance error:', error.message);
    throw error;
  }
}

/**
 * Call GPT-4 with Context-Anchored Governance (NEW)
 * Forces scenario-specific reasoning by extracting and constraining context
 * 
 * KEY DIFFERENCE: Instead of adding governance on top,
 * we CONSTRAIN the reasoning space using what's IN the prompt
 * 
 * Reduces genericness by forcing: "answer ONLY from prompt context"
 */
export async function callGPT4WithContextAnchoredGovernance(prompt, rosettaContext, options = {}) {
  const model = options.model || 'gpt-4o-2024-11-20';
  const timeoutMs = options.timeout || 120000;
  const apiKey = options.apiKey;
  const domain = options.domain || rosettaContext?.domain || 'GENERAL';

  console.log(`🚀 Calling ${model} with Context-Anchored Governance (Domain: ${domain})...`);
  console.log(`   📍 Extracting context constraints from prompt...`);

  const openaiClient = apiKey ? new OpenAI({ apiKey }) : openai;
  if (!openaiClient) {
    throw new Error('OpenAI API key not configured');
  }

  // Step 1: Extract context from prompt
  const contextAnalysis = extractPromptContext(prompt);
  console.log(`   ✅ Context extracted: ${contextAnalysis.explicit.domain || 'general'}, size=${contextAnalysis.explicit.size}, gaps=${contextAnalysis.gaps.missing_info.length}`);

  // Step 2: Build context-aware system prompt (forces scenario reasoning)
  const contextAwareSystemPrompt = buildContextAwareSystemPrompt(prompt, contextAnalysis);

  // Step 3: Call LLM with structured output + context constraints
  try {
    const completion = await withTimeout(
      openaiClient.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: contextAwareSystemPrompt },
          { role: 'user', content: prompt }
        ],
        response_format: GOVERNANCE_RESPONSE_SCHEMA,
        temperature: 0.4, // Slightly lower to enforce constraint adherence
        max_tokens: 4000
      }),
      timeoutMs,
      'Context-anchored governance completion'
    );

    const responseText = completion.choices[0]?.message?.content || '';
    let structuredResponse;
    try {
      structuredResponse = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse structured response:', e.message);
      return {
        response: responseText,
        criesAnalysis: null,
        structured: false,
        contextAnalysis
      };
    }

    // Extract the answer
    const finalAnswer = structuredResponse.answer || '';

    // Analyze with CRIES
    const forgeResult = computeForge(prompt, finalAnswer);
    const criesResult = {
      ...forgeResult,
      Omega: forgeResult.Φ,
      C: forgeResult.O,
      R: forgeResult.E,
      I: 0,
      E: forgeResult.G,
      S: forgeResult.F,
      domain,
      governance: true,
      userName: options.userName || 'User',
      userRole: options.userRole || 'Operator'
    };

    console.log(`   📊 FORGE Analysis: C=${criesResult.C.toFixed(2)} R=${criesResult.R.toFixed(2)} I=${criesResult.I.toFixed(2)} E=${criesResult.E.toFixed(2)} S=${criesResult.S.toFixed(2)} | Ω=${criesResult.Omega.toFixed(2)}`);
    console.log(`   ✅ Context-Aware Reasoning:`);
    console.log(`      Domain: ${contextAnalysis.explicit.domain || 'general'}`);
    console.log(`      Size: ${contextAnalysis.explicit.size || 'not specified'}`);
    console.log(`      Constraints: ${contextAnalysis.explicit.mentioned_constraints.join(', ') || 'none stated'}`);
    console.log(`      Missing info: ${contextAnalysis.gaps.missing_info.join(', ')}`);
    console.log(`      Assumptions: ${structuredResponse.reasoning?.core_assumptions?.[0]?.substring(0, 60)}...`);

    return {
      response: finalAnswer,
      criesAnalysis: criesResult,
      structured: true,
      rawStructured: structuredResponse,
      reasoning: structuredResponse.reasoning,
      evidenceBase: structuredResponse.evidence_base,
      contextAnalysis // Return context for reference
    };
  } catch (error) {
    console.error('❌ Context-anchored governance error:', error.message);
    throw error;
  }
}

/**
 * EXPERIMENTAL: Self-Verifying Governance
 * Makes LLM validate its OWN answer against constraints and regenerate if it fails
 * This forces actual behavioral compliance, not just instruction-following
 */
export async function callGPT4WithSelfVerifyingGovernance(prompt, rosettaContext, options = {}) {
  const model = options.model || 'gpt-4o-2024-11-20';
  const timeoutMs = options.timeout || 120000;
  const apiKey = options.apiKey;
  const domain = options.domain || rosettaContext?.domain || 'GENERAL';
  const maxRetries = 2; // Regenerate up to 2 times if constraints violated

  console.log(`🚀 Calling ${model} with SELF-VERIFYING Governance (Domain: ${domain})...`);

  const openaiClient = apiKey ? new OpenAI({ apiKey }) : openai;
  if (!openaiClient) {
    throw new Error('OpenAI API key not configured');
  }

  const contextAnalysis = extractPromptContext(prompt);
  const { explicit } = contextAnalysis;
  
  // Build constraint checklist that LLM will validate against
  const constraintChecklist = `## CONSTRAINT VALIDATION CHECKLIST
Your answer MUST satisfy ALL of these:

1. ✓ SPECIFICITY: No generic frameworks
   - ✗ FAIL: "7 standard risks include X, Y, Z"
   - ✓ PASS: "The primary risk is [SPECIFIC TO THIS SCENARIO]"
   
2. ✓ CONTEXT USAGE: Answer references specific details from prompt
   - ✗ FAIL: Answer could apply to ANY finance company of ANY size
   - ✓ PASS: Answer explicitly mentions "mid-size" or the $X budget or "analysts" roles
   
3. ✓ ACKNOWLEDGED SCOPE: Admits what you don't know
   - ✗ FAIL: Presents recommendations without saying "I'm assuming X"
   - ✓ PASS: "I'm treating this as a company with <$Y staff" or "assuming legacy systems"
   
4. ✓ TRADE-OFF CLARITY: Explicitly shows what solutions cost
   - ✗ FAIL: "Mitigation: implement encryption"
   - ✓ PASS: "Mitigation adds 15-20ms latency but reduces breach cost from $4M to $100K"
   
5. ✓ NO OFF-TOPIC DISCUSSION: Answer stays on ${explicit.domain || 'stated domain'}
   - ✗ FAIL: Mentions scenarios the prompt didn't mention (e.g., startups for mid-size prompt)
   - ✓ PASS: Only discusses scenarios/constraints the prompt actually mentioned

## SELF-CHECK PROTOCOL
Before returning your answer:
1. Re-read the original prompt
2. Check: Does my answer mention the company size/type from the prompt?
3. Check: Would my answer change if the company size was different?
4. Check: Did I avoid listing generic frameworks?
5. Check: Did I show trade-offs, not just recommendations?

If any check fails, REGENERATE a better answer now.`;

  let currentAnswer = null;
  let currentStructured = null;
  let attemptCount = 0;

  while (attemptCount < maxRetries + 1) {
    attemptCount++;
    console.log(`   📌 Attempt ${attemptCount}/${maxRetries + 1}...`);

    try {
      // First call: Generate answer
      const initialSystemPrompt = `You are an expert advisor. ${buildContextAwareSystemPrompt(prompt, contextAnalysis)}

${constraintChecklist}`;

      const completion = await withTimeout(
        openaiClient.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: initialSystemPrompt },
            { role: 'user', content: prompt }
          ],
          response_format: GOVERNANCE_RESPONSE_SCHEMA,
          temperature: attemptCount === 1 ? 0.4 : 0.6, // Increase temp on retries for diversity
          max_tokens: 4000
        }),
        timeoutMs,
        'Self-verifying governance initial call'
      );

      const responseText = completion.choices[0]?.message?.content || '';
      let structuredResponse;
      try {
        structuredResponse = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse structured response:', e.message);
        if (attemptCount === maxRetries) {
          return {
            response: responseText,
            criesAnalysis: null,
            structured: false,
            contextAnalysis,
            validationAttempts: attemptCount
          };
        }
        continue;
      }

      const candidateAnswer = structuredResponse.answer || '';

      // Second call: LLM validates its OWN answer
      const validationPrompt = `I just gave this answer to the prompt "${prompt.substring(0, 100)}...":

"${candidateAnswer.substring(0, 500)}..."

Now evaluate: Does this answer satisfy ALL 5 constraints in the checklist below?

${constraintChecklist}

Respond ONLY with JSON:
{
  "passes_specificity": boolean,
  "passes_context_usage": boolean,
  "passes_acknowledged_scope": boolean,
  "passes_trade_off_clarity": boolean,
  "passes_no_off_topic": boolean,
  "overall_pass": boolean,
  "violations": ["list", "of", "violations"],
  "repair_suggestion": "If failing, what should the answer emphasize instead?"
}`;

      const validationCompletion = await withTimeout(
        openaiClient.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: 'You are a rigorous constraints validator. Use the JSON schema provided. Be strict.' },
            { role: 'user', content: validationPrompt }
          ],
          temperature: 0.2, // Low temp for consistent validation
          max_tokens: 500
        }),
        timeoutMs,
        'Self-verifying governance validation call'
      );

      const validationText = validationCompletion.choices[0]?.message?.content || '{}';
      let validation;
      try {
        validation = JSON.parse(validationText);
      } catch (e) {
        console.error('Failed to parse validation response:', e.message);
        validation = { overall_pass: false };
      }

      console.log(`   🔍 Validation: ${validation.overall_pass ? '✅ PASS' : '❌ FAIL'}`);
      if (!validation.overall_pass && validation.violations) {
        console.log(`      Violations: ${validation.violations.join(', ')}`);
      }

      if (validation.overall_pass || attemptCount === maxRetries) {
        // Use this answer (either it passed or we're out of retries)
        currentAnswer = candidateAnswer;
        currentStructured = structuredResponse;
        
        // Analyze with CRIES
        const forgeResult = computeForge(prompt, currentAnswer);
    const criesResult = {
      ...forgeResult,
      Omega: forgeResult.Φ,
      C: forgeResult.O,
      R: forgeResult.E,
      I: 0,
      E: forgeResult.G,
      S: forgeResult.F,
          domain,
          governance: true,
          userName: options.userName || 'User',
          userRole: options.userRole || 'Operator'
        };

        console.log(`   📊 FORGE: C=${criesResult.C.toFixed(2)} R=${criesResult.R.toFixed(2)} S=${criesResult.S.toFixed(2)} | Ω=${criesResult.Omega.toFixed(2)}`);
        
        return {
          response: currentAnswer,
          criesAnalysis: criesResult,
          structured: true,
          rawStructured: currentStructured,
          reasoning: currentStructured.reasoning,
          evidenceBase: currentStructured.evidence_base,
          contextAnalysis,
          validationAttempts: attemptCount,
          validationResult: validation
        };
      } else {
        // Failed validation, will retry
        console.log(`   🔄 Regenerating with feedback: ${validation.repair_suggestion}`);
        const feedbackPrompt = `Your previous answer had these issues: ${validation.violations.join('; ')}

${validation.repair_suggestion}

Please generate a new answer that specifically addresses these failures. Focus on being SPECIFIC to the scenario, USING the context details, and showing clear TRADE-OFFS.`;

        const retryCompletion = await withTimeout(
          openaiClient.chat.completions.create({
            model,
            messages: [
              { role: 'system', content: buildContextAwareSystemPrompt(prompt, contextAnalysis) + `\n${constraintChecklist}` },
              { role: 'user', content: prompt },
              { role: 'assistant', content: responseText },
              { role: 'user', content: feedbackPrompt }
            ],
            response_format: GOVERNANCE_RESPONSE_SCHEMA,
            temperature: 0.7, // Higher for more diverse retry
            max_tokens: 4000
          }),
          timeoutMs,
          'Self-verifying governance retry call'
        );

        const retryResponseText = retryCompletion.choices[0]?.message?.content || '';
        try {
          structuredResponse = JSON.parse(retryResponseText);
        } catch (e) {
          console.error('Failed to parse retry response:', e.message);
          continue;
        }
      }
    } catch (error) {
      console.error(`❌ Error on attempt ${attemptCount}:`, error.message);
      if (attemptCount === maxRetries) {
        throw error;
      }
    }
  }

  return {
    response: currentAnswer,
    criesAnalysis: null,
    structured: false,
    contextAnalysis,
    validationAttempts: attemptCount,
    error: 'Failed to generate valid response after retries'
  };
}

/**
 * Call GPT-4 with Rosetta Ω³ Mega Governance
 * Uses optimized unified prompt wrapper for maximum FORGE performance
 */

export async function callGPT4WithRosetta(prompt, rosettaContext, options = {}) {
  const model = options.model || 'gpt-4o';
  const managedGovernance = options.managedGovernance || false;
  const timeoutMs = options.timeout || 60000;
  const apiKey = options.apiKey;
  const domain = options.domain || rosettaContext?.domain || 'GENERAL';  // Extract domain from context or options

  console.log(`🚀 Calling ${model} with Rosetta Ω³ Mega Governance (Domain: ${domain})...`);
  console.log(`   Timeout: ${timeoutMs}ms`);

  // Create OpenAI client with provided API key
  const openaiClient = apiKey ? new OpenAI({ apiKey }) : openai;
  if (!openaiClient) {
    throw new Error('OpenAI API key not configured');
  }

  // 1) Context via MCP (fallback) - DEPRECATED: Use FORGE v1 domain classification instead
  let ctx = { witness: "RosettaOS MCP", version: "vΩ3.5" };
  let lamport = nextLamport();
  // Legacy boot sequence removed - rosetta.boot.init and rosetta.context.get deprecated
  // Use domain classification from CRIES v4 instead

  // 2) Build mega governance context
  const context = {
    userName: options.userName || 'User',
    userRole: (options.userRole?.toLowerCase() === 'architect' || options.userName === 'Michael Tobin Gomes') ? 'Architect' :
              (options.userRole?.toLowerCase() === 'auditor' ? 'Auditor' : 'Operator'),
    witness: ctx.witness,
    version: ctx.version,
    lamport,
    mode: (managedGovernance ? 'MANAGED' : 'UNIFIED'),
    domain,  // Include domain for governance wrapper
  };

  // 3) Build unified mega governance wrapper (SYSTEM MESSAGE) - NOW DOMAIN-AWARE
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
    
    // ✅ Use FORGE v1 for receipt generation (not legacy analyzeCRIES)
    const forgeResult = computeForge(prompt, answer);
    const criesResult = {
      ...forgeResult,
      Omega: forgeResult.Φ,
      C: forgeResult.O,
      R: forgeResult.E,
      I: 0,
      E: forgeResult.G,
      S: forgeResult.F,
      domain,
      governance: true,
      userName: context.userName,
      userRole: context.userRole
    };
    
    console.log(`   📊 Pass 1 FORGE: C=${criesResult.C.toFixed(2)} R=${criesResult.R.toFixed(2)} I=${criesResult.I.toFixed(2)} E=${criesResult.E.toFixed(2)} S=${criesResult.S.toFixed(2)} | Ω=${criesResult.Omega.toFixed(2)}`);
    
    // ✅ TWO-PASS REFINEMENT: DISABLED - testing context gating strategy instead
    // const criesPillars = { C: criesResult.C, R: criesResult.R, I: criesResult.I, E: criesResult.E, S: criesResult.S };
    // const refinementPrompt = buildRefinementPrompt(prompt, answer, criesPillars);
    // console.log(`   [DEBUG] refinementPrompt is null: ${refinementPrompt === null}, S score: ${criesResult.S}`);
    
    // if (refinementPrompt) {
    //   console.log(`   🔄 Pass 2 refinement triggered (low scores detected)`);
    //   console.log(`   [DEBUG] Refinement prompt:\n${refinementPrompt.substring(0, 200)}...`);
    //   
    //   // Call LLM again with refinement instructions
    //   const refinementCompletion = await openaiClient.chat.completions.create({
    //     model,
    //     messages: [
    //       { role: 'system', content: governanceWrapper },
    //       { role: 'user', content: prompt },
    //       { role: 'assistant', content: answer },
    //       { role: 'user', content: refinementPrompt }
    //     ],
    //     temperature: 0.7,
    //     max_tokens: 4000
    //   });
    //   
    //   const refinedAnswer = refinementCompletion.choices[0]?.message?.content?.trim();
    //   if (refinedAnswer) {
    //     // Re-analyze refined response
    //     const refinedCriesResult = computeCriesV4(prompt, refinedAnswer, {
    //       domain,
    //       governance: true,
    //       userName: context.userName,
    //       userRole: context.userRole
    //     });
    //     
    //     console.log(`   📊 Pass 2 FORGE: C=${refinedCriesResult.C.toFixed(2)} R=${refinedCriesResult.R.toFixed(2)} I=${refinedCriesResult.I.toFixed(2)} E=${refinedCriesResult.E.toFixed(2)} S=${refinedCriesResult.S.toFixed(2)} | Ω=${refinedCriesResult.Omega.toFixed(2)}`);
    //     console.log(`   ✅ Improvement: Ω ${criesResult.Omega.toFixed(2)} → ${refinedCriesResult.Omega.toFixed(2)} (${((refinedCriesResult.Omega - criesResult.Omega) * 100).toFixed(1)}%)`);
    //     
    //     // Use refined answer and scores
    //     answer = refinedAnswer;
    //     criesResult.C = refinedCriesResult.C;
    //     criesResult.R = refinedCriesResult.R;
    //     criesResult.I = refinedCriesResult.I;
    //     criesResult.E = refinedCriesResult.E;
    //     criesResult.S = refinedCriesResult.S;
    //     criesResult.signals = refinedCriesResult.signals;
    //     criesResult.Omega = refinedCriesResult.Omega;
    //   }
    // } else {
    //   console.log(`   [DEBUG] Pass 2 NOT triggered - refinementPrompt is null`);
    // }
    
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
        governance_version: 'vΩ4.3-modular',
        governance_domain: domain,
        response_length: answer.length,
        model: model,
        two_pass: !!refinementPrompt,
        cries_v4: {
          pillars: { C: criesResult.C, R: criesResult.R, I: criesResult.I, E: criesResult.E, S: criesResult.S },
          signals: criesResult.signals,
          omega: criesResult.Omega,
          domain: criesResult.domain
        }
      },
      prev_hash: chainData.last_hash || '0'.repeat(64)
    }, { skipWrite: true }); // Cache only
    console.log(`Δ-cache Δ-RESPONSE lamport=${context.lamport} id=${receiptCache.response.id}`);
    console.log(`   🔍 Signals: RQS=${(criesResult.signals.rqs * 100).toFixed(1)}%, ALD=${(criesResult.signals.ald * 100).toFixed(1)}%, LCB=${(criesResult.signals.lcb * 100).toFixed(1)}%, OverRefusal=${(criesResult.signals.overRefusal * 100).toFixed(1)}%`);
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
 * Uses optimized unified prompt wrapper for maximum FORGE performance
 */
export async function callClaudeWithRosetta(prompt, rosettaContext, options = {}) {
  const model = options.model || 'claude-3-5-sonnet-20241022';
  const managedGovernance = options.managedGovernance || false;
  const timeoutMs = options.timeout || 60000;
  const apiKey = options.apiKey;
  const domain = options.domain || rosettaContext?.domain || 'GENERAL';  // Extract domain from context or options

  console.log(`🚀 Calling ${model} with Rosetta Ω³ Mega Governance (Domain: ${domain})...`);
  console.log(`   Timeout: ${timeoutMs}ms`);

  // Create Anthropic client with provided API key
  const anthropicClient = apiKey ? new Anthropic({ apiKey }) : anthropic;
  if (!anthropicClient) {
    throw new Error('Anthropic API key not configured');
  }

  // 1) Context via MCP (fallback) - DEPRECATED: Use FORGE v1 domain classification instead
  let ctx = { witness: "RosettaOS MCP", version: "vΩ3.5" };
  let lamport = nextLamport();
  // Legacy boot sequence removed - rosetta.boot.init and rosetta.context.get deprecated
  // Use domain classification from CRIES v4 instead

  // 2) Build mega governance context
  const context = {
    userName: options.userName || 'User',
    userRole: (options.userRole?.toLowerCase() === 'architect' || options.userName === 'Michael Tobin Gomes') ? 'Architect' :
              (options.userRole?.toLowerCase() === 'auditor' ? 'Auditor' : 'Operator'),
    witness: ctx.witness,
    version: ctx.version,
    lamport,
    mode: (managedGovernance ? 'MANAGED' : 'UNIFIED'),
    domain,  // Include domain for governance wrapper
  };

  // 3) Build unified mega governance wrapper (SYSTEM MESSAGE) - NOW DOMAIN-AWARE
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
    
    // ✅ Use FORGE v1 for receipt generation (not legacy analyzeCRIES)
    const forgeResult = computeForge(prompt, answer);
    const criesResult = {
      ...forgeResult,
      Omega: forgeResult.Φ,
      C: forgeResult.O,
      R: forgeResult.E,
      I: 0,
      E: forgeResult.G,
      S: forgeResult.F,
      domain,
      governance: true,
      userName: context.userName,
      userRole: context.userRole
    };
    
    console.log(`   📊 Pass 1 FORGE: C=${criesResult.C.toFixed(2)} R=${criesResult.R.toFixed(2)} I=${criesResult.I.toFixed(2)} E=${criesResult.E.toFixed(2)} S=${criesResult.S.toFixed(2)} | Ω=${criesResult.Omega.toFixed(2)}`);
    
    // ✅ TWO-PASS REFINEMENT: DISABLED - testing context gating strategy instead
    // const criesPillars = { C: criesResult.C, R: criesResult.R, I: criesResult.I, E: criesResult.E, S: criesResult.S };
    // const refinementPrompt = buildRefinementPrompt(prompt, answer, criesPillars);
    // console.log(`   [DEBUG] refinementPrompt is null: ${refinementPrompt === null}, S score: ${criesResult.S}`);
    // 
    // if (refinementPrompt) {
    //   console.log(`   🔄 Pass 2 refinement triggered (low scores detected)`);
    //   console.log(`   [DEBUG] Refinement prompt:\n${refinementPrompt.substring(0, 200)}...`);
    //   
    //   // Call Claude again with refinement instructions
    //   const refinementMessage = await anthropic.messages.create({
    //     model,
    //     max_tokens: 4000,
    //     temperature: 0.7,
    //     system: governanceWrapper,
    //     messages: [
    //       { role: 'user', content: prompt },
    //       { role: 'assistant', content: answer },
    //       { role: 'user', content: refinementPrompt }
    //     ]
    //   });
    //   
    //   const refinedAnswer = refinementMessage.content[0]?.text?.trim();
    //   if (refinedAnswer) {
    //     // Re-analyze refined response
    //     const refinedCriesResult = computeCriesV4(prompt, refinedAnswer, {
    //       domain,
    //       governance: true,
    //       userName: context.userName,
    //       userRole: context.userRole
    //     });
    //     
    //     console.log(`   📊 Pass 2 FORGE: C=${refinedCriesResult.C.toFixed(2)} R=${refinedCriesResult.R.toFixed(2)} I=${refinedCriesResult.I.toFixed(2)} E=${refinedCriesResult.E.toFixed(2)} S=${refinedCriesResult.S.toFixed(2)} | Ω=${refinedCriesResult.Omega.toFixed(2)}`);
    //     console.log(`   ✅ Improvement: Ω ${criesResult.Omega.toFixed(2)} → ${refinedCriesResult.Omega.toFixed(2)} (${((refinedCriesResult.Omega - criesResult.Omega) * 100).toFixed(1)}%)`);
    //     
    //     // Use refined answer and scores
    //     answer = refinedAnswer;
    //     criesResult.C = refinedCriesResult.C;
    //     criesResult.R = refinedCriesResult.R;
    //     criesResult.I = refinedCriesResult.I;
    //     criesResult.E = refinedCriesResult.E;
    //     criesResult.S = refinedCriesResult.S;
    //     criesResult.signals = refinedCriesResult.signals;
    //     criesResult.Omega = refinedCriesResult.Omega;
    //   }
    // } else {
    //   console.log(`   [DEBUG] Pass 2 NOT triggered - refinementPrompt is null`);
    // }
    
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
        governance_version: 'vΩ4.3-modular',
        governance_domain: domain,
        response_length: answer.length,
        model: model,
        two_pass: !!refinementPrompt,
        cries_v4: {
          pillars: { C: criesResult.C, R: criesResult.R, I: criesResult.I, E: criesResult.E, S: criesResult.S },
          signals: criesResult.signals,
          omega: criesResult.Omega,
          domain: criesResult.domain
        }
      },
      prev_hash: chainData.last_hash || '0'.repeat(64)
    }, { skipWrite: true }); // Cache only
    console.log(`Δ-cache Δ-RESPONSE lamport=${context.lamport} id=${receiptCache.response.id}`);
    console.log(`   🔍 Signals: RQS=${(criesResult.signals.rqs * 100).toFixed(1)}%, ALD=${(criesResult.signals.ald * 100).toFixed(1)}%, LCB=${(criesResult.signals.lcb * 100).toFixed(1)}%, OverRefusal=${(criesResult.signals.overRefusal * 100).toFixed(1)}%`);
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
  // Return basic governance context structure with domain
  return {
    governanceEnabled: true,
    maxChars: opts.maxChars || 4000,
    timestamp: new Date().toISOString(),
    version: 'v1.0',
    domain: opts.domain || 'GENERAL'  // Domain-adaptive governance support
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
  callGPT4WithStructuredGovernance,
  callGPT4WithContextAnchoredGovernance, // Context-aware, scenario-specific reasoning
  callGPT4WithSelfVerifyingGovernance,  // NEW: Forces LLM to validate its own constraints compliance
  callClaudeWithRosetta,
  callLLM,
  checkAPIAvailability,
  getRosettaGovernanceContext,
  clearBootSessions,
  getBootSessionInfo
};
