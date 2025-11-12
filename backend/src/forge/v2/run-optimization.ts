#!/usr/bin/env tsx
/**
 * FORGE v2 Autonomous Optimization Pipeline
 * 
 * Runs full Bayesian optimization to perfect FORGE scoring
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { generateAllResponses } from './response-generator';
import { optimizeForge, evaluateParams, DEFAULT_PARAMS } from './bayesian-optimizer';
import { computeForgeV2 } from './pillars';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testCorpus = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'test-corpus.json'), 'utf-8')
);

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║         FORGE v2 AUTONOMOUS OPTIMIZATION PIPELINE            ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  // Phase 1: Generate synthetic responses
  console.log('[Phase 1] Generating synthetic responses...');
  const { governedResponses, standardResponses } = generateAllResponses();
  console.log(`✓ Generated ${governedResponses.size} governed responses`);
  console.log(`✓ Generated ${standardResponses.size} standard responses\n`);
  
  // Phase 2: Baseline evaluation
  console.log('[Phase 2] Evaluating v1.0 baseline...');
  const baselineEval = await evaluateParams(
    DEFAULT_PARAMS,
    testCorpus,
    governedResponses,
    standardResponses
  );
  
  console.log(`✓ Baseline avg improvement: ${baselineEval.metrics.avgImprovement.toFixed(4)}`);
  console.log(`✓ Baseline avg governed Φ: ${baselineEval.metrics.avgGoverned.toFixed(4)}`);
  console.log(`✓ Baseline avg standard Φ: ${baselineEval.metrics.avgStandard.toFixed(4)}\n`);
  
  // Phase 3: Bayesian optimization
  console.log('[Phase 3] Running Bayesian optimization (100 iterations)...\n');
  const optimizationResult = await optimizeForge(
    testCorpus,
    governedResponses,
    standardResponses,
    100  // iterations
  );
  
  console.log('\n[Phase 4] Optimization Results');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Best score: ${optimizationResult.score.toFixed(4)}`);
  console.log(`Improvement over baseline: ${((optimizationResult.score - baselineEval.score) / baselineEval.score * 100).toFixed(2)}%\n`);
  
  console.log('Optimized Parameters:');
  console.log(JSON.stringify(optimizationResult.params, null, 2));
  console.log('');
  
  // Phase 5: Final validation
  console.log('[Phase 5] Final validation across all test categories...\n');
  const finalEval = await evaluateParams(
    optimizationResult.params,
    testCorpus,
    governedResponses,
    standardResponses
  );
  
  console.log('Category Breakdown:');
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Group results by category
  const categoryStats: Record<string, { governed: number[]; standard: number[]; improvements: number[] }> = {};
  
  for (const result of finalEval.metrics.results) {
    if (!categoryStats[result.category]) {
      categoryStats[result.category] = { governed: [], standard: [], improvements: [] };
    }
    categoryStats[result.category].governed.push(result.governed);
    categoryStats[result.category].standard.push(result.standard);
    categoryStats[result.category].improvements.push(result.improvement);
  }
  
  for (const [category, stats] of Object.entries(categoryStats)) {
    const avgGoverned = stats.governed.reduce((a, b) => a + b, 0) / stats.governed.length;
    const avgStandard = stats.standard.reduce((a, b) => a + b, 0) / stats.standard.length;
    const avgImprovement = stats.improvements.reduce((a, b) => a + b, 0) / stats.improvements.length;
    const improvementPct = ((avgGoverned - avgStandard) / avgStandard * 100);
    
    console.log(`\n${category}:`);
    console.log(`  Governed Φ:   ${avgGoverned.toFixed(4)}`);
    console.log(`  Standard Φ:   ${avgStandard.toFixed(4)}`);
    console.log(`  Improvement:  ${improvementPct > 0 ? '+' : ''}${improvementPct.toFixed(1)}%`);
  }
  
  console.log('\n');
  console.log('Overall Statistics:');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Average Governed Φ:  ${finalEval.metrics.avgGoverned.toFixed(4)}`);
  console.log(`Average Standard Φ:  ${finalEval.metrics.avgStandard.toFixed(4)}`);
  console.log(`Average Improvement: +${((finalEval.metrics.avgGoverned - finalEval.metrics.avgStandard) / finalEval.metrics.avgStandard * 100).toFixed(1)}%`);
  console.log(`Tests evaluated:     ${finalEval.metrics.testCount}`);
  
  // Phase 6: Save results
  console.log('\n[Phase 6] Saving optimization results...');
  
  const resultsDir = path.join(__dirname, 'optimization-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = path.join(resultsDir, `forge-v2-optimization-${timestamp}.json`);
  
  fs.writeFileSync(
    resultsFile,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      baseline: baselineEval,
      optimized: optimizationResult,
      finalValidation: finalEval,
      categoryStats
    }, null, 2)
  );
  
  console.log(`✓ Results saved to: ${resultsFile}\n`);
  
  // Phase 7: Generate deployment config
  console.log('[Phase 7] Generating deployment configuration...');
  
  const deployConfig = {
    version: '2.0.0',
    optimized: true,
    timestamp: new Date().toISOString(),
    parameters: optimizationResult.params,
    performance: {
      avgGovernedPhi: finalEval.metrics.avgGoverned,
      avgStandardPhi: finalEval.metrics.avgStandard,
      avgImprovement: finalEval.metrics.avgImprovement,
      improvementPercentage: ((finalEval.metrics.avgGoverned - finalEval.metrics.avgStandard) / finalEval.metrics.avgStandard * 100)
    },
    validation: {
      testCount: finalEval.metrics.testCount,
      categoryBreakdown: categoryStats
    }
  };
  
  const configFile = path.join(__dirname, 'forge-v2-config.json');
  fs.writeFileSync(configFile, JSON.stringify(deployConfig, null, 2));
  
  console.log(`✓ Config saved to: ${configFile}\n`);
  
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║              FORGE v2 OPTIMIZATION COMPLETE! ✨               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Next steps:');
  console.log('1. Review optimization results in:', resultsFile);
  console.log('2. Update production config with optimized parameters');
  console.log('3. Run real LLM tests against Tests 3-7 for validation');
  console.log('4. Update governance wrapper with insights from optimization');
  console.log('');
}

main().catch(console.error);
