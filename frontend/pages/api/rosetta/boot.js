const { calculateCRIES } = require('../../../../frontend/lib/rosetta-boot');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { text } = req.body || {};
    const result = calculateCRIES({ text });
    return res.status(200).json({ ok: true, result });
  } catch (err) {
    console.error('rosetta/boot error', err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
};
const path = require('path');
const { applyRosettaBoot } = require(path.join('../../../lib/rosetta-boot'));

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const body = req.body || {};
    const result = await applyRosettaBoot(body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
};
// API route: /api/rosetta/boot
// Accepts POST { modelMetrics: { completeness, reliability, integrity, effectiveness, security } }
// Returns calculated standard CRIES, rosetta-improved CRIES, and improvement ratios.

const { calculateCRIES, applyRosettaBoot } = require('../../lib/rosetta-boot');

function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body || {};
    const modelMetrics = payload.modelMetrics || payload.cries || {}; // accept flexible keys

    const standardCRIES = calculateCRIES(modelMetrics);
    const { rosettaCRIES, improvements } = applyRosettaBoot(standardCRIES);

    return res.status(200).json({ ok: true, standardCRIES, rosettaCRIES, improvements });
  } catch (err) {
    console.error('rosetta boot api error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

module.exports = handler;
