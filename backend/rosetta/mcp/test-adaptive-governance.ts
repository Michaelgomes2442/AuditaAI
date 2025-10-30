// Test adaptive CRIES governance
import { triTrackAnalyze } from './kernel/triTrack';
import { applySpeechcraft } from './kernel/speechcraft';

console.log('Testing Adaptive CRIES Governance...\n');

// Test case 1: Low coherence and rigor
const lowCRIES = { C: 0.3, R: 0.4, I: 0.8, E: 0.7, S: 0.9 };
const triTrackResult1 = triTrackAnalyze({ cries: lowCRIES, goal: 'Test response' });
console.log('Low C/R CRIES:', lowCRIES);
console.log('Adaptive Governance:', triTrackResult1.governance);
console.log();

// Test case 2: Low empathy and integration
const lowEICRIES = { C: 0.9, R: 0.8, I: 0.3, E: 0.4, S: 0.7 };
const triTrackResult2 = triTrackAnalyze({ cries: lowEICRIES, goal: 'Test response' });
console.log('Low I/E CRIES:', lowEICRIES);
console.log('Adaptive Governance:', triTrackResult2.governance);
console.log();

// Test speechcraft integration
const speechInput = {
  persona: 'Architect' as const,
  text: 'Design a simple API',
  governance: triTrackResult1.governance
};
const speechOutput = applySpeechcraft(speechInput);
console.log('Speechcraft with Governance:');
console.log('Governance Applied:', speechOutput.governanceApplied);
console.log('Sample Output Preview:', speechOutput.text.substring(0, 200) + '...');