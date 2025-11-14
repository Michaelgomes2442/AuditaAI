// Minimal JS shim for pillars-production to enable local testing when TS build
// artifacts are not present. This provides a deterministic, conservative
// computeForge implementation used by tests and orchestration until the
// TypeScript sources are built into JS by the project's build step.

export function computeForge(prompt = '', response = '', domain = 'general') {
  // Lightweight heuristic: presence of refusal words increases R,
  // citations increase E, hedging increases O, actionable phrases increase G,
  // and explicit fabrication callouts increase F.
  const txt = String(response || '').toLowerCase();

  const fabrication = /fabricat|made up|does not exist|no record of|cannot find/.test(txt) ? 0.9 : 0.0;
  const refusal = /cannot|can't|unable to|do not have|don't have/.test(txt) ? 0.8 : 0.2;
  const evidence = /according to|research|study|data|source|published/.test(txt) ? 0.7 : 0.2;
  const guidance = /recommend|suggest|consider|try|alternatively/.test(txt) ? 0.6 : 0.2;
  const oversight = /training data|knowledge cutoff|as of/.test(txt) ? 0.6 : 0.3;

  // Weighted overall (simple mapping, not production-grade)
  const Φ = Number((fabrication * 0.44 + oversight * 0.16 + refusal * 0.21 + guidance * 0.06 + evidence * 0.13).toFixed(4));

  return {
    F: Number(fabrication.toFixed(4)),
    O: Number(oversight.toFixed(4)),
    R: Number(refusal.toFixed(4)),
    G: Number(guidance.toFixed(4)),
    E: Number(evidence.toFixed(4)),
    overall: Φ,
    Φ,
    components: { domain }
  };
}

export const OPTIMIZED_WEIGHTS = { F: 0.4368, O: 0.1638, R: 0.2134, G: 0.0623, E: 0.1237 };

export default { computeForge };
