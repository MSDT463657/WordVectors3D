import { type AnalysisResult } from "@shared/schema";

export interface IStorage {
  // No persistent storage needed for this application
  // All data is processed in real-time via OpenAI API
}

export class MemStorage implements IStorage {
  constructor() {
    // This application doesn't need persistent storage
    // All embeddings are fetched fresh from OpenAI
  }
}

export const storage = new MemStorage();
