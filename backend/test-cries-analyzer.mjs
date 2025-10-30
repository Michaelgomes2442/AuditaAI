#!/usr/bin/env node

/**
 * Test Track-A CRIES Analyzer
 * 
 * Tests the canonical CRIES computation engine against various prompts
 */

import { computeCRIES, generateAnalysisReceipt } from './src/track-a-analyzer.js';

console.log('==========================================');
console.log('TRACK-A CRIES ANALYZER TEST');
console.log('Canonical Formulas from Rosetta.html §2A');
console.log('==========================================\n');

// Test Case 1: Simple factual question
const test1 = {
  prompt: "What is the capital of France?",
  response: "The capital of France is Paris. Paris is located in the north-central part of the country and has been the capital since the 12th century. According to historical records, it became the permanent capital under King Philip II."
};

console.log('📝 Test 1: Simple Factual Question');
console.log(`Prompt: "${test1.prompt}"`);
console.log(`Response: "${test1.response.substring(0, 100)}..."`);
const cries1 = computeCRIES(test1.prompt, test1.response);
console.log('CRIES Scores:');
console.log(`  C (Coherence):   ${cries1.C.toFixed(4)}`);
console.log(`  R (Rigor):       ${cries1.R.toFixed(4)}`);
console.log(`  I (Integration): ${cries1.I.toFixed(4)}`);
console.log(`  E (Empathy):     ${cries1.E.toFixed(4)}`);
console.log(`  S (Strictness):  ${cries1.S.toFixed(4)}`);
console.log(`  CRIES Score:     ${cries1.cries_score.toFixed(4)}`);
console.log(`  Weights: C=${cries1.weights.C}, R=${cries1.weights.R}, I=${cries1.weights.I}, E=${cries1.weights.E}, S=${cries1.weights.S}`);
console.log('Sub-metrics:');
console.log(`  Coherence: contradiction_rate=${cries1.sub_metrics.C.contradiction_rate?.toFixed(4)}, logical_follow_through=${cries1.sub_metrics.C.logical_follow_through?.toFixed(4)}`);
console.log(`  Rigor: claim_evidence_alignment=${cries1.sub_metrics.R.claim_evidence_alignment?.toFixed(4)}, source_attribution=${cries1.sub_metrics.R.source_attribution?.toFixed(4)}`);
console.log(`  Integration: constraint_obedience=${cries1.sub_metrics.I.constraint_obedience?.toFixed(4)}, policy_alignment=${cries1.sub_metrics.I.policy_alignment?.toFixed(4)}`);
console.log(`  Empathy: tone_alignment=${cries1.sub_metrics.E.tone_alignment?.toFixed(4)}, user_intent_fidelity=${cries1.sub_metrics.E.user_intent_fidelity?.toFixed(4)}`);
console.log(`  Strictness: refusal_correctness=${cries1.sub_metrics.S.refusal_correctness?.toFixed(4)}, policy_boundaries=${cries1.sub_metrics.S.policy_boundaries?.toFixed(4)}`);
console.log('');

// Test Case 2: Complex technical explanation
const test2 = {
  prompt: "Explain how blockchain consensus mechanisms work",
  response: "Blockchain consensus mechanisms are protocols that ensure all nodes in a distributed network agree on the state of the ledger. First, when a transaction occurs, it's broadcast to the network. Second, validators collect these transactions into blocks. Third, the consensus mechanism (like Proof of Work or Proof of Stake) determines which block gets added to the chain. For example, in Bitcoin's PoW, miners compete to solve cryptographic puzzles. Studies show that PoS can reduce energy consumption by over 99% compared to PoW. This means blockchain networks can achieve security without massive energy expenditure."
};

console.log('📝 Test 2: Technical Explanation');
console.log(`Prompt: "${test2.prompt}"`);
console.log(`Response: "${test2.response.substring(0, 100)}..."`);
const cries2 = computeCRIES(test2.prompt, test2.response);
console.log('CRIES Scores:');
console.log(`  C (Coherence):   ${cries2.C.toFixed(4)}`);
console.log(`  R (Rigor):       ${cries2.R.toFixed(4)}`);
console.log(`  I (Integration): ${cries2.I.toFixed(4)}`);
console.log(`  E (Empathy):     ${cries2.E.toFixed(4)}`);
console.log(`  S (Strictness):  ${cries2.S.toFixed(4)}`);
console.log(`  CRIES Score:     ${cries2.cries_score.toFixed(4)}`);
console.log('');

// Test Case 3: Problematic response (short, no evidence)
const test3 = {
  prompt: "How do I fix my computer's slow performance?",
  response: "Just delete stuff. It works."
};

console.log('📝 Test 3: Problematic Response (Low Quality)');
console.log(`Prompt: "${test3.prompt}"`);
console.log(`Response: "${test3.response}"`);
const cries3 = computeCRIES(test3.prompt, test3.response);
console.log('CRIES Scores:');
console.log(`  C (Coherence):   ${cries3.C.toFixed(4)}`);
console.log(`  R (Rigor):       ${cries3.R.toFixed(4)}`);
console.log(`  I (Integration): ${cries3.I.toFixed(4)}`);
console.log(`  E (Empathy):     ${cries3.E.toFixed(4)}`);
console.log(`  S (Strictness):  ${cries3.S.toFixed(4)}`);
console.log(`  CRIES Score:     ${cries3.cries_score.toFixed(4)}`);
console.log('');

// Test Case 4: Well-cited, structured response
const test4 = {
  prompt: "What are the health benefits of regular exercise?",
  response: "Regular exercise provides numerous health benefits. First, cardiovascular health improves significantly. According to research published in the Journal of the American Heart Association, 150 minutes of moderate exercise weekly reduces heart disease risk by 30%. Second, mental health benefits are substantial. Studies indicate that exercise releases endorphins, improving mood and reducing anxiety. Third, weight management becomes easier as exercise increases metabolism. For example, combining aerobic exercise with strength training can boost metabolic rate by 15%. Finally, bone density increases with weight-bearing exercises, reducing osteoporosis risk in older adults."
};

console.log('📝 Test 4: Well-Cited Structured Response');
console.log(`Prompt: "${test4.prompt}"`);
console.log(`Response: "${test4.response.substring(0, 100)}..."`);
const cries4 = computeCRIES(test4.prompt, test4.response);
console.log('CRIES Scores:');
console.log(`  C (Coherence):   ${cries4.C.toFixed(4)}`);
console.log(`  R (Rigor):       ${cries4.R.toFixed(4)}`);
console.log(`  I (Integration): ${cries4.I.toFixed(4)}`);
console.log(`  E (Empathy):     ${cries4.E.toFixed(4)}`);
console.log(`  S (Strictness):  ${cries4.S.toFixed(4)}`);
console.log(`  CRIES Score:     ${cries4.cries_score.toFixed(4)}`);
console.log('');

// Test Δ-ANALYSIS Receipt Generation
console.log('==========================================');
console.log('Δ-ANALYSIS RECEIPT GENERATION TEST');
console.log('==========================================\n');

const receipt = generateAnalysisReceipt(
  test4.prompt,
  test4.response,
  'conv-test-1729561200000-abc123def',
  5,
  '1234567890abcdef'
);

console.log('Generated Δ-ANALYSIS Receipt:');
console.log(JSON.stringify(receipt, null, 2));

console.log('\n==========================================');
console.log('TEST COMPLETE');
console.log('==========================================');
