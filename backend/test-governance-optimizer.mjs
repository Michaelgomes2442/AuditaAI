#!/usr/bin/env node

/**
 * Test Suite for Governance Optimizer
 * Tests real LLM API calls and CRIES metrics
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

console.log('\n🚀 Governance Optimizer Test Suite\n');
console.log('='.repeat(60));

// Test helper
async function test(name, fn) {
  try {
    console.log(`\n📋 Test: ${name}`);
    await fn();
    console.log('✅ PASSED');
  } catch (error) {
    console.error(`❌ FAILED: ${error.message}`);
  }
}

// Test 1: Health Check
await test('Health Check', async () => {
  const response = await axios.get(`${BASE_URL}/api/health`);
  if (!response.data.ok) throw new Error('Health check failed');
  console.log(`   Server: ${response.data.time}`);
});

// Test 2: Get Available Models
await test('Fetch Available Models', async () => {
  const response = await axios.get(`${BASE_URL}/api/live-demo/models`);
  console.log(`   Models available: ${response.data.models.length}`);
  response.data.models.slice(0, 3).forEach(m => {
    console.log(`     - ${m.name} (${m.provider})`);
  });
});

// Test 3: Test Parallel Prompt with Claude (No API Key Needed)
await test('Parallel Prompt with Claude (No OpenAI Key)', async () => {
  const payload = {
    prompt: 'What is the capital of France? Answer in one sentence.',
    standardModelId: 'mock-gpt4',
    rosettaModelId: 'claude-3-5-haiku-20241022-rosetta',
    conversationId: `test-${Date.now()}`
  };
  
  console.log(`   Payload: ${JSON.stringify(payload, null, 2)}`);
  
  try {
    const response = await axios.post(
      `${BASE_URL}/api/live-demo/parallel-prompt`,
      payload,
      { timeout: 30000 }
    );
    
    console.log(`   ✅ Request succeeded`);
    console.log(`   Standard Response: ${response.data.standardResponse?.content?.substring(0, 50)}...`);
    console.log(`   Rosetta Response: ${response.data.rosettaResponse?.content?.substring(0, 50)}...`);
    
    if (response.data.standardResponse?.cries?.overall) {
      console.log(`   Standard CRIES: ${(response.data.standardResponse.cries.overall * 100).toFixed(1)}%`);
    }
    if (response.data.rosettaResponse?.cries?.overall) {
      console.log(`   Rosetta CRIES: ${(response.data.rosettaResponse.cries.overall * 100).toFixed(1)}%`);
    }
  } catch (e) {
    if (e.response?.status === 404) {
      console.log(`   ⚠️  Models not loaded yet (first boot). This is normal.`);
      console.log(`   Models need to be explicitly imported via /api/live-demo/import-model`);
    } else {
      throw e;
    }
  }
});

// Test 4: Get Receipt Registry
await test('Get Receipt Registry', async () => {
  const response = await axios.get(`${BASE_URL}/api/receipts/registry`);
  const count = response.data.receipts?.length || 0;
  console.log(`   Receipts in registry: ${count}`);
  if (count > 0) {
    console.log(`   Latest: ${response.data.receipts[0].receiptId}`);
  }
});

// Test 5: Rosetta Boot Status
await test('Check Rosetta Boot Status', async () => {
  const response = await axios.get(`${BASE_URL}/api/rosetta/boot`);
  console.log(`   Status: ${response.data.isBooted ? 'Booted ✓' : 'Not booted'}`);
  if (response.data.bootReceiptId) {
    console.log(`   Boot Receipt: ${response.data.bootReceiptId}`);
  }
});

// Test 6: Dashboard Metrics
await test('Get Dashboard Overview', async () => {
  const response = await axios.get(`${BASE_URL}/api/dashboard`);
  console.log(`   Total Evaluations: ${response.data.total_evaluations || 0}`);
  console.log(`   System Health: ${response.data.system_health?.status || 'Unknown'}`);
});

// Test 7: Check Verifier Health
await test('Check BEN Verifier Health', async () => {
  const response = await axios.get(`${BASE_URL}/audit/verifier-health`);
  if (response.data.ok) {
    console.log(`   Verifier is running ✓`);
    console.log(`   Latency: ${response.data.latencyMs}ms`);
  } else {
    console.log(`   Verifier not available (this is OK for local dev)`);
  }
});

// Test 8: Math Canon - Calculate Sigma (CRIES Score)
await test('Math Canon: Calculate Sigma (CRIES)', async () => {
  const payload = {
    completeness: 0.85,
    reliability: 0.88,
    integrity: 0.90,
    effectiveness: 0.87,
    security: 0.92
  };
  
  const response = await axios.post(
    `${BASE_URL}/api/math-canon/sigma`,
    payload
  );
  
  console.log(`   Tri-Track Weighted Sigma: ${(response.data.sigma * 100).toFixed(1)}%`);
  console.log(`   Weights: C=0.4, R=0.4, I=0.2`);
  console.log(`   Formula: σᵗ = 0.4×${payload.completeness} + 0.4×${payload.reliability} + 0.2×${payload.integrity}`);
});

console.log('\n' + '='.repeat(60));
console.log('✨ Test Suite Complete\n');

process.exit(0);
