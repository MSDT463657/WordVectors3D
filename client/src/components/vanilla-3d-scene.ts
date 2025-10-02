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

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(5, 5, 5);
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
      this.controls.autoRotate = true;
      this.controls.autoRotateSpeed = 2;

      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      this.scene.add(ambientLight);

      const pointLight = new THREE.PointLight(0xffffff, 1);
      pointLight.position.set(10, 10, 10);
      this.scene.add(pointLight);

      // Add axes helper
      const axesHelper = new THREE.AxesHelper(3);
      this.scene.add(axesHelper);

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
      if (child.type === 'Mesh' || child.type === 'Line' || child.type === 'Group') {
        objectsToRemove.push(child);
      }
    });
    objectsToRemove.forEach(obj => this.scene.remove(obj));

    const { coordinates } = analysisResult.visualization;
    
    // Scale coordinates
    const scaledCoordinates = coordinates.map(coord => ({
      ...coord,
      x: coord.x * 5,
      y: coord.y * 5,
      z: coord.z * 5,
    }));

    // Add word points
    scaledCoordinates.forEach((coord, index) => {
      const geometry = new THREE.SphereGeometry(0.15, 32, 32);
      const color = new THREE.Color(`hsl(${(index * 60) % 360}, 70%, 50%)`);
      const material = new THREE.MeshStandardMaterial({ color });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(coord.x, coord.y, coord.z);
      this.scene.add(sphere);
    });

    // Add connection lines
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
        const colorValue = sim.similarity >= 0.7 ? 0x06b6d4 : sim.similarity >= 0.4 ? 0x3b82f6 : 0x6b7280;
        const material = new THREE.LineBasicMaterial({
          color: colorValue,
          opacity: Math.max(0.3, sim.similarity),
          transparent: true
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
