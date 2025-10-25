// Accessibility and regression test stubs
function checkAccessibility(response) {
  // Check for unsafe HTML/script tags
  const unsafe = /<script|<img|<iframe|onerror|onload|javascript:/i.test(response);
  if (unsafe) {
    console.log('   ⚠️ Accessibility: Unsafe content detected!');
  } else {
    console.log('   ✅ Accessibility: No unsafe content detected.');
  }
}

function checkCRIESRegression(current, baseline) {
  // Compare CRIES scores for regression
  if (!baseline) return;
  const keys = ['C', 'R', 'I', 'E', 'S', 'overall'];
  let regress = false;
  keys.forEach(k => {
    if (current[k] < baseline[k] - 0.05) {
      regress = true;
      console.log(`   ⚠️ Regression detected in ${k}: ${current[k]} < baseline ${baseline[k]}`);
    }
  });
  if (!regress) {
    console.log('   ✅ No CRIES regression detected.');
  }
}

/**
 * Test LLM API Integration
 * 
 * Tests that API keys are configured and LLM calls work correctly.
 * Run with: node test-llm-integration.mjs
 */

import { 
  checkAPIAvailability, 
  callGPT4, 
  callClaude,
  callGPT4WithRosetta,
  callClaudeWithRosetta
} from './src/llm-client.js';

async function main() {
  console.log('🧪 Testing LLM API Integration\n');
  
  // 1. Check API availability
  console.log('1️⃣ Checking API availability...');
  const apiStatus = await checkAPIAvailability();
  console.log('   OpenAI:', apiStatus.openai ? '✅ Available' : '❌ Not configured');
  console.log('   Anthropic:', apiStatus.anthropic ? '✅ Available' : '❌ Not configured');
  console.log('   At least one API:', apiStatus.hasAnyAPI ? '✅ Yes' : '❌ No\n');
  
  if (!apiStatus.hasAnyAPI) {
    console.log('\n⚠️  No API keys configured!');
    console.log('   Please configure at least one API key in .env file:');
    console.log('   - OPENAI_API_KEY=sk-proj-...');
    console.log('   - ANTHROPIC_API_KEY=sk-ant-...\n');
    console.log('   See API_SETUP.md for detailed instructions.\n');
    process.exit(1);
  }
  
  // 2. Test OpenAI (if available)
  if (apiStatus.openai) {
    console.log('\n2️⃣ Testing OpenAI GPT-4...');
    try {
      const testPrompt = 'What is 2+2? Answer in one sentence.';
      console.log(`   Prompt: "${testPrompt}"`);
      
      const result = await callGPT4(testPrompt, { max_tokens: 50 });
      console.log('   ✅ Success!');
      console.log(`   Response: ${result.content.substring(0, 100)}...`);
      console.log(`   Tokens: ${result.usage.total_tokens} (${result.usage.prompt_tokens} prompt + ${result.usage.completion_tokens} completion)`);
      checkAccessibility(result.content);
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }
  }
  
  // 3. Test Anthropic (if available)
  if (apiStatus.anthropic) {
    console.log('\n3️⃣ Testing Anthropic Claude...');
    try {
      const testPrompt = 'What is 2+2? Answer in one sentence.';
      console.log(`   Prompt: "${testPrompt}"`);
      
      const result = await callClaude(testPrompt, { max_tokens: 50 });
      console.log('   ✅ Success!');
      console.log(`   Response: ${result.content.substring(0, 100)}...`);
      console.log(`   Tokens: ${result.usage.total_tokens} (${result.usage.prompt_tokens} prompt + ${result.usage.completion_tokens} completion)`);
      checkAccessibility(result.content);
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }
  }
  
  // 4. Test Rosetta Governance
  console.log('\n4️⃣ Testing Rosetta Governance...');
  try {
    const testPrompt = 'List 3 benefits of exercise.';
    console.log(`   Prompt: "${testPrompt}"`);
    
    let result;
    if (apiStatus.openai) {
      console.log('   Using: GPT-4 with Rosetta governance');
      result = await callGPT4WithRosetta(testPrompt);
    } else if (apiStatus.anthropic) {
      console.log('   Using: Claude with Rosetta governance');
      result = await callClaudeWithRosetta(testPrompt);
    }
    
    console.log('   ✅ Success!');
    console.log(`   Response length: ${result.content.length} characters`);
    console.log(`   First 200 chars: ${result.content.substring(0, 200)}...`);
    console.log(`   Tokens: ${result.usage.total_tokens}`);
    checkAccessibility(result.content);
    // Example regression check (baseline CRIES can be loaded from file/db)
    // checkCRIESRegression(result.cries, baselineCRIES);
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
  
  console.log('\n✅ LLM API integration test complete!\n');
  console.log('Next steps:');
  console.log('  1. Start backend: npm run dev');
  console.log('  2. Test parallel prompting: curl http://localhost:3001/api/chat/parallel-prompt');
  console.log('  3. Compare CRIES scores between standard and Rosetta modes\n');
}

main().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
