/**
 * Test MCP Tools Directly
 * Phase 3: Verify all RosettaOS MCP tools work correctly
 */

import { mcp } from './src/mcp-client.js';

async function testMCPTools() {
  console.log('🧪 Testing All MCP Tools Directly...\n');

  const tests = [
    {
      name: 'Context Get',
      tool: 'rosetta.context.get',
      input: {},
      expected: (result) => result.version && result.witness
    },
    {
      name: 'Lamport Increment',
      tool: 'rosetta.lamport.increment',
      input: { current: 0 },
      expected: (result) => typeof result.next === 'number' && result.next > 0
    },
    {
      name: 'Receipt Emit',
      tool: 'rosetta.receipt.emit',
      input: {
        type: 'test',
        lamport: 1,
        payload: { test: true },
        prev_hash: '0000000000000000000000000000000000000000000000000000000000000000'
      },
      expected: (result) => result.id && result.hash
    },
    {
      name: 'Hash Verify',
      tool: 'rosetta.hash.verify',
      input: {
        data: 'test',
        expected: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
      },
      expected: (result) => result.ok === true
    },
    {
      name: 'CRIES Score',
      tool: 'rosetta.cries.score',
      input: { text: 'This is a test message for CRIES scoring.' },
      expected: (result) => result.coherence !== undefined && result.rigor !== undefined
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`🔧 Testing ${test.name}...`);
      const result = await mcp(test.tool, test.input);

      if (test.expected(result)) {
        console.log(`   ✅ PASSED - Result:`, JSON.stringify(result).slice(0, 100) + '...');
        passed++;
      } else {
        console.log(`   ❌ FAILED - Unexpected result:`, result);
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ FAILED - Error: ${error.message}`);
      failed++;
    }
    console.log('');
  }

  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('🎉 All MCP tools are working correctly!');
    console.log('🚀 Phase 3 RosettaOS MCP integration is complete!');
  } else {
    console.log('⚠️  Some MCP tools need attention.');
  }
}

// Run the tests
testMCPTools();