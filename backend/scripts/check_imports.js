(async () => {
  try {
  // Verify we can import the compiled websocket JS
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  // Load compiled CommonJS via a small CJS loader
  const ws = require('../dist/websocket-loader.cjs');
  console.log('Imports OK');
  } catch (err) {
    console.error('Import error', err);
    process.exit(1);
  }
})();