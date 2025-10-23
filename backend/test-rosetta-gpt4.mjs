#!/usr/bin/env node
/**
 * Test real Rosetta boot sequence with GPT-4
 * This will show us how the boot SHOULD work
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OPENAI_API_KEY = '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';

async function testRosettaBootGPT4() {
  console.log('🚀 Testing Real Rosetta Boot Sequence with GPT-4\n');
  
  // 1. Load Rosetta.html
  const rosettaPath = path.join(__dirname, '../workspace/CORE/Rosetta.html');
  console.log('📂 Loading Rosetta.html from:', rosettaPath);
  
  const rosettaContent = fs.readFileSync(rosettaPath, 'utf-8');
  console.log(`✅ Loaded: ${rosettaContent.length} characters (${(rosettaContent.length / 1024 / 1024).toFixed(2)} MB)\n`);
  
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  
  try {
    // 2. Send Rosetta.html + "boot" command to GPT-4
    console.log('📤 Sending to GPT-4 with boot command...\n');
    console.log('⏳ This may take 30-60 seconds due to the large context...\n');
    
    const bootCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using mini for faster/cheaper testing
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
      temperature: 0.7,
      max_tokens: 1000
    });
    
    const bootResponse = bootCompletion.choices[0].message.content;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🤖 GPT-4 BOOT RESPONSE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(bootResponse);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(`📊 Tokens used: ${bootCompletion.usage.total_tokens} (prompt: ${bootCompletion.usage.prompt_tokens}, completion: ${bootCompletion.usage.completion_tokens})\n`);
    
    // 3. Continue conversation with test prompt
    console.log('📝 Sending test prompt: "Explain 2+2 briefly"...\n');
    
    const promptCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
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
          content: bootResponse
        },
        {
          role: 'user',
          content: 'Explain 2+2 briefly'
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });
    
    const promptResponse = promptCompletion.choices[0].message.content;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🤖 GPT-4 RESPONSE TO PROMPT (After Boot):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(promptResponse);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(`📊 Tokens used: ${promptCompletion.usage.total_tokens}\n`);
    
    console.log('✅ Boot test complete!');
    console.log('\n💡 Now we understand how Rosetta boot should work!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

testRosettaBootGPT4();
