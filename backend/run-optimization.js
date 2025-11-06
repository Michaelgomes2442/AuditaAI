#!/usr/bin/env node

/**
 * GOVERNANCE PARAMETER OPTIMIZATION
 * Systematically tests governance variations to find optimal CRIES configuration
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = process.env.API_URL || 'http://localhost:3001';
const STANDARD_MODEL = 'claude-opus-4-1-20250805';
const ROSETTA_MODEL = 'claude-opus-4-1-20250805-rosetta';

// Diverse test prompts to prevent overfitting
const TEST_PROMPTS = [
  {
    id: 'executive-ai-risk',
    name: 'Executive AI Risk',
    prompt: 'Explain the risks of deploying a general-purpose AI assistant inside a company, focusing on the difference between what the model says and what decision-makers assume it means. Highlight how this gap leads to operational mistakes, hallucination-driven decisions, compliance exposure, and loss of accountability. Make it clear, practical, and written for a non-technical executive.',
    weight: 2.0 // Primary test case
  },
  {
    id: 'technical-architecture',
    name: 'Technical Architecture',
    prompt: 'Explain how microservices architecture differs from monolithic architecture, focusing on the operational trade-offs. Discuss when each makes sense, common failure modes, and what non-technical stakeholders need to understand about the migration complexity.',
    weight: 1.0
  },
  {
    id: 'strategic-analysis',
    name: 'Strategic Business Analysis',
    prompt: 'Analyze why established companies struggle to respond to disruptive innovation, using specific mechanisms from Clayton Christensen\'s research. Explain how organizational structure, incentive systems, and resource allocation create systematic blindness to emerging threats.',
    weight: 1.0
  }
];

// Governance variations - each tests a specific hypothesis
const VARIATIONS = {
  'v2-baseline': {
    name: 'V2 Baseline (Reasoning-First)',
    description: 'Current v2: Pure reasoning principles, 8 standards',
    file: 'rosetta-frontier-v2-baseline.txt',
    hypothesis: 'Baseline: +8-9% Omega expected'
  },
  'v2.1-cumulative': {
    name: 'V2.1 Cumulative Reasoning',
    description: 'V2 + 9th principle for progressive argument building',
    file: 'rosetta-frontier-v2.1-cumulative.txt',
    hypothesis: 'Adding positive flow guidance improves Coherence without harming other pillars'
  }
};

// Helper: Run parallel audit
async function runParallelAudit(prompt) {
  const response = await fetch(`${API_URL}/api/live-demo/parallel-prompt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-consent': 'true'
    },
    body: JSON.stringify({
      prompt: prompt.prompt,
      standardModelId: STANDARD_MODEL,
      rosettaModelId: ROSETTA_MODEL
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    ungoverned: data.results.standard.cries_analysis,
    governed: data.results.rosetta.cries_analysis,
    governedOutput: data.results.rosetta.output
  };
}

// Helper: Calculate improvements
function calculateImprovements(ungoverned, governed) {
  const metrics = ['C', 'R', 'I', 'E', 'S', 'Omega'];
  const improvements = {};
  
  metrics.forEach(metric => {
    const base = ungoverned[metric] || 0;
    const gov = governed[metric] || 0;
    improvements[metric] = {
      base,
      governed: gov,
      absolute: gov - base,
      percentage: base > 0 ? ((gov - base) / base) * 100 : 0
    };
  });
  
  return improvements;
}

// Helper: Apply governance variation
async function applyVariation(variation) {
  const governancePath = path.join(__dirname, 'governance/rosetta-frontier.txt');
  
  if (variation.file) {
    // Copy specific file
    const sourcePath = path.join(__dirname, 'governance', variation.file);
    const content = await fs.readFile(sourcePath, 'utf-8');
    await fs.writeFile(governancePath, content);
    console.log(`   ✓ Loaded: ${variation.file}`);
  } else if (variation.modifications) {
    // Apply modifications programmatically
    console.log(`   ⚠ Manual modifications required for: ${variation.name}`);
    console.log(`   Skipping automated test for now.`);
    return false;
  }
  
  // Give governance loader time to reload (if using file watching)
  await new Promise(resolve => setTimeout(resolve, 500));
  return true;
}

// Main execution
async function runOptimization() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('GOVERNANCE PARAMETER OPTIMIZATION');
  console.log('═══════════════════════════════════════════════════════════════════\n');
  console.log(`API: ${API_URL}`);
  console.log(`Test Prompts: ${TEST_PROMPTS.length}`);
  console.log(`Variations: ${Object.keys(VARIATIONS).length}`);
  console.log(`Total Tests: ${TEST_PROMPTS.length * Object.keys(VARIATIONS).length}\n`);

  const allResults = [];

  // Test each variation
  for (const [varId, variation] of Object.entries(VARIATIONS)) {
    console.log('─'.repeat(70));
    console.log(`Testing: ${variation.name}`);
    console.log(`Hypothesis: ${variation.hypothesis}`);
    console.log('─'.repeat(70));

    const applied = await applyVariation(variation);
    if (!applied) {
      console.log('   Skipped (requires manual setup)\n');
      continue;
    }

    const variationResults = {
      id: varId,
      name: variation.name,
      description: variation.description,
      hypothesis: variation.hypothesis,
      prompts: []
    };

    // Test against each prompt
    for (const testPrompt of TEST_PROMPTS) {
      console.log(`\n   Testing: ${testPrompt.name}...`);

      try {
        const result = await runParallelAudit(testPrompt);
        const improvements = calculateImprovements(result.ungoverned, result.governed);

        const promptResult = {
          promptId: testPrompt.id,
          promptName: testPrompt.name,
          weight: testPrompt.weight,
          ungoverned: result.ungoverned,
          governed: result.governed,
          improvements
        };

        variationResults.prompts.push(promptResult);

        // Log quick summary
        console.log(`      Ω: ${result.ungoverned.Omega.toFixed(2)} → ${result.governed.Omega.toFixed(2)} (${improvements.Omega.percentage.toFixed(1)}%)`);
        console.log(`      R: ${result.ungoverned.R.toFixed(2)} → ${result.governed.R.toFixed(2)} (${improvements.R.percentage.toFixed(1)}%)`);
        console.log(`      C: ${result.ungoverned.C.toFixed(2)} → ${result.governed.C.toFixed(2)} (${improvements.C.percentage.toFixed(1)}%)`);

      } catch (error) {
        console.error(`      ❌ Error: ${error.message}`);
      }

      // Brief delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Calculate weighted average improvements
    let weightedOmega = 0;
    let totalWeight = 0;

    variationResults.prompts.forEach(p => {
      weightedOmega += p.improvements.Omega.percentage * p.weight;
      totalWeight += p.weight;
    });

    variationResults.weightedOmegaImprovement = weightedOmega / totalWeight;

    allResults.push(variationResults);

    console.log(`\n   ✓ Weighted Omega Improvement: ${variationResults.weightedOmegaImprovement.toFixed(1)}%\n`);
  }

  // Generate final report
  console.log('\n' + '═'.repeat(70));
  console.log('OPTIMIZATION RESULTS');
  console.log('═'.repeat(70));

  // Sort by weighted Omega improvement
  allResults.sort((a, b) => b.weightedOmegaImprovement - a.weightedOmegaImprovement);

  console.log('\nRANKING (by weighted Omega improvement):\n');
  allResults.forEach((result, index) => {
    const symbol = index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
    console.log(`${symbol} ${index + 1}. ${result.name}`);
    console.log(`      Weighted Ω: ${result.weightedOmegaImprovement.toFixed(1)}%`);
    console.log(`      Hypothesis: ${result.hypothesis}`);
    
    // Show per-prompt breakdown
    result.prompts.forEach(p => {
      console.log(`        - ${p.promptName}: ${p.improvements.Omega.percentage.toFixed(1)}%`);
    });
    console.log();
  });

  // Detailed analysis of best variation
  const best = allResults[0];
  console.log('─'.repeat(70));
  console.log(`BEST CONFIGURATION: ${best.name}`);
  console.log('─'.repeat(70));

  // Calculate average improvements per pillar
  const pillars = ['C', 'R', 'I', 'E', 'S'];
  console.log('\nAverage Pillar Improvements:');
  
  pillars.forEach(pillar => {
    const avgImprovement = best.prompts.reduce((sum, p) => {
      return sum + (p.improvements[pillar].percentage * p.weight);
    }, 0) / best.prompts.reduce((sum, p) => sum + p.weight, 0);
    
    const symbol = avgImprovement > 5 ? '✓' : avgImprovement > 0 ? '~' : '✗';
    console.log(`  ${symbol} ${pillar}: ${avgImprovement.toFixed(1)}%`);
  });

  // Check for consistent improvements
  console.log('\nConsistency Analysis:');
  pillars.forEach(pillar => {
    const improvements = best.prompts.map(p => p.improvements[pillar].percentage);
    const allPositive = improvements.every(i => i > 0);
    const mostPositive = improvements.filter(i => i > 0).length / improvements.length > 0.66;
    
    if (allPositive) {
      console.log(`  ✓ ${pillar}: Improved across ALL prompts`);
    } else if (mostPositive) {
      console.log(`  ~ ${pillar}: Improved in most prompts`);
    } else {
      console.log(`  ✗ ${pillar}: Inconsistent results`);
    }
  });

  // Recommendations
  console.log('\n' + '═'.repeat(70));
  console.log('RECOMMENDATIONS');
  console.log('═'.repeat(70));

  if (best.weightedOmegaImprovement >= 10) {
    console.log(`\n✅ DEPLOY: ${best.name}`);
    console.log(`   Expected Omega: +${best.weightedOmegaImprovement.toFixed(1)}%`);
    console.log(`   Hypothesis validated: ${best.hypothesis}`);
  } else if (best.weightedOmegaImprovement >= 8) {
    console.log(`\n✓ CONSIDER: ${best.name}`);
    console.log(`   Expected Omega: +${best.weightedOmegaImprovement.toFixed(1)}%`);
    console.log(`   Meets minimum threshold but below stretch goal`);
  } else {
    console.log(`\n⚠️  INSUFFICIENT IMPROVEMENT`);
    console.log(`   Best result: +${best.weightedOmegaImprovement.toFixed(1)}%`);
    console.log(`   Target: +10-12%`);
    console.log(`   Recommendation: Explore new hypotheses`);
  }

  // Save detailed results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(__dirname, `governance-optimization-${timestamp}.json`);
  await fs.writeFile(reportPath, JSON.stringify(allResults, null, 2));
  
  console.log(`\nDetailed results saved: ${reportPath}`);
  console.log('\n' + '═'.repeat(70) + '\n');

  // Restore baseline
  console.log('Restoring baseline governance...');
  await applyVariation(VARIATIONS['v2-baseline']);
  console.log('✓ Baseline restored\n');
}

// Execute
runOptimization().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
