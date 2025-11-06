/**
 * GOVERNANCE OPTIMIZATION TEST SUITE
 * Systematically tests governance variations to find optimal CRIES scores
 * 
 * Strategy:
 * 1. Define test prompts (diverse scenarios)
 * 2. Define governance variations (systematic parameter changes)
 * 3. Run parallel audits for each variation
 * 4. Analyze CRIES patterns to identify optimal configuration
 */

import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const STANDARD_MODEL = 'claude-opus-4-1-20250805';
const ROSETTA_MODEL = 'claude-opus-4-1-20250805-rosetta';

// Global results array
let allResults = [];

// Test prompts - diverse scenarios to prevent overfitting
const TEST_PROMPTS = [
  {
    id: 'executive-ai-risk',
    name: 'Executive AI Risk Explanation',
    prompt: 'Explain the risks of deploying a general-purpose AI assistant inside a company, focusing on the difference between what the model says and what decision-makers assume it means. Highlight how this gap leads to operational mistakes, hallucination-driven decisions, compliance exposure, and loss of accountability. Make it clear, practical, and written for a non-technical executive.',
    baseline: { C: 0.56, R: 0.35, I: 0.63, E: 0.68, S: 0.81, Omega: 0.58 }
  },
  {
    id: 'technical-architecture',
    name: 'Technical Architecture Explanation',
    prompt: 'Explain how microservices architecture differs from monolithic architecture, focusing on the operational trade-offs. Discuss when each makes sense, common failure modes, and what non-technical stakeholders need to understand about the migration complexity.',
    baseline: null // Will establish on first run
  },
  {
    id: 'strategic-analysis',
    name: 'Strategic Business Analysis',
    prompt: 'Analyze why established companies struggle to respond to disruptive innovation, using specific mechanisms from Clayton Christensen\'s research. Explain how organizational structure, incentive systems, and resource allocation create systematic blindness to emerging threats.',
    baseline: null
  },
  {
    id: 'risk-assessment',
    name: 'Risk Assessment Scenario',
    prompt: 'A fintech startup wants to deploy AI-powered loan approval. Explain the regulatory, operational, and reputational risks they face. Focus on what can go wrong, why traditional risk management misses AI-specific issues, and what early warning signs look like.',
    baseline: null
  }
];

// Governance variations to test
const GOVERNANCE_VARIATIONS = {
  'v2-baseline': {
    description: 'V2 Baseline - Pure reasoning-first (proven +8.9% Omega)',
    file: 'rosetta-frontier-v2-baseline.txt',
    hypothesis: 'Baseline performance without additional guidance'
  },
  'v2.1-cumulative': {
    description: 'V2.1 - Cumulative reasoning',
    file: 'rosetta-frontier-v2.1-cumulative.txt',
    hypothesis: 'Progressive argument building improves coherence'
  },
  'v2.2-depth': {
    description: 'V2.2 - Stronger depth (2-3 points)',
    file: 'rosetta-frontier-v2.2-depth.txt',
    hypothesis: 'Explicit focus increases rigor'
  },
  'v2.3-examples': {
    description: 'V2.3 - Enhanced example specificity',
    file: 'rosetta-frontier-v2.3-examples.txt',
    hypothesis: 'Named examples with dates/numbers improves strictness and rigor'
  },
  'v2.4-rigor': {
    description: 'V2.4 - Explicit rigor requirements',
    file: 'rosetta-frontier-v2.4-rigor.txt',
    hypothesis: 'Rigor-focused governance with 3-step causal chain requirements'
  },
  'v2.5-balanced': {
    description: 'V2.5 - Balanced CRIES optimization',
    file: 'rosetta-frontier-v2.5-balanced.txt',
    hypothesis: 'Explicit optimization for all 5 pillars balances improvements'
  },
  'v2.6-minimal': {
    description: 'V2.6 - Ultra-minimal governance',
    file: 'rosetta-frontier-v2.6-minimal.txt',
    hypothesis: 'Less guidance = more natural reasoning (test if we\'re over-governing)'
  }
};

// Helper: Run parallel audit
async function runParallelAudit(promptObj, page) {
  console.log(`  Running audit for: ${promptObj.name}`);
  console.log(`    Sending request to API...`);
  
  const startTime = Date.now();
  
  // Get API keys from environment
  const apiKeys = {
    anthropic: process.env.ANTHROPIC_API_KEY || null,
    openai: process.env.OPENAI_API_KEY || null
  };
  
  if (!apiKeys.anthropic && !apiKeys.openai) {
    console.warn('    ⚠️  No API keys found in environment - backend will use simulation mode');
  }
  
  const response = await page.request.post(`${API_BASE_URL}/api/live-demo/parallel-prompt`, {
    headers: {
      'Content-Type': 'application/json',
      'x-user-consent': 'true'
    },
    data: {
      prompt: promptObj.prompt,
      standardModelId: STANDARD_MODEL,
      rosettaModelId: ROSETTA_MODEL,
      apiKeys: apiKeys // Pass API keys to backend
    },
    timeout: 600000 // 10 minute timeout for the HTTP request itself
  });

  const requestTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`    Response received after ${requestTime}s`);

  if (!response.ok()) {
    const text = await response.text();
    throw new Error(`API request failed: ${response.status()} - ${text}`);
  }
  
  const data = await response.json();
  
  // The API returns: { standardResponse: { content, cries }, rosettaResponse: { content, cries } }
  if (!data.standardResponse || !data.rosettaResponse) {
    throw new Error(`Invalid API response structure. Got: ${JSON.stringify(Object.keys(data))}`);
  }
  
  console.log(`    Ungoverned Ω: ${data.standardResponse.cries.overall?.toFixed(2) || 'N/A'}`);
  console.log(`    Governed Ω:   ${data.rosettaResponse.cries.overall?.toFixed(2) || 'N/A'}`);
  
  return {
    ungoverned: {
      output: data.standardResponse.content,
      cries: data.standardResponse.cries
    },
    governed: {
      output: data.rosettaResponse.content,
      cries: data.rosettaResponse.cries
    }
  };
}

// Helper: Calculate improvement metrics
function calculateImprovement(ungoverned, governed) {
  const metrics = ['C', 'R', 'I', 'E', 'S', 'overall'];
  const improvements = {};
  
  metrics.forEach(metric => {
    const base = ungoverned[metric] || 0;
    const gov = governed[metric] || 0;
    improvements[metric] = {
      absolute: gov - base,
      percentage: base > 0 ? ((gov - base) / base) * 100 : 0
    };
  });
  
  // Add Omega as alias for overall for backward compatibility
  improvements.Omega = improvements.overall;
  
  return improvements;
}

// Helper: Generate markdown report
function generateMarkdownReport(results) {
  const date = new Date().toISOString().split('T')[0];
  let md = `# Governance Optimization Test Report\n\n`;
  md += `**Date:** ${date}  \n`;
  md += `**Variations Tested:** ${results.length}  \n`;
  md += `**Target:** Ω +15-20% improvement\n\n`;
  md += `---\n\n`;
  
  // Sort by omega improvement
  const sorted = [...results].sort((a, b) => b.avgOmegaImprovement - a.avgOmegaImprovement);
  
  // Rankings table
  md += `## Rankings (by Omega Improvement)\n\n`;
  md += `| Rank | Variation | Ω Improvement | Success Rate | File |\n`;
  md += `|------|-----------|---------------|--------------|------|\n`;
  
  sorted.forEach((r, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
    const omega = r.avgOmegaImprovement > 0 ? `+${r.avgOmegaImprovement.toFixed(1)}%` : `${r.avgOmegaImprovement.toFixed(1)}%`;
    md += `| ${medal} | ${r.description} | **${omega}** | ${r.successRate || 'N/A'} | \`${r.file}\` |\n`;
  });
  
  md += `\n---\n\n`;
  
  // Detailed breakdown for each variation
  md += `## Detailed Results\n\n`;
  
  sorted.forEach((result, index) => {
    md += `### ${index + 1}. ${result.description}\n\n`;
    md += `**File:** \`${result.file}\`  \n`;
    md += `**Hypothesis:** ${result.hypothesis || 'N/A'}  \n`;
    md += `**Average Ω Improvement:** ${result.avgOmegaImprovement > 0 ? '+' : ''}${result.avgOmegaImprovement.toFixed(1)}%  \n`;
    md += `**Success Rate:** ${result.successRate || 'N/A'}\n\n`;
    
    const successfulPrompts = result.prompts.filter(p => !p.error);
    
    if (successfulPrompts.length > 0) {
      md += `#### CRIES Pillar Breakdown\n\n`;
      md += `| Pillar | Avg Improvement | Interpretation |\n`;
      md += `|--------|----------------|----------------|\n`;
      
      const pillars = ['C', 'R', 'I', 'E', 'S'];
      pillars.forEach(pillar => {
        const avg = successfulPrompts.reduce((sum, p) => sum + p.improvements[pillar].percentage, 0) / successfulPrompts.length;
        const symbol = avg > 5 ? '✅' : avg > 0 ? '✓' : avg > -5 ? '~' : '❌';
        const interpretation = avg > 10 ? 'Excellent' : avg > 5 ? 'Good' : avg > 0 ? 'Slight improvement' : avg > -5 ? 'Minimal change' : 'Degradation';
        md += `| **${pillar}** | ${symbol} ${avg > 0 ? '+' : ''}${avg.toFixed(1)}% | ${interpretation} |\n`;
      });
      
      md += `\n#### Prompt-by-Prompt Results\n\n`;
      result.prompts.forEach(p => {
        if (p.error) {
          md += `- ❌ **${p.promptName}**: Error - ${p.error}\n`;
        } else {
          md += `- ${p.omegaImprovement > 0 ? '✅' : '⚠️'} **${p.promptName}**: Ω ${p.omegaImprovement > 0 ? '+' : ''}${p.omegaImprovement.toFixed(1)}%`;
          md += ` (C: ${p.improvements.C.percentage.toFixed(1)}%, R: ${p.improvements.R.percentage.toFixed(1)}%, I: ${p.improvements.I.percentage.toFixed(1)}%, E: ${p.improvements.E.percentage.toFixed(1)}%, S: ${p.improvements.S.percentage.toFixed(1)}%)\n`;
        }
      });
    } else {
      md += `**⚠️ All tests failed for this variation**\n\n`;
      result.prompts.forEach(p => {
        md += `- ${p.promptName}: ${p.error}\n`;
      });
    }
    
    md += `\n---\n\n`;
  });
  
  // Winner section
  const winner = sorted[0];
  md += `## Recommendation\n\n`;
  
  if (winner.avgOmegaImprovement >= 15) {
    md += `### ✅ DEPLOY: ${winner.description}\n\n`;
    md += `**File:** \`${winner.file}\`  \n`;
    md += `**Expected Improvement:** +${winner.avgOmegaImprovement.toFixed(1)}% Ω  \n`;
    md += `**Status:** **Exceeds target (+15-20%)**\n\n`;
    md += `**Deployment Command:**\n\`\`\`bash\n`;
    md += `cp governance/${winner.file} governance/rosetta-frontier.txt\n`;
    md += `\`\`\`\n\n`;
  } else if (winner.avgOmegaImprovement >= 10) {
    md += `### ⚠️ STRONG CANDIDATE: ${winner.description}\n\n`;
    md += `**File:** \`${winner.file}\`  \n`;
    md += `**Expected Improvement:** +${winner.avgOmegaImprovement.toFixed(1)}% Ω  \n`;
    md += `**Status:** Below target but significant improvement\n\n`;
    md += `**Recommendation:** Deploy as interim improvement while continuing optimization\n\n`;
  } else if (winner.avgOmegaImprovement >= 5) {
    md += `### 💡 MARGINAL IMPROVEMENT: ${winner.description}\n\n`;
    md += `**File:** \`${winner.file}\`  \n`;
    md += `**Expected Improvement:** +${winner.avgOmegaImprovement.toFixed(1)}% Ω  \n`;
    md += `**Status:** Below target\n\n`;
    md += `**Recommendation:** Continue optimization with new hypotheses\n\n`;
  } else {
    md += `### ❌ NO CLEAR WINNER\n\n`;
    md += `Best variation: ${winner.description} (+${winner.avgOmegaImprovement.toFixed(1)}% Ω)  \n`;
    md += `**Status:** Insufficient improvement\n\n`;
    md += `**Recommendation:** Rethink governance approach - current variations not effective\n\n`;
  }
  
  // Patterns analysis
  md += `## Patterns Observed\n\n`;
  
  const pillars = ['C', 'R', 'I', 'E', 'S'];
  md += `| Pillar | Best Variation | Avg Improvement |\n`;
  md += `|--------|---------------|------------------|\n`;
  
  pillars.forEach(pillar => {
    const improvements = sorted.map(r => {
      const successful = r.prompts.filter(p => !p.error);
      if (successful.length === 0) return { variation: r.description, avg: 0 };
      const avg = successful.reduce((sum, p) => sum + p.improvements[pillar].percentage, 0) / successful.length;
      return { variation: r.description, avg };
    });
    improvements.sort((a, b) => b.avg - a.avg);
    const best = improvements[0];
    md += `| **${pillar}** | ${best.variation} | ${best.avg > 0 ? '+' : ''}${best.avg.toFixed(1)}% |\n`;
  });
  
  md += `\n---\n\n`;
  md += `*Generated automatically by governance-optimizer.test.js*\n`;
  
  return md;
}

// Helper: Apply governance variation
async function applyGovernanceVariation(variationFile) {
  const sourcePath = path.join(__dirname, '../governance', variationFile);
  const targetPath = path.join(__dirname, '../governance/rosetta-frontier.txt');
  
  // Check if source file exists
  if (!fsSync.existsSync(sourcePath)) {
    throw new Error(`Governance file not found: ${sourcePath}`);
  }
  
  await fs.copyFile(sourcePath, targetPath);
  console.log(`✓ Applied governance: ${variationFile}`);
  
  // Wait for changes to propagate
  await new Promise(resolve => setTimeout(resolve, 500));
}

// Main test suite
test.describe('Governance Optimization Suite', () => {
  test.setTimeout(1200000); // 20 minutes per test (Opus can be very slow)
  
  test.beforeAll(async ({ request }) => {
    console.log('\n' + '='.repeat(80));
    console.log('GOVERNANCE OPTIMIZATION SUITE');
    console.log('='.repeat(80));
    console.log(`API: ${API_BASE_URL}`);
    console.log(`Timeout per test: 20 minutes (Opus calls can take 2-5 min each)`);
    
    // Ensure backend is running
    try {
      const response = await request.get(`${API_BASE_URL}/health`);
      if (!response.ok()) {
        throw new Error('Backend health check failed');
      }
      console.log('✓ Backend is running\n');
    } catch (error) {
      console.error('❌ Backend not accessible:', error.message);
      throw error;
    }
  });
  
  // Test each governance variation across all prompts
  for (const [variationId, variation] of Object.entries(GOVERNANCE_VARIATIONS)) {
    test(`Test variation: ${variation.description}`, async ({ page }) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Testing: ${variation.description}`);
      console.log('='.repeat(80));
      
      // Apply governance variation
      await applyGovernanceVariation(variation.file);
      
      const variationResults = {
        id: variationId,
        description: variation.description,
        file: variation.file,
        prompts: []
      };
      
      // Test against each prompt
      for (const testPrompt of TEST_PROMPTS) {
        console.log(`\n▶ Testing prompt: ${testPrompt.name}`);
        
        try {
          const result = await runParallelAudit(testPrompt, page);
          const improvements = calculateImprovement(
            result.ungoverned.cries,
            result.governed.cries
          );
          
          const promptResult = {
            promptId: testPrompt.id,
            promptName: testPrompt.name,
            ungoverned: result.ungoverned.cries,
            governed: result.governed.cries,
            improvements: improvements,
            omegaImprovement: improvements.Omega.percentage
          };
          
          variationResults.prompts.push(promptResult);
          
          // Log results
          console.log(`  Ungoverned Ω: ${result.ungoverned.cries.Omega.toFixed(2)}`);
          console.log(`  Governed Ω:   ${result.governed.cries.Omega.toFixed(2)} (${improvements.Omega.percentage > 0 ? '+' : ''}${improvements.Omega.percentage.toFixed(1)}%)`);
          console.log(`  CRIES: C=${result.governed.cries.C.toFixed(2)} R=${result.governed.cries.R.toFixed(2)} I=${result.governed.cries.I.toFixed(2)} E=${result.governed.cries.E.toFixed(2)} S=${result.governed.cries.S.toFixed(2)}`);
          
        } catch (error) {
          console.error(`  ❌ Error testing prompt: ${error.message}`);
          variationResults.prompts.push({
            promptId: testPrompt.id,
            promptName: testPrompt.name,
            error: error.message
          });
        }
      }
      
      // Calculate average improvement across successful prompts
      const successfulPrompts = variationResults.prompts.filter(p => !p.error);
      if (successfulPrompts.length > 0) {
        const avgOmegaImprovement = successfulPrompts.reduce(
          (sum, p) => sum + p.omegaImprovement, 0
        ) / successfulPrompts.length;
        
        variationResults.avgOmegaImprovement = avgOmegaImprovement;
        variationResults.successRate = `${successfulPrompts.length}/${variationResults.prompts.length}`;
        
        console.log(`\n✓ Average Omega Improvement: ${avgOmegaImprovement > 0 ? '+' : ''}${avgOmegaImprovement.toFixed(1)}%`);
        console.log(`  Success Rate: ${variationResults.successRate}`);
      } else {
        variationResults.avgOmegaImprovement = 0;
        variationResults.successRate = '0/' + variationResults.prompts.length;
        console.log(`\n❌ All tests failed for this variation`);
      }
      
      allResults.push(variationResults);
    });
  }
  
  test.afterAll(async () => {
    // Generate final report
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('GOVERNANCE OPTIMIZATION RESULTS');
    console.log('='.repeat(80));
    
    if (allResults.length === 0) {
      console.log('\n⚠️  No results to report');
      return;
    }
    
    // Sort by average Omega improvement
    allResults.sort((a, b) => b.avgOmegaImprovement - a.avgOmegaImprovement);
    
    console.log('\nRanking (by average Omega improvement):\n');
    allResults.forEach((result, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      console.log(`${medal} ${index + 1}. ${result.description}`);
      console.log(`   File: ${result.file}`);
      console.log(`   Average Omega Improvement: ${result.avgOmegaImprovement > 0 ? '+' : ''}${result.avgOmegaImprovement.toFixed(1)}%`);
      console.log(`   Success Rate: ${result.successRate}`);
      console.log(`   Prompt-by-prompt:`);
      result.prompts.forEach(p => {
        if (p.error) {
          console.log(`     ❌ ${p.promptName}: ${p.error}`);
        } else {
          console.log(`     ${p.omegaImprovement > 0 ? '✓' : '✗'} ${p.promptName}: ${p.omegaImprovement > 0 ? '+' : ''}${p.omegaImprovement.toFixed(1)}%`);
        }
      });
      console.log();
    });
    
    // Detailed analysis
    console.log('\nDETAILED PILLAR ANALYSIS\n');
    const bestVariation = allResults[0];
    console.log(`Best Variation: ${bestVariation.description}\n`);
    
    // Average improvements per pillar
    const pillars = ['C', 'R', 'I', 'E', 'S'];
    const successfulPrompts = bestVariation.prompts.filter(p => !p.error);
    
    if (successfulPrompts.length > 0) {
      pillars.forEach(pillar => {
        const avgImprovement = successfulPrompts.reduce(
          (sum, p) => sum + p.improvements[pillar].percentage, 0
        ) / successfulPrompts.length;
        const symbol = avgImprovement > 0 ? '✓' : avgImprovement < -5 ? '✗' : '~';
        console.log(`${symbol} ${pillar}: ${avgImprovement > 0 ? '+' : ''}${avgImprovement.toFixed(1)}% average improvement`);
      });
    }
    
    // Save results to JSON
    const reportPath = path.join(__dirname, '../governance-optimization-report.json');
    await fs.writeFile(reportPath, JSON.stringify(allResults, null, 2));
    console.log(`\nFull report saved to: ${reportPath}`);
    
    // Generate markdown comparison report
    const mdReport = generateMarkdownReport(allResults);
    const mdPath = path.join(__dirname, '../GOVERNANCE_OPTIMIZATION_REPORT.md');
    await fs.writeFile(mdPath, mdReport);
    console.log(`Markdown report saved to: ${mdPath}`);
    
    // Generate recommendations
    console.log('\n' + '='.repeat(80));
    console.log('RECOMMENDATIONS');
    console.log('='.repeat(80));
    
    if (bestVariation.avgOmegaImprovement > 8) {
      console.log(`✅ Deploy variation: ${bestVariation.description}`);
      console.log(`   Expected Omega improvement: +${bestVariation.avgOmegaImprovement.toFixed(1)}%`);
    } else {
      console.log('⚠️  No variation achieved target >8% improvement');
      console.log('   Consider new governance approaches');
    }
    
    // Identify patterns
    console.log('\nPATTERNS OBSERVED:');
    
    // Check if any variation consistently improved specific pillars
    const pillarPatterns = {};
    pillars.forEach(pillar => {
      const improvements = allResults.map(r => {
        const successful = r.prompts.filter(p => !p.error);
        if (successful.length === 0) return { variation: r.description, avg: 0 };
        const avg = successful.reduce(
          (sum, p) => sum + p.improvements[pillar].percentage, 0
        ) / successful.length;
        return { variation: r.description, avg };
      });
      improvements.sort((a, b) => b.avg - a.avg);
      pillarPatterns[pillar] = improvements[0];
    });
    
    Object.entries(pillarPatterns).forEach(([pillar, best]) => {
      const symbol = best.avg > 0 ? '✓' : '~';
      console.log(`  ${symbol} ${pillar}: Best with "${best.variation}" (${best.avg > 0 ? '+' : ''}${best.avg.toFixed(1)}%)`);
    });
  });
});

// Utility test: Quick single-prompt validation
test.describe('Quick Validation', () => {
  test('Validate current governance on executive AI risk prompt', async ({ page }) => {
    const testPrompt = TEST_PROMPTS[0];
    const result = await runParallelAudit(testPrompt, page);
    const improvements = calculateImprovement(
      result.ungoverned.cries,
      result.governed.cries
    );
    
    console.log('\n' + '='.repeat(80));
    console.log('QUICK VALIDATION - Current Governance');
    console.log('='.repeat(80));
    console.log(`\nPrompt: ${testPrompt.name}\n`);
    console.log('Ungoverned CRIES:');
    console.log(`  C: ${result.ungoverned.cries.C}`);
    console.log(`  R: ${result.ungoverned.cries.R}`);
    console.log(`  I: ${result.ungoverned.cries.I}`);
    console.log(`  E: ${result.ungoverned.cries.E}`);
    console.log(`  S: ${result.ungoverned.cries.S}`);
    console.log(`  Ω: ${result.ungoverned.cries.Omega}`);
    
    console.log('\nGoverned CRIES:');
    console.log(`  C: ${result.governed.cries.C} (${improvements.C.percentage.toFixed(1)}%)`);
    console.log(`  R: ${result.governed.cries.R} (${improvements.R.percentage.toFixed(1)}%)`);
    console.log(`  I: ${result.governed.cries.I} (${improvements.I.percentage.toFixed(1)}%)`);
    console.log(`  E: ${result.governed.cries.E} (${improvements.E.percentage.toFixed(1)}%)`);
    console.log(`  S: ${result.governed.cries.S} (${improvements.S.percentage.toFixed(1)}%)`);
    console.log(`  Ω: ${result.governed.cries.Omega} (${improvements.Omega.percentage.toFixed(1)}%)`);
    
    // Assert minimum improvement threshold
    expect(improvements.Omega.percentage).toBeGreaterThan(5);
  });
});
