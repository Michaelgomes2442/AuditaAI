const crypto = require('crypto');

module.exports = function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { apiKey } = req.body || {};
  if (!apiKey) return res.status(400).json({ error: 'apiKey required' });

  // Derive a short token from the provided API key. This is intentionally stateless
  // and NOT a replacement for proper auth. Use only for demo flows.
  const secret = process.env.NEXTAUTH_SECRET || 'dev-secret';
  const h = crypto.createHmac('sha256', secret).update(apiKey).digest('hex');
  const token = h.slice(0, 32);
  res.status(200).json({ ok: true, token });
};
// Simple handshake shim for demos: accepts an apiKey and returns an ephemeral token
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { apiKey } = req.body || {};
    if (!apiKey) return res.status(400).json({ error: 'missing apiKey' });

    // For demo purposes only: encode the apiKey into a short token. Do NOT use in production.
    const token = Buffer.from(apiKey).toString('base64');
    return res.status(200).json({ token });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
};
// Simple handshake shim so frontend code that expects /mcp-server/handshake works
// It does NOT store secrets; it returns a derived token for session use.
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { label, token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'missing_token' });

    // Derive a server-side session token without persisting the raw key
    const h = crypto.createHmac('sha256', process.env.NEXTAUTH_SECRET || 'dev-secret');
    h.update(String(token));
    h.update(String(label || '')); 
    const derived = h.digest('hex');

    return res.status(200).json({ token: derived });
  } catch (err) {
    console.error('handshake error', err);
    return res.status(500).json({ error: 'handshake_failed' });
  }
}
