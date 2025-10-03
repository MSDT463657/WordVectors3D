import { useState } from "react";
import { ChevronDown, ChevronUp, GraduationCap, CheckCircle, MinusCircle, XCircle, ArrowLeftRight, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type AnalysisResult } from "@shared/schema";
import { VectorLearningModule } from "./vector-learning-module";
import { dotProduct, vectorNorm, formatLargeNumber } from "@/lib/math-utils";

interface SimilarityDisplayProps {
  analysisResult: AnalysisResult;
}

export default function SimilarityDisplay({ analysisResult }: SimilarityDisplayProps) {
  const [showVectorDetails, setShowVectorDetails] = useState(false);
  const [showCalculationSteps, setShowCalculationSteps] = useState(false);

  const getSimilarityIcon = (similarity: number) => {
    if (similarity >= 0.7) return <CheckCircle className="text-accent" size={16} />;
    if (similarity >= 0.4) return <MinusCircle className="text-muted-foreground" size={16} />;
    return <XCircle className="text-muted-foreground" size={16} />;
  };

  const getSimilarityDescription = (similarity: number) => {
    if (similarity >= 0.7) return "High similarity - semantically related";
    if (similarity >= 0.4) return "Medium similarity - some relation";
    return "Low similarity - different concepts";
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.7) return "text-accent";
    if (similarity >= 0.4) return "text-primary";
    return "text-muted-foreground";
  };

  const getSimilarityBarColor = (similarity: number) => {
    if (similarity >= 0.7) return "bg-accent";
    if (similarity >= 0.4) return "bg-primary";
    return "bg-muted-foreground";
  };

  return (
    <>
      {/* Vector Learning Module with Simple Example */}
      <VectorLearningModule />

      {/* Educational explanation */}
      <div className="bg-muted/50 p-4 rounded-lg mb-6">
        <p className="text-sm text-muted-foreground flex items-start gap-2">
          <GraduationCap className="text-accent mt-0.5" size={16} />
          Each word has been converted into a vector with 1536 dimensions (OpenAI's text-embedding-3-small model). 
          Below, we show the cosine similarity between each pair of words. 
          <strong>Cosine similarity ranges from 0 to 1</strong>, where 1 means identical meaning and 0 means unrelated. 
          The percentage shows the same value scaled to 0-100% for easier visualization.
        </p>
      </div>

      {/* Similarity Matrix */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-card-foreground mb-4 flex items-center gap-2">
          <ArrowLeftRight className="text-muted-foreground" size={20} />
          Cosine Similarity Scores
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          {analysisResult.similarities.map((sim, index) => (
            <div 
              key={index}
              className="border-2 border-border rounded-lg p-4 hover:border-primary transition-colors"
              data-testid={`similarity-pair-${index}`}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-secondary/20 text-secondary rounded-full font-medium">
                    {sim.word1}
                  </span>
                  <ArrowLeftRight className="text-muted-foreground" size={16} />
                  <span className="px-3 py-1 bg-secondary/20 text-secondary rounded-full font-medium">
                    {sim.word2}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Similarity:</span>
                <span 
                  className={`similarity-score ${getSimilarityColor(sim.similarity)}`}
                  data-testid={`similarity-score-${index}`}
                >
                  {sim.similarity.toFixed(3)} ({(sim.similarity * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden" title={`${(sim.similarity * 100).toFixed(1)}% similarity`}>
                <div 
                  className={`h-full ${getSimilarityBarColor(sim.similarity)} transition-all`}
                  style={{ width: `${Math.max(0, sim.similarity * 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                {getSimilarityIcon(sim.similarity)}
                {getSimilarityDescription(sim.similarity)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Calculation Steps (Expandable) */}
      <div className="mt-8">
        <Button
          variant="ghost"
          onClick={() => setShowCalculationSteps(!showCalculationSteps)}
          className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors font-medium p-0"
          data-testid="button-toggle-calculations"
        >
          {showCalculationSteps ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <Calculator size={16} />
          <span>
            {showCalculationSteps ? "Hide" : "Show"} Calculation Steps (for advanced learners)
          </span>
        </Button>

        {showCalculationSteps && (
          <div className="mt-4 space-y-4" data-testid="calculation-steps">
            {analysisResult.similarities.map((sim, index) => {
              // Get the embeddings for this pair
              const embedding1 = analysisResult.embeddings.find(e => e.word === sim.word1);
              const embedding2 = analysisResult.embeddings.find(e => e.word === sim.word2);
              
              if (!embedding1 || !embedding2) return null;
              
              // Calculate components
              const dot = dotProduct(embedding1.embedding, embedding2.embedding);
              const norm1 = vectorNorm(embedding1.embedding);
              const norm2 = vectorNorm(embedding2.embedding);
              const calculatedSimilarity = dot / (norm1 * norm2);
              
              return (
                <div key={index} className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="px-2 py-1 bg-purple-600 text-white rounded text-sm">
                      {sim.word1}
                    </span>
                    <ArrowLeftRight size={16} className="text-muted-foreground" />
                    <span className="px-2 py-1 bg-blue-600 text-white rounded text-sm">
                      {sim.word2}
                    </span>
                  </h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded">
                      <div className="font-mono text-xs text-gray-600 dark:text-gray-400 mb-1">Step 1: Dot Product</div>
                      <div className="text-gray-900 dark:text-gray-100">
                        Sum of (vec1[i] × vec2[i]) for all 1536 dimensions = <strong>{formatLargeNumber(dot)}</strong>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-3 rounded">
                      <div className="font-mono text-xs text-gray-600 dark:text-gray-400 mb-1">Step 2: Vector Lengths</div>
                      <div className="text-gray-900 dark:text-gray-100">
                        ||{sim.word1}|| = √(sum of squares) = <strong>{formatLargeNumber(norm1)}</strong>
                      </div>
                      <div className="text-gray-900 dark:text-gray-100">
                        ||{sim.word2}|| = √(sum of squares) = <strong>{formatLargeNumber(norm2)}</strong>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-3 rounded">
                      <div className="font-mono text-xs text-gray-600 dark:text-gray-400 mb-1">Step 3: Cosine Similarity</div>
                      <div className="text-gray-900 dark:text-gray-100">
                        {formatLargeNumber(dot)} ÷ ({formatLargeNumber(norm1)} × {formatLargeNumber(norm2)}) = <strong className="text-purple-600 dark:text-purple-400">{calculatedSimilarity.toFixed(3)}</strong>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        (Backend value: {sim.similarity.toFixed(3)} - {Math.abs(calculatedSimilarity - sim.similarity) < 0.001 ? '✓ Match' : '⚠ Slight difference due to rounding'})
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Vector Details (Expandable) */}
      <div className="mt-8">
        <Button
          variant="ghost"
          onClick={() => setShowVectorDetails(!showVectorDetails)}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium p-0"
          data-testid="button-toggle-vectors"
        >
          {showVectorDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <span>
            {showVectorDetails ? "Hide" : "Show"} Raw Vector Values (for advanced learners)
          </span>
        </Button>

        {showVectorDetails && (
          <div className="mt-4 space-y-4" data-testid="vector-details">
            {analysisResult.embeddings.map((embedding, index) => (
              <div key={index} className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm">
                    {embedding.word}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    Vector (first 10 dimensions of 1536)
                  </span>
                </h4>
                <div className="vector-display text-muted-foreground overflow-x-auto">
                  [{embedding.embedding.slice(0, 10).map(val => val.toFixed(4)).join(", ")}, ...]
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
