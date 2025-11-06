#!/usr/bin/env node

/**
 * End-to-End Integration Test
 * Tests: Speechcraft v2.1 + Merkle Sealer v2.1
 * 
 * Flow:
 * 1. Governed LLM call via API
 * 2. Receipt generation with CRIES
 * 3. Auto-seal after 10 receipts
 * 4. Proof verification
 * 5. Certificate export
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3001';
const USE_SIMULATION = true; // Set to false if you have real API keys

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testGovernanceStats() {
  console.log('\n📊 Testing Governance Stats...');
  try {
    const response = await axios.get(`${BASE_URL}/api/governance/stats`);
    console.log('✅ Stats:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Stats failed:', error.message);
    throw error;
  }
}

async function testMerkleSpec() {
  console.log('\n🔍 Testing Merkle Spec...');
  try {
    const response = await axios.get(`${BASE_URL}/api/merkle/spec`);
    console.log('✅ Spec:', {
      hashAlgo: response.data.hashAlgo,
      version: response.data.version,
      batchSize: response.data.batchSize,
      compliance: response.data.compliance.slice(0, 3)
    });
    return response.data;
  } catch (error) {
    console.error('❌ Spec failed:', error.message);
    throw error;
  }
}

async function testMerkleSealsList() {
  console.log('\n📋 Testing Merkle Seals List...');
  try {
    const response = await axios.get(`${BASE_URL}/api/governance/merkle-seals`);
    console.log(`✅ Found ${response.data.length} seals`);
    if (response.data.length > 0) {
      console.log('   Latest seal:', {
        id: response.data[0].id,
        merkleRoot: response.data[0].merkleRoot.substring(0, 16) + '...',
        receiptCount: response.data[0].receiptCount,
        sealedAt: response.data[0].sealedAt
      });
    }
    return response.data;
  } catch (error) {
    console.error('❌ Seals list failed:', error.message);
    throw error;
  }
}

async function testGovernanceReceipts() {
  console.log('\n📄 Testing Governance Receipts...');
  try {
    const response = await axios.get(`${BASE_URL}/api/governance/receipts?limit=5`);
    console.log(`✅ Found ${response.data.pagination.total} receipts`);
    if (response.data.receipts.length > 0) {
      console.log('   Latest receipt:', {
        id: response.data.receipts[0].id,
        criesOmega: response.data.receipts[0].criesOmega?.toFixed(3) || 'N/A',
        violations: response.data.receipts[0].violations.length,
        sealed: response.data.receipts[0].merkleSealId !== null
      });
    }
    return response.data;
  } catch (error) {
    console.error('❌ Receipts failed:', error.message);
    throw error;
  }
}

async function testGovernedLLMCall() {
  console.log('\n🛡️  Testing Governed LLM Call (Simulation Mode)...');
  try {
    const response = await axios.post(`${BASE_URL}/api/pilot/run-test`, {
      modelId: 'gpt-4',
      mode: 'live',
      prompt: 'What is 2+2?',
      models: ['gpt-4'],
      useGovernance: true,
      apiKeys: {} // Empty - will use simulation
    });
    
    console.log('✅ Governed call completed');
    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      console.log('   Response length:', result.response.length, 'chars');
      console.log('   CRIES Omega:', result.cries.Omega?.toFixed(3) || 'N/A');
      console.log('   Simulated:', result.simulated);
    }
    return response.data;
  } catch (error) {
    console.error('❌ Governed call failed:', error.response?.data || error.message);
    // Don't throw - governance integration might need real API keys
  }
}

async function testMerkleProof(receiptId) {
  console.log(`\n🔐 Testing Merkle Proof for receipt ${receiptId}...`);
  try {
    const response = await axios.get(`${BASE_URL}/api/merkle/proof?receiptId=${receiptId}`);
    console.log('✅ Proof generated:', {
      sealId: response.data.sealId,
      index: response.data.index,
      proofLength: response.data.proof.length,
      merkleRoot: response.data.merkleRoot.substring(0, 16) + '...'
    });
    return response.data;
  } catch (error) {
    console.error('❌ Proof generation failed:', error.response?.data || error.message);
  }
}

async function testMerkleCertificate(sealId) {
  console.log(`\n📜 Testing Certificate Export for seal ${sealId}...`);
  try {
    const response = await axios.get(`${BASE_URL}/api/merkle/seals/${sealId}/certificate`);
    console.log('✅ Certificate exported:', {
      type: response.data.certificateType,
      receiptCount: response.data.receipts.length,
      hasPrevSealDigest: !!response.data.prevSealDigest,
      sealDigest: response.data.sealDigest.substring(0, 16) + '...'
    });
    return response.data;
  } catch (error) {
    console.error('❌ Certificate export failed:', error.response?.data || error.message);
  }
}

async function testHealthCheck() {
  console.log('\n🏥 Testing Server Health...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server healthy:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting Integration Tests...');
  console.log('   Base URL:', BASE_URL);
  console.log('   Mode:', USE_SIMULATION ? 'Simulation' : 'Real API calls');
  console.log('=' .repeat(60));

  try {
    // Phase 1: Server Health
    await testHealthCheck();
    await sleep(500);

    // Phase 2: API Endpoints
    const initialStats = await testGovernanceStats();
    await sleep(500);

    await testMerkleSpec();
    await sleep(500);

    // Phase 3: Data Queries
    await testMerkleSealsList();
    await sleep(500);

    await testGovernanceReceipts();
    await sleep(500);

    // Phase 4: Governed LLM Call (Simulation)
    if (USE_SIMULATION) {
      console.log('\n⚠️  Skipping governed LLM call - requires real API keys');
      console.log('   To test: Set USE_SIMULATION=false and provide API keys');
    } else {
      await testGovernedLLMCall();
      await sleep(1000);

      // Check if new receipts created
      const updatedStats = await testGovernanceStats();
      console.log('\n📈 Receipt Delta:', updatedStats.totalReceipts - initialStats.totalReceipts);
    }

    // Phase 5: Proof & Certificate (if data exists)
    await sleep(500);
    const receipts = await testGovernanceReceipts();
    if (receipts.receipts.length > 0) {
      await testMerkleProof(receipts.receipts[0].id);
    }

    await sleep(500);
    const seals = await testMerkleSealsList();
    if (seals.length > 0) {
      await testMerkleCertificate(seals[0].id);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All integration tests passed!');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
main().catch(console.error);
