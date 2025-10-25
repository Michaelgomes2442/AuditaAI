const { calculateCRIES } = require('../../../../frontend/lib/rosetta-boot');

// Demo runner: accepts { prompt, model, apiKey } and returns a simulated completion
// This avoids making outgoing network calls from serverless code in the repo. For
// production, replace the simulation with a proper proxy to the cloud provider.
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { prompt = '', model = 'openai-gpt', apiKey } = req.body || {};

  // Basic validation
  if (!prompt) return res.status(400).json({ error: 'prompt required' });

  // If an apiKey and model indicate a cloud provider, we could proxy request here.
  // For safety in this repository, we return a synthetic completion.
  const simulatedCompletion = `Simulated completion for model=${model}. Prompt length=${prompt.length}.`;
  const cries = calculateCRIES({ text: prompt });

  return res.status(200).json({ ok: true, completion: simulatedCompletion, cries });
};
const path = require('path');
const { applyRosettaBoot } = require(path.join('../../../lib/rosetta-boot'));

// Demo runner: accepts a prompt and (optionally) an API key/model and returns a simulated
// model output plus a Rosetta CRIES evaluation. This route avoids calling external LLMs in CI.
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { prompt, apiKey, model } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'missing prompt' });

    // In this lightweight demo, we simulate a response instead of calling an external API.
    const modelId = model || 'simulated-model';
    const simulatedOutput = `Simulated (${modelId}): ${String(prompt).slice(0, 1000)}`;

    const cries = await applyRosettaBoot({ output: simulatedOutput, metadata: { model: modelId } });

    return res.status(200).json({ model: modelId, output: simulatedOutput, cries });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
};
// Serverless endpoint to run a simple live test using user-provided API keys.
// Supports OpenAI (Chat Completions) and a basic Anthropic path.
// Accepts POST { prompt, models: string[], useGovernance: boolean, apiKeys: { openai?, anthropic? } }

const { calculateCRIES, applyRosettaBoot } = require('../../lib/rosetta-boot');

async function callOpenAI(apiKey, model, prompt) {
  const url = 'https://api.openai.com/v1/chat/completions';
  const body = {
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 512,
    temperature: 0.2
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`OpenAI error ${resp.status}: ${t}`);
  }
  const data = await resp.json();
  const out = data?.choices?.[0]?.message?.content || (data?.choices?.[0]?.text) || JSON.stringify(data);
  return String(out);
}

async function callAnthropic(apiKey, model, prompt) {
  // Basic Anthropic completion (best-effort; adjust if their API differs)
  const url = 'https://api.anthropic.com/v1/complete';
  const body = {
    model,
    prompt,
    max_tokens: 512,
    temperature: 0.2
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Anthropic error ${resp.status}: ${t}`);
  }
  const data = await resp.json();
  return String(data?.completion || data?.text || JSON.stringify(data));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const { prompt, models = [], apiKeys = {} } = body;
    if (!prompt || !models || models.length === 0) {
      return res.status(400).json({ error: 'missing_prompt_or_models' });
    }

    const results = [];

    for (const model of models) {
      try {
        let provider = 'openai';
        if (model.toLowerCase().includes('claude') || model.toLowerCase().includes('anthropic')) provider = 'anthropic';
        if (model.toLowerCase().includes('llama') || model.toLowerCase().includes('ollama')) provider = 'ollama';

        let output = '';
        if (provider === 'openai') {
          if (!apiKeys.openai) throw new Error('missing_openai_key');
          output = await callOpenAI(apiKeys.openai, model, prompt);
        } else if (provider === 'anthropic') {
          if (!apiKeys.anthropic) throw new Error('missing_anthropic_key');
          output = await callAnthropic(apiKeys.anthropic, model, prompt);
        } else {
          // Ollama/local or unknown providers: return a helpful message
          output = `Provider ${model} not supported by serverless demo. Run Ollama locally or use OpenAI/Anthropic keys.`;
        }

        // Compute demo CRIES metrics for the model output (synthetic)
        const standardCRIES = calculateCRIES();
        const { rosettaCRIES, improvements } = applyRosettaBoot(standardCRIES);

        results.push({ model, provider, output, standardCRIES, rosettaCRIES, improvements });
      } catch (innerErr) {
        results.push({ model, error: innerErr instanceof Error ? innerErr.message : String(innerErr) });
      }
    }

    return res.status(200).json({ ok: true, results });
  } catch (err) {
    console.error('run-test error', err);
    return res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}
