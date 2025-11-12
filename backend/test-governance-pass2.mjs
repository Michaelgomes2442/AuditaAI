#!/usr/bin/env node

import { callGPT4WithRosetta } from './src/llm-client.js';

// Finance company AI assistant prompt - generic context challenge
const financePrompt = `We're building an AI assistant for a financial services company. What are the key risks we need to address when deploying LLM-based systems in a finance/compliance-heavy environment?`;

console.log('='.repeat(80));
console.log('TESTING TWO-PASS GOVERNANCE SYSTEM');
console.log('='.repeat(80));
console.log(`\n📋 Prompt: ${financePrompt}\n`);
console.log('Starting governance-enhanced call with Pass 1 + Pass 2 refinement...\n');

try {
  const result = await callGPT4WithRosetta(financePrompt, {
    domain: 'FINANCE',
    userName: 'TestUser',
    userRole: 'Architect'
  }, {
    model: 'gpt-4o',
    timeout: 120000
  });

  console.log('\n' + '='.repeat(80));
  console.log('FINAL RESPONSE');
  console.log('='.repeat(80));
  console.log(`\nLength: ${result.response?.length || 0} characters\n`);
  console.log(result.response);
  
  if (result.criesAnalysis) {
    console.log('\n' + '='.repeat(80));
    console.log('CRIES ANALYSIS');
    console.log('='.repeat(80));
    console.log(JSON.stringify(result.criesAnalysis, null, 2));
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
