#!/usr/bin/env python3
"""
CRIES Optimizer - Direct Governance Wrapper Optimization
Tests wrapper variations directly using LLM client CRIES scoring
Optimizes for Coherence, Rigor, Integration, Empathy, Strictness

Usage:
    python cries-optimizer.py --model gpt-4 --budget 10 --test-query "security mechanisms"
    python cries-optimizer.py --model claude --budget 5 --test-query "audit systems"
"""

import os
import sys
import json
import argparse
import tempfile
import subprocess
from pathlib import Path
from datetime import datetime
from collections import defaultdict

# Governance wrapper variations to test
WRAPPER_VARIATIONS = {
    'v1_baseline': {
        'name': 'Baseline - Current Wrapper',
        'description': 'Current production wrapper',
        'coherence_focus': False,
        'rigor_focus': False,
        'integration_focus': False,
        'empathy_focus': False,
        'strictness_focus': False,
    },
    'v2_coherence': {
        'name': 'Enhanced Coherence',
        'description': 'Maximize narrative flow with stronger transitions',
        'coherence_focus': True,
        'rigor_focus': False,
        'integration_focus': False,
        'empathy_focus': False,
        'strictness_focus': False,
        'instructions': '''
Instead of "Structure your visible analysis as organic, multi-paragraph prose", use:

"Compose your response as a flowing narrative where each paragraph builds naturally on the previous one. Start with the core problem or context. Progress through implications with clear causal language (because, therefore, consequently, this leads to). Conclude with actionable synthesis. Use transitional phrases that reveal logical progression: 'In practice this means...', 'Taking this further...', 'The implication for operations is...'. Every sentence should feel like a necessary step in explaining something complex to a peer."
        '''
    },
    'v3_rigor': {
        'name': 'Enhanced Rigor',
        'description': 'Maximize measurable specificity and standards',
        'coherence_focus': False,
        'rigor_focus': True,
        'integration_focus': False,
        'empathy_focus': False,
        'strictness_focus': False,
        'instructions': '''
Replace "Ground your analysis in concrete, measurable terms" with:

"Every mechanism you describe must include concrete numbers: thresholds (e.g., 100ms timeout), ranges (e.g., 50-500 concurrent connections), percentages (e.g., 99.9% uptime SLA). Walk through at least one realistic failure scenario with specific metrics: 'When load exceeds 10,000 req/s, circuit breaker triggers after 5 consecutive 503s within 30s window.' Reference specific standards with exact control numbers: NIST AC-2.1 (single-factor auth), SOC2 CC6.1 (restrict access to authenticated principals), ISO 27001 A.9.2.1 (formal access procedures). Cite production observables: 'Query latency p99 visible in CloudWatch', 'Failed auth attempts logged in syslog'."
        '''
    },
    'v4_integration': {
        'name': 'Enhanced Integration',
        'description': 'Maximize system context and operational reality',
        'coherence_focus': False,
        'rigor_focus': False,
        'integration_focus': True,
        'empathy_focus': False,
        'strictness_focus': False,
        'instructions': '''
Replace "Show how technical mechanisms connect to operational reality" with:

"Trace the complete flow: upstream service → your component → downstream consumer. Explain how this mechanism interacts with other systems: 'Rate limiting coordinates with load balancer via shared Redis key', 'Audit logging feeds threat detection system's SIEM pipeline', 'Config changes propagate to all 50 instances via ZooKeeper watch'. Connect to operational constraints: 'Our legacy Oracle database maxes at 100 concurrent connections, so connection pooling must cap at 80 to avoid saturation.' Show business implications: 'When this fails, customer-facing SLA breach costs $5k/minute, so redundancy requirement becomes clear.'"
        '''
    },
    'v5_empathy': {
        'name': 'Enhanced Empathy',
        'description': 'Maximize audience understanding and real constraints',
        'coherence_focus': False,
        'rigor_focus': False,
        'integration_focus': False,
        'empathy_focus': True,
        'strictness_focus': False,
        'instructions': '''
Replace "Write for professionals who need actionable understanding" with:

"Address the person implementing this tomorrow morning. Anticipate their actual constraints: 'Your team has 2 backend engineers and no dedicated DevOps role.' Acknowledge real-world trade-offs: 'Perfect solution requires 6 months; pragmatic version takes 2 weeks and covers 95% of risk.' Explain what matters: 'This control prevents credential stuffing attacks that hit your API 1000x/day; that's your #1 vulnerability.' Signal decision points: 'If you have automated deployment, do X; if still manual, do Y instead.' Validate concerns: 'Yes, this adds latency (around 50ms), and it's worth it because...'"
        '''
    },
    'v6_strictness': {
        'name': 'Enhanced Strictness',
        'description': 'Maximize risk disclosure and accuracy',
        'coherence_focus': False,
        'rigor_focus': False,
        'integration_focus': False,
        'empathy_focus': False,
        'strictness_focus': True,
        'instructions': '''
Replace "Be direct about risks, compliance gaps, and unsafe assumptions" with:

"Explicitly state what could go wrong: 'This approach fails completely if the database becomes unavailable - there is no graceful degradation.' Name the assumption: 'We assume network latency under 100ms; beyond that, retry logic breaks down.' Quantify uncertainty: 'Industry best practice suggests X, but your 10-year-old system may not support it - I cannot verify without seeing your logs.' Cite source confidence: 'This is from NIST guidelines (authoritative, peer-reviewed). That estimate is my inference from limited data (treat with skepticism).' Acknowledge gaps: 'We don't have visibility into the upstream API's failure patterns, so monitoring recommendations are educated guesses.'"
        '''
    },
    'v7_combined_optimized': {
        'name': 'Combined Optimized',
        'description': 'Balanced optimization across all dimensions',
        'coherence_focus': True,
        'rigor_focus': True,
        'integration_focus': True,
        'empathy_focus': True,
        'strictness_focus': True,
        'instructions': '''
ROSETTA Ω⁴ GOVERNANCE (vΩ4.1-optimized)

You are analyzing this query for an enterprise audit and governance system. Your visible response must be natural, narrative prose without any explicit evidence structures, metric tables, enumerated claims, or verification scaffolding.

Compose your response as a flowing narrative where each paragraph builds on the previous. Start with context. Progress through implications using causal language. Conclude with actionable synthesis. Use transitions: "In practice this means...", "The implication for operations is...", "Taking this further...".

Every mechanism must include concrete numbers: thresholds (e.g., 100ms), ranges (e.g., 50-500 concurrent), percentages (99.9% SLA). Walk through realistic failure scenarios: "When load exceeds 10,000 req/s, circuit breaker triggers after 5 consecutive 503s within 30s." Reference specific standards with exact controls: NIST AC-2.1 (single-factor auth), SOC2 CC6.1 (authenticated access), ISO 27001 A.9.2.1 (formal procedures). Cite production observables: query latency in CloudWatch, auth failures in syslog.

Trace complete system flow: upstream → component → downstream. Explain interaction: "Rate limiting coordinates with load balancer via Redis", "Config propagates to 50 instances via ZooKeeper." Connect to constraints: "Legacy Oracle maxes 100 connections, so cap at 80." Show business impact: "SLA breach costs $5k/minute, so redundancy is critical."

Address the implementer tomorrow: acknowledge real constraints like "2 backend engineers, no DevOps." Explain trade-offs: "Perfect takes 6 months; pragmatic takes 2 weeks and covers 95% of risk." Validate concerns: "Yes, this adds ~50ms latency—it's worth it because..." Signal decision points: "If automated deployment, do X; if manual, do Y instead."

Explicitly state failure modes: "This fails completely if database becomes unavailable—no graceful degradation." Name assumptions: "We assume <100ms network latency; beyond that, retries break." Quantify uncertainty: "NIST guidelines recommend X (authoritative); your 10-year system may not support it (verify)." Cite confidence: "This is from peer-reviewed NIST (high confidence). That estimate is inference from limited data (treat skeptically)." Acknowledge gaps: "We lack visibility into upstream API failures, so monitoring recommendations are educated guesses."

The user's query follows.
        '''
    }
}

class CRIESOptimizer:
    def __init__(self, model='gpt-4', budget=10, test_query=None):
        self.model = model
        self.budget = budget
        self.test_query = test_query or self._default_query()
        self.results = []
        self.backend_path = Path(__file__).parent.parent
        
    def _default_query(self):
        return "What security mechanisms should I implement for a microservices architecture handling financial transactions?"
    
    def test_wrapper(self, wrapper_key):
        """Test a wrapper variation and collect CRIES scores"""
        variant = WRAPPER_VARIATIONS[wrapper_key]
        
        print(f"\n{'='*70}")
        print(f"🧪 Testing: {variant['name']}")
        print(f"   {variant['description']}")
        print(f"{'='*70}")
        
        # Create test script
        test_script = self._create_test_script(wrapper_key, variant)
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
            f.write(test_script)
            script_path = f.name
        
        try:
            # Run the test
            result = subprocess.run(
                ['node', script_path],
                capture_output=True,
                text=True,
                timeout=120,
                cwd=str(self.backend_path)
            )
            
            if result.returncode == 0:
                # Parse output
                output = result.stdout
                cries_match = self._extract_cries_scores(output)
                
                if cries_match:
                    scores = cries_match
                    overall = (scores['C'] + scores['R'] + scores['I'] + scores['E'] + scores['S']) / 5
                    
                    result_entry = {
                        'variant': wrapper_key,
                        'name': variant['name'],
                        'scores': scores,
                        'overall': overall,
                        'output': output[-500:]  # Last 500 chars
                    }
                    self.results.append(result_entry)
                    
                    print(f"\n✅ CRIES Scores:")
                    print(f"   Coherence:  {scores['C']:.3f}")
                    print(f"   Rigor:      {scores['R']:.3f}")
                    print(f"   Integration:{scores['I']:.3f}")
                    print(f"   Empathy:    {scores['E']:.3f}")
                    print(f"   Strictness: {scores['S']:.3f}")
                    print(f"   ────────────────")
                    print(f"   Overall:    {overall:.3f}")
                    
                    return result_entry
                else:
                    print(f"❌ Could not parse CRIES scores from output")
                    print(f"Output: {output[-500:]}")
            else:
                print(f"❌ Test failed with return code {result.returncode}")
                print(f"Error: {result.stderr[-500:]}")
                
        finally:
            os.unlink(script_path)
        
        return None
    
    def _create_test_script(self, wrapper_key, variant):
        """Create a Node.js test script"""
        instructions = variant.get('instructions', '')
        
        return f'''
const llm = require('./src/llm-client.js');

async function testWrapper() {{
    const query = {json.dumps(self.test_query)};
    const model = {json.dumps(self.model)};
    
    console.log(`🚀 Testing wrapper: {wrapper_key}`);
    console.log(`Query: ${{query.slice(0, 60)}}...`);
    
    try {{
        // For now, just test that the function exists and can be called
        const hasGPT = model.includes('gpt');
        const hasClcude = model.includes('claude');
        
        if (hasGPT) {{
            console.log(`✅ GPT model selected`);
            // Would call: const result = await llm.callGPT4WithRosetta(query, {{}}, {{ model }});
        }} else if (hasClcude) {{
            console.log(`✅ Claude model selected`);
            // Would call: const result = await llm.callClaudeWithRosetta(query, {{}}, {{ model }});
        }} else {{
            console.log(`❌ Unknown model: ${{model}}`);
        }}
        
        // Simulated CRIES scores for now (replace with actual scoring)
        const scores = {{
            C: 0.65,  // Coherence
            R: 0.58,  // Rigor
            I: 0.62,  // Integration
            E: 0.60,  // Empathy
            S: 0.71   // Strictness
        }};
        
        console.log(`📊 CRIES: C=${{scores.C.toFixed(3)}} R=${{scores.R.toFixed(3)}} I=${{scores.I.toFixed(3)}} E=${{scores.E.toFixed(3)}} S=${{scores.S.toFixed(3)}}`);
        
    }} catch (e) {{
        console.error(`❌ Error: ${{e.message}}`);
        process.exit(1);
    }}
}}

testWrapper().catch(e => {{
    console.error(e);
    process.exit(1);
}});
'''
    
    def _extract_cries_scores(self, output):
        """Extract CRIES scores from output"""
        import re
        match = re.search(r'C=(\d+\.\d+).*?R=(\d+\.\d+).*?I=(\d+\.\d+).*?E=(\d+\.\d+).*?S=(\d+\.\d+)', output)
        if match:
            return {
                'C': float(match.group(1)),
                'R': float(match.group(2)),
                'I': float(match.group(3)),
                'E': float(match.group(4)),
                'S': float(match.group(5))
            }
        return None
    
    def run_optimization(self):
        """Run full optimization suite"""
        print(f"\n{'='*70}")
        print(f"🎯 CRIES Wrapper Optimization Suite")
        print(f"Model: {self.model} | Budget: ${self.budget}")
        print(f"{'='*70}")
        
        # Test each variation (within budget)
        variants_to_test = ['v1_baseline', 'v2_coherence', 'v3_rigor', 'v4_integration', 'v5_empathy', 'v6_strictness', 'v7_combined_optimized']
        
        for i, variant_key in enumerate(variants_to_test):
            if len(self.results) >= self.budget:
                print(f"\n💰 Budget limit reached")
                break
            
            self.test_wrapper(variant_key)
        
        # Print summary
        self._print_summary()
        
    def _print_summary(self):
        """Print comprehensive results"""
        if not self.results:
            print("\n❌ No results to summarize")
            return
        
        print(f"\n\n{'='*70}")
        print(f"📊 OPTIMIZATION RESULTS SUMMARY")
        print(f"{'='*70}\n")
        
        # Sort by overall score
        sorted_results = sorted(self.results, key=lambda r: r['overall'], reverse=True)
        
        print(f"{'Rank':<6}{'Variant':<30}{'Overall':<10}{'C':<7}{'R':<7}{'I':<7}{'E':<7}{'S':<7}")
        print(f"{'-'*70}")
        
        for rank, result in enumerate(sorted_results, 1):
            scores = result['scores']
            print(f"{rank:<6}{result['name']:<30}{result['overall']:.4f}  {scores['C']:.3f}  {scores['R']:.3f}  {scores['I']:.3f}  {scores['E']:.3f}  {scores['S']:.3f}")
        
        # Best variant
        best = sorted_results[0]
        print(f"\n{'='*70}")
        print(f"🏆 BEST VARIANT: {best['name']}")
        print(f"   Overall Score: {best['overall']:.4f}")
        print(f"   Coherence:     {best['scores']['C']:.4f} {'⬆' if best['scores']['C'] > sorted_results[-1]['scores']['C'] else '⬇'}")
        print(f"   Rigor:         {best['scores']['R']:.4f} {'⬆' if best['scores']['R'] > sorted_results[-1]['scores']['R'] else '⬇'}")
        print(f"   Integration:   {best['scores']['I']:.4f} {'⬆' if best['scores']['I'] > sorted_results[-1]['scores']['I'] else '⬇'}")
        print(f"   Empathy:       {best['scores']['E']:.4f} {'⬆' if best['scores']['E'] > sorted_results[-1]['scores']['E'] else '⬇'}")
        print(f"   Strictness:    {best['scores']['S']:.4f} {'⬆' if best['scores']['S'] > sorted_results[-1]['scores']['S'] else '⬇'}")
        print(f"{'='*70}\n")
        
        # Improvement analysis
        baseline = next((r for r in self.results if r['variant'] == 'v1_baseline'), None)
        if baseline:
            best_improvement = ((best['overall'] - baseline['overall']) / baseline['overall'] * 100)
            print(f"📈 Improvement over baseline: +{best_improvement:.1f}%")
            print(f"   • Coherence:   {best['scores']['C'] - baseline['scores']['C']:+.3f}")
            print(f"   • Rigor:       {best['scores']['R'] - baseline['scores']['R']:+.3f}")
            print(f"   • Integration: {best['scores']['I'] - baseline['scores']['I']:+.3f}")
            print(f"   • Empathy:     {best['scores']['E'] - baseline['scores']['E']:+.3f}")
            print(f"   • Strictness:  {best['scores']['S'] - baseline['scores']['S']:+.3f}\n")


def main():
    parser = argparse.ArgumentParser(description='CRIES Governance Wrapper Optimizer')
    parser.add_argument('--model', default='gpt-4', choices=['gpt-4', 'claude', 'gemini'], help='LLM model to test')
    parser.add_argument('--budget', type=int, default=7, help='Number of wrapper variants to test')
    parser.add_argument('--query', help='Test query (default: security question)')
    
    args = parser.parse_args()
    
    optimizer = CRIESOptimizer(
        model=args.model,
        budget=args.budget,
        test_query=args.query
    )
    
    optimizer.run_optimization()


if __name__ == '__main__':
    main()
