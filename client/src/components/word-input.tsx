import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Plus, Key, X, Wand2, Info } from "lucide-react";
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
  const [apiKey, setApiKey] = useState("");
  const [currentWord, setCurrentWord] = useState("");
  const [words, setWords] = useState<string[]>([]);
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
        description: `Successfully analyzed ${words.length} words and calculated ${result.similarities.length} similarity pairs.`,
      });
    },
    onError: (error: any) => {
      onAnalysisError();
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze words. Please check your API key and try again.",
        variant: "destructive",
      });
    },
  });

  const addWord = () => {
    const trimmedWord = currentWord.trim().toLowerCase();
    if (!trimmedWord) {
      toast({
        title: "Invalid Word",
        description: "Please enter a valid word.",
        variant: "destructive",
      });
      return;
    }

    if (words.includes(trimmedWord)) {
      toast({
        title: "Duplicate Word",
        description: "This word has already been added.",
        variant: "destructive",
      });
      return;
    }

    if (words.length >= 4) {
      toast({
        title: "Maximum Words Reached",
        description: "You can only analyze up to 4 words at once.",
        variant: "destructive",
      });
      return;
    }

    setWords([...words, trimmedWord]);
    setCurrentWord("");
  };

  const removeWord = (index: number) => {
    setWords(words.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addWord();
    }
  };

  const handleAnalyze = () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenAI API key.",
        variant: "destructive",
      });
      return;
    }

    if (words.length < 2) {
      toast({
        title: "Not Enough Words",
        description: "Please enter at least 2 words for analysis.",
        variant: "destructive",
      });
      return;
    }

    onAnalysisStart();
    analyzeMutation.mutate({ words, apiKey: apiKey.trim() });
  };

  return (
    <>
      {/* API Key Input */}
      <div className="mb-6">
        <Label htmlFor="api-key" className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
          <Key className="text-muted-foreground" size={16} />
          OpenAI API Key
        </Label>
        <Input
          id="api-key"
          type="password"
          placeholder="sk-..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full"
          data-testid="input-api-key"
        />
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <Info size={12} />
          Your API key is used to fetch word embeddings from OpenAI (text-embedding-3-small model)
        </p>
      </div>

      {/* Word Input */}
      <div className="mb-6">
        <Label htmlFor="word-input" className="block text-sm font-medium text-foreground mb-2">
          Enter 2-4 words (press Enter or click Add after each word)
        </Label>
        <div className="flex gap-2 mb-4">
          <Input
            id="word-input"
            type="text"
            placeholder="e.g., cat, dog, pizza, mountain..."
            value={currentWord}
            onChange={(e) => setCurrentWord(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
            data-testid="input-word"
          />
          <Button
            onClick={addWord}
            disabled={!currentWord.trim() || words.length >= 4}
            data-testid="button-add-word"
          >
            <Plus size={16} className="mr-2" />
            Add
          </Button>
        </div>

        {/* Word Tags */}
        <div className="flex flex-wrap gap-2" data-testid="words-container">
          {words.map((word, index) => (
            <span
              key={index}
              className="word-tag inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-full font-medium"
              data-testid={`word-tag-${index}`}
            >
              {word}
              <button
                onClick={() => removeWord(index)}
                className="hover:text-destructive transition-colors"
                data-testid={`button-remove-word-${index}`}
              >
                <X size={16} />
              </button>
            </span>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
          <Info size={12} />
          <span data-testid="word-count">{words.length}</span> of 4 words added (2 minimum, 4 maximum)
        </p>
      </div>

      {/* Analyze Button */}
      <Button
        onClick={handleAnalyze}
        disabled={words.length < 2 || !apiKey.trim() || analyzeMutation.isPending}
        className="w-full px-6 py-4 gradient-bg text-white rounded-lg font-semibold text-lg hover:shadow-lg transition-all"
        data-testid="button-analyze"
      >
        <Wand2 size={20} className="mr-2" />
        Analyze Word Vectors
      </Button>
    </>
  );
}
