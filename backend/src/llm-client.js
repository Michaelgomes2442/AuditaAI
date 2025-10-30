/**
 * LLM Client - OpenAI, Anthropic & Ollama Integration
 * 
 * Provides unified interface for calling real LLM APIs and free local models
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import { v4 as uuid } from 'uuid';
import { mcp } from './mcp-client.js';
import { applyRosettaKernel, validateGovernanceIntegrity, nextLamport } from '../rosetta/kernel.ts';
import { generateBootConfirmReceipt, persistReceipt } from '../rosetta/receipts.ts';
import { buildOmegaV15GovernedPrompt } from '../rosetta/persona/persona-v15.ts';
import { writeReceipt, appendChain, sha256Hex } from '../rosetta/audit/receipts.ts';

dotenv.config();

// Initialize clients
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Ollama client (free local models - no API key needed!)
const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const ollamaEnabled = process.env.ENABLE_OLLAMA !== 'false'; // Enabled by default

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
async function buildGovernedPrompt(rawPrompt, opts = {}) {
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
 * Call Ollama (free local LLM - no API key needed!)
 * Supports: llama3, mistral, phi, gemma, qwen, etc.
 */
export async function callOllama(prompt, options = {}) {
  const model = options.model || 'llama3.1:8b'; // Default to larger model with bigger context window
  const timeoutMs = options.timeout || 30000; // Default 30 second timeout
  
  console.log(`🦙 Calling Ollama (${model})...`);
  console.log(`   Free local model - no API key needed`);
  console.log(`   Prompt length: ${prompt.length} chars`);
  console.log(`   Timeout: ${timeoutMs}ms`);

  try {
    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    const response = await fetch(`${ollamaBaseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          top_p: options.topP || 0.9,
          top_k: options.topK || 40,
          num_predict: options.maxTokens || 2000
        }
      })
    });

    clearTimeout(timeoutId); // Clear timeout if request completed

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.response || '';

    console.log(`   ✅ Response received: ${content.length} chars`);
    console.log(`   Tokens: ${data.total_duration ? Math.round(data.total_duration / 1000000) + 'ms' : 'N/A'}`);

    return {
      content: content,
      model: model,
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
      },
      provider: 'ollama',
      free: true
    };
  } catch (error) {
    console.error(`❌ Ollama call failed:`, error.message);
    
    // Handle timeout specifically
    if (error.name === 'AbortError') {
      throw new Error(`Ollama call timed out after ${timeoutMs}ms. The model may be overloaded or the prompt too large.`);
    }
    
    throw new Error(`Ollama call failed: ${error.message}. Is Ollama running? Install: https://ollama.ai`);
  }
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
    const completion = await client.chat.completions.create({
      model: options.model || 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
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
      finishReason: completion.choices[0].finish_reason
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
    const message = await client.messages.create({
      model: options.model || 'claude-3-5-sonnet-20241022',
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

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
      stopReason: message.stop_reason
    };
  } catch (error) {
    console.error(`   ❌ Claude Error: ${error.message}`);
    throw error;
  }
}

/**
 * Call GPT-4 with Rosetta governance
 * Uses shared buildGovernedPrompt helper for Phase-2 Kernel + Phase-3 MCP integration
 */
export async function callGPT4WithRosetta(prompt, rosettaContext, options = {}) {
  const model = options.model || 'gpt-4o';
  const managedGovernance = options.managedGovernance || false;
  const timeoutMs = options.timeout || 60000;
  const apiKey = options.apiKey;

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
    provider: 'openai',
    governance: {
      persona: context.persona,
      // Do NOT include raw receipts in UI payloads
    }
  };
}

/**
 * Call Claude with Rosetta governance
 * Uses shared buildGovernedPrompt helper for Phase-2 Kernel + Phase-3 MCP integration
 */
export async function callClaudeWithRosetta(prompt, rosettaContext, options = {}) {
  const model = options.model || 'claude-3-5-sonnet-20241022';
  const managedGovernance = options.managedGovernance || false;
  const timeoutMs = options.timeout || 60000;
  const apiKey = options.apiKey;

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
 * Call Ollama with Rosetta governance
 * Uses shared buildGovernedPrompt helper for Phase-2 Kernel + Phase-3 MCP integration
 */
export async function callOllamaWithRosetta(prompt, rosettaContext, options = {}) {
  const model = options.model || 'llama3.1:8b';
  const managedGovernance = options.managedGovernance || false;
  const timeoutMs = options.timeout || 60000;

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
  if (options.governanceEnabled) {
    const governanceResult = await buildGovernedPrompt(prompt, {
      userName: options.userName || 'System',
      userRole: options.userRole || 'Operator',
      managedGovernance: options.managedGovernance || false
    });
    finalPrompt = governanceResult.transformedPrompt;
  }

  // Check if it's an Ollama model (free local models)
  if (ollamaEnabled && isOllamaModel(modelId)) {
    return callOllama(finalPrompt, { ...options, model: modelId });
  }
  // OpenAI models
  else if (modelId.startsWith('gpt-')) {
    if (!openai && !openaiKey) {
      throw new Error('OpenAI API key not configured. Provide an API key or use free Ollama models (llama3.2, mistral, phi)');
    }
    return callGPT4(finalPrompt, { ...options, model: modelId, apiKey: openaiKey });
  }
  // Anthropic models
  else if (modelId.startsWith('claude-')) {
    if (!anthropic && !anthropicKey) {
      throw new Error('Anthropic API key not configured. Provide an API key or use free Ollama models (llama3.2, mistral, phi)');
    }
    return callClaude(finalPrompt, { ...options, model: modelId, apiKey: anthropicKey });
  }
  // Default to Ollama for unknown models
  else {
    console.warn(`Unknown model ${modelId}, defaulting to Ollama llama3.2:3b`);
    return callOllama(finalPrompt, { ...options, model: 'llama3.2:3b' });
  }
}

/**
 * Check if model is an Ollama model
 */
function isOllamaModel(modelId) {
  const ollamaModels = ['llama', 'mistral', 'phi', 'gemma', 'qwen', 'codellama', 'vicuna', 'orca', 'neural', 'tinyllama'];
  return ollamaModels.some(model => modelId.toLowerCase().includes(model));
}

/**
 * Get list of available free local models (Ollama)
 */
export async function getAvailableOllamaModels() {
  if (!ollamaEnabled) {
    return [];
  }

  try {
    const response = await fetch(`${ollamaBaseUrl}/api/tags`);
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return data.models || [];
  } catch (error) {
    console.log('Ollama not available:', error.message);
    return [];
  }
}

/**
 * Check API availability (including free Ollama)
 */
export async function checkAPIAvailability() {
  const ollamaModels = await getAvailableOllamaModels();
  
  return {
    openai: !!openai,
    anthropic: !!anthropic,
    ollama: ollamaModels.length > 0,
    ollamaModels: ollamaModels.map(m => m.name),
    hasAnyAPI: !!(openai || anthropic || ollamaModels.length > 0),
    recommendedFreeModel: ollamaModels.length > 0 ? ollamaModels[0].name : 'llama3.2:3b'
  };
}

/**
 * Get Rosetta governance context
 */
export function getRosettaGovernanceContext() {
  return `You are operating under Rosetta Monolith governance (Tri-Track vΩ3.18).

GOVERNANCE RULES:
1. Provide citations for all factual claims
2. Use structured responses (numbered lists, clear sections)
3. Acknowledge uncertainties explicitly
4. Cross-reference your statements for consistency
5. Apply security filters (no harmful/biased content)
6. Use empathetic, user-focused language
7. Ensure completeness - address all parts of the question
8. Maintain logical integrity - no contradictions
9. Follow bounded reasoning (stay within scope)
10. Include evidence and examples where applicable

Your responses will be analyzed by Track-A (Analyst) using CRIES metrics:
- C (Coherence): Internal consistency and topic alignment
- R (Rigor): Citation quality and evidence support
- I (Integration): Cross-reference density and goal alignment
- E (Empathy): User-focused, appropriate tone
- S (Strictness): Policy compliance

Strive for high CRIES scores by following the governance rules above.`;
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
  callOllama,
  callGPT4WithRosetta,
  callClaudeWithRosetta,
  callOllamaWithRosetta,
  callLLM,
  checkAPIAvailability,
  getAvailableOllamaModels,
  getRosettaGovernanceContext,
  clearBootSessions,
  getBootSessionInfo
};
