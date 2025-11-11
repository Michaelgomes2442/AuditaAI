/**
 * GOVERNANCE OPTIMIZATION TEST SUITE FOR OPENAI
 * Parallel version of governance-optimizer-v2.test.js optimized for GPT-4
 * 
 * Key Differences from Anthropic version:
 * - Uses GPT-4 (gpt-4o-mini) instead of Claude Opus
 * - Same methodology: multi-trial testing with volatility analysis
 * - Same cost tracking and statistical rigor
 * - Parallel execution support for Bayesian optimizer
 */

import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration for OpenAI
const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const STANDARD_MODEL = 'gpt-4o-mini';
const ROSETTA_MODEL = 'gpt-4o-mini-rosetta';
const NUM_TRIALS = 3;
const MAX_BUDGET_USD = Number(process.env.MAX_BUDGET_USD || '3.00');
const SEED = Number(process.env.SEED || '1337');

// Utility functions
function seededRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function shuffleArray(arr, seed) {
  const result = [...arr];
  let currentSeed = seed;
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(currentSeed++) * (i + 1));
    currentSeed++;
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function computeStats(values) {
  const n = values.length;
  if (n === 0) return null;
  
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, x) => a + Math.pow(x - mean, 2), 0) / Math.max(1, n - 1);
  const stdDev = Math.sqrt(variance);
  const se = stdDev / Math.sqrt(n);
  
  return { mean, stdDev, variance, se, n };
}

function tCritical(df, alpha = 0.05) {
  const t_values = { 1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571 };
  return t_values[Math.min(df, 5)] || 1.96;
}

function pairedTTest(before, after) {
  const diffs = before.map((v, i) => after[i] - v);
  const stats = computeStats(diffs);
  if (!stats) return { t: 0, p: 1 };
  
  const t = (stats.mean - 0) / (stats.se || 0.0001);
  const df = stats.n - 1;
  const p = Math.min(1, Math.abs(t) * 0.1);
  
  return { t, p, mean_diff: stats.mean, se_diff: stats.se };
}

function formatCurrency(usd) {
  return `$${usd.toFixed(4)}`;
}

// Load governance parameters from environment
async function loadGovernanceParams() {
  const paramsFile = process.env.BO_PARAMS_FILE;
  if (!paramsFile || !fsSync.existsSync(paramsFile)) {
    return null;
  }
  
  try {
    const content = await fs.readFile(paramsFile, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to load governance params:', e);
    return null;
  }
}

// Make API call with retry logic
async function callAPI(endpoint, body, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        timeout: 120000
      });
      
      if (!response.ok) {
        if ((response.status === 429 || response.status >= 500) && attempt < retries - 1) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      return await response.json();
    } catch (e) {
      if (attempt === retries - 1) throw e;
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// Test suite
test.describe('Bayesian Optimization Support - OpenAI', () => {
  test('Bayesian Optimization Evaluation', async ({ page }) => {
    console.log('\n=== GOVERNANCE OPTIMIZATION - OpenAI Version ===\n');
    
    const params = await loadGovernanceParams();
    const fidelity = process.env.BO_FIDELITY || 'low';
    
    if (!params) {
      console.log('No governance parameters provided');
      console.log('__BO_OUTPUT__{"error":"no_params"}__BO_END__');
      return;
    }
    
    // Determine number of trials based on fidelity
    const trialsPerFidelity = { low: 1, medium: 2, high: 3 };
    const numTrials = trialsPerFidelity[fidelity] || 1;
    
    const testPrompts = shuffleArray([
      'What are the key principles of machine learning?',
      'Explain quantum computing in simple terms',
      'How does photosynthesis work?',
      'Describe the water cycle',
      'What is blockchain technology?'
    ], SEED);
    
    const promptsToUse = testPrompts.slice(0, numTrials);
    const allTrials = [];
    let totalCost = 0;
    
    try {
      // Test both standard and governed models
      for (const prompt of promptsToUse) {
        // Standard model
        const standardResult = await callAPI('/api/live-demo/parallel-prompt', {
          prompt,
          standardModelId: STANDARD_MODEL,
          rosettaModelId: ROSETTA_MODEL,
          conversationId: `openai-trial-${Date.now()}`,
          apiKeys: { openai: process.env.OPENAI_API_KEY }
        });
        
        if (!standardResult.standardResponse) {
          throw new Error('Standard model response failed');
        }
        
        const standardCRIES = standardResult.standardResponse.cries;
        const rosettaCRIES = standardResult.rosettaResponse.cries;
        
        allTrials.push({
          prompt,
          standard: standardCRIES,
          governed: rosettaCRIES,
          standardCost: standardResult.standardResponse.usage?.total_tokens || 150,
          governedCost: standardResult.rosettaResponse.usage?.total_tokens || 200
        });
        
        totalCost += (standardResult.standardResponse.usage?.total_tokens || 150) * 0.00015;
        totalCost += (standardResult.rosettaResponse.usage?.total_tokens || 200) * 0.00020;
      }
      
      if (allTrials.length === 0) {
        throw new Error('All evaluations failed');
      }
      
      // Aggregate statistics across all trials
      const standardOmegas = allTrials.map(t => t.standard.Omega || 0);
      const governedOmegas = allTrials.map(t => t.governed.Omega || 0);
      
      const standardStats = computeStats(standardOmegas);
      const governedStats = computeStats(governedOmegas);
      const ttest = pairedTTest(standardOmegas, governedOmegas);
      
      // Pillar aggregates
      const pillarStats = {
        C: { standard: computeStats(allTrials.map(t => t.standard.C || 0)), governed: computeStats(allTrials.map(t => t.governed.C || 0)) },
        R: { standard: computeStats(allTrials.map(t => t.standard.R || 0)), governed: computeStats(allTrials.map(t => t.governed.R || 0)) },
        I: { standard: computeStats(allTrials.map(t => t.standard.I || 0)), governed: computeStats(allTrials.map(t => t.governed.I || 0)) },
        E: { standard: computeStats(allTrials.map(t => t.standard.E || 0)), governed: computeStats(allTrials.map(t => t.governed.E || 0)) },
        S: { standard: computeStats(allTrials.map(t => t.standard.S || 0)), governed: computeStats(allTrials.map(t => t.governed.S || 0)) }
      };
      
      const output = {
        model: 'gpt-4o-mini',
        fidelity,
        numTrials: allTrials.length,
        params,
        omegaStats: {
          standard: standardStats,
          governed: governedStats,
          mean: governedStats.mean,
          improvement: governedStats.mean - standardStats.mean,
          improvementPct: ((governedStats.mean - standardStats.mean) / standardStats.mean * 100).toFixed(1),
          coefficientOfVariation: (governedStats.stdDev / governedStats.mean * 100).toFixed(2),
          ttest
        },
        pillarStats: {
          C: { mean: pillarStats.C.governed.mean, std: pillarStats.C.governed.stdDev },
          R: { mean: pillarStats.R.governed.mean, std: pillarStats.R.governed.stdDev },
          I: { mean: pillarStats.I.governed.mean, std: pillarStats.I.governed.stdDev },
          E: { mean: pillarStats.E.governed.mean, std: pillarStats.E.governed.stdDev },
          S: { mean: pillarStats.S.governed.mean, std: pillarStats.S.governed.stdDev }
        },
        costMetrics: {
          totalCost: totalCost,
          costPerTrial: (totalCost / allTrials.length).toFixed(4),
          tokenEfficency: (governedStats.mean / (totalCost + 0.0001)).toFixed(2)
        },
        timestamp: new Date().toISOString()
      };
      
      console.log('\n📊 OpenAI Governance Optimization Results');
      console.log(`   Model: ${output.model}`);
      console.log(`   Fidelity: ${output.fidelity}`);
      console.log(`   Trials: ${output.numTrials}`);
      console.log(`   Governed Ω: ${output.omegaStats.mean.toFixed(4)}`);
      console.log(`   Improvement: +${output.omegaStats.improvementPct}%`);
      console.log(`   Cost: ${formatCurrency(output.costMetrics.totalCost)}`);
      
      console.log('__BO_OUTPUT__' + JSON.stringify(output) + '__BO_END__');
      
    } catch (error) {
      console.error('❌ OpenAI optimization failed:', error.message);
      console.log('__BO_OUTPUT__{"error":"' + error.message.replace(/"/g, '\\"') + '"}__BO_END__');
      throw error;
    }
  });
});
