import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, Undo, Info, Eye, EyeOff, RotateCcw } from "lucide-react";
import { type AnalysisResult } from "@shared/schema";
import { Vanilla3DScene } from "./vanilla-3d-scene";

interface Visualization3DProps {
  analysisResult: AnalysisResult;
}

export default function Visualization3D({ analysisResult }: Visualization3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Vanilla3DScene | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [initError, setInitError] = useState(false);
  const [showConnections, setShowConnections] = useState(true);

  // Initialize scene
  useEffect(() => {
    if (!containerRef.current || sceneRef.current) return;

    const scene = new Vanilla3DScene(containerRef.current);
    
    scene.init().then((success) => {
      if (success) {
        sceneRef.current = scene;
        setInitialized(true);
        scene.animate();
      } else {
        setInitError(true);
      }
    }).catch(() => {
      setInitError(true);
    });

    return () => {
      if (sceneRef.current) {
        sceneRef.current.dispose();
        sceneRef.current = null;
      }
    };
  }, []);

  // Update scene when data or settings change
  useEffect(() => {
    if (sceneRef.current && initialized) {
      sceneRef.current.updateScene(analysisResult, showConnections);
    }
  }, [analysisResult, showConnections, initialized]);

  // Handle resize
  useEffect(() => {
    if (!sceneRef.current) return;

    const handleResize = () => {
      sceneRef.current?.onResize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Educational explanation */}
      <div className="bg-muted/50 p-4 rounded-lg mb-6">
        <p className="text-sm text-muted-foreground mb-2 flex items-start gap-2">
          <Info className="text-accent mt-0.5" size={16} />
          The {analysisResult.model ? `${analysisResult.visualization.pcaInfo.originalDimensions}-dimensional` : '1536-dimensional'} vectors have been reduced to 3D using PCA (Principal Component Analysis) 
          for visualization. Words closer together in space have more similar meanings.
        </p>
        <div className="flex flex-wrap gap-4 mt-3 text-xs">
          <div className="flex items-center gap-2">
            <span>🖱️ Click & drag to rotate</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🔍 Scroll to zoom</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🔄 Auto-rotates around center</span>
          </div>
        </div>
      </div>

      {/* 3D Canvas Container */}
      <div className="relative w-full h-[600px] bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 rounded-lg overflow-hidden">
        {initError ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <p className="text-muted-foreground mb-4">Unable to load 3D visualization</p>
              <Button onClick={() => window.location.reload()} data-testid="button-reload">
                Reload Page
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div ref={containerRef} className="w-full h-full" data-testid="canvas-3d" />
            
            {!initialized && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center p-8">
                  <div className="animate-pulse mb-4">
                    <div className="h-12 w-12 bg-primary/20 rounded-full mx-auto"></div>
                  </div>
                  <p className="text-sm text-muted-foreground">Initializing 3D engine...</p>
                </div>
              </div>
            )}

          </>
        )}
      </div>

      {/* Controls */}
      <div className="mt-6 space-y-6">
        {/* Visibility Controls */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Display Options</Label>
          <div className="flex gap-3">
            <Button
              variant={showConnections ? "default" : "outline"}
              size="sm"
              onClick={() => setShowConnections(!showConnections)}
              className="flex items-center gap-2"
              data-testid="button-toggle-connections"
            >
              {showConnections ? <Eye size={16} /> : <EyeOff size={16} />}
              {showConnections ? "Hide" : "Show"} Connections
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
