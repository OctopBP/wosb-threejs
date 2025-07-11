import type { Scene } from 'three'
import {
    BoxGeometry,
    Color,
    CylinderGeometry,
    DoubleSide,
    Group,
    Mesh,
    MeshStandardMaterial,
    PlaneGeometry,
    ShaderMaterial,
    SphereGeometry,
    Uniform,
    Vector3,
} from 'three'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

// Vertex shader for animated water with geometry displacement
const waterVertexShader = `
    uniform float uTime;
    uniform float uWaveStrength;
    uniform float uWaveSpeed;
    
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying float vWaveHeight;
    
    // Simple noise function
    float noise(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }
    
    float smoothNoise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        
        float a = noise(i);
        float b = noise(i + vec2(1.0, 0.0));
        float c = noise(i + vec2(0.0, 1.0));
        float d = noise(i + vec2(1.0, 1.0));
        
        vec2 u = f * f * (3.0 - 2.0 * f);
        
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    
    void main() {
        vUv = uv;
        
        vec3 pos = position;
        
        // Create multiple wave layers for more interesting movement
        float wave1 = sin(pos.x * 0.5 + uTime * uWaveSpeed) * 0.3;
        float wave2 = sin(pos.z * 0.3 + uTime * uWaveSpeed * 0.7) * 0.2;
        float wave3 = smoothNoise(vec2(pos.x * 0.1, pos.z * 0.1) + uTime * 0.1) * 0.1;
        
        float waveHeight = (wave1 + wave2 + wave3) * uWaveStrength;
        pos.y += waveHeight;
        
        vWaveHeight = waveHeight;
        
        vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
        vWorldPosition = worldPosition.xyz;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
`

// Fragment shader for cartoon-style water with sparkles and depth-based transparency
const waterFragmentShader = `
    uniform float uTime;
    uniform vec3 uWaterColor;
    uniform vec3 uFoamColor;
    uniform float uOpacity;
    uniform float uSparkleIntensity;
    uniform float uSparkleSize;
    
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying float vWaveHeight;
    
    // Noise function for sparkles
    float noise(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }
    
    void main() {
        // Base water color
        vec3 color = uWaterColor;
        
        // Add animated sparkles
        vec2 sparkleUv = vUv * uSparkleSize + uTime * 0.2;
        float sparkle1 = noise(floor(sparkleUv) + vec2(0.0, 0.0));
        float sparkle2 = noise(floor(sparkleUv + vec2(1.0, 0.0)) + vec2(1.0, 0.0));
        float sparkle3 = noise(floor(sparkleUv + vec2(0.0, 1.0)) + vec2(0.0, 1.0));
        
        float sparkleValue = (sparkle1 + sparkle2 + sparkle3) / 3.0;
        sparkleValue = smoothstep(0.7, 1.0, sparkleValue);
        
        // Animate sparkles
        float sparkleAnim = sin(uTime * 3.0 + sparkleValue * 10.0) * 0.5 + 0.5;
        sparkleValue *= sparkleAnim;
        
        // Mix sparkles with water color
        color = mix(color, uFoamColor, sparkleValue * uSparkleIntensity);
        
        // Add foam on wave peaks
        float foamMask = smoothstep(0.1, 0.3, vWaveHeight);
        color = mix(color, uFoamColor, foamMask * 0.3);
        
        // Calculate depth-based opacity (simulate transparency for underwater objects)
        float depthFactor = 1.0 - abs(vWorldPosition.y) * 0.1;
        depthFactor = clamp(depthFactor, 0.3, 1.0);
        
        gl_FragColor = vec4(color, uOpacity * depthFactor);
    }
`

export class WaterSystem extends System {
    private waterMesh: Mesh
    private islands: Group = new Group()
    private debris: Group = new Group()
    private material: ShaderMaterial
    private scene: Scene

    constructor(world: World, scene: Scene) {
        super(world, []) // No required components since this manages environment objects
        this.scene = scene
        this.material = this.createWaterMaterial()
        this.waterMesh = this.createWaterMesh()
        this.setupIslands()
        this.setupDebris()

        // Add to scene
        this.scene.add(this.waterMesh)
        this.scene.add(this.islands)
        this.scene.add(this.debris)
    }

    private createWaterMaterial(): ShaderMaterial {
        return new ShaderMaterial({
            vertexShader: waterVertexShader,
            fragmentShader: waterFragmentShader,
            uniforms: {
                uTime: new Uniform(0),
                uWaveStrength: new Uniform(0.2),
                uWaveSpeed: new Uniform(1.0),
                uWaterColor: new Uniform(new Vector3(0.2, 0.4, 0.8)), // Blue water
                uFoamColor: new Uniform(new Vector3(1.0, 1.0, 1.0)), // White foam/sparkles
                uOpacity: new Uniform(0.8),
                uSparkleIntensity: new Uniform(0.3),
                uSparkleSize: new Uniform(50.0),
            },
            transparent: true,
            side: DoubleSide,
        })
    }

    private createWaterMesh(): Mesh {
        // Create a detailed plane for better wave animation
        const geometry = new PlaneGeometry(100, 100, 128, 128)
        const mesh = new Mesh(geometry, this.material)
        mesh.rotation.x = -Math.PI / 2 // Rotate to be horizontal
        mesh.position.y = 0
        return mesh
    }

    private setupIslands(): void {
        // Create several primitive islands using boxes and cylinders
        const islandMaterial = new MeshStandardMaterial({
            color: new Color(0.6, 0.4, 0.2), // Brown/sandy color
        })

        // Large island
        const island1Geometry = new BoxGeometry(8, 2, 6)
        const island1 = new Mesh(island1Geometry, islandMaterial)
        island1.position.set(15, 1, 10)
        island1.castShadow = true
        this.islands.add(island1)

        // Cylindrical island
        const island2Geometry = new CylinderGeometry(3, 4, 2, 8)
        const island2 = new Mesh(island2Geometry, islandMaterial)
        island2.position.set(-20, 1, -15)
        island2.castShadow = true
        this.islands.add(island2)

        // Small rocky island
        const island3Geometry = new BoxGeometry(4, 3, 4)
        const island3 = new Mesh(island3Geometry, islandMaterial)
        island3.position.set(25, 1.5, -20)
        island3.rotation.y = Math.PI / 4
        island3.castShadow = true
        this.islands.add(island3)

        // Elongated island
        const island4Geometry = new BoxGeometry(12, 1.5, 3)
        const island4 = new Mesh(island4Geometry, islandMaterial)
        island4.position.set(-10, 0.75, 20)
        island4.castShadow = true
        this.islands.add(island4)
    }

    private setupDebris(): void {
        // Create floating debris using various primitives
        const debrisMaterial = new MeshStandardMaterial({
            color: new Color(0.4, 0.3, 0.2), // Darker brown for debris
        })

        // Floating barrels (cylinders)
        for (let i = 0; i < 8; i++) {
            const barrelGeometry = new CylinderGeometry(0.5, 0.5, 1, 8)
            const barrel = new Mesh(barrelGeometry, debrisMaterial)
            barrel.position.set(
                (Math.random() - 0.5) * 80,
                0.2,
                (Math.random() - 0.5) * 80,
            )
            barrel.rotation.z = (Math.random() - 0.5) * 0.4
            barrel.castShadow = true
            this.debris.add(barrel)
        }

        // Floating boxes/crates
        for (let i = 0; i < 6; i++) {
            const crateGeometry = new BoxGeometry(1, 0.8, 1)
            const crate = new Mesh(crateGeometry, debrisMaterial)
            crate.position.set(
                (Math.random() - 0.5) * 70,
                0.3,
                (Math.random() - 0.5) * 70,
            )
            crate.rotation.y = Math.random() * Math.PI
            crate.rotation.z = (Math.random() - 0.5) * 0.3
            crate.castShadow = true
            this.debris.add(crate)
        }

        // Floating spheres (buoys)
        for (let i = 0; i < 4; i++) {
            const buoyGeometry = new SphereGeometry(0.6, 8, 6)
            const buoyMaterial = new MeshStandardMaterial({
                color: new Color(Math.random(), Math.random(), Math.random()),
            })
            const buoy = new Mesh(buoyGeometry, buoyMaterial)
            buoy.position.set(
                (Math.random() - 0.5) * 60,
                0.2,
                (Math.random() - 0.5) * 60,
            )
            buoy.castShadow = true
            this.debris.add(buoy)
        }
    }

    update(deltaTime: number): void {
        // Update water animation
        this.material.uniforms.uTime.value += deltaTime

        // Animate floating debris with gentle bobbing motion
        const time = this.material.uniforms.uTime.value

        for (let index = 0; index < this.debris.children.length; index++) {
            const child = this.debris.children[index]
            if (child instanceof Mesh) {
                // Create subtle bobbing motion
                const bobOffset = Math.sin(time * 0.8 + index * 0.5) * 0.1
                child.position.y = 0.2 + bobOffset

                // Add gentle rotation
                child.rotation.y += deltaTime * 0.1 * (0.5 + index * 0.1)
            }
        }
    }

    // Method to get water material for external configuration
    getWaterMaterial(): ShaderMaterial {
        return this.material
    }

    // Method to get islands for collision detection or other systems
    getIslands(): Group {
        return this.islands
    }

    // Method to get debris for collision detection or other systems
    getDebris(): Group {
        return this.debris
    }

    cleanup(): void {
        this.dispose()
    }

    dispose(): void {
        // Clean up resources
        this.material.dispose()
        this.waterMesh.geometry.dispose()

        // Remove from scene
        this.scene.remove(this.waterMesh)
        this.scene.remove(this.islands)
        this.scene.remove(this.debris)
    }
}
