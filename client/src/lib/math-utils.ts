// Mathematical utilities for vector operations and similarity calculations

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

export function normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return norm === 0 ? vector : vector.map(val => val / norm);
}

export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

// Simple PCA implementation for dimensionality reduction
export function performPCA(data: number[][], targetDimensions: number = 3): number[][] {
  const numSamples = data.length;
  const numFeatures = data[0].length;
  
  // Center the data
  const mean = new Array(numFeatures).fill(0);
  for (let i = 0; i < numSamples; i++) {
    for (let j = 0; j < numFeatures; j++) {
      mean[j] += data[i][j];
    }
  }
  for (let j = 0; j < numFeatures; j++) {
    mean[j] /= numSamples;
  }

  const centeredData = data.map(row => 
    row.map((val, idx) => val - mean[idx])
  );

  // Simplified projection approach for educational purposes
  // In a production system, you'd want proper SVD-based PCA
  const result = [];
  for (let i = 0; i < numSamples; i++) {
    const sample = centeredData[i];
    const reduced = [];
    
    // Project onto first few principal components (simplified)
    for (let dim = 0; dim < targetDimensions; dim++) {
      const start = Math.floor(dim * numFeatures / targetDimensions);
      const end = Math.floor((dim + 1) * numFeatures / targetDimensions);
      const component = sample.slice(start, end).reduce((sum, val) => sum + val, 0) / (end - start);
      reduced.push(component);
    }
    
    result.push(reduced);
  }

  return result;
}
