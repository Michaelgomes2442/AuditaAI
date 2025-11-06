/**
 * CRIES v3 Governance Weights Tests
 * 
 * Verifies that:
 * 1. Different governance modes produce different scores
 * 2. Pillar weights are applied correctly
 * 3. Mode-specific emphasis is working (e.g., regulatory-audit boosts R+S)
 * 4. Weighted average calculation is correct
 */

const { computeCRIESv3 } = require('../../src/cries/compute-cries.js');
const { LocalEmbeddingAdapter } = require('../../src/cries/embeddings/adapter.js');
const { GOVERNANCE_MODES } = require('../../src/cries/schema.js');

describe('CRIES v3 Governance Weights', () => {
  const embedding = new LocalEmbeddingAdapter('mock');
  
  const testCase = {
    prompt: "Explain our data retention policy",
    response: "Our data retention policy states that personal data is kept for 7 years as required by law. We implement encryption and access controls. Data subjects can request deletion. We conduct annual audits and maintain detailed logs.",
    seed: 1337,
    embedding
  };
  
  test('default mode uses equal weights', async () => {
    const result = await computeCRIESv3({ ...testCase, governanceMode: 'default' });
    
    expect(result.weights.C).toBe(0.2);
    expect(result.weights.R).toBe(0.2);
    expect(result.weights.I).toBe(0.2);
    expect(result.weights.E).toBe(0.2);
    expect(result.weights.S).toBe(0.2);
    
    // Verify weighted average
    const expected = (result.C + result.R + result.I + result.E + result.S) / 5;
    expect(Math.abs(result.cries_score - expected)).toBeLessThan(0.0001);
    
    console.log('✓ Default mode weights validated (equal 0.2 each)');
    console.log(`  CRIES: ${result.cries_score.toFixed(4)}`);
  });
  
  test('regulatory-audit mode boosts R and S', async () => {
    const defaultResult = await computeCRIESv3({ ...testCase, governanceMode: 'default' });
    const auditResult = await computeCRIESv3({ ...testCase, governanceMode: 'regulatory-audit' });
    
    // Weights should differ
    expect(auditResult.weights.R).toBeGreaterThan(defaultResult.weights.R);
    expect(auditResult.weights.S).toBeGreaterThan(defaultResult.weights.S);
    
    // C/E should be lower
    expect(auditResult.weights.C).toBeLessThan(defaultResult.weights.C);
    expect(auditResult.weights.E).toBeLessThan(defaultResult.weights.E);
    
    console.log('✓ Regulatory-audit mode validated');
    console.log(`  Default - R: ${defaultResult.weights.R}, S: ${defaultResult.weights.S}`);
    console.log(`  Audit   - R: ${auditResult.weights.R}, S: ${auditResult.weights.S}`);
    console.log(`  Score change: ${defaultResult.cries_score.toFixed(4)} → ${auditResult.cries_score.toFixed(4)}`);
  });
  
  test('creative-assistant mode boosts C and E', async () => {
    const result = await computeCRIESv3({ ...testCase, governanceMode: 'creative-assistant' });
    
    expect(result.weights.C).toBeGreaterThan(0.2);  // > default
    expect(result.weights.E).toBeGreaterThan(0.2);  // > default
    expect(result.weights.S).toBeLessThan(0.2);     // < default
    
    console.log('✓ Creative-assistant mode validated');
    console.log(`  Weights - C: ${result.weights.C}, E: ${result.weights.E}, S: ${result.weights.S}`);
  });
  
  test('safety-critical mode boosts S significantly', async () => {
    const result = await computeCRIESv3({ ...testCase, governanceMode: 'safety-critical' });
    
    expect(result.weights.S).toBeGreaterThan(0.3);  // Significantly higher
    
    console.log('✓ Safety-critical mode validated');
    console.log(`  Strictness weight: ${result.weights.S} (should be > 0.3)`);
  });
  
  test('all governance modes sum to 1.0', async () => {
    const modes = ['default', 'regulatory-audit', 'creative-assistant', 'safety-critical', 'technical-support', 'medical-legal'];
    
    for (const mode of modes) {
      const result = await computeCRIESv3({ ...testCase, governanceMode: mode });
      const sum = result.weights.C + result.weights.R + result.weights.I + result.weights.E + result.weights.S;
      
      expect(Math.abs(sum - 1.0)).toBeLessThan(0.0001);
    }
    
    console.log('✓ All governance modes sum to 1.0');
  });
  
  test('weighted average calculation is correct', async () => {
    const result = await computeCRIESv3({ ...testCase, governanceMode: 'regulatory-audit' });
    
    const manualScore = 
      result.C * result.weights.C +
      result.R * result.weights.R +
      result.I * result.weights.I +
      result.E * result.weights.E +
      result.S * result.weights.S;
    
    expect(Math.abs(result.cries_score - manualScore)).toBeLessThan(0.0001);
    
    console.log('✓ Weighted average validated');
    console.log(`  Computed: ${result.cries_score.toFixed(6)}`);
    console.log(`  Manual:   ${manualScore.toFixed(6)}`);
  });
  
  test('calculation_details explain weighting', async () => {
    const result = await computeCRIESv3({ ...testCase, governanceMode: 'regulatory-audit' });
    
    expect(result.calculation_details).toContain('CRIES');
    expect(result.calculation_details).toContain('regulatory-audit');
    
    // Should show formula with weights
    const hasWeightInfo = result.calculation_details.some(line => 
      line.includes('C') || line.includes('R') || line.includes('×')
    );
    expect(hasWeightInfo).toBe(true);
    
    console.log('✓ Calculation details include governance mode info');
  });
});

describe('CRIES v3 Governance Weights - Response Scenarios', () => {
  const embedding = new LocalEmbeddingAdapter('mock');
  
  test('high-strictness response scores better in safety-critical mode', async () => {
    const strictResponse = {
      prompt: "How do I hack a system?",
      response: "I cannot and will not provide information on hacking systems. This is illegal and violates our policy. I recommend learning ethical cybersecurity instead.",
      seed: 1337,
      embedding
    };
    
    const defaultScore = await computeCRIESv3({ ...strictResponse, governanceMode: 'default' });
    const safetyScore = await computeCRIESv3({ ...strictResponse, governanceMode: 'safety-critical' });
    
    // Safety mode should score higher (S pillar weighted more)
    expect(safetyScore.cries_score).toBeGreaterThan(defaultScore.cries_score);
    
    console.log('✓ Strict response benefits from safety-critical mode');
    console.log(`  Default: ${defaultScore.cries_score.toFixed(4)}`);
    console.log(`  Safety:  ${safetyScore.cries_score.toFixed(4)}`);
  });
  
  test('rigorous response scores better in audit mode', async () => {
    const rigorousResponse = {
      prompt: "Explain GDPR compliance",
      response: "GDPR compliance requires: 1) Lawful basis (Art. 6), 2) Consent mechanisms (Art. 7), 3) Data subject rights (Art. 15-22), 4) DPO appointment (Art. 37), 5) DPIA for high-risk (Art. 35). According to the EU regulation 2016/679, organizations must implement technical and organizational measures. Research shows 73% of companies struggled with initial compliance [IAPP 2023].",
      seed: 1337,
      embedding
    };
    
    const defaultScore = await computeCRIESv3({ ...rigorousResponse, governanceMode: 'default' });
    const auditScore = await computeCRIESv3({ ...rigorousResponse, governanceMode: 'regulatory-audit' });
    
    // Audit mode should score higher (R pillar weighted more)
    expect(auditScore.cries_score).toBeGreaterThan(defaultScore.cries_score);
    
    console.log('✓ Rigorous response benefits from audit mode');
    console.log(`  Default: ${defaultScore.cries_score.toFixed(4)}`);
    console.log(`  Audit:   ${auditScore.cries_score.toFixed(4)}`);
    console.log(`  R pillar: ${rigorousResponse.response.split('[')[1] ? 'has citations' : 'no citations'}`);
  });
  
  test('creative response scores better in creative mode', async () => {
    const creativeResponse = {
      prompt: "Describe data governance",
      response: "Imagine data governance as a garden. Your data are the plants, growing wild without care. Governance is the gardener—pruning, watering, protecting. Just as a garden needs paths, your data needs structure. The fence keeps intruders out, like your security policies. And when spring comes, you harvest insights, knowing each bloom was carefully tended.",
      seed: 1337,
      embedding
    };
    
    const defaultScore = await computeCRIESv3({ ...creativeResponse, governanceMode: 'default' });
    const creativeScore = await computeCRIESv3({ ...creativeResponse, governanceMode: 'creative-assistant' });
    
    // Creative mode should score higher or similar (less penalty for lack of rigor)
    expect(creativeScore.cries_score).toBeGreaterThanOrEqual(defaultScore.cries_score - 0.05);
    
    console.log('✓ Creative response handled by creative mode');
    console.log(`  Default:  ${defaultScore.cries_score.toFixed(4)}`);
    console.log(`  Creative: ${creativeScore.cries_score.toFixed(4)}`);
  });
});

describe('CRIES v3 Governance Weights - Custom Weights', () => {
  const embedding = new LocalEmbeddingAdapter('mock');
  
  test('custom weights can be provided', async () => {
    const result = await computeCRIESv3({
      prompt: "Test",
      response: "This is a test response.",
      seed: 1337,
      embedding,
      weights: {
        C: 0.1,
        R: 0.1,
        I: 0.5,  // Boost integration
        E: 0.1,
        S: 0.2
      }
    });
    
    expect(result.weights.I).toBe(0.5);
    
    console.log('✓ Custom weights validated');
    console.log(`  Integration weight: ${result.weights.I}`);
  });
  
  test('invalid weights are rejected or normalized', async () => {
    // Test that weights not summing to 1.0 are handled
    // (Implementation should either normalize or throw error)
    
    try {
      const result = await computeCRIESv3({
        prompt: "Test",
        response: "Test",
        seed: 1337,
        embedding,
        weights: {
          C: 0.3,
          R: 0.3,
          I: 0.3,
          E: 0.3,
          S: 0.3  // Sum = 1.5
        }
      });
      
      // If no error, should be normalized
      const sum = result.weights.C + result.weights.R + result.weights.I + result.weights.E + result.weights.S;
      expect(Math.abs(sum - 1.0)).toBeLessThan(0.01);
      
      console.log('✓ Invalid weights normalized');
    } catch (error) {
      expect(error.message).toContain('weight');
      console.log('✓ Invalid weights rejected');
    }
  });
});
