import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import { 
  analyzeWordsRequestSchema, 
  predictNextWordRequestSchema,
  type AnalysisResult,
  type PredictNextWordResult 
} from "@shared/schema";
import { z } from "zod";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
// However, for embeddings we use text-embedding-3-small as specified in requirements
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

function cosineSimilarity(a: number[], b: number[]): number {
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

// Normalize vector to unit length
function normalizeVector(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  return norm > 0 ? vec.map(val => val / norm) : vec;
}

// Classical MDS (Multi-Dimensional Scaling) using cosine distances
// This preserves pairwise distances better than the old chunk-based approach
function performMDS(embeddings: number[][], targetDim: number = 3) {
  const numSamples = embeddings.length;
  const numFeatures = embeddings[0].length;
  
  // Normalize all embeddings to unit length (for cosine distance)
  const normalized = embeddings.map(normalizeVector);
  
  // Compute distance matrix using cosine distance (1 - cosine similarity)
  const distanceMatrix: number[][] = [];
  for (let i = 0; i < numSamples; i++) {
    distanceMatrix[i] = [];
    for (let j = 0; j < numSamples; j++) {
      if (i === j) {
        distanceMatrix[i][j] = 0;
      } else {
        const cosSim = cosineSimilarity(normalized[i], normalized[j]);
        // Convert cosine similarity to distance (0 to 2 range)
        distanceMatrix[i][j] = 1 - cosSim;
      }
    }
  }
  
  // Classical MDS: Double centering of squared distance matrix
  const squaredDist: number[][] = distanceMatrix.map(row => 
    row.map(d => d * d)
  );
  
  // Compute row and overall means
  const rowMeans = squaredDist.map(row => 
    row.reduce((sum, val) => sum + val, 0) / numSamples
  );
  const overallMean = rowMeans.reduce((sum, val) => sum + val, 0) / numSamples;
  
  // Double center: B = -0.5 * (D² - rowMean - colMean + overallMean)
  const B: number[][] = [];
  for (let i = 0; i < numSamples; i++) {
    B[i] = [];
    for (let j = 0; j < numSamples; j++) {
      B[i][j] = -0.5 * (squaredDist[i][j] - rowMeans[i] - rowMeans[j] + overallMean);
    }
  }
  
  // Power iteration with Gram-Schmidt orthogonalization to find eigenvectors
  const coordinates: Array<{x: number, y: number, z: number}> = [];
  const eigenvalues: number[] = [];
  const eigenvectors: number[][] = [];
  
  for (let dim = 0; dim < targetDim; dim++) {
    // Initialize random vector
    let eigenvector = new Array(numSamples).fill(0).map(() => Math.random() - 0.5);
    
    // Orthogonalize against previously found eigenvectors (Gram-Schmidt)
    for (let prevDim = 0; prevDim < dim; prevDim++) {
      const prevVec = eigenvectors[prevDim];
      let dotProduct = 0;
      for (let i = 0; i < numSamples; i++) {
        dotProduct += eigenvector[i] * prevVec[i];
      }
      for (let i = 0; i < numSamples; i++) {
        eigenvector[i] -= dotProduct * prevVec[i];
      }
    }
    
    // Power iteration
    for (let iter = 0; iter < 150; iter++) {
      const newVec = new Array(numSamples).fill(0);
      
      // Multiply B * eigenvector
      for (let i = 0; i < numSamples; i++) {
        for (let j = 0; j < numSamples; j++) {
          newVec[i] += B[i][j] * eigenvector[j];
        }
      }
      
      // Orthogonalize against previous eigenvectors
      for (let prevDim = 0; prevDim < dim; prevDim++) {
        const prevVec = eigenvectors[prevDim];
        let dotProduct = 0;
        for (let i = 0; i < numSamples; i++) {
          dotProduct += newVec[i] * prevVec[i];
        }
        for (let i = 0; i < numSamples; i++) {
          newVec[i] -= dotProduct * prevVec[i];
        }
      }
      
      // Normalize
      const norm = Math.sqrt(newVec.reduce((sum, val) => sum + val * val, 0));
      eigenvector = norm > 0 ? newVec.map(val => val / norm) : newVec;
    }
    
    // Calculate eigenvalue (Rayleigh quotient)
    let eigenvalue = 0;
    for (let i = 0; i < numSamples; i++) {
      let sum = 0;
      for (let j = 0; j < numSamples; j++) {
        sum += B[i][j] * eigenvector[j];
      }
      eigenvalue += eigenvector[i] * sum;
    }
    
    // Ensure eigenvalue is positive
    const finalEigenvalue = Math.max(0.001, eigenvalue);
    eigenvalues.push(finalEigenvalue);
    eigenvectors.push([...eigenvector]);
    
    // Store coordinate (scaled by sqrt of eigenvalue)
    // For Z-axis (3rd dimension), boost the scale to ensure visible depth
    const baseScale = Math.sqrt(finalEigenvalue);
    const scale = dim === 2 ? baseScale * 2.5 : baseScale; // Boost Z-axis by 2.5x
    
    for (let i = 0; i < numSamples; i++) {
      if (!coordinates[i]) {
        coordinates[i] = { x: 0, y: 0, z: 0 };
      }
      const coord = eigenvector[i] * scale;
      if (dim === 0) coordinates[i].x = coord;
      else if (dim === 1) coordinates[i].y = coord;
      else if (dim === 2) coordinates[i].z = coord;
    }
  }
  
  // Calculate variance explained
  const totalVariance = eigenvalues.reduce((sum, v) => sum + v, 0);
  const varianceExplained = totalVariance > 0 
    ? eigenvalues.map(v => (v / totalVariance) * 100)
    : eigenvalues.map(() => 100 / targetDim);

  return {
    coordinates,
    pcaInfo: {
      originalDimensions: numFeatures,
      reducedDimensions: targetDim,
      varianceExplained: varianceExplained.map(v => Math.round(v * 10) / 10),
      method: "MDS (cosine distance)"
    }
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/analyze", async (req, res) => {
    try {
      const { words, model } = analyzeWordsRequestSchema.parse(req.body);
      
      // Fetch embeddings for all words
      const embeddingPromises = words.map(async (word) => {
        try {
          const response = await openai.embeddings.create({
            model: model || "text-embedding-3-small",
            input: word,
          });
          return {
            word,
            embedding: response.data[0].embedding,
          };
        } catch (error: any) {
          throw new Error(`Failed to get embedding for "${word}": ${error.message}`);
        }
      });

      const embeddings = await Promise.all(embeddingPromises);
      
      // Calculate similarities between all pairs
      const similarities = [];
      for (let i = 0; i < embeddings.length; i++) {
        for (let j = i + 1; j < embeddings.length; j++) {
          const similarity = cosineSimilarity(
            embeddings[i].embedding,
            embeddings[j].embedding
          );
          similarities.push({
            word1: embeddings[i].word,
            word2: embeddings[j].word,
            similarity: Math.round(similarity * 1000) / 1000, // Round to 3 decimal places
          });
        }
      }

      // Perform MDS for 3D visualization (preserves cosine distances)
      const embeddingVectors = embeddings.map(e => e.embedding);
      const mdsResult = performMDS(embeddingVectors);
      
      const visualization = {
        coordinates: embeddings.map((e, index) => ({
          word: e.word,
          ...mdsResult.coordinates[index],
        })),
        pcaInfo: mdsResult.pcaInfo,
      };

      const result: AnalysisResult = {
        embeddings,
        similarities,
        visualization,
        model: model || "text-embedding-3-small",
      };

      res.json(result);
    } catch (error: any) {
      console.error('Analysis error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors 
        });
      }
      
      if (error?.message?.includes('Invalid API key') || error?.message?.includes('Incorrect API key')) {
        return res.status(401).json({ 
          message: "Invalid OpenAI API key. Please check your API key and try again." 
        });
      }
      
      if (error?.message?.includes('quota') || error?.message?.includes('rate limit')) {
        return res.status(429).json({ 
          message: "OpenAI API rate limit or quota exceeded. Please try again later." 
        });
      }

      res.status(500).json({ 
        message: error?.message || "Failed to analyze words. Please try again." 
      });
    }
  });

  app.post("/api/predict", async (req, res) => {
    try {
      const { context, candidateWords } = predictNextWordRequestSchema.parse(req.body);
      
      // Get embedding for the context
      const contextResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: context,
      });
      const contextEmbedding = contextResponse.data[0].embedding;
      
      // Get embeddings for candidate words
      const candidatePromises = candidateWords.map(async (word) => {
        const response = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: word,
        });
        return {
          word,
          embedding: response.data[0].embedding,
        };
      });
      
      const candidates = await Promise.all(candidatePromises);
      
      // Calculate similarity scores
      const predictions = candidates.map((candidate) => {
        const similarity = cosineSimilarity(contextEmbedding, candidate.embedding);
        return {
          word: candidate.word,
          similarity: Math.round(similarity * 1000) / 1000,
          probability: 0, // Will calculate below
        };
      });
      
      // Sort by similarity (highest first)
      predictions.sort((a, b) => b.similarity - a.similarity);
      
      // Convert similarities to probabilities using softmax
      const maxSim = predictions[0].similarity;
      const expScores = predictions.map(p => Math.exp((p.similarity - maxSim) * 10)); // Scale by 10 for better distribution
      const sumExp = expScores.reduce((sum, val) => sum + val, 0);
      
      predictions.forEach((prediction, index) => {
        prediction.probability = Math.round((expScores[index] / sumExp) * 100 * 10) / 10;
      });
      
      const result: PredictNextWordResult = {
        context,
        contextEmbedding,
        predictions,
        topPrediction: predictions[0].word,
      };
      
      res.json(result);
    } catch (error: any) {
      console.error('Prediction error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: error?.message || "Failed to predict next word. Please try again." 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
