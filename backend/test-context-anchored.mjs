#!/usr/bin/env node

import { callGPT4WithContextAnchoredGovernance } from './src/llm-client.js';

const financePrompt = `A mid-size finance company wants to deploy an internal AI assistant to help analysts interpret market movements, summarize economic reports, and check for red flags in client portfolios. What are the biggest risks they should worry about, and how can the company reduce those risks without slowing down productivity?`;

console.log('🎯 Testing Context-Anchored Governance\n');
console.log('This approach extracts context from the prompt and forces scenario-specific reasoning.');
console.log('Instead of generic risk lists, it should reason FROM the explicit details.\n');
console.log('📋 Prompt:', financePrompt);
console.log('\n' + '='.repeat(80) + '\n');

try {
  const result = await callGPT4WithContextAnchoredGovernance(financePrompt, {
    domain: 'FINANCE',
    userName: 'TestUser',
    userRole: 'Architect'
  }, {
    model: 'gpt-4o-2024-11-20',
    timeout: 120000
  });

  console.log('✅ CONTEXT-ANCHORED GOVERNANCE RESPONSE\n');
  
  console.log('=== EXTRACTED CONTEXT ===');
  if (result.contextAnalysis) {
    console.log('\nExplicit mentions:');
    console.log(`  Domain: ${result.contextAnalysis.explicit.domain || 'general'}`);
    console.log(`  Size: ${result.contextAnalysis.explicit.size || 'not specified'}`);
    console.log(`  Actors: ${result.contextAnalysis.explicit.mentioned_actors.join(', ') || 'none'}`);
    console.log(`  Constraints: ${result.contextAnalysis.explicit.mentioned_constraints.join(', ') || 'none'}`);
    
    console.log('\nMissing information (gaps):');
    result.contextAnalysis.gaps.missing_info.forEach(gap => console.log(`  - ${gap}`));
  }

  console.log('\n=== REASONING (Extracted from Response) ===');
  if (result.reasoning) {
    console.log('\nCore Assumptions:');
    result.reasoning.core_assumptions?.forEach((a, i) => console.log(`  ${i+1}. ${a}`));
    
    console.log('\nUncertainty Bounds:');
    result.reasoning.uncertainty_bounds?.forEach((u, i) => console.log(`  ${i+1}. ${u}`));
    
    console.log('\nContext Sensitivity:');
    result.reasoning.context_sensitivity?.forEach(c => {
      console.log(`  • ${c.context_factor}:`);
      console.log(`    → ${c.how_it_changes_answer}`);
    });
  }

  console.log('\n=== EVIDENCE BASE ===');
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
    console.log('\n🔍 KEY METRICS FOR CONTEXT-ANCHORING:');
    console.log(`  → S (Strictness): ${result.criesAnalysis.S < 0.50 ? '❌ LOW' : '✅ GOOD'} (target >0.50, was 0.15 in standard approach)`);
    console.log(`  → Ω (Omega): ${result.criesAnalysis.Omega > 0.73 ? '✅ IMPROVED' : '⚠️ similar'} (baseline was 0.73)`);
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
