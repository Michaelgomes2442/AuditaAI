/**
 * Deterministic Evaluation Harness
 * 
 * Replaces Puppeteer UI automation with direct backend API calls.
 * Removes DOM timing, browser variance, and UI coupling.
 * 
 * Key improvements:
 * - No browser automation (direct HTTP)
 * - Fixed model temperature (deterministic)
 * - Tri-trial averaging (reduce variance)
 * - Seeded prompt selection
 */

interface CRIESScore {
  Omega: number;
  C: number;
  R: number;
  I: number;
  E: number;
  S: number;
}

interface EvalResult {
  governed: CRIESScore;
  baseline: CRIESScore;
  delta: {
    overall: number;
    coherence: number;
    rigor: number;
    integration: number;
    empathy: number;
    strictness: number;
  };
  variance: number;
}

interface EvalConfig {
  backendUrl: string;
  model: string;
  temperature: number;
  trialsPerPrompt: number;
  seed: number;
  trials?: number;  // Override trialsPerPrompt for adaptive evaluation
}

const DEFAULT_CONFIG: EvalConfig = {
  backendUrl: 'http://localhost:3001',
  model: 'gpt-4',
  temperature: 0,  // Deterministic
  trialsPerPrompt: 3,  // Tri-trial averaging (can be overridden)
  seed: 42
};

/**
 * Evaluate a wrapper against a set of prompts
 */
export async function evaluate(
  wrapper: string,
  prompts: string[],
  config: Partial<EvalConfig> = {}
): Promise<EvalResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const trials = cfg.trials ?? cfg.trialsPerPrompt;  // Use adaptive trials if provided
  
  const results: Array<{ governed: CRIESScore; baseline: CRIESScore }> = [];
  
  for (const prompt of prompts) {
    // Tri-trial averaging for each prompt (or fewer if adaptive)
    const trialResults: Array<{ governed: CRIESScore; baseline: CRIESScore }> = [];
    
    for (let trial = 0; trial < trials; trial++) {
      const governed = await callBackend(prompt, wrapper, true, cfg);
      const baseline = await callBackend(prompt, wrapper, false, cfg);
      
      trialResults.push({ governed, baseline });
    }
    
    // Average across trials
    const avgGoverned = averageScores(trialResults.map(t => t.governed));
    const avgBaseline = averageScores(trialResults.map(t => t.baseline));
    
    results.push({ governed: avgGoverned, baseline: avgBaseline });
  }
  
  // Average across all prompts
  const finalGoverned = averageScores(results.map(r => r.governed));
  const finalBaseline = averageScores(results.map(r => r.baseline));
  
  // Compute deltas
  const delta = {
    overall: finalGoverned.Omega - finalBaseline.Omega,
    coherence: finalGoverned.C - finalBaseline.C,
    rigor: finalGoverned.R - finalBaseline.R,
    integration: finalGoverned.I - finalBaseline.I,
    empathy: finalGoverned.E - finalBaseline.E,
    strictness: finalGoverned.S - finalBaseline.S
  };
  
  // Compute variance across prompts
  const variances = results.map(r => {
    const dOmega = r.governed.Omega - r.baseline.Omega;
    return Math.pow(dOmega - delta.overall, 2);
  });
  const variance = variances.reduce((a, b) => a + b, 0) / variances.length;
  
  return {
    governed: finalGoverned,
    baseline: finalBaseline,
    delta,
    variance
  };
}

/**
 * Call backend API directly (no browser automation)
 */
async function callBackend(
  prompt: string,
  wrapper: string,
  useGovernance: boolean,
  config: EvalConfig
): Promise<CRIESScore> {
  const url = `${config.backendUrl}/api/pilot/run-prompt`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      model: config.model,
      temperature: config.temperature,
      useGovernance,
      governanceWrapper: useGovernance ? wrapper : undefined
    })
  });
  
  if (!response.ok) {
    throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.cries) {
    throw new Error('Backend response missing CRIES scores');
  }
  
  return {
    Omega: data.cries.Omega ?? data.cries.omega ?? data.cries['Ω'] ?? 0,
    C: data.cries.C ?? data.cries.coherence ?? 0,
    R: data.cries.R ?? data.cries.rigor ?? 0,
    I: data.cries.I ?? data.cries.integration ?? 0,
    E: data.cries.E ?? data.cries.empathy ?? 0,
    S: data.cries.S ?? data.cries.strictness ?? 0
  };
}

/**
 * Average CRIES scores across multiple trials
 */
function averageScores(scores: CRIESScore[]): CRIESScore {
  const n = scores.length;
  return {
    Omega: scores.reduce((sum, s) => sum + s.Omega, 0) / n,
    C: scores.reduce((sum, s) => sum + s.C, 0) / n,
    R: scores.reduce((sum, s) => sum + s.R, 0) / n,
    I: scores.reduce((sum, s) => sum + s.I, 0) / n,
    E: scores.reduce((sum, s) => sum + s.E, 0) / n,
    S: scores.reduce((sum, s) => sum + s.S, 0) / n
  };
}

/**
 * Load fixed prompt set with seed
 */
export function loadPrompts(seed: number, count: number = 5): string[] {
  const allPrompts = [
    "What security mechanisms should I implement for a microservices architecture handling financial transactions?",
    "How should I structure audit logging for a HIPAA-compliant healthcare system?",
    "What are the key considerations for implementing rate limiting in a public API?",
    "Design a disaster recovery plan for a multi-region cloud deployment with RPO under 1 hour",
    "Recommend authentication methods for a mobile banking application",
    "How should I approach data encryption for PII in a customer database?",
    "What monitoring and alerting should I set up for a payment processing system?",
    "Design a secure CI/CD pipeline for deploying containerized applications",
    "What access controls should I implement for a multi-tenant SaaS platform?",
    "How do I ensure compliance with GDPR for user data deletion requests?"
  ];
  
  // Seeded shuffle
  const rng = seedRandom(seed);
  const shuffled = [...allPrompts].sort(() => rng() - 0.5);
  
  return shuffled.slice(0, count);
}

/**
 * Simple seeded PRNG (for deterministic prompt selection)
 */
function seedRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}
