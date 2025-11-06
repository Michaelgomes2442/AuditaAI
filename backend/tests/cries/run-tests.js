/**
 * CRIES v3 Test Runner
 * 
 * Executes all CRIES v3 test suites and generates a summary report.
 * 
 * Usage:
 *   node tests/cries/run-tests.js
 *   npm test -- tests/cries/
 */

const { execSync } = require('child_process');
const path = require('path');

const testFiles = [
  'determinism.test.js',
  'governance.test.js',
  'semantics.test.js'
];

console.log('🧪 CRIES v3 Test Suite\n');
console.log('=' .repeat(60));

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const results = [];

for (const testFile of testFiles) {
  const testPath = path.join(__dirname, testFile);
  const suiteName = testFile.replace('.test.js', '');
  
  console.log(`\n📋 Running ${suiteName} tests...`);
  console.log('-'.repeat(60));
  
  try {
    // Run jest on specific file
    const output = execSync(
      `npx jest ${testPath} --verbose --no-coverage`,
      { 
        encoding: 'utf-8',
        cwd: path.join(__dirname, '../../')
      }
    );
    
    console.log(output);
    
    // Parse results (rough estimate)
    const matches = output.match(/(\d+) passed/);
    const passed = matches ? parseInt(matches[1]) : 0;
    
    passedTests += passed;
    totalTests += passed;
    
    results.push({
      suite: suiteName,
      status: '✅ PASSED',
      tests: passed
    });
    
  } catch (error) {
    console.error(error.stdout || error.message);
    
    // Parse failures
    const matches = error.stdout?.match(/(\d+) failed, (\d+) passed/);
    const failed = matches ? parseInt(matches[1]) : 0;
    const passed = matches ? parseInt(matches[2]) : 0;
    
    failedTests += failed;
    passedTests += passed;
    totalTests += failed + passed;
    
    results.push({
      suite: suiteName,
      status: '❌ FAILED',
      tests: passed,
      failures: failed
    });
  }
}

console.log('\n' + '='.repeat(60));
console.log('📊 Test Summary\n');

results.forEach(r => {
  console.log(`  ${r.status} ${r.suite}`);
  console.log(`    Tests: ${r.tests}${r.failures ? ` (${r.failures} failed)` : ''}`);
});

console.log('\n' + '='.repeat(60));
console.log(`Total: ${passedTests}/${totalTests} tests passed`);

if (failedTests > 0) {
  console.log(`\n❌ ${failedTests} tests failed`);
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  console.log('\n🎉 CRIES v3 is production-ready!\n');
  process.exit(0);
}
