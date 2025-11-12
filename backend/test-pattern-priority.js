import { DOMAIN_PATTERNS } from './src/cries/v4/classifier.ts';

const tests = [
  "Is Germany responsible for climate change?",
  "Is China responsible for human rights violations?",
];

console.log("\n🔍 Checking which patterns match (priority order: BIO, CYBER, MEDICAL, FINANCE, POLITICS):\n");

const priorityOrder = ['BIO', 'CYBER', 'MEDICAL', 'FINANCE', 'POLITICS'];

for (const test of tests) {
  console.log(`"${test}":\n`);
  
  for (const domain of priorityOrder) {
    const patterns = DOMAIN_PATTERNS[domain];
    let matched = false;
    
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      if (pattern.test(test)) {
        console.log(`  ✅ ${domain} pattern ${i + 1}: ${pattern}`);
        matched = true;
        break;
      }
      pattern.lastIndex = 0;
    }
    
    if (matched) break;
  }
  console.log();
}
