#!/usr/bin/env python3
"""
Bayesian Optimization for Governance Wrapper Tuning - Anthropic Version
Optimized for Claude Opus models via governance-optimizer-v2.test.js

Author: AuditaAI Research Team
Date: 2025-11-08

Usage:
    python governance-bayesian-optimizer.py --budget 50 --initial 8
    python governance-bayesian-optimizer.py --budget 20 --initial 6 --api-url http://localhost:3001

Note: For OpenAI models, use governance-bayesian-optimizer-openai.py
"""

import numpy as np
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import RBF, ConstantKernel, Matern
from scipy.optimize import minimize
from scipy.stats import norm
import subprocess
import json
import os
import sys
import tempfile
import argparse
from pathlib import Path
from datetime import datetime
import re


class MultiFidelityGovernanceOptimizer:
    """
    Bayesian Optimization with multi-fidelity evaluation for Anthropic models.
    Integrates seamlessly with governance-optimizer-v2.test.js (Claude Opus)
    
    Fidelity levels:
    - Low: 1 trial, 1 prompt (~$0.02, 30s) - Claude Opus pricing
    - Medium: 2 trials, 2 prompts (~$0.08, 90s)
    - High: 3 trials, 4 prompts (~$0.24, 5min)
    
    For OpenAI models, use governance-bayesian-optimizer-openai.py instead.
    """
    
    def __init__(self, budget_usd=50.0, n_initial=10, warm_start_params=None, api_url='http://localhost:3001'):
        """
        Args:
            budget_usd: Total budget for optimization runs
            n_initial: Random samples before starting BO loop
            warm_start_params: List of param dicts from previous experiments (v2.x variants)
            api_url: Backend API base URL
        """
        self.budget = budget_usd
        self.n_initial = n_initial
        self.api_url = api_url
        self.spent = 0.0
        self.X = []  # Parameter vectors
        self.y = []  # Observed composite scores
        self.costs = []  # Per-evaluation costs
        self.fidelities = []  # Track fidelity used
        self.metadata = []  # Full evaluation metadata
        
        # Warm start with existing v2.x variants
        if warm_start_params:
            print(f"🔥 Warm starting with {len(warm_start_params)} existing variants")
            self._warm_start(warm_start_params)
        
        # GP hyperparameters (tuned for prompt optimization)
        kernel = ConstantKernel(1.0, (1e-3, 1e3)) * Matern(
            length_scale=1.0, 
            length_scale_bounds=(1e-2, 1e2),
            nu=2.5  # Controls smoothness (2.5 = good for noisy functions)
        )
        
        self.gp = GaussianProcessRegressor(
            kernel=kernel,
            n_restarts_optimizer=10,
            alpha=0.01,  # Noise variance (CV² ≈ 0.10² from your data)
            normalize_y=True
        )
        
        # Multi-fidelity thresholds
        self.high_fidelity_threshold = 0.90  # Top 10% get full evaluation
        self.medium_fidelity_threshold = 0.70  # Top 30% get medium
    
    def parameter_space(self):
        """
        Define searchable parameter space.
        5D discrete space covering governance structure.
        """
        return {
            'depth_level': (0, 2),  # Index into DEPTH_LEVEL array (discrete)
            'example_count': (1, 3),  # 1-3 examples (discrete)
            'rigor_steps': (2, 4),  # 2-4 causal chain steps (discrete)
            'coherence_style': (0, 2),  # Index into COHERENCE_STRUCTURE (discrete)
            'strictness_level': (0, 2),  # Index into STRICTNESS_RULES (discrete)
        }
    
    def encode_params(self, params_dict):
        """Convert param dict to normalized [0,1] vector for 5D discrete space."""
        space = self.parameter_space()
        vector = []
        for key in sorted(space.keys()):
            val = params_dict[key]
            low, high = space[key]
            # Normalize to [0, 1]
            normalized = (val - low) / (high - low) if high > low else 0.5
            vector.append(np.clip(normalized, 0, 1))
        return np.array(vector)
    
    def decode_params(self, vector):
        """Convert normalized vector back to param dict (5D discrete)."""
        space = self.parameter_space()
        params = {}
        for i, key in enumerate(sorted(space.keys())):
            low, high = space[key]
            # Denormalize from [0, 1] and round to nearest integer
            val = int(round(vector[i] * (high - low) + low))
            params[key] = int(np.clip(val, low, high))
        return params
    
    def generate_governance_template(self, params):
        """
        Build governance template parameters from optimization vector.
        Returns dict compatible with your buildGovernanceFromTemplate() function.
        
        5D discrete parameters only - no continuous emphasis weights.
        """
        DEPTH_OPTIONS = [
            "Provide exactly 2–3 layers of depth for each key point.",
            "Provide 3–4 layers of depth with explicit causal links.",
            "Provide 4–5 layers of depth with nested hierarchical reasoning."
        ]
        
        COHERENCE_OPTIONS = [
            "Use clean bullet hierarchy.",
            "Use structured numbered reasoning trees.",
            "Use multi-layer outline formatting (I → A → 1 → a)."
        ]
        
        STRICTNESS_OPTIONS = [
            "Avoid speculation or unsupported claims.",
            "Ban ungrounded statements and require uncertainty flags.",
            "Require explicit confidence statements and evidence citations."
        ]
        
        # Build example requirements text
        example_text = f"Include {params['example_count']} concrete, domain-specific example"
        if params['example_count'] > 1:
            example_text += "s"
        if params['example_count'] >= 2:
            example_text += " with dates, numbers, or specific metrics"
        example_text += "."
        
        # Build rigor pattern text
        rigor_text = f"Use a {params['rigor_steps']}-step causal chain"
        if params['rigor_steps'] >= 3:
            rigor_text += " with evidence and justification"
        if params['rigor_steps'] >= 4:
            rigor_text += " including counterfactuals"
        rigor_text += "."
        
        return {
            'DEPTH_LEVEL': DEPTH_OPTIONS[params['depth_level']],
            'EXAMPLE_REQUIREMENTS': example_text,
            'RIGOR_PATTERN': rigor_text,
            'COHERENCE_STRUCTURE': COHERENCE_OPTIONS[params['coherence_style']],
            'STRICTNESS_RULES': STRICTNESS_OPTIONS[params['strictness_level']],
        }
    
    def evaluate_governance(self, params_dict, fidelity='low'):
        """
        Run Playwright test with specified fidelity.
        
        Args:
            params_dict: Parameter dictionary
            fidelity: 'low', 'medium', or 'high'
        
        Returns:
            (composite_score, cost_usd, metadata_dict)
        """
        fidelity_configs = {
            'low': {'trials': 1, 'prompts': 1, 'timeout': 120},
            'medium': {'trials': 2, 'prompts': 2, 'timeout': 240},
            'high': {'trials': 3, 'prompts': 4, 'timeout': 600}
        }
        
        config = fidelity_configs[fidelity]
        
        # Generate governance parameters
        template_params = self.generate_governance_template(params_dict)
        
        # Write to temp file for Playwright to read
        temp_config_path = '/tmp/bo_governance_params.json'
        with open(temp_config_path, 'w') as f:
            json.dump({
                'template_params': template_params,
                'trials': config['trials'],
                'prompts': config['prompts'],
                'fidelity': fidelity
            }, f, indent=2)
        
        # Run Playwright test
        backend_path = Path(__file__).parent.parent
        env = os.environ.copy()
        env['BO_PARAMS_FILE'] = temp_config_path
        env['BO_FIDELITY'] = fidelity
        
        try:
            result = subprocess.run([
                'npx', 'playwright', 'test',
                'governance-optimizer-v2.test.js',
                '--grep', 'Bayesian Optimization Evaluation',
                '--timeout', str(config['timeout'] * 1000)
            ], 
            capture_output=True, 
            text=True, 
            cwd=backend_path,
            env=env,
            timeout=config['timeout'] + 30
            )
            
            # Parse JSON output from test
            output_match = re.search(r'__BO_OUTPUT__(.*?)__BO_END__', result.stdout, re.DOTALL)
            if not output_match:
                print(f"❌ Failed to parse test output")
                print(f"STDOUT: {result.stdout[-500:]}")
                print(f"STDERR: {result.stderr[-500:]}")
                raise ValueError("Could not find __BO_OUTPUT__ marker in test output")
            
            output = json.loads(output_match.group(1))
            
            omega = output['omegaStats']['mean']
            cost = output['costMetrics']['totalCost']
            cv = output['omegaStats']['coefficientOfVariation']
            
            # Composite score with penalties
            composite_score = omega - (cv * 0.08)
            
            # Penalize low Security/Integrity floors
            S_mean = output['pillarStats']['S']['mean']
            I_mean = output['pillarStats']['I']['mean']
            composite_score -= max(0, 0.85 - S_mean) * 2
            composite_score -= max(0, 0.80 - I_mean)
            
            metadata = {
                'omega_raw': omega,
                'cv': cv,
                'composite_score': composite_score,
                'pillars': output['pillarStats'],
                'cost': cost,
                'fidelity': fidelity,
                'params': params_dict
            }
            
            return composite_score, cost, metadata
            
        except subprocess.TimeoutExpired:
            print(f"⏱️ Evaluation timed out at {config['timeout']}s")
            # Return penalty score
            return 0.0, config['trials'] * config['prompts'] * 0.08, {
                'error': 'timeout',
                'fidelity': fidelity
            }
        except Exception as e:
            print(f"❌ Evaluation error: {e}")
            return 0.0, 0.01, {'error': str(e), 'fidelity': fidelity}
    
    def select_fidelity(self, x_candidate):
        """
        Decide which fidelity to use based on acquisition function value.
        High EI → high fidelity (worth the cost)
        Low EI → low fidelity (cheap screening)
        """
        if len(self.y) < self.n_initial:
            return 'low'  # Always use low fidelity during random exploration
        
        ei = self.acquisition_function(x_candidate)
        
        # Normalize EI by max observed
        if len(self.y) > 0:
            ei_normalized = ei / (np.std(self.y) + 1e-6)
        else:
            ei_normalized = 0
        
        if ei_normalized > self.high_fidelity_threshold:
            return 'high'
        elif ei_normalized > self.medium_fidelity_threshold:
            return 'medium'
        else:
            return 'low'
    
    def acquisition_function(self, X_candidate):
        """
        Expected Improvement (EI) acquisition function.
        Balances exploration (high uncertainty) vs exploitation (high mean).
        """
        if len(self.y) == 0:
            return 0.0
        
        X_candidate = X_candidate.reshape(1, -1)
        
        mu, sigma = self.gp.predict(X_candidate, return_std=True)
        mu = mu[0]
        sigma = sigma[0]
        
        # Current best observed value
        y_best = np.max(self.y)
        
        # Expected Improvement
        if sigma < 1e-6:
            return 0.0
        
        Z = (mu - y_best) / sigma
        ei = (mu - y_best) * norm.cdf(Z) + sigma * norm.pdf(Z)
        
        return ei
    
    def suggest_next_sample(self):
        """
        Use acquisition function to suggest next parameter vector.
        Multi-start optimization to avoid local optima in acquisition landscape.
        """
        dim = len(self.parameter_space())
        best_ei = -np.inf
        best_x = None
        
        # Multi-start optimization (25 random initializations)
        for _ in range(25):
            x0 = np.random.uniform(0, 1, dim)
            
            # Minimize negative EI (= maximize EI)
            res = minimize(
                lambda x: -self.acquisition_function(x),
                x0,
                bounds=[(0, 1)] * dim,
                method='L-BFGS-B',
                options={'maxiter': 100}
            )
            
            if -res.fun > best_ei:
                best_ei = -res.fun
                best_x = res.x
        
        return best_x
    
    def _warm_start(self, param_list):
        """Initialize with known good parameters from v2.x variants"""
        print("\n🔥 Warm Start Phase")
        for i, params in enumerate(param_list):
            print(f"  [{i+1}/{len(param_list)}] Evaluating {params.get('name', 'variant')}")
            
            x = self.encode_params(params)
            score, cost, meta = self.evaluate_governance(params, fidelity='high')
            
            self.X.append(x)
            self.y.append(score)
            self.costs.append(cost)
            self.fidelities.append('high')
            self.metadata.append(meta)
            self.spent += cost
            
            print(f"      Score: {score:.4f} | Ω: {meta.get('omega_raw', 0):.4f} | Cost: ${cost:.4f}")
    
    def optimize(self):
        """
        Main Bayesian Optimization loop with multi-fidelity evaluation.
        """
        print("\n" + "="*70)
        print("🚀 BAYESIAN OPTIMIZATION FOR GOVERNANCE TUNING")
        print("="*70)
        print(f"Budget: ${self.budget:.2f}")
        print(f"Parameter space: {len(self.parameter_space())}D")
        print(f"Initial random samples: {self.n_initial}")
        print(f"Multi-fidelity: low ($0.02) → medium ($0.08) → high ($0.24)")
        print("="*70 + "\n")
        
        iteration = 0
        
        # Phase 1: Random exploration with low fidelity
        print("📍 PHASE 1: Random Exploration\n")
        for i in range(self.n_initial):
            if self.spent >= self.budget:
                break
            
            iteration += 1
            print(f"[Random {i+1}/{self.n_initial}] ", end='')
            
            # Sample random parameters
            x = np.random.uniform(0, 1, len(self.parameter_space()))
            params = self.decode_params(x)
            
            # Always use low fidelity for random exploration
            score, cost, meta = self.evaluate_governance(params, fidelity='low')
            
            self.X.append(x)
            self.y.append(score)
            self.costs.append(cost)
            self.fidelities.append('low')
            self.metadata.append(meta)
            self.spent += cost
            
            print(f"Score: {score:.4f} | Ω: {meta.get('omega_raw', 0):.4f} | CV: {meta.get('cv', 0):.2f}% | Cost: ${cost:.4f} | Total: ${self.spent:.2f}")
        
        # Phase 2: Bayesian optimization loop
        print(f"\n🎯 PHASE 2: Bayesian Optimization Loop\n")
        
        while self.spent < self.budget:
            iteration += 1
            
            # Fit GP on all data so far
            X_train = np.array(self.X)
            y_train = np.array(self.y)
            
            try:
                self.gp.fit(X_train, y_train)
            except Exception as e:
                print(f"⚠️ GP fit failed: {e}")
                break
            
            # Suggest next sample
            x_next = self.suggest_next_sample()
            params_next = self.decode_params(x_next)
            
            # Select fidelity based on acquisition value
            fidelity = self.select_fidelity(x_next)
            
            print(f"[BO {iteration - self.n_initial}] Fidelity: {fidelity:6s} | ", end='')
            
            # Evaluate
            score, cost, meta = self.evaluate_governance(params_next, fidelity=fidelity)
            
            self.X.append(x_next)
            self.y.append(score)
            self.costs.append(cost)
            self.fidelities.append(fidelity)
            self.metadata.append(meta)
            self.spent += cost
            
            # Current best
            best_idx = np.argmax(self.y)
            best_score = self.y[best_idx]
            
            print(f"Score: {score:.4f} | Ω: {meta.get('omega_raw', 0):.4f} | CV: {meta.get('cv', 0):.2f}% | Cost: ${cost:.4f} | Total: ${self.spent:.2f}")
            print(f"          🏆 Best: {best_score:.4f} (iter {best_idx})")
            
            if self.spent >= self.budget:
                print(f"\n💰 Budget exhausted")
                break
        
        # Final results and analysis
        self._print_results()
        self._save_results()
        
        best_idx = np.argmax(self.y)
        best_params = self.decode_params(self.X[best_idx])
        best_score = self.y[best_idx]
        
        return best_params, best_score, self.metadata[best_idx]
    
    def _print_results(self):
        """Print comprehensive optimization results"""
        print("\n" + "="*70)
        print("✅ OPTIMIZATION COMPLETE")
        print("="*70)
        
        best_idx = np.argmax(self.y)
        best_score = self.y[best_idx]
        best_params = self.decode_params(self.X[best_idx])
        best_meta = self.metadata[best_idx]
        
        print(f"\n🥇 BEST CONFIGURATION")
        print(f"   Score: {best_score:.4f}")
        print(f"   Omega: {best_meta.get('omega_raw', 0):.4f}")
        print(f"   CV: {best_meta.get('cv', 0):.2f}%")
        print(f"   Fidelity: {self.fidelities[best_idx]}")
        print(f"   Found at iteration: {best_idx + 1}")
        print(f"\n   Parameters:")
        for key, val in sorted(best_params.items()):
            print(f"     {key:25s}: {val}")
        
        if 'pillars' in best_meta:
            print(f"\n   CRIES Pillars:")
            for pillar in ['C', 'R', 'I', 'E', 'S']:
                mean = best_meta['pillars'][pillar]['mean']
                print(f"     {pillar}: {mean:.4f}")
        
        print(f"\n💰 BUDGET ANALYSIS")
        print(f"   Total spent: ${self.spent:.2f} / ${self.budget:.2f}")
        print(f"   Evaluations: {len(self.y)}")
        print(f"   Cost per eval: ${self.spent/len(self.y):.4f}")
        
        # Fidelity breakdown
        fidelity_counts = {f: self.fidelities.count(f) for f in ['low', 'medium', 'high']}
        print(f"\n📊 FIDELITY BREAKDOWN")
        print(f"   Low (1t×1p):    {fidelity_counts.get('low', 0):3d} evaluations")
        print(f"   Medium (2t×2p): {fidelity_counts.get('medium', 0):3d} evaluations")
        print(f"   High (3t×4p):   {fidelity_counts.get('high', 0):3d} evaluations")
        
        # Top 5 configurations
        top_5_idx = np.argsort(self.y)[-5:][::-1]
        print(f"\n🏆 TOP 5 CONFIGURATIONS")
        for rank, idx in enumerate(top_5_idx, 1):
            score = self.y[idx]
            omega = self.metadata[idx].get('omega_raw', 0)
            cv = self.metadata[idx].get('cv', 0)
            fid = self.fidelities[idx]
            print(f"   #{rank}. Score: {score:.4f} | Ω: {omega:.4f} | CV: {cv:.2f}% | Fidelity: {fid}")
    
    def _save_results(self):
        """Save optimization results to JSON file"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'governance_bo_results_{timestamp}.json'
        
        results = {
            'optimization_info': {
                'method': 'Bayesian Optimization with Multi-Fidelity',
                'timestamp': timestamp,
                'budget_usd': self.budget,
                'spent_usd': self.spent,
                'n_evaluations': len(self.y),
                'parameter_space_dim': len(self.parameter_space())
            },
            'best_configuration': {
                'score': float(np.max(self.y)),
                'params': self.decode_params(self.X[np.argmax(self.y)]),
                'metadata': self.metadata[np.argmax(self.y)],
                'iteration': int(np.argmax(self.y))
            },
            'all_evaluations': [
                {
                    'iteration': i,
                    'params': self.decode_params(self.X[i]),
                    'score': float(self.y[i]),
                    'cost': float(self.costs[i]),
                    'fidelity': self.fidelities[i],
                    'metadata': self.metadata[i]
                }
                for i in range(len(self.y))
            ],
            'top_5': [
                {
                    'rank': rank,
                    'iteration': int(idx),
                    'score': float(self.y[idx]),
                    'params': self.decode_params(self.X[idx]),
                    'metadata': self.metadata[idx]
                }
                for rank, idx in enumerate(np.argsort(self.y)[-5:][::-1], 1)
            ]
        }
        
        output_path = Path(__file__).parent.parent / filename
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\n💾 Results saved to: {filename}")


# Warm start configurations from your v2.x variants
V2_VARIANTS = [
    {
        'name': 'v2.5-balanced',
        'depth_level': 1,
        'example_count': 2,
        'rigor_steps': 3,
        'coherence_style': 1,
        'strictness_level': 1,
        'max_governance_tokens': 1200,
        'coherence_weight': 1.0,
        'reliability_weight': 1.0
    },
    {
        'name': 'v2.4-rigor',
        'depth_level': 2,
        'example_count': 2,
        'rigor_steps': 3,
        'coherence_style': 1,
        'strictness_level': 2,
        'max_governance_tokens': 1400,
        'coherence_weight': 1.0,
        'reliability_weight': 1.2
    },
    {
        'name': 'v2.2-depth',
        'depth_level': 1,
        'example_count': 1,
        'rigor_steps': 2,
        'coherence_style': 0,
        'strictness_level': 0,
        'max_governance_tokens': 1000,
        'coherence_weight': 1.2,
        'reliability_weight': 1.0
    }
]


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Bayesian Optimization for Governance Tuning')
    parser.add_argument('--budget', type=float, default=50.0, help='Total budget in USD (default: 50.0)')
    parser.add_argument('--n-initial', type=int, default=10, help='Initial random samples (default: 10)')
    parser.add_argument('--warm-start', action='store_true', help='Use v2.x variants as warm start')
    parser.add_argument('--no-warm-start', dest='warm_start', action='store_false')
    parser.set_defaults(warm_start=True)
    
    args = parser.parse_args()
    
    # Initialize optimizer
    warm_start_params = V2_VARIANTS if args.warm_start else None
    
    optimizer = MultiFidelityGovernanceOptimizer(
        budget_usd=args.budget,
        n_initial=args.n_initial,
        warm_start_params=warm_start_params
    )
    
    # Run optimization
    try:
        best_params, best_score, best_meta = optimizer.optimize()
        
        print("\n" + "="*70)
        print("🎉 SUCCESS - Optimization completed successfully")
        print("="*70)
        print(f"\nBest governance configuration achieves Ω = {best_meta.get('omega_raw', 0):.4f}")
        print(f"Ready to deploy as v3.0 governance variant")
        
        return 0
        
    except KeyboardInterrupt:
        print("\n\n⚠️ Optimization interrupted by user")
        print(f"Partial results saved. Spent: ${optimizer.spent:.2f}")
        return 1
    except Exception as e:
        print(f"\n\n❌ Optimization failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())
