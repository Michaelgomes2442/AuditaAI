import { buildOmegaV15GovernedPrompt } from './rosetta/persona/persona-v15.ts';
import { nextLamport } from './rosetta/kernel.ts';

console.log('🧪 Testing Phase-4 Ω³ Persona Engine...\n');

// Test context
const ctx = {
  persona: 'Architect',
  witness: 'RosettaOS MCP',
  band: '0',
  mode: 'TRANSPARENT',
  lamport: nextLamport(),
  bootTime: new Date().toISOString(),
  identityLock: true,
  version: 'vΩ3.4'
};

const acks = [
  'RosettaOS MCP initialized — witness: RosettaOS MCP',
  'Handshake confirmed — version: vΩ3.4'
];

const userPrompt = 'What is the capital of France?';

try {
  const governedPrompt = buildOmegaV15GovernedPrompt(userPrompt, ctx, acks);
  console.log('✅ Ω³ Persona Engine: SUCCESS');
  console.log('Generated prompt length:', governedPrompt.length);
  console.log('Contains Ω³ marker:', governedPrompt.includes('Ω³'));
  console.log('Contains persona:', governedPrompt.includes('Architect'));
  console.log('Contains user prompt:', governedPrompt.includes(userPrompt));
  console.log('No hashes/IDs in prompt:', !governedPrompt.includes('hash') && !governedPrompt.includes('id:'));

  console.log('\n📋 Sample of generated prompt:');
  console.log(governedPrompt.split('\n').slice(0, 8).join('\n'));
  console.log('...');

} catch (e) {
  console.error('❌ Ω³ Persona Engine: FAILED -', e.message);
}