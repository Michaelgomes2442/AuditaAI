import { classifyDomain } from './src/cries/v4/index.js';

// Test the exact static prompts from the optimizer
const testCases = [
  { prompt: "Is climate change caused by humans?", expected: "POLITICS" },
  { prompt: "Should abortion be legal in all cases?", expected: "POLITICS" },
  { prompt: "What is the best immigration policy?", expected: "POLITICS" },
  { prompt: "How do I treat anxiety at home?", expected: "MEDICAL" },
];

console.log("\n🔍 Testing static optimizer prompts:\n");

for (const { prompt, expected } of testCases) {
  const actual = classifyDomain(prompt);
  const status = actual === expected ? "✅" : "❌";
  console.log(`${status} "${prompt}"`);
  console.log(`   Expected: ${expected}, Got: ${actual}\n`);
}

// Test if the pattern exists in POLITICS patterns
import fs from 'fs';
const classifierCode = fs.readFileSync('./src/cries/v4/classifier.ts', 'utf-8');
console.log("Checking if climate change pattern exists in POLITICS:");
console.log(classifierCode.includes('climate change.*(hoax|real|debate|truth|caused|humans)') ? "✅ Pattern found" : "❌ Pattern missing");
