// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import OpenAI from "openai";

// shared/schema.ts
import { z } from "zod";
var wordEmbeddingSchema = z.object({
  word: z.string().min(1).max(50),
  embedding: z.array(z.number())
});
var analyzeWordsRequestSchema = z.object({
  words: z.array(z.string()).min(2).max(4),
  model: z.enum(["text-embedding-3-small", "text-embedding-3-large"]).default("text-embedding-3-small")
});
var similarityResultSchema = z.object({
  word1: z.string(),
  word2: z.string(),
  similarity: z.number().min(-1).max(1)
});
var analysisResultSchema = z.object({
  embeddings: z.array(wordEmbeddingSchema),
  similarities: z.array(similarityResultSchema),
  visualization: z.object({
    coordinates: z.array(z.object({
      word: z.string(),
      x: z.number(),
      y: z.number(),
      z: z.number()
    })),
    pcaInfo: z.object({
      originalDimensions: z.number(),
      reducedDimensions: z.number(),
      varianceExplained: z.array(z.number()),
      method: z.string()
    })
  }),
  model: z.string().optional()
});
var predictNextWordRequestSchema = z.object({
  context: z.string().min(1).max(200),
  candidateWords: z.array(z.string()).min(2).max(10)
});
var wordPredictionSchema = z.object({
  word: z.string(),
  similarity: z.number().min(-1).max(1),
  probability: z.number().min(0).max(100)
});
var predictNextWordResultSchema = z.object({
  context: z.string(),
  contextEmbedding: z.array(z.number()),
  predictions: z.array(wordPredictionSchema),
  topPrediction: z.string()
});

// server/routes.ts
import { z as z2 } from "zod";
var openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
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
function normalizeVector(vec) {
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  return norm > 0 ? vec.map((val) => val / norm) : vec;
}
function performMDS(embeddings, targetDim = 3) {
  const numSamples = embeddings.length;
  const numFeatures = embeddings[0].length;
  const normalized = embeddings.map(normalizeVector);
  const distanceMatrix = [];
  for (let i = 0; i < numSamples; i++) {
    distanceMatrix[i] = [];
    for (let j = 0; j < numSamples; j++) {
      if (i === j) {
        distanceMatrix[i][j] = 0;
      } else {
        const cosSim = cosineSimilarity(normalized[i], normalized[j]);
        distanceMatrix[i][j] = 1 - cosSim;
      }
    }
  }
  const squaredDist = distanceMatrix.map(
    (row) => row.map((d) => d * d)
  );
  const rowMeans = squaredDist.map(
    (row) => row.reduce((sum, val) => sum + val, 0) / numSamples
  );
  const overallMean = rowMeans.reduce((sum, val) => sum + val, 0) / numSamples;
  const B = [];
  for (let i = 0; i < numSamples; i++) {
    B[i] = [];
    for (let j = 0; j < numSamples; j++) {
      B[i][j] = -0.5 * (squaredDist[i][j] - rowMeans[i] - rowMeans[j] + overallMean);
    }
  }
  const coordinates = [];
  const eigenvalues = [];
  const eigenvectors = [];
  for (let dim = 0; dim < targetDim; dim++) {
    let eigenvector = new Array(numSamples).fill(0).map(() => Math.random() - 0.5);
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
    for (let iter = 0; iter < 150; iter++) {
      const newVec = new Array(numSamples).fill(0);
      for (let i = 0; i < numSamples; i++) {
        for (let j = 0; j < numSamples; j++) {
          newVec[i] += B[i][j] * eigenvector[j];
        }
      }
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
      const norm = Math.sqrt(newVec.reduce((sum, val) => sum + val * val, 0));
      eigenvector = norm > 0 ? newVec.map((val) => val / norm) : newVec;
    }
    let eigenvalue = 0;
    for (let i = 0; i < numSamples; i++) {
      let sum = 0;
      for (let j = 0; j < numSamples; j++) {
        sum += B[i][j] * eigenvector[j];
      }
      eigenvalue += eigenvector[i] * sum;
    }
    const finalEigenvalue = Math.max(1e-3, eigenvalue);
    eigenvalues.push(finalEigenvalue);
    eigenvectors.push([...eigenvector]);
    const baseScale = Math.sqrt(finalEigenvalue);
    const scale = dim === 2 ? baseScale * 2.5 : baseScale;
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
  const totalVariance = eigenvalues.reduce((sum, v) => sum + v, 0);
  const varianceExplained = totalVariance > 0 ? eigenvalues.map((v) => v / totalVariance * 100) : eigenvalues.map(() => 100 / targetDim);
  return {
    coordinates,
    pcaInfo: {
      originalDimensions: numFeatures,
      reducedDimensions: targetDim,
      varianceExplained: varianceExplained.map((v) => Math.round(v * 10) / 10),
      method: "MDS (cosine distance)"
    }
  };
}
async function registerRoutes(app2) {
  app2.post("/api/analyze", async (req, res) => {
    try {
      const { words, model } = analyzeWordsRequestSchema.parse(req.body);
      const embeddingPromises = words.map(async (word) => {
        try {
          const response = await openai.embeddings.create({
            model: model || "text-embedding-3-small",
            input: word
          });
          return {
            word,
            embedding: response.data[0].embedding
          };
        } catch (error) {
          throw new Error(`Failed to get embedding for "${word}": ${error.message}`);
        }
      });
      const embeddings = await Promise.all(embeddingPromises);
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
            similarity: Math.round(similarity * 1e3) / 1e3
            // Round to 3 decimal places
          });
        }
      }
      const embeddingVectors = embeddings.map((e) => e.embedding);
      const mdsResult = performMDS(embeddingVectors);
      const visualization = {
        coordinates: embeddings.map((e, index) => ({
          word: e.word,
          ...mdsResult.coordinates[index]
        })),
        pcaInfo: mdsResult.pcaInfo
      };
      const result = {
        embeddings,
        similarities,
        visualization,
        model: model || "text-embedding-3-small"
      };
      res.json(result);
    } catch (error) {
      console.error("Analysis error:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: error.errors
        });
      }
      if (error?.message?.includes("Invalid API key") || error?.message?.includes("Incorrect API key")) {
        return res.status(401).json({
          message: "Invalid OpenAI API key. Please check your API key and try again."
        });
      }
      if (error?.message?.includes("quota") || error?.message?.includes("rate limit")) {
        return res.status(429).json({
          message: "OpenAI API rate limit or quota exceeded. Please try again later."
        });
      }
      res.status(500).json({
        message: error?.message || "Failed to analyze words. Please try again."
      });
    }
  });
  app2.post("/api/predict", async (req, res) => {
    try {
      const { context, candidateWords } = predictNextWordRequestSchema.parse(req.body);
      const contextResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: context
      });
      const contextEmbedding = contextResponse.data[0].embedding;
      const candidatePromises = candidateWords.map(async (word) => {
        const response = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: word
        });
        return {
          word,
          embedding: response.data[0].embedding
        };
      });
      const candidates = await Promise.all(candidatePromises);
      const predictions = candidates.map((candidate) => {
        const similarity = cosineSimilarity(contextEmbedding, candidate.embedding);
        return {
          word: candidate.word,
          similarity: Math.round(similarity * 1e3) / 1e3,
          probability: 0
          // Will calculate below
        };
      });
      predictions.sort((a, b) => b.similarity - a.similarity);
      const maxSim = predictions[0].similarity;
      const expScores = predictions.map((p) => Math.exp((p.similarity - maxSim) * 10));
      const sumExp = expScores.reduce((sum, val) => sum + val, 0);
      predictions.forEach((prediction, index) => {
        prediction.probability = Math.round(expScores[index] / sumExp * 100 * 10) / 10;
      });
      const result = {
        context,
        contextEmbedding,
        predictions,
        topPrediction: predictions[0].word
      };
      res.json(result);
    } catch (error) {
      console.error("Prediction error:", error);
      if (error instanceof z2.ZodError) {
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
