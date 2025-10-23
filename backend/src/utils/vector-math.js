/**
 * Vector math utilities for CRIES computation
 */

/**
 * Compute cosine similarity between two vectors
 */
export function cosineSimilarity(vec1, vec2) {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have same length');
  }
  
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }
  
  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);
  
  if (mag1 === 0 || mag2 === 0) return 0;
  
  return dotProduct / (mag1 * mag2);
}

/**
 * Create simple bag-of-words vector from token array
 */
export function createBagOfWordsVector(tokens, vocabulary) {
  const vector = new Array(vocabulary.length).fill(0);
  
  tokens.forEach(token => {
    const index = vocabulary.indexOf(token);
    if (index !== -1) {
      vector[index]++;
    }
  });
  
  return vector;
}

/**
 * Normalize vector to unit length
 */
export function normalize(vec) {
  const magnitude = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vec;
  return vec.map(val => val / magnitude);
}

/**
 * Compute Euclidean distance between two vectors
 */
export function euclideanDistance(vec1, vec2) {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have same length');
  }
  
  let sum = 0;
  for (let i = 0; i < vec1.length; i++) {
    const diff = vec1[i] - vec2[i];
    sum += diff * diff;
  }
  
  return Math.sqrt(sum);
}

export default {
  cosineSimilarity,
  createBagOfWordsVector,
  normalize,
  euclideanDistance
};
