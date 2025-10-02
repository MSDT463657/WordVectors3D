import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Save, Trash2, Eye, History, ArrowLeftRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AnalysisResult } from "@shared/schema";

interface SavedAnalysis {
  id: string;
  timestamp: number;
  words: string[];
  result: AnalysisResult;
}

interface SavedAnalysesProps {
  currentAnalysis: AnalysisResult | null;
  onCompare: (analyses: SavedAnalysis[]) => void;
}

const STORAGE_KEY = "wordvector_saved_analyses";

export default function SavedAnalyses({ currentAnalysis, onCompare }: SavedAnalysesProps) {
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadSavedAnalyses();
  }, []);

  const loadSavedAnalyses = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedAnalyses(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load saved analyses:", error);
    }
  };

  const saveCurrentAnalysis = () => {
    if (!currentAnalysis) return;

    const words = currentAnalysis.embeddings.map(e => e.word);
    const newAnalysis: SavedAnalysis = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      words,
      result: currentAnalysis,
    };

    const updated = [newAnalysis, ...savedAnalyses].slice(0, 10); // Keep max 10
    setSavedAnalyses(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    toast({
      title: "Analysis Saved!",
      description: `Saved analysis for: ${words.join(", ")}`,
    });
  };

  const deleteAnalysis = (id: string) => {
    const updated = savedAnalyses.filter(a => a.id !== id);
    setSavedAnalyses(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSelectedForCompare(prev => prev.filter(selectedId => selectedId !== id));

    toast({
      title: "Analysis Deleted",
      description: "Analysis removed from saved list",
    });
  };

  const toggleSelection = (id: string) => {
    setSelectedForCompare(prev => {
      if (prev.includes(id)) {
        return prev.filter(selectedId => selectedId !== id);
      } else if (prev.length < 3) {
        return [...prev, id];
      } else {
        toast({
          title: "Maximum Reached",
          description: "You can compare up to 3 analyses at once",
          variant: "destructive",
        });
        return prev;
      }
    });
  };

  const handleCompare = () => {
    const analysesToCompare = savedAnalyses.filter(a => selectedForCompare.includes(a.id));
    onCompare(analysesToCompare);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="text-primary" size={20} />
          <h3 className="font-semibold text-foreground">Saved Analyses</h3>
        </div>
        <Button
          onClick={saveCurrentAnalysis}
          disabled={!currentAnalysis}
          size="sm"
          data-testid="button-save-analysis"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Current
        </Button>
      </div>

      {savedAnalyses.length === 0 ? (
        <div className="bg-muted/30 p-6 rounded-lg text-center">
          <p className="text-muted-foreground text-sm">
            No saved analyses yet. Analyze some words and save them to compare later!
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {savedAnalyses.map((analysis) => (
              <Card key={analysis.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedForCompare.includes(analysis.id)}
                        onChange={() => toggleSelection(analysis.id)}
                        className="h-4 w-4"
                        data-testid={`checkbox-analysis-${analysis.id}`}
                      />
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {analysis.words.join(", ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimestamp(analysis.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAnalysis(analysis.id)}
                    data-testid={`button-delete-${analysis.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {selectedForCompare.length >= 2 && (
            <Button
              onClick={handleCompare}
              className="w-full"
              data-testid="button-compare-selected"
            >
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Compare {selectedForCompare.length} Analyses
            </Button>
          )}
        </>
      )}
    </div>
  );
}
