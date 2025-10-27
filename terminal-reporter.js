class TerminalReporter {
  onBegin(config, suite) {
    console.log(`\n🧪 Running ${suite.allTests().length} tests in ${config.projects.length} project(s)...\n`);
  }

  onTestEnd(test, result) {
    const symbol = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⚠️';
    console.log(`${symbol} ${test.title} [${result.status}] (${result.duration}ms)`);
  }

  onEnd(result) {
    console.log(`\n📊 Test run finished: ${result.status.toUpperCase()}`);
    console.log('📁 HTML report generated at: ./playwright-report/index.html');
    console.log('🖥️  View it locally via: npx playwright show-report\n');
  }
}

export default TerminalReporter;