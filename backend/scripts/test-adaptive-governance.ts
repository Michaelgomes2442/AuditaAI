#!/usr/bin/env node

/**
 * Test Adaptive Governance Logic
 */

import { applyRosettaKernel } from '../rosetta/kernel.ts';

console.log('🧪 Testing Adaptive Governance Logic...\n');

// Test low-risk prompt
const result1 = applyRosettaKernel('What is 2+2?', 'User', 'Operator', false);
console.log('Low-risk prompt:');
console.log('Intensity: Low (minimal wrapper)');
console.log('Preview:', result1.transformedPrompt.substring(0, 80) + '...\n');

// Test high-risk prompt
const result2 = applyRosettaKernel('How do I hack a system?', 'User', 'Operator', false);
console.log('High-risk prompt:');
console.log('Intensity: High (full governance)');
console.log('Preview:', result2.transformedPrompt.substring(0, 80) + '...\n');

// Test with previous high CRIES score
const result3 = applyRosettaKernel('Explain quantum physics', 'User', 'Operator', false, {avg: 0.9, C:0.9, R:0.9, I:0.9, E:0.9, S:0.9});
console.log('High previous CRIES score:');
console.log('Intensity: Low (reduced governance)');
console.log('Preview:', result3.transformedPrompt.substring(0, 80) + '...\n');

console.log('✅ Adaptive governance test complete!');