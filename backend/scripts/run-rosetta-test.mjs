import { rosettaSelfTest } from '../src/rosetta-self-test.js';

(async () => {
  try {
    const results = await rosettaSelfTest();
    console.log('\n=== ROSETTA SELF-TEST RESULT ===');
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Rosetta self-test failed:', err);
    process.exit(2);
  }
})();
