# Rosetta-Full Governance Profile

This file is a reference marker. The actual Rosetta-Full governance prompt is generated dynamically by the MCP server via `buildGovernedPrompt()`.

## Profile Details

**Target Models**: Frontier LLMs (>40B parameters)
- GPT-5 series
- Claude 3.5 Sonnet, Claude 3 Opus
- Gemini 2 Pro
- Llama 3.1 70B/405B
- Mistral Large

**Governance Source**: MCP Server → `rosetta.speechcraft.apply`

**Size**: ~6,000+ tokens

**Components**:
- Full vΩ governance boot sequence
- Complete Track-A/B/C pipeline with reasoning vault
- Persona-lock (Auditor mode)
- CRIES-binding with all 5 dimensions
- Execution-mode scaffolding
- Hard constraints and anti-jailbreak rules
- Escalation paths and arbitration logic
- Lamport timestamp integration
- Full receipt generation metadata

## Usage

Rosetta-Full is automatically selected when:
```javascript
const tier = getModelTier(modelName);
if (tier === 'full') {
  // Use MCP-generated governance via buildGovernedPrompt()
  const governanceResult = await buildGovernedPrompt(prompt, options);
  systemPrompt = governanceResult.transformedPrompt;
}
```

## Implementation

See: `/backend/src/llm-client.js` → `buildGovernedPrompt()` function

The MCP server (`rosetta/mcp/kernel/speechcraft.ts`) generates the complete governance template including:
- `<BOOT>` sequence
- `<EXECUTION-MODE>` constraints
- `<PERSONA-LOCK>` directives
- `<INTERNAL-TRACKS>` logic
- `<REASONING-VAULT>` instructions
- `<HARD-CONSTRAINTS>` enforcement

This ensures frontier models receive maximum governance fidelity for enterprise-grade audits.
