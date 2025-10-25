const fs = require('fs');
const path = require('path');

function listFiles(dir, limit = 20) {
  try {
    const files = fs.readdirSync(dir);
    const sample = files.slice(0, limit);
    return { exists: true, count: files.length, sample };
  } catch (e) {
    return { exists: false, error: String(e) };
  }
}

const base = process.cwd();
const prismaGenerated = path.join(base, 'node_modules', '.prisma', 'client');
const prismaClient = path.join(base, 'node_modules', '@prisma', 'client');

console.log(`PRISMA CHECK: CWD=${base}`);

const generated = listFiles(prismaGenerated);
if (generated.exists) {
  console.log(`PRISMA GENERATED: path=${prismaGenerated} count=${generated.count}`);
  console.log('PRISMA GENERATED sample:', generated.sample);
} else {
  console.warn('PRISMA GENERATED: not found or error:', generated.error || 'not found');
}

const client = listFiles(prismaClient);
if (client.exists) {
  console.log(`PRISMA CLIENT: path=${prismaClient} count=${client.count}`);
  console.log('PRISMA CLIENT sample:', client.sample);
} else {
  console.warn('PRISMA CLIENT: not found or error:', client.error || 'not found');
}

// Also check for the default entry file that Prisma generates
const defaultEntry = path.join(prismaGenerated, 'default.js');
if (fs.existsSync(defaultEntry)) {
  console.log('PRISMA: found default.js at', defaultEntry);
} else {
  console.warn('PRISMA: default.js not found at', defaultEntry);
}

// Also show the build-folder copy
const buildFolder = path.join(base, 'prisma-client-build');
try {
  const files = fs.readdirSync(buildFolder);
  console.log(`PRISMA BUILD FOLDER: path=${buildFolder} count=${files.length} sample=${files.slice(0,10)}`);
} catch (e) {
  console.warn('PRISMA BUILD FOLDER: not found or error:', String(e));
}

process.exit(0);
