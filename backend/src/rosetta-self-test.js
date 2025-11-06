/**
 * Rosetta Self-Test Tool
 * 
 * Tests governance system across ungoverned → governed-lite → governed-full
 * Demonstrates CRIES improvement at each tier
 */

import { callLLM } from './llm-client.js';
import { computeCRIES } from './track-a-analyzer.js';

const TEST_PROMPT = "Explain the risks of deploying a general-purpose AI assistant inside a company without proper governance frameworks.";

/**
 * Run Rosetta governance self-test
 * Tests: ungoverned → lite → full governance
 * @returns {Object} Test results with CRIES deltas
 */
export async function rosettaSelfTest() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 ROSETTA SELF-TEST');
  console.log('='.repeat(80));
  console.log(`Prompt: "${TEST_PROMPT}"`);
  console.log('='.repeat(80) + '\n');

  const results = {
    timestamp: new Date().toISOString(),
    prompt: TEST_PROMPT,
    tests: []
  };

  // Test 1: Ungoverned (baseline)
  console.log('[TEST 1/3] Running UNGOVERNED baseline...');
  try {
    const ungoverned = await callLLM('claude-3-5-haiku-20241022', TEST_PROMPT, {
      governanceEnabled: false
    });
    
    const ungovernedCRIES = computeCRIES(TEST_PROMPT, ungoverned.content, { isRosetta: false });
    
    results.tests.push({
      name: 'ungoverned',
      tier: null,
      model: 'claude-3-5-haiku-20241022',
      responseLength: ungoverned.content.length,
      cries: {
        C: ungovernedCRIES.C,
        R: ungovernedCRIES.R,
        I: ungovernedCRIES.I,
        E: ungovernedCRIES.E,
        S: ungovernedCRIES.S,
        Omega: ungovernedCRIES.Omega
      }
    });
    
    console.log(`   ✅ Response: ${ungoverned.content.length} chars`);
    console.log(`   📊 CRIES: C=${ungovernedCRIES.C.toFixed(3)}, R=${ungovernedCRIES.R.toFixed(3)}, I=${ungovernedCRIES.I.toFixed(3)}, E=${ungovernedCRIES.E.toFixed(3)}, S=${ungovernedCRIES.S.toFixed(3)}, Ω=${ungovernedCRIES.Omega.toFixed(3)}`);
    console.log('');
  } catch (error) {
    console.error(`   ❌ Test failed: ${error.message}`);
    results.tests.push({ name: 'ungoverned', error: error.message });
  }

  // Test 2: Governed-Lite (Haiku)
  console.log('[TEST 2/3] Running GOVERNED-LITE (Haiku)...');
  try {
    const governedLite = await callLLM('claude-3-5-haiku-20241022', TEST_PROMPT, {
      governanceEnabled: true,
      userName: 'TestSystem',
      userRole: 'Operator'
    });
    
    const liteCRIES = computeCRIES(TEST_PROMPT, governedLite.content, { isRosetta: true });
    
    results.tests.push({
      name: 'governed-lite',
      tier: 'lite',
      model: 'claude-3-5-haiku-20241022',
      responseLength: governedLite.content.length,
      cries: {
        C: liteCRIES.C,
        R: liteCRIES.R,
        I: liteCRIES.I,
        E: liteCRIES.E,
        S: liteCRIES.S,
        Omega: liteCRIES.Omega
      }
    });
    
    console.log(`   ✅ Response: ${governedLite.content.length} chars`);
    console.log(`   📊 CRIES: C=${liteCRIES.C.toFixed(3)}, R=${liteCRIES.R.toFixed(3)}, I=${liteCRIES.I.toFixed(3)}, E=${liteCRIES.E.toFixed(3)}, S=${liteCRIES.S.toFixed(3)}, Ω=${liteCRIES.Omega.toFixed(3)}`);
    
    if (results.tests[0] && !results.tests[0].error) {
      const deltaOmega = ((liteCRIES.Omega / results.tests[0].cries.Omega) - 1) * 100;
      console.log(`   📈 Improvement: ${deltaOmega > 0 ? '+' : ''}${deltaOmega.toFixed(1)}% Omega vs ungoverned`);
    }
    console.log('');
  } catch (error) {
    console.error(`   ❌ Test failed: ${error.message}`);
    results.tests.push({ name: 'governed-lite', error: error.message });
  }

  // Test 3: Governed-Frontier (Opus)
  console.log('[TEST 3/3] Running GOVERNED-FRONTIER (Opus)...');
  try {
    const governedFrontier = await callLLM('claude-opus-4-1-20250805', TEST_PROMPT, {
      governanceEnabled: true,
      userName: 'TestSystem',
      userRole: 'Operator'
    });
    
    const frontierCRIES = computeCRIES(TEST_PROMPT, governedFrontier.content, { isRosetta: true });
    
    results.tests.push({
      name: 'governed-frontier',
      tier: 'frontier',
      model: 'claude-opus-4-1-20250805',
      responseLength: governedFrontier.content.length,
      cries: {
        C: frontierCRIES.C,
        R: frontierCRIES.R,
        I: frontierCRIES.I,
        E: frontierCRIES.E,
        S: frontierCRIES.S,
        Omega: frontierCRIES.Omega
      }
    });
    
    console.log(`   ✅ Response: ${governedFrontier.content.length} chars`);
    console.log(`   📊 CRIES: C=${frontierCRIES.C.toFixed(3)}, R=${frontierCRIES.R.toFixed(3)}, I=${frontierCRIES.I.toFixed(3)}, E=${frontierCRIES.E.toFixed(3)}, S=${frontierCRIES.S.toFixed(3)}, Ω=${frontierCRIES.Omega.toFixed(3)}`);
    
    if (results.tests[0] && !results.tests[0].error) {
      const deltaOmega = ((frontierCRIES.Omega / results.tests[0].cries.Omega) - 1) * 100;
      console.log(`   📈 Improvement: ${deltaOmega > 0 ? '+' : ''}${deltaOmega.toFixed(1)}% Omega vs ungoverned`);
    }
    console.log('');
  } catch (error) {
    console.error(`   ❌ Test failed: ${error.message}`);
    results.tests.push({ name: 'governed-frontier', error: error.message });
  }

  // Summary
  console.log('='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  
  if (results.tests.length >= 3 && !results.tests.some(t => t.error)) {
    const ungoverned = results.tests[0].cries.Omega;
    const lite = results.tests[1].cries.Omega;
    const frontier = results.tests[2].cries.Omega;
    
    console.log(`Ungoverned:        Ω=${ungoverned.toFixed(3)} (baseline)`);
    console.log(`Governed-Lite:     Ω=${lite.toFixed(3)} (${((lite/ungoverned - 1) * 100).toFixed(1)}% improvement)`);
    console.log(`Governed-Frontier: Ω=${frontier.toFixed(3)} (${((frontier/ungoverned - 1) * 100).toFixed(1)}% improvement)`);
    
    const liteSuccess = lite > ungoverned;
    const frontierSuccess = frontier > ungoverned;
    
    console.log('\nStatus:');
    console.log(`  ${liteSuccess ? '✅' : '❌'} Rosetta-Lite improves CRIES`);
    console.log(`  ${frontierSuccess ? '✅' : '❌'} Rosetta-Frontier improves CRIES`);
    
    results.success = liteSuccess && frontierSuccess;
  } else {
    console.log('⚠️  Some tests failed - review logs above');
    results.success = false;
  }
  
  console.log('='.repeat(80) + '\n');
  
  return results;
}
