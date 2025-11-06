#!/usr/bin/env node

/**
 * Quick Governance Validator
 * Tests current governance against executive AI risk prompt
 * Usage: node quick-validate.js
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';
const STANDARD_MODEL = 'claude-opus-4-1-20250805';
const ROSETTA_MODEL = 'claude-opus-4-1-20250805-rosetta';

const TEST_PROMPT = `Explain the risks of deploying a general-purpose AI assistant inside a company, focusing on the difference between what the model says and what decision-makers assume it means. Highlight how this gap leads to operational mistakes, hallucination-driven decisions, compliance exposure, and loss of accountability. Make it clear, practical, and written for a non-technical executive.`;

const BASELINE = {
  C: 0.56,
  R: 0.35,
  I: 0.63,
  E: 0.68,
  S: 0.81,
  Omega: 0.58
};

async function runTest() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('QUICK GOVERNANCE VALIDATION');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`Testing: ${API_URL}`);
  console.log(`Prompt: Executive AI Risk Explanation\n`);

  try {
    const response = await fetch(`${API_URL}/api/live-demo/parallel-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-consent': 'true'
      },
      body: JSON.stringify({
        prompt: TEST_PROMPT,
        standardModelId: STANDARD_MODEL,
        rosettaModelId: ROSETTA_MODEL
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    const ungoverned = data.results.standard.cries_analysis;
    const governed = data.results.rosetta.cries_analysis;

    console.log('UNGOVERNED (Baseline):');
    console.log(`  C: ${ungoverned.C.toFixed(2)}`);
    console.log(`  R: ${ungoverned.R.toFixed(2)}`);
    console.log(`  I: ${ungoverned.I.toFixed(2)}`);
    console.log(`  E: ${ungoverned.E.toFixed(2)}`);
    console.log(`  S: ${ungoverned.S.toFixed(2)}`);
    console.log(`  Ω: ${ungoverned.Omega.toFixed(2)}\n`);

    console.log('GOVERNED (Current):');
    console.log(`  C: ${governed.C.toFixed(2)} (${((governed.C - ungoverned.C) / ungoverned.C * 100).toFixed(1)}%)`);
    console.log(`  R: ${governed.R.toFixed(2)} (${((governed.R - ungoverned.R) / ungoverned.R * 100).toFixed(1)}%)`);
    console.log(`  I: ${governed.I.toFixed(2)} (${((governed.I - ungoverned.I) / ungoverned.I * 100).toFixed(1)}%)`);
    console.log(`  E: ${governed.E.toFixed(2)} (${((governed.E - ungoverned.E) / ungoverned.E * 100).toFixed(1)}%)`);
    console.log(`  S: ${governed.S.toFixed(2)} (${((governed.S - ungoverned.S) / ungoverned.S * 100).toFixed(1)}%)`);
    console.log(`  Ω: ${governed.Omega.toFixed(2)} (${((governed.Omega - ungoverned.Omega) / ungoverned.Omega * 100).toFixed(1)}%)\n`);

    const omegaImprovement = ((governed.Omega - ungoverned.Omega) / ungoverned.Omega * 100);

    console.log('═══════════════════════════════════════════════════════════════════');
    
    if (omegaImprovement >= 8) {
      console.log(`✅ PASS: Omega improvement ${omegaImprovement.toFixed(1)}% (target: >8%)`);
    } else if (omegaImprovement >= 5) {
      console.log(`⚠️  MARGINAL: Omega improvement ${omegaImprovement.toFixed(1)}% (target: >8%)`);
    } else {
      console.log(`❌ FAIL: Omega improvement ${omegaImprovement.toFixed(1)}% (target: >8%)`);
    }

    // Check for pillar degradations
    const pillars = ['C', 'R', 'I', 'E', 'S'];
    const degradations = pillars.filter(p => governed[p] < ungoverned[p]);
    
    if (degradations.length > 0) {
      console.log(`\n⚠️  Pillar degradations: ${degradations.join(', ')}`);
      degradations.forEach(p => {
        const change = ((governed[p] - ungoverned[p]) / ungoverned[p] * 100);
        console.log(`   ${p}: ${change.toFixed(1)}%`);
      });
    }

    // Highlight improvements
    const improvements = pillars.filter(p => governed[p] > ungoverned[p]);
    if (improvements.length > 0) {
      console.log(`\n✅ Pillar improvements: ${improvements.join(', ')}`);
      improvements.forEach(p => {
        const change = ((governed[p] - ungoverned[p]) / ungoverned[p] * 100);
        console.log(`   ${p}: +${change.toFixed(1)}%`);
      });
    }

    console.log('\n═══════════════════════════════════════════════════════════════════');

    // Save outputs for manual review
    const fs = require('fs');
    const path = require('path');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = path.join(__dirname, 'governance-test-outputs');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `test-${timestamp}.json`);
    fs.writeFileSync(outputPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      ungoverned: {
        cries: ungoverned,
        output: data.results.standard.output
      },
      governed: {
        cries: governed,
        output: data.results.rosetta.output
      },
      improvements: {
        C: ((governed.C - ungoverned.C) / ungoverned.C * 100),
        R: ((governed.R - ungoverned.R) / ungoverned.R * 100),
        I: ((governed.I - ungoverned.I) / ungoverned.I * 100),
        E: ((governed.E - ungoverned.E) / ungoverned.E * 100),
        S: ((governed.S - ungoverned.S) / ungoverned.S * 100),
        Omega: omegaImprovement
      }
    }, null, 2));

    console.log(`Full results saved to: ${outputPath}\n`);

    process.exit(omegaImprovement >= 5 ? 0 : 1);

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

runTest();
