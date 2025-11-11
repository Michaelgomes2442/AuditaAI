#!/usr/bin/env node
/**
 * Dashboard-Based Governance Optimizer
 * Uses the actual pilot dashboard API endpoint to run real tests
 * This ensures we're testing the exact same code path users experience
 * 
 * Usage:
 *   node tests/dashboard-optimizer.js --iterations 10
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test prompts covering different scenarios
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

class DashboardOptimizer {
  constructor(options = {}) {
    this.iterations = options.iterations || 10;
    this.baseUrl = options.baseUrl || 'http://localhost:3020';
    this.results = [];
    this.receiptDir = path.join(__dirname, '../rosetta/receipts');
  }

  async callDashboardAPI(prompt, provider = 'openai', model = 'gpt-4') {
    const url = `${this.baseUrl}/api/llm/query`;
    
    const payload = {
      prompt,
      provider,
      model,
      options: {
        temperature: 0.3,
        maxTokens: 2000
      },
      context: {},
      useGovernance: true  // CRITICAL: Enable Rosetta governance
    };

    console.log(`\n📡 Calling dashboard API...`);
    console.log(`   Provider: ${provider}`);
    console.log(`   Model: ${model}`);
    console.log(`   Governance: ${payload.useGovernance ? 'ENABLED ✓' : 'DISABLED ✗'}`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error(`❌ API call failed:`, error.message);
      throw error;
    }
  }

  async getLatestReceipt() {
    // Find most recent receipt file
    const files = await fs.readdir(this.receiptDir);
    const receiptFiles = files
      .filter(f => f.startsWith('receipt_') && f.endsWith('.json'))
      .sort()
      .reverse();
    
    if (receiptFiles.length === 0) {
      throw new Error('No receipt files found');
    }

    const latestFile = path.join(this.receiptDir, receiptFiles[0]);
    const content = await fs.readFile(latestFile, 'utf8');
    const receipt = JSON.parse(content);
    
    return receipt;
  }

  async extractCRIESFromReceipt(receipt) {
    // Extract CRIES scores from receipt payload
    if (!receipt.payload) {
      throw new Error('Receipt missing payload');
    }

    const { cries_scores, cries_evidence, cries_overall } = receipt.payload;
    
    if (!cries_scores) {
      console.warn('⚠️  No CRIES scores found in receipt');
      return null;
    }

    return {
      scores: cries_scores,
      evidence: cries_evidence || {},
      overall: cries_overall || 0,
      lamport: receipt.lamport,
      timestamp: receipt.timestamp
    };
  }

  async runTest(promptIndex, prompt) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🧪 TEST ${promptIndex + 1}/${this.iterations}`);
    console.log(`${'='.repeat(70)}`);
    console.log(`📝 Prompt: ${prompt.slice(0, 80)}...`);
    
    try {
      // Call the actual dashboard API
      const startTime = Date.now();
      const response = await this.callDashboardAPI(prompt, 'openai', 'gpt-4');
      const duration = Date.now() - startTime;
      
      console.log(`✓ Response received (${duration}ms)`);
      console.log(`   Length: ${response.response?.length || 0} chars`);
      
      // Wait a bit for receipt to be written
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get the latest receipt
      const receipt = await this.getLatestReceipt();
      const criesData = await this.extractCRIESFromReceipt(receipt);
      
      if (!criesData) {
        console.warn('⚠️  No CRIES data available for this test');
        return null;
      }

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
        console.log(`   Scenarios: ${criesData.evidence.scenarios_count || 0}`);
      }

      return {
        prompt,
        promptIndex,
        response: response.response,
        cries: criesData,
        duration,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Test ${promptIndex + 1} failed:`, error.message);
      return null;
    }
  }

  async runAllTests() {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🚀 DASHBOARD-BASED GOVERNANCE TESTING`);
    console.log(`${'='.repeat(70)}`);
    console.log(`\nConfiguration:`);
    console.log(`  • Backend URL: ${this.baseUrl}`);
    console.log(`  • Iterations: ${this.iterations}`);
    console.log(`  • Provider: OpenAI`);
    console.log(`  • Model: GPT-4`);
    console.log(`  • Governance: ENABLED ✓`);
    console.log(`\nStarting tests...\n`);

    // Select prompts
    const selectedPrompts = TEST_PROMPTS
      .sort(() => Math.random() - 0.5)
      .slice(0, this.iterations);

    // Run tests sequentially
    for (let i = 0; i < selectedPrompts.length; i++) {
      const result = await this.runTest(i, selectedPrompts[i]);
      if (result) {
        this.results.push(result);
      }
      
      // Small delay between tests to avoid rate limiting
      if (i < selectedPrompts.length - 1) {
        console.log(`\n⏳ Waiting 2s before next test...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Generate report
    await this.generateReport();
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
    const validResults = this.results.filter(r => r.cries);
    
    if (validResults.length === 0) {
      console.log(`❌ No results with CRIES scores`);
      return;
    }

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

    // Calculate std dev for overall score
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

    console.log(`\n📈 Score Distribution:`);
    validResults.forEach((r, i) => {
      console.log(`   ${i+1}. Ω=${r.cries.overall.toFixed(4)} | "${r.prompt.slice(0, 50)}..."`);
    });

    // Save detailed report
    await this.saveMarkdownReport(validResults, avgScores, stdDev);
  }

  async saveMarkdownReport(results, avgScores, stdDev) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `DASHBOARD_TEST_RESULTS_${timestamp}.md`;
    const filepath = path.join(__dirname, '../', filename);

    let markdown = `# Dashboard Governance Testing Results\n\n`;
    markdown += `**Date:** ${new Date().toISOString()}\n`;
    markdown += `**Tests Run:** ${results.length}\n`;
    markdown += `**Provider:** OpenAI\n`;
    markdown += `**Model:** GPT-4\n`;
    markdown += `**Governance:** Enabled (Rosetta Ω⁴)\n`;
    markdown += `**Backend:** ${this.baseUrl}\n\n`;

    markdown += `## Executive Summary\n\n`;
    markdown += `### Average CRIES Scores\n\n`;
    markdown += `- **Overall Ω:** ${avgScores.overall.toFixed(4)} ± ${stdDev.toFixed(4)}\n`;
    markdown += `- **Coherence:** ${avgScores.coherence.toFixed(4)}\n`;
    markdown += `- **Rigor:** ${avgScores.rigor.toFixed(4)}\n`;
    markdown += `- **Integration:** ${avgScores.integration.toFixed(4)}\n`;
    markdown += `- **Empathy:** ${avgScores.empathy.toFixed(4)}\n`;
    markdown += `- **Strictness:** ${avgScores.strictness.toFixed(4)}\n\n`;

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
        markdown += `- Mechanisms detected: ${r.cries.evidence.mechanisms_count || 0}\n`;
        markdown += `- Standards cited: ${r.cries.evidence.standards_cited?.length || 0}\n`;
        markdown += `- Scenarios provided: ${r.cries.evidence.scenarios_count || 0}\n`;
        
        if (r.cries.evidence.standards_cited && r.cries.evidence.standards_cited.length > 0) {
          markdown += `- Standards list: ${r.cries.evidence.standards_cited.join(', ')}\n`;
        }
        markdown += `\n`;
      }

      markdown += `**Response Preview:**\n`;
      markdown += `\`\`\`\n${r.response.slice(0, 300)}...\n\`\`\`\n\n`;
      markdown += `---\n\n`;
    });

    markdown += `## Configuration Notes\n\n`;
    markdown += `This test was run through the actual pilot dashboard interface using the \`/api/llm/query\` endpoint. `;
    markdown += `This ensures we're testing the exact same code path that end users experience, including:\n\n`;
    markdown += `- Full Rosetta Ω⁴ governance wrapper\n`;
    markdown += `- Delta receipt chain generation\n`;
    markdown += `- CRIES scoring and evidence collection\n`;
    markdown += `- Lamport timestamp sequencing\n`;
    markdown += `- Complete audit trail\n\n`;

    markdown += `---\n\n`;
    markdown += `*Generated by Dashboard Optimizer*\n`;
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
const baseUrl = urlIndex >= 0 ? args[urlIndex + 1] : 'http://localhost:3020';

// Run tests
const optimizer = new DashboardOptimizer({
  iterations,
  baseUrl
});

optimizer.runAllTests().catch(err => {
  console.error(`\n❌ Testing failed:`, err);
  process.exit(1);
});
