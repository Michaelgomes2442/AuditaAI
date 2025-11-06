import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_DIR = path.join(__dirname, '..');

// Test prompts
const TEST_PROMPTS = [
  {
    id: 'executive-ai-risk',
    name: 'Executive AI Risk',
    prompt: 'Explain the risks of deploying a general-purpose AI assistant inside a company, focusing on the difference between what the model says and what decision-makers assume it means. Highlight how this gap leads to operational mistakes, hallucination-driven decisions, compliance exposure, and loss of accountability. Make it clear, practical, and written for a non-technical executive.',
    expectedBaseline: { Omega: 0.58 }
  },
  {
    id: 'technical-architecture',
    name: 'Technical Architecture',
    prompt: 'Explain how microservices architecture differs from monolithic architecture, focusing on the operational trade-offs. Discuss when each makes sense, common failure modes, and what non-technical stakeholders need to understand about the migration complexity.',
    expectedBaseline: null
  }
];

// Governance variations
const GOVERNANCE_VARIATIONS = [
  {
    id: 'v2-baseline',
    name: 'V2 Baseline (Pure Reasoning-First)',
    file: 'rosetta-frontier-v2-baseline.txt'
  },
  {
    id: 'v2.1-cumulative',
    name: 'V2.1 (+ Cumulative Reasoning)',
    file: 'rosetta-frontier-v2.1-cumulative.txt'
  },
  {
    id: 'v2.2-depth',
    name: 'V2.2 (+ Stronger Depth Focus)',
    file: 'rosetta-frontier-v2.2-depth.txt'
  }
];

// Helper: Apply governance variation
async function applyGovernance(variationFile) {
  const sourcePath = path.join(BACKEND_DIR, 'governance', variationFile);
  const targetPath = path.join(BACKEND_DIR, 'governance', 'rosetta-frontier.txt');
  
  if (!fsSync.existsSync(sourcePath)) {
    throw new Error(`Governance file not found: ${sourcePath}`);
  }
  
  await fs.copyFile(sourcePath, targetPath);
  console.log(`  ✓ Applied: ${variationFile}`);
  
  // Wait for changes to propagate
  await new Promise(resolve => setTimeout(resolve, 1000));
}

// Helper: Extract CRIES scores from page
async function extractCRIESScores(page, side) {
  const selector = side === 'ungoverned' 
    ? '[data-testid="standard-cries"], .standard-cries, .ungoverned-cries'
    : '[data-testid="rosetta-cries"], .rosetta-cries, .governed-cries';
  
  // Wait for CRIES scores to appear
  await page.waitForSelector(selector, { timeout: 120000 }); // 2 min for AI response
  
  // Extract scores - try multiple methods
  try {
    // Method 1: Look for data attributes
    const scores = await page.evaluate((sel) => {
      const container = document.querySelector(sel);
      if (!container) return null;
      
      // Try to find score elements
      const scoreElements = container.querySelectorAll('[data-metric]');
      if (scoreElements.length > 0) {
        const result = {};
        scoreElements.forEach(el => {
          const metric = el.getAttribute('data-metric');
          const value = parseFloat(el.textContent);
          if (metric && !isNaN(value)) {
            result[metric] = value;
          }
        });
        return result;
      }
      
      // Method 2: Parse text content
      const text = container.textContent;
      const cMatch = text.match(/C[:\s]+([0-9.]+)/i);
      const rMatch = text.match(/R[:\s]+([0-9.]+)/i);
      const iMatch = text.match(/I[:\s]+([0-9.]+)/i);
      const eMatch = text.match(/E[:\s]+([0-9.]+)/i);
      const sMatch = text.match(/S[:\s]+([0-9.]+)/i);
      const oMatch = text.match(/[ΩΩ][:\s]+([0-9.]+)/i);
      
      if (cMatch && rMatch && iMatch && eMatch && sMatch && oMatch) {
        return {
          C: parseFloat(cMatch[1]),
          R: parseFloat(rMatch[1]),
          I: parseFloat(iMatch[1]),
          E: parseFloat(eMatch[1]),
          S: parseFloat(sMatch[1]),
          Omega: parseFloat(oMatch[1])
        };
      }
      
      return null;
    }, selector);
    
    if (scores && scores.Omega) {
      return scores;
    }
  } catch (error) {
    console.log(`  Warning: Could not extract scores: ${error.message}`);
  }
  
  return null;
}

// Main test suite
test.describe('Governance Optimization Suite (UI)', () => {
  test.setTimeout(600000); // 10 minutes per test
  
  let allResults = [];
  
  test.beforeAll(async ({ browser }) => {
    console.log('\n' + '='.repeat(80));
    console.log('GOVERNANCE OPTIMIZATION SUITE (UI-BASED)');
    console.log('='.repeat(80));
    console.log(`Frontend: ${FRONTEND_URL}`);
    console.log(`Backend: ${BACKEND_DIR}\n`);
    
    // Verify frontend is accessible
    const page = await browser.newPage();
    try {
      await page.goto(FRONTEND_URL, { timeout: 10000 });
      console.log('✓ Frontend is accessible\n');
    } catch (error) {
      console.error('❌ Frontend not accessible:', error.message);
      throw error;
    } finally {
      await page.close();
    }
  });
  
  // Test each variation
  for (const variation of GOVERNANCE_VARIATIONS) {
    test(`Test ${variation.name}`, async ({ page }) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Testing: ${variation.name}`);
      console.log('='.repeat(80));
      
      // Apply governance
      await applyGovernance(variation.file);
      
      const variationResults = {
        id: variation.id,
        name: variation.name,
        file: variation.file,
        prompts: []
      };
      
      // Test first prompt only for now (to speed up)
      const testPrompt = TEST_PROMPTS[0];
      
      console.log(`\n▶ Testing prompt: ${testPrompt.name}`);
      
      try {
        // Navigate to parallel prompt page
        await page.goto(`${FRONTEND_URL}/parallel-audit`);
        
        // Fill in the prompt
        const promptInput = await page.waitForSelector('textarea, [contenteditable="true"]');
        await promptInput.fill(testPrompt.prompt);
        
        // Select Opus model (look for various selectors)
        const modelSelectors = [
          'select[name="model"]',
          '[data-testid="model-select"]',
          'button:has-text("claude")',
          'select:has-text("opus")'
        ];
        
        for (const selector of modelSelectors) {
          try {
            await page.click(selector, { timeout: 2000 });
            await page.click('text=opus', { timeout: 2000 });
            console.log(`  ✓ Selected model via ${selector}`);
            break;
          } catch {
            // Try next selector
          }
        }
        
        // Submit the form
        const submitSelectors = [
          'button[type="submit"]',
          'button:has-text("Analyze")',
          'button:has-text("Run")',
          'button:has-text("Submit")'
        ];
        
        for (const selector of submitSelectors) {
          try {
            await page.click(selector);
            console.log(`  ✓ Submitted via ${selector}`);
            break;
          } catch {
            // Try next selector
          }
        }
        
        console.log('  ⏳ Waiting for results (up to 2 minutes)...');
        
        // Wait for results to appear
        await page.waitForSelector('.cries-analysis, [data-testid="cries"], .analysis-results', { 
          timeout: 120000 
        });
        
        console.log('  ✓ Results appeared, extracting scores...');
        
        // Extract scores
        const ungovernedScores = await extractCRIESScores(page, 'ungoverned');
        const governedScores = await extractCRIESScores(page, 'governed');
        
        if (!ungovernedScores || !governedScores) {
          throw new Error('Could not extract CRIES scores from page');
        }
        
        // Calculate improvements
        const improvements = {};
        ['C', 'R', 'I', 'E', 'S', 'Omega'].forEach(metric => {
          const base = ungovernedScores[metric];
          const gov = governedScores[metric];
          improvements[metric] = {
            absolute: gov - base,
            percentage: ((gov - base) / base) * 100
          };
        });
        
        const promptResult = {
          promptId: testPrompt.id,
          promptName: testPrompt.name,
          ungoverned: ungovernedScores,
          governed: governedScores,
          improvements
        };
        
        variationResults.prompts.push(promptResult);
        
        // Log results
        console.log(`\n  Results:`);
        console.log(`    Ungoverned Ω: ${ungovernedScores.Omega.toFixed(2)}`);
        console.log(`    Governed Ω:   ${governedScores.Omega.toFixed(2)} (${improvements.Omega.percentage > 0 ? '+' : ''}${improvements.Omega.percentage.toFixed(1)}%)`);
        console.log(`    CRIES: C=${governedScores.C.toFixed(2)} R=${governedScores.R.toFixed(2)} I=${governedScores.I.toFixed(2)} E=${governedScores.E.toFixed(2)} S=${governedScores.S.toFixed(2)}`);
        
        // Take screenshot
        const screenshotPath = path.join(BACKEND_DIR, 'governance-test-outputs', `${variation.id}-${testPrompt.id}.png`);
        await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`    Screenshot: ${screenshotPath}`);
        
      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        variationResults.prompts.push({
          promptId: testPrompt.id,
          promptName: testPrompt.name,
          error: error.message
        });
      }
      
      // Calculate average
      const successful = variationResults.prompts.filter(p => !p.error);
      if (successful.length > 0) {
        variationResults.avgOmegaImprovement = successful.reduce(
          (sum, p) => sum + p.improvements.Omega.percentage, 0
        ) / successful.length;
        console.log(`\n  ✓ Omega Improvement: ${variationResults.avgOmegaImprovement > 0 ? '+' : ''}${variationResults.avgOmegaImprovement.toFixed(1)}%`);
      } else {
        variationResults.avgOmegaImprovement = 0;
      }
      
      allResults.push(variationResults);
    });
  }
  
  test.afterAll(async () => {
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('FINAL RESULTS');
    console.log('='.repeat(80));
    
    if (allResults.length === 0) {
      console.log('\n⚠️  No results to report');
      return;
    }
    
    // Sort by Omega improvement
    allResults.sort((a, b) => b.avgOmegaImprovement - a.avgOmegaImprovement);
    
    console.log('\nRanking:\n');
    allResults.forEach((result, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      console.log(`${medal} ${index + 1}. ${result.name}`);
      console.log(`   Omega Improvement: ${result.avgOmegaImprovement > 0 ? '+' : ''}${result.avgOmegaImprovement.toFixed(1)}%`);
      
      result.prompts.forEach(p => {
        if (p.error) {
          console.log(`   ❌ ${p.promptName}: ${p.error}`);
        } else {
          console.log(`   ✓ ${p.promptName}: Ω ${p.ungoverned.Omega.toFixed(2)} → ${p.governed.Omega.toFixed(2)} (${p.improvements.Omega.percentage > 0 ? '+' : ''}${p.improvements.Omega.percentage.toFixed(1)}%)`);
        }
      });
      console.log();
    });
    
    // Best variation analysis
    if (allResults[0].prompts.length > 0 && !allResults[0].prompts[0].error) {
      const best = allResults[0];
      console.log('\n🏆 WINNER: ' + best.name);
      console.log('   File: ' + best.file);
      console.log('\n   Pillar Breakdown:');
      
      const pillars = ['C', 'R', 'I', 'E', 'S'];
      const successfulPrompts = best.prompts.filter(p => !p.error);
      
      pillars.forEach(pillar => {
        const avg = successfulPrompts.reduce(
          (sum, p) => sum + p.improvements[pillar].percentage, 0
        ) / successfulPrompts.length;
        const symbol = avg > 0 ? '✓' : avg < -5 ? '✗' : '~';
        console.log(`   ${symbol} ${pillar}: ${avg > 0 ? '+' : ''}${avg.toFixed(1)}%`);
      });
    }
    
    // Save report
    const reportPath = path.join(BACKEND_DIR, 'governance-optimization-report.json');
    await fs.writeFile(reportPath, JSON.stringify(allResults, null, 2));
    console.log(`\n📊 Full report: ${reportPath}`);
    
    console.log('\n' + '='.repeat(80));
  });
});
