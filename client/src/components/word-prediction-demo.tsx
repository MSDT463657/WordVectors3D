import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, TrendingUp, Info, Loader2 } from "lucide-react";
import type { PredictNextWordResult } from "@shared/schema";

const predefinedExamples = [
  {
    context: "The quick brown fox jumped over the",
    candidates: ["fence", "wall", "gate", "pizza", "computer", "rainbow"],
  },
  {
    context: "I love to eat",
    candidates: ["pizza", "pasta", "sushi", "laptop", "clouds", "happiness"],
  },
  {
    context: "The scientist discovered a new",
    candidates: ["planet", "species", "element", "recipe", "dance", "color"],
  },
];

export default function WordPredictionDemo() {
  const [selectedExample, setSelectedExample] = useState(0);
  const [customContext, setCustomContext] = useState("");
  const [customCandidates, setCustomCandidates] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  const predictMutation = useMutation<PredictNextWordResult, Error, { context: string; candidateWords: string[] }>({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/api/predict", data);
      return response.json() as Promise<PredictNextWordResult>;
    },
  });

  const handlePredict = () => {
    if (useCustom) {
      const words = customCandidates.split(",").map(w => w.trim()).filter(w => w.length > 0);
      if (customContext.trim() && words.length >= 2) {
        predictMutation.mutate({
          context: customContext.trim(),
          candidateWords: words,
        });
      }
    } else {
      const example = predefinedExamples[selectedExample];
      predictMutation.mutate({
        context: example.context,
        candidateWords: example.candidates,
      });
    }
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.7) return "text-green-600 dark:text-green-400";
    if (similarity >= 0.5) return "text-yellow-600 dark:text-yellow-400";
    if (similarity >= 0.3) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getProbabilityBarColor = (index: number) => {
    if (index === 0) return "bg-green-500";
    if (index === 1) return "bg-blue-500";
    if (index === 2) return "bg-purple-500";
    return "bg-gray-400";
  };

  return (
    <div className="space-y-6">
      {/* Educational Header */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-lg border-l-4 border-purple-500">
        <div className="flex items-start gap-3">
          <Sparkles className="text-purple-500 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-semibold text-foreground mb-2">How AI Predicts the Next Word</h3>
            <p className="text-sm text-muted-foreground">
              When AI predicts the next word in a sentence, it converts the context into a vector embedding, 
              then finds candidate words with the most similar embeddings. Higher similarity = higher probability!
            </p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={!useCustom ? "default" : "outline"}
            onClick={() => setUseCustom(false)}
            size="sm"
            data-testid="button-use-examples"
          >
            Use Examples
          </Button>
          <Button
            variant={useCustom ? "default" : "outline"}
            onClick={() => setUseCustom(true)}
            size="sm"
            data-testid="button-use-custom"
          >
            Custom Input
          </Button>
        </div>

        {!useCustom ? (
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              {predefinedExamples.map((example, index) => (
                <Button
                  key={index}
                  variant={selectedExample === index ? "default" : "outline"}
                  onClick={() => setSelectedExample(index)}
                  size="sm"
                  data-testid={`button-example-${index}`}
                >
                  Example {index + 1}
                </Button>
              ))}
            </div>
            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-foreground font-medium mb-2">
                Context: "{predefinedExamples[selectedExample].context} ___"
              </p>
              <p className="text-sm text-muted-foreground">
                Candidates: {predefinedExamples[selectedExample].candidates.join(", ")}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Context (sentence with blank at the end)
              </label>
              <Input
                value={customContext}
                onChange={(e) => setCustomContext(e.target.value)}
                placeholder="e.g., The cat sat on the"
                data-testid="input-custom-context"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Candidate Words (comma-separated, 2-10 words)
              </label>
              <Input
                value={customCandidates}
                onChange={(e) => setCustomCandidates(e.target.value)}
                placeholder="e.g., mat, table, chair, moon, computer"
                data-testid="input-custom-candidates"
              />
            </div>
          </div>
        )}

        <Button
          onClick={handlePredict}
          disabled={predictMutation.isPending}
          className="w-full"
          data-testid="button-predict"
        >
          {predictMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Predict Next Word
            </>
          )}
        </Button>
      </div>

      {/* Results Section */}
      {predictMutation.data && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="bg-gradient-to-r from-accent/20 to-primary/20 p-4 rounded-lg border border-accent/50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-accent" size={20} />
              <h4 className="font-semibold text-foreground">Top Prediction</h4>
            </div>
            <p className="text-2xl font-bold text-foreground" data-testid="text-top-prediction">
              {predictMutation.data.topPrediction}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Context: "{predictMutation.data.context}"
            </p>
          </div>

          <div className="bg-card p-4 rounded-lg border">
            <h4 className="font-semibold text-foreground mb-3">All Predictions (Ranked by Similarity)</h4>
            <div className="space-y-3">
              {predictMutation.data.predictions.map((pred, index) => (
                <div key={pred.word} className="space-y-2" data-testid={`prediction-${index}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{index + 1}. {pred.word}</span>
                      {index === 0 && (
                        <span className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                          Best Match
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-mono ${getSimilarityColor(pred.similarity)}`}>
                        Similarity: {pred.similarity.toFixed(3)}
                      </span>
                      <span className="text-sm font-mono text-muted-foreground">
                        {pred.probability.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProbabilityBarColor(index)} transition-all duration-500`}
                      style={{ width: `${pred.probability}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
            <div className="flex items-start gap-2">
              <Info className="text-blue-500 mt-0.5 flex-shrink-0" size={16} />
              <p className="text-sm text-foreground">
                <strong>Why "{predictMutation.data.topPrediction}" wins:</strong> It has the highest similarity score 
                ({predictMutation.data.predictions[0].similarity.toFixed(3)}) to the context embedding. 
                Words with similar meanings or common usage patterns have embeddings closer together in vector space!
              </p>
            </div>
          </div>
        </div>
      )}

      {predictMutation.isError && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/20" data-testid="error-message">
          <p className="text-sm">Error: {predictMutation.error?.message || "Failed to predict"}</p>
        </div>
      )}
    </div>
  );
}
