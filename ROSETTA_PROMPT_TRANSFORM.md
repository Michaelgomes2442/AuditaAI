# Rosetta Prompt Transformation Documentation

## Overview
This document shows the actual transformation that happens when Rosetta governance is enabled. The transformation enhances the prompt with governance instructions that improve response quality across all CRIES dimensions.

---

## Transformation Pipeline

### 1. Boot Sequence (`rosetta.boot.init` + `rosetta.boot.whoami`)

**Input**: 
```javascript
{
  name: "System" // or actual user name
}
```

**Output**:
```javascript
{
  type: 'Δ-WHOAMI',
  persona: 'Operator',  // or 'Architect' if name is "Michael Tobin Gomes"
  witness: 'System',
  status: 'BOUND@BOOT',
  ts: '2025-11-04T...',
  lamport: 1
}
```

---

### 2. Persona Lock (`rosetta.persona.lock`)

**Input**: 
```javascript
"System"
```

**Output**:
```javascript
{
  persona: 'Operator',  // Based on user name
  locked: true,
  style: 'auditor',
  weights: {
    rigor: 0.8,
    empathy: 0.8,
    integration: 0.8
  },
  state: {}
}
```

**Persona Mapping**:
- `"Michael Tobin Gomes"` → **Architect** (rigor: 1.0, empathy: 0.7, integration: 0.9)
- Any other name → **Auditor** (rigor: 0.8, empathy: 0.8, integration: 0.8)
- No name → **Witness** (rigor: 0.5, empathy: 0.9, integration: 0.6)

---

### 3. Tri-Track Analysis (`rosetta.triTrack.analyze`)

**Input**:
```javascript
{
  cries: { C: 0.8, R: 0.8, I: 0.8, E: 0.8, S: 0.8 },  // Optional, defaults provided
  goal: 'maximize CRIES coherence'  // Optional
}
```

**Output** (Governance Instructions):
```javascript
{
  cries: { C: 0.8, R: 0.8, I: 0.8, E: 0.8, S: 0.8 },
  omega: 0.8,
  ethics: {
    harm: false,
    bias: false,
    safety: "Ensure response is safe, unbiased, and ethically sound."
  },
  intent: {
    goal: "maximize CRIES coherence",
    drift: 0.447,  // Calculated drift from optimal (1.0 for all metrics)
    contextAnchoring: "Maintain strategic alignment with user intent and context."
  },
  governance: [
    "Adopt a holistic approach: be clear, evidence-driven, integrative across perspectives, considerate of stakeholders, and precise in wording.",
    "Ensure the response maintains tight logical consistency: connect ideas clearly, avoid contradictions, and use explicit transitions.",
    "Provide rigorous analysis: cite specific evidence, state assumptions, and avoid unsubstantiated claims.",
    "Synthesize multiple perspectives: show how elements relate and produce a cohesive framework connecting them.",
    "Demonstrate understanding of stakeholders: acknowledge different viewpoints and address concerns respectfully.",
    "Be precise and accurate: use exact terminology, quantify where possible, and avoid vague generalizations."
  ],
  adaptiveBoost: [
    "holistic",
    "coherence",
    "rigor",
    "integration",
    "empathy",
    "strictness"
  ]
}
```

**Key Point**: These instructions are **ALWAYS** applied regardless of CRIES scores. They don't artificially boost metrics - they improve actual response quality, which naturally results in better CRIES scores.

---

### 4. Speechcraft Application (`rosetta.speechcraft.apply`)

**Input**:
```javascript
{
  persona: 'Operator',
  text: "What is the fastest way to make a million dollars?",
  governance: [
    "Adopt a holistic approach: be clear, evidence-driven...",
    "Ensure the response maintains tight logical consistency...",
    // ... all governance instructions
  ]
}
```

**Output** (Transformed Prompt sent to LLM):

For **Auditor** persona (default for most users):

```
↯ ROSETTA Ω³ / Auditor Mode
Identity: Auditor
Directive: Verify and validate with rigor.

What is the fastest way to make a million dollars?

Audit Response Protocol:

CRIES Governance Active:
• Adopt a holistic approach: be clear, evidence-driven, integrative across perspectives, considerate of stakeholders, and precise in wording.
• Ensure the response maintains tight logical consistency: connect ideas clearly, avoid contradictions, and use explicit transitions.
• Provide rigorous analysis: cite specific evidence, state assumptions, and avoid unsubstantiated claims.
• Synthesize multiple perspectives: show how elements relate and produce a cohesive framework connecting them.
• Demonstrate understanding of stakeholders: acknowledge different viewpoints and address concerns respectfully.
• Be precise and accurate: use exact terminology, quantify where possible, and avoid vague generalizations.

Audit Requirements: Include verification steps, evidence assessment, and compliance checks in your response.
```

For **Architect** persona (Michael Tobin Gomes):

```
↯ ROSETTA Ω³ / Architect Mode
Identity: Architect
Directive: Design and build with precision.

What is the fastest way to make a million dollars?

Architectural Response Protocol:

CRIES Governance Active:
• Adopt a holistic approach: be clear, evidence-driven, integrative across perspectives, considerate of stakeholders, and precise in wording.
• Ensure the response maintains tight logical consistency: connect ideas clearly, avoid contradictions, and use explicit transitions.
• Provide rigorous analysis: cite specific evidence, state assumptions, and avoid unsubstantiated claims.
• Synthesize multiple perspectives: show how elements relate and produce a cohesive framework connecting them.
• Demonstrate understanding of stakeholders: acknowledge different viewpoints and address concerns respectfully.
• Be precise and accurate: use exact terminology, quantify where possible, and avoid vague generalizations.

Architectural Requirements: Structure your response with clear design principles, implementation steps, and architectural reasoning.
```

---

### 5. Canon Cross-Check (`rosetta.canons.crossCheck`)

**Input**:
```javascript
{
  text: "What is the fastest way to make a million dollars?"
}
```

**Output** (Validation):
```javascript
{
  value: true,      // Value canon check
  identity: true,   // Identity canon check
  causality: true,  // Causality canon check
  speech: true,     // Speech canon check
  simplicity: true, // Simplicity canon check
  omega: true       // Ω-structure canon check
}
```

---

## Complete Example: Standard vs Rosetta

### User's Original Prompt
```
What is the fastest way to make a million dollars?
```

### Standard LLM Call (No Governance)
**Prompt sent to Claude**:
```
What is the fastest way to make a million dollars?
```

**Result**: Direct response, may lack structure, citations, or comprehensive analysis.

---

### Rosetta-Governed LLM Call
**Prompt sent to Claude**:
```
↯ ROSETTA Ω³ / Auditor Mode
Identity: Auditor
Directive: Verify and validate with rigor.

What is the fastest way to make a million dollars?

Audit Response Protocol:

CRIES Governance Active:
• Adopt a holistic approach: be clear, evidence-driven, integrative across perspectives, considerate of stakeholders, and precise in wording.
• Ensure the response maintains tight logical consistency: connect ideas clearly, avoid contradictions, and use explicit transitions.
• Provide rigorous analysis: cite specific evidence, state assumptions, and avoid unsubstantiated claims.
• Synthesize multiple perspectives: show how elements relate and produce a cohesive framework connecting them.
• Demonstrate understanding of stakeholders: acknowledge different viewpoints and address concerns respectfully.
• Be precise and accurate: use exact terminology, quantify where possible, and avoid vague generalizations.

Audit Requirements: Include verification steps, evidence assessment, and compliance checks in your response.
```

**Result**: More structured, evidence-based response with:
- Clear logical flow (↑ Coherence)
- Citations and evidence (↑ Rigor)
- Multiple perspectives synthesized (↑ Integration)
- Stakeholder considerations (↑ Empathy)
- Precise terminology (↑ Strictness)

---

## CRIES Analysis

After both responses are received, they're analyzed **independently** by the Track-A CRIES analyzer:

1. **Standard Response** → CRIES Analysis → Scores (e.g., C: 0.42, R: 0.29, I: 0.50, E: 0.68, S: 0.68, Ω: 0.48)
2. **Rosetta Response** → CRIES Analysis → Scores (e.g., C: 0.78, R: 0.85, I: 0.82, E: 0.89, S: 0.91, Ω: 0.85)

**The Rosetta response scores higher because it IS actually higher quality**, not because of artificial inflation.

---

## Key Architecture Principles

1. **Governance ≠ Score Manipulation**: Governance instructions improve actual response quality
2. **Independent Analysis**: CRIES calculation is completely separate from governance
3. **Deterministic Boot**: Same user always gets same persona
4. **Always-On Quality**: Governance instructions are always applied, not conditionally based on scores
5. **Persona-Aware**: Different personas get different framing but same quality standards

---

## MCP Tools Used

| Tool | Purpose | When Called |
|------|---------|-------------|
| `rosetta.boot.init` | Initialize boot sequence | Every governed prompt |
| `rosetta.boot.whoami` | Identify persona | Every governed prompt |
| `rosetta.persona.lock` | Lock persona context | Every governed prompt |
| `rosetta.triTrack.analyze` | Generate governance instructions | Every governed prompt |
| `rosetta.speechcraft.apply` | Transform prompt with governance | Every governed prompt |
| `rosetta.canons.crossCheck` | Validate against canons | Every governed prompt |

---

## Verification

You can see this in action by:
1. Running an audit in the pilot demo
2. Comparing the standard response vs Rosetta response
3. Observing that Rosetta responses are genuinely more structured, evidence-based, and comprehensive
4. Noting that CRIES scores reflect this real quality improvement

The governance system is working as intended: **improving actual response quality**, which the independent CRIES analyzer then measures accurately.
