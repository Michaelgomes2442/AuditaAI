// Simple status endpoint so frontend doesn't 404 when Ollama/local GPU isn't present
module.exports = function handler(req, res) {
  res.status(200).json({ ok: true, available: false, message: 'Local Ollama not detected. Use cloud API keys (OPENAI/ANTHROPIC) or deploy Ollama separately.' });
};
// Returns whether Ollama is available locally and whether a cloud key is present
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  const cloudKeyPresent = !!process.env.OLLAMA_API_KEY;

  // We don't attempt to contact local Ollama from CI; this route provides a consistent
  // shape the frontend can use to decide whether to use local Ollama or cloud APIs.
  return res.status(200).json({ ollamaAvailable: false, cloudKeyPresent });
};
// Simple status endpoint used by the frontend to detect available LLM backends.
// Behavior:
// - If ENABLE_OLLAMA=true, probes OLLAMA_BASE_URL and returns installed models info (if reachable).
// - Otherwise, reports cloud LLM availability based on OPENAI_API_KEY / ANTHROPIC_API_KEY env vars.
// - Returns a consistent JSON shape that the UI expects.

const DEFAULT_OLLAMA = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const ENABLE_OLLAMA = (process.env.ENABLE_OLLAMA || 'false').toLowerCase() === 'true';

async function probeOllama(baseUrl) {
  try {
    const resp = await fetch(`${baseUrl}/api/tags`, { method: 'GET' });
    if (!resp.ok) return { available: false, message: 'Ollama not responding' };
    const data = await resp.json();
    const models = (data.models || []).map(m => m.name || m);
    return { available: true, models, message: 'Ollama reachable' };
  } catch (err) {
    return { available: false, message: String(err) };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // If Ollama enabled, try probing it.
  if (ENABLE_OLLAMA) {
    const probe = await probeOllama(DEFAULT_OLLAMA);
    return res.status(200).json({ available: probe.available, provider: 'ollama', models: probe.models || [], message: probe.message, ollamaBase: DEFAULT_OLLAMA });
  }

  // Otherwise, report cloud LLM availability.
  const openai = !!process.env.OPENAI_API_KEY;
  const anthropic = !!process.env.ANTHROPIC_API_KEY;

  const providers = [];
  if (openai) providers.push('openai');
  if (anthropic) providers.push('anthropic');

  // If no providers found, return helpful guidance.
  if (providers.length === 0) {
    return res.status(200).json({ available: false, provider: null, models: [], message: 'No local Ollama and no cloud API keys found. Set ENABLE_OLLAMA=true (and run Ollama), or add OPENAI_API_KEY / ANTHROPIC_API_KEY in Vercel environment variables.' });
  }

  // For cloud providers we don't enumerate models here (could be extended).
  return res.status(200).json({ available: true, provider: providers.join(','), models: [], message: 'Cloud LLM keys detected' });
}
