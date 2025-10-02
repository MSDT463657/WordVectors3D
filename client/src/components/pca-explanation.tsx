import { Info, TrendingDown, BarChart3 } from "lucide-react";
import { type AnalysisResult } from "@shared/schema";

interface PCAExplanationProps {
  analysisResult: AnalysisResult;
}

export default function PCAExplanation({ analysisResult }: PCAExplanationProps) {
  const { pcaInfo } = analysisResult.visualization;
  const modelName = analysisResult.model || "text-embedding-3-small";
  
  const getBarColor = (index: number) => {
    const colors = ["bg-accent", "bg-primary", "bg-secondary"];
    return colors[index] || "bg-muted";
  };

  const getDimensionName = (index: number) => {
    const names = ["X (PC1)", "Y (PC2)", "Z (PC3)"];
    return names[index] || `Dim ${index + 1}`;
  };

  return (
    <div className="space-y-6">
      {/* Educational Overview */}
      <div className="bg-gradient-to-r from-accent/10 to-primary/10 p-4 rounded-lg border-l-4 border-accent">
        <div className="flex items-start gap-3">
          <Info className="text-accent mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-semibold text-foreground mb-2">How Dimensionality Reduction Works</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Word embeddings from <strong>{modelName}</strong> exist in {pcaInfo.originalDimensions}-dimensional space, 
              which humans can't visualize. We use <strong>Multi-Dimensional Scaling (MDS)</strong> to 
              project these high-dimensional vectors into 3D space while preserving the distances between words based on their cosine similarity.
            </p>
            <p className="text-xs text-muted-foreground/80">
              Model: {modelName} ({pcaInfo.originalDimensions} dimensions)
            </p>
          </div>
        </div>
      </div>

      {/* Variance Explained Chart */}
      <div className="bg-card rounded-lg p-4 border">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="text-primary" size={20} />
          <h4 className="font-semibold text-foreground">Variance Explained by Each Dimension</h4>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          Each dimension captures a different amount of variation in the data. Higher values mean that dimension 
          preserves more information from the original {pcaInfo.originalDimensions}D space.
        </p>

        <div className="space-y-3">
          {pcaInfo.varianceExplained.map((variance, index) => (
            <div key={index}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-foreground">
                  {getDimensionName(index)}
                </span>
                <span className="text-sm font-mono text-muted-foreground">
                  {variance.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getBarColor(index)} transition-all duration-500`}
                  style={{ width: `${variance}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm">
            <TrendingDown className="text-muted-foreground" size={16} />
            <span className="text-muted-foreground">
              Total variance captured: <strong className="text-foreground">
                {pcaInfo.varianceExplained.reduce((sum, v) => sum + v, 0).toFixed(1)}%
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Projection Explanation */}
      <div className="bg-muted/30 p-4 rounded-lg">
        <h4 className="font-semibold text-foreground mb-2">Understanding the 3D Projection</h4>
        <p className="text-sm text-muted-foreground mb-3">
          The {pcaInfo.originalDimensions} dimensions are grouped into 3 principal components:
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">•</span>
            <span>
              <strong className="text-foreground">X-axis (PC1)</strong>: Captures {pcaInfo.varianceExplained[0]?.toFixed(1)}% 
              of the variance - represents the primary direction of variation
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span>
              <strong className="text-foreground">Y-axis (PC2)</strong>: Captures {pcaInfo.varianceExplained[1]?.toFixed(1)}% 
              of the variance - shows secondary patterns
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-secondary font-bold">•</span>
            <span>
              <strong className="text-foreground">Z-axis (PC3)</strong>: Captures {pcaInfo.varianceExplained[2]?.toFixed(1)}% 
              of the variance - reveals additional structure
            </span>
          </li>
        </ul>
      </div>

      {/* Key Insight */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-lg border border-primary/20">
        <p className="text-sm text-foreground">
          <strong>💡 Key Insight:</strong> The distances between words in this 3D visualization accurately reflect 
          their cosine similarity scores from Step 2. Words that are closer together have higher similarity scores, 
          meaning they have similar meanings or are used in similar contexts!
        </p>
      </div>
    </div>
  );
}
