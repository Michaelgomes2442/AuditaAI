#!/usr/bin/env node

import { callGPT4WithStructuredGovernance } from './src/llm-client.js';

const financePrompt = `A mid-size finance company wants to deploy an internal AI assistant to help analysts interpret market movements, summarize economic reports, and check for red flags in client portfolios. What are the biggest risks they should worry about, and how can the company reduce those risks without slowing down productivity?`;

console.log('🧪 Testing Structured Governance with Critical Thinking Framework\n');
console.log('📋 Prompt:', financePrompt);
console.log('\n' + '='.repeat(80) + '\n');

try {
  const result = await callGPT4WithStructuredGovernance(financePrompt, {
    domain: 'FINANCE',
    userName: 'TestUser',
    userRole: 'Architect'
  }, {
    model: 'gpt-4o-2024-11-20',
    timeout: 120000
  });

  console.log('✅ STRUCTURED GOVERNANCE RESPONSE\n');
  
  console.log('=== REASONING (What You\'re Assuming & Uncertain About) ===');
  if (result.reasoning) {
    console.log('\nCore Assumptions:');
    result.reasoning.core_assumptions?.forEach((a, i) => console.log(`  ${i+1}. ${a}`));
    
    console.log('\nUncertainty Bounds (Ranges, not vague):');
    result.reasoning.uncertainty_bounds?.forEach((u, i) => console.log(`  ${i+1}. ${u}`));
    
    console.log('\nContext Sensitivity (How Answer Changes):');
    result.reasoning.context_sensitivity?.forEach(c => {
      console.log(`  • ${c.context_factor}:`);
      console.log(`    → ${c.how_it_changes_answer}`);
    });
  }

  console.log('\n=== EVIDENCE BASE (What You Know & Don\'t Know) ===');
  if (result.evidenceBase) {
    console.log('\nCitations:');
    result.evidenceBase.citations?.forEach((c, i) => console.log(`  ${i+1}. ${c}`));
    
    console.log('\nQuantified Claims:');
    result.evidenceBase.quantified_claims?.forEach((q, i) => console.log(`  ${i+1}. ${q}`));
    
    console.log('\nWhat You Don\'t Know:');
    console.log(`  ${result.evidenceBase.what_you_dont_know}`);
  }

  console.log('\n=== ANSWER ===\n');
  console.log(result.response);
  
  if (result.criesAnalysis) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 CRIES v4 ANALYSIS');
    console.log('='.repeat(80));
    console.log(`C (Coherence):    ${result.criesAnalysis.C.toFixed(2)}`);
    console.log(`R (Rigor):        ${result.criesAnalysis.R.toFixed(2)}`);
    console.log(`I (Integration):  ${result.criesAnalysis.I.toFixed(2)}`);
    console.log(`E (Empathy):      ${result.criesAnalysis.E.toFixed(2)}`);
    console.log(`S (Strictness):   ${result.criesAnalysis.S.toFixed(2)}`);
    console.log(`Ω (Omega):        ${result.criesAnalysis.Omega.toFixed(2)}`);
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
