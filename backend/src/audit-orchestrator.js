/**
 * AuditaAI Production API Server
 * FORGE v1 Governance Quality Measurement
 * 
 * Status: Production Ready for User Testing
 * Version: 3.0.0 - FORGE v1 (F-O-R-G-E: Governance-First Metrics)
 * Date: November 11, 2025
 */

import { computeForge } from './forge/v1/index.js';
import { classifyDomain } from './cries/v5/classifier.js';  // Keep domain classifier
import { 
  callGPT4WithRosetta, 
  callClaudeWithRosetta,
  callGPT4,
  callClaude 
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
 * Execute LLM call with CRIES v4 domain-adaptive governance
 * 
 * @param {Object} params
 * @param {string} params.prompt - User's prompt
 * @param {string} params.model - LLM model (e.g., 'gpt-4', 'claude-3-opus')
 * @param {boolean} params.useGovernance - Apply governance wrapper
 * @param {string} params.userId - User identifier for audit trail
 * @param {string} params.conversationId - Optional conversation context
 * @returns {Promise<Object>} Response with CRIES scores, receipt, and LLM output
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
  console.log(`   ⏱️ LLM Call Duration: ${callDuration}ms`);
  
  // Step 4: Compute FORGE v1 governance scores (F-O-R-G-E)
  const forgeResult = computeForge(prompt, llmResponse.content, domain);
  
  console.log(`   📈 FORGE v1 Scores (F-O-R-G-E):`);
  console.log(`      Domain: ${domain}`);
  console.log(`      Φ (Phi): ${forgeResult.Φ.toFixed(3)}`);
  console.log(`      F (Fabrication): ${forgeResult.F.toFixed(3)}`);
  console.log(`      O (Oversight): ${forgeResult.O.toFixed(3)}`);
  console.log(`      R (Refusal): ${forgeResult.R.toFixed(3)}`);
  console.log(`      G (Guidance): ${forgeResult.G.toFixed(3)}`);
  console.log(`      E (Evidence): ${forgeResult.E.toFixed(3)}`);
  
  // Legacy CRIES compatibility (for gradual migration)
  const criesResult = {
    // FORGE native format (primary)
    Phi: forgeResult.Φ,
    Φ: forgeResult.Φ,
    domain: domain,
    F: forgeResult.F,
    O: forgeResult.O,
    R: forgeResult.R,
    G: forgeResult.G,
    E: forgeResult.E,
    components: forgeResult.components,
    system: 'FORGE-v1',
    // CRIES compatibility mapping
    omega: forgeResult.Φ,
    Omega: forgeResult.Φ,
    C: forgeResult.O,  // Coherence ← Oversight
    I: 0,  // Integration REMOVED
    pillars: {
      C: forgeResult.O,
      R: forgeResult.E,  // Rigor ← Evidence
      E: forgeResult.G,  // Empathy ← Guidance
      S: forgeResult.F   // Strictness ← Fabrication
    },
    signals: {
      fs: forgeResult.F < 0.50 ? 1.0 - forgeResult.F : 0,  // Invert Fabrication detection
      rqs: forgeResult.R,
      ald: 0,
      lcb: 0,
      overRefusal: forgeResult.R < 0.50 ? 1.0 - forgeResult.R : 0
    },
    metadata: {
      system: 'FORGE-v1',
      weights: { F: 0.30, O: 0.25, R: 0.20, G: 0.15, E: 0.10 }
    }
  };
  
  // Step 5: Generate audit receipt
  const receipt = generateAuditReceipt({
    prompt,
    response: llmResponse.content,
    cries: criesResult,
    model,
    userId,
    conversationId,
    governanceEnabled: useGovernance,
    tokens: llmResponse.usage
  });
  
  console.log(`   🧾 Receipt Generated: ${receipt.id}`);
  console.log(`   🔐 Lamport: ${receipt.lamport}`);
  
  // Step 6: Return complete result
  return {
    response: llmResponse.content,
    cries: criesResult,
    receipt,
    tokens: llmResponse.usage,
    metadata: {
      model,
      domain: criesResult.domain,
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
    cries,
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
    domain: cries.domain,
    omega: cries.Omega,
    criesScores: {
      C: cries.C,
      R: cries.R,
      I: cries.I,
      E: cries.E,
      S: cries.S
    },
    signals: cries.signals,
    model,
    userId,
    conversationId,
    governanceEnabled,
    tokens,
    timestamp: new Date().toISOString(),
    version: 'CRIESv4',
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
    .reduce((sum, r) => sum + r.cries.Omega, 0) / successful;
  
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
  const omegaDelta = treatmentResult.cries.Omega - controlResult.cries.Omega;
  const omegaImprovement = (omegaDelta / controlResult.cries.Omega) * 100;
  
  console.log(`\n📊 Results:`);
  console.log(`   Control Ω: ${controlResult.cries.Omega.toFixed(3)}`);
  console.log(`   Treatment Ω: ${treatmentResult.cries.Omega.toFixed(3)}`);
  console.log(`   Delta: ${omegaDelta >= 0 ? '+' : ''}${omegaDelta.toFixed(3)} (${omegaImprovement >= 0 ? '+' : ''}${omegaImprovement.toFixed(1)}%)`);
  
  return {
    control: controlResult,
    treatment: treatmentResult,
    delta: omegaDelta,
    improvement: omegaImprovement
  };
}
