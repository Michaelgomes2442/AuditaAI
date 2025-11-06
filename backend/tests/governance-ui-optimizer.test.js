import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const PILOT_PAGE = `${FRONTEND_URL}/pilot`;

// Global results array
let allResults = [];

// Test prompts - diverse scenarios
const TEST_PROMPTS = [
  {
    id: 'executive-ai-risk',
    name: 'Executive AI Risk Explanation',
    prompt: 'Explain the risks of deploying a general-purpose AI assistant inside a company, focusing on the difference between what the model says and what decision-makers assume it means. Highlight how this gap leads to operational mistakes, hallucination-driven decisions, compliance exposure, and loss of accountability. Make it clear, practical, and written for a non-technical executive.',
    expectedBaseline: { Omega: 0.58 }
  },
  {
    id: 'technical-architecture',
    name: 'Technical Architecture Explanation',
    prompt: 'Explain how microservices architecture differs from monolithic architecture, focusing on the operational trade-offs. Discuss when each makes sense, common failure modes, and what non-technical stakeholders need to understand about the migration complexity.',
    expectedBaseline: null
  },
  {
    id: 'strategic-analysis',
    name: 'Strategic Business Analysis',
    prompt: 'Analyze why established companies struggle to respond to disruptive innovation, using specific mechanisms from Clayton Christensen\'s research. Explain how organizational structure, incentive systems, and resource allocation create systematic blindness to emerging threats.',
    expectedBaseline: null
  }
];

// Governance variations to test
const GOVERNANCE_VARIATIONS = {
  'v2-baseline': {
    description: 'V2 Baseline - Pure reasoning-first (proven +8.9% Omega)',
    file: 'rosetta-frontier-v2-baseline.txt'
  },
  'v2.1-cumulative': {
    description: 'V2.1 - Add cumulative reasoning principle',
    file: 'rosetta-frontier-v2.1-cumulative.txt'
  },
  'v2.2-depth': {
    description: 'V2.2 - Stronger depth emphasis (2-3 points deeply)',
    file: 'rosetta-frontier-v2.2-depth.txt'
  }
};

// Helper: Apply governance variation
async function applyGovernanceVariation(variationFile) {
  const sourcePath = path.join(__dirname, '../governance', variationFile);
  const targetPath = path.join(__dirname, '../governance/rosetta-frontier.txt');
  
  if (!fsSync.existsSync(sourcePath)) {
    throw new Error(`Governance file not found: ${sourcePath}`);
  }
  
  await fs.copyFile(sourcePath, targetPath);
  console.log(`✓ Applied governance: ${variationFile}`);
  
  // Wait for file system and any hot-reload to settle
  await new Promise(resolve => setTimeout(resolve, 2000));
}

// Helper: Extract CRIES scores from page
async function extractCRIESScores(page, resultPrefix) {
  // Wait for CRIES results to appear
  await page.waitForSelector(`text=${resultPrefix}`, { timeout: 180000 });
  
  // Extract scores - look for patterns like "C 0.56" or "Ω 0.58"
  const pageText = await page.textContent('body');
  
  const scores = {};
  const metrics = ['C', 'R', 'I', 'E', 'S', 'Ω'];
  
  for (const metric of metrics) {
    // Look for pattern like "C 0.56" or "C: 0.56"
    const regex = new RegExp(`${metric}[:\\s]+([0-9]\\.\\d{2})`, 'i');
    const match = pageText.match(regex);
    if (match) {
      scores[metric === 'Ω' ? 'Omega' : metric] = parseFloat(match[1]);
    }
  }
  
  return scores;
}

// Helper: Run parallel audit through UI
async function runParallelAuditUI(promptObj, page) {
  console.log(`  Running UI audit for: ${promptObj.name}`);
  
  // Navigate to pilot page
  await page.goto(PILOT_PAGE);
  await page.waitForLoadState('networkidle');
  
  // Wait for page to be ready
  await page.waitForSelector('textarea, input[type="text"]', { timeout: 10000 });
  
  // Find and fill the prompt textarea
  const promptInput = page.locator('textarea').first();
  await promptInput.clear();
  await promptInput.fill(promptObj.prompt);
  
  console.log(`    ✓ Entered prompt`);
  
  // Select Opus model (look for dropdown or model selector)
  // Try to find model selection - could be dropdown, radio buttons, or select
  try {
    const modelSelector = page.locator('select, [role="combobox"]').first();
    await modelSelector.click();
    await page.locator('text=/.*opus.*/i').first().click();
    console.log(`    ✓ Selected Opus model`);
  } catch (error) {
    console.log(`    ⚠️  Could not find model selector (may be default)`);
  }
  
  // Find and click "Run Audit" or similar button
  const runButton = page.locator('button:has-text("Run"), button:has-text("Audit"), button:has-text("Analyze")').first();
  await runButton.click();
  
  console.log(`    ✓ Started audit (waiting for results...)`);
  
  // Wait for results - look for CRIES scores to appear
  try {
    // Wait for both ungoverned and governed results
    await page.waitForSelector('text=/ungoverned|standard|without rosetta/i', { timeout: 180000 });
    await page.waitForSelector('text=/governed|rosetta|with rosetta/i', { timeout: 180000 });
    
    console.log(`    ✓ Results loaded`);
    
    // Extract CRIES scores
    const pageContent = await page.content();
    
    // Parse ungoverned scores
    const ungovernedSection = pageContent.match(/(?:ungoverned|standard|without rosetta)[\s\S]{0,500}?Ω[:\s]+([0-9]\.\d{2})/i);
    const governedSection = pageContent.match(/(?:governed|rosetta|with rosetta)[\s\S]{0,500}?Ω[:\s]+([0-9]\.\d{2})/i);
    
    if (!ungovernedSection || !governedSection) {
      throw new Error('Could not find CRIES scores in page content');
    }
    
    // Extract all scores from each section
    const extractScoresFromText = (text) => {
      const scores = {};
      const patterns = {
        C: /\bC[:\s]+([0-9]\.\d{2})/i,
        R: /\bR[:\s]+([0-9]\.\d{2})/i,
        I: /\bI[:\s]+([0-9]\.\d{2})/i,
        E: /\bE[:\s]+([0-9]\.\d{2})/i,
        S: /\bS[:\s]+([0-9]\.\d{2})/i,
        Omega: /Ω[:\s]+([0-9]\.\d{2})/i
      };
      
      for (const [key, pattern] of Object.entries(patterns)) {
        const match = text.match(pattern);
        if (match) {
          scores[key] = parseFloat(match[1]);
        }
      }
      
      return scores;
    };
    
    const ungoverned = extractScoresFromText(pageContent);
    const governed = extractScoresFromText(pageContent.split(/governed|rosetta|with rosetta/i)[1] || '');
    
    console.log(`    Ungoverned Ω: ${ungoverned.Omega || 'N/A'}`);
    console.log(`    Governed Ω: ${governed.Omega || 'N/A'}`);
    
    return { ungoverned, governed };
    
  } catch (error) {
    console.error(`    ❌ Error extracting results: ${error.message}`);
    
    // Take screenshot for debugging
    const screenshotPath = path.join(__dirname, `../test-failure-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`    Screenshot saved: ${screenshotPath}`);
    
    throw error;
  }
}

// Helper: Calculate improvement metrics
function calculateImprovement(ungoverned, governed) {
  const metrics = ['C', 'R', 'I', 'E', 'S', 'Omega'];
  const improvements = {};
  
  metrics.forEach(metric => {
    const base = ungoverned[metric] || 0;
    const gov = governed[metric] || 0;
    improvements[metric] = {
      absolute: gov - base,
      percentage: base > 0 ? ((gov - base) / base) * 100 : 0
    };
  });
  
  return improvements;
}

// Main test suite
test.describe('Governance Optimization Suite (UI)', () => {
  test.setTimeout(900000); // 15 minutes per test (UI is slower)
  
  test.beforeAll(async ({ browser }) => {
    console.log('\n' + '='.repeat(80));
    console.log('GOVERNANCE OPTIMIZATION SUITE (UI-BASED)');
    console.log('='.repeat(80));
    console.log(`Frontend: ${FRONTEND_URL}`);
    console.log(`Pilot Page: ${PILOT_PAGE}`);
    
    // Check if frontend is accessible
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      await page.goto(PILOT_PAGE, { timeout: 10000 });
      console.log('✓ Frontend is accessible\n');
    } catch (error) {
      console.error('❌ Frontend not accessible:', error.message);
      throw error;
    } finally {
      await context.close();
    }
  });
  
  // Test each governance variation
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
      
      // Test with first prompt only (to save time)
      const testPrompt = TEST_PROMPTS[0];
      
      console.log(`\n▶ Testing prompt: ${testPrompt.name}`);
      
      try {
        const result = await runParallelAuditUI(testPrompt, page);
        const improvements = calculateImprovement(result.ungoverned, result.governed);
        
        const promptResult = {
          promptId: testPrompt.id,
          promptName: testPrompt.name,
          ungoverned: result.ungoverned,
          governed: result.governed,
          improvements: improvements,
          omegaImprovement: improvements.Omega.percentage
        };
        
        variationResults.prompts.push(promptResult);
        
        // Log results
        console.log(`  Ungoverned Ω: ${result.ungoverned.Omega?.toFixed(2) || 'N/A'}`);
        console.log(`  Governed Ω:   ${result.governed.Omega?.toFixed(2) || 'N/A'} (${improvements.Omega.percentage > 0 ? '+' : ''}${improvements.Omega.percentage.toFixed(1)}%)`);
        
        if (result.governed.C) {
          console.log(`  CRIES: C=${result.governed.C.toFixed(2)} R=${result.governed.R.toFixed(2)} I=${result.governed.I.toFixed(2)} E=${result.governed.E.toFixed(2)} S=${result.governed.S.toFixed(2)}`);
        }
        
      } catch (error) {
        console.error(`  ❌ Error testing prompt: ${error.message}`);
        variationResults.prompts.push({
          promptId: testPrompt.id,
          promptName: testPrompt.name,
          error: error.message
        });
      }
      
      // Calculate stats
      const successfulPrompts = variationResults.prompts.filter(p => !p.error);
      if (successfulPrompts.length > 0) {
        const avgOmegaImprovement = successfulPrompts.reduce(
          (sum, p) => sum + p.omegaImprovement, 0
        ) / successfulPrompts.length;
        
        variationResults.avgOmegaImprovement = avgOmegaImprovement;
        variationResults.successRate = `${successfulPrompts.length}/${variationResults.prompts.length}`;
        
        console.log(`\n✓ Omega Improvement: ${avgOmegaImprovement > 0 ? '+' : ''}${avgOmegaImprovement.toFixed(1)}%`);
      } else {
        variationResults.avgOmegaImprovement = 0;
        variationResults.successRate = '0/' + variationResults.prompts.length;
        console.log(`\n❌ Test failed for this variation`);
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
    
    console.log('\nRanking (by Omega improvement):\n');
    allResults.forEach((result, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      console.log(`${medal} ${index + 1}. ${result.description}`);
      console.log(`   File: ${result.file}`);
      console.log(`   Omega Improvement: ${result.avgOmegaImprovement > 0 ? '+' : ''}${result.avgOmegaImprovement.toFixed(1)}%`);
      console.log(`   Success Rate: ${result.successRate}`);
      
      result.prompts.forEach(p => {
        if (p.error) {
          console.log(`     ❌ ${p.promptName}: ${p.error}`);
        } else {
          console.log(`     ${p.omegaImprovement > 0 ? '✓' : '✗'} ${p.promptName}: ${p.omegaImprovement > 0 ? '+' : ''}${p.omegaImprovement.toFixed(1)}%`);
        }
      });
      console.log();
    });
    
    // Detailed analysis of winner
    const bestVariation = allResults[0];
    console.log('\nDETAILED PILLAR ANALYSIS (Best Variation)\n');
    console.log(`Winner: ${bestVariation.description}\n`);
    
    const successfulPrompts = bestVariation.prompts.filter(p => !p.error);
    if (successfulPrompts.length > 0) {
      const pillars = ['C', 'R', 'I', 'E', 'S'];
      pillars.forEach(pillar => {
        const avgImprovement = successfulPrompts.reduce(
          (sum, p) => sum + p.improvements[pillar].percentage, 0
        ) / successfulPrompts.length;
        const symbol = avgImprovement > 0 ? '✓' : avgImprovement < -5 ? '✗' : '~';
        console.log(`${symbol} ${pillar}: ${avgImprovement > 0 ? '+' : ''}${avgImprovement.toFixed(1)}%`);
      });
    }
    
    // Save results
    const reportPath = path.join(__dirname, '../governance-optimization-report.json');
    await fs.writeFile(reportPath, JSON.stringify(allResults, null, 2));
    console.log(`\nFull report saved to: ${reportPath}`);
    
    // Recommendation
    console.log('\n' + '='.repeat(80));
    console.log('RECOMMENDATION');
    console.log('='.repeat(80));
    
    if (bestVariation.avgOmegaImprovement > 8) {
      console.log(`✅ Deploy: ${bestVariation.file}`);
      console.log(`   Expected Omega improvement: +${bestVariation.avgOmegaImprovement.toFixed(1)}%`);
    } else if (bestVariation.avgOmegaImprovement > 5) {
      console.log(`⚠️  Marginal improvement: ${bestVariation.file}`);
      console.log(`   Omega improvement: +${bestVariation.avgOmegaImprovement.toFixed(1)}% (target: >8%)`);
    } else {
      console.log('❌ No variation achieved target improvement');
      console.log('   Consider new governance approaches');
    }
    
    console.log('\n' + '='.repeat(80));
  });
});
