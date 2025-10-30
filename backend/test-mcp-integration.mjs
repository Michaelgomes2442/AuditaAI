/**
 * Test MCP Integration with LLM Client
 * Phase 3: Verify RosettaOS MCP tools work in LLM pipeline
 */

import { callOllamaWithRosetta } from './src/llm-client.js';

async function testMCPIntegration() {
  console.log('🧪 Testing MCP Integration with LLM Pipeline...\n');

  try {
    // Test with a simple prompt
    const prompt = 'Hello, how are you?';
    console.log(`📝 Test Prompt: "${prompt}"\n`);

    // Call Ollama with Rosetta (which should now use MCP tools)
    const result = await callOllamaWithRosetta(prompt, {
      model: 'llama3.1:8b',
      timeout: 10000 // Short timeout for testing
    });

    console.log('✅ MCP Integration Test Successful!');
    console.log('📊 Response length:', result.response?.length || 0, 'characters');

    // Check if governance data includes MCP values
    if (result.governance) {
      console.log('🎯 Governance data present');
      console.log('   Receipts count:', result.governance.receipts?.length || 0);
      console.log('   Lamport value:', result.governance.lamport);
      console.log('   Context version:', result.governance.context?.version);
    } else {
      console.log('⚠️  No governance data found');
    }

  } catch (error) {
    console.error('❌ MCP Integration Test Failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testMCPIntegration();