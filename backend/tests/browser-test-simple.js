#!/usr/bin/env node
/**
 * Simple Browser-Based Governance Testing
 * Captures API responses directly from the network to get CRIES scores
 * 
 * Usage:
 *   node tests/browser-test-simple.js --iterations 10
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

class SimpleBrowserTester {
  constructor(options = {}) {
    this.iterations = options.iterations || 10;
    this.dashboardUrl = options.url || 'http://localhost:3000/pilot';
    this.results = [];
    this.browser = null;
    this.page = null;
    this.capturedResponse = null;
  }

  async launch() {
    console.log(`\n🚀 Launching browser...`);
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1400, height: 900 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Intercept network responses
    await this.page.setRequestInterception(true);
    
    this.page.on('request', request => {
      request.continue();
    });
    
    this.page.on('response', async response => {
      const url = response.url();
      
      // Capture responses from the pilot API
      if (url.includes('/api/pilot/run-prompt')) {
        try {
          const data = await response.json();
          this.capturedResponse = data;
          console.log(`   📡 Captured API response with CRIES data`);
        } catch (e) {
          // Not JSON or failed to parse
        }
      }
    });
    
    console.log(`✓ Browser launched`);
  }

  async navigateToDashboard() {
    console.log(`\n📍 Navigating to: ${this.dashboardUrl}`);
    await this.page.goto(this.dashboardUrl, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`✓ Dashboard loaded`);
  }

  async runTest(testNumber, prompt) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🧪 TEST ${testNumber}/${this.iterations}`);
    console.log(`${'='.repeat(70)}`);
    console.log(`📝 Prompt: ${prompt.slice(0, 80)}...`);

    this.capturedResponse = null;

    try {
      // Wait for textarea
      await this.page.waitForSelector('textarea', { timeout: 10000 });
      
      // Enter prompt
      const textarea = await this.page.$('textarea');
      await textarea.click({ clickCount: 3 });
      await this.page.keyboard.type(prompt);
      console.log(`✓ Prompt entered`);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Select GPT-4
      try {
        await this.page.select('select', 'gpt-4');
        console.log(`✓ Selected GPT-4 model`);
      } catch (e) {
        console.log(`   Note: Model already selected`);
      }

      // Ensure governance is enabled
      const buttons = await this.page.$$('button');
      for (const button of buttons) {
        const text = await this.page.evaluate(el => el.textContent, button);
        if (text && text.includes('✗ Disabled')) {
          await button.click();
          console.log(`✓ Enabled governance`);
          await new Promise(resolve => setTimeout(resolve, 300));
          break;
        } else if (text && text.includes('✓ Enabled')) {
          console.log(`✓ Governance already enabled`);
          break;
        }
      }

      // Find and click Run Prompt
      const allButtons = await this.page.$$('button');
      let clicked = false;
      
      for (const button of allButtons) {
        const text = await this.page.evaluate(el => el.textContent, button);
        if (text && text.includes('Run Prompt')) {
          console.log(`   Clicking "Run Prompt"...`);
          const startTime = Date.now();
          await button.click();
          console.log(`✓ Query submitted`);
          clicked = true;
          
          // Wait for the button to change to "Running..."
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Wait for completion
          console.log(`   Waiting for completion...`);
          await this.page.waitForFunction(
            () => {
              const buttons = Array.from(document.querySelectorAll('button'));
              const runButton = buttons.find(b => b.textContent.includes('Run Prompt') || b.textContent.includes('Running'));
              return runButton && !runButton.textContent.includes('Running');
            },
            { timeout: 120000 }
          );
          
          const duration = Date.now() - startTime;
          console.log(`✓ Run complete (${duration}ms)`);
          
          // Wait for API response to be captured
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (this.capturedResponse && this.capturedResponse.cries) {
            const cries = this.capturedResponse.cries;
            
            console.log(`\n📊 CRIES Scores:`);
            console.log(`   Overall Ω: ${cries.Omega.toFixed(4)}`);
            console.log(`   • Coherence:   ${cries.C.toFixed(4)}`);
            console.log(`   • Rigor:       ${cries.R.toFixed(4)}`);
            console.log(`   • Integration: ${cries.I.toFixed(4)}`);
            console.log(`   • Empathy:     ${cries.E.toFixed(4)}`);
            console.log(`   • Strictness:  ${cries.S.toFixed(4)}`);
            
            return {
              testNumber,
              prompt,
              response: this.capturedResponse.response,
              cries: {
                overall: cries.Omega,
                coherence: cries.C,
                rigor: cries.R,
                integration: cries.I,
                empathy: cries.E,
                strictness: cries.S
              },
              duration,
              timestamp: new Date().toISOString()
            };
          } else {
            console.warn(`⚠️  No CRIES data captured from API response`);
            return null;
          }
        }
      }
      
      if (!clicked) {
        throw new Error('Could not find "Run Prompt" button');
      }
      
    } catch (error) {
      console.error(`❌ Test ${testNumber} failed:`, error.message);
      
      // Screenshot for debugging
      try {
        const screenshotPath = path.join(__dirname, `../error-test-${testNumber}.png`);
        await this.page.screenshot({ path: screenshotPath });
        console.log(`   Screenshot saved: error-test-${testNumber}.png`);
      } catch (e) {
        // Ignore
      }
      
      return null;
    }
  }

  async runAllTests() {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🚀 BROWSER-BASED GOVERNANCE TESTING (Network Capture)`);
    console.log(`${'='.repeat(70)}`);
    console.log(`\nConfiguration:`);
    console.log(`  • Dashboard: ${this.dashboardUrl}`);
    console.log(`  • Iterations: ${this.iterations}`);
    console.log(`  • Model: GPT-4`);
    console.log(`  • Governance: Enabled`);
    console.log(`  • Method: Network API capture\n`);

    await this.launch();
    await this.navigateToDashboard();

    // Select prompts
    const selectedPrompts = TEST_PROMPTS
      .sort(() => Math.random() - 0.5)
      .slice(0, this.iterations);

    // Run tests
    for (let i = 0; i < selectedPrompts.length; i++) {
      const result = await this.runTest(i + 1, selectedPrompts[i]);
      
      if (result) {
        this.results.push(result);
      }
      
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

    // Calculate statistics
    const avgScores = {
      overall: 0,
      coherence: 0,
      rigor: 0,
      integration: 0,
      empathy: 0,
      strictness: 0
    };

    this.results.forEach(r => {
      avgScores.overall += r.cries.overall;
      avgScores.coherence += r.cries.coherence;
      avgScores.rigor += r.cries.rigor;
      avgScores.integration += r.cries.integration;
      avgScores.empathy += r.cries.empathy;
      avgScores.strictness += r.cries.strictness;
    });

    const count = this.results.length;
    Object.keys(avgScores).forEach(key => {
      avgScores[key] /= count;
    });

    // Calculate std dev
    const variance = this.results.reduce((sum, r) => {
      return sum + Math.pow(r.cries.overall - avgScores.overall, 2);
    }, 0) / count;
    const stdDev = Math.sqrt(variance);

    console.log(`✅ Tests completed: ${count}`);
    console.log(`\n📊 Average CRIES Scores:`);
    console.log(`   Overall Ω: ${avgScores.overall.toFixed(4)} ± ${stdDev.toFixed(4)}`);
    console.log(`   • Coherence:   ${avgScores.coherence.toFixed(4)}`);
    console.log(`   • Rigor:       ${avgScores.rigor.toFixed(4)}`);
    console.log(`   • Integration: ${avgScores.integration.toFixed(4)}`);
    console.log(`   • Empathy:     ${avgScores.empathy.toFixed(4)}`);
    console.log(`   • Strictness:  ${avgScores.strictness.toFixed(4)}`);

    console.log(`\n📈 Individual Results:`);
    this.results.forEach((r, i) => {
      console.log(`   ${i+1}. Ω=${r.cries.overall.toFixed(4)} | "${r.prompt.slice(0, 50)}..."`);
    });

    // Save markdown report
    await this.saveMarkdownReport(this.results, avgScores, stdDev);
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
    markdown += `**Method:** Network API capture from pilot dashboard\n\n`;

    markdown += `## Executive Summary\n\n`;
    markdown += `✅ **Successfully tested live governance through pilot dashboard**\n\n`;
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
      markdown += `${r.cries.coherence.toFixed(3)} | `;
      markdown += `${r.cries.rigor.toFixed(3)} | `;
      markdown += `${r.cries.integration.toFixed(3)} | `;
      markdown += `${r.cries.empathy.toFixed(3)} | `;
      markdown += `${r.cries.strictness.toFixed(3)} | `;
      markdown += `${r.prompt.slice(0, 60)}... |\n`;
    });

    markdown += `\n## Detailed Results\n\n`;

    results.forEach((r, i) => {
      markdown += `### Test ${i+1}\n\n`;
      markdown += `**Prompt:** ${r.prompt}\n\n`;
      markdown += `**CRIES Scores:**\n`;
      markdown += `- Overall Ω: ${r.cries.overall.toFixed(4)}\n`;
      markdown += `- Coherence: ${r.cries.coherence.toFixed(4)}\n`;
      markdown += `- Rigor: ${r.cries.rigor.toFixed(4)}\n`;
      markdown += `- Integration: ${r.cries.integration.toFixed(4)}\n`;
      markdown += `- Empathy: ${r.cries.empathy.toFixed(4)}\n`;
      markdown += `- Strictness: ${r.cries.strictness.toFixed(4)}\n\n`;
      markdown += `**Duration:** ${r.duration}ms\n\n`;
      markdown += `**Response Preview:**\n\`\`\`\n${r.response.slice(0, 300)}...\n\`\`\`\n\n`;
      markdown += `---\n\n`;
    });

    markdown += `## Conclusion\n\n`;
    markdown += `This test captured CRIES metrics directly from the \`/api/pilot/run-prompt\` API responses `;
    markdown += `via network monitoring in the browser. All tests used the live pilot dashboard with `;
    markdown += `Rosetta Ω⁴ governance enabled.\n\n`;
    markdown += `---\n\n`;
    markdown += `*Generated by Simple Browser Tester*\n`;
    markdown += `*Timestamp: ${new Date().toISOString()}*\n`;

    await fs.writeFile(filepath, markdown, 'utf8');
    console.log(`\n📄 Report saved: ${filename}`);
    console.log(`${'='.repeat(70)}\n`);
  }
}

// Parse args
const args = process.argv.slice(2);
const iterationsIndex = args.indexOf('--iterations');
const urlIndex = args.indexOf('--url');
const iterations = iterationsIndex >= 0 ? parseInt(args[iterationsIndex + 1]) : 10;
const url = urlIndex >= 0 ? args[urlIndex + 1] : 'http://localhost:3000/pilot';

// Run
const tester = new SimpleBrowserTester({ iterations, url });

tester.runAllTests().catch(err => {
  console.error(`\n❌ Testing failed:`, err);
  process.exit(1);
});
