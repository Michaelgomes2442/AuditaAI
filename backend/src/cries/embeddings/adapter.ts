/**
 * CRIES v3 Embedding Adapter
 * Pluggable interface for sentence embeddings with deterministic mock
 */

import type { CRIESEmbeddingAdapter } from '../schema.js';
import { SeededRNG } from '../utils/determinism.js';
import { DEFAULT_SEED } from '../constants.js';

/**
 * Local embedding adapter with pluggable backends
 * Starts with deterministic mock for testing, can swap to real embeddings
 */
export class LocalEmbeddingAdapter implements CRIESEmbeddingAdapter {
  private backend: 'mock' | 'all-minilm-l6-v2' | 'openai';

  constructor(backend: 'mock' | 'all-minilm-l6-v2' | 'openai' = 'mock') {
    this.backend = backend;
  }

  /**
   * Embed texts to normalized unit vectors
   * Mock: generates deterministic vectors based on text hash + seed
   * Real: would call actual embedding model
   */
  async embed(texts: string[], opts?: { seed?: number; model?: string }): Promise<number[][]> {
    const seed = opts?.seed ?? DEFAULT_SEED;
    
    if (this.backend === 'mock') {
      return this.mockEmbed(texts, seed);
    } else if (this.backend === 'all-minilm-l6-v2') {
      // TODO: Implement actual all-minilm-l6-v2 via transformers.js or python bridge
      console.warn('all-minilm-l6-v2 not yet implemented, falling back to mock');
      return this.mockEmbed(texts, seed);
    } else if (this.backend === 'openai') {
      // TODO: Implement OpenAI embeddings API
      console.warn('OpenAI embeddings not yet implemented, falling back to mock');
      return this.mockEmbed(texts, seed);
    }
    
    return this.mockEmbed(texts, seed);
  }

  /**
   * Deterministic mock embeddings
   * Generate 384-dim vectors (typical for all-minilm-l6-v2)
   * Based on text content hash + seed for reproducibility
   */
  private mockEmbed(texts: string[], seed: number): number[][] {
    const dim = 384;
    
    return texts.map(text => {
      // Hash text to get deterministic base seed
      const textHash = this.hashString(text);
      const rng = new SeededRNG(seed + textHash);
      
      // Generate vector based on text features
      const vector: number[] = [];
      
      // Character frequency features (first 128 dims)
      const charFreq = this.getCharFrequency(text);
      for (let i = 0; i < 128; i++) {
        const char = String.fromCharCode(i);
        vector.push((charFreq.get(char) || 0) + rng.next() * 0.1);
      }
      
      // Word length features (next 64 dims)
      const words = text.toLowerCase().split(/\s+/);
      for (let i = 0; i < 64; i++) {
        const avgLen = words.reduce((sum, w) => sum + w.length, 0) / Math.max(words.length, 1);
        vector.push(avgLen / 10 + rng.next() * 0.1);
      }
      
      // Semantic features (remaining 192 dims)
      // Based on keyword presence, sentiment, structure
      const keywords = ['not', 'never', 'always', 'must', 'should', 'can', 'will', 'if', 'then'];
      for (let i = 0; i < 192; i++) {
        const keyword = keywords[i % keywords.length];
        const hasKeyword = text.toLowerCase().includes(keyword) ? 1 : 0;
        vector.push(hasKeyword * 0.5 + rng.next() * 0.5);
      }
      
      // Normalize to unit vector
      return this.normalize(vector);
    });
  }

  /**
   * Compute cosine similarity between normalized vectors
   * Pure function, no IO
   */
  cosine(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
    }
    
    // Since vectors are normalized, cosine = dot product
    let dot = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
    }
    
    return dot;
  }

  /**
   * Normalize vector to unit length
   */
  private normalize(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (magnitude === 0) return vector.map(() => 0);
    return vector.map(v => v / magnitude);
  }

  /**
   * Simple string hash function for determinism
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get character frequency map
   */
  private getCharFrequency(text: string): Map<string, number> {
    const freq = new Map<string, number>();
    const normalized = text.toLowerCase();
    
    for (const char of normalized) {
      freq.set(char, (freq.get(char) || 0) + 1);
    }
    
    // Normalize frequencies
    const total = normalized.length;
    for (const [char, count] of freq.entries()) {
      freq.set(char, count / total);
    }
    
    return freq;
  }

  /**
   * Compute average embedding for multiple texts
   */
  async averageEmbed(texts: string[], opts?: { seed?: number }): Promise<number[]> {
    const embeddings = await this.embed(texts, opts);
    if (embeddings.length === 0) return [];
    
    const dim = embeddings[0].length;
    const avg = new Array(dim).fill(0);
    
    for (const embedding of embeddings) {
      for (let i = 0; i < dim; i++) {
        avg[i] += embedding[i];
      }
    }
    
    for (let i = 0; i < dim; i++) {
      avg[i] /= embeddings.length;
    }
    
    return this.normalize(avg);
  }

  /**
   * Batch similarity computation
   * Returns matrix of similarities[i][j] = cosine(embeddings[i], embeddings[j])
   */
  async similarityMatrix(texts: string[], opts?: { seed?: number }): Promise<number[][]> {
    const embeddings = await this.embed(texts, opts);
    const n = embeddings.length;
    const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        matrix[i][j] = this.cosine(embeddings[i], embeddings[j]);
      }
    }
    
    return matrix;
  }
}

/**
 * Factory function for creating embedding adapters
 */
export function createEmbeddingAdapter(
  backend: 'mock' | 'all-minilm-l6-v2' | 'openai' = 'mock'
): CRIESEmbeddingAdapter {
  return new LocalEmbeddingAdapter(backend);
}

/**
 * Compute semantic similarity between two texts
 * Convenience function that handles embedding
 */
export async function semanticSimilarity(
  text1: string,
  text2: string,
  adapter: CRIESEmbeddingAdapter,
  seed?: number
): Promise<number> {
  const embeddings = await adapter.embed([text1, text2], { seed });
  return adapter.cosine(embeddings[0], embeddings[1]);
}

/**
 * Find most similar text from candidates
 * Returns index and similarity score
 */
export async function findMostSimilar(
  query: string,
  candidates: string[],
  adapter: CRIESEmbeddingAdapter,
  seed?: number
): Promise<{ index: number; similarity: number; text: string }> {
  const embeddings = await adapter.embed([query, ...candidates], { seed });
  const queryEmb = embeddings[0];
  
  let maxSim = -1;
  let maxIdx = -1;
  
  for (let i = 0; i < candidates.length; i++) {
    const sim = adapter.cosine(queryEmb, embeddings[i + 1]);
    if (sim > maxSim) {
      maxSim = sim;
      maxIdx = i;
    }
  }
  
  return {
    index: maxIdx,
    similarity: maxSim,
    text: maxIdx >= 0 ? candidates[maxIdx] : ''
  };
}
