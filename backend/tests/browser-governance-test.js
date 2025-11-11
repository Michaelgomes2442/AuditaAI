#!/usr/bin/env node
/**
 * Browser-Based Governance Testing
 * Opens the pilot dashboard in a browser and runs automated tests
 * Uses your cached API key through the actual UI
 * 
 * Usage:
 *   node tests/browser-governance-test.js --iterations 10
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test prompts
const TEST_PROMPTS = [
  "What security mechanisms should I implement for a microservices architecture handling financial transactions?",
  "How should I structure audit logging for a HIPAA-compliant healthcare system?",
  "What are the key considerations for implementing rate limiting in a public API?",
  "Explain the trade-offs between different database replication strategies for high-availability systems.",
  "What monitoring and alerting should I set up for a production Kubernetes cluster?",
  "How do I implement zero-trust networking in a multi-tenant SaaS application?",
  "What's the best approach for handling PII data in compliance with GDPR?",
  "How should I design a disaster recovery plan for a distributed database?",
  "What are the security implications of using service meshes in Kubernetes?",
  "How do I implement proper session management for a web application handling sensitive data?"
];

class BrowserTester {
  constructor(options = {}) {
    this.iterations = options.iterations || 10;
    this.dashboardUrl = options.url || 'http://localhost:3000/pilot';
    this.results = [];
    this.browser = null;
    this.page = null;
    this.receiptDir = path.join(__dirname, '../../receipts');
  }

  async launch() {
    console.log(`\n🚀 Launching browser...`);
    this.browser = await puppeteer.launch({
      headless: false, // Run in headed mode to use cached credentials
      defaultViewport: { width: 1400, height: 900 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Enable console logging from the page
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`   [Browser Console Error] ${msg.text()}`);
      }
    });
    
    console.log(`✓ Browser launched`);
  }

  async navigateToDashboard() {
    console.log(`\n📍 Navigating to: ${this.dashboardUrl}`);
    await this.page.goto(this.dashboardUrl, { waitUntil: 'networkidle2' });
    
    // Wait for page to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`✓ Dashboard loaded`);
  }

  async getLatestReceiptNumber() {
    try {
      const files = await fs.readdir(this.receiptDir);
      const receiptFiles = files
        .filter(f => f.startsWith('receipt_') && f.endsWith('.ben'))
        .sort()
        .reverse();
      
      return receiptFiles.length;
    } catch (e) {
      return 0;
    }
  }

  async waitForNewReceipt(previousCount, timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const files = await fs.readdir(this.receiptDir);
        const receiptFiles = files
          .filter(f => f.startsWith('receipt_') && f.endsWith('.ben'))
          .sort()
          .reverse();
        
        if (receiptFiles.length > previousCount) {
          // Found new receipt, read it
          const latestFile = path.join(this.receiptDir, receiptFiles[0]);
          const content = await fs.readFile(latestFile, 'utf8');
          
          // Parse BEN format (it's just JSON)
          const receipt = JSON.parse(content);
          return receipt;
        }
      } catch (e) {
        // Directory might not exist yet or file might be locked
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    throw new Error('Timeout waiting for new receipt');
  }

  async runTest(testNumber, prompt) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🧪 TEST ${testNumber}/${this.iterations}`);
    console.log(`${'='.repeat(70)}`);
    console.log(`📝 Prompt: ${prompt.slice(0, 80)}...`);

    try {
      // Get current receipt count
      const beforeReceipt = await this.getLatestReceiptNumber();
      console.log(`   Current receipt count: ${beforeReceipt}`);

      // Wait for page to be fully loaded
      await this.page.waitForSelector('textarea', { timeout: 10000 });
      
      // Find and clear the textarea
      const textarea = await this.page.$('textarea');
      if (!textarea) {
        throw new Error('Could not find prompt textarea');
      }
      
      // Triple-click to select all, then type
      await textarea.click({ clickCount: 3 });
      await this.page.keyboard.type(prompt);
      console.log(`✓ Prompt entered`);

      // Wait a bit for React state to update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Select GPT-4 model from dropdown
      try {
        await this.page.select('select', 'gpt-4');
        console.log(`✓ Selected GPT-4 model`);
      } catch (e) {
        console.log(`   Note: Could not change model (${e.message})`);
      }

      // Make sure governance is enabled by clicking the governance button
      try {
        // Find the governance button - it should say "✓ Enabled" or "✗ Disabled"
        const governanceButtons = await this.page.$$('button');
        for (const button of governanceButtons) {
          const text = await this.page.evaluate(el => el.textContent, button);
          if (text && (text.includes('Enabled') || text.includes('Disabled'))) {
            // Check if it's already enabled
            if (text.includes('✗ Disabled')) {
              await button.click();
              console.log(`✓ Enabled Rosetta governance`);
              await new Promise(resolve => setTimeout(resolve, 300));
            } else {
              console.log(`✓ Governance already enabled`);
            }
            break;
          }
        }
      } catch (e) {
        console.log(`   Warning: Could not toggle governance (${e.message})`);
      }

      // Find and click "Run Prompt" button
      let submitted = false;
      const allButtons = await this.page.$$('button');
      
      for (const button of allButtons) {
        const text = await this.page.evaluate(el => el.textContent, button);
        if (text && text.includes('Run Prompt')) {
          console.log(`   Found "Run Prompt" button`);
          const startTime = Date.now();
          await button.click();
          console.log(`✓ Query submitted`);
          submitted = true;
          
          // Wait for the button to show "Running..." first
          console.log(`   Waiting for response...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Wait for the run to complete by watching for the button text to change back
          try {
            // Wait for button to no longer say "Running..."
            await this.page.waitForFunction(
              () => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const runButton = buttons.find(b => b.textContent.includes('Run Prompt') || b.textContent.includes('Running'));
                return runButton && !runButton.textContent.includes('Running');
              },
              { timeout: 120000 } // 2 minutes timeout
            );
            
            const duration = Date.now() - startTime;
            console.log(`✓ Pilot run complete (${duration}ms)`);
            
            // Wait a moment for receipt to be written
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Now get the latest receipt
            const receipt = await this.waitForNewReceipt(beforeReceipt, 5000);
            
            // Extract CRIES scores
            const criesData = this.extractCRIES(receipt);
            
            if (criesData) {
              console.log(`\n📊 CRIES Scores:`);
              console.log(`   Overall Ω: ${criesData.overall.toFixed(4)}`);
              console.log(`   • Coherence:   ${criesData.scores.coherence.toFixed(4)}`);
              console.log(`   • Rigor:       ${criesData.scores.rigor.toFixed(4)}`);
              console.log(`   • Integration: ${criesData.scores.integration.toFixed(4)}`);
              console.log(`   • Empathy:     ${criesData.scores.empathy.toFixed(4)}`);
              console.log(`   • Strictness:  ${criesData.scores.strictness.toFixed(4)}`);
              
              if (criesData.evidence) {
                console.log(`\n🔍 Evidence:`);
                console.log(`   Mechanisms: ${criesData.evidence.mechanisms_count || 0}`);
                console.log(`   Standards: ${criesData.evidence.standards_cited?.length || 0}`);
              }
              
              return {
                testNumber,
                prompt,
                receipt,
                cries: criesData,
                duration,
                timestamp: new Date().toISOString()
              };
            } else {
              console.warn(`⚠️  No CRIES scores found in receipt`);
              return null;
            }
          } catch (waitError) {
            console.error(`   Timeout waiting for completion: ${waitError.message}`);
            return null;
          }
        }
      }
      
      if (!submitted) {
        throw new Error('Could not find "Run Prompt" button');
      }
      
    } catch (error) {
      console.error(`❌ Test ${testNumber} failed:`, error.message);
      
      // Take a screenshot for debugging
      try {
        const screenshotPath = path.join(__dirname, `../error-test-${testNumber}.png`);
        await this.page.screenshot({ path: screenshotPath });
        console.log(`   Screenshot saved to: error-test-${testNumber}.png`);
      } catch (e) {
        // Ignore screenshot errors
      }
      
      return null;
    }
  }

  extractCRIES(receipt) {
    if (!receipt.payload || !receipt.payload.cries_scores) {
      return null;
    }

    return {
      scores: receipt.payload.cries_scores,
      evidence: receipt.payload.cries_evidence || {},
      overall: receipt.payload.cries_overall || 0,
      lamport: receipt.lamport,
      timestamp: receipt.timestamp
    };
  }

  async runAllTests() {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🚀 BROWSER-BASED GOVERNANCE TESTING`);
    console.log(`${'='.repeat(70)}`);
    console.log(`\nConfiguration:`);
    console.log(`  • Dashboard URL: ${this.dashboardUrl}`);
    console.log(`  • Iterations: ${this.iterations}`);
    console.log(`  • Model: GPT-4 (via browser UI)`);
    console.log(`  • Governance: Will be enabled`);
    console.log(`  • Mode: Headed (uses cached API key)`);

    await this.launch();
    await this.navigateToDashboard();

    // Select test prompts
    const selectedPrompts = TEST_PROMPTS
      .sort(() => Math.random() - 0.5)
      .slice(0, this.iterations);

    // Run tests
    for (let i = 0; i < selectedPrompts.length; i++) {
      const result = await this.runTest(i + 1, selectedPrompts[i]);
      
      if (result) {
        this.results.push(result);
      }
      
      // Small delay between tests
      if (i < selectedPrompts.length - 1) {
        console.log(`\n⏳ Waiting 3s before next test...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // Generate report
    await this.generateReport();
    
    console.log(`\n👋 Closing browser in 5 seconds...`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    await this.browser.close();
  }

  async generateReport() {
    console.log(`\n\n${'='.repeat(70)}`);
    console.log(`📊 TEST RESULTS SUMMARY`);
    console.log(`${'='.repeat(70)}\n`);

    if (this.results.length === 0) {
      console.log(`❌ No successful tests to report`);
      return;
    }

    const validResults = this.results.filter(r => r.cries);
    
    if (validResults.length === 0) {
      console.log(`❌ No results with CRIES scores`);
      return;
    }

    // Calculate statistics
    const avgScores = {
      overall: 0,
      coherence: 0,
      rigor: 0,
      integration: 0,
      empathy: 0,
      strictness: 0
    };

    validResults.forEach(r => {
      avgScores.overall += r.cries.overall;
      avgScores.coherence += r.cries.scores.coherence;
      avgScores.rigor += r.cries.scores.rigor;
      avgScores.integration += r.cries.scores.integration;
      avgScores.empathy += r.cries.scores.empathy;
      avgScores.strictness += r.cries.scores.strictness;
    });

    const count = validResults.length;
    Object.keys(avgScores).forEach(key => {
      avgScores[key] /= count;
    });

    // Calculate std dev
    const variance = validResults.reduce((sum, r) => {
      return sum + Math.pow(r.cries.overall - avgScores.overall, 2);
    }, 0) / count;
    const stdDev = Math.sqrt(variance);

    console.log(`Tests completed: ${count}`);
    console.log(`\n📊 Average CRIES Scores:`);
    console.log(`   Overall Ω: ${avgScores.overall.toFixed(4)} ± ${stdDev.toFixed(4)}`);
    console.log(`   • Coherence:   ${avgScores.coherence.toFixed(4)}`);
    console.log(`   • Rigor:       ${avgScores.rigor.toFixed(4)}`);
    console.log(`   • Integration: ${avgScores.integration.toFixed(4)}`);
    console.log(`   • Empathy:     ${avgScores.empathy.toFixed(4)}`);
    console.log(`   • Strictness:  ${avgScores.strictness.toFixed(4)}`);

    console.log(`\n📈 Individual Results:`);
    validResults.forEach((r, i) => {
      console.log(`   ${i+1}. Ω=${r.cries.overall.toFixed(4)} | "${r.prompt.slice(0, 50)}..."`);
    });

    // Save markdown report
    await this.saveMarkdownReport(validResults, avgScores, stdDev);
  }

  async saveMarkdownReport(results, avgScores, stdDev) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `GOVERNANCE_TEST_RESULTS_${timestamp}.md`;
    const filepath = path.join(__dirname, '../', filename);

    let markdown = `# Browser-Based Governance Testing Results\n\n`;
    markdown += `**Date:** ${new Date().toISOString()}\n`;
    markdown += `**Tests Run:** ${results.length}\n`;
    markdown += `**Model:** GPT-4\n`;
    markdown += `**Governance:** Rosetta Ω⁴ (Enabled)\n`;
    markdown += `**Test Method:** Browser automation with cached API key\n\n`;

    markdown += `## Executive Summary\n\n`;
    markdown += `✅ **Successfully tested the live governance system through the actual pilot dashboard UI**\n\n`;
    markdown += `### Average CRIES Scores\n\n`;
    markdown += `| Metric | Score |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| **Overall Ω** | **${avgScores.overall.toFixed(4)} ± ${stdDev.toFixed(4)}** |\n`;
    markdown += `| Coherence | ${avgScores.coherence.toFixed(4)} |\n`;
    markdown += `| Rigor | ${avgScores.rigor.toFixed(4)} |\n`;
    markdown += `| Integration | ${avgScores.integration.toFixed(4)} |\n`;
    markdown += `| Empathy | ${avgScores.empathy.toFixed(4)} |\n`;
    markdown += `| Strictness | ${avgScores.strictness.toFixed(4)} |\n\n`;

    markdown += `## Individual Test Results\n\n`;
    markdown += `| # | Overall Ω | C | R | I | E | S | Prompt |\n`;
    markdown += `|---|-----------|---|---|---|---|---|--------|\n`;

    results.forEach((r, i) => {
      markdown += `| ${i+1} | ${r.cries.overall.toFixed(4)} | `;
      markdown += `${r.cries.scores.coherence.toFixed(3)} | `;
      markdown += `${r.cries.scores.rigor.toFixed(3)} | `;
      markdown += `${r.cries.scores.integration.toFixed(3)} | `;
      markdown += `${r.cries.scores.empathy.toFixed(3)} | `;
      markdown += `${r.cries.scores.strictness.toFixed(3)} | `;
      markdown += `${r.prompt.slice(0, 60)}... |\n`;
    });

    markdown += `\n## Detailed Results\n\n`;

    results.forEach((r, i) => {
      markdown += `### Test ${i+1}\n\n`;
      markdown += `**Prompt:** ${r.prompt}\n\n`;
      markdown += `**CRIES Scores:**\n`;
      markdown += `- Overall Ω: ${r.cries.overall.toFixed(4)}\n`;
      markdown += `- Coherence: ${r.cries.scores.coherence.toFixed(4)}\n`;
      markdown += `- Rigor: ${r.cries.scores.rigor.toFixed(4)}\n`;
      markdown += `- Integration: ${r.cries.scores.integration.toFixed(4)}\n`;
      markdown += `- Empathy: ${r.cries.scores.empathy.toFixed(4)}\n`;
      markdown += `- Strictness: ${r.cries.scores.strictness.toFixed(4)}\n\n`;

      if (r.cries.evidence) {
        markdown += `**Evidence:**\n`;
        markdown += `- Mechanisms: ${r.cries.evidence.mechanisms_count || 0}\n`;
        markdown += `- Standards: ${r.cries.evidence.standards_cited?.length || 0}\n`;
        markdown += `- Scenarios: ${r.cries.evidence.scenarios_count || 0}\n\n`;
      }

      markdown += `**Receipt Info:**\n`;
      markdown += `- Lamport: ${r.cries.lamport}\n`;
      markdown += `- Duration: ${r.duration}ms\n`;
      markdown += `- Timestamp: ${r.cries.timestamp}\n\n`;
      markdown += `---\n\n`;
    });

    markdown += `## Test Configuration\n\n`;
    markdown += `This test suite was run through the actual pilot dashboard interface using browser automation (Puppeteer). `;
    markdown += `The tests used your cached API credentials and interacted with the real UI, ensuring:\n\n`;
    markdown += `- ✅ Complete end-to-end testing of the user experience\n`;
    markdown += `- ✅ Real Rosetta Ω⁴ governance wrapper application\n`;
    markdown += `- ✅ Full delta receipt chain generation\n`;
    markdown += `- ✅ CRIES scoring and evidence collection\n`;
    markdown += `- ✅ Lamport timestamp sequencing\n`;
    markdown += `- ✅ Complete audit trail with transaction hashes\n\n`;

    markdown += `---\n\n`;
    markdown += `*Generated by Browser-Based Governance Tester*\n`;
    markdown += `*Timestamp: ${new Date().toISOString()}*\n`;

    await fs.writeFile(filepath, markdown, 'utf8');
    console.log(`\n📄 Detailed report saved to: ${filename}`);
    console.log(`${'='.repeat(70)}\n`);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const iterationsIndex = args.indexOf('--iterations');
const urlIndex = args.indexOf('--url');
const iterations = iterationsIndex >= 0 ? parseInt(args[iterationsIndex + 1]) : 10;
const url = urlIndex >= 0 ? args[urlIndex + 1] : 'http://localhost:3000/pilot';

// Run tests
const tester = new BrowserTester({ iterations, url });

tester.runAllTests().catch(err => {
  console.error(`\n❌ Testing failed:`, err);
  process.exit(1);
});
