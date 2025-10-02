import { ArrowLeftRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnalysisResult } from "@shared/schema";

interface SavedAnalysis {
  id: string;
  timestamp: number;
  words: string[];
  result: AnalysisResult;
}

interface ComparisonViewProps {
  analyses: SavedAnalysis[];
  onClose: () => void;
}

export default function ComparisonView({ analyses, onClose }: ComparisonViewProps) {
  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.7) return "text-green-600 dark:text-green-400 bg-green-500/20";
    if (similarity >= 0.5) return "text-yellow-600 dark:text-yellow-400 bg-yellow-500/20";
    if (similarity >= 0.3) return "text-orange-600 dark:text-orange-400 bg-orange-500/20";
    return "text-red-600 dark:text-red-400 bg-red-500/20";
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-y-auto p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ArrowLeftRight className="text-primary" size={28} />
            <h2 className="text-2xl font-bold text-foreground">Comparison View</h2>
          </div>
          <Button variant="ghost" onClick={onClose} data-testid="button-close-comparison">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {analyses.map((analysis) => (
            <div key={analysis.id} className="bg-card rounded-lg p-6 border shadow-lg">
              <div className="mb-4">
                <h3 className="font-bold text-lg text-foreground mb-1" data-testid={`comparison-title-${analysis.id}`}>
                  {analysis.words.join(" • ")}
                </h3>
                <p className="text-xs text-muted-foreground">{formatTimestamp(analysis.timestamp)}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-foreground mb-2">Words</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.result.embeddings.map((emb) => (
                      <span
                        key={emb.word}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                        data-testid={`word-${analysis.id}-${emb.word}`}
                      >
                        {emb.word}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-foreground mb-2">Similarity Scores</h4>
                  <div className="space-y-2">
                    {analysis.result.similarities.map((sim, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded-lg ${getSimilarityColor(sim.similarity)}`}
                        data-testid={`similarity-${analysis.id}-${index}`}
                      >
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium">
                            {sim.word1} ↔ {sim.word2}
                          </span>
                          <span className="font-mono font-bold">
                            {sim.similarity.toFixed(3)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-foreground mb-2">3D Coordinates</h4>
                  <div className="space-y-1">
                    {analysis.result.visualization.coordinates.map((coord) => (
                      <div
                        key={coord.word}
                        className="text-xs text-muted-foreground font-mono bg-muted/30 p-2 rounded"
                        data-testid={`coords-${analysis.id}-${coord.word}`}
                      >
                        <span className="font-semibold">{coord.word}:</span> (
                        {coord.x.toFixed(3)}, {coord.y.toFixed(3)}, {coord.z.toFixed(3)})
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-foreground mb-2">PCA Variance</h4>
                  <div className="space-y-1">
                    {analysis.result.visualization.pcaInfo.varianceExplained.map((variance, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">PC{index + 1}:</span>
                        <span className="font-mono text-foreground">{variance.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
          <p className="text-sm text-foreground">
            <strong>💡 Comparison Insights:</strong> Compare similarity scores and 3D positions across different 
            word sets. Words with higher similarity scores (closer to 1.0) are more semantically related, while 
            their 3D coordinates show their relative positions in the reduced embedding space.
          </p>
        </div>
      </div>
    </div>
  );
}
