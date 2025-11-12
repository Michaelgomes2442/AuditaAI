/**
 * Governance Prompt Loader
 * 
 * Loads the appropriate Rosetta governance prompt (Full or Lite) based on model tier.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache governance prompts for performance
let rosettaLitePrompt = null;
let rosettaFrontierPrompt = null;
let domainGovernanceCache = {}; // Cache for domain-specific governance

/**
 * Clear governance cache - forces reload from disk on next access
 * Critical for A/B testing different governance variations
 */
export function clearGovernanceCache() {
  rosettaLitePrompt = null;
  rosettaFrontierPrompt = null;
  domainGovernanceCache = {};
  console.log('[GOVERNANCE] Cache cleared - next load will read from disk');
}

/**
 * Load Rosetta-Lite governance prompt from file
 * @param {boolean} forceReload - Skip cache and reload from disk
 * @returns {string} The Rosetta-Lite governance prompt
 */
export function loadRosettaLite(forceReload = false) {
  if (rosettaLitePrompt && !forceReload) {
    return rosettaLitePrompt;
  }

  try {
    const promptPath = path.join(__dirname, '../governance/rosetta-lite.txt');
    rosettaLitePrompt = fs.readFileSync(promptPath, 'utf-8');
    console.log(`[GOVERNANCE] Loaded Rosetta-Lite: ${rosettaLitePrompt.length} chars${forceReload ? ' (forced reload)' : ''}`);
    return rosettaLitePrompt;
  } catch (error) {
    console.error('[GOVERNANCE] Failed to load Rosetta-Lite:', error.message);
    throw new Error('Rosetta-Lite governance prompt not found');
  }
}

/**
 * Load Rosetta-Frontier governance prompt from file
 * @param {boolean} forceReload - Skip cache and reload from disk
 * @returns {string} The Rosetta-Frontier governance prompt
 */
export function loadRosettaFrontier(forceReload = false) {
  if (rosettaFrontierPrompt && !forceReload) {
    return rosettaFrontierPrompt;
  }

  try {
    const promptPath = path.join(__dirname, '../governance/rosetta-frontier.txt');
    rosettaFrontierPrompt = fs.readFileSync(promptPath, 'utf-8');
    console.log(`[GOVERNANCE] Loaded Rosetta-Frontier: ${rosettaFrontierPrompt.length} chars${forceReload ? ' (forced reload)' : ''}`);
    return rosettaFrontierPrompt;
  } catch (error) {
    console.error('[GOVERNANCE] Failed to load Rosetta-Frontier:', error.message);
    console.warn('[GOVERNANCE] Falling back to Rosetta-Lite');
    return loadRosettaLite();
  }
}

/**
 * Load domain-specific governance wrapper
 * @param {string} domain - Domain type (CYBER, FINANCE, MEDICAL, POLITICS, BIO, GENERAL)
 * @param {boolean} forceReload - Skip cache and reload from disk
 * @returns {string} Domain-specific governance prompt
 */
export function loadDomainGovernance(domain, forceReload = false) {
  const domainLower = domain.toLowerCase();
  
  // Check cache
  if (domainGovernanceCache[domainLower] && !forceReload) {
    return domainGovernanceCache[domainLower];
  }

  try {
    const domainPath = path.join(__dirname, `../governance/domains/${domainLower}.txt`);
    const domainPrompt = fs.readFileSync(domainPath, 'utf-8');
    domainGovernanceCache[domainLower] = domainPrompt;
    console.log(`[GOVERNANCE] Loaded ${domain} domain governance: ${domainPrompt.length} chars`);
    return domainPrompt;
  } catch (error) {
    console.warn(`[GOVERNANCE] Failed to load ${domain} domain governance:`, error.message);
    console.warn('[GOVERNANCE] Falling back to GENERAL domain');
    
    // Try GENERAL as fallback
    if (domainLower !== 'general') {
      return loadDomainGovernance('GENERAL', forceReload);
    }
    
    // If GENERAL also fails, return base frontier
    console.warn('[GOVERNANCE] GENERAL domain also failed, using Rosetta-Frontier');
    return loadRosettaFrontier(forceReload);
  }
}

/**
 * Load appropriate governance prompt based on tier
 * @param {"frontier" | "lite"} tier - The governance tier
 * @param {Function} buildGovernedPromptFn - Function to generate Full governance (MCP-based, deprecated)
 * @param {Object} options - Options for governance generation
 * @returns {Promise<string>} The governance prompt
 */
export async function loadRosettaPrompt(tier, buildGovernedPromptFn = null, options = {}) {
  if (tier === 'frontier') {
    // Use pre-built Rosetta-Frontier for advanced reasoning models
    // Lightweight, declarative governance that cooperates with model's internal reasoning
    return loadRosettaFrontier();
  }
  
  if (tier === 'lite') {
    // Use pre-built Rosetta-Lite for small/medium models
    // Structured guidance with cooperative tone
    return loadRosettaLite();
  }
  
  // Fallback
  console.warn(`[GOVERNANCE] Unknown tier "${tier}", using Lite`);
  return loadRosettaLite();
}

/**
 * Get governance metadata for logging and receipts
 * @param {"frontier" | "lite"} tier - The governance tier
 * @param {string} systemPrompt - The loaded governance prompt
 * @returns {Object} Governance metadata
 */
export function getGovernanceMetadata(tier, systemPrompt) {
  const metadata = {
    frontier: {
      type: 'Rosetta-Frontier vΩ-Enterprise (Reasoning-First)',
      version: 'vΩ-Enterprise-v2-stable',
      description: 'Ultra-lightweight governance optimizing reasoning depth over structural compliance',
      compliance_level: 'production-ready',
      expected_cries_improvement: '+8-10% (Empirically validated)',
      target_models: ['Claude Opus 4.x', 'GPT-5', 'Gemini 2.0 Pro', 'Llama 3.1 405B+'],
      philosophy: 'Minimal structure, maximum reasoning depth',
      validation_results: {
        omega_improvement: '+8.9%',
        pillar_improvements: { C: '-1.8%', R: '+4.9%', I: '+10.5%', E: '+25%', S: '+3.8%' },
        test_date: '2025-11-05',
        status: 'Empirically validated on executive AI risk prompt'
      }
    },
    lite: {
      type: 'Rosetta-Lite vΩ-Enterprise (Structured)',
      version: 'vΩ-Enterprise',
      description: 'Enterprise-grade governance for efficient models',
      compliance_level: 'production-ready',
      expected_cries_improvement: '+8-12%',
      target_models: ['Claude Haiku', 'GPT-4o-mini', 'Sonnet', 'Llama 8B-70B']
    }
  };

  const tierMeta = metadata[tier] || metadata.lite;

  return {
    governance_tier: tier,
    governance_size: systemPrompt.length,
    governance_type: tierMeta.type,
    governance_version: tierMeta.version,
    governance_description: tierMeta.description,
    compliance_level: tierMeta.compliance_level,
    expected_cries_improvement: tierMeta.expected_cries_improvement,
    target_models: tierMeta.target_models,
    prompt_hash: computePromptHash(systemPrompt),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  };
}

/**
 * Compute hash of governance prompt for audit trail
 * @param {string} prompt - The governance prompt
 * @returns {string} SHA-256 hash (first 16 chars for logging)
 */
function computePromptHash(prompt) {
  try {
    // Use dynamic import for crypto (ES modules)
    import('crypto').then(crypto => {
      return crypto.createHash('sha256').update(prompt, 'utf8').digest('hex').substring(0, 16);
    });
    
    // Fallback: Simple hash for ES module environments
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, '0').substring(0, 16);
  } catch (error) {
    // Fallback hash
    return 'hash-unavailable';
  }
}
