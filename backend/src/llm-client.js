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

// Note: TypeScript imports commented out - use JS equivalents instead
// import { applyRosettaKernel, validateGovernanceIntegrity, nextLamport } from '../rosetta/kernel.ts';
// import { generateBootConfirmReceipt, persistReceipt } from '../rosetta/receipts.ts';
// import { buildOmegaV15GovernedPrompt } from '../rosetta/persona/persona-v15.ts';
// import { writeReceipt, appendChain, sha256Hex } from '../rosetta/audit/receipts.ts';

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
 * @deprecated Use callLLM() with governanceEnabled: true instead
 * Call GPT-4 with Rosetta governance (OLD SYSTEM - uses weak persona-v15 framing)
 * This function uses the deprecated buildOmegaV15GovernedPrompt which Claude often refuses.
 * Migrate to: callLLM(modelId, prompt, { governanceEnabled: true, userName, userRole, apiKeys })
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

  console.log(`🚀 Calling ${model} with Rosetta Ω³ Governance...`);
  console.log(`   Timeout: ${timeoutMs}ms`);

  // Create OpenAI client with provided API key
  const openaiClient = apiKey ? new OpenAI({ apiKey }) : openai;
  if (!openaiClient) {
    throw new Error('OpenAI API key not configured');
  }

  // 1) Context via MCP (fallback)
  let ctx = { witness: "RosettaOS MCP", version: "vΩ3.4" };
  let lamport = nextLamport();
  try {
    ctx = await mcp("rosetta.context.get", {});
    const lam = await mcp("rosetta.lamport.increment", { current: lamport });
    lamport = lam?.next ?? lamport;
  } catch { /* fallback ok */ }

  // 2) Phase-4 context
  const context = {
    persona: (options.userRole?.toLowerCase() === 'architect' || options.userName === 'Michael Tobin Gomes') ? 'Architect' :
             (options.userRole?.toLowerCase() === 'auditor' ? 'Auditor' : 'Viewer'),
    witness: ctx.witness,
    band: '0',
    mode: (managedGovernance ? 'MANAGED' : 'TRANSPARENT'),
    lamport,
    bootTime: new Date().toISOString(),
    identityLock: true,
    version: ctx.version
  };

  // 3) Persona wrapper (Ω³ vibe, no receipts printed)
  const acks = [
    `RosettaOS MCP initialized — witness: ${ctx.witness}`,
    `Handshake confirmed — version: ${ctx.version}`
  ];
  const governedPrompt = buildOmegaV15GovernedPrompt(prompt, context, acks);

  // 4) Silent Δ-PROMPT receipt
  try {
    const chainData = JSON.parse(await fs.readFile('./receipts/chain.json', 'utf8').catch(() => '{"last_hash":"' + '0'.repeat(64) + '"}'));
    const promptReceipt = await writeReceipt({
      id: uuid(),
      type: 'Δ-PROMPT',
      lamport: context.lamport,
      ts: new Date().toISOString(),
      witness: `openai:${model}`,
      band: 'B0',
      payload: { userPrompt: prompt },
      prev_hash: chainData.last_hash || '0'.repeat(64)
    });
    await appendChain(promptReceipt);
    console.log(`Δ-emit Δ-PROMPT lamport=${context.lamport} id=${promptReceipt.id} hash=${promptReceipt.hash.slice(0,8)}…`);
  } catch (e) {
    console.error('Failed to emit Δ-PROMPT receipt:', e?.message ?? e);
  }

  // 5) Call LLM with Ω³ wrapper
  const completion = await withTimeout(
    openaiClient.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: governedPrompt }],
      temperature: options.temperature || 0.5,
      max_tokens: options.maxTokens || 2000
    }),
    timeoutMs,
    'OpenAI completion'
  );
  const answer = completion.choices[0].message.content || '';

  // 6) (Optional) Δ-ANALYSIS (short)
  try {
    const chainData = JSON.parse(await fs.readFile('./receipts/chain.json', 'utf8').catch(() => '{"last_hash":"' + '0'.repeat(64) + '"}'));
    const analysisReceipt = await writeReceipt({
      id: uuid(),
      type: 'Δ-ANALYSIS',
      lamport: context.lamport,
      ts: new Date().toISOString(),
      witness: 'RosettaOS',
      band: 'B0',
      payload: { hints: 'Ω³-governed-output, CRIES implicit, persona=' + context.persona },
      prev_hash: chainData.last_hash || '0'.repeat(64)
    });
    await appendChain(analysisReceipt);
    console.log(`Δ-emit Δ-ANALYSIS lamport=${context.lamport} id=${analysisReceipt.id} hash=${analysisReceipt.hash.slice(0,8)}…`);
  } catch (e) {
    console.error('Failed to emit Δ-ANALYSIS receipt:', e?.message ?? e);
  }

  // 7) Δ-RESPONSE receipt
  try {
    const chainData = JSON.parse(await fs.readFile('./receipts/chain.json', 'utf8').catch(() => '{"last_hash":"' + '0'.repeat(64) + '"}'));
    const responseReceipt = await writeReceipt({
      id: uuid(),
      type: 'Δ-RESPONSE',
      lamport: context.lamport,
      ts: new Date().toISOString(),
      witness: `openai:${model}`,
      band: 'B0',
      payload: { content: answer.slice(0, 6000) }, // keep payload compact
      prev_hash: chainData.last_hash || '0'.repeat(64)
    });
    await appendChain(responseReceipt);
    console.log(`Δ-emit Δ-RESPONSE lamport=${context.lamport} id=${responseReceipt.id} hash=${responseReceipt.hash.slice(0,8)}…`);
  } catch (e) {
    console.error('Failed to emit Δ-RESPONSE receipt:', e?.message ?? e);
  }

  // 8) Return ONLY the answer (no receipts in UI)
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
 * Generic LLM call - routes to appropriate cloud provider
 */
export async function callLLM(modelId, prompt, options = {}) {
  // Extract API keys if provided
}

/**
 * @deprecated Use callLLM() with governanceEnabled: true instead
 * Call Claude with Rosetta governance (OLD SYSTEM - uses weak persona-v15 framing)
 * This function uses the deprecated buildOmegaV15GovernedPrompt which Claude often refuses.
 * Migrate to: callLLM(modelId, prompt, { governanceEnabled: true, userName, userRole, apiKeys })
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

  console.log(`🚀 Calling ${model} with Rosetta Ω³ Governance...`);
  console.log(`   Timeout: ${timeoutMs}ms`);

  // Create Anthropic client with provided API key
  const anthropicClient = apiKey ? new Anthropic({ apiKey }) : anthropic;
  if (!anthropicClient) {
    throw new Error('Anthropic API key not configured');
  }

  // 1) Context via MCP (fallback)
  let ctx = { witness: "RosettaOS MCP", version: "vΩ3.4" };
  let lamport = nextLamport();
  try {
    ctx = await mcp("rosetta.context.get", {});
    const lam = await mcp("rosetta.lamport.increment", { current: lamport });
    lamport = lam?.next ?? lamport;
  } catch { /* fallback ok */ }

  // 2) Phase-4 context
  const context = {
    persona: (options.userRole?.toLowerCase() === 'architect' || options.userName === 'Michael Tobin Gomes') ? 'Architect' :
             (options.userRole?.toLowerCase() === 'auditor' ? 'Auditor' : 'Viewer'),
    witness: ctx.witness,
    band: '0',
    mode: (managedGovernance ? 'MANAGED' : 'TRANSPARENT'),
    lamport,
    bootTime: new Date().toISOString(),
    identityLock: true,
    version: ctx.version
  };

  // 3) Persona wrapper (Ω³ vibe, no receipts printed)
  const acks = [
    `RosettaOS MCP initialized — witness: ${ctx.witness}`,
    `Handshake confirmed — version: ${ctx.version}`
  ];
  const governedPrompt = buildOmegaV15GovernedPrompt(prompt, context, acks);

  // 4) Silent Δ-PROMPT receipt
  try {
    const chainData = JSON.parse(await fs.readFile('./receipts/chain.json', 'utf8').catch(() => '{"last_hash":"' + '0'.repeat(64) + '"}'));
    const promptReceipt = await writeReceipt({
      id: uuid(),
      type: 'Δ-PROMPT',
      lamport: context.lamport,
      ts: new Date().toISOString(),
      witness: `anthropic:${model}`,
      band: 'B0',
      payload: { userPrompt: prompt },
      prev_hash: chainData.last_hash || '0'.repeat(64)
    });
    await appendChain(promptReceipt);
    console.log(`Δ-emit Δ-PROMPT lamport=${context.lamport} id=${promptReceipt.id} hash=${promptReceipt.hash.slice(0,8)}…`);
  } catch (e) {
    console.error('Failed to emit Δ-PROMPT receipt:', e?.message ?? e);
  }

  // 5) Call LLM with Ω³ wrapper
  const message = await withTimeout(
    anthropicClient.messages.create({
      model: model,
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.5,
      messages: [{ role: 'user', content: governedPrompt }]
    }),
    timeoutMs,
    'Anthropic completion'
  );
  const answer = message.content[0].text || '';

  // 6) (Optional) Δ-ANALYSIS (short)
  try {
    const chainData = JSON.parse(await fs.readFile('./receipts/chain.json', 'utf8').catch(() => '{"last_hash":"' + '0'.repeat(64) + '"}'));
    const analysisReceipt = await writeReceipt({
      id: uuid(),
      type: 'Δ-ANALYSIS',
      lamport: context.lamport,
      ts: new Date().toISOString(),
      witness: 'RosettaOS',
      band: 'B0',
      payload: { hints: 'Ω³-governed-output, CRIES implicit, persona=' + context.persona },
      prev_hash: chainData.last_hash || '0'.repeat(64)
    });
    await appendChain(analysisReceipt);
    console.log(`Δ-emit Δ-ANALYSIS lamport=${context.lamport} id=${analysisReceipt.id} hash=${analysisReceipt.hash.slice(0,8)}…`);
  } catch (e) {
    console.error('Failed to emit Δ-ANALYSIS receipt:', e?.message ?? e);
  }

  // 7) Δ-RESPONSE receipt
  try {
    const chainData = JSON.parse(await fs.readFile('./receipts/chain.json', 'utf8').catch(() => '{"last_hash":"' + '0'.repeat(64) + '"}'));
    const responseReceipt = await writeReceipt({
      id: uuid(),
      type: 'Δ-RESPONSE',
      lamport: context.lamport,
      ts: new Date().toISOString(),
      witness: `anthropic:${model}`,
      band: 'B0',
      payload: { content: answer.slice(0, 6000) }, // keep payload compact
      prev_hash: chainData.last_hash || '0'.repeat(64)
    });
    await appendChain(responseReceipt);
    console.log(`Δ-emit Δ-RESPONSE lamport=${context.lamport} id=${responseReceipt.id} hash=${responseReceipt.hash.slice(0,8)}…`);
  } catch (e) {
    console.error('Failed to emit Δ-RESPONSE receipt:', e?.message ?? e);
  }

  // 8) Return ONLY the answer (no receipts in UI)
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
 * @deprecated Use callLLM() with governanceEnabled: true instead
 * Call Ollama with Rosetta governance (OLD SYSTEM - uses weak persona-v15 framing)
 * This function uses the deprecated buildOmegaV15GovernedPrompt which Claude often refuses.
 * Migrate to: callLLM(modelId, prompt, { governanceEnabled: true, userName, userRole })
 */
export async function callOllamaWithRosetta(prompt, rosettaContext, options = {}) {
  const model = options.model || 'llama3.1:8b';
  const managedGovernance = options.managedGovernance || false;
  const timeoutMs = options.timeout || 60000;

  // Check if Rosetta is booted - if not, fall back to basic call
  try {
    await mcp('rosetta.boot.init', {});
  } catch {
    console.log('Rosetta not booted, falling back to basic Ollama call');
    return callOllama(prompt, { ...options, model });
  }

  console.log(`🚀 Calling ${model} with Rosetta Ω³ Governance...`);
  console.log(`   Timeout: ${timeoutMs}ms`);

  // 1) Context via MCP (fallback)
  let ctx = { witness: "RosettaOS MCP", version: "vΩ3.4" };
  let lamport = nextLamport();
  try {
    ctx = await mcp("rosetta.context.get", {});
    const lam = await mcp("rosetta.lamport.increment", { current: lamport });
    lamport = lam?.next ?? lamport;
  } catch { /* fallback ok */ }

  // 2) Phase-4 context
  const context = {
    persona: (options.userRole?.toLowerCase() === 'architect' || options.userName === 'Michael Tobin Gomes') ? 'Architect' :
             (options.userRole?.toLowerCase() === 'auditor' ? 'Auditor' : 'Viewer'),
    witness: ctx.witness,
    band: '0',
    mode: (managedGovernance ? 'MANAGED' : 'TRANSPARENT'),
    lamport,
    bootTime: new Date().toISOString(),
    identityLock: true,
    version: ctx.version
  };

  // 3) Persona wrapper (Ω³ vibe, no receipts printed)
  const acks = [
    `RosettaOS MCP initialized — witness: ${ctx.witness}`,
    `Handshake confirmed — version: ${ctx.version}`
  ];
  const governedPrompt = buildOmegaV15GovernedPrompt(prompt, context, acks);

  // 4) Silent Δ-PROMPT receipt
  try {
    const chainData = JSON.parse(await fs.readFile('./receipts/chain.json', 'utf8').catch(() => '{"last_hash":"' + '0'.repeat(64) + '"}'));
    const promptReceipt = await writeReceipt({
      id: uuid(),
      type: 'Δ-PROMPT',
      lamport: context.lamport,
      ts: new Date().toISOString(),
      witness: `ollama:${model}`,
      band: 'B0',
      payload: { userPrompt: prompt },
      prev_hash: chainData.last_hash || '0'.repeat(64)
    });
    await appendChain(promptReceipt);
    console.log(`Δ-emit Δ-PROMPT lamport=${context.lamport} id=${promptReceipt.id} hash=${promptReceipt.hash.slice(0,8)}…`);
  } catch (e) {
    console.error('Failed to emit Δ-PROMPT receipt:', e?.message ?? e);
  }

  // 5) Call LLM with Ω³ wrapper
  const response = await withTimeout(
    callOllama(governedPrompt, { ...options, model }),
    timeoutMs,
    'Ollama completion'
  );
  const answer = response.content || '';

  // 6) (Optional) Δ-ANALYSIS (short)
  try {
    const chainData = JSON.parse(await fs.readFile('./receipts/chain.json', 'utf8').catch(() => '{"last_hash":"' + '0'.repeat(64) + '"}'));
    const analysisReceipt = await writeReceipt({
      id: uuid(),
      type: 'Δ-ANALYSIS',
      lamport: context.lamport,
      ts: new Date().toISOString(),
      witness: 'RosettaOS',
      band: 'B0',
      payload: { hints: 'Ω³-governed-output, CRIES implicit, persona=' + context.persona },
      prev_hash: chainData.last_hash || '0'.repeat(64)
    });
    await appendChain(analysisReceipt);
    console.log(`Δ-emit Δ-ANALYSIS lamport=${context.lamport} id=${analysisReceipt.id} hash=${analysisReceipt.hash.slice(0,8)}…`);
  } catch (e) {
    console.error('Failed to emit Δ-ANALYSIS receipt:', e?.message ?? e);
  }

  // 7) Δ-RESPONSE receipt
  try {
    const chainData = JSON.parse(await fs.readFile('./receipts/chain.json', 'utf8').catch(() => '{"last_hash":"' + '0'.repeat(64) + '"}'));
    const responseReceipt = await writeReceipt({
      id: uuid(),
      type: 'Δ-RESPONSE',
      lamport: context.lamport,
      ts: new Date().toISOString(),
      witness: `ollama:${model}`,
      band: 'B0',
      payload: { content: answer.slice(0, 6000) }, // keep payload compact
      prev_hash: chainData.last_hash || '0'.repeat(64)
    });
    await appendChain(responseReceipt);
    console.log(`Δ-emit Δ-RESPONSE lamport=${context.lamport} id=${responseReceipt.id} hash=${responseReceipt.hash.slice(0,8)}…`);
  } catch (e) {
    console.error('Failed to emit Δ-RESPONSE receipt:', e?.message ?? e);
  }

  // 8) Return ONLY the answer (no receipts in UI)
  return {
    content: answer,
    model,
    usage: response.usage || {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    },
    provider: 'ollama',
    free: true,
    governance: {
      persona: context.persona,
      // Do NOT include raw receipts in UI payloads
    }
  };
}

/**
 * Generic LLM call - routes to appropriate provider
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
    
    // Load appropriate governance prompt based on model tier
    systemPrompt = await loadRosettaPrompt(
      governanceTier,
      buildGovernedPrompt, // MCP function for Full tier
      {
        prompt,
        userName: options.userName || 'System',
        userRole: options.userRole || 'Operator',
        managedGovernance: options.managedGovernance || false
      }
    );
    
    finalPrompt = prompt; // Keep original user prompt
    
    // Enhanced governance logging (Production-grade)
    const govMetadata = getGovernanceMetadata(governanceTier, systemPrompt);
    console.log(`[GOVERNANCE:PROD] ═══════════════════════════════════════════════════════`);
    console.log(`[GOVERNANCE:PROD] Model: ${modelId}`);
    console.log(`[GOVERNANCE:PROD] Tier: ${governanceTier.toUpperCase()}`);
    console.log(`[GOVERNANCE:PROD] Profile: Rosetta-${governanceTier.toUpperCase()} vΩ-Enterprise`);
    console.log(`[GOVERNANCE:PROD] Prompt Size: ${systemPrompt.length} chars`);
    console.log(`[GOVERNANCE:PROD] Timestamp: ${govMetadata.timestamp}`);
    console.log(`[GOVERNANCE:PROD] Compliance: Enterprise-Ready`);
    console.log(`[GOVERNANCE:PROD] CRIES Target: ${governanceTier === 'frontier' ? 'Ω +15-20%' : 'Ω +8-12%'}`);
    console.log(`[GOVERNANCE:PROD] ═══════════════════════════════════════════════════════`);
    
    // Store governance metadata for receipts
    options._governanceMetadata = govMetadata;
  }

  // Route to appropriate cloud provider
  if (modelId.startsWith('gpt-')) {
    // OpenAI models
    if (!openai && !openaiKey) {
      throw new Error('OpenAI API key not configured. Please provide an API key in environment or options.');
    }
    return callGPT4(finalPrompt, { ...options, model: modelId, apiKey: openaiKey, systemPrompt });
  } 
  else if (modelId.startsWith('claude-')) {
    // Anthropic models
    if (!anthropic && !anthropicKey) {
      throw new Error('Anthropic API key not configured. Please provide an API key in environment or options.');
    }
    return callClaude(finalPrompt, { ...options, model: modelId, apiKey: anthropicKey, systemPrompt });
  } 
  else {
    // Unknown model
    throw new Error(`Unknown model: ${modelId}. Supported models: gpt-4, gpt-4-turbo, gpt-3.5-turbo, claude-3-opus, claude-3-sonnet, claude-3-5-sonnet, claude-3-haiku`);
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
