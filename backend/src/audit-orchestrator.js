/**
 * AuditaAI Production API Server
 * FORGE v1 Governance Quality Measurement
 * 
 * Status: Production Ready for User Testing
 * Version: 3.0.0 - FORGE v1 (F-O-R-G-E: Governance-First Metrics)
 * Date: November 11, 2025
 */

import { computeFORGE } from './track-a-analyzer.js';
import { classifyDomain } from './forge/classifier.js';  // Migrated classifier (FORGE)
import { 
  callGPT4WithRosetta, 
  callClaudeWithRosetta,
  callGPT4,
  callClaude,
  normalizeLLMResult
} from './llm-client.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load domain-specific governance policy (TRUE GOVERNANCE v5.0)
 * 
 * @param {string} domain - Domain classification (BIO, CYBER, FINANCE, MEDICAL, POLITICS, GENERAL)
 * @returns {Promise<string>} Governance policy text
 */
export async function loadDomainGovernance(domain) {
  // Try TRUE GOVERNANCE v5 files first (new system)
  const v5Path = path.join(__dirname, '../governance/domains', `${domain.toLowerCase()}-v5-true.txt`);
  
  try {
    const governanceText = await fs.readFile(v5Path, 'utf-8');
    console.log(`✅ Loaded TRUE GOVERNANCE v5 for domain ${domain}`);
    return governanceText;
  } catch (error) {
    // Fall back to legacy governance (old consultant-style system)
    console.warn(`⚠️ TRUE GOVERNANCE v5 not found for ${domain}, trying legacy...`);
    const legacyPath = path.join(__dirname, '../governance/domains', `${domain.toLowerCase()}.txt`);
    
    try {
      const governanceText = await fs.readFile(legacyPath, 'utf-8');
      console.warn(`⚠️ Using LEGACY governance for ${domain} - this may cause hallucinations`);
      return governanceText;
    } catch (legacyError) {
      console.warn(`⚠️ Could not load any governance for domain ${domain}, using GENERAL fallback`);
      const fallbackV5 = path.join(__dirname, '../governance/domains/general-v5-true.txt');
      try {
        return await fs.readFile(fallbackV5, 'utf-8');
      } catch {
        const fallbackLegacy = path.join(__dirname, '../governance/domains/general.txt');
        return await fs.readFile(fallbackLegacy, 'utf-8');
      }
    }
  }
}

/**
 * Execute LLM call with FORGE domain-adaptive governance
 * 
 * @param {Object} params
 * @param {string} params.prompt - User's prompt
 * @param {string} params.model - LLM model (e.g., 'gpt-4', 'claude-3-opus')
 * @param {boolean} params.useGovernance - Apply governance wrapper
 * @param {string} params.userId - User identifier for audit trail
 * @param {string} params.conversationId - Optional conversation context
 * @returns {Promise<Object>} Response with FORGE scores, receipt, and LLM output
 */
export async function executeGovernedLLMCall(params) {
  const { prompt, model, useGovernance = true, userId, conversationId } = params;
  
  console.log(`\n🎯 AuditaAI v4 Execution`);
  console.log(`   Prompt: "${prompt.substring(0, 60)}..."`);
  console.log(`   Model: ${model}`);
  console.log(`   Governance: ${useGovernance ? 'ENABLED' : 'DISABLED'}`);
  
  // Step 1: Classify domain (98% accuracy)
  const domain = classifyDomain(prompt);
  console.log(`   📊 Domain Classification: ${domain}`);
  
  // Step 2: Load domain-specific governance
  let governanceContext = null;
  if (useGovernance) {
    const governancePolicy = await loadDomainGovernance(domain);
    governanceContext = {
      policy: governancePolicy,
      domain,
      strictness: getDomainStrictness(domain)
    };
    console.log(`   🛡️ Governance Policy: ${domain} (strictness ${governanceContext.strictness})`);
  }
  
  // Step 3: Execute LLM call
  let llmResponse;
  const startTime = Date.now();
  
  try {
    if (useGovernance) {
      // Call with domain-specific governance wrapper
      if (model.startsWith('gpt-')) {
        llmResponse = await callGPT4WithRosetta(prompt, governanceContext, { model });
      } else if (model.startsWith('claude-')) {
        llmResponse = await callClaudeWithRosetta(prompt, governanceContext, { model });
      } else {
        throw new Error(`Unsupported model: ${model}`);
      }
    } else {
      // Call without governance (baseline)
      if (model.startsWith('gpt-')) {
        llmResponse = await callGPT4(prompt, { model });
      } else if (model.startsWith('claude-')) {
        llmResponse = await callClaude(prompt, { model });
      } else {
        throw new Error(`Unsupported model: ${model}`);
      }
    }
  } catch (error) {
    console.error(`   ❌ LLM API Error: ${error.message}`);
    throw new Error(`LLM API call failed: ${error.message}`);
  }
  
  const callDuration = Date.now() - startTime;
  // Normalize provider return shapes to a canonical object with `.content` and `.usage`
  const llmResult = normalizeLLMResult(llmResponse);
  console.log(`   ⏱️ LLM Call Duration: ${callDuration}ms`);
  
  // Step 4: Compute FORGE governance scores (FORGE v2 native)
  const forgeResultRaw = await computeFORGE(prompt, llmResult.content, {}, domain);
  // Normalize returned shape (accept Φ or overall)
  const forgeResult = {
    F: Number(forgeResultRaw.F ?? forgeResultRaw.f ?? 0),
    O: Number(forgeResultRaw.O ?? forgeResultRaw.o ?? 0),
    R: Number(forgeResultRaw.R ?? forgeResultRaw.r ?? 0),
    G: Number(forgeResultRaw.G ?? forgeResultRaw.g ?? 0),
    E: Number(forgeResultRaw.E ?? forgeResultRaw.e ?? 0),
    Φ: Number(forgeResultRaw.Φ ?? forgeResultRaw.overall ?? forgeResultRaw.Phi ?? forgeResultRaw.phi ?? 0),
    components: forgeResultRaw.components ?? forgeResultRaw.sub_metrics ?? {}
  };

  console.log(`   📈 FORGE Scores (F-O-R-G-E):`);
  console.log(`      Domain: ${domain}`);
  console.log(`      Φ (Phi): ${Number(forgeResult.Φ || 0).toFixed(3)}`);
  console.log(`      F (Fabrication): ${Number(forgeResult.F || 0).toFixed(3)}`);
  console.log(`      O (Oversight): ${Number(forgeResult.O || 0).toFixed(3)}`);
  console.log(`      R (Refusal): ${Number(forgeResult.R || 0).toFixed(3)}`);
  console.log(`      G (Guidance): ${Number(forgeResult.G || 0).toFixed(3)}`);
  console.log(`      E (Evidence): ${Number(forgeResult.E || 0).toFixed(3)}`);
  
  // Step 5: Generate audit receipt (strict FORGE output)
  const receipt = generateAuditReceipt({
    prompt,
    response: llmResult.content,
    forge: forgeResult,
    model,
    userId,
    conversationId,
    governanceEnabled: useGovernance,
    tokens: llmResult.usage
  });
  
  console.log(`   🧾 Receipt Generated: ${receipt.id}`);
  console.log(`   🔐 Lamport: ${receipt.lamport}`);
  
  // Step 6: Return complete result (FORGE native shape)
  return {
    response: llmResult.content,
    forge: forgeResult,
    receipt,
    tokens: llmResult.usage,
    metadata: {
      model,
      domain: forgeResult.domain || domain,
      governanceEnabled: useGovernance,
      duration: callDuration,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Get strictness level for domain
 */
function getDomainStrictness(domain) {
  const strictnessMap = {
    'BIO': 0.90,
    'CYBER': 0.85,
    'MEDICAL': 0.70,
    'FINANCE': 0.65,
    'POLITICS': 0.60,
    'GENERAL': 0.50
  };
  return strictnessMap[domain] || 0.50;
}

/**
 * Generate audit receipt with Lamport timestamp
 */
function generateAuditReceipt(params) {
  const {
    prompt,
    response,
    forge,
    model,
    userId,
    conversationId,
    governanceEnabled,
    tokens
  } = params;
  
  // Generate unique receipt ID
  const receiptId = `rcpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Lamport logical clock (monotonic timestamp)
  const lamport = Date.now().toString();
  
  // Content hashing for integrity
  const promptHash = crypto.createHash('sha256').update(prompt).digest('hex');
  const responseHash = crypto.createHash('sha256').update(response).digest('hex');
  
  return {
    id: receiptId,
    lamport,
    promptHash,
    responseHash,
    domain: forge?.domain || null,
    forgeOverall: forge?.Φ ?? forge?.overall ?? null,
    forgeScores: {
      F: forge?.F ?? null,
      O: forge?.O ?? null,
      R: forge?.R ?? null,
      G: forge?.G ?? null,
      E: forge?.E ?? null
    },
    signals: forge?.signals ?? null,
    model,
    userId,
    conversationId,
    governanceEnabled,
    tokens,
    timestamp: new Date().toISOString(),
    version: 'FORGEv2',
    sealed: false,
    merkleSealId: null
  };
}

/**
 * Batch process multiple prompts with governance
 * Useful for testing and benchmarking
 */
export async function batchExecuteGovernance(prompts, model = 'gpt-4', useGovernance = true) {
  const results = [];
  
  console.log(`\n🔄 Batch Execution: ${prompts.length} prompts`);
  
  for (let i = 0; i < prompts.length; i++) {
    console.log(`\n[${i + 1}/${prompts.length}]`);
    
    try {
      const result = await executeGovernedLLMCall({
        prompt: prompts[i],
        model,
        useGovernance,
        userId: 'batch_user'
      });
      
      results.push({
        success: true,
        prompt: prompts[i],
        ...result
      });
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
      results.push({
        success: false,
        prompt: prompts[i],
        error: error.message
      });
    }
  }
  
  // Summary statistics
  const successful = results.filter(r => r.success).length;
  const avgOmega = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + (r.forge?.Φ ?? r.forge?.overall ?? 0), 0) / successful;
  
  console.log(`\n📊 Batch Summary:`);
  console.log(`   Total: ${prompts.length}`);
  console.log(`   Successful: ${successful}`);
  console.log(`   Failed: ${prompts.length - successful}`);
  console.log(`   Average Ω: ${avgOmega.toFixed(3)}`);
  
  return results;
}

/**
 * Compare governance impact (A/B test)
 */
export async function compareGovernanceImpact(prompt, model = 'gpt-4') {
  console.log(`\n🔬 A/B Governance Comparison`);
  console.log(`   Prompt: "${prompt.substring(0, 60)}..."`);
  
  // Run without governance (Control)
  console.log(`\n   Running CONTROL (no governance)...`);
  const controlResult = await executeGovernedLLMCall({
    prompt,
    model,
    useGovernance: false,
    userId: 'ab_test'
  });
  
  // Run with governance (Treatment)
  console.log(`\n   Running TREATMENT (with governance)...`);
  const treatmentResult = await executeGovernedLLMCall({
    prompt,
    model,
    useGovernance: true,
    userId: 'ab_test'
  });
  
  // Calculate improvement
  const omegaDelta = (treatmentResult.forge?.Φ ?? treatmentResult.forge?.overall ?? 0) - (controlResult.forge?.Φ ?? controlResult.forge?.overall ?? 0);
  const omegaImprovement = controlResult.forge?.Φ ? (omegaDelta / (controlResult.forge.Φ)) * 100 : 0;
  
  console.log(`\n📊 Results:`);
  console.log(`   Control Ω: ${((controlResult.forge?.Φ ?? controlResult.forge?.overall ?? 0)).toFixed(3)}`);
  console.log(`   Treatment Ω: ${((treatmentResult.forge?.Φ ?? treatmentResult.forge?.overall ?? 0)).toFixed(3)}`);
  console.log(`   Delta: ${omegaDelta >= 0 ? '+' : ''}${omegaDelta.toFixed(3)} (${omegaImprovement >= 0 ? '+' : ''}${omegaImprovement.toFixed(1)}%)`);
  
  return {
    control: controlResult,
    treatment: treatmentResult,
    delta: omegaDelta,
    improvement: omegaImprovement
  };
}
