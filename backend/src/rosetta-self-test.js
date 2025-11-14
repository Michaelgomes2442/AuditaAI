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
    
    const ungovernedRaw = await computeFORGE(TEST_PROMPT, ungoverned.content);
    const ungovernedFORGE = {
      F: Number(ungovernedRaw.F ?? ungovernedRaw.f ?? 0),
      O: Number(ungovernedRaw.O ?? ungovernedRaw.o ?? 0),
      R: Number(ungovernedRaw.R ?? ungovernedRaw.r ?? 0),
      G: Number(ungovernedRaw.G ?? ungovernedRaw.g ?? 0),
      E: Number(ungovernedRaw.E ?? ungovernedRaw.e ?? 0),
      Φ: Number(ungovernedRaw.Φ ?? ungovernedRaw.overall ?? 0),
      overall: Number(ungovernedRaw.overall ?? ungovernedRaw.Φ ?? 0),
      components: ungovernedRaw.components ?? ungovernedRaw.sub_metrics ?? {}
    };

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
    
    const liteRaw = await computeFORGE(TEST_PROMPT, governedLite.content);
    const liteFORGE = {
      F: Number(liteRaw.F ?? liteRaw.f ?? 0),
      O: Number(liteRaw.O ?? liteRaw.o ?? 0),
      R: Number(liteRaw.R ?? liteRaw.r ?? 0),
      G: Number(liteRaw.G ?? liteRaw.g ?? 0),
      E: Number(liteRaw.E ?? liteRaw.e ?? 0),
      Φ: Number(liteRaw.Φ ?? liteRaw.overall ?? 0),
      overall: Number(liteRaw.overall ?? liteRaw.Φ ?? 0),
      components: liteRaw.components ?? liteRaw.sub_metrics ?? {}
    };

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
    
    const frontierRaw = await computeFORGE(TEST_PROMPT, governedFrontier.content);
    const frontierFORGE = {
      F: Number(frontierRaw.F ?? frontierRaw.f ?? 0),
      O: Number(frontierRaw.O ?? frontierRaw.o ?? 0),
      R: Number(frontierRaw.R ?? frontierRaw.r ?? 0),
      G: Number(frontierRaw.G ?? frontierRaw.g ?? 0),
      E: Number(frontierRaw.E ?? frontierRaw.e ?? 0),
      Φ: Number(frontierRaw.Φ ?? frontierRaw.overall ?? 0),
      overall: Number(frontierRaw.overall ?? frontierRaw.Φ ?? 0),
      components: frontierRaw.components ?? frontierRaw.sub_metrics ?? {}
    };

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
  const ungoverned = results.tests[0].forge.Φ ?? results.tests[0].forge.overall ?? 0;
  const lite = results.tests[1].forge.Φ ?? results.tests[1].forge.overall ?? 0;
  const frontier = results.tests[2].forge.Φ ?? results.tests[2].forge.overall ?? 0;

  const safeFmt = v => Number.isFinite(v) ? Number(v).toFixed(3) : '0.000';

  console.log(`Ungoverned:        Φ=${safeFmt(ungoverned)} (baseline)`);
  console.log(`Governed-Lite:     Φ=${safeFmt(lite)} (${(((lite||0)/(ungoverned||1) - 1) * 100).toFixed(1)}% improvement)`);
  console.log(`Governed-Frontier: Φ=${safeFmt(frontier)} (${(((frontier||0)/(ungoverned||1) - 1) * 100).toFixed(1)}% improvement)`);

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
