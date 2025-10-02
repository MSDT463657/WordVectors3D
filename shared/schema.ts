import { z } from "zod";

export const wordEmbeddingSchema = z.object({
  word: z.string().min(1).max(50),
  embedding: z.array(z.number()),
});

export const analyzeWordsRequestSchema = z.object({
  words: z.array(z.string()).min(2).max(4),
  model: z.enum(["text-embedding-3-small", "text-embedding-3-large"]).default("text-embedding-3-small"),
});

export const similarityResultSchema = z.object({
  word1: z.string(),
  word2: z.string(),
  similarity: z.number().min(-1).max(1),
});

export const analysisResultSchema = z.object({
  embeddings: z.array(wordEmbeddingSchema),
  similarities: z.array(similarityResultSchema),
  visualization: z.object({
    coordinates: z.array(z.object({
      word: z.string(),
      x: z.number(),
      y: z.number(),
      z: z.number(),
    })),
    pcaInfo: z.object({
      originalDimensions: z.number(),
      reducedDimensions: z.number(),
      varianceExplained: z.array(z.number()),
      method: z.string(),
    }),
  }),
  model: z.string().optional(),
});

export const predictNextWordRequestSchema = z.object({
  context: z.string().min(1).max(200),
  candidateWords: z.array(z.string()).min(2).max(10),
});

export const wordPredictionSchema = z.object({
  word: z.string(),
  similarity: z.number().min(-1).max(1),
  probability: z.number().min(0).max(100),
});

export const predictNextWordResultSchema = z.object({
  context: z.string(),
  contextEmbedding: z.array(z.number()),
  predictions: z.array(wordPredictionSchema),
  topPrediction: z.string(),
});

export type WordEmbedding = z.infer<typeof wordEmbeddingSchema>;
export type AnalyzeWordsRequest = z.infer<typeof analyzeWordsRequestSchema>;
export type SimilarityResult = z.infer<typeof similarityResultSchema>;
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type PredictNextWordRequest = z.infer<typeof predictNextWordRequestSchema>;
export type WordPrediction = z.infer<typeof wordPredictionSchema>;
export type PredictNextWordResult = z.infer<typeof predictNextWordResultSchema>;
