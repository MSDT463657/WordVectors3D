import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import { analyzeWordsRequestSchema, type AnalysisResult } from "@shared/schema";
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

  // For simplicity, we'll use a basic projection approach
  // In a production system, you'd want proper SVD-based PCA
  const result = [];
  for (let i = 0; i < numSamples; i++) {
    const coords = {
      x: centeredData[i].slice(0, 100).reduce((sum, val) => sum + val, 0) / 100,
      y: centeredData[i].slice(100, 200).reduce((sum, val) => sum + val, 0) / 100,
      z: centeredData[i].slice(200, 300).reduce((sum, val) => sum + val, 0) / 100,
    };
    result.push(coords);
  }

  return result;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/analyze", async (req, res) => {
    try {
      const { words, apiKey } = analyzeWordsRequestSchema.parse(req.body);
      
      // Create a temporary OpenAI client with the user's API key
      const userOpenAI = new OpenAI({ apiKey });
      
      // Fetch embeddings for all words
      const embeddingPromises = words.map(async (word) => {
        try {
          const response = await userOpenAI.embeddings.create({
            model: "text-embedding-3-small",
            input: word,
          });
          return {
            word,
            embedding: response.data[0].embedding,
          };
        } catch (error) {
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
      const coordinates3D = performPCA(embeddingVectors);
      
      const visualization = {
        coordinates: embeddings.map((e, index) => ({
          word: e.word,
          ...coordinates3D[index],
        })),
      };

      const result: AnalysisResult = {
        embeddings,
        similarities,
        visualization,
      };

      res.json(result);
    } catch (error) {
      console.error('Analysis error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors 
        });
      }
      
      if (error.message.includes('Invalid API key') || error.message.includes('Incorrect API key')) {
        return res.status(401).json({ 
          message: "Invalid OpenAI API key. Please check your API key and try again." 
        });
      }
      
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        return res.status(429).json({ 
          message: "OpenAI API rate limit or quota exceeded. Please try again later." 
        });
      }

      res.status(500).json({ 
        message: error.message || "Failed to analyze words. Please try again." 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
