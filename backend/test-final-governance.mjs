#!/usr/bin/env node

/**
 * Test: Context-Anchored Governance with Updated CRIES Scoring
 * 
 * Tests the new coherence and rigor fixes on the finance prompt
 * Measures improvement in S (Strictness) and overall quality
 */

import { callGPT4WithContextAnchoredGovernance } from './src/llm-client.js';

const financePrompt = `A mid-size finance company wants to deploy an internal AI assistant to help analysts interpret market movements, summarize economic reports, and check for red flags in client portfolios. What are the biggest risks they should worry about, and how can the company reduce those risks without slowing down productivity?`;

console.log('═'.repeat(80));
console.log('🧪 TEST: Context-Anchored Governance + Updated CRIES Scoring');
console.log('═'.repeat(80));
console.log('\n📋 PROMPT:\n');
console.log(financePrompt);
console.log('\n' + '═'.repeat(80) + '\n');

try {
  const result = await callGPT4WithContextAnchoredGovernance(financePrompt, {
    domain: 'FINANCE',
    userName: 'TestUser',
    userRole: 'Architect'
  }, {
    model: 'gpt-4o-2024-11-20',
    timeout: 120000
  });

  console.log('✅ RESPONSE RECEIVED\n');
  
  // Display extracted context
  if (result.contextAnalysis) {
    console.log('📍 EXTRACTED CONTEXT:');
    console.log('─'.repeat(80));
    console.log(`  Domain:       ${result.contextAnalysis.explicit.domain || 'general'}`);
    console.log(`  Size:         ${result.contextAnalysis.explicit.size || 'not specified'}`);
    console.log(`  Actors:       ${result.contextAnalysis.explicit.mentioned_actors.join(', ') || 'none'}`);
    console.log(`  Constraints:  ${result.contextAnalysis.explicit.mentioned_constraints.join(', ') || 'none'}`);
    console.log(`\n  ⚠️  Missing Information:`);
    result.contextAnalysis.gaps.missing_info.forEach(gap => {
      console.log(`    • ${gap}`);
    });
    console.log();
  }

  // Display the actual response
  console.log('📝 RESPONSE:');
  console.log('─'.repeat(80));
  console.log(result.response);
  console.log();

  // Display CRIES scores with analysis
  if (result.criesAnalysis) {
    console.log('📊 CRIES v4 SCORES:');
    console.log('─'.repeat(80));
    console.log(`  C (Coherence):    ${result.criesAnalysis.C.toFixed(2)} - ${getCohereceAnalysis(result.criesAnalysis.C)}`);
    console.log(`  R (Rigor):        ${result.criesAnalysis.R.toFixed(2)} - ${getRigorAnalysis(result.criesAnalysis.R)}`);
    console.log(`  I (Integration):  ${result.criesAnalysis.I.toFixed(2)} - ${getIntegrationAnalysis(result.criesAnalysis.I)}`);
    console.log(`  E (Empathy):      ${result.criesAnalysis.E.toFixed(2)} - ${getEmpathyAnalysis(result.criesAnalysis.E)}`);
    console.log(`  S (Strictness):   ${result.criesAnalysis.S.toFixed(2)} - ${getStrictnessAnalysis(result.criesAnalysis.S)}`);
    console.log(`\n  Ω (Omega):        ${result.criesAnalysis.Omega.toFixed(2)} - ${getOmegaAnalysis(result.criesAnalysis.Omega)}`);
    console.log();

    // Key metrics
    console.log('🔍 KEY METRICS FOR CONTEXT-ANCHORING:');
    console.log('─'.repeat(80));
    console.log(`  Strictness (S):   ${result.criesAnalysis.S < 0.50 ? '❌ LOW' : '✅ GOOD'} (target >0.50, baseline was 0.15)`);
    console.log(`  Rigor (R):        ${result.criesAnalysis.R > 0.75 ? '✅ STRONG' : '⚠️  moderate'} (evidence & depth)`);
    console.log(`  Coherence (C):    ${result.criesAnalysis.C > 0.80 ? '✅ CLEAR' : '⚠️  moderate'} (insight-bearing elaboration)`);
    console.log(`  Omega (Ω):        ${result.criesAnalysis.Omega > 0.73 ? '✅ IMPROVED' : '⚠️  similar'} (baseline was 0.73)`);
    console.log();

    // Interpretation
    console.log('📈 INTERPRETATION:');
    console.log('─'.repeat(80));
    if (result.criesAnalysis.S > 0.50) {
      console.log(`  ✅ SUCCESS: Strictness improved - answer likely cites evidence and acknowledges unknowns`);
    } else {
      console.log(`  ⚠️  Strictness still low - LLM may be defaulting to generic patterns`);
    }
    
    if (result.criesAnalysis.C > 0.80) {
      console.log(`  ✅ Coherence is high - answer is clear and insight-bearing (not just verbose)`);
    } else {
      console.log(`  ⚠️  Coherence is moderate - may have unnecessary redundancy`);
    }

    if (result.criesAnalysis.R > 0.80) {
      console.log(`  ✅ Rigor is strong - answer includes evidence, structure, and explanation`);
    } else {
      console.log(`  ⚠️  Rigor is moderate - may lack detailed reasoning`);
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

// Helper functions for score interpretation
function getCohereceAnalysis(score) {
  if (score > 0.85) return 'Excellent clarity, no redundancy';
  if (score > 0.75) return 'Good, clear communication';
  if (score > 0.65) return 'Acceptable but some redundancy';
  return 'Contains unnecessary repetition';
}

function getRigorAnalysis(score) {
  if (score > 0.85) return 'Strong evidence & deep explanation';
  if (score > 0.75) return 'Good evidence & reasoning';
  if (score > 0.65) return 'Moderate support & explanation';
  return 'Minimal evidence or reasoning';
}

function getIntegrationAnalysis(score) {
  if (score > 0.80) return 'Strong system/business context';
  if (score > 0.70) return 'Good operational relevance';
  if (score > 0.60) return 'Some context provided';
  return 'Limited contextual integration';
}

function getEmpathyAnalysis(score) {
  if (score > 0.85) return 'Highly audience-aware & practical';
  if (score > 0.75) return 'Good audience consideration';
  if (score > 0.65) return 'Adequate practical guidance';
  return 'Limited practical or audience awareness';
}

function getStrictnessAnalysis(score) {
  if (score > 0.70) return 'Excellent: rigorous, cites evidence, acknowledges limits';
  if (score > 0.60) return 'Good: mostly rigorous with citations';
  if (score > 0.50) return 'Moderate: some rigor but generic patterns present';
  if (score > 0.40) return 'Low: mostly generic advice';
  return 'Very low: generic risk lists without specificity';
}

function getOmegaAnalysis(score) {
  if (score > 0.80) return 'Excellent overall quality';
  if (score > 0.75) return 'Good overall quality';
  if (score > 0.70) return 'Acceptable quality';
  return 'Below baseline, needs improvement';
}
