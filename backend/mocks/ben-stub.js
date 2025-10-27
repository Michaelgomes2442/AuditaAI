#!/usr/bin/env node
/* Minimal BEN stub to satisfy backend verifier calls during E2E.
   Listens on 127.0.0.1:8000 and exposes a subset of the Python service API:
   - GET  /health
   - GET  /list
   - GET  /registry
   - POST /verify-path
   - POST /verify-file

   This is intentionally lightweight and returns deterministic success responses
   so tests that depend on the verifier don't get ECONNREFUSED.
*/
import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(express.json({ limit: '5mb' }));

const RECEIPTS_DIR = path.join(process.cwd(), 'receipts');
function mkResp(overrides = {}) {
  return Object.assign({ ok: true, ts: new Date().toISOString() + 'Z' }, overrides);
}

app.get('/health', (req, res) => {
  res.json(mkResp({ ok: true }));
});

app.get('/list', (req, res) => {
  try {
    const files = fs.existsSync(RECEIPTS_DIR) ? fs.readdirSync(RECEIPTS_DIR).filter(f => f.endsWith('.ben')) : [];
    res.json(files);
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.get('/registry', (req, res) => {
  try {
    const registryPath = path.join(RECEIPTS_DIR, 'registry.json');
    if (fs.existsSync(registryPath)) {
      const reg = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
      res.json(reg);
    } else {
      res.json([]);
    }
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post('/verify-path', (req, res) => {
  try {
    const { path: receiptPath } = req.body || {};
    if (!receiptPath) return res.status(400).json({ verified: false, error: 'missing_path' });

    // Accept absolute or relative paths. If relative, resolve relative to RECEIPTS_DIR
    let fullPath = receiptPath;
    if (!path.isAbsolute(fullPath)) fullPath = path.join(RECEIPTS_DIR, fullPath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ verified: false, error: 'file_not_found', path: fullPath });
    }

    // Minimal verification stub: return verified=true and some fields backend expects
    const entry = {
      ts: new Date().toISOString() + 'Z',
      path: fullPath,
      event: 'stub-verify',
      lamport: 0,
      self_hash: 'stub-self-hash',
      calc_hash: 'stub-calc-hash',
      verified: true
    };
    // Append to receipts/registry.json to keep parity with Python verifier behaviour
    try {
      const registryPath = path.join(RECEIPTS_DIR, 'registry.json');
      let reg = [];
      if (fs.existsSync(registryPath)) {
        reg = JSON.parse(fs.readFileSync(registryPath, 'utf-8')) || [];
      }
      reg.push(entry);
      fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
      fs.writeFileSync(registryPath, JSON.stringify(reg, null, 2));
    } catch (err) {
      console.warn('failed to append registry entry (stub):', err.message);
    }

    res.json(entry);
  } catch (err) {
    res.status(500).json({ verified: false, error: String(err) });
  }
});

app.post('/verify-file', (req, res) => {
  // Lightweight alternative: accept JSON with { filename, contentBase64 }
  try {
    const { filename, contentBase64 } = req.body || {};
    if (!filename || !contentBase64) return res.status(400).json({ ok: false, error: 'missing_file_or_content' });
    fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
    const dest = path.join(RECEIPTS_DIR, path.basename(filename));
    const buf = Buffer.from(contentBase64, 'base64');
    fs.writeFileSync(dest, buf);
    const entry = {
      ts: new Date().toISOString() + 'Z',
      path: dest,
      event: 'stub-verify-file',
      lamport: 0,
      self_hash: 'stub-self-hash',
      calc_hash: 'stub-calc-hash',
      verified: true
    };
    try {
      const registryPath = path.join(RECEIPTS_DIR, 'registry.json');
      let reg = [];
      if (fs.existsSync(registryPath)) reg = JSON.parse(fs.readFileSync(registryPath, 'utf-8')) || [];
      reg.push(entry);
      fs.writeFileSync(registryPath, JSON.stringify(reg, null, 2));
    } catch (err) { /* ignore */ }
    res.json(entry);
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

const HOST = '127.0.0.1';
const PORT = 8000;
app.listen(PORT, HOST, () => {
  console.log(`BEN stub listening at http://${HOST}:${PORT}`);
});
