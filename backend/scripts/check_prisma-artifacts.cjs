#!/usr/bin/env node
// Lightweight check to satisfy postinstall in CI/dev environments.
// Exits 0 if files are missing so postinstall doesn't fail the install.
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const prismaClientPath = path.join(projectRoot, 'node_modules', '.prisma');

try {
  console.log('Running check_prisma-artifacts.cjs...');
  if (fs.existsSync(prismaClientPath)) {
    console.log('OK: Prisma artifacts found at', prismaClientPath);
  } else {
    console.warn('WARN: Prisma artifacts not found at', prismaClientPath);
    console.warn('Postinstall will continue; prisma generate will recreate artifacts when run.');
  }
  process.exit(0);
} catch (err) {
  console.error('Error in check_prisma-artifacts script:', err);
  // Do not fail the installation; exit 0 to keep postinstall tolerant.
  process.exit(0);
}
