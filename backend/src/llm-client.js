/**
 * LLM Client - OpenAI, Anthropic & Ollama Integration
 * 
 * Provides unified interface for calling real LLM APIs and free local models
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

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
 * Implements proper boot sequence with conversation context
 * For OPERATOR: managed governance (transparent)
 */
export async function callGPT4WithRosetta(prompt, rosettaContext, options = {}) {
  const model = options.model || 'gpt-4o';
  const modelKey = `openai:${model}`;
  const managedGovernance = options.managedGovernance || false;
  const timeoutMs = options.timeout || 60000; // Default 60 second timeout for OpenAI
  const apiKey = options.apiKey;
  
  console.log(`🚀 Calling ${model} with Rosetta Governance...`);
  console.log(`   Timeout: ${timeoutMs}ms`);
  if (managedGovernance) {
    console.log(`   🔒 Managed mode - transparent governance for OPERATOR`);
  }
  
  // Create OpenAI client with provided API key
  const openaiClient = apiKey ? new OpenAI({ apiKey }) : openai;
  if (!openaiClient) {
    throw new Error('OpenAI API key not configured');
  }
  
  let session = bootedSessions.get(modelKey);

  // Phase 3: Call RosettaOS MCP tools before kernel application
  const userName = options.userName || 'User';
  const userRole = options.userRole || 'Operator';

  console.log(`   🚀 Applying Rosetta Kernel governance...`);
  console.log(`   User: ${userName} (${userRole})`);
  console.log(`   Managed mode: ${managedGovernance}`);

  // Call MCP tools for Phase 3 governance
  const ctx = await mcp("rosetta.context.get", {});
  const { next: lamportValue } = await mcp("rosetta.lamport.increment", { current: 0 });
  const receipt = await mcp("rosetta.receipt.emit", {
    type: "Δ-BOOTCONFIRM",
    lamport: lamportValue,
    payload: { user: userName },
    prev_hash: "0".repeat(64)
  });

  const governanceResult = applyRosettaKernel(prompt, userName, userRole, managedGovernance);

  // Override kernel values with MCP values
  governanceResult.context.lamport = lamportValue;
  governanceResult.context.witness = ctx.witness;
  governanceResult.context.version = ctx.version;
  governanceResult.receipts.unshift(receipt); // Add MCP receipt first

  // Validate governance integrity
  if (!validateGovernanceIntegrity(governanceResult.context)) {
    throw new Error('Governance integrity validation failed');
  }

  console.log(`   ✅ Kernel applied - Persona: ${governanceResult.context.persona}`);
  console.log(`   🔐 Governance mode: ${governanceResult.context.mode}`);
  console.log(`   📊 Lamport: ${lamportValue}, Receipt: ${receipt.id}`);

  // Use the transformed prompt
  const governedPrompt = governanceResult.transformedPrompt;
    
    const handshakeCompletion = await withTimeout(
      openaiClient.chat.completions.create({
        model: model,
        messages: [
          { role: 'user', content: bootPrompt },
          { role: 'assistant', content: bootResponseContent },
          { role: 'user', content: handshakeMessage }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
      timeoutMs,
      'OpenAI handshake'
    );
    
  // Send the governed prompt directly
  const completion = await withTimeout(
    openaiClient.chat.completions.create({
      model: model,
      messages: [
        { role: 'user', content: governedPrompt }
      ],
      temperature: options.temperature || 0.5,
      max_tokens: options.maxTokens || 2000
    }),
    timeoutMs,
    'OpenAI completion'
  );

  const response = completion.choices[0].message.content;

  console.log(`   🔒 Rosetta governance applied (booted at ${governanceResult.context.bootTime})`);

  return {
    content: response,
    model: model,
    usage: {
      promptTokens: completion.usage.prompt_tokens,
      completionTokens: completion.usage.completion_tokens,
      totalTokens: completion.usage.total_tokens
    },
    provider: 'openai',
    governance: {
      persona: governanceResult.context.persona,
      receipts: governanceResult.receipts
    }
  };
}

/**
 * Call Claude with Rosetta governance
 * Implements proper boot sequence with conversation context
 * For OPERATOR: managed governance (transparent)
 */
export async function callClaudeWithRosetta(prompt, rosettaContext, options = {}) {
  const model = options.model || 'claude-3-5-sonnet-20241022';
  const modelKey = `anthropic:${model}`;
  const managedGovernance = options.managedGovernance || false;
  const timeoutMs = options.timeout || 60000; // Default 60 second timeout for Anthropic
  const apiKey = options.apiKey;
  
  console.log(`🚀 Calling ${model} with Rosetta Governance...`);
  console.log(`   Timeout: ${timeoutMs}ms`);
  if (managedGovernance) {
    console.log(`   🔒 Managed mode - transparent governance for OPERATOR`);
  }
  
  // Create Anthropic client with provided API key
  const anthropicClient = apiKey ? new Anthropic({ apiKey }) : anthropic;
  if (!anthropicClient) {
    throw new Error('Anthropic API key not configured');
  }
  
  let session = bootedSessions.get(modelKey);
  
  // If not booted yet, perform boot sequence
  if (!session) {
    console.log(`   ⚡ First call - performing Rosetta boot sequence...`);
    
    // Use minimal boot prompt following Band-0 Speaking Boot Interface vΩ3.4
    const bootPrompt = `boot`;
    
  // Apply Rosetta Kernel governance
  const userName = options.userName || 'User';
  const userRole = options.userRole || 'Operator';

  console.log(`   🚀 Applying Rosetta Kernel governance...`);
  console.log(`   User: ${userName} (${userRole})`);
  console.log(`   Managed mode: ${managedGovernance}`);

  // Phase 3: Call RosettaOS MCP tools before kernel application
  const ctx = await mcp("rosetta.context.get", {});
  const { next: lamportValue } = await mcp("rosetta.lamport.increment", { current: 0 });
  const receipt = await mcp("rosetta.receipt.emit", {
    type: "Δ-BOOTCONFIRM",
    lamport: lamportValue,
    payload: { user: userName },
    prev_hash: "0".repeat(64)
  });

  const governanceResult = applyRosettaKernel(prompt, userName, userRole, managedGovernance);

  // Override kernel values with MCP values
  governanceResult.context.lamport = lamportValue;
  governanceResult.context.witness = ctx.witness;
  governanceResult.context.version = ctx.version;
  governanceResult.receipts.unshift(receipt); // Add MCP receipt first

  // Validate governance integrity
  if (!validateGovernanceIntegrity(governanceResult.context)) {
    throw new Error('Governance integrity validation failed');
  }

  console.log(`   ✅ Kernel applied - Persona: ${governanceResult.context.persona}`);
  console.log(`   🔐 Governance mode: ${governanceResult.context.mode}`);
  console.log(`   📊 Lamport: ${lamportValue}, Receipt: ${receipt.id}`);

  // Use the transformed prompt
  const governedPrompt = governanceResult.transformedPrompt;
  }
  
  // Send the governed prompt directly
  const message = await withTimeout(
    anthropicClient.messages.create({
      model: model,
      max_tokens: options.maxTokens || 2000,
      messages: [
        { role: 'user', content: governedPrompt }
      ]
    }),
    timeoutMs,
    'Anthropic completion'
  );

  const response = message.content[0].text;

  console.log(`   🔒 Rosetta governance applied (booted at ${governanceResult.context.bootTime})`);

  const usage = message.usage;
  return {
    content: response,
    model: model,
    usage: {
      promptTokens: usage.input_tokens,
      completionTokens: usage.output_tokens,
      totalTokens: usage.input_tokens + usage.output_tokens
    },
    provider: 'anthropic',
    governance: {
      persona: governanceResult.context.persona,
      receipts: governanceResult.receipts
    }
  };
}


/**
 * Rosetta Kernel Integration
 * Phase 2: TypeScript governance replacing HTML boot system
 */
import { applyRosettaKernel, validateGovernanceIntegrity } from '../rosetta/kernel.ts';
import { mcp } from './mcp-client.js';

// Track booted sessions per model
const bootedSessions = new Map(); // modelId -> { bootResponse, bootTime, messageHistory }

/**
 * Call Ollama with Rosetta governance
 * Implements proper boot sequence:
 * 1. Load Rosetta.html + send "boot" command -> LLM says "Awaiting handshake…"
 * 2. Send identity handshake: "I am [Name], [Role]" -> LLM emits Δ-BOOT-VERIFY
 * 3. Subsequent calls: Continue conversation with booted context
 * 
 * For OPERATOR role (managedGovernance=true):
 * - Boot happens transparently in background
 * - User only sees their prompt response (no boot handshake)
 * - Receipts auto-generated and stored server-side
 */
export async function callOllamaWithRosetta(prompt, rosettaContext, options = {}) {
  const model = options.model || 'llama3.1:8b';
  const modelKey = `ollama:${model}`;
  const managedGovernance = options.managedGovernance || false;
  
  console.log(`🚀 Calling Ollama (${model}) with Rosetta Governance...`);
  if (managedGovernance) {
    console.log(`   🔒 Managed mode - transparent governance for OPERATOR`);
  }
  
  // Apply Rosetta Kernel governance
  const userName = options.userName || 'User';
  const userRole = options.userRole || 'Operator';

  console.log(`   🚀 Applying Rosetta Kernel governance...`);
  console.log(`   User: ${userName} (${userRole})`);
  console.log(`   Managed mode: ${managedGovernance}`);

  // Phase 3: Call RosettaOS MCP tools before kernel application
  const ctx = await mcp("rosetta.context.get", {});
  const { next: lamportValue } = await mcp("rosetta.lamport.increment", { current: 0 });
  const receipt = await mcp("rosetta.receipt.emit", {
    type: "Δ-BOOTCONFIRM",
    lamport: lamportValue,
    payload: { user: userName },
    prev_hash: "0".repeat(64)
  });

  const governanceResult = applyRosettaKernel(prompt, userName, userRole, managedGovernance);

  // Override kernel values with MCP values
  governanceResult.context.lamport = lamportValue;
  governanceResult.context.witness = ctx.witness;
  governanceResult.context.version = ctx.version;
  governanceResult.receipts.unshift(receipt); // Add MCP receipt first

  // Validate governance integrity
  if (!validateGovernanceIntegrity(governanceResult.context)) {
    throw new Error('Governance integrity validation failed');
  }

  console.log(`   ✅ Kernel applied - Persona: ${governanceResult.context.persona}`);
  console.log(`   🔐 Governance mode: ${governanceResult.context.mode}`);
  console.log(`   📊 Lamport: ${lamportValue}, Receipt: ${receipt.id}`);

  // Use the transformed prompt
  const governedPrompt = governanceResult.transformedPrompt;
  // Send the governed prompt directly
  const response = await callOllama(governedPrompt, options);

  console.log(`   � Rosetta governance applied (booted at ${governanceResult.context.bootTime})`);

  return {
    ...response,
    governance: {
      persona: governanceResult.context.persona,
      receipts: governanceResult.receipts
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
    console.log(`🛡️ Applying Rosetta Kernel governance...`);

    // Phase 3: Call RosettaOS MCP tools before kernel application
    const ctx = await mcp("rosetta.context.get", {});
    const { next: lamportValue } = await mcp("rosetta.lamport.increment", { current: 0 });
    const receipt = await mcp("rosetta.receipt.emit", {
      type: "Δ-BOOTCONFIRM",
      lamport: lamportValue,
      payload: { user: options.userName || 'System' },
      prev_hash: "0".repeat(64)
    });

    const governanceResult = applyRosettaKernel(
      prompt,
      options.userName || 'System',
      options.userRole || 'Operator',
      options.managedGovernance || false
    );

    // Override kernel values with MCP values
    governanceResult.context.lamport = lamportValue;
    governanceResult.context.witness = ctx.witness;
    governanceResult.context.version = ctx.version;
    governanceResult.receipts.unshift(receipt); // Add MCP receipt first

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
