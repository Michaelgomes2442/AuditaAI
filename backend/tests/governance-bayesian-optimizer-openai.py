#!/usr/bin/env python3
"""
Bayesian Optimization for Governance Wrapper Tuning - OpenAI Version
Optimized for GPT-4o-mini with cost tracking

Author: AuditaAI Research Team
Date: 2025-11-08

Usage:
    python governance-bayesian-optimizer-openai.py --budget 50 --initial 8
    python governance-bayesian-optimizer-openai.py --budget 20 --initial 6 --api-url http://localhost:3001
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
    Bayesian Optimization with multi-fidelity evaluation for OpenAI models.
    
    Fidelity levels:
    - Low: 1 trial, 1 prompt (~$0.001 for GPT-4o-mini, 30s)
    - Medium: 2 trials, 2 prompts (~$0.004, 90s)
    - High: 3 trials, 4 prompts (~$0.012, 5min)
    
    Note: GPT-4o-mini is ~100x cheaper than Claude Opus
    """
    
    def __init__(self, budget_usd=50.0, n_initial=10, warm_start_params=None, api_url='http://localhost:3001'):
        """
        Args:
            budget_usd: Total budget for optimization runs
            n_initial: Random samples before starting BO loop
            warm_start_params: List of param dicts from previous experiments
            api_url: Backend API base URL
        """
        self.budget = budget_usd
        self.n_initial = n_initial
        self.api_url = api_url
        self.spent = 0.0
        self.history = []
        self.warm_start_params = warm_start_params or []
        
        print(f"\n{'='*70}")
        print("🚀 BAYESIAN OPTIMIZATION FOR GOVERNANCE TUNING - OpenAI")
        print(f"{'='*70}")
        print(f"Budget: ${budget_usd:.2f}")
        print(f"Parameter space: 5D")
        print(f"Initial random samples: {n_initial}")
        print(f"Multi-fidelity: low ($0.001) → medium ($0.004) → high ($0.012)")
        print(f"{'='*70}\n")
    
    def parameter_space(self):
        """5D discrete parameter space for governance tuning."""
        return {
            'depth': (0, 2),                      # 0-2 (3 levels)
            'coherence': (0, 2),                  # 0-2 (3 levels)
            'strictness': (0, 2),                 # 0-2 (3 levels)
            'example_count': (1, 3),              # 1-3 (3 levels)
            'evidence_requirement': (0, 2)        # 0-2 (3 levels)
        }
    
    def encode_params(self, params_dict):
        """Convert param dict to normalized [0,1] vector."""
        space = self.parameter_space()
        vector = []
        for key in sorted(space.keys()):
            val = params_dict[key]
            low, high = space[key]
            normalized = (val - low) / (high - low) if high > low else 0.5
            vector.append(np.clip(normalized, 0, 1))
        return np.array(vector)
    
    def decode_params(self, vector):
        """Convert normalized vector back to param dict (5D discrete)."""
        space = self.parameter_space()
        params = {}
        for i, key in enumerate(sorted(space.keys())):
            low, high = space[key]
            val = int(round(vector[i] * (high - low) + low))
            params[key] = int(np.clip(val, low, high))
        return params
    
    def generate_governance_template(self, params):
        """
        Build governance template parameters from optimization vector.
        Returns dict compatible with your buildGovernanceFromTemplate() function.
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
        
        example_text = f"Include {params['example_count']} concrete, domain-specific example"
        if params['example_count'] > 1:
            example_text += "s"
        if params['example_count'] >= 2:
            example_text += " with dates, numbers, or specific metrics"
        example_text += "."
        
        return {
            'depthRequirement': DEPTH_OPTIONS[params['depth']],
            'coherenceStructure': COHERENCE_OPTIONS[params['coherence']],
            'strictnessPolicy': STRICTNESS_OPTIONS[params['strictness']],
            'exampleRequirement': example_text,
            'evidenceRequirement': ['minimal', 'moderate', 'strict'][params['evidence_requirement']]
        }
    
    def estimate_cost(self, fidelity):
        """Estimate cost for evaluation at given fidelity."""
        costs = {'low': 0.001, 'medium': 0.004, 'high': 0.012}
        return costs.get(fidelity, 0.001)
    
    def select_fidelity(self, remaining_budget):
        """Select fidelity based on remaining budget."""
        if remaining_budget < 0.001:
            return None
        elif remaining_budget < 0.006:
            return 'low'
        elif remaining_budget < 0.020:
            return 'medium'
        else:
            return 'high'
    
    def evaluate(self, params_dict, fidelity='low'):
        """Evaluate governance configuration at given fidelity."""
        import tempfile
        
        governance_template = self.generate_governance_template(params_dict)
        config = {
            'governance': governance_template,
            'fidelity': fidelity,
            'trials': {'low': 1, 'medium': 2, 'high': 3}[fidelity],
            'prompts': {'low': 1, 'medium': 2, 'high': 4}[fidelity],
            'timeout': {'low': 30, 'medium': 90, 'high': 300}[fidelity]
        }
        
        backend_path = Path(__file__).parent.parent
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(config, f)
            temp_config_path = f.name
        
        env = os.environ.copy()
        env['BO_PARAMS_FILE'] = temp_config_path
        env['BO_FIDELITY'] = fidelity
        
        try:
            result = subprocess.run([
                'npx', 'playwright', 'test',
                'governance-optimizer-openai.test.js',
                '--grep', 'Bayesian Optimization Evaluation',
                '--timeout', str(config['timeout'] * 1000)
            ], 
            capture_output=True, 
            text=True, 
            cwd=backend_path,
            env=env,
            timeout=config['timeout'] + 30
            )
            
            output_match = re.search(r'__BO_OUTPUT__(.*?)__BO_END__', result.stdout, re.DOTALL)
            if not output_match:
                print(f"❌ Failed to parse test output")
                print(f"STDOUT: {result.stdout[-500:]}")
                print(f"STDERR: {result.stderr[-500:]}")
                raise ValueError("Could not find __BO_OUTPUT__ marker in test output")
            
            output = json.loads(output_match.group(1))
            
            if 'error' in output:
                raise ValueError(f"Evaluation error: {output['error']}")
            
            omega = output['omegaStats']['mean']
            cost = output['costMetrics']['totalCost']
            cv = float(output['omegaStats']['coefficientOfVariation'])
            
            composite_score = omega - (cv * 0.08)
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
            return 0.0, config['trials'] * config['prompts'] * 0.001, {
                'error': 'timeout',
                'fidelity': fidelity
            }
        finally:
            Path(temp_config_path).unlink(missing_ok=True)
    
    def optimize(self):
        """Run Bayesian optimization loop."""
        X_train = []
        y_train = []
        
        print("📍 PHASE 1: Random Exploration\n")
        
        total_random = len(self.warm_start_params) + self.n_initial
        for i in range(total_random):
            if i < len(self.warm_start_params):
                params = self.warm_start_params[i]
                print(f"[Warm {i+1}/{len(self.warm_start_params)}] Evaluating {params['name'] if 'name' in params else 'variant'}")
            else:
                random_vector = np.random.uniform(0, 1, 5)
                params = self.decode_params(random_vector)
                print(f"[Random {i-len(self.warm_start_params)+1}/{self.n_initial}] Evaluating params: {params}")
            
            fidelity = self.select_fidelity(self.budget - self.spent)
            if not fidelity:
                print(f"⛔ Budget exhausted: ${self.spent:.2f} / ${self.budget:.2f}")
                break
            
            try:
                score, cost, meta = self.evaluate(params, fidelity)
                self.spent += cost
                
                X_train.append(self.encode_params(params))
                y_train.append(score)
                self.history.append({
                    'params': params,
                    'score': score,
                    'cost': cost,
                    'metadata': meta
                })
                
                print(f"      Score: {score:.4f} | Ω: {meta.get('omega_raw', 0):.4f} | Cost: ${cost:.4f}")
                print(f"      Total: ${self.spent:.2f} / ${self.budget:.2f}\n")
                
            except Exception as e:
                print(f"❌ Evaluation failed: {e}\n")
                self.spent += self.estimate_cost(fidelity)
        
        if len(X_train) == 0:
            raise ValueError("No successful evaluations completed")
        
        X_train = np.array(X_train)
        y_train = np.array(y_train)
        
        print(f"\n🎯 PHASE 2: Bayesian Optimization Loop\n")
        
        kernel = ConstantKernel(1.0) * RBF(length_scale=1.0) + Matern(nu=2.5)
        gp = GaussianProcessRegressor(kernel=kernel, n_restarts_optimizer=5, random_state=42, alpha=1e-6)
        
        bo_iteration = 0
        while self.spent < self.budget:
            fidelity = self.select_fidelity(self.budget - self.spent)
            if not fidelity:
                print(f"⛔ Budget exhausted: ${self.spent:.2f} / ${self.budget:.2f}")
                break
            
            gp.fit(X_train, y_train)
            
            def acquisition(x):
                x_reshaped = x.reshape(1, -1)
                mu, sigma = gp.predict(x_reshaped, return_std=True)
                Z = (mu - np.max(y_train)) / (sigma + 1e-9)
                ei = (mu - np.max(y_train)) + sigma * norm.pdf(Z) / (norm.cdf(Z) + 1e-9)
                return -ei[0]
            
            x0 = np.random.uniform(0, 1, 5)
            result = minimize(acquisition, x0, bounds=[(0, 1)] * 5, method='L-BFGS-B')
            next_x = result.x
            next_params = self.decode_params(next_x)
            
            bo_iteration += 1
            print(f"[BO {bo_iteration}] Fidelity: {fidelity:6} | Params: {next_params}")
            
            try:
                score, cost, meta = self.evaluate(next_params, fidelity)
                self.spent += cost
                
                X_train = np.vstack([X_train, next_x])
                y_train = np.append(y_train, score)
                self.history.append({
                    'params': next_params,
                    'score': score,
                    'cost': cost,
                    'metadata': meta,
                    'fidelity': fidelity
                })
                
                print(f"      Score: {score:.4f} | Ω: {meta.get('omega_raw', 0):.4f} | Cost: ${cost:.4f}")
                print(f"      Total: ${self.spent:.2f} / ${self.budget:.2f}\n")
                
            except Exception as e:
                print(f"❌ BO evaluation failed: {e}\n")
                self.spent += cost
        
        best_idx = np.argmax(y_train)
        best_params = self.decode_params(X_train[best_idx])
        best_score = y_train[best_idx]
        best_meta = self.history[best_idx]['metadata']
        
        return best_params, best_score, best_meta


# v2.x Warm-start variants (for reference)
V2_VARIANTS = [
    {'name': 'v2.5-balanced', 'depth': 1, 'coherence': 1, 'strictness': 1, 'example_count': 2, 'evidence_requirement': 1},
    {'name': 'v2.4-rigor', 'depth': 2, 'coherence': 2, 'strictness': 2, 'example_count': 3, 'evidence_requirement': 2},
    {'name': 'v2.2-depth', 'depth': 2, 'coherence': 1, 'strictness': 1, 'example_count': 2, 'evidence_requirement': 1}
]


def main():
    parser = argparse.ArgumentParser(description='Bayesian Optimization for Governance Tuning - OpenAI')
    parser.add_argument('--budget', type=float, default=50.0, help='Total budget in USD (default: 50.0)')
    parser.add_argument('--n-initial', type=int, default=10, help='Initial random samples (default: 10)')
    parser.add_argument('--warm-start', action='store_true', help='Use v2.x variants as warm start')
    parser.add_argument('--no-warm-start', dest='warm_start', action='store_false')
    parser.set_defaults(warm_start=True)
    
    args = parser.parse_args()
    
    warm_start_params = V2_VARIANTS if args.warm_start else None
    
    optimizer = MultiFidelityGovernanceOptimizer(
        budget_usd=args.budget,
        n_initial=args.n_initial,
        warm_start_params=warm_start_params
    )
    
    try:
        best_params, best_score, best_meta = optimizer.optimize()
        
        print("\n" + "="*70)
        print("🎉 SUCCESS - OpenAI Optimization completed successfully")
        print("="*70)
        print(f"\nBest governance configuration achieves Ω = {best_meta.get('omega_raw', 0):.4f}")
        print(f"Ready to deploy as v3.0 governance variant (OpenAI)")
        
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
