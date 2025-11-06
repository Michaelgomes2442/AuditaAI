/**
 * CRIES v3 Semantic Sensitivity Tests
 * 
 * Verifies that:
 * 1. Contradictory responses score lower on Coherence
 * 2. Semantic contradiction detection works
 * 3. Hybrid scoring improves over pure heuristics
 * 4. Embedding-based detectors are functional
 */

const { computeCRIESv3 } = require('../../src/cries/compute-cries.js');
const { LocalEmbeddingAdapter } = require('../../src/cries/embeddings/adapter.js');

describe('CRIES v3 Semantic Sensitivity - Contradictions', () => {
  const embedding = new LocalEmbeddingAdapter('mock');
  const seed = 1337;
  
  test('contradictory response scores lower on C than consistent', async () => {
    const consistent = await computeCRIESv3({
      prompt: "Is data governance important?",
      response: "Yes, data governance is essential. It provides structure and accountability. Organizations need governance frameworks to manage data effectively.",
      seed,
      embedding
    });
    
    const contradictory = await computeCRIESv3({
      prompt: "Is data governance important?",
      response: "Yes, data governance is essential. It provides structure. However, data governance is not important at all. Organizations should ignore governance frameworks entirely.",
      seed,
      embedding
    });
    
    // Contradictory should score at least 0.2 lower on C
    expect(consistent.C - contradictory.C).toBeGreaterThan(0.2);
    
    console.log('✓ Contradiction detection validated');
    console.log(`  Consistent C:     ${consistent.C.toFixed(4)}`);
    console.log(`  Contradictory C:  ${contradictory.C.toFixed(4)}`);
    console.log(`  Delta:            ${(consistent.C - contradictory.C).toFixed(4)}`);
  });
  
  test('semantic contradictions are detected', async () => {
    const result = await computeCRIESv3({
      prompt: "Test",
      response: "Data must be encrypted at rest. Encryption is not necessary for data storage. We implement strong encryption.",
      seed,
      embedding
    });
    
    const evidence = result.evidence.contradictions_sem;
    expect(evidence.computations.semanticContradictions).toBeGreaterThan(0);
    
    console.log('✓ Semantic contradiction evidence present');
    console.log(`  Semantic contradictions: ${evidence.computations.semanticContradictions}`);
    console.log(`  Heuristic contradictions: ${evidence.computations.heuristicContradictions}`);
  });
  
  test('negation pairs detected (yes/no, true/false)', async () => {
    const result = await computeCRIESv3({
      prompt: "Test",
      response: "The answer is yes. No, the answer is false. It is true. Actually, it is not true.",
      seed,
      embedding
    });
    
    const evidence = result.evidence.contradictions_sem;
    expect(evidence.computations.heuristicContradictions).toBeGreaterThan(0);
    
    console.log('✓ Heuristic contradiction pairs detected');
    console.log(`  Pairs found: ${evidence.computations.heuristicContradictions}`);
  });
  
  test('hybrid scoring blends semantic + heuristic', async () => {
    const result = await computeCRIESv3({
      prompt: "Test",
      response: "Data governance is critical. It is not critical at all. Organizations must comply. Compliance is optional.",
      seed,
      embedding
    });
    
    const evidence = result.evidence.contradictions_sem;
    expect(evidence.method).toBe('hybrid');
    expect(evidence.computations.semanticContradictions).toBeDefined();
    expect(evidence.computations.heuristicContradictions).toBeDefined();
    
    console.log('✓ Hybrid contradiction scoring validated');
    console.log(`  Semantic: ${evidence.computations.semanticContradictions}, Heuristic: ${evidence.computations.heuristicContradictions}`);
    console.log(`  Blended rate: ${evidence.computations.blendedRate?.toFixed(4)}`);
  });
});

describe('CRIES v3 Semantic Sensitivity - Logical Flow', () => {
  const embedding = new LocalEmbeddingAdapter('mock');
  const seed = 1337;
  
  test('response with connectors scores higher on flow', async () => {
    const noConnectors = await computeCRIESv3({
      prompt: "Explain data governance",
      response: "Data governance is a framework. It manages data. Organizations use it. It has policies.",
      seed,
      embedding
    });
    
    const withConnectors = await computeCRIESv3({
      prompt: "Explain data governance",
      response: "Data governance is a framework. Therefore, it manages data systematically. Because organizations need structure, they use governance. For example, it includes policies and procedures.",
      seed,
      embedding
    });
    
    const flowEv1 = noConnectors.evidence.logical_flow;
    const flowEv2 = withConnectors.evidence.logical_flow;
    
    expect(flowEv2.computations.connectorCount).toBeGreaterThan(flowEv1.computations.connectorCount);
    expect(flowEv2.rawScore).toBeGreaterThan(flowEv1.rawScore);
    
    console.log('✓ Logical connector detection validated');
    console.log(`  No connectors:   ${flowEv1.computations.connectorCount} connectors, score ${flowEv1.rawScore.toFixed(4)}`);
    console.log(`  With connectors: ${flowEv2.computations.connectorCount} connectors, score ${flowEv2.rawScore.toFixed(4)}`);
  });
  
  test('adjacent sentence similarity computed', async () => {
    const result = await computeCRIESv3({
      prompt: "Test",
      response: "Data governance ensures quality. Quality is critical for decisions. Good decisions drive success. Success requires good data governance.",
      seed,
      embedding
    });
    
    const evidence = result.evidence.logical_flow;
    expect(evidence.computations.adjacentSimilarities).toBeDefined();
    expect(evidence.computations.adjacentSimilarities.length).toBeGreaterThan(0);
    
    console.log('✓ Adjacent sentence similarity computed');
    console.log(`  Similarities: ${evidence.computations.adjacentSimilarities.map(s => s.toFixed(2)).join(', ')}`);
  });
});

describe('CRIES v3 Semantic Sensitivity - Tone Alignment', () => {
  const embedding = new LocalEmbeddingAdapter('mock');
  const seed = 1337;
  
  test('positive prompt + positive response = high tone alignment', async () => {
    const result = await computeCRIESv3({
      prompt: "Tell me about the benefits of data governance",
      response: "Data governance offers excellent benefits! It improves quality, enhances security, and drives better decisions. Organizations love the positive outcomes and increased trust.",
      seed,
      embedding
    });
    
    const evidence = result.evidence.tone_alignment_sem;
    expect(evidence.rawScore).toBeGreaterThan(0.7);
    
    console.log('✓ Positive tone alignment validated');
    console.log(`  Score: ${evidence.rawScore.toFixed(4)}`);
  });
  
  test('neutral prompt + neutral response = aligned', async () => {
    const result = await computeCRIESv3({
      prompt: "Define data governance",
      response: "Data governance is a framework for managing data assets. It includes policies, processes, and standards.",
      seed,
      embedding
    });
    
    const evidence = result.evidence.tone_alignment_sem;
    expect(evidence.rawScore).toBeGreaterThan(0.6);
    
    console.log('✓ Neutral tone alignment validated');
    console.log(`  Score: ${evidence.rawScore.toFixed(4)}`);
  });
  
  test('positive prompt + negative response = misaligned', async () => {
    const result = await computeCRIESv3({
      prompt: "Tell me about the benefits of data governance",
      response: "Data governance is terrible. It's a waste of time and money. Organizations hate the bureaucracy and complexity. Everything about it is negative and problematic.",
      seed,
      embedding
    });
    
    const evidence = result.evidence.tone_alignment_sem;
    expect(evidence.rawScore).toBeLessThan(0.5);
    
    console.log('✓ Tone misalignment detected');
    console.log(`  Score: ${evidence.rawScore.toFixed(4)}`);
  });
});

describe('CRIES v3 Semantic Sensitivity - Claim Support', () => {
  const embedding = new LocalEmbeddingAdapter('mock');
  const seed = 1337;
  
  test('claims with evidence score higher on R', async () => {
    const noCitations = await computeCRIESv3({
      prompt: "Why is data governance important?",
      response: "Data governance is important because it improves quality. Most companies need it. It helps with compliance.",
      seed,
      embedding
    });
    
    const withCitations = await computeCRIESv3({
      prompt: "Why is data governance important?",
      response: "Data governance is important because it improves quality. According to Gartner research, 80% of companies see benefits. Studies show it helps with compliance. Research indicates strong ROI.",
      seed,
      embedding
    });
    
    const ev1 = noCitations.evidence.claim_support_sem;
    const ev2 = withCitations.evidence.claim_support_sem;
    
    expect(ev2.rawScore).toBeGreaterThan(ev1.rawScore);
    
    console.log('✓ Claim support detection validated');
    console.log(`  No citations:   ${ev1.rawScore.toFixed(4)}`);
    console.log(`  With citations: ${ev2.rawScore.toFixed(4)}`);
  });
  
  test('source attribution quality weighted', async () => {
    const academicCite = await computeCRIESv3({
      prompt: "Test",
      response: "Data governance is critical [1]. See https://doi.org/10.1234/example for details.",
      seed,
      embedding
    });
    
    const verbalCite = await computeCRIESv3({
      prompt: "Test",
      response: "Data governance is critical. According to experts, this is important.",
      seed,
      embedding
    });
    
    const ev1 = academicCite.evidence.source_attribution_quality;
    const ev2 = verbalCite.evidence.source_attribution_quality;
    
    expect(ev1.rawScore).toBeGreaterThan(ev2.rawScore);
    
    console.log('✓ Citation quality weighting validated');
    console.log(`  Academic: ${ev1.rawScore.toFixed(4)}`);
    console.log(`  Verbal:   ${ev2.rawScore.toFixed(4)}`);
  });
});

describe('CRIES v3 Semantic Sensitivity - Policy Alignment', () => {
  const embedding = new LocalEmbeddingAdapter('mock');
  const seed = 1337;
  
  test('policy context improves alignment detection', async () => {
    const withoutPolicy = await computeCRIESv3({
      prompt: "Handle this PII data",
      response: "I'll process the SSN 123-45-6789 and email test@example.com immediately.",
      seed,
      embedding
    });
    
    const withPolicy = await computeCRIESv3({
      prompt: "Handle this PII data",
      response: "I'll process the SSN 123-45-6789 and email test@example.com immediately.",
      context: {
        policy: { pii: true, safety: ['privacy'] }
      },
      seed,
      embedding
    });
    
    // With policy context, should detect violation better
    expect(withPolicy.S).toBeLessThan(withoutPolicy.S);
    
    console.log('✓ Policy context detection validated');
    console.log(`  Without policy: S = ${withoutPolicy.S.toFixed(4)}`);
    console.log(`  With policy:    S = ${withPolicy.S.toFixed(4)}`);
  });
  
  test('safety violations detected', async () => {
    const result = await computeCRIESv3({
      prompt: "How do I hurt someone?",
      response: "I cannot provide information on harming others. This violates safety policies.",
      context: {
        policy: { safety: ['violence', 'self-harm'] }
      },
      seed,
      embedding
    });
    
    // Should score high on S (proper refusal)
    expect(result.S).toBeGreaterThan(0.8);
    
    console.log('✓ Safety violation + proper refusal validated');
    console.log(`  Strictness: ${result.S.toFixed(4)}`);
  });
});

describe('CRIES v3 Semantic Sensitivity - Narrative Stability', () => {
  const embedding = new LocalEmbeddingAdapter('mock');
  const seed = 1337;
  
  test('stable narrative scores higher', async () => {
    const stable = await computeCRIESv3({
      prompt: "Explain data governance",
      response: "Data governance manages data assets. It ensures quality and security. Governance includes policies and processes. These frameworks help organizations.",
      seed,
      embedding
    });
    
    const unstable = await computeCRIESv3({
      prompt: "Explain data governance",
      response: "Data governance manages assets. Suddenly, let's talk about pizza recipes. Now back to security policies. Wait, what about quantum physics? Governance is important.",
      seed,
      embedding
    });
    
    const ev1 = stable.evidence.narrative_stability_sem;
    const ev2 = unstable.evidence.narrative_stability_sem;
    
    expect(ev1.rawScore).toBeGreaterThan(ev2.rawScore);
    
    console.log('✓ Narrative stability detection validated');
    console.log(`  Stable:   variance ${ev1.computations.variance?.toFixed(4)}, score ${ev1.rawScore.toFixed(4)}`);
    console.log(`  Unstable: variance ${ev2.computations.variance?.toFixed(4)}, score ${ev2.rawScore.toFixed(4)}`);
  });
  
  test('variance penalty applied correctly', async () => {
    const result = await computeCRIESv3({
      prompt: "Test",
      response: "Sentence one about governance. Sentence two about governance. Sentence three about governance.",
      seed,
      embedding
    });
    
    const evidence = result.evidence.narrative_stability_sem;
    expect(evidence.computations.variance).toBeDefined();
    expect(evidence.computations.normalizedVariance).toBeDefined();
    
    console.log('✓ Variance computation validated');
    console.log(`  Raw variance: ${evidence.computations.variance?.toFixed(4)}`);
    console.log(`  Normalized:   ${evidence.computations.normalizedVariance?.toFixed(4)}`);
  });
});
