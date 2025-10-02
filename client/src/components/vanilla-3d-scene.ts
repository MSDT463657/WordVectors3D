import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { type AnalysisResult } from '@shared/schema';

export class Vanilla3DScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer | null = null;
  private controls: OrbitControls | null = null;
  private animationId: number | null = null;
  private container: HTMLElement;
  private rotationAngle: number = 0;
  private autoRotateEnabled: boolean = false;
  private axes: THREE.Line[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    // Position camera with Z-axis as main reference (looking down from above)
    this.camera.position.set(0, 0, 15);
  }

  // Create text sprite for word labels
  private createTextSprite(text: string, color: THREE.Color): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 512;
    canvas.height = 256;
    
    context.fillStyle = 'rgb(255, 255, 255)'; // White text
    context.font = 'Bold 96px Arial'; // Bigger font
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, 256, 128);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(4, 2, 1); // Bigger scale
    
    return sprite;
  }

  async init(): Promise<boolean> {
    try {
      // Create renderer with error handling
      this.renderer = new THREE.WebGLRenderer({ 
        antialias: false,
        preserveDrawingBuffer: true,
        powerPreference: 'low-power'
      });
      
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
      this.container.appendChild(this.renderer.domElement);

      // Check if WebGL context is available
      const gl = this.renderer.getContext();
      if (!gl || gl.isContextLost()) {
        throw new Error('WebGL context unavailable');
      }

      // Setup controls
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.autoRotate = false; // We'll do manual Z-axis rotation
      this.controls.autoRotateSpeed = 0.5;

      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      this.scene.add(ambientLight);

      const pointLight = new THREE.PointLight(0xffffff, 1);
      pointLight.position.set(10, 10, 10);
      this.scene.add(pointLight);

      // Add custom axes with correct colors - doubled in length, bisecting at origin
      // X-axis (RED)
      const xAxisGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-6, 0, 0),
        new THREE.Vector3(6, 0, 0)
      ]);
      const xAxisMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 }); // Pure red
      const xAxis = new THREE.Line(xAxisGeometry, xAxisMaterial);
      this.scene.add(xAxis);
      this.axes.push(xAxis);
      
      // Y-axis (GREEN)
      const yAxisGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -6, 0),
        new THREE.Vector3(0, 6, 0)
      ]);
      const yAxisMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 }); // Pure green
      const yAxis = new THREE.Line(yAxisGeometry, yAxisMaterial);
      this.scene.add(yAxis);
      this.axes.push(yAxis);
      
      // Z-axis (BLUE)
      const zAxisGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, -6),
        new THREE.Vector3(0, 0, 6)
      ]);
      const zAxisMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff }); // Pure blue
      const zAxis = new THREE.Line(zAxisGeometry, zAxisMaterial);
      this.scene.add(zAxis);
      this.axes.push(zAxis);

      return true;
    } catch (error) {
      console.error('Failed to initialize 3D scene:', error);
      return false;
    }
  }

  updateScene(analysisResult: AnalysisResult, showConnections: boolean) {
    // Clear existing objects (except lights and axes)
    const objectsToRemove: THREE.Object3D[] = [];
    this.scene.children.forEach(child => {
      // Skip axes - we want to keep them
      if (this.axes.includes(child as THREE.Line)) {
        return;
      }
      if (child.type === 'Mesh' || child.type === 'Line' || child.type === 'Group') {
        objectsToRemove.push(child);
      }
    });
    objectsToRemove.forEach(obj => this.scene.remove(obj));

    const { coordinates } = analysisResult.visualization;
    
    // Calculate bounding box to determine optimal scaling
    const xs = coordinates.map(c => c.x);
    const ys = coordinates.map(c => c.y);
    const zs = coordinates.map(c => c.z);
    
    const maxRange = Math.max(
      Math.max(...xs) - Math.min(...xs),
      Math.max(...ys) - Math.min(...ys),
      Math.max(...zs) - Math.min(...zs)
    );
    
    // Scale to fill a 10-unit cube (ensures good visibility)
    const scale = maxRange > 0 ? 10 / maxRange : 50;
    
    const scaledCoordinates = coordinates.map(coord => ({
      ...coord,
      x: coord.x * scale,
      y: coord.y * scale,
      z: coord.z * scale,
    }));

    // Calculate center of word cluster for camera controls
    const centerX = scaledCoordinates.reduce((sum, c) => sum + c.x, 0) / scaledCoordinates.length;
    const centerY = scaledCoordinates.reduce((sum, c) => sum + c.y, 0) / scaledCoordinates.length;
    const centerZ = scaledCoordinates.reduce((sum, c) => sum + c.z, 0) / scaledCoordinates.length;
    
    // Update controls to look at the center of the word cluster
    if (this.controls) {
      this.controls.target.set(centerX, centerY, centerZ);
      this.controls.update();
    }

    // Add word points with larger, more visible spheres and rotating text labels
    const sphereColors = [0xff0000, 0x00ff00, 0xffff00, 0x00ffff]; // Bright Red, Bright Green, Bright Yellow, Bright Blue (cyan)
    
    // Track word colors for connector blending
    const wordColors = new Map<string, THREE.Color>();
    
    scaledCoordinates.forEach((coord, index) => {
      const geometry = new THREE.SphereGeometry(0.4, 32, 32); // Increased size from 0.15 to 0.4
      const color = new THREE.Color(sphereColors[index % sphereColors.length]);
      wordColors.set(coord.word, color);
      
      const material = new THREE.MeshStandardMaterial({ 
        color,
        emissive: color,
        emissiveIntensity: 0.5,
        metalness: 0.2,
        roughness: 0.4
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(coord.x, coord.y, coord.z);
      
      // Add text label as child of sphere (will rotate with it)
      const textSprite = this.createTextSprite(coord.word, color);
      textSprite.position.set(0, 0.8, 0); // Position above sphere
      sphere.add(textSprite);
      
      this.scene.add(sphere);
    });

    // Add connection lines between all word pairs
    if (showConnections) {
      analysisResult.similarities.forEach((sim) => {
        const word1Coord = scaledCoordinates.find(c => c.word === sim.word1);
        const word2Coord = scaledCoordinates.find(c => c.word === sim.word2);
        
        if (!word1Coord || !word2Coord) return;

        const points = [
          new THREE.Vector3(word1Coord.x, word1Coord.y, word1Coord.z),
          new THREE.Vector3(word2Coord.x, word2Coord.y, word2Coord.z),
        ];
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // Blend the colors of the two connected words
        const color1 = wordColors.get(sim.word1);
        const color2 = wordColors.get(sim.word2);
        const blendedColor = new THREE.Color();
        
        if (color1 && color2) {
          blendedColor.r = (color1.r + color2.r) / 2;
          blendedColor.g = (color1.g + color2.g) / 2;
          blendedColor.b = (color1.b + color2.b) / 2;
        }
        
        // Make lines more visible with higher base opacity
        const material = new THREE.LineBasicMaterial({
          color: blendedColor,
          opacity: Math.max(0.6, sim.similarity * 0.9), // Increased visibility
          transparent: true,
          linewidth: 2 // Note: may not work in all browsers/WebGL implementations
        });
        const line = new THREE.Line(geometry, material);
        this.scene.add(line);
      });
    }
  }

  animate() {
    if (!this.renderer || !this.controls) return;

    const render = () => {
      this.animationId = requestAnimationFrame(render);
      
      // Manual rotation around Z-axis (slower and around vertical axis)
      if (this.autoRotateEnabled && this.controls) {
        this.rotationAngle += 0.003; // Slow rotation speed
        const radius = 15;
        this.camera.position.x = Math.cos(this.rotationAngle) * radius;
        this.camera.position.y = Math.sin(this.rotationAngle) * radius;
        // Keep Z position constant (looking from above)
        this.camera.lookAt(this.controls.target);
      }
      
      if (this.controls) {
        this.controls.update();
      }
      
      if (this.renderer) {
        try {
          this.renderer.render(this.scene, this.camera);
        } catch (error) {
          console.error('Render error:', error);
          this.stop();
        }
      }
    };
    render();
  }

  stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  dispose() {
    this.stop();
    
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
    }
    
    if (this.controls) {
      this.controls.dispose();
    }
  }

  onResize() {
    if (!this.renderer) return;
    
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }
}
