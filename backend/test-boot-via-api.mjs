#!/usr/bin/env node
/**
 * Test the new Rosetta boot implementation via backend API
 */

async function testRosettaBoot() {
  console.log('🧪 Testing Rosetta Boot Implementation\n');
  
  try {
    // 1. Clear any existing boot sessions
    console.log('1️⃣ Clearing existing boot sessions...');
    const clearResponse = await fetch('http://localhost:3001/api/rosetta/sessions/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const clearData = await clearResponse.json();
    console.log('   ✅', clearData.message, '\n');
    
    // 2. Run live test with governance enabled
    console.log('2️⃣ Running live test with Rosetta governance...');
    console.log('   Prompt: "Explain 2+2 briefly"');
    console.log('   Model: llama3.2:3b');
    console.log('   Governance: ENABLED\n');
    
    const liveTestResponse = await fetch('http://localhost:3001/api/live-demo/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 1,
        prompt: 'Explain 2+2 briefly',
        models: ['llama3.2:3b'],
        useGovernance: true
      })
    });
    
    if (!liveTestResponse.ok) {
      throw new Error(`Live test failed: ${liveTestResponse.status}`);
    }
    
    const liveTestData = await liveTestResponse.json();
    console.log('   ⏳ Test running...\n');
    
    // Wait a bit for test to complete
    await new Promise(resolve => setTimeout(resolve, 60000)); // 60 seconds
    
    console.log('3️⃣ Fetching results...\n');
    
    const resultsResponse = await fetch('http://localhost:3001/api/live-demo/results');
    const resultsData = await resultsResponse.json();
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 LIVE TEST RESULTS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (resultsData.results && resultsData.results.length > 0) {
      const result = resultsData.results[0];
      console.log('Model:', result.modelName);
      console.log('Provider:', result.provider);
      console.log('Tokens:', result.tokens);
      console.log('\n📝 Response:\n');
      console.log(result.response);
      console.log('\n📈 CRIES Metrics:');
      console.log('  C (Coherence):', result.cries.C);
      console.log('  R (Rigor):', result.cries.R);
      console.log('  I (Integration):', result.cries.I);
      console.log('  E (Empathy):', result.cries.E);
      console.log('  S (Security):', result.cries.S);
      console.log('  Ω (Overall):', result.cries.Omega);
    } else {
      console.log('No results found!');
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // 4. Check boot session info
    console.log('4️⃣ Checking boot session info...\n');
    const sessionsResponse = await fetch('http://localhost:3001/api/rosetta/sessions');
    const sessionsData = await sessionsResponse.json();
    
    console.log('Active Boot Sessions:', sessionsData.count);
    Object.entries(sessionsData.sessions).forEach(([key, info]) => {
      console.log(`  ${key}:`);
      console.log(`    Booted at: ${info.bootTime}`);
      console.log(`    Messages: ${info.messageCount}`);
    });
    
    console.log('\n✅ Test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testRosettaBoot();
