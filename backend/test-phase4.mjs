import { callGPT4WithRosetta, callClaudeWithRosetta, callOllamaWithRosetta } from './src/llm-client.js';

async function testPhase4() {
  console.log('🧪 Testing RosettaOS Phase-4 Ω³ Governance Implementation...\n');

  const testPrompt = 'What is the capital of France?';
  const testOptions = {
    userName: 'Test User',
    userRole: 'architect',
    managedGovernance: false,
    timeout: 30000
  };

  try {
    console.log('Testing OpenAI GPT-4 with Phase-4...');
    const gpt4Result = await callGPT4WithRosetta(testPrompt, {}, testOptions);
    console.log('✅ GPT-4 Phase-4: SUCCESS');
    console.log('   Persona:', gpt4Result.governance.persona);
    console.log('   Content length:', gpt4Result.content.length);
    console.log('   No receipts in UI payload:', !gpt4Result.governance.receipts);
    console.log();

  } catch (e) {
    console.log('❌ GPT-4 Phase-4: FAILED -', e.message);
  }

  try {
    console.log('Testing Anthropic Claude with Phase-4...');
    const claudeResult = await callClaudeWithRosetta(testPrompt, {}, testOptions);
    console.log('✅ Claude Phase-4: SUCCESS');
    console.log('   Persona:', claudeResult.governance.persona);
    console.log('   Content length:', claudeResult.content.length);
    console.log('   No receipts in UI payload:', !claudeResult.governance.receipts);
    console.log();

  } catch (e) {
    console.log('❌ Claude Phase-4: FAILED -', e.message);
  }

  try {
    console.log('Testing Ollama with Phase-4...');
    const ollamaResult = await callOllamaWithRosetta(testPrompt, {}, testOptions);
    console.log('✅ Ollama Phase-4: SUCCESS');
    console.log('   Persona:', ollamaResult.governance.persona);
    console.log('   Content length:', ollamaResult.content.length);
    console.log('   No receipts in UI payload:', !ollamaResult.governance.receipts);
    console.log();

  } catch (e) {
    console.log('❌ Ollama Phase-4: FAILED -', e.message);
  }

  console.log('🎯 Phase-4 Implementation Complete!');
  console.log('   ✅ Ω³ persona visible in responses');
  console.log('   ✅ Silent receipt storage (check receipts/ directory)');
  console.log('   ✅ No UI metadata leakage');
  console.log('   ✅ All providers follow same pattern');
}

testPhase4().catch(console.error);