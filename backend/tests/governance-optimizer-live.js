#!/usr/bin/env node
/**
 * Live Governance Wrapper Optimizer
 * Uses real GPT-4 API calls with actual CRIES scoring from receipts
 * Iteratively improves wrapper by testing variations and keeping only improvements
 * 
 * Usage:
 *   node tests/governance-optimizer-live.js --budget 30 --prompts 3
 */

import * as llm from '../src/llm-client.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test prompts covering different complexity levels
const TEST_PROMPTS = [
  "What security mechanisms should I implement for a microservices architecture handling financial transactions?",
  "How should I structure audit logging for a HIPAA-compliant healthcare system?",
  "What are the key considerations for implementing rate limiting in a public API?",
  "Explain the trade-offs between different database replication strategies for high-availability systems.",
  "What monitoring and alerting should I set up for a production Kubernetes cluster?"
];

class LiveGovernanceOptimizer {
  constructor(options = {}) {
    this.budget = options.budget || 20;
    this.promptsPerVariant = options.prompts || 3;
    this.model = options.model || 'gpt-4';
    this.results = [];
    this.bestVariant = null;
    this.bestScore = 0;
    this.iteration = 0;
    this.totalCost = 0;
  }

  async testWrapperVariant(variantName, wrapperText, promptSubset) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🧪 Testing: ${variantName}`);
    console.log(`${'='.repeat(70)}`);
    
    const scores = [];
    const metadata = [];
    
    // Test with multiple prompts
    for (let i = 0; i < promptSubset.length; i++) {
      const prompt = promptSubset[i];
      console.log(`\n[${i+1}/${promptSubset.length}] Query: ${prompt.slice(0, 50)}...`);
      
      try {
        // Temporarily inject this wrapper variant
        const originalWrapper = await this.getCurrentWrapper();
        await this.injectWrapper(wrapperText);
        
        // Call GPT-4 with Rosetta governance
        const result = await llm.callGPT4WithRosetta(prompt, {}, {
          model: this.model,
          temperature: 0.3,
          maxTokens: 2000
        });
        
        // Restore original wrapper
        await this.injectWrapper(originalWrapper);
        
        // Read the latest receipt to get CRIES scores
        const receipt = await this.getLatestReceipt();
        
        if (receipt && receipt.payload && receipt.payload.cries_scores) {
          const criesScores = receipt.payload.cries_scores;
          const overall = receipt.payload.cries_overall;
          
          scores.push({
            coherence: criesScores.coherence,
            rigor: criesScores.rigor,
            integration: criesScores.integration,
            empathy: criesScores.empathy,
            strictness: criesScores.strictness,
            overall: overall
          });
          
          metadata.push({
            prompt: prompt.slice(0, 60),
            response_length: result.content.length,
            evidence: receipt.payload.cries_evidence
          });
          
          console.log(`   📊 CRIES: C=${criesScores.coherence.toFixed(3)} R=${criesScores.rigor.toFixed(3)} I=${criesScores.integration.toFixed(3)} E=${criesScores.empathy.toFixed(3)} S=${criesScores.strictness.toFixed(3)} | Ω=${overall.toFixed(3)}`);
          console.log(`   🔍 Evidence: ${receipt.payload.cries_evidence.mechanisms_count} mechanisms, ${receipt.payload.cries_evidence.standards_cited.length} standards`);
          
          // Estimate cost (rough)
          const estimatedCost = (result.usage.totalTokens / 1000) * 0.03; // $0.03 per 1K tokens approx
          this.totalCost += estimatedCost;
          
        } else {
          console.log(`   ❌ No CRIES scores in receipt`);
        }
        
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
      }
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Calculate averages
    if (scores.length === 0) {
      console.log(`\n❌ No valid scores for ${variantName}`);
      return null;
    }
    
    const avgScores = {
      coherence: scores.reduce((sum, s) => sum + s.coherence, 0) / scores.length,
      rigor: scores.reduce((sum, s) => sum + s.rigor, 0) / scores.length,
      integration: scores.reduce((sum, s) => sum + s.integration, 0) / scores.length,
      empathy: scores.reduce((sum, s) => sum + s.empathy, 0) / scores.length,
      strictness: scores.reduce((sum, s) => sum + s.strictness, 0) / scores.length,
      overall: scores.reduce((sum, s) => sum + s.overall, 0) / scores.length
    };
    
    // Calculate std dev
    const stdDev = Math.sqrt(
      scores.reduce((sum, s) => sum + Math.pow(s.overall - avgScores.overall, 2), 0) / scores.length
    );
    
    console.log(`\n✅ Average CRIES for ${variantName}:`);
    console.log(`   Coherence:   ${avgScores.coherence.toFixed(4)} ± ${stdDev.toFixed(4)}`);
    console.log(`   Rigor:       ${avgScores.rigor.toFixed(4)}`);
    console.log(`   Integration: ${avgScores.integration.toFixed(4)}`);
    console.log(`   Empathy:     ${avgScores.empathy.toFixed(4)}`);
    console.log(`   Strictness:  ${avgScores.strictness.toFixed(4)}`);
    console.log(`   ────────────────────────────`);
    console.log(`   Overall Ω:   ${avgScores.overall.toFixed(4)} (σ=${stdDev.toFixed(4)})`);
    
    return {
      variant: variantName,
      scores: avgScores,
      stdDev: stdDev,
      numTests: scores.length,
      rawScores: scores,
      metadata: metadata
    };
  }
  
  async getCurrentWrapper() {
    // Read current wrapper from llm-client.js
    const llmClientPath = path.join(__dirname, '../src/llm-client.js');
    const content = await fs.readFile(llmClientPath, 'utf8');
    
    // Extract wrapper between function start and return statement
    const match = content.match(/function buildMegaGovernanceWrapper[\s\S]*?return `([\s\S]*?)`;/);
    if (match) {
      return match[1];
    }
    throw new Error('Could not extract current wrapper');
  }
  
  async injectWrapper(wrapperText) {
    // Inject new wrapper into llm-client.js temporarily
    const llmClientPath = path.join(__dirname, '../src/llm-client.js');
    let content = await fs.readFile(llmClientPath, 'utf8');
    
    // Replace wrapper text
    content = content.replace(
      /(function buildMegaGovernanceWrapper[\s\S]*?return `)[\s\S]*?(`;)/,
      `$1${wrapperText}$2`
    );
    
    await fs.writeFile(llmClientPath, content, 'utf8');
    
    // Clear require cache to reload module
    delete require.cache[require.resolve('../src/llm-client.js')];
  }
  
  async getLatestReceipt() {
    // Read the most recent receipt file
    const receiptsDir = path.join(__dirname, '../receipts');
    const files = await fs.readdir(receiptsDir);
    const receiptFiles = files
      .filter(f => f.startsWith('receipt-') && f.endsWith('.json'))
      .sort()
      .reverse();
    
    if (receiptFiles.length === 0) {
      return null;
    }
    
    const latestFile = receiptFiles[0];
    const content = await fs.readFile(path.join(receiptsDir, latestFile), 'utf8');
    return JSON.parse(content);
  }
  
  generateVariant(baseWrapper, mutation) {
    // Generate a new wrapper variant by applying a mutation
    let newWrapper = baseWrapper;
    
    switch (mutation.type) {
      case 'enhance_coherence':
        newWrapper = newWrapper.replace(
          /Compose your response as a flowing narrative/,
          'Compose your response as a tightly woven narrative where every paragraph flows seamlessly into the next. Open with the essential context. Build through each implication using explicit causal connectors: because, therefore, consequently, which means that, this leads directly to. Close with actionable synthesis that ties everything together. Use rich transitional phrases: "In practice this means...", "Taking this further...", "The operational implication is...", "From an implementation standpoint...", "This connects back to...". Every sentence must feel essential—remove anything that doesn\'t advance understanding'
        );
        break;
        
      case 'enhance_rigor':
        newWrapper = newWrapper.replace(
          /Every technical mechanism must include concrete numbers/,
          'Every technical mechanism must include precise, verifiable numbers. Always specify thresholds with units (e.g., 100ms timeout, 500 req/s rate limit). Always give operational ranges (e.g., 50-500 concurrent connections, 1-10GB memory allocation). Always describe exact failure conditions. Walk through detailed failure scenarios with quantified progression: "When load exceeds 10,000 req/s, latency degrades from 50ms to 200ms at 11k, circuit breaker trips after 5 consecutive 503s within 30s window, recovery begins at 60s mark." Reference standards with complete specificity: NIST 800-53 AC-2.1 (account management), SOC2 CC6.1 (logical access controls), ISO 27001 A.9.2.1 (user registration). Cite concrete observables: p99 latency in CloudWatch, failed auth in syslog, throughput in Prometheus dashboard'
        );
        break;
        
      case 'enhance_integration':
        newWrapper = newWrapper.replace(
          /Trace the complete system flow/,
          'Map the complete data flow across system boundaries. Start upstream: where does input originate (user, API, queue, external service). Trace through your component: what processing happens, what state changes, what decisions are made. Follow downstream: where does output flow (database, cache, next service, user response). Explain every integration point: "Rate limiter coordinates with load balancer via shared Redis counter, incremented atomically on each request", "Configuration updates propagate through Kafka topic to all 50 consumer instances with max 500ms lag", "Audit events stream to Splunk via syslog-ng with guaranteed delivery". Connect to real operational constraints: "Legacy Oracle DB peaks at 100 connections, so pool must cap at 80 with 20-connection buffer", "Network between regions averages 150ms RTT, so sync replication isn\'t viable". Quantify business impact: "Each minute of downtime costs $5k in SLA credits, making N+2 redundancy a business requirement"'
        );
        break;
        
      case 'enhance_empathy':
        newWrapper = newWrapper.replace(
          /Address the person implementing this tomorrow morning/,
          'Speak directly to the engineer implementing this on Monday morning. Acknowledge their actual team: "Your team has 2 backend devs, 1 frontend dev, and you share DevOps with 3 other teams." Validate their constraints: "Perfect solution needs 6 months and 4 engineers. Pragmatic version takes 2 weeks with your current team and addresses 95% of the risk—here\'s what you can defer." Explain what actually matters: "This prevents credential stuffing attacks hitting your API 1000x daily—that\'s 70% of your security incidents." Provide clear decision trees: "If you have automated deployment: implement blue-green with gradual rollout. If deployment is manual: use feature flags with kill switch instead—they serve the same purpose with your constraints." Validate real concerns: "Yes, this adds 50ms latency. It\'s justified because it catches 98% of automated attacks and latency only affects 2% of endpoints"'
        );
        break;
        
      case 'enhance_strictness':
        newWrapper = newWrapper.replace(
          /Explicitly state what could go wrong/,
          'Name specific failure scenarios without hedging. State the failure mode: "This design fails catastrophically if the database becomes unavailable—there is no graceful degradation, all requests will timeout after 30s." Document your assumptions: "We assume network latency stays below 100ms. Above 150ms, the retry logic creates cascading timeouts. Above 200ms, the system becomes unusable." Quantify your uncertainty with specificity: "Industry best practice recommends async job processing, but I cannot verify your 10-year-old system supports modern queue semantics—check with your platform team." Cite sources with confidence levels: "This is NIST 800-53 guidance (peer-reviewed, government standard, high confidence). That cost estimate is my inference from 3 similar projects (treat as order-of-magnitude only)." Acknowledge information gaps: "We lack visibility into the upstream service\'s failure patterns—it might fail slowly (connection timeout after 30s) or fast (immediate 503). This affects retry strategy but I cannot provide specific guidance without their SLA docs"'
        );
        break;
        
      case 'boost_all':
        // Apply all enhancements
        newWrapper = this.generateVariant(baseWrapper, { type: 'enhance_coherence' });
        newWrapper = this.generateVariant(newWrapper, { type: 'enhance_rigor' });
        newWrapper = this.generateVariant(newWrapper, { type: 'enhance_integration' });
        newWrapper = this.generateVariant(newWrapper, { type: 'enhance_empathy' });
        newWrapper = this.generateVariant(newWrapper, { type: 'enhance_strictness' });
        break;
    }
    
    return newWrapper;
  }
  
  async optimize() {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🎯 Live Governance Wrapper Optimizer`);
    console.log(`   Model: ${this.model}`);
    console.log(`   Budget: ${this.budget} API calls`);
    console.log(`   Prompts per variant: ${this.promptsPerVariant}`);
    console.log(`${'='.repeat(70)}\n`);
    
    // Get current baseline wrapper
    const baselineWrapper = await this.getCurrentWrapper();
    
    // Select random prompts for testing
    const testPrompts = TEST_PROMPTS
      .sort(() => Math.random() - 0.5)
      .slice(0, this.promptsPerVariant);
    
    console.log(`📝 Selected test prompts:`);
    testPrompts.forEach((p, i) => console.log(`   ${i+1}. ${p.slice(0, 60)}...`));
    
    // Test baseline
    console.log(`\n━━━ ITERATION 0: Baseline ━━━`);
    const baselineResult = await this.testWrapperVariant('baseline-v4.1', baselineWrapper, testPrompts);
    
    if (!baselineResult) {
      console.error(`\n❌ Failed to get baseline scores`);
      return;
    }
    
    this.results.push(baselineResult);
    this.bestVariant = baselineWrapper;
    this.bestScore = baselineResult.scores.overall;
    
    console.log(`\n🏆 Current best: ${baselineResult.variant} with Ω=${this.bestScore.toFixed(4)}`);
    
    // Optimization loop
    const mutations = [
      { type: 'enhance_coherence', name: 'Enhanced Coherence' },
      { type: 'enhance_rigor', name: 'Enhanced Rigor' },
      { type: 'enhance_integration', name: 'Enhanced Integration' },
      { type: 'enhance_empathy', name: 'Enhanced Empathy' },
      { type: 'enhance_strictness', name: 'Enhanced Strictness' },
      { type: 'boost_all', name: 'All Enhancements Combined' }
    ];
    
    let callsUsed = this.promptsPerVariant;
    
    while (callsUsed < this.budget && mutations.length > 0) {
      this.iteration++;
      
      // Pick next mutation
      const mutation = mutations[Math.min(this.iteration - 1, mutations.length - 1)];
      
      console.log(`\n━━━ ITERATION ${this.iteration}: ${mutation.name} ━━━`);
      
      // Generate variant
      const variantWrapper = this.generateVariant(this.bestVariant, mutation);
      const variantName = `iter${this.iteration}-${mutation.type}`;
      
      // Test it
      const result = await this.testWrapperVariant(variantName, variantWrapper, testPrompts);
      
      if (!result) {
        console.log(`\n⚠️ Skipping failed variant`);
        continue;
      }
      
      callsUsed += this.promptsPerVariant;
      this.results.push(result);
      
      // Compare to best
      const improvement = result.scores.overall - this.bestScore;
      
      if (improvement > 0) {
        console.log(`\n✅ IMPROVEMENT! +${improvement.toFixed(4)} (${(improvement/this.bestScore*100).toFixed(1)}%)`);
        console.log(`   Old best: Ω=${this.bestScore.toFixed(4)}`);
        console.log(`   New best: Ω=${result.scores.overall.toFixed(4)}`);
        console.log(`   🔄 Pivoting to new best variant...`);
        
        this.bestVariant = variantWrapper;
        this.bestScore = result.scores.overall;
        
        // Inject the better wrapper
        await this.injectWrapper(variantWrapper);
        
      } else {
        console.log(`\n❌ REGRESSION: ${improvement.toFixed(4)} (${(improvement/this.bestScore*100).toFixed(1)}%)`);
        console.log(`   Current: Ω=${result.scores.overall.toFixed(4)}`);
        console.log(`   Best:    Ω=${this.bestScore.toFixed(4)}`);
        console.log(`   ⏭️  Discarding and continuing...`);
      }
      
      console.log(`\n💰 Budget: ${callsUsed}/${this.budget} API calls used (~$${this.totalCost.toFixed(2)})`);
    }
    
    // Final summary
    this.printSummary();
  }
  
  printSummary() {
    console.log(`\n\n${'='.repeat(70)}`);
    console.log(`📊 OPTIMIZATION COMPLETE`);
    console.log(`${'='.repeat(70)}\n`);
    
    // Sort by overall score
    const sorted = [...this.results].sort((a, b) => b.scores.overall - a.scores.overall);
    
    console.log(`Rank  Variant                         Overall    C      R      I      E      S`);
    console.log(`${'─'.repeat(70)}`);
    
    sorted.forEach((r, i) => {
      const rank = `${i+1}.`.padEnd(6);
      const name = r.variant.padEnd(30);
      const scores = `${r.scores.overall.toFixed(4)}  ${r.scores.coherence.toFixed(3)}  ${r.scores.rigor.toFixed(3)}  ${r.scores.integration.toFixed(3)}  ${r.scores.empathy.toFixed(3)}  ${r.scores.strictness.toFixed(3)}`;
      console.log(`${rank}${name}${scores}`);
    });
    
    const best = sorted[0];
    const baseline = this.results[0];
    const improvement = best.scores.overall - baseline.scores.overall;
    const improvementPct = (improvement / baseline.scores.overall * 100);
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🏆 BEST CONFIGURATION: ${best.variant}`);
    console.log(`   Overall Ω: ${best.scores.overall.toFixed(4)}`);
    console.log(`   Improvement: +${improvement.toFixed(4)} (+${improvementPct.toFixed(1)}%)`);
    console.log(`\n   Breakdown:`);
    console.log(`   • Coherence:   ${best.scores.coherence.toFixed(4)} (${(best.scores.coherence - baseline.scores.coherence) > 0 ? '+' : ''}${(best.scores.coherence - baseline.scores.coherence).toFixed(4)})`);
    console.log(`   • Rigor:       ${best.scores.rigor.toFixed(4)} (${(best.scores.rigor - baseline.scores.rigor) > 0 ? '+' : ''}${(best.scores.rigor - baseline.scores.rigor).toFixed(4)})`);
    console.log(`   • Integration: ${best.scores.integration.toFixed(4)} (${(best.scores.integration - baseline.scores.integration) > 0 ? '+' : ''}${(best.scores.integration - baseline.scores.integration).toFixed(4)})`);
    console.log(`   • Empathy:     ${best.scores.empathy.toFixed(4)} (${(best.scores.empathy - baseline.scores.empathy) > 0 ? '+' : ''}${(best.scores.empathy - baseline.scores.empathy).toFixed(4)})`);
    console.log(`   • Strictness:  ${best.scores.strictness.toFixed(4)} (${(best.scores.strictness - baseline.scores.strictness) > 0 ? '+' : ''}${(best.scores.strictness - baseline.scores.strictness).toFixed(4)})`);
    console.log(`\n💰 Total cost: ~$${this.totalCost.toFixed(2)}`);
    console.log(`📞 API calls: ${this.results.reduce((sum, r) => sum + r.numTests, 0)}`);
    console.log(`${'='.repeat(70)}\n`);
    
    // Save detailed results to markdown
    this.saveResultsToMarkdown(sorted, best, baseline);
  }
  
  async saveResultsToMarkdown(sorted, best, baseline) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `OPTIMIZATION_RESULTS_${timestamp}.md`;
    const filepath = path.join(__dirname, '../', filename);
    
    const improvement = best.scores.overall - baseline.scores.overall;
    const improvementPct = (improvement / baseline.scores.overall * 100);
    
    let markdown = `# Governance Wrapper Optimization Results\n\n`;
    markdown += `**Date:** ${new Date().toISOString()}\n`;
    markdown += `**Model:** ${this.model}\n`;
    markdown += `**Budget:** ${this.budget} API calls\n`;
    markdown += `**Prompts per variant:** ${this.promptsPerVariant}\n`;
    markdown += `**Total cost:** ~$${this.totalCost.toFixed(2)}\n`;
    markdown += `**Total API calls:** ${this.results.reduce((sum, r) => sum + r.numTests, 0)}\n\n`;
    
    markdown += `## Executive Summary\n\n`;
    markdown += `🏆 **Best Configuration:** ${best.variant}\n\n`;
    markdown += `- **Overall Ω Score:** ${best.scores.overall.toFixed(4)}\n`;
    markdown += `- **Improvement over baseline:** +${improvement.toFixed(4)} (+${improvementPct.toFixed(1)}%)\n`;
    markdown += `- **Standard deviation:** ${best.stdDev.toFixed(4)}\n\n`;
    
    markdown += `### CRIES Breakdown\n\n`;
    markdown += `| Dimension | Score | Δ from Baseline | Status |\n`;
    markdown += `|-----------|-------|-----------------|--------|\n`;
    markdown += `| Coherence | ${best.scores.coherence.toFixed(4)} | ${(best.scores.coherence - baseline.scores.coherence) > 0 ? '+' : ''}${(best.scores.coherence - baseline.scores.coherence).toFixed(4)} | ${(best.scores.coherence - baseline.scores.coherence) > 0 ? '✅' : '⚠️'} |\n`;
    markdown += `| Rigor | ${best.scores.rigor.toFixed(4)} | ${(best.scores.rigor - baseline.scores.rigor) > 0 ? '+' : ''}${(best.scores.rigor - baseline.scores.rigor).toFixed(4)} | ${(best.scores.rigor - baseline.scores.rigor) > 0 ? '✅' : '⚠️'} |\n`;
    markdown += `| Integration | ${best.scores.integration.toFixed(4)} | ${(best.scores.integration - baseline.scores.integration) > 0 ? '+' : ''}${(best.scores.integration - baseline.scores.integration).toFixed(4)} | ${(best.scores.integration - baseline.scores.integration) > 0 ? '✅' : '⚠️'} |\n`;
    markdown += `| Empathy | ${best.scores.empathy.toFixed(4)} | ${(best.scores.empathy - baseline.scores.empathy) > 0 ? '+' : ''}${(best.scores.empathy - baseline.scores.empathy).toFixed(4)} | ${(best.scores.empathy - baseline.scores.empathy) > 0 ? '✅' : '⚠️'} |\n`;
    markdown += `| Strictness | ${best.scores.strictness.toFixed(4)} | ${(best.scores.strictness - baseline.scores.strictness) > 0 ? '+' : ''}${(best.scores.strictness - baseline.scores.strictness).toFixed(4)} | ${(best.scores.strictness - baseline.scores.strictness) > 0 ? '✅' : '⚠️'} |\n\n`;
    
    markdown += `## All Variants Tested\n\n`;
    markdown += `| Rank | Variant | Overall Ω | C | R | I | E | S | σ |\n`;
    markdown += `|------|---------|-----------|---|---|---|---|---|---|\n`;
    
    sorted.forEach((r, i) => {
      markdown += `| ${i+1} | ${r.variant} | ${r.scores.overall.toFixed(4)} | ${r.scores.coherence.toFixed(3)} | ${r.scores.rigor.toFixed(3)} | ${r.scores.integration.toFixed(3)} | ${r.scores.empathy.toFixed(3)} | ${r.scores.strictness.toFixed(3)} | ${r.stdDev.toFixed(4)} |\n`;
    });
    
    markdown += `\n## Detailed Results\n\n`;
    
    for (const result of sorted) {
      markdown += `### ${result.variant}\n\n`;
      markdown += `- **Overall Ω:** ${result.scores.overall.toFixed(4)} ± ${result.stdDev.toFixed(4)}\n`;
      markdown += `- **Tests performed:** ${result.numTests}\n\n`;
      
      markdown += `**CRIES Scores:**\n`;
      markdown += `- Coherence: ${result.scores.coherence.toFixed(4)}\n`;
      markdown += `- Rigor: ${result.scores.rigor.toFixed(4)}\n`;
      markdown += `- Integration: ${result.scores.integration.toFixed(4)}\n`;
      markdown += `- Empathy: ${result.scores.empathy.toFixed(4)}\n`;
      markdown += `- Strictness: ${result.scores.strictness.toFixed(4)}\n\n`;
      
      if (result.metadata && result.metadata.length > 0) {
        markdown += `**Test Evidence:**\n`;
        result.metadata.forEach((meta, i) => {
          markdown += `- Test ${i+1}: "${meta.prompt}..." - ${meta.evidence.mechanisms_count} mechanisms, ${meta.evidence.standards_cited.length} standards\n`;
        });
        markdown += `\n`;
      }
      
      markdown += `---\n\n`;
    }
    
    markdown += `## Recommendations\n\n`;
    
    if (improvementPct > 5) {
      markdown += `✅ **Deploy immediately** - The optimized wrapper shows significant improvement (${improvementPct.toFixed(1)}%) over baseline.\n\n`;
    } else if (improvementPct > 0) {
      markdown += `⚠️ **Consider deployment** - Modest improvement (${improvementPct.toFixed(1)}%) detected. Review specific dimension changes.\n\n`;
    } else {
      markdown += `❌ **Do not deploy** - No improvement over baseline. Current wrapper is optimal.\n\n`;
    }
    
    markdown += `### Key Findings\n\n`;
    
    const dims = ['coherence', 'rigor', 'integration', 'empathy', 'strictness'];
    const dimNames = ['Coherence', 'Rigor', 'Integration', 'Empathy', 'Strictness'];
    
    dims.forEach((dim, i) => {
      const change = best.scores[dim] - baseline.scores[dim];
      if (Math.abs(change) > 0.05) {
        markdown += `- **${dimNames[i]}**: ${change > 0 ? 'Strong improvement' : 'Degradation'} (${change > 0 ? '+' : ''}${change.toFixed(4)})\n`;
      }
    });
    
    markdown += `\n## Configuration Details\n\n`;
    markdown += `**Best variant identifier:** \`${best.variant}\`\n\n`;
    markdown += `The optimized wrapper has been automatically applied to \`src/llm-client.js\`.\n\n`;
    
    markdown += `---\n\n`;
    markdown += `*Generated by Live Governance Optimizer*\n`;
    markdown += `*Timestamp: ${new Date().toISOString()}*\n`;
    
    await fs.writeFile(filepath, markdown, 'utf8');
    console.log(`\n📄 Results saved to: ${filename}`);
    
    return filepath;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const budget = parseInt(args[args.indexOf('--budget') + 1] || '20');
const prompts = parseInt(args[args.indexOf('--prompts') + 1] || '3');

// Run optimizer
const optimizer = new LiveGovernanceOptimizer({
  budget,
  prompts,
  model: 'gpt-4'
});

optimizer.optimize().catch(err => {
  console.error(`\n❌ Optimizer failed:`, err);
  process.exit(1);
});
