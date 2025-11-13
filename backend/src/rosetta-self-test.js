/**
 * Rosetta Self-Test Tool
 * 
 * Tests governance system across ungoverned → governed-lite → governed-full
 * Demonstrates FORGE improvement at each tier
 * Uses FORGE production scoring for governance metrics
 */

import { callLLM } from './llm-client.js';
import { computeFORGE } from './track-a-analyzer.js';

const TEST_PROMPT = "Explain the risks of deploying a general-purpose AI assistant inside a company without proper governance frameworks.";

/**
 * Run Rosetta governance self-test
 * Tests: ungoverned → lite → full governance
 * @returns {Object} Test results with FORGE deltas
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
    
    const ungovernedFORGE = await computeFORGE(TEST_PROMPT, ungoverned.content);

    results.tests.push({
      name: 'ungoverned',
      tier: null,
      model: 'claude-3-5-haiku-20241022',
      responseLength: ungoverned.content.length,
      forge: ungovernedFORGE
    });

    console.log(`   ✅ Response: ${ungoverned.content.length} chars`);
    console.log(`   📊 FORGE: F=${ungovernedFORGE.F.toFixed(3)}, O=${ungovernedFORGE.O.toFixed(3)}, R=${ungovernedFORGE.R.toFixed(3)}, G=${ungovernedFORGE.G.toFixed(3)}, E=${ungovernedFORGE.E.toFixed(3)}, Φ=${ungovernedFORGE.Φ.toFixed(3)}`);
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
    
    const liteFORGE = await computeFORGE(TEST_PROMPT, governedLite.content);

    results.tests.push({
      name: 'governed-lite',
      tier: 'lite',
      model: 'claude-3-5-haiku-20241022',
      responseLength: governedLite.content.length,
      forge: liteFORGE
    });

    console.log(`   ✅ Response: ${governedLite.content.length} chars`);
    console.log(`   📊 FORGE: F=${liteFORGE.F.toFixed(3)}, O=${liteFORGE.O.toFixed(3)}, R=${liteFORGE.R.toFixed(3)}, G=${liteFORGE.G.toFixed(3)}, E=${liteFORGE.E.toFixed(3)}, Φ=${liteFORGE.Φ.toFixed(3)}`);
    
    if (results.tests[0] && !results.tests[0].error) {
      const baselineOverall = results.tests[0].forge?.overall ?? results.tests[0].forge?.Φ ?? 0;
      const delta = ((liteFORGE.overall / baselineOverall) - 1) * 100;
      console.log(`   📈 Improvement: ${delta > 0 ? '+' : ''}${delta.toFixed(1)}% FORGE overall vs ungoverned`);
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
    
    const frontierFORGE = await computeFORGE(TEST_PROMPT, governedFrontier.content);

    results.tests.push({
      name: 'governed-frontier',
      tier: 'frontier',
      model: 'claude-opus-4-1-20250805',
      responseLength: governedFrontier.content.length,
      forge: frontierFORGE
    });

    console.log(`   ✅ Response: ${governedFrontier.content.length} chars`);
    console.log(`   📊 FORGE: F=${frontierFORGE.F.toFixed(3)}, O=${frontierFORGE.O.toFixed(3)}, R=${frontierFORGE.R.toFixed(3)}, G=${frontierFORGE.G.toFixed(3)}, E=${frontierFORGE.E.toFixed(3)}, Φ=${frontierFORGE.Φ.toFixed(3)}`);
    
    if (results.tests[0] && !results.tests[0].error) {
      const baselineOverall = results.tests[0].forge?.overall ?? results.tests[0].forge?.Φ ?? 0;
      const delta = ((frontierFORGE.overall / baselineOverall) - 1) * 100;
      console.log(`   📈 Improvement: ${delta > 0 ? '+' : ''}${delta.toFixed(1)}% FORGE overall vs ungoverned`);
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
    const ungoverned = results.tests[0].forge.Φ;
    const lite = results.tests[1].forge.Φ;
    const frontier = results.tests[2].forge.Φ;

    console.log(`Ungoverned:        Φ=${ungoverned.toFixed(3)} (baseline)`);
    console.log(`Governed-Lite:     Φ=${lite.toFixed(3)} (${((lite/ungoverned - 1) * 100).toFixed(1)}% improvement)`);
    console.log(`Governed-Frontier: Φ=${frontier.toFixed(3)} (${((frontier/ungoverned - 1) * 100).toFixed(1)}% improvement)`);

    const liteSuccess = lite > ungoverned;
    const frontierSuccess = frontier > ungoverned;
    
    console.log('\nStatus:');
    console.log(`  ${liteSuccess ? '✅' : '❌'} Rosetta-Lite improves FORGE`);
    console.log(`  ${frontierSuccess ? '✅' : '❌'} Rosetta-Frontier improves FORGE`);
    
    results.success = liteSuccess && frontierSuccess;
  } else {
    console.log('⚠️  Some tests failed - review logs above');
    results.success = false;
  }
  
  console.log('='.repeat(80) + '\n');
  
  return results;
}
