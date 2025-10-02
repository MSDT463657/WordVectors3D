import { useState, Suspense, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, Undo, Info, Eye, EyeOff, RotateCcw } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { type AnalysisResult } from "@shared/schema";
import * as THREE from "three";

interface Visualization3DProps {
  analysisResult: AnalysisResult;
}

// 3D Scene component
function Scene({ analysisResult, showConnections }: { analysisResult: AnalysisResult; showConnections: boolean }) {
  const { coordinates } = analysisResult.visualization;
  
  const scaledCoordinates = coordinates.map(coord => ({
    ...coord,
    x: coord.x * 5,
    y: coord.y * 5,
    z: coord.z * 5,
  }));

  return (
    <>
      <OrbitControls enablePan enableZoom enableRotate autoRotate autoRotateSpeed={2} />
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} />
      <axesHelper args={[3]} />
      
      {scaledCoordinates.map((coord, index) => (
        <group key={coord.word} position={[coord.x, coord.y, coord.z]}>
          <mesh>
            <sphereGeometry args={[0.15, 32, 32]} />
            <meshStandardMaterial color={`hsl(${(index * 60) % 360}, 70%, 50%)`} />
          </mesh>
          <sprite position={[0, 0.4, 0]} scale={[1, 0.3, 1]}>
            <spriteMaterial color="white" />
          </sprite>
        </group>
      ))}
      
      {showConnections && analysisResult.similarities.map((sim, index) => {
        const word1Coord = scaledCoordinates.find(c => c.word === sim.word1);
        const word2Coord = scaledCoordinates.find(c => c.word === sim.word2);
        
        if (!word1Coord || !word2Coord) return null;

        const points = [
          new THREE.Vector3(word1Coord.x, word1Coord.y, word1Coord.z),
          new THREE.Vector3(word2Coord.x, word2Coord.y, word2Coord.z),
        ];
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const color = sim.similarity >= 0.7 ? "#06b6d4" : sim.similarity >= 0.4 ? "#3b82f6" : "#6b7280";
        
        return (
          <primitive
            key={index}
            object={new THREE.Line(
              geometry,
              new THREE.LineBasicMaterial({
                color,
                opacity: Math.max(0.3, sim.similarity),
                transparent: true
              })
            )}
          />
        );
      })}
    </>
  );
}

export default function Visualization3D({ analysisResult }: Visualization3DProps) {
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showConnections, setShowConnections] = useState(true);
  const [renderError, setRenderError] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  
  // Delay Canvas mounting to next tick to avoid synchronous errors
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanvasReady(true);
    }, 100);
    return () => clearTimeout(timer);
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
            <span>🔄 Auto-rotates around Z-axis</span>
          </div>
        </div>
      </div>

      {/* 3D Canvas Container */}
      <div className="relative w-full h-[600px] bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 rounded-lg overflow-hidden">
        {renderError ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <p className="text-muted-foreground mb-4">Unable to load 3D visualization</p>
              <Button onClick={() => window.location.reload()} data-testid="button-reload">
                Reload Page
              </Button>
            </div>
          </div>
        ) : !canvasReady ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <div className="animate-pulse mb-4">
                <div className="h-12 w-12 bg-primary/20 rounded-full mx-auto"></div>
              </div>
              <p className="text-sm text-muted-foreground">Initializing 3D engine...</p>
            </div>
          </div>
        ) : (
          <>
            <Canvas
              camera={{ position: [5, 5, 5], fov: 60 }}
              onError={() => setRenderError(true)}
              gl={{ preserveDrawingBuffer: true }}
              frameloop="demand"
            >
              <Suspense fallback={null}>
                <Scene analysisResult={analysisResult} showConnections={showConnections} />
              </Suspense>
            </Canvas>
            
            {/* Word labels overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {analysisResult.visualization.coordinates.map((coord, idx) => {
                const x = 50 + (coord.x * 8);
                const y = 50 - (coord.y * 8);
                
                return (
                  <div
                    key={coord.word}
                    className="absolute text-foreground font-semibold text-sm bg-background/80 px-2 py-1 rounded"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    {coord.word}
                  </div>
                );
              })}
            </div>
          </>
        )}

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
