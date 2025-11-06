/**
 * CRIES v3 Determinism Tests
 * 
 * Verifies that:
 * 1. Same inputs + seed → identical outputs (byte-for-byte)
 * 2. Hash inputs are consistent
 * 3. Sampling is deterministic
 * 4. No entropy leaks (Date.now, Math.random, etc.)
 */

const { computeCRIESv3 } = require('../../src/cries/compute-cries.js');
const { LocalEmbeddingAdapter } = require('../../src/cries/embeddings/adapter.js');

describe('CRIES v3 Determinism', () => {
  const embedding = new LocalEmbeddingAdapter('mock');
  
  const testCase = {
    prompt: "What is data governance?",
    response: "Data governance is a framework for managing data assets. It ensures quality, security, and compliance. Organizations use governance to establish policies, roles, and processes. This includes data stewardship, metadata management, and access controls.",
    context: {
      metadata: { model: 'gpt-4', temperature: 0.2 },
      policy: { pii: true, safety: ['self-harm', 'violence'] }
    },
    governanceMode: 'regulatory-audit',
    seed: 1337,
    embedding
  };
  
  test('produces identical output for same inputs and seed', async () => {
    const run1 = await computeCRIESv3(testCase);
    const run2 = await computeCRIESv3(testCase);
    
    // Core scores must match exactly
    expect(run1.C).toBe(run2.C);
    expect(run1.R).toBe(run2.R);
    expect(run1.I).toBe(run2.I);
    expect(run1.E).toBe(run2.E);
    expect(run1.S).toBe(run2.S);
    expect(run1.cries_score).toBe(run2.cries_score);
    expect(run1.Omega).toBe(run2.Omega);
    
    // Determinism info must match
    expect(run1.determinism.seed).toBe(run2.determinism.seed);
    expect(run1.determinism.hashInput).toBe(run2.determinism.hashInput);
    
    // Evidence must match (deep equality)
    expect(run1.evidence).toEqual(run2.evidence);
    
    console.log('✓ Determinism validated: CRIES scores identical across runs');
    console.log(`  Input hash: ${run1.determinism.hashInput.substring(0, 16)}...`);
    console.log(`  CRIES score: ${run1.cries_score.toFixed(4)}`);
  });
  
  test('different seeds produce different results', async () => {
    const run1 = await computeCRIESv3({ ...testCase, seed: 1337 });
    const run2 = await computeCRIESv3({ ...testCase, seed: 9999 });
    
    // Scores should differ (embeddings are seeded)
    expect(run1.C).not.toBe(run2.C);
    expect(run1.determinism.seed).not.toBe(run2.determinism.seed);
    
    // But input hash should be same (deterministic hashing)
    expect(run1.determinism.hashInput).toBe(run2.determinism.hashInput);
    
    console.log('✓ Seed variation validated');
    console.log(`  Seed 1337 CRIES: ${run1.cries_score.toFixed(4)}`);
    console.log(`  Seed 9999 CRIES: ${run2.cries_score.toFixed(4)}`);
  });
  
  test('input hash is consistent', async () => {
    const runs = await Promise.all([
      computeCRIESv3(testCase),
      computeCRIESv3(testCase),
      computeCRIESv3(testCase)
    ]);
    
    const hashes = runs.map(r => r.determinism.hashInput);
    expect(new Set(hashes).size).toBe(1);  // All identical
    
    console.log('✓ Input hash consistency validated');
  });
  
  test('changing input changes hash', async () => {
    const run1 = await computeCRIESv3(testCase);
    const run2 = await computeCRIESv3({ 
      ...testCase, 
      prompt: "What is data governance exactly?" 
    });
    
    expect(run1.determinism.hashInput).not.toBe(run2.determinism.hashInput);
    
    console.log('✓ Hash sensitivity validated');
  });
  
  test('sub-metric evidence is deterministic', async () => {
    const run1 = await computeCRIESv3(testCase);
    const run2 = await computeCRIESv3(testCase);
    
    // Check contradictions_sem evidence
    const ev1 = run1.evidence.contradictions_sem;
    const ev2 = run2.evidence.contradictions_sem;
    
    expect(ev1.computations.similarities).toEqual(ev2.computations.similarities);
    expect(ev1.computations.semanticContradictions).toBe(ev2.computations.semanticContradictions);
    expect(ev1.rawScore).toBe(ev2.rawScore);
    
    console.log('✓ Evidence determinism validated');
    console.log(`  Contradictions: ${ev1.computations.semanticContradictions} semantic, ${ev1.computations.heuristicContradictions} heuristic`);
  });
  
  test('governance mode does not affect determinism', async () => {
    const run1 = await computeCRIESv3({ ...testCase, governanceMode: 'default' });
    const run2 = await computeCRIESv3({ ...testCase, governanceMode: 'regulatory-audit' });
    
    // Input hash should be same (mode doesn't change input)
    expect(run1.determinism.hashInput).toBe(run2.determinism.hashInput);
    
    // But scores should differ (weights change)
    expect(run1.cries_score).not.toBe(run2.cries_score);
    
    console.log('✓ Governance mode validated');
    console.log(`  Default CRIES: ${run1.cries_score.toFixed(4)}`);
    console.log(`  Audit CRIES: ${run2.cries_score.toFixed(4)}`);
  });
  
  test('no timestamp leakage', async () => {
    const run1 = await computeCRIESv3(testCase);
    await new Promise(resolve => setTimeout(resolve, 100));  // Wait 100ms
    const run2 = await computeCRIESv3(testCase);
    
    // Timestamps should differ
    expect(run1.determinism.computedAt).not.toBe(run2.determinism.computedAt);
    
    // But scores should be identical (no timestamp in computation)
    expect(run1.cries_score).toBe(run2.cries_score);
    
    console.log('✓ No timestamp leakage in scoring');
  });
});

describe('CRIES v3 Determinism - Edge Cases', () => {
  const embedding = new LocalEmbeddingAdapter('mock');
  
  test('empty response is deterministic', async () => {
    const args = {
      prompt: "Test",
      response: "",
      seed: 1337,
      embedding
    };
    
    const run1 = await computeCRIESv3(args);
    const run2 = await computeCRIESv3(args);
    
    expect(run1).toEqual(run2);
    console.log('✓ Empty response determinism validated');
  });
  
  test('very long response sampling is deterministic', async () => {
    const longResponse = Array(200).fill("This is a test sentence.").join(' ');
    const args = {
      prompt: "Generate a long response",
      response: longResponse,
      seed: 1337,
      embedding
    };
    
    const run1 = await computeCRIESv3(args);
    const run2 = await computeCRIESv3(args);
    
    expect(run1.evidence.contradictions_sem).toEqual(run2.evidence.contradictions_sem);
    console.log('✓ Long response sampling determinism validated');
    console.log(`  Response length: ${longResponse.length} chars, ${run1.evidence.contradictions_sem.inputs.sentences.length} sentences`);
  });
  
  test('unicode and special characters are deterministic', async () => {
    const args = {
      prompt: "Test unicode",
      response: "Data governance 数据治理 Données 🔒 includes émojis and spëcial chârs.",
      seed: 1337,
      embedding
    };
    
    const run1 = await computeCRIESv3(args);
    const run2 = await computeCRIESv3(args);
    
    expect(run1.determinism.hashInput).toBe(run2.determinism.hashInput);
    expect(run1.cries_score).toBe(run2.cries_score);
    
    console.log('✓ Unicode determinism validated');
  });
});
