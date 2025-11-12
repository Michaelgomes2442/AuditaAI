#!/usr/bin/env node
/**
 * TRUE GOVERNANCE v5.0 Validation Script
 * 
 * Tests that new governance system:
 * 1. Prevents hallucinated statistics
 * 2. Enforces conservative assumptions
 * 3. Maintains deterministic structure
 * 4. Reduces speculative claims
 * 5. Requires uncertainty acknowledgment
 */

import { executeGovernedLLMCall } from './src/audit-orchestrator.js';

const TEST_PROMPTS = [
  {
    name: 'AI Risk Prompt (Finance Domain)',
    prompt: 'What are the key risks of using LLMs in financial services?',
    domain: 'FINANCE',
    hallucination_checks: [
      {
        pattern: /\d+%.*\[.*20\d{2}\]/,  // Stats with fake citations
        name: 'Invented statistics with citations',
        should_not_match: true
      },
      {
        pattern: /hallucination rate.*\d+.*%/i,
        name: 'Specific hallucination rates',
        should_not_match: true
      },
      {
        pattern: /\$\d+[KM]?-\$\d+[KM]?/,  // Cost ranges
        name: 'Fabricated cost estimates',
        should_not_match: true
      },
      {
        pattern: /\d+-\d+\s+(FTE|weeks|months)/i,
        name: 'Invented resource/time estimates',
        should_not_match: true
      }
    ],
    required_patterns: [
      {
        pattern: /(consult|recommend|varies|depend)/i,
        name: 'Conservative language',
        should_match: true
      },
      {
        pattern: /(uncertain|unknown|specific|situation)/i,
        name: 'Uncertainty acknowledgment',
        should_match: true
      }
    ]
  },
  {
    name: 'Generic Question (General Domain)',
    prompt: 'How do I improve software security?',
    domain: 'GENERAL',
    structure_checks: [
      {
        check: (response) => !response.match(/^#{1,6}\s/m),  // No markdown headers
        name: 'No added structure (headers)',
        should_pass: true
      },
      {
        check: (response) => response.length < 1500,  // Concise
        name: 'Concise response (< 1500 chars)',
        should_pass: true
      },
      {
        check: (response) => !response.includes('Executive Summary'),
        name: 'No consultant sections',
        should_pass: true
      }
    ]
  }
];

async function runGovernanceValidation() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('TRUE GOVERNANCE v5.0 VALIDATION TEST');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const testCase of TEST_PROMPTS) {
    console.log(`\n🧪 TEST: ${testCase.name}`);
    console.log(`   Prompt: "${testCase.prompt}"`);
    console.log(`   Domain: ${testCase.domain || 'AUTO-DETECT'}\n`);

    try {
      // Execute with governance
      const result = await executeGovernedLLMCall({
        prompt: testCase.prompt,
        model: 'gpt-4o-mini',  // Use cheap model for testing
        useGovernance: true,
        userId: 'governance-validator',
        conversationId: `test-${Date.now()}`
      });

      const response = result.response;
      console.log(`   ✅ LLM Call Successful`);
      console.log(`   Response Length: ${response.length} chars`);
      console.log(`   CRIES Omega: ${result.cries.Omega.toFixed(3)}\n`);

      // Run hallucination checks
      if (testCase.hallucination_checks) {
        console.log(`   🔍 HALLUCINATION CHECKS:`);
        for (const check of testCase.hallucination_checks) {
          totalTests++;
          const matches = response.match(check.pattern);
          const passed = check.should_not_match ? !matches : !!matches;

          if (passed) {
            console.log(`      ✅ ${check.name}: PASS`);
            passedTests++;
          } else {
            console.log(`      ❌ ${check.name}: FAIL`);
            if (matches) {
              console.log(`         Found: "${matches[0]}"`);
            }
            failedTests++;
          }
        }
      }

      // Run required pattern checks
      if (testCase.required_patterns) {
        console.log(`\n   📋 REQUIRED PATTERN CHECKS:`);
        for (const check of testCase.required_patterns) {
          totalTests++;
          const matches = response.match(check.pattern);
          const passed = check.should_match ? !!matches : !matches;

          if (passed) {
            console.log(`      ✅ ${check.name}: PASS`);
            passedTests++;
          } else {
            console.log(`      ❌ ${check.name}: FAIL`);
            failedTests++;
          }
        }
      }

      // Run structure checks
      if (testCase.structure_checks) {
        console.log(`\n   🏗️  STRUCTURE CHECKS:`);
        for (const check of testCase.structure_checks) {
          totalTests++;
          const passed = check.check(response) === check.should_pass;

          if (passed) {
            console.log(`      ✅ ${check.name}: PASS`);
            passedTests++;
          } else {
            console.log(`      ❌ ${check.name}: FAIL`);
            failedTests++;
          }
        }
      }

      // Show response preview
      console.log(`\n   📄 RESPONSE PREVIEW:`);
      console.log(`   ${'-'.repeat(60)}`);
      const preview = response.substring(0, 300);
      console.log(`   ${preview}${response.length > 300 ? '...' : ''}`);
      console.log(`   ${'-'.repeat(60)}`);

    } catch (error) {
      console.error(`   ❌ Test Failed: ${error.message}`);
      failedTests++;
      totalTests++;
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('VALIDATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${failedTests} ❌`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 ALL GOVERNANCE TESTS PASSED!');
    console.log('TRUE GOVERNANCE v5.0 is working correctly.\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  SOME GOVERNANCE TESTS FAILED');
    console.log('Review failures above and adjust governance constraints.\n');
    process.exit(1);
  }
}

// Run validation
runGovernanceValidation().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
