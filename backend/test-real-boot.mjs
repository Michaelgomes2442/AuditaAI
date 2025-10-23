#!/usr/bin/env node
/**
 * Test real Rosetta boot sequence
 * Simulates uploading Rosetta.html to Ollama and saying "boot"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testRosettaBoot() {
  console.log('🚀 Testing Real Rosetta Boot Sequence\n');
  
  // 1. Load Rosetta.html
  const rosettaPath = path.join(__dirname, '../workspace/CORE/Rosetta.html');
  console.log('📂 Loading Rosetta.html from:', rosettaPath);
  
  const rosettaContent = fs.readFileSync(rosettaPath, 'utf-8');
  console.log(`✅ Loaded: ${rosettaContent.length} characters (${(rosettaContent.length / 1024 / 1024).toFixed(2)} MB)\n`);
  
  // 2. Send to Ollama with "boot" command
  console.log('📤 Sending to Ollama with boot command...\n');
  
  const bootPrompt = `${rosettaContent}\n\nboot`;
  
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:3b',
        prompt: bootPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 500
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }
    
    const data = await response.json();
    const bootResponse = data.response;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🤖 OLLAMA BOOT RESPONSE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(bootResponse);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // 3. Now send a test prompt to the booted session
    console.log('📝 Sending test prompt to booted session...\n');
    
    const testPrompt = 'Explain 2+2 briefly';
    
    const promptResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:3b',
        prompt: testPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 500
        }
      })
    });
    
    const promptData = await promptResponse.json();
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🤖 RESPONSE TO PROMPT:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(promptData.response);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('✅ Boot test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testRosettaBoot();
