#!/usr/bin/env node

/**
 * Interactive Governance Optimizer Verification
 * Allows user to select models and test with custom prompts
 */

import axios from 'axios';
import readline from 'readline';

const BASE_URL = 'http://localhost:3001';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 GOVERNANCE OPTIMIZER - INTERACTIVE TEST');
  console.log('='.repeat(70) + '\n');

  try {
    // TEST 1: Server Health
    console.log('📋 Test 1: Server Health');
    const health = await axios.get(`${BASE_URL}/api/health`);
    console.log(`✅ Server is running`);
    console.log(`   Status: ${health.data.status}`);
    console.log(`   Service: ${health.data.service}`);
    console.log(`   Uptime: ${health.data.uptime}s\n`);

    // TEST 2: Get Available Models
    console.log('📋 Test 2: Available Models');
    const modelsRes = await axios.get(`${BASE_URL}/api/live-demo/models`);
    const availableModels = modelsRes.data.models || [];
    
    console.log(`✅ ${availableModels.length} models available:\n`);
    availableModels.forEach((m, idx) => {
      const modelName = m.name || m.id || 'Unknown';
      const govMark = m.governanceSupport ? '🛡️ ' : '  ';
      console.log(`   ${(idx + 1).toString().padStart(2)}. ${govMark}${modelName.padEnd(40)} (${m.provider})`);
    });

    // USER INPUT: Select models
    console.log('\n' + '─'.repeat(70));
    console.log('📋 Step 1: Select Models for Comparison\n');

    let standardModelId = null;
    let validStandardModel = false;

    while (!validStandardModel) {
      const standardInput = await question('Enter the number of the STANDARD model (1-' + availableModels.length + '): ');
      
      if (/^\d+$/.test(standardInput)) {
        const idx = parseInt(standardInput) - 1;
        if (idx >= 0 && idx < availableModels.length) {
          standardModelId = availableModels[idx].id;
          console.log(`✓ Selected: ${availableModels[idx].name || availableModels[idx].id}\n`);
          validStandardModel = true;
        } else {
          console.log(`❌ Invalid selection. Please enter a number between 1 and ${availableModels.length}\n`);
        }
      } else {
        const found = availableModels.find(m => m.id === standardInput);
        if (found) {
          standardModelId = standardInput;
          console.log(`✓ Selected: ${found.name || found.id}\n`);
          validStandardModel = true;
        } else {
          console.log(`❌ Model not found. Please enter a valid number or model ID\n`);
        }
      }
    }

    let rosettaModelId = null;
    let validRosettaModel = false;

    while (!validRosettaModel) {
      const rosettaInput = await question('Enter the number of the ROSETTA/GOVERNANCE model (1-' + availableModels.length + '): ');
      
      if (/^\d+$/.test(rosettaInput)) {
        const idx = parseInt(rosettaInput) - 1;
        if (idx >= 0 && idx < availableModels.length) {
          rosettaModelId = availableModels[idx].id;
          console.log(`✓ Selected: ${availableModels[idx].name || availableModels[idx].id}\n`);
          validRosettaModel = true;
        } else {
          console.log(`❌ Invalid selection. Please enter a number between 1 and ${availableModels.length}\n`);
        }
      } else {
        const found = availableModels.find(m => m.id === rosettaInput);
        if (found) {
          rosettaModelId = rosettaInput;
          console.log(`✓ Selected: ${found.name || found.id}\n`);
          validRosettaModel = true;
        } else {
          console.log(`❌ Model not found. Please enter a valid number or model ID\n`);
        }
      }
    }

    // USER INPUT: Get prompt
    console.log('─'.repeat(70));
    console.log('📋 Step 2: Enter Your Prompt\n');
    
    let userPrompt = await question('Enter your test prompt (or press Enter for default): ');
    if (!userPrompt || userPrompt.trim() === '') {
      userPrompt = 'What is the importance of AI governance and safety?';
      console.log(`Using default prompt: "${userPrompt}"\n`);
    } else {
      console.log();
    }

    // TEST 3: Parallel Prompt
    console.log('─'.repeat(70));
    console.log('📋 Step 3: Running Parallel Prompt Comparison\n');
    console.log('🔄 Sending prompt to both models...\n');

    const promptRes = await axios.post(
      `${BASE_URL}/api/live-demo/parallel-prompt`,
      {
        prompt: userPrompt,
        standardModelId: standardModelId,
        rosettaModelId: rosettaModelId,
        conversationId: `interactive-${Date.now()}`
      },
      { timeout: 120000 }
    );

    console.log('✅ Parallel Prompt completed successfully\n');

    // Display Standard Response
    if (promptRes.data.standardResponse) {
      const std = promptRes.data.standardResponse;
      const stdModel = availableModels.find(m => m.id === standardModelId);
      
      console.log('═'.repeat(70));
      console.log('📊 STANDARD LLM RESPONSE');
      console.log('═'.repeat(70));
      console.log(`Model: ${stdModel?.name || std.model}`);
      console.log(`Provider: ${std.provider}`);
      console.log(`Tokens: ${std.usage?.totalTokens || 'N/A'}`);
      
      if (std.cries) {
        console.log(`\nCRIES Metrics:`);
        console.log(`  Overall Score: ${(std.cries.overall * 100).toFixed(1)}%`);
        if (std.cries.C !== undefined) console.log(`  Completeness: ${(std.cries.C * 100).toFixed(1)}%`);
        if (std.cries.R !== undefined) console.log(`  Reliability: ${(std.cries.R * 100).toFixed(1)}%`);
        if (std.cries.I !== undefined) console.log(`  Integrity: ${(std.cries.I * 100).toFixed(1)}%`);
        if (std.cries.E !== undefined) console.log(`  Ethics: ${(std.cries.E * 100).toFixed(1)}%`);
        if (std.cries.S !== undefined) console.log(`  Safety: ${(std.cries.S * 100).toFixed(1)}%`);
      }
      
      console.log(`\nResponse Preview:`);
      console.log(`${std.content?.substring(0, 300)}...`);
    }

    // Display Rosetta Response
    if (promptRes.data.rosettaResponse) {
      const ros = promptRes.data.rosettaResponse;
      const rosModel = availableModels.find(m => m.id === rosettaModelId);
      
      console.log('\n' + '═'.repeat(70));
      console.log('🛡️  ROSETTA/GOVERNED LLM RESPONSE');
      console.log('═'.repeat(70));
      console.log(`Model: ${rosModel?.name || ros.model}`);
      console.log(`Provider: ${ros.provider}`);
      console.log(`Governance Applied: ${ros.governanceApplied ? '✓ YES' : 'NO'}`);
      console.log(`Tokens: ${ros.usage?.totalTokens || 'N/A'}`);
      
      if (ros.cries) {
        console.log(`\nCRIES Metrics:`);
        console.log(`  Overall Score: ${(ros.cries.overall * 100).toFixed(1)}%`);
        if (ros.cries.C !== undefined) console.log(`  Completeness: ${(ros.cries.C * 100).toFixed(1)}%`);
        if (ros.cries.R !== undefined) console.log(`  Reliability: ${(ros.cries.R * 100).toFixed(1)}%`);
        if (ros.cries.I !== undefined) console.log(`  Integrity: ${(ros.cries.I * 100).toFixed(1)}%`);
        if (ros.cries.E !== undefined) console.log(`  Ethics: ${(ros.cries.E * 100).toFixed(1)}%`);
        if (ros.cries.S !== undefined) console.log(`  Safety: ${(ros.cries.S * 100).toFixed(1)}%`);
      }
      
      console.log(`\nResponse Preview:`);
      console.log(`${ros.content?.substring(0, 300)}...`);
    }

    // Display Comparison
    if (promptRes.data.criesImprovement !== undefined) {
      const improvement = (promptRes.data.criesImprovement * 100).toFixed(1);
      console.log('\n' + '═'.repeat(70));
      console.log('🎯 GOVERNANCE IMPROVEMENT');
      console.log('═'.repeat(70));
      console.log(`CRIES Score Improvement: +${improvement}%`);
      console.log(`This represents the increase in quality from governance enforcement`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Test completed successfully!');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data?.message || error.message);
    if (error.response?.status === 404) {
      console.error('   Make sure the server is running: pnpm start');
    }
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Run the main function
main().catch(err => {
  console.error('Fatal error:', err);
  rl.close();
  process.exit(1);
});
