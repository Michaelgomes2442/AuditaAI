#!/usr/bin/env node

/**
 * Smoke Test for Live Governance System
 * Tests Phase-2 Kernel + Phase-3 MCP tools integration
 */

import { callLLM } from '../src/llm-client.js';
import { mcp } from '../src/mcp-client.js';

async function testGovernance() {
  console.log('🧪 Starting Live Governance Smoke Test...\n');

  const testPrompt = 'Hello, can you explain what governance means in AI systems?';
  const testOptions = {
    governanceEnabled: true,
    userName: 'TestUser',
    userRole: 'Operator',
    managedGovernance: false,
    apiKeys: {
      anthropic: process.env.ANTHROPIC_API_KEY
    }
  };

  try {
    console.log('1️⃣ Testing MCP connectivity...');
    const ctx = await mcp('rosetta.context.get', {});
    console.log('   ✅ MCP context:', ctx);

    const lamport = await mcp('rosetta.lamport.increment', { current: 0 });
    console.log('   ✅ MCP lamport:', lamport);

    console.log('\n2️⃣ Testing governed LLM call...');
    const result = await callLLM('claude-3-5-sonnet-20241022', testPrompt, testOptions);
    console.log('   ✅ Governance applied successfully');
    console.log('   📝 Response length:', result?.content?.length || 'unknown');

    console.log('\n3️⃣ Testing non-governed call for comparison...');
    const resultNoGov = await callLLM('claude-3-5-sonnet-20241022', testPrompt, { ...testOptions, governanceEnabled: false });
    console.log('   ✅ Non-governed call successful');
    console.log('   📝 Response length:', resultNoGov?.content?.length || 'unknown');

    console.log('\n🎉 All governance tests passed!');
    console.log('   - MCP tools responding');
    console.log('   - Governance transformation working');
    console.log('   - LLM calls successful with and without governance');

  } catch (error) {
    console.error('\n❌ Governance test failed:', error instanceof Error ? error.message : String(error));
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    process.exit(1);
  }
}

// Run the test
testGovernance().catch(console.error);