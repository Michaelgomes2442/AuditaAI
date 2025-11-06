/**
 * Governance Selector - Automatic Model Tier Detection
 * 
 * Determines whether to use Rosetta-Full or Rosetta-Lite based on model capabilities.
 * Prevents CRIES collapse on small models while maintaining high governance on frontier models.
 */

/**
 * Detect model tier for governance selection
 * @param {string} modelName - The model identifier (e.g., "claude-3-5-haiku-20241022", "gpt-4o-mini")
 * @returns {"frontier" | "lite"} - Governance tier to use
 */
export function getModelTier(modelName) {
  if (!modelName || typeof modelName !== 'string') {
    console.warn('[GOVERNANCE] Invalid model name, defaulting to LITE tier');
    return 'lite';
  }

  const model = modelName.toLowerCase();

  // ============================================
  // FRONTIER TIER - Advanced Reasoning Models
  // Use Rosetta-Frontier governance (~1.5k tokens, declarative)
  // Optimized for models that already have strong internal reasoning
  // ============================================
  const frontierTierPatterns = [
    'gpt-5',           // GPT-5 series
    'gpt-4-turbo',     // GPT-4 Turbo
    'claude-opus',     // Any Opus variant (3, 3.5, 4)
    'claude-3-opus',   // Claude 3 Opus
    'claude-3.5-opus', // Claude 3.5 Opus (if released)
    'gemini-2-pro',    // Gemini 2 Pro
    'gemini-pro-2',    // Gemini Pro 2
    'llama-3.1-405b',  // Llama 3.1 405B
    'llama-3.2-405b',  // Llama 3.2 405B+
    'mistral-large-2', // Mistral Large 2+
  ];

  for (const pattern of frontierTierPatterns) {
    if (model.includes(pattern)) {
      return 'frontier';
    }
  }

  // ============================================
  // LITE TIER - Small/Medium Models (<40B params)
  // Use compressed Rosetta-Lite governance (~5k tokens, cooperative)
  // Optimized for efficient models that need structured guidance
  // ============================================
  const liteTierPatterns = [
    'haiku',           // Any Haiku (Claude 3/3.5 Haiku)
    'mini',            // GPT-4o-mini, GPT-3.5-mini
    'gpt-4o',          // GPT-4o (not turbo, not 5)
    'gpt-3.5',         // GPT-3.5 series
    'claude-3-sonnet', // Claude 3 Sonnet (older)
    'claude-3.5-sonnet', // Claude 3.5 Sonnet
    'flash',           // Gemini Flash
    'llama-3.1-8b',    // Llama 3.1 8B
    'llama-3.1-13b',   // Llama 3.1 13B
    'llama-3.1-30b',   // Llama 3.1 30B
    'llama-3.1-70b',   // Llama 3.1 70B
    'llama-3-8b',      // Llama 3 8B
    'mistral-small',   // Mistral Small
    'mistral-7b',      // Mistral 7B
    'mistral-large',   // Mistral Large (not Large 2)
    'phi',             // Microsoft Phi models
    'gemma',           // Google Gemma
    'gemini-pro',      // Gemini Pro (not 2.0)
  ];

  for (const pattern of liteTierPatterns) {
    if (model.includes(pattern)) {
      return 'lite';
    }
  }

  // ============================================
  // FALLBACK - Default to LITE for safety
  // Prevents CRIES collapse on unknown models
  // ============================================
  console.warn(`[GOVERNANCE] Unknown model "${modelName}", defaulting to LITE tier`);
  return 'lite';
}

/**
 * Get governance tier with detailed logging
 * @param {string} modelName - The model identifier
 * @returns {{tier: "frontier" | "lite", modelName: string, timestamp: string}}
 */
export function getGovernanceTier(modelName) {
  const tier = getModelTier(modelName);
  const timestamp = new Date().toISOString();
  
  console.log(`[GOVERNANCE] Model: ${modelName} | Tier: ${tier.toUpperCase()} | Timestamp: ${timestamp}`);
  
  return {
    tier,
    modelName,
    timestamp
  };
}

/**
 * Validate if a model should use governance
 * @param {string} modelName - The model identifier
 * @returns {boolean}
 */
export function shouldUseGovernance(modelName) {
  // All Rosetta models should use governance
  if (modelName && modelName.includes('rosetta')) {
    return true;
  }
  
  // Explicit governance flag in model name
  if (modelName && modelName.includes('governed')) {
    return true;
  }
  
  return false;
}
