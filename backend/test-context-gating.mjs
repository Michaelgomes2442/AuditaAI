#!/usr/bin/env node

import { callGPT4WithRosetta } from './src/llm-client.js';

const financePrompt = `A mid-size finance company wants to deploy an internal AI assistant to help analysts interpret market movements, summarize economic reports, and check for red flags in client portfolios. What are the biggest risks they should worry about, and how can the company reduce those risks without slowing down productivity?`;

console.log('🧪 Testing Context-Gating Strategy\n');
console.log('📋 Prompt:', financePrompt);
console.log('\n' + '='.repeat(80) + '\n');

try {
  const result = await callGPT4WithRosetta(financePrompt, {
    domain: 'FINANCE',
    userName: 'TestUser',
    userRole: 'Architect'
  }, {
    model: 'gpt-4o',
    timeout: 120000
  });

  console.log('RESPONSE:\n');
  console.log(result.response);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
