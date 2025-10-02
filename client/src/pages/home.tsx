import { useState, Component, type ReactNode } from "react";
import { Brain, Lightbulb, Keyboard, Calculator, Box, Bot, Sparkles, History } from "lucide-react";
import WordInput from "@/components/word-input";
import SimilarityDisplay from "@/components/similarity-display";
import Visualization3D from "@/components/visualization-3d-vanilla";
import PCAExplanation from "@/components/pca-explanation";
import WordPredictionDemo from "@/components/word-prediction-demo";
import SavedAnalyses from "@/components/saved-analyses";
import ComparisonView from "@/components/comparison-view";
import TutorialOverlay from "@/components/tutorial-overlay";
import InfoTooltip from "@/components/info-tooltip";
import { type AnalysisResult } from "@shared/schema";

interface SavedAnalysis {
  id: string;
  timestamp: number;
  words: string[];
  result: AnalysisResult;
}

class Visualization3DErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('3D Visualization error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-muted/30 p-8 rounded-lg text-center">
          <p className="text-muted-foreground mb-2">3D visualization unavailable</p>
          <p className="text-sm text-muted-foreground">
            Your environment may not support WebGL. The word analysis results above show the key findings.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function Home() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [comparisonAnalyses, setComparisonAnalyses] = useState<SavedAnalysis[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setAnalysisResult(result);
    setIsLoading(false);
  };

  const handleAnalysisStart = () => {
    setIsLoading(true);
    setAnalysisResult(null);
  };

  const handleAnalysisError = () => {
    setIsLoading(false);
  };

  const handleCompare = (analyses: SavedAnalysis[]) => {
    setComparisonAnalyses(analyses);
    setShowComparison(true);
  };

  const handleCloseComparison = () => {
    setShowComparison(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-bg py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="text-4xl text-gray-800 dark:text-white" size={48} />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white">AI Word Vector Visualizer</h1>
          </div>
          <p className="text-xl text-gray-700 dark:text-white/90 max-w-3xl mx-auto">
            Learn how AI understands words through vector embeddings and semantic similarity. 
            Enter words and see how they relate to each other in 3D space!
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Educational Introduction */}
        <section className="info-box p-6 rounded-lg fade-in">
          <div className="flex items-start gap-4">
            <Lightbulb className="text-3xl text-accent mt-1" size={32} />
            <div>
              <h2 className="text-2xl font-bold mb-3 text-foreground">What are Word Vectors?</h2>
              <p className="text-foreground/80 mb-3">
                In AI, words are represented as <strong>vectors</strong> (lists of numbers) in a high-dimensional space. 
                Words with similar meanings have vectors that point in similar directions.
              </p>
              <p className="text-foreground/80">
                <strong>Cosine similarity</strong> measures how similar two word vectors are, ranging from -1 (opposite) 
                to 1 (identical). Values close to 1 mean the words are semantically related!
              </p>
            </div>
          </div>
        </section>

        {/* Input Section */}
        <section className="bg-card rounded-lg shadow-lg p-6 card-hover fade-in">
          <div className="flex items-center gap-3 mb-6">
            <Keyboard className="text-2xl text-primary" size={24} />
            <h2 className="text-2xl font-bold text-card-foreground">Step 1: Enter Your Words</h2>
          </div>
          
          <WordInput 
            onAnalysisStart={handleAnalysisStart}
            onAnalysisComplete={handleAnalysisComplete}
            onAnalysisError={handleAnalysisError}
          />
        </section>

        {/* Vector Calculations Section */}
        {analysisResult && (
          <section className="bg-card rounded-lg shadow-lg p-6 fade-in">
            <div className="flex items-center gap-3 mb-6">
              <Calculator className="text-2xl text-primary" size={24} />
              <h2 className="text-2xl font-bold text-card-foreground">Step 2: Vector Calculations</h2>
              <InfoTooltip 
                title="Cosine Similarity"
                content="Measures the angle between two word vectors. A score of 1.0 means vectors point in the same direction (very similar), 0 means perpendicular (unrelated), and -1 means opposite directions."
              />
            </div>
            
            <SimilarityDisplay analysisResult={analysisResult} />
          </section>
        )}

        {/* 3D Visualization Section */}
        {analysisResult && (
          <section className="bg-card rounded-lg shadow-lg p-6 fade-in">
            <div className="flex items-center gap-3 mb-6">
              <Box className="text-2xl text-primary" size={24} />
              <h2 className="text-2xl font-bold text-card-foreground">Step 3: 3D Spatial Visualization</h2>
              <InfoTooltip 
                title="PCA (Principal Component Analysis)"
                content="Your words exist in 1536-dimensional space (too many to visualize). PCA reduces this to 3D while preserving the most important patterns and relationships between words."
              />
            </div>
            
            <Visualization3DErrorBoundary>
              <Visualization3D analysisResult={analysisResult} />
            </Visualization3DErrorBoundary>

            <div className="mt-8">
              <PCAExplanation analysisResult={analysisResult} />
            </div>
          </section>
        )}

        {/* How AI Uses This */}
        <section className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-6 border-2 border-primary/20">
          <div className="flex items-start gap-4">
            <Bot className="text-4xl text-primary mt-1" size={48} />
            <div>
              <h2 className="text-2xl font-bold mb-3 text-foreground">How AI Uses This for Text Prediction</h2>
              <div className="space-y-3 text-foreground/80">
                <p>
                  <strong>1. Context Understanding:</strong> When AI sees "The quick brown cat jumped over the...", 
                  it converts each word to vectors and understands the context.
                </p>
                <p>
                  <strong>2. Next Word Prediction:</strong> The AI looks for words with vectors similar to the context. 
                  Words like "fence" or "wall" would have higher similarity scores than unrelated words like "pizza".
                </p>
                <p>
                  <strong>3. Probability Calculation:</strong> Based on similarity scores and patterns learned from 
                  billions of examples, the AI assigns probabilities to possible next words and chooses the most likely one.
                </p>
                <p className="text-sm bg-white/50 p-3 rounded-lg border-l-4 border-accent">
                  <strong>Key Insight:</strong> The closer two words are in vector space, the more semantically related 
                  they are. This is why similar words have high similarity scores while unrelated words don't.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Word Prediction Demo */}
        <section className="bg-card rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="text-2xl text-purple-500" size={24} />
            <h2 className="text-2xl font-bold text-card-foreground">Try It Yourself: Word Prediction Demo</h2>
          </div>
          
          <WordPredictionDemo />
        </section>

        {/* Saved Analyses & Comparison */}
        <section className="bg-card rounded-lg shadow-lg p-6">
          <SavedAnalyses 
            currentAnalysis={analysisResult}
            onCompare={handleCompare}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p className="mb-2">Educational AI Vector Visualizer - Built for learners</p>
          <p className="text-sm">
            Powered by OpenAI's text-embedding-3-small model • Three.js for 3D visualization
          </p>
        </div>
      </footer>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-8 rounded-lg shadow-2xl text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-lg font-medium text-foreground">Fetching word embeddings...</p>
            <p className="text-sm text-muted-foreground mt-2">This may take a few seconds</p>
          </div>
        </div>
      )}

      {/* Comparison View Modal */}
      {showComparison && (
        <ComparisonView 
          analyses={comparisonAnalyses}
          onClose={handleCloseComparison}
        />
      )}

      {/* Tutorial Overlay */}
      <TutorialOverlay />
    </div>
  );
}
