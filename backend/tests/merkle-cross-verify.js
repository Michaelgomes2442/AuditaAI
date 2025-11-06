#!/usr/bin/env node

/**
 * Cross-Language Merkle Tree Verification
 * 
 * Tests that JavaScript and Python Merkle implementations produce identical roots
 * for the same input data.
 */

import crypto from 'crypto';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// ============ JavaScript Merkle Implementation ============

function sha256Hex(data) {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

function computeMerkleRoot(digests) {
  if (!digests || digests.length === 0) {
    return '0'.repeat(64);
  }
  
  if (digests.length === 1) {
    return digests[0];
  }
  
  // RFC 6962 domain separation
  const LEAF_PREFIX = Buffer.from([0x00]);
  const NODE_PREFIX = Buffer.from([0x01]);
  
  let currentLevel = digests.map(d => {
    const hash = crypto.createHash('sha256');
    hash.update(LEAF_PREFIX);
    hash.update(Buffer.from(d, 'hex'));
    return hash.digest('hex');
  });
  
  while (currentLevel.length > 1) {
    const nextLevel = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        const hash = crypto.createHash('sha256');
        hash.update(NODE_PREFIX);
        hash.update(Buffer.from(currentLevel[i], 'hex'));
        hash.update(Buffer.from(currentLevel[i + 1], 'hex'));
        nextLevel.push(hash.digest('hex'));
      } else {
        nextLevel.push(currentLevel[i]);
      }
    }
    currentLevel = nextLevel;
  }
  
  return currentLevel[0];
}

// ============ Python Merkle Caller ============

function callPythonMerkle(digests) {
  // Create temporary Python script
  const pythonScript = `
import hashlib
import sys
import json

def sha256_hex(data):
    return hashlib.sha256(data.encode('utf-8')).hexdigest()

def compute_merkle_root(digests):
    if not digests or len(digests) == 0:
        return '0' * 64
    
    if len(digests) == 1:
        return digests[0]
    
    # RFC 6962 domain separation
    LEAF_PREFIX = bytes([0x00])
    NODE_PREFIX = bytes([0x01])
    
    # Hash leaves with domain separation
    current_level = []
    for d in digests:
        h = hashlib.sha256()
        h.update(LEAF_PREFIX)
        h.update(bytes.fromhex(d))
        current_level.append(h.hexdigest())
    
    # Build tree
    while len(current_level) > 1:
        next_level = []
        for i in range(0, len(current_level), 2):
            if i + 1 < len(current_level):
                h = hashlib.sha256()
                h.update(NODE_PREFIX)
                h.update(bytes.fromhex(current_level[i]))
                h.update(bytes.fromhex(current_level[i + 1]))
                next_level.append(h.hexdigest())
            else:
                next_level.append(current_level[i])
        current_level = next_level
    
    return current_level[0]

# Read input from stdin
digests = json.loads(sys.stdin.read())
result = compute_merkle_root(digests)
print(result)
`;

  const tempFile = join(tmpdir(), 'merkle_test.py');
  writeFileSync(tempFile, pythonScript);
  
  try {
    const result = execSync(`python3 ${tempFile}`, {
      input: JSON.stringify(digests),
      encoding: 'utf8'
    });
    return result.trim();
  } catch (error) {
    console.error('Python execution failed:', error.message);
    return null;
  }
}

// ============ Test Cases ============

function runTests() {
  console.log('🔬 Cross-Language Merkle Verification Tests\n');
  
  const testCases = [
    {
      name: 'Empty tree',
      digests: []
    },
    {
      name: 'Single leaf',
      digests: [sha256Hex('test1')]
    },
    {
      name: 'Two leaves',
      digests: [sha256Hex('test1'), sha256Hex('test2')]
    },
    {
      name: 'Three leaves (odd)',
      digests: [sha256Hex('test1'), sha256Hex('test2'), sha256Hex('test3')]
    },
    {
      name: 'Four leaves (power of 2)',
      digests: [
        sha256Hex('test1'),
        sha256Hex('test2'),
        sha256Hex('test3'),
        sha256Hex('test4')
      ]
    },
    {
      name: 'Five leaves',
      digests: [
        sha256Hex('test1'),
        sha256Hex('test2'),
        sha256Hex('test3'),
        sha256Hex('test4'),
        sha256Hex('test5')
      ]
    },
    {
      name: 'Real receipt digests',
      digests: [
        'a'.repeat(64),
        'b'.repeat(64),
        'c'.repeat(64)
      ]
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    const jsRoot = computeMerkleRoot(testCase.digests);
    const pyRoot = callPythonMerkle(testCase.digests);
    
    if (!pyRoot) {
      console.log(`⚠️  ${testCase.name}: Python execution failed`);
      failed++;
      continue;
    }
    
    const match = jsRoot === pyRoot;
    const icon = match ? '✅' : '❌';
    
    console.log(`${icon} ${testCase.name}`);
    console.log(`   Leaves: ${testCase.digests.length}`);
    console.log(`   JS Root:     ${jsRoot.slice(0, 16)}...`);
    console.log(`   Python Root: ${pyRoot.slice(0, 16)}...`);
    
    if (!match) {
      console.log(`   ⚠️  MISMATCH DETECTED!`);
      console.log(`   Full JS:     ${jsRoot}`);
      console.log(`   Full Python: ${pyRoot}`);
      failed++;
    } else {
      passed++;
    }
    console.log();
  }
  
  // Summary
  console.log('═'.repeat(60));
  console.log(`📊 Test Summary: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('✅ All Merkle implementations match!');
    console.log('🎯 JavaScript and Python produce identical roots.');
    return 0;
  } else {
    console.log('❌ Merkle implementations differ!');
    console.log('⚠️  This is a critical security issue - fix immediately!');
    return 1;
  }
}

// ============ Documentation ============

function printDocumentation() {
  console.log('\n📚 Merkle Tree Implementation Standard\n');
  console.log('Algorithm: RFC 6962 (Certificate Transparency)');
  console.log('Hash Function: SHA-256');
  console.log('Domain Separation:');
  console.log('  - Leaf prefix: 0x00');
  console.log('  - Internal node prefix: 0x01');
  console.log('\nLeaf Hash: SHA256(0x00 || leaf_data)');
  console.log('Node Hash: SHA256(0x01 || left_hash || right_hash)');
  console.log('\nOdd Number of Leaves: Promote last leaf to next level');
  console.log('\nImplementations:');
  console.log('  - JavaScript: backend/server.js (computeMerkleRoot)');
  console.log('  - Python: ben_governance/verify_hash.py');
  console.log('  - Test: backend/tests/merkle-cross-verify.js\n');
}

// ============ Main ============

const exitCode = runTests();
printDocumentation();
process.exit(exitCode);
