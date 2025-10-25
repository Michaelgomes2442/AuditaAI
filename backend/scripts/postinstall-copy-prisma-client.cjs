const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'node_modules', '.prisma', 'client');
const destPkg = path.join(__dirname, '..', 'node_modules', '@prisma', 'client');

function copyRecursive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return false;
  fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else if (entry.isSymbolicLink()) {
      try {
        const real = fs.readlinkSync(srcPath);
        fs.symlinkSync(real, destPath);
      } catch (e) {
        // ignore
      }
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  return true;
}

try {
  const ok = copyRecursive(src, destPkg);
  if (ok) {
    console.log('postinstall: copied generated prisma client to', destPkg);
  } else {
    console.warn('postinstall: generated prisma client not found at', src);
  }
} catch (err) {
  console.warn('postinstall: failed to copy prisma client:', err.message);
}
