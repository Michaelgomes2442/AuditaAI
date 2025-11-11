/**
 * Wrapper Parameter Space Definition
 * 
 * Replaces unbounded text mutations with a fixed, learnable parameter vector.
 * Each parameter controls a specific governance behavior.
 */

export type RigorMode = 'off' | 'on' | 'strong';
export type ExamplesMode = 'full' | 'concise' | 'elided';
export type PreambleProfile = 'default' | 'safety' | 'regulatory';

export interface WrapperParams {
  // Rigor: Quantitative requirements & control citations
  rigor: {
    quant_min_numbers: number;        // [0,1] → 0-3 numbers required
    control_id_mode: RigorMode;        // off/on/strong
    scenario_depth: number;            // [0,1] → verbosity of examples
  };
  
  // Integration: Flow descriptions & constraint density
  integration: {
    flow_verbosity: number;            // [0,1] → detail level
    constraints_density: number;       // [0,1] → how many listed
  };
  
  // Coherence: Structure & transitions
  coherence: {
    section_markers: boolean;          // unicode headers on/off
    transitions_strength: number;      // [0,1] → linking phrases
  };
  
  // Strictness: Refusal bias & policy callouts
  strictness: {
    refusal_bias: number;              // [0,1] → likelihood of "no"
    policy_callouts: number;           // [0,1] → 0-5 policy refs
  };
  
  // Empathy: Tone & user acknowledgment
  empathy: {
    direct_address: number;            // [0,1] → "you" usage frequency
    tone_stability: number;            // [0,1] → formality consistency
  };
  
  // Examples: Density & detail level
  examples: {
    mode: ExamplesMode;                // full/concise/elided
  };
  
  // Redundancy: Compression level
  redundancy: {
    compression: number;               // [0,1] → higher = more pruned
  };
  
  // Header: Preamble style
  header: {
    preamble_profile: PreambleProfile; // default/safety/regulatory
  };
}

/**
 * Default parameter configuration (baseline)
 */
export const DEFAULT_PARAMS: WrapperParams = {
  rigor: {
    quant_min_numbers: 0.5,    // 1-2 numbers
    control_id_mode: 'on',
    scenario_depth: 0.6
  },
  integration: {
    flow_verbosity: 0.5,
    constraints_density: 0.5
  },
  coherence: {
    section_markers: true,
    transitions_strength: 0.5
  },
  strictness: {
    refusal_bias: 0.3,
    policy_callouts: 0.4        // 1-2 policies
  },
  empathy: {
    direct_address: 0.4,
    tone_stability: 0.7
  },
  examples: {
    mode: 'concise'
  },
  redundancy: {
    compression: 0.3            // light compression
  },
  header: {
    preamble_profile: 'default'
  }
};

/**
 * Parameter bounds for optimization
 */
export const PARAM_BOUNDS = {
  rigor: {
    quant_min_numbers: [0, 1],
    scenario_depth: [0, 1]
  },
  integration: {
    flow_verbosity: [0, 1],
    constraints_density: [0, 1]
  },
  coherence: {
    transitions_strength: [0, 1]
  },
  strictness: {
    refusal_bias: [0, 1],
    policy_callouts: [0, 1]
  },
  empathy: {
    direct_address: [0, 1],
    tone_stability: [0, 1]
  },
  redundancy: {
    compression: [0, 1]
  }
};

/**
 * Flatten params to continuous vector for optimization
 */
export function paramsToVector(p: WrapperParams): number[] {
  return [
    p.rigor.quant_min_numbers,
    p.rigor.control_id_mode === 'off' ? 0 : p.rigor.control_id_mode === 'on' ? 0.5 : 1,
    p.rigor.scenario_depth,
    p.integration.flow_verbosity,
    p.integration.constraints_density,
    p.coherence.section_markers ? 1 : 0,
    p.coherence.transitions_strength,
    p.strictness.refusal_bias,
    p.strictness.policy_callouts,
    p.empathy.direct_address,
    p.empathy.tone_stability,
    p.examples.mode === 'elided' ? 0 : p.examples.mode === 'concise' ? 0.5 : 1,
    p.redundancy.compression,
    p.header.preamble_profile === 'default' ? 0 : p.header.preamble_profile === 'safety' ? 0.5 : 1
  ];
}

/**
 * Reconstruct params from vector (with rounding for categoricals)
 */
export function vectorToParams(v: number[]): WrapperParams {
  return {
    rigor: {
      quant_min_numbers: Math.max(0, Math.min(1, v[0])),
      control_id_mode: v[1] < 0.33 ? 'off' : v[1] < 0.67 ? 'on' : 'strong',
      scenario_depth: Math.max(0, Math.min(1, v[2]))
    },
    integration: {
      flow_verbosity: Math.max(0, Math.min(1, v[3])),
      constraints_density: Math.max(0, Math.min(1, v[4]))
    },
    coherence: {
      section_markers: v[5] > 0.5,
      transitions_strength: Math.max(0, Math.min(1, v[6]))
    },
    strictness: {
      refusal_bias: Math.max(0, Math.min(1, v[7])),
      policy_callouts: Math.max(0, Math.min(1, v[8]))
    },
    empathy: {
      direct_address: Math.max(0, Math.min(1, v[9])),
      tone_stability: Math.max(0, Math.min(1, v[10]))
    },
    examples: {
      mode: v[11] < 0.33 ? 'elided' : v[11] < 0.67 ? 'concise' : 'full'
    },
    redundancy: {
      compression: Math.max(0, Math.min(1, v[12]))
    },
    header: {
      preamble_profile: v[13] < 0.33 ? 'default' : v[13] < 0.67 ? 'safety' : 'regulatory'
    }
  };
}

/**
 * Human-readable parameter summary
 */
export function formatParams(p: WrapperParams): string {
  return [
    `Rigor: ${(p.rigor.quant_min_numbers * 3).toFixed(1)} nums, ${p.rigor.control_id_mode} IDs, ${(p.rigor.scenario_depth * 100).toFixed(0)}% depth`,
    `Integration: ${(p.integration.flow_verbosity * 100).toFixed(0)}% flow, ${(p.integration.constraints_density * 100).toFixed(0)}% constraints`,
    `Coherence: ${p.coherence.section_markers ? '✓' : '✗'} markers, ${(p.coherence.transitions_strength * 100).toFixed(0)}% transitions`,
    `Strictness: ${(p.strictness.refusal_bias * 100).toFixed(0)}% refusal, ${(p.strictness.policy_callouts * 5).toFixed(1)} policies`,
    `Empathy: ${(p.empathy.direct_address * 100).toFixed(0)}% direct, ${(p.empathy.tone_stability * 100).toFixed(0)}% stable`,
    `Examples: ${p.examples.mode}`,
    `Redundancy: ${(p.redundancy.compression * 100).toFixed(0)}% compression`,
    `Header: ${p.header.preamble_profile}`
  ].join('; ');
}
