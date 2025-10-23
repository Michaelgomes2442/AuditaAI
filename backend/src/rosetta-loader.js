// Safe loader for Rosetta monolith governance context
// Reads workspace/CORE/Rosetta.html, extracts compact context, trims, caches, exposes getRosettaGovernanceContext({maxChars}) and clearRosettaCache()

import fs from 'fs';
import path from 'path';

const ROSETTA_PATH = path.resolve(process.cwd(), 'workspace/CORE/Rosetta.html');
let _cachedContext = null;
let _cachedAt = null;

function extractGovernanceContext(raw, maxChars = 4000) {
  // Extract header, band banners, and key policy sections
  // Look for lines with 'BEN Persona', 'BAND', 'KEY HANDLING POLICY', and first <section> or <meta>
  const lines = raw.split('\n');
  let context = [];
  let foundKeyPolicy = false;
  for (let i = 0; i < lines.length && context.join('\n').length < maxChars; i++) {
    const line = lines[i];
    if (line.includes('BEN Persona') || line.includes('BAND-0') || line.includes('KEY HANDLING POLICY')) {
      context.push(line);
      foundKeyPolicy = true;
    }
    if (line.includes('KEY HANDLING POLICY')) {
      // Grab next 10 lines for policy details
      for (let j = 1; j <= 10 && i + j < lines.length; j++) {
        context.push(lines[i + j]);
      }
    }
    if (line.includes('<meta') || line.includes('<section')) {
      context.push(line);
    }
    // Stop after finding key policy and some meta
    if (foundKeyPolicy && context.length > 20) break;
  }
  // Fallback: just take first maxChars
  let result = context.join('\n');
  if (!result || result.length < 100) {
    result = raw.slice(0, maxChars);
  }
  return result;
}

export function getRosettaGovernanceContext({ maxChars = 4000 } = {}) {
  if (_cachedContext && _cachedAt && Date.now() - _cachedAt < 10 * 60 * 1000) {
    return _cachedContext;
  }
  let raw;
  try {
    raw = fs.readFileSync(ROSETTA_PATH, 'utf8');
  } catch (err) {
    return 'Rosetta governance context unavailable: ' + err.message;
  }
  const context = extractGovernanceContext(raw, maxChars);
  _cachedContext = context;
  _cachedAt = Date.now();
  return context;
}

export function clearRosettaCache() {
  _cachedContext = null;
  _cachedAt = null;
}

// For testing: node backend/src/rosetta-loader.js (ES module compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  const ctx = getRosettaGovernanceContext({ maxChars: 1024 });
  console.log('Rosetta Governance Context (1024 chars):\n', ctx);
}
