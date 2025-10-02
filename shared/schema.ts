import { z } from "zod";

export const wordEmbeddingSchema = z.object({
  word: z.string().min(1).max(50),
  embedding: z.array(z.number()),
});

export const analyzeWordsRequestSchema = z.object({
  words: z.array(z.string()).min(2).max(4),
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
  }),
});

export type WordEmbedding = z.infer<typeof wordEmbeddingSchema>;
export type AnalyzeWordsRequest = z.infer<typeof analyzeWordsRequestSchema>;
export type SimilarityResult = z.infer<typeof similarityResultSchema>;
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
