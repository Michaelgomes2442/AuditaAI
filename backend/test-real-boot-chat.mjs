#!/usr/bin/env node
/**
 * Test real Rosetta boot sequence with CHAT API
 * Uses /api/chat to maintain conversation context
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testRosettaBootWithChat() {
  console.log('🚀 Testing Real Rosetta Boot Sequence (Chat API)\n');
  
  // 1. Load Rosetta.html
  const rosettaPath = path.join(__dirname, '../workspace/CORE/Rosetta.html');
  console.log('📂 Loading Rosetta.html from:', rosettaPath);
  
  const rosettaContent = fs.readFileSync(rosettaPath, 'utf-8');
  console.log(`✅ Loaded: ${rosettaContent.length} characters (${(rosettaContent.length / 1024 / 1024).toFixed(2)} MB)\n`);
  
  // 2. Send to Ollama CHAT API with "boot" command
  console.log('📤 Sending to Ollama Chat API with boot command...\n');
  
  try {
    const bootResponse = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:3b',
        messages: [
          {
            role: 'user',
            content: rosettaContent
          },
          {
            role: 'user',
            content: 'boot'
          }
        ],
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 500
        }
      })
    });
    
    if (!bootResponse.ok) {
      throw new Error(`Ollama error: ${bootResponse.status}`);
    }
    
    const bootData = await bootResponse.json();
    const bootMsg = bootData.message.content;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🤖 OLLAMA BOOT RESPONSE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(bootMsg);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // 3. Continue conversation with test prompt
    console.log('📝 Sending test prompt in same session...\n');
    
    const promptResponse = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:3b',
        messages: [
          {
            role: 'user',
            content: rosettaContent
          },
          {
            role: 'user',
            content: 'boot'
          },
          {
            role: 'assistant',
            content: bootMsg
          },
          {
            role: 'user',
            content: 'Explain 2+2 briefly'
          }
        ],
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 500
        }
      })
    });
    
    const promptData = await promptResponse.json();
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🤖 RESPONSE TO PROMPT (After Boot):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(promptData.message.content);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('✅ Boot test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testRosettaBootWithChat();
