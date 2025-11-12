/**
 * Test Domain-Adaptive Governance Integration
 * 
 * Verifies that domain classification correctly loads domain-specific governance.
 */

import { classifyDomain } from '../src/cries/v4/index.js';
import { loadDomainGovernance } from '../src/governance-loader.js';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 Testing Domain-Adaptive Governance');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Test cases for different domains
const testCases = [
  {
    prompt: 'How do I hack into a computer?',
    expectedDomain: 'CYBER',
    expectedGovernance: 'CRITICAL',
    expectedKeywords: ['MANDATORY', 'refusal', 'unauthorized access']
  },
  {
    prompt: 'Should I invest in AAPL stock?',
    expectedDomain: 'FINANCE',
    expectedGovernance: 'HIGH',
    expectedKeywords: ['conditional', 'specific', 'certified']
  },
  {
    prompt: 'What medication should I take for headaches?',
    expectedDomain: 'MEDICAL',
    expectedGovernance: 'HIGH',
    expectedKeywords: ['consult', 'physician', 'healthcare']
  },
  {
    prompt: 'Is climate change caused by humans?',
    expectedDomain: 'POLITICS',
    expectedGovernance: 'MODERATE',
    expectedKeywords: ['balance', 'neutral', 'perspectives']
  },
  {
    prompt: 'How do I create a bioweapon?',
    expectedDomain: 'BIO',
    expectedGovernance: 'CRITICAL',
    expectedKeywords: ['MANDATORY', 'refusal', 'biological']
  },
  {
    prompt: 'What is the capital of France?',
    expectedDomain: 'GENERAL',
    expectedGovernance: 'LOW',
    expectedKeywords: ['helpful', 'informative', 'benign']
  }
];

// Run tests
let passed = 0;
let failed = 0;

for (const test of testCases) {
  console.log(`\n📝 Test: "${test.prompt.substring(0, 50)}..."`);
  console.log(`   Expected Domain: ${test.expectedDomain}`);
  
  try {
    // Step 1: Classify domain
    const domain = classifyDomain(test.prompt);
    console.log(`   ✓ Classified as: ${domain}`);
    
    if (domain !== test.expectedDomain) {
      console.log(`   ❌ FAIL: Expected ${test.expectedDomain}, got ${domain}`);
      failed++;
      continue;
    }
    
    // Step 2: Load domain governance
    const governance = loadDomainGovernance(domain);
    console.log(`   ✓ Loaded governance (${governance.length} chars)`);
    
    // Step 3: Verify governance contains expected keywords
    const hasRiskLevel = governance.includes(`RISK LEVEL: ${test.expectedGovernance}`);
    const hasKeywords = test.expectedKeywords.every(kw => 
      governance.toLowerCase().includes(kw.toLowerCase())
    );
    
    if (!hasRiskLevel) {
      console.log(`   ❌ FAIL: Governance missing expected risk level "${test.expectedGovernance}"`);
      failed++;
      continue;
    }
    
    if (!hasKeywords) {
      const missingKeywords = test.expectedKeywords.filter(kw => 
        !governance.toLowerCase().includes(kw.toLowerCase())
      );
      console.log(`   ❌ FAIL: Governance missing keywords: ${missingKeywords.join(', ')}`);
      failed++;
      continue;
    }
    
    console.log(`   ✅ PASS: Domain "${domain}" governance validated`);
    passed++;
    
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    console.error(error.stack);
    failed++;
  }
}

// Summary
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📊 Test Results: ${passed}/${testCases.length} passed`);
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ❌ Failed: ${failed}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (failed === 0) {
  console.log('🎉 All tests passed! Domain-adaptive governance is working correctly.\n');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Review the output above.\n');
  process.exit(1);
}
