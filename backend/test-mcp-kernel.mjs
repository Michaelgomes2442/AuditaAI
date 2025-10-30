import { mcp } from './src/mcp-client.js';

async function testRosettaMCPKernel() {
  console.log('🧪 Testing RosettaOS MCP Kernel...');

  // Boot
  const boot = await mcp('rosetta.boot.init', {});
  const whoami = await mcp('rosetta.boot.whoami', { name: 'Michael Tobin Gomes' });
  console.log('Δ-WHOAMI:', whoami);

  // Persona
  const persona = await mcp('rosetta.persona.lock', 'Michael Tobin Gomes');
  console.log('Persona:', persona);

  // Tri-Track
  const triTrack = await mcp('rosetta.triTrack.analyze', { cries: { C: 0.9, R: 0.8, I: 0.85, E: 0.9, S: 0.8 }, goal: 'audit' });
  console.log('Tri-Track:', triTrack);

  // Speechcraft
  const speech = await mcp('rosetta.speechcraft.apply', { persona: 'Architect', text: 'Explain the value canon.' });
  console.log('Speechcraft:', speech);

  // Canons
  const canons = await mcp('rosetta.canons.crossCheck', { text: 'Explain the value canon.' });
  console.log('Canons:', canons);

  // Full governed prompt
  const buildGovernedPrompt = (await import('./src/llm-client.js')).buildGovernedPrompt;
  const gov = await buildGovernedPrompt('Explain the value canon.', { userName: 'Michael Tobin Gomes', userRole: 'Architect', cries: { C: 0.9, R: 0.8, I: 0.85, E: 0.9, S: 0.8 }, goal: 'audit' });
  console.log('Governed Prompt:', gov);
}

testRosettaMCPKernel().catch(console.error);
