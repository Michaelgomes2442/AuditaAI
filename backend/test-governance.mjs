#!/usr/bin/env node

/**
 * Governance Optimizer Test - Simple Mode
 * Usage: node test-governance.mjs <standardModelId> <rosettaModelId> [prompt]
 * 
 * If no arguments provided, launches interactive mode
 */

import axios from 'axios';
import { argv } from 'process';
import readline from 'readline';

const BASE_URL = 'http://localhost:3001';

async function interactiveMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => {
    return new Promise((resolve) => {
      rl.question(prompt, (answer) => {
        resolve(answer);
      });
    });
  };

  try {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 GOVERNANCE OPTIMIZER - INTERACTIVE TEST');
    console.log('='.repeat(70) + '\n');

    // Get available models
    console.log('📋 Fetching available models...\n');
    const modelsRes = await axios.get(`${BASE_URL}/api/live-demo/models`);
    const availableModels = modelsRes.data.models || [];
    
    console.log(`✅ ${availableModels.length} models available:\n`);
    availableModels.forEach((m, idx) => {
      const modelName = m.name || m.id || 'Unknown';
      const govMark = m.governanceSupport ? '🛡️ ' : '  ';
      console.log(`   ${(idx + 1).toString().padStart(2)}. ${govMark}${modelName.padEnd(40)} (${m.provider})`);
    });

    // Select standard model
    console.log('\n─'.repeat(70));
    let standardModelId = null;
    let validStandard = false;
    
    while (!validStandard) {
      const input = await question('\nEnter STANDARD model number or ID: ');
      if (/^\d+$/.test(input)) {
        const idx = parseInt(input) - 1;
        if (idx >= 0 && idx < availableModels.length) {
          standardModelId = availableModels[idx].id;
          console.log(`✓ Selected: ${availableModels[idx].name || availableModels[idx].id}`);
          validStandard = true;
        }
      } else {
        const found = availableModels.find(m => m.id === input);
        if (found) {
          standardModelId = input;
          console.log(`✓ Selected: ${found.name || found.id}`);
          validStandard = true;
        }
      }
      if (!validStandard) console.log('❌ Invalid selection');
    }

    // Select rosetta model
    let rosettaModelId = null;
    let validRosetta = false;
    
    while (!validRosetta) {
      const input = await question('\nEnter ROSETTA/GOVERNANCE model number or ID: ');
      if (/^\d+$/.test(input)) {
        const idx = parseInt(input) - 1;
        if (idx >= 0 && idx < availableModels.length) {
          rosettaModelId = availableModels[idx].id;
          console.log(`✓ Selected: ${availableModels[idx].name || availableModels[idx].id}`);
          validRosetta = true;
        }
      } else {
        const found = availableModels.find(m => m.id === input);
        if (found) {
          rosettaModelId = input;
          console.log(`✓ Selected: ${found.name || found.id}`);
          validRosetta = true;
        }
      }
      if (!validRosetta) console.log('❌ Invalid selection');
    }

    // Get prompt
    console.log('\n─'.repeat(70));
    let userPrompt = await question('\nEnter your prompt (or press Enter for default): ');
    if (!userPrompt || userPrompt.trim() === '') {
      userPrompt = 'What is AI governance and why is it important?';
    }

    rl.close();
    
    // Run test
    await runComparison(standardModelId, rosettaModelId, userPrompt, availableModels);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

async function cliMode(standardId, rosettaId, prompt) {
  // Non-interactive mode from CLI arguments
  console.log('\n' + '='.repeat(70));
  console.log('🚀 GOVERNANCE OPTIMIZER - CLI TEST');
  console.log('='.repeat(70) + '\n');
  
  console.log(`📋 Configuration:`);
  console.log(`   Standard Model: ${standardId}`);
  console.log(`   Rosetta Model: ${rosettaId}`);
  console.log(`   Prompt: ${prompt}\n`);

  const modelsRes = await axios.get(`${BASE_URL}/api/live-demo/models`);
  const availableModels = modelsRes.data.models || [];

  await runComparison(standardId, rosettaId, prompt, availableModels);
}

async function runComparison(standardModelId, rosettaModelId, userPrompt, availableModels) {
  try {
    console.log('─'.repeat(70));
    console.log('📋 Running Parallel Prompt Comparison\n');
    console.log('🔄 Sending prompt to both models...\n');

    const promptRes = await axios.post(
      `${BASE_URL}/api/live-demo/parallel-prompt`,
      {
        prompt: userPrompt,
        standardModelId: standardModelId,
        rosettaModelId: rosettaModelId,
        conversationId: `test-${Date.now()}`
      },
      { timeout: 120000 }
    );

    console.log('✅ Comparison completed successfully\n');

    // Display Standard Response
    if (promptRes.data.standardResponse) {
      const std = promptRes.data.standardResponse;
      const stdModel = availableModels.find(m => m.id === standardModelId);
      
      console.log('═'.repeat(70));
      console.log('📊 STANDARD LLM');
      console.log('═'.repeat(70));
      console.log(`Model: ${stdModel?.name || std.model}`);
      console.log(`Provider: ${std.provider}`);
      console.log(`Tokens: ${std.usage?.totalTokens || 'N/A'}`);
      
      if (std.cries) {
        console.log(`\nCRIES Score: ${(std.cries.overall * 100).toFixed(1)}%`);
        console.log(`Components:`);
        if (std.cries.C !== undefined) console.log(`  • Completeness: ${(std.cries.C * 100).toFixed(1)}%`);
        if (std.cries.R !== undefined) console.log(`  • Reliability: ${(std.cries.R * 100).toFixed(1)}%`);
        if (std.cries.I !== undefined) console.log(`  • Integrity: ${(std.cries.I * 100).toFixed(1)}%`);
        if (std.cries.E !== undefined) console.log(`  • Ethics: ${(std.cries.E * 100).toFixed(1)}%`);
        if (std.cries.S !== undefined) console.log(`  • Safety: ${(std.cries.S * 100).toFixed(1)}%`);
      }
      
      console.log(`\nResponse: ${std.content?.substring(0, 250)}...`);
    }

    // Display Rosetta Response
    if (promptRes.data.rosettaResponse) {
      const ros = promptRes.data.rosettaResponse;
      const rosModel = availableModels.find(m => m.id === rosettaModelId);
      
      console.log('\n' + '═'.repeat(70));
      console.log('🛡️  ROSETTA/GOVERNED LLM');
      console.log('═'.repeat(70));
      console.log(`Model: ${rosModel?.name || ros.model}`);
      console.log(`Provider: ${ros.provider}`);
      console.log(`Governance Applied: ${ros.governanceApplied ? '✓ YES' : 'NO'}`);
      console.log(`Tokens: ${ros.usage?.totalTokens || 'N/A'}`);
      
      if (ros.cries) {
        console.log(`\nCRIES Score: ${(ros.cries.overall * 100).toFixed(1)}%`);
        console.log(`Components:`);
        if (ros.cries.C !== undefined) console.log(`  • Completeness: ${(ros.cries.C * 100).toFixed(1)}%`);
        if (ros.cries.R !== undefined) console.log(`  • Reliability: ${(ros.cries.R * 100).toFixed(1)}%`);
        if (ros.cries.I !== undefined) console.log(`  • Integrity: ${(ros.cries.I * 100).toFixed(1)}%`);
        if (ros.cries.E !== undefined) console.log(`  • Ethics: ${(ros.cries.E * 100).toFixed(1)}%`);
        if (ros.cries.S !== undefined) console.log(`  • Safety: ${(ros.cries.S * 100).toFixed(1)}%`);
      }
      
      console.log(`\nResponse: ${ros.content?.substring(0, 250)}...`);
    }

    // Display Improvement
    if (promptRes.data.criesImprovement !== undefined) {
      const improvement = (promptRes.data.criesImprovement * 100).toFixed(1);
      console.log('\n' + '═'.repeat(70));
      console.log('🎯 GOVERNANCE IMPROVEMENT');
      console.log('═'.repeat(70));
      console.log(`CRIES Score Increase: +${improvement}%`);
      console.log('\nGovernance enforcement improved response quality by governance rules');
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Test completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data?.message || error.message);
    if (error.response?.status === 404) {
      console.error('   Model not found. Make sure to use valid model IDs from the list.');
    }
    process.exit(1);
  }
}

// Main entry point
const args = argv.slice(2);

if (args.length === 0) {
  // Interactive mode
  interactiveMode();
} else if (args.length >= 2) {
  // CLI mode
  const standardId = args[0];
  const rosettaId = args[1];
  const prompt = args[2] || 'What is the importance of AI governance?';
  
  cliMode(standardId, rosettaId, prompt);
} else {
  console.log(`\n📖 Usage:\n`);
  console.log(`  Interactive Mode (no arguments):`);
  console.log(`    node test-governance.mjs\n`);
  console.log(`  CLI Mode:`);
  console.log(`    node test-governance.mjs <standardModelId> <rosettaModelId> [prompt]\n`);
  console.log(`  Example:`);
  console.log(`    node test-governance.mjs claude-3-5-haiku-20241022 claude-3-5-haiku-20241022-rosetta "What is AI safety?"\n`);
  process.exit(1);
}
