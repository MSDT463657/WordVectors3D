import { useRef, useEffect, useState, Component, ErrorInfo, ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, RotateCcw, Undo, Info, Eye, EyeOff } from "lucide-react";
import { type AnalysisResult } from "@shared/schema";

// Error boundary specifically for WebGL/Canvas errors
class CanvasErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.log('Canvas error caught:', error.message);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

interface Visualization3DProps {
  analysisResult: AnalysisResult;
}

function WordPoint({ 
  word, 
  position, 
  color = "#3b82f6" 
}: { 
  word: string; 
  position: [number, number, number]; 
  color?: string; 
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text
        position={[0, 0.3, 0]}
        fontSize={0.2}
        color="black"
        anchorX="center"
        anchorY="middle"
      >
        {word}
      </Text>
    </group>
  );
}

function ConnectionLines({ 
  coordinates, 
  similarities, 
  showConnections 
}: { 
  coordinates: Array<{ word: string; x: number; y: number; z: number }>; 
  similarities: Array<{ word1: string; word2: string; similarity: number }>;
  showConnections: boolean;
}) {
  if (!showConnections) return null;

  return (
    <>
      {similarities.map((sim, index) => {
        const word1Coord = coordinates.find(c => c.word === sim.word1);
        const word2Coord = coordinates.find(c => c.word === sim.word2);
        
        if (!word1Coord || !word2Coord) return null;

        const points = [
          new THREE.Vector3(word1Coord.x, word1Coord.y, word1Coord.z),
          new THREE.Vector3(word2Coord.x, word2Coord.y, word2Coord.z),
        ];
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        const getLineColor = (similarity: number) => {
          if (similarity >= 0.7) return "#06b6d4"; // accent
          if (similarity >= 0.4) return "#3b82f6"; // primary  
          return "#6b7280"; // muted
        };

        const opacity = Math.max(0.3, sim.similarity);

        return (
          <primitive key={index} object={new THREE.Line(geometry, new THREE.LineBasicMaterial({
            color: getLineColor(sim.similarity),
            opacity: opacity,
            transparent: true
          }))} />
        );
      })}
    </>
  );
}

function Scene({ 
  analysisResult, 
  autoRotate, 
  showConnections 
}: { 
  analysisResult: AnalysisResult; 
  autoRotate: boolean;
  showConnections: boolean;
}) {
  const { coordinates } = analysisResult.visualization;
  
  // Scale coordinates for better visualization
  const scaledCoordinates = coordinates.map(coord => ({
    ...coord,
    x: coord.x * 5,
    y: coord.y * 5,
    z: coord.z * 5,
  }));

  return (
    <>
      <OrbitControls 
        enablePan={true} 
        enableZoom={true} 
        enableRotate={true}
        autoRotate={autoRotate}
        autoRotateSpeed={2}
      />
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} />
      
      {/* Axes helpers */}
      <axesHelper args={[3]} />
      
      {/* Word points */}
      {scaledCoordinates.map((coord, index) => (
        <WordPoint
          key={coord.word}
          word={coord.word}
          position={[coord.x, coord.y, coord.z]}
          color={`hsl(${(index * 60) % 360}, 70%, 50%)`}
        />
      ))}
      
      {/* Connection lines */}
      <ConnectionLines 
        coordinates={scaledCoordinates}
        similarities={analysisResult.similarities}
        showConnections={showConnections}
      />
    </>
  );
}

export default function Visualization3D({ analysisResult }: Visualization3DProps) {
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showConnections, setShowConnections] = useState(true);
  const [webglError, setWebglError] = useState(false);
  const [webglReady, setWebglReady] = useState(false);
  const [canvasKey] = useState(0);

  // Test WebGL stability before rendering
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const testWebGL = () => {
      try {
        const testCanvas = document.createElement('canvas');
        const gl = (testCanvas.getContext('webgl', { 
          failIfMajorPerformanceCaveat: false,
          powerPreference: 'low-power'
        }) || testCanvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
        
        if (!gl) {
          setWebglError(true);
          return;
        }

        // Test if context immediately fails
        const contextLostHandler = () => {
          console.log('WebGL context unstable, disabling 3D');
          setWebglError(true);
        };
        
        testCanvas.addEventListener('webglcontextlost', contextLostHandler);
        
        // Wait a bit to see if context is stable
        timeoutId = setTimeout(() => {
          testCanvas.removeEventListener('webglcontextlost', contextLostHandler);
          if (gl && !gl.isContextLost()) {
            console.log('WebGL stable, ready to render');
            setWebglReady(true);
          } else {
            setWebglError(true);
          }
        }, 100);
      } catch (error) {
        console.error('WebGL test failed:', error);
        setWebglError(true);
      }
    };

    testWebGL();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
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
      <div className="relative w-full h-[600px] bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg overflow-hidden">
        {webglError ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 max-w-md">
              <p className="text-muted-foreground mb-4">
                ⚠️ 3D visualization unavailable
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                The 3D graphics engine couldn't start in this environment. This can happen when GPU resources are limited.
              </p>
              <p className="text-xs text-muted-foreground">
                Don't worry - all word analysis and similarity calculations are working perfectly! Only the 3D visualization is affected.
              </p>
            </div>
          </div>
        ) : !webglReady ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <div className="animate-pulse mb-4">
                <div className="h-12 w-12 bg-primary/20 rounded-full mx-auto"></div>
              </div>
              <p className="text-sm text-muted-foreground">
                Initializing 3D visualization...
              </p>
            </div>
          </div>
        ) : (
          <CanvasErrorBoundary onError={() => setWebglError(true)}>
            <div style={{ width: '100%', height: '100%' }}>
              <Canvas 
                key={canvasKey}
                camera={{ position: [5, 5, 5], fov: 60 }}
                gl={{ 
                  powerPreference: "low-power",
                  antialias: false,
                  preserveDrawingBuffer: true,
                  failIfMajorPerformanceCaveat: false
                }}
                onCreated={({ gl }) => {
                  console.log('WebGL context created successfully');
                  
                  // Handle context loss at the canvas level
                  const canvas = gl.domElement;
                  canvas.addEventListener('webglcontextlost', (e) => {
                    e.preventDefault();
                    console.log('WebGL context lost, setting error state');
                    setWebglError(true);
                  }, false);
                }}
                onError={(error) => {
                  console.error('3D Visualization error:', error);
                  setWebglError(true);
                }}
              >
                <Scene 
                  analysisResult={analysisResult} 
                  autoRotate={autoRotate}
                  showConnections={showConnections}
                />
              </Canvas>
            </div>
          </CanvasErrorBoundary>
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
