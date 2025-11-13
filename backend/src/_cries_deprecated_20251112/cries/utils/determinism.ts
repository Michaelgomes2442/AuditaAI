/**
 * CRIES v3 Determinism Utilities
 * Seeded RNG and hash generation for reproducibility
 */

import crypto from 'crypto';
import { HASH_ALGORITHM, DEFAULT_SEED } from '../constants.js';
import type { DeterminismInfo } from '../schema.js';

/**
 * Seeded random number generator (Mulberry32)
 * Deterministic PRNG for shuffling, sampling, etc.
 */
export class SeededRNG {
  private state: number;

  constructor(seed: number = DEFAULT_SEED) {
    this.state = seed >>> 0; // Ensure unsigned 32-bit
  }

  /**
   * Generate next random float [0, 1)
   */
  next(): number {
    this.state = (this.state + 0x6D2B79F5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generate random integer [min, max)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  /**
   * Shuffle array in-place deterministically
   */
  shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Sample k elements from array without replacement
   * Returns deterministic sample sorted by original index
   */
  sample<T>(array: T[], k: number): T[] {
    if (k >= array.length) return [...array];
    
    const indices = Array.from({ length: array.length }, (_, i) => i);
    const shuffled = this.shuffle(indices);
    const selectedIndices = shuffled.slice(0, k).sort((a, b) => a - b);
    
    return selectedIndices.map(i => array[i]);
  }
}

/**
 * Generate canonical hash of CRIES inputs
 * Used for determinism tracking and receipt digests
 */
export function generateInputHash(
  prompt: string,
  response: string,
  context: unknown,
  governanceMode: string,
  weights: Record<string, number>
): string {
  const canonical = JSON.stringify({
    prompt,
    response,
    context,
    governanceMode,
    weights
  }, Object.keys({ prompt, response, context, governanceMode, weights }).sort());
  
  return crypto.createHash(HASH_ALGORITHM).update(canonical).digest('hex');
}

/**
 * Create determinism info object for CRIES output
 */
export function createDeterminismInfo(
  seed: number,
  prompt: string,
  response: string,
  context: unknown,
  governanceMode: string,
  weights: Record<string, number>
): DeterminismInfo {
  return {
    seed,
    hashInput: generateInputHash(prompt, response, context, governanceMode, weights),
    computedAt: new Date().toISOString()
  };
}

/**
 * Deterministic sort with tiebreaker
 * Sorts by value first, then by index to break ties
 */
export function deterministicSort<T>(
  items: T[],
  scoreFunc: (item: T) => number,
  descending: boolean = true
): T[] {
  return items
    .map((item, index) => ({ item, score: scoreFunc(item), index }))
    .sort((a, b) => {
      const scoreDiff = descending ? b.score - a.score : a.score - b.score;
      if (Math.abs(scoreDiff) < 1e-10) return a.index - b.index; // Tiebreaker
      return scoreDiff;
    })
    .map(({ item }) => item);
}

/**
 * Deterministic top-k selection
 * Select k highest-scoring items with deterministic tiebreaking
 */
export function deterministicTopK<T>(
  items: T[],
  k: number,
  scoreFunc: (item: T) => number
): T[] {
  const sorted = deterministicSort(items, scoreFunc, true);
  return sorted.slice(0, k);
}

/**
 * Clamp value to [0, 1] range
 */
export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Safe division (returns 0 if denominator is 0)
 */
export function safeDivide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Compute mean of array
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Compute variance of array
 */
export function variance(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  return mean(values.map(v => (v - avg) ** 2));
}

/**
 * Compute standard deviation
 */
export function stdDev(values: number[]): number {
  return Math.sqrt(variance(values));
}

/**
 * Normalize array to [0, 1] range
 */
export function normalize(values: number[]): number[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  if (range === 0) return values.map(() => 0.5);
  return values.map(v => (v - min) / range);
}
