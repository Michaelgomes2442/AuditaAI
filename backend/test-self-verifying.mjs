#!/usr/bin/env node

/**
 * Test: Self-Verifying Governance with LLM Validation
 * 
 * Tests the new self-verification approach where LLM validates its OWN
 * answer against constraints and regenerates if it violates them
 */

import { callGPT4WithSelfVerifyingGovernance } from './src/llm-client.js';

const financePrompt = `A mid-size finance company wants to deploy an internal AI assistant to help analysts interpret market movements, summarize economic reports, and check for red flags in client portfolios. What are the biggest risks they should worry about, and how can the company reduce those risks without slowing down productivity?`;

console.log('═'.repeat(80));
console.log('🧪 TEST: Self-Verifying Governance (LLM validates its own constraints)');
console.log('═'.repeat(80));
console.log('\n📋 PROMPT:\n');
console.log(financePrompt);
console.log('\n' + '═'.repeat(80) + '\n');

try {
  const result = await callGPT4WithSelfVerifyingGovernance(financePrompt, {
    domain: 'FINANCE'
  }, {
    model: 'gpt-4o-2024-11-20',
    timeout: 180000,
    userName: 'TestUser',
    userRole: 'Architect'
  });

  console.log('✅ RESPONSE RECEIVED\n');
  
  // Display validation attempts
  console.log(`📍 VALIDATION PROCESS:`);
  console.log('─'.repeat(80));
  console.log(`  Attempts: ${result.validationAttempts}`);
  if (result.validationResult) {
    console.log(`\n  Final Validation Result:`);
    console.log(`    Specificity: ${result.validationResult.passes_specificity ? '✅' : '❌'}`);
    console.log(`    Context Usage: ${result.validationResult.passes_context_usage ? '✅' : '❌'}`);
    console.log(`    Acknowledged Scope: ${result.validationResult.passes_acknowledged_scope ? '✅' : '❌'}`);
    console.log(`    Trade-off Clarity: ${result.validationResult.passes_trade_off_clarity ? '✅' : '❌'}`);
    console.log(`    No Off-Topic: ${result.validationResult.passes_no_off_topic ? '✅' : '❌'}`);
    console.log(`    OVERALL: ${result.validationResult.overall_pass ? '✅ PASS' : '❌ FAIL'}`);
    
    if (result.validationResult.violations && result.validationResult.violations.length > 0) {
      console.log(`\n  Violations Found:`);
      result.validationResult.violations.forEach(v => console.log(`    • ${v}`));
    }
  }
  console.log();

  // Display the actual response
  console.log('📝 RESPONSE:');
  console.log('─'.repeat(80));
  console.log(result.response);
  console.log();

  // Display CRIES scores
  if (result.criesAnalysis) {
    console.log('📊 CRIES v4 SCORES:');
    console.log('─'.repeat(80));
    console.log(`  C (Coherence):    ${result.criesAnalysis.C.toFixed(2)}`);
    console.log(`  R (Rigor):        ${result.criesAnalysis.R.toFixed(2)}`);
    console.log(`  I (Integration):  ${result.criesAnalysis.I.toFixed(2)}`);
    console.log(`  E (Empathy):      ${result.criesAnalysis.E.toFixed(2)}`);
    console.log(`  S (Strictness):   ${result.criesAnalysis.S.toFixed(2)}`);
    console.log(`  Ω (Omega):        ${result.criesAnalysis.Omega.toFixed(2)}`);
    console.log();

    // Key insights
    console.log('🔍 KEY IMPROVEMENTS:');
    console.log('─'.repeat(80));
    
    // Check for context specificity indicators
    const hasMidSizeRef = result.response.toLowerCase().includes('mid-size') || 
                          result.response.toLowerCase().includes('mid-market');
    const hasAnalystRef = result.response.toLowerCase().includes('analyst');
    const hasProductivityRef = result.response.toLowerCase().includes('productiv');
    const noStartupRef = !result.response.toLowerCase().includes('startup');
    const noGenericLists = !/\d+\.\s+[A-Z][a-z]+\s+and\s+\d+\.\s+[A-Z]/m.test(result.response);
    
    console.log(`  References "mid-size":     ${hasMidSizeRef ? '✅' : '❌'}`);
    console.log(`  References "analyst":      ${hasAnalystRef ? '✅' : '❌'}`);
    console.log(`  References "productivity": ${hasProductivityRef ? '✅' : '❌'}`);
    console.log(`  Avoids startup discussion: ${noStartupRef ? '✅' : '❌'}`);
    console.log(`  Avoids generic lists:      ${noGenericLists ? '✅' : '❌'}`);
    console.log();

    // Comparison with baseline
    console.log('📈 COMPARISON WITH BASELINE (Standard LLM):');
    console.log('─'.repeat(80));
    console.log(`  Baseline S (Strictness):   0.50 → Current: ${result.criesAnalysis.S.toFixed(2)}`);
    console.log(`  Baseline Ω (Omega):        0.71 → Current: ${result.criesAnalysis.Omega.toFixed(2)}`);
    
    if (result.validationResult?.overall_pass) {
      console.log(`\n  ✅ Validation PASSED - Answer meets all constraints`);
    } else {
      console.log(`\n  ⚠️  Validation had violations - but self-correction attempted`);
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log('✅ TEST COMPLETE');
  console.log('═'.repeat(80));
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
