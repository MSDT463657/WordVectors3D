import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, Undo, Info, Eye, EyeOff } from "lucide-react";
import { type AnalysisResult } from "@shared/schema";

interface Visualization3DProps {
  analysisResult: AnalysisResult;
}

export default function Visualization3D({ analysisResult }: Visualization3DProps) {
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showConnections, setShowConnections] = useState(true);
  // Disable 3D by default - user can enable if their environment supports it
  const [webglError, setWebglError] = useState(true);
  const [webglReady, setWebglReady] = useState(false);
  const [canvasKey] = useState(0);
  const [user3DEnabled, setUser3DEnabled] = useState(false);

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
            <span>🔄 Auto-rotates around Z-axis</span>
          </div>
        </div>
      </div>

      {/* 3D Canvas Container */}
      <div className="relative w-full h-[600px] bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg overflow-hidden">
        <div className="w-full h-full p-8 flex items-center justify-center">
          <svg viewBox="-300 -300 600 600" className="w-full h-full max-w-2xl">
            {/* Grid background */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect x="-300" y="-300" width="600" height="600" fill="url(#grid)" />
            
            {/* Axes */}
            <line x1="-300" y1="0" x2="300" y2="0" stroke="#9ca3af" strokeWidth="2" />
            <line x1="0" y1="-300" x2="0" y2="300" stroke="#9ca3af" strokeWidth="2" />
            
            {/* Axis labels */}
            <text x="280" y="-10" fill="#6b7280" fontSize="14" fontFamily="sans-serif">X (PC1)</text>
            <text x="10" y="-280" fill="#6b7280" fontSize="14" fontFamily="sans-serif">Y (PC2)</text>
            
            {/* Connection lines */}
            {showConnections && analysisResult.similarities.map((sim, idx) => {
              const word1 = analysisResult.visualization.coordinates.find(c => c.word === sim.word1);
              const word2 = analysisResult.visualization.coordinates.find(c => c.word === sim.word2);
              if (!word1 || !word2) return null;
              
              const x1 = word1.x * 80;
              const y1 = -word1.y * 80;
              const x2 = word2.x * 80;
              const y2 = -word2.y * 80;
              
              const color = sim.similarity >= 0.7 ? "#06b6d4" : sim.similarity >= 0.4 ? "#3b82f6" : "#9ca3af";
              const opacity = Math.max(0.3, sim.similarity);
              
              return (
                <line
                  key={idx}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={color}
                  strokeWidth="2"
                  opacity={opacity}
                />
              );
            })}
            
            {/* Word points */}
            {analysisResult.visualization.coordinates.map((coord, idx) => {
              const x = coord.x * 80;
              const y = -coord.y * 80;
              const color = `hsl(${(idx * 60) % 360}, 70%, 50%)`;
              
              return (
                <g key={coord.word}>
                  <circle cx={x} cy={y} r="20" fill={color} opacity="0.9" />
                  <text
                    x={x}
                    y={y + 35}
                    textAnchor="middle"
                    fill="#1f2937"
                    fontSize="16"
                    fontWeight="600"
                    fontFamily="sans-serif"
                  >
                    {coord.word}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Control Panel Overlay */}
        <div className="absolute top-4 right-4 bg-card/95 backdrop-blur-lg p-4 rounded-lg shadow-lg border">
          <div className="space-y-4 w-48">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <ZoomIn className="text-primary" size={16} />
                  Zoom
                </Label>
                <span className="text-xs text-muted-foreground" data-testid="zoom-level">
                  {zoomLevel.toFixed(1)}x
                </span>
              </div>
              <Slider
                value={[zoomLevel]}
                onValueChange={([value]) => setZoomLevel(value)}
                min={0.5}
                max={3}
                step={0.1}
                className="w-full"
                data-testid="zoom-slider"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                <RotateCcw className="text-primary" size={16} />
                Auto-rotate
              </Label>
              <Button
                size="sm"
                variant={autoRotate ? "default" : "secondary"}
                onClick={() => setAutoRotate(!autoRotate)}
                data-testid="button-toggle-rotation"
              >
                {autoRotate ? "ON" : "OFF"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                {showConnections ? <Eye className="text-primary" size={16} /> : <EyeOff className="text-primary" size={16} />}
                Connections
              </Label>
              <Button
                size="sm"
                variant={showConnections ? "default" : "secondary"}
                onClick={() => setShowConnections(!showConnections)}
                data-testid="button-toggle-connections"
              >
                {showConnections ? "ON" : "OFF"}
              </Button>
            </div>

            <Button
              size="sm"
              variant="secondary"
              className="w-full"
              onClick={() => {
                setZoomLevel(1.0);
                setAutoRotate(true);
              }}
              data-testid="button-reset-camera"
            >
              <Undo className="mr-2" size={16} />
              Reset View
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-lg p-4 rounded-lg shadow-lg border">
          <h4 className="text-sm font-semibold text-foreground mb-3">Connection Strength</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-1 bg-accent rounded"></div>
              <span className="text-xs text-muted-foreground">High (0.7 - 1.0)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-1 bg-primary rounded"></div>
              <span className="text-xs text-muted-foreground">Medium (0.4 - 0.7)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-1 bg-muted-foreground/50 rounded"></div>
              <span className="text-xs text-muted-foreground">Low (0.0 - 0.4)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Axis Labels Info */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-muted/30 p-3 rounded-lg text-center">
          <div className="text-red-500 font-bold text-lg mb-1">X Axis</div>
          <div className="text-xs text-muted-foreground">First principal component</div>
        </div>
        <div className="bg-muted/30 p-3 rounded-lg text-center">
          <div className="text-green-500 font-bold text-lg mb-1">Y Axis</div>
          <div className="text-xs text-muted-foreground">Second principal component</div>
        </div>
        <div className="bg-muted/30 p-3 rounded-lg text-center">
          <div className="text-blue-500 font-bold text-lg mb-1">Z Axis</div>
          <div className="text-xs text-muted-foreground">Third principal component</div>
        </div>
      </div>
    </>
  );
}
