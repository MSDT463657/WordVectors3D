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

function performPCA(embeddings: number[][], targetDim: number = 3) {
  const numSamples = embeddings.length;
  const numFeatures = embeddings[0].length;
  
  // Center the data
  const mean = new Array(numFeatures).fill(0);
  for (let i = 0; i < numSamples; i++) {
    for (let j = 0; j < numFeatures; j++) {
      mean[j] += embeddings[i][j];
    }
  }
  for (let j = 0; j < numFeatures; j++) {
    mean[j] /= numSamples;
  }

  const centeredData = embeddings.map(row => 
    row.map((val, idx) => val - mean[idx])
  );

  // Simplified projection approach for educational visualization
  // Uses dimension chunks to approximate principal components
  const chunkSize = Math.floor(numFeatures / targetDim);
  const coordinates = [];
  const variances = [];
  
  for (let dim = 0; dim < targetDim; dim++) {
    const start = dim * chunkSize;
    const end = dim === targetDim - 1 ? numFeatures : (dim + 1) * chunkSize;
    
    // Calculate projection and variance for this dimension
    let variance = 0;
    for (let i = 0; i < numSamples; i++) {
      const chunk = centeredData[i].slice(start, end);
      const projection = chunk.reduce((sum, val) => sum + val, 0) / chunk.length;
      
      if (!coordinates[i]) {
        coordinates[i] = { x: 0, y: 0, z: 0 };
      }
      
      if (dim === 0) coordinates[i].x = projection;
      else if (dim === 1) coordinates[i].y = projection;
      else if (dim === 2) coordinates[i].z = projection;
      
      variance += projection * projection;
    }
    variances.push(variance / numSamples);
  }
  
  // Calculate total variance and percentages
  const totalVariance = variances.reduce((sum, v) => sum + v, 0);
  const varianceExplained = variances.map(v => (v / totalVariance) * 100);

  return {
    coordinates,
    pcaInfo: {
      originalDimensions: numFeatures,
      reducedDimensions: targetDim,
      varianceExplained: varianceExplained.map(v => Math.round(v * 10) / 10),
      method: "simplified_projection"
    }
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/analyze", async (req, res) => {
    try {
      const { words } = analyzeWordsRequestSchema.parse(req.body);
      
      // Fetch embeddings for all words
      const embeddingPromises = words.map(async (word) => {
        try {
          const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
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

      // Perform PCA for 3D visualization
      const embeddingVectors = embeddings.map(e => e.embedding);
      const pcaResult = performPCA(embeddingVectors);
      
      const visualization = {
        coordinates: embeddings.map((e, index) => ({
          word: e.word,
          ...pcaResult.coordinates[index],
        })),
        pcaInfo: pcaResult.pcaInfo,
      };

      const result: AnalysisResult = {
        embeddings,
        similarities,
        visualization,
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
