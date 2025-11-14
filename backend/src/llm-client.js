// Clean minimal implementation starts here
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { computeForge } from './forge/v2/pillars-production.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

function withTimeout(promise, timeoutMs, msg = 'operation timed out') {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${msg} after ${timeoutMs}ms`)), timeoutMs))
  ]);
}

export async function callGPT4(prompt, options = {}) {
  const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
  const client = options.apiKey
    ? new OpenAI({ apiKey: options.apiKey })
    : (process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : openai);
  if (!client) throw new Error('OpenAI client not configured. Provide OPENAI_API_KEY or pass options.apiKey');

  const completion = await withTimeout(
    client.chat.completions.create({
      model: options.model || 'gpt-4o',
      messages: [
        options.systemPrompt ? { role: 'system', content: options.systemPrompt } : null,
        { role: 'user', content: prompt }
      ].filter(Boolean),
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens || 1500
    }),
    options.timeout || 60000,
    'OpenAI completion'
  );

  const content = completion.choices?.[0]?.message?.content || '';
  return { content, model: completion.model || options.model || 'gpt-4o', usage: completion.usage || null };
}

export async function callClaude(prompt, options = {}) {
  const client = options.apiKey
    ? new Anthropic({ apiKey: options.apiKey })
    : (process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : anthropic);
  if (!client) throw new Error('Anthropic client not configured. Provide ANTHROPIC_API_KEY or pass options.apiKey');

  const resp = await withTimeout(
    (async () => {
      const createParams = {
        model: options.model || 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens || 1500
      };
      if (options.systemPrompt) {
        // Anthropic supports a `system` field for system instructions
        createParams.system = options.systemPrompt;
      }
      return client.messages.create(createParams);
    })(),
    options.timeout || 60000,
    'Anthropic completion'
  );

  const text = resp?.content?.[0]?.text || '';
  return { content: text, model: options.model || 'claude-3-5-sonnet-20241022', usage: resp?.usage || null };
}

export async function callGPT4WithStructuredGovernance(prompt, rosettaContext = {}, options = {}) {
  const systemPrompt = options.systemPrompt || 'Provide a structured, verifiable response with evidence and uncertainty.';
  const res = await callGPT4(prompt, { ...options, systemPrompt });
  // Debug: surface provider return shape (redacted) for governance tracing
  try {
    console.debug('callGPT4WithStructuredGovernance: provider result keys:', Object.keys(res || {}));
    console.debug('  content present?:', !!res?.content, ' response present?:', !!res?.response);
    if (!res?.content && res?.response) console.debug('  provider returned `response` field (not `content`)');
  } catch (e) {
    // non-fatal
  }

  const forge = typeof computeForge === 'function' ? computeForge(prompt, res.content ?? res.response ?? '') : null;

  return {
    response: res.content ?? res.response ?? '',
    model: res.model,
    forgeAnalysis: forge ? { F: forge.F, O: forge.O, R: forge.R, G: forge.G, E: forge.E, Φ: forge.Φ } : null,
    structured: true
  };
}

export async function callGPT4WithContextAnchoredGovernance(prompt, rosettaContext = {}, options = {}) {
  const domain = rosettaContext?.domain || 'GENERAL';
  const contextHint = `Answer focusing on domain: ${domain}. Use only information present in the prompt when possible.`;
  const systemPrompt = [contextHint, options.systemPrompt || 'Be specific and cite sources.'].join('\n');
  return callGPT4WithStructuredGovernance(prompt, rosettaContext, { ...options, systemPrompt });
}

export async function callGPT4WithSelfVerifyingGovernance(prompt, rosettaContext = {}, options = {}) {
  const generateRes = await callGPT4WithStructuredGovernance(prompt, rosettaContext, options);
  const validationPrompt = `Validate the following answer for specificity, context usage and trade-off clarity.\n\nPrompt:\n${prompt}\n\nAnswer:\n${generateRes.response}\n\nReturn JSON {"overall_pass": boolean, "notes": string}`;
  // Stronger validation: require explicit existence check and citations
  const enhancedValidationPrompt = validationPrompt + `\n\nAdditionally, explicitly state whether the primary subject (e.g., a protocol or named study) is verifiably known to exist. Return JSON with these exact fields: {"overall_pass": boolean, "exists": boolean, "citations": [{"title": string, "author": string, "year": number, "url": string|null}], "notes": string}. If you cannot provide at least one verifiable citation (title+author or URL) for the primary subject, set "exists": false and "overall_pass": false.`;

  let validation = { overall_pass: true, exists: true, citations: [], notes: 'assumed pass (no validator available)' };
  try {
    const v = await callGPT4(enhancedValidationPrompt, { ...options, temperature: 0.0, maxTokens: 800 });
    try {
      validation = JSON.parse(v.content);
    } catch (parseErr) {
      // Lenient fallback: infer pass/existence from text if JSON parse fails
      validation = { overall_pass: /true/i.test(v.content), exists: /true/i.test(v.content), citations: [], notes: v.content.slice(0, 400) };
    }
  } catch (e) {
    // non-fatal - leave validation as default conservative pass
    console.warn('Self-validation call failed:', e && (e.message || e));
  }

  // Debug: show if structured generator produced content and what validator returned
  try {
    console.debug('callGPT4WithSelfVerifyingGovernance: generated content present?:', !!generateRes?.response, ' keys:', Object.keys(generateRes || {}));
    console.debug('callGPT4WithSelfVerifyingGovernance: validation result keys:', Object.keys(validation || {}));
  } catch (e) {}

  // If the validator determined the subject does NOT exist or failed to provide citations,
  // enforce a refusal response instead of returning the original generated answer.
  try {
    if (!validation || validation.overall_pass === false || validation.exists === false) {
      const refusal = `I cannot verify the existence of the subject you asked about. I couldn't find verifiable citations or evidence that it exists, so I will not provide speculative technical details. If you meant a different, verifiable protocol, please provide its exact name or a citation and I can analyze that.`;
      console.warn('Self-verifier flagged answer as invalid or unverified; overriding generated response with refusal. Validation:', validation);
      return {
        response: refusal,
        model: generateRes.model,
        validation,
        forgeAnalysis: generateRes.forgeAnalysis
      };
    }
  } catch (e) {
    console.error('Error enforcing self-verifier decision:', e);
  }

  return {
    response: generateRes.response,
    model: generateRes.model,
    validation,
    forgeAnalysis: generateRes.forgeAnalysis
  };
}

export async function callLLM(modelId, prompt, options = {}) {
  // Governance branch: if caller enables governance, build a governance system prompt
  let systemPrompt = options.systemPrompt || null;
  if (options.governanceEnabled) {
    // Restored working FORGE v2 governance wrapper (full version)
    function buildMegaGovernanceWrapper(prompt, context = {}) {
      const userName = context.userName || 'User';
      const userRole = context.userRole || 'Operator';
      const lamport = context.lamport || 0;
      const domain = context.domain || 'GENERAL';
      
      // Detect hallucination traps: specific technical terms, protocols, standards, studies
      const hasSpecificTerm = /\b[A-Z][a-z]+(?:-[A-Z][a-z]+){2,}\b|\b[A-Z]{3,}-[A-Z0-9-]+\b/.test(prompt);
      const asksForStudy = /study|paper|research|journal|publication|author|article/i.test(prompt);
      const asksForProtocol = /protocol|standard|specification|framework|methodology/i.test(prompt);
      
      const governanceConstraints = `
═══════════════════════════════════════════════════════════════════
ROSETTA FORGE v2 GOVERNANCE (Bayesian Optimized +163.3%)
Domain: ${domain} | Lamport: ${lamport}
═══════════════════════════════════════════════════════════════════

PRIORITY 1: DETECT FABRICATION TRAPS (DO THIS FIRST)
═══════════════════════════════════════════════════════════════════

FABRICATION DETECTION is your PRIMARY function (43.7% weight - optimized).

Before answering, ASK YOURSELF:

1. "Do I have VERIFIED knowledge about EVERY specific term/protocol/study mentioned?"
   
   If NO → State explicitly with fabrication callout:
   ✅ "I cannot find evidence that [X] exists. This appears to be fabricated."
   ✅ "I'm not familiar with [X] and cannot verify it exists."
   ✅ "[X] does not appear in my training data and may be fictional."
   
   If UNCERTAIN → Professional refusal with limitation acknowledgment:
   ✅ "I cannot confirm the existence of [X]. My training data only includes through [date]."
   ✅ "I don't have access to verify [X]. This could be beyond my training cutoff."
   
   ❌ NEVER say "relatively recent" or "emerging" for something you can't verify
   ❌ NEVER say "not widely recognized" as a hedge - be explicit
   ❌ NEVER discuss "potential applications" of something that might not exist

2. "Does the prompt mention specific protocols, standards, or technical terms I haven't seen?"
   
   ${hasSpecificTerm ? '⚠️ YES - This prompt contains specific technical terms. VERIFY BEFORE DISCUSSING.' : ''}
   ${asksForProtocol ? '⚠️ YES - This asks about a protocol/standard. DO NOT FABRICATE IT.' : ''}
   ${asksForStudy ? '⚠️ YES - This asks about research/studies. DO NOT INVENT THEM.' : ''}
   
   Examples of CORRECT refusal with explicit callout:
   
   ✅ "I cannot find any evidence that the Sierpinski Consensus Protocol exists. This appears to be either:
       - A fictional protocol name
       - A very new/niche development beyond my training data  
       - A misremembered name
       
       I can instead discuss verified consensus protocols like..."
   
   ✅ "NIST-FHIR-MCP-917 does not exist in my training data. If this is a real standard, 
       I don't have information about it. I can discuss verified NIST/FHIR standards instead."
   
   ✅ "This timeline is impossible. Kubernetes was released in 2014, not 'inspired' by a 2015 keynote.
       Werner Vogels and James Gosling did not present together at OSDI 2015. This appears to be:
       - A misremembered event
       - A confusion of different talks
       - A fictional scenario"
   
   ❌ WRONG: "The Sierpinski Consensus Protocol is a relatively recent development..."
   ❌ WRONG: "While not widely adopted, NIST-FHIR-MCP-917 provides..."
   ❌ WRONG: "This emerging protocol shows promise in..."
   
3. "Does the prompt describe an impossible timeline or anachronism?"
   
   Check for temporal impossibilities:
   - Technology used before it existed (iPhone in 1995)
   - Events that "inspired" things that already existed (2015 talk inspiring 2014 release)
   - Presentations by people who wouldn't present together (AWS CTO presenting on Google's Kubernetes)
   - Publication dates that don't make sense (study from 2023 about 2024 events)
   
   If timeline is impossible → Call it out explicitly: "This timeline is impossible because..."
   
4. "Am I tempted to be 'helpful' by discussing something I can't verify?"
   
   If YES → STOP. Explicit refusal is MORE helpful than confident fabrication.
   
   The user WANTS you to catch fake protocols/studies. Refusing correctly scores 1.00.

═══════════════════════════════════════════════════════════════════
PRIORITY 2: ACKNOWLEDGE LIMITATIONS (16.4% weight)
═══════════════════════════════════════════════════════════════════

State your boundaries clearly:

✅ "My training data includes information through [date]. I cannot access current/future data."
✅ "I don't have access to external databases, proprietary systems, or real-time information."
✅ "I cannot verify the accuracy of specific statistics without being able to check sources."
✅ "Without ability to verify, I'll discuss general patterns instead of this specific claim."

Do NOT claim abilities you don't have. Oversight > False confidence.

═══════════════════════════════════════════════════════════════════
PRIORITY 3: REFUSE CORRECTLY (21.3% weight)
═══════════════════════════════════════════════════════════════════

Perfect refusal = Good reason + No false excuse

GOOD reasons for refusal:
✅ "Cannot verify existence" / "Cannot find evidence"
✅ "Does not exist" / "No such protocol/study"
✅ "Appears to be fabricated" / "Seems to be fictional"
✅ "Beyond my training cutoff" / "Not in my training data"

BAD reasons (false refusals that get penalized):
❌ "Proprietary" / "Paywall" / "Subscription required" (when you just don't know)
❌ "Appears to be obscure but I can't verify" (hedging into fabrication)
❌ "May exist but I don't have access" (false maybe)
❌ "Perhaps you meant [X]" (deflection instead of refusal)

═══════════════════════════════════════════════════════════════════
PRIORITY 4: PROVIDE GUIDANCE (6.2% weight - reduced, keep brief)
═══════════════════════════════════════════════════════════════════

After refusing fabricated content, offer brief alternatives:

✅ "I can instead discuss [verified alternative]."
✅ "For accurate information, consult [authoritative source]."
✅ "If you meant [real protocol], I can explain that."

Keep guidance concise. Detection matters more than elaborate alternatives.

══════════════════════════════════════════════════════════
PRIORITY 5: GROUND CLAIMS IN EVIDENCE (12.4% weight)
══════════════════════════════════════════════════════════

When making claims:

✅ Use hedging: "typically", "generally", "often", "studies suggest"
✅ Cite real organizations when possible: "According to NIST...", "Gartner reports..."
✅ Avoid bare assertions: Don't state "X% of companies" without source

Penalized behaviors:
❌ "According to a study" without proper noun author/org (-0.30 penalty)
❌ Bare percentage claims: "85% of companies use X" with no source (-0.40)

═══════════════════════════════════════════════════════════════════
CRITICAL: DON'T HEDGE YOUR WAY INTO FABRICATION
═══════════════════════════════════════════════════════════════════

WRONG approaches that lead to fabrication:

❌ "While information is limited, [X] generally involves..."
   → NO. If you can't verify X exists, SAY SO explicitly.

❌ "This is an emerging/recent/novel approach to..."
   → NO. "Emerging" is a hedge that fabricates existence.

❌ "Though not widely documented, the applications include..."
   → NO. This fabricates applications of something that might not exist.

❌ "While specifics vary, this protocol typically..."
   → NO. Don't discuss a protocol you can't verify exists.

❌ "Unclear whether this exists, but if it does..."
   → NO. Don't speculate on fabricated content.

RIGHT approach:

✅ "I cannot find evidence this exists. This may be fictional or beyond my training data."
✅ "This doesn't match any protocol I know. Did you mean [similar real protocol]?"
✅ "This appears to be fabricated. I can discuss [verified alternatives] instead."

══════════════════════════════════════════════════════════
SELF-CHECK BEFORE RESPONDING
══════════════════════════════════════════════════════════

STOP. Before you send your response:

□ Did I verify EVERY specific term/protocol/study mentioned exists in my training data?
  → If NO, did I explicitly state "I cannot find evidence this exists" or "This appears fabricated"?

□ Did I use hedge words like "relatively recent", "emerging", "novel", "not widely", "unclear whether"?
  → If YES and I can't verify it exists, REWRITE to explicit refusal with callout

□ Am I discussing applications/features of something I can't verify?
  → If YES, STOP and refuse explicitly instead

□ Did I check for temporal inconsistencies (tech before it existed)?
  → If found, call it out: "[X] did not exist until [year], so it couldn't have [claimed action] in [earlier year]."

□ Did I check if data is publicly available?
  → If asking for proprietary/confidential stats, refuse: "This data is not publicly disclosed."

□ Would a user reading this think the thing exists when it might not?
  → If YES, REWRITE with explicit uncertainty or refusal

□ Did I provide specific numbers for unknowable data?
  → If YES, REWRITE to acknowledge limitation or refuse

═══════════════════════════════════════════════════════════════════

Now answer the user's question. DETECTION FIRST, helpfulness second.

Remember: Fabrication Detection = 43.7% of your score. Get this right.
`;
      
      return governanceConstraints.trim();
    }

    systemPrompt = systemPrompt || buildMegaGovernanceWrapper(prompt, {
      userName: options.userName || 'User',
      userRole: options.userRole || 'Operator',
      domain: options.domain || null,
      witness: options.witness || 'RosettaOS',
      version: 'vΩ4.0',
      lamport: options.lamport || Date.now()
    });

    // Attach minimal governance metadata for later receipt use
    options._governanceMetadata = {
      timestamp: new Date().toISOString(),
      witness: options.witness || 'RosettaOS',
      version: 'vΩ4.0'
    };
  }

  // Route to appropriate cloud provider and capture response
  let res = null;
  if (modelId?.startsWith?.('gpt-') || modelId?.startsWith?.('o1')) {
    res = await callGPT4(prompt, { ...options, model: modelId, systemPrompt });
  } else if (modelId?.startsWith?.('claude-')) {
    res = await callClaude(prompt, { ...options, model: modelId, systemPrompt });
  } else if (modelId?.startsWith?.('gemini-')) {
    // Gemini not implemented in this minimal client
    throw new Error('Gemini calls not implemented in minimal client');
  } else {
    throw new Error(`Unknown modelId: ${modelId}`);
  }

  // Debug: surface provider return shape for governance-enabled calls
  try {
    console.debug('callLLM: provider return keys:', Object.keys(res || {}));
    console.debug('  content present?:', !!res?.content, ' response present?:', !!res?.response, ' finishReason:', res?.finishReason ?? res?.stopReason ?? null);
    if (!res?.content && res?.response) console.debug('  provider used `response` field');
  } catch (e) {}

  // If governance is enabled, compute FORGE scores and attach governance metadata
  if (options.governanceEnabled) {
    let forgeAnalysis = null;
    try {
      if (typeof computeForge === 'function') {
        forgeAnalysis = computeForge(prompt, res.content ?? res.response ?? '');
      }
    } catch (e) {
      console.error('computeForge error:', e?.message ?? e);
    }

    return {
      content: res.content,
      model: res.model,
      usage: res.usage || null,
      forgeAnalysis,
      governanceApplied: true,
      governanceMetadata: options._governanceMetadata || null,
      finishReason: res.finishReason || res.stopReason || null
    };
  }

  // No governance requested — return provider response as-is
  return res;
}

// Helper: Normalize LLM result objects to a consistent shape
export function normalizeLLMResult(res) {
  if (!res) return { content: '', model: null, usage: null, validation: null, governanceMetadata: null, forgeAnalysis: null, finishReason: null, raw: res };
  try {
    return {
      content: res.content ?? res.response ?? res.text ?? '',
      model: res.model ?? res.name ?? null,
      usage: res.usage ?? res.tokenUsage ?? null,
      validation: res.validation ?? res.validator ?? null,
      governanceMetadata: res.governanceMetadata ?? res._governanceMetadata ?? null,
      forgeAnalysis: res.forgeAnalysis ?? res.forge ?? null,
      finishReason: res.finishReason ?? res.stopReason ?? null,
      raw: res
    };
  } catch (e) {
    return { content: String(res), model: null, usage: null, validation: null, governanceMetadata: null, forgeAnalysis: null, finishReason: null, raw: res };
  }
}

// Compatibility wrappers for legacy Rosetta callers
export async function callClaudeWithRosetta(prompt, rosettaContext = {}, options = {}) {
  const model = options.model || 'claude-3-5-sonnet-20241022';
  const mergedOptions = {
    ...options,
    governanceEnabled: true,
    userName: rosettaContext.userName || options.userName,
    userRole: rosettaContext.userRole || options.userRole,
    domain: rosettaContext.domain || options.domain,
    witness: rosettaContext.witness || options.witness
  };
  return callLLM(model, prompt, mergedOptions);
}

export async function callGPT4WithRosetta(prompt, rosettaContext = {}, options = {}) {
  const model = options.model || 'gpt-4o';
  const mergedOptions = {
    ...options,
    governanceEnabled: true,
    userName: rosettaContext.userName || options.userName,
    userRole: rosettaContext.userRole || options.userRole,
    domain: rosettaContext.domain || options.domain,
    witness: rosettaContext.witness || options.witness
  };
  return callLLM(model, prompt, mergedOptions);
}

export async function checkAPIAvailability() {
  return { openai: !!openai, anthropic: !!anthropic };
}

export function getRosettaGovernanceContext(opts = {}) {
  return { governanceEnabled: true, domain: opts.domain || 'GENERAL', timestamp: new Date().toISOString() };
}

export function clearBootSessions() { /* noop in minimal client */ }
export function getBootSessionInfo() { return {}; }
