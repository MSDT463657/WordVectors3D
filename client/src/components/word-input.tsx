import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type AnalysisResult, type AnalyzeWordsRequest } from "@shared/schema";

interface WordInputProps {
  onAnalysisStart: () => void;
  onAnalysisComplete: (result: AnalysisResult) => void;
  onAnalysisError: () => void;
}

export default function WordInput({ onAnalysisStart, onAnalysisComplete, onAnalysisError }: WordInputProps) {
  const [word1, setWord1] = useState("");
  const [word2, setWord2] = useState("");
  const [word3, setWord3] = useState("");
  const [word4, setWord4] = useState("");
  const { toast } = useToast();

  const analyzeMutation = useMutation({
    mutationFn: async (data: AnalyzeWordsRequest) => {
      const response = await apiRequest("POST", "/api/analyze", data);
      return response.json() as Promise<AnalysisResult>;
    },
    onSuccess: (result) => {
      onAnalysisComplete(result);
      toast({
        title: "Analysis Complete!",
        description: `Successfully analyzed ${result.embeddings.length} words and calculated ${result.similarities.length} similarity pairs.`,
      });
    },
    onError: (error: any) => {
      onAnalysisError();
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze words. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    const words = [word1, word2, word3, word4]
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length > 0);

    if (words.length < 2) {
      toast({
        title: "Not Enough Words",
        description: "Please enter at least 2 words for analysis.",
        variant: "destructive",
      });
      return;
    }

    const uniqueWords = Array.from(new Set(words));
    if (uniqueWords.length !== words.length) {
      toast({
        title: "Duplicate Words",
        description: "Please enter different words for each input.",
        variant: "destructive",
      });
      return;
    }

    onAnalysisStart();
    analyzeMutation.mutate({ words: uniqueWords });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="word1" className="text-sm font-medium text-foreground mb-2 block">
            Word 1 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="word1"
            type="text"
            placeholder="e.g., king"
            value={word1}
            onChange={(e) => setWord1(e.target.value)}
            className="w-full"
            data-testid="input-word1"
          />
        </div>

        <div>
          <Label htmlFor="word2" className="text-sm font-medium text-foreground mb-2 block">
            Word 2 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="word2"
            type="text"
            placeholder="e.g., queen"
            value={word2}
            onChange={(e) => setWord2(e.target.value)}
            className="w-full"
            data-testid="input-word2"
          />
        </div>

        <div>
          <Label htmlFor="word3" className="text-sm font-medium text-foreground mb-2 block">
            Word 3 <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="word3"
            type="text"
            placeholder="e.g., man"
            value={word3}
            onChange={(e) => setWord3(e.target.value)}
            className="w-full"
            data-testid="input-word3"
          />
        </div>

        <div>
          <Label htmlFor="word4" className="text-sm font-medium text-foreground mb-2 block">
            Word 4 <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="word4"
            type="text"
            placeholder="e.g., woman"
            value={word4}
            onChange={(e) => setWord4(e.target.value)}
            className="w-full"
            data-testid="input-word4"
          />
        </div>
      </div>

      <Button
        onClick={handleAnalyze}
        disabled={!word1.trim() || !word2.trim() || analyzeMutation.isPending}
        className="w-full px-6 py-4 gradient-bg text-white rounded-lg font-semibold text-lg hover:shadow-lg transition-all"
        data-testid="button-analyze"
      >
        <Wand2 size={20} className="mr-2" />
        Analyze Word Vectors
      </Button>
    </div>
  );
}
