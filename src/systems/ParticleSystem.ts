import type { Camera, Scene } from 'three'
import {
    BufferGeometry,
    Color,
    Float32BufferAttribute,
    NormalBlending,
    Points,
    ShaderMaterial,
    Texture,
    TextureLoader,
    Vector3,
} from 'three'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import particleFragmentShader from '../shaders/particle.frag?raw'
import particleVertexShader from '../shaders/particle.vert?raw'

export type Particle = {
    position: Vector3
    life: number
    maxLife: number
    alpha: number
    color: Color
    size: number
    velocity: Vector3
    currentSize: number
    rotation: number
    rotationSpeed: number
    systemId: string
    frameIndex: number
    acceleration: Vector3
}

export interface ParticleEmissionConfig {
    // Emission settings
    emissionRate: number // particles per second
    burstCount: number // particles per burst
    burstInterval: number // seconds between bursts (-1 for no bursts)
    
    // Particle properties
    life: { min: number; max: number }
    size: { min: number; max: number }
    speed: { min: number; max: number }
    
    // Spawn area
    spawnArea: {
        type: 'box' | 'sphere' | 'point'
        size: Vector3 // for box: width/height/depth, for sphere: radius in x
    }
    
    // Direction
    direction: Vector3
    directionSpread: number // angle in radians
    
    // Physics
    gravity: Vector3
    drag: number
    
    // Visual properties
    startColor: Color
    endColor: Color
    rotation: { min: number; max: number }
    rotationSpeed: { min: number; max: number }
    
    // Texture settings
    texture: string
    spriteSheet?: {
        columns: number
        rows: number
        animationSpeed: number // frames per second
        randomStartFrame: boolean
    }
}

export interface ParticleSystemConfig extends ParticleEmissionConfig {
    id: string
    position: Vector3
    
    // Animation curves for particle properties over lifetime
    sizeOverTime?: Array<{ time: number; value: number }>
    alphaOverTime?: Array<{ time: number; value: number }>
    colorOverTime?: Array<{ time: number; value: Color }>
}

class LinearSpline<T> {
    private points: [number, T][]
    private lerp: (t: number, a: T, b: T) => T

    constructor(lerp: (t: number, a: T, b: T) => T) {
        this.points = []
        this.lerp = lerp
    }

    AddPoint(t: number, d: T) {
        this.points.push([t, d])
    }

    Get(t: number) {
        let p1 = 0

        for (let i = 0; i < this.points.length; i++) {
            if (this.points[i][0] >= t) {
                break
            }
            p1 = i
        }

        const p2 = Math.min(this.points.length - 1, p1 + 1)

        if (p1 === p2) {
            return this.points[p1][1]
        }

        return this.lerp(
            (t - this.points[p1][0]) /
                (this.points[p2][0] - this.points[p1][0]),
            this.points[p1][1],
            this.points[p2][1],
        )
    }

    clear() {
        this.points = []
    }
}

interface ParticleSystemInstance {
    config: ParticleSystemConfig
    particles: Particle[]
    timeToSpawn: number
    timeSinceLastBurst: number
    alphaSpline: LinearSpline<number>
    colorSpline: LinearSpline<Color>
    sizeSpline: LinearSpline<number>
    texture: Texture
    isActive: boolean
    materialGroup: string // Group systems with same texture/sprite settings
}

export class ParticleSystem extends System {
    private textureLoader: TextureLoader
    private materials: Map<string, ShaderMaterial>
    private geometries: Map<string, BufferGeometry>
    private pointsObjects: Map<string, Points>
    private camera: Camera
    private particleSystems: Map<string, ParticleSystemInstance>
    private scene: Scene

    constructor(world: World, scene: Scene, camera: Camera) {
        super(world, ['particle'])

        this.scene = scene
        this.textureLoader = new TextureLoader()
        this.particleSystems = new Map()
        this.materials = new Map()
        this.geometries = new Map()
        this.pointsObjects = new Map()

        this.camera = camera

        // Keep the original keyboard event for testing
        window.addEventListener('keydown', this.onKeyUp.bind(this))

        this.updateGeometry()
    }

    update(deltaTime: number): void {
        for (const system of this.particleSystems.values()) {
            if (system.isActive) {
                this.updateParticleSystem(system, deltaTime)
            }
        }
        this.updateGeometry()
    }

    createParticleSystem(config: ParticleSystemConfig): void {
        // Create material group identifier based on texture and sprite sheet settings
        const spriteKey = config.spriteSheet 
            ? `${config.spriteSheet.columns}x${config.spriteSheet.rows}` 
            : '1x1'
        const materialGroup = `${config.texture}_${spriteKey}`

        const system: ParticleSystemInstance = {
            config,
            particles: [],
            timeToSpawn: 0,
            timeSinceLastBurst: 0,
            alphaSpline: new LinearSpline((t, a, b) => a + t * (b - a)),
            colorSpline: new LinearSpline((t, a, b) => a.clone().lerp(b, t)),
            sizeSpline: new LinearSpline((t, a, b) => a + t * (b - a)),
            texture: this.textureLoader.load(config.texture),
            isActive: true,
            materialGroup: materialGroup,
        }

        // Setup default curves or use custom ones
        this.setupAnimationCurves(system)

        // Create material and geometry for this group if they don't exist
        this.ensureMaterialGroup(materialGroup, system)

        this.particleSystems.set(config.id, system)
    }

    private ensureMaterialGroup(materialGroup: string, referenceSystem: ParticleSystemInstance): void {
        if (!this.materials.has(materialGroup)) {
            const pointMultiplier =
                window.innerHeight /
                (2.0 * Math.tan((0.5 * 60.0 * Math.PI) / 180.0))

            // Create material for this group
            const material = new ShaderMaterial({
                uniforms: {
                    pointMultiplier: { value: pointMultiplier },
                    diffuseTexture: { value: referenceSystem.texture },
                    spriteColumns: { 
                        value: referenceSystem.config.spriteSheet?.columns || 1.0 
                    },
                    spriteRows: { 
                        value: referenceSystem.config.spriteSheet?.rows || 1.0 
                    },
                },
                vertexShader: particleVertexShader,
                fragmentShader: particleFragmentShader,
                blending: NormalBlending,
                depthTest: true,
                depthWrite: false,
                transparent: true,
                vertexColors: true,
            })

            // Create geometry for this group
            const geometry = new BufferGeometry()
            geometry.setAttribute('position', new Float32BufferAttribute([], 3))
            geometry.setAttribute('size', new Float32BufferAttribute([], 1))
            geometry.setAttribute('tintColor', new Float32BufferAttribute([], 4))
            geometry.setAttribute('angle', new Float32BufferAttribute([], 1))
            geometry.setAttribute('frameIndex', new Float32BufferAttribute([], 1))

            // Create points object and add to scene
            const points = new Points(geometry, material)
            this.scene.add(points)

            // Store references
            this.materials.set(materialGroup, material)
            this.geometries.set(materialGroup, geometry)
            this.pointsObjects.set(materialGroup, points)
        }
    }

    private setupAnimationCurves(system: ParticleSystemInstance): void {
        const config = system.config

        // Setup alpha curve
        if (config.alphaOverTime && config.alphaOverTime.length > 0) {
            for (const point of config.alphaOverTime) {
                system.alphaSpline.AddPoint(point.time, point.value)
            }
        } else {
            // Default alpha curve
            system.alphaSpline.AddPoint(0.0, 0.0)
            system.alphaSpline.AddPoint(0.1, 1.0)
            system.alphaSpline.AddPoint(0.6, 1.0)
            system.alphaSpline.AddPoint(1.0, 0.0)
        }

        // Setup color curve
        if (config.colorOverTime && config.colorOverTime.length > 0) {
            for (const point of config.colorOverTime) {
                system.colorSpline.AddPoint(point.time, point.value)
            }
        } else {
            // Default color curve using startColor and endColor
            system.colorSpline.AddPoint(0.0, config.startColor)
            system.colorSpline.AddPoint(1.0, config.endColor)
        }

        // Setup size curve
        if (config.sizeOverTime && config.sizeOverTime.length > 0) {
            for (const point of config.sizeOverTime) {
                system.sizeSpline.AddPoint(point.time, point.value)
            }
        } else {
            // Default size curve
            system.sizeSpline.AddPoint(0.0, 1.0)
            system.sizeSpline.AddPoint(0.5, 2.0)
            system.sizeSpline.AddPoint(1.0, 0.5)
        }
    }

    removeParticleSystem(id: string): void {
        const system = this.particleSystems.get(id)
        if (system) {
            this.particleSystems.delete(id)
            
            // Check if any other systems use the same material group
            const stillInUse = Array.from(this.particleSystems.values())
                .some(s => s.materialGroup === system.materialGroup)
            
            // If no other systems use this material group, clean it up
            if (!stillInUse) {
                const points = this.pointsObjects.get(system.materialGroup)
                if (points) {
                    this.scene.remove(points)
                }
                
                this.materials.delete(system.materialGroup)
                this.geometries.delete(system.materialGroup)
                this.pointsObjects.delete(system.materialGroup)
            }
        }
    }

    activateParticleSystem(id: string): void {
        const system = this.particleSystems.get(id)
        if (system) {
            system.isActive = true
        }
    }

    deactivateParticleSystem(id: string): void {
        const system = this.particleSystems.get(id)
        if (system) {
            system.isActive = false
        }
    }

    burst(systemId: string, count?: number): void {
        const system = this.particleSystems.get(systemId)
        if (system) {
            const burstCount = count ?? system.config.burstCount
            this.addParticles(system, burstCount)
        }
    }

    private updateParticleSystem(system: ParticleSystemInstance, deltaTime: number): void {
        // Handle emission over time
        if (system.config.emissionRate > 0) {
            system.timeToSpawn += deltaTime
            const particlesToSpawn = Math.floor(system.timeToSpawn * system.config.emissionRate)
            system.timeToSpawn -= particlesToSpawn / system.config.emissionRate
            this.addParticles(system, particlesToSpawn)
        }

        // Handle burst emission
        if (system.config.burstInterval > 0) {
            system.timeSinceLastBurst += deltaTime
            if (system.timeSinceLastBurst >= system.config.burstInterval) {
                this.addParticles(system, system.config.burstCount)
                system.timeSinceLastBurst = 0
            }
        }

        // Update existing particles
        this.updateParticles(system, deltaTime)
    }

    private addParticles(system: ParticleSystemInstance, count: number): void {
        const config = system.config

        for (let i = 0; i < count; i++) {
            const life = Math.random() * (config.life.max - config.life.min) + config.life.min
            const size = Math.random() * (config.size.max - config.size.min) + config.size.min
            const speed = Math.random() * (config.speed.max - config.speed.min) + config.speed.min

            // Generate spawn position
            const spawnPos = this.generateSpawnPosition(config)
            spawnPos.add(config.position)

            // Generate velocity direction
            const velocity = this.generateVelocityDirection(config).multiplyScalar(speed)

            // Generate rotation
            const rotation = Math.random() * (config.rotation.max - config.rotation.min) + config.rotation.min
            const rotationSpeed = Math.random() * (config.rotationSpeed.max - config.rotationSpeed.min) + config.rotationSpeed.min

            // Generate frame index for sprite sheets
            let frameIndex = 0
            if (config.spriteSheet && config.spriteSheet.randomStartFrame) {
                frameIndex = Math.floor(Math.random() * (config.spriteSheet.columns * config.spriteSheet.rows))
            }

            const particle: Particle = {
                position: spawnPos,
                size: size,
                currentSize: size,
                color: new Color(),
                alpha: 1.0,
                life: life,
                maxLife: life,
                rotation: rotation,
                rotationSpeed: rotationSpeed,
                velocity: velocity,
                acceleration: config.gravity.clone(),
                systemId: config.id,
                frameIndex: frameIndex,
            }

            system.particles.push(particle)
        }
    }

    private generateSpawnPosition(config: ParticleSystemConfig): Vector3 {
        const pos = new Vector3()

        switch (config.spawnArea.type) {
            case 'point':
                break // pos remains (0,0,0)
            case 'box':
                pos.set(
                    (Math.random() - 0.5) * config.spawnArea.size.x,
                    (Math.random() - 0.5) * config.spawnArea.size.y,
                    (Math.random() - 0.5) * config.spawnArea.size.z
                )
                break
            case 'sphere':
                const radius = config.spawnArea.size.x
                const theta = Math.random() * Math.PI * 2
                const phi = Math.acos(2 * Math.random() - 1)
                const r = radius * Math.cbrt(Math.random())
                pos.set(
                    r * Math.sin(phi) * Math.cos(theta),
                    r * Math.sin(phi) * Math.sin(theta),
                    r * Math.cos(phi)
                )
                break
        }

        return pos
    }

    private generateVelocityDirection(config: ParticleSystemConfig): Vector3 {
        // Start with the base direction
        const direction = config.direction.clone().normalize()

        // Apply spread
        if (config.directionSpread > 0) {
            // Generate random angles within the spread cone
            const theta = Math.random() * Math.PI * 2
            const phi = Math.random() * config.directionSpread

            // Create perpendicular vectors for the cone
            const up = Math.abs(direction.y) < 0.9 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0)
            const right = new Vector3().crossVectors(direction, up).normalize()
            const newUp = new Vector3().crossVectors(right, direction)

            // Apply spread
            const spreadDirection = new Vector3(
                Math.sin(phi) * Math.cos(theta),
                Math.sin(phi) * Math.sin(theta),
                Math.cos(phi)
            )

            // Transform to world space
            const result = new Vector3()
            result.addScaledVector(right, spreadDirection.x)
            result.addScaledVector(newUp, spreadDirection.y)
            result.addScaledVector(direction, spreadDirection.z)

            return result.normalize()
        }

        return direction
    }

    private updateParticles(system: ParticleSystemInstance, deltaTime: number): void {
        const config = system.config

        // Update particle life
        for (const p of system.particles) {
            p.life -= deltaTime
        }

        // Remove dead particles
        system.particles = system.particles.filter((p) => p.life > 0.0)

        // Update living particles
        for (const p of system.particles) {
            const t = 1.0 - p.life / p.maxLife

            // Update rotation
            p.rotation += p.rotationSpeed * deltaTime

            // Update properties using splines
            p.alpha = system.alphaSpline.Get(t)
            p.currentSize = p.size * system.sizeSpline.Get(t)
            p.color.copy(system.colorSpline.Get(t))

            // Update physics
            p.velocity.add(p.acceleration.clone().multiplyScalar(deltaTime))
            p.position.add(p.velocity.clone().multiplyScalar(deltaTime))

            // Apply drag
            if (config.drag > 0) {
                const drag = p.velocity.clone().multiplyScalar(deltaTime * config.drag)
                p.velocity.sub(drag)
            }

            // Update sprite sheet animation
            if (config.spriteSheet && config.spriteSheet.animationSpeed > 0) {
                p.frameIndex += config.spriteSheet.animationSpeed * deltaTime
                const totalFrames = config.spriteSheet.columns * config.spriteSheet.rows
                p.frameIndex = p.frameIndex % totalFrames
            }
        }

        // Note: Particle sorting is now handled in updateGeometry() for better performance
    }

    private updateGeometry(): void {
        // Group systems by material group
        const materialGroups = new Map<string, ParticleSystemInstance[]>()
        
        for (const system of this.particleSystems.values()) {
            if (!system.isActive) continue
            
            if (!materialGroups.has(system.materialGroup)) {
                materialGroups.set(system.materialGroup, [])
            }
            materialGroups.get(system.materialGroup)!.push(system)
        }

        // Update geometry for each material group
        for (const [materialGroup, systems] of materialGroups) {
            const geometry = this.geometries.get(materialGroup)
            if (!geometry) continue

            const positions = []
            const sizes = []
            const colors = []
            const angles = []
            const frameIndices = []

            // Collect all particles from systems in this material group
            const allParticles: Particle[] = []
            for (const system of systems) {
                allParticles.push(...system.particles)
            }

            // Sort particles by distance for proper blending
            allParticles.sort(
                (a, b) =>
                    this.camera.position.distanceTo(b.position) -
                    this.camera.position.distanceTo(a.position)
            )

            // Build attribute arrays
            for (const p of allParticles) {
                positions.push(p.position.x, p.position.y, p.position.z)
                colors.push(p.color.r, p.color.g, p.color.b, p.alpha)
                sizes.push(p.currentSize)
                angles.push(p.rotation)
                frameIndices.push(Math.floor(p.frameIndex))
            }

            // Update geometry attributes
            geometry.setAttribute(
                'position',
                new Float32BufferAttribute(positions, 3),
            )
            geometry.setAttribute('size', new Float32BufferAttribute(sizes, 1))
            geometry.setAttribute(
                'tintColor',
                new Float32BufferAttribute(colors, 4),
            )
            geometry.setAttribute(
                'angle',
                new Float32BufferAttribute(angles, 1),
            )
            geometry.setAttribute(
                'frameIndex',
                new Float32BufferAttribute(frameIndices, 1),
            )

            geometry.attributes.position.needsUpdate = true
            geometry.attributes.size.needsUpdate = true
            geometry.attributes.tintColor.needsUpdate = true
            geometry.attributes.angle.needsUpdate = true
            geometry.attributes.frameIndex.needsUpdate = true
        }

        // Hide geometries that have no particles
        for (const [materialGroup, geometry] of this.geometries) {
            if (!materialGroups.has(materialGroup)) {
                // No active systems for this group, clear the geometry
                geometry.setAttribute('position', new Float32BufferAttribute([], 3))
                geometry.setAttribute('size', new Float32BufferAttribute([], 1))
                geometry.setAttribute('tintColor', new Float32BufferAttribute([], 4))
                geometry.setAttribute('angle', new Float32BufferAttribute([], 1))
                geometry.setAttribute('frameIndex', new Float32BufferAttribute([], 1))
                
                geometry.attributes.position.needsUpdate = true
                geometry.attributes.size.needsUpdate = true
                geometry.attributes.tintColor.needsUpdate = true
                geometry.attributes.angle.needsUpdate = true
                geometry.attributes.frameIndex.needsUpdate = true
            }
        }
    }

    // Legacy method for backwards compatibility and testing
    private onKeyUp(_event: KeyboardEvent): void {
        if (_event.code.toLowerCase() === 'keyv') {
            console.log('Legacy AddParticles')
            // Create a simple test system if none exists
            if (!this.particleSystems.has('test')) {
                this.createParticleSystem({
                    id: 'test',
                    position: new Vector3(0, 0, 0),
                    emissionRate: 5.0,
                    burstCount: 10,
                    burstInterval: -1,
                    life: { min: 1.0, max: 3.0 },
                    size: { min: 2.0, max: 6.0 },
                    speed: { min: 5.0, max: 15.0 },
                    spawnArea: {
                        type: 'box',
                        size: new Vector3(2, 2, 2)
                    },
                    direction: new Vector3(0, 1, 0),
                    directionSpread: Math.PI * 0.25,
                    gravity: new Vector3(0, -15, 0),
                    drag: 0.1,
                    startColor: new Color(0xffff80),
                    endColor: new Color(0xff8080),
                    rotation: { min: 0, max: Math.PI * 2 },
                    rotationSpeed: { min: -2, max: 2 },
                    texture: 'assets/sprites/gunsmoke.png'
                })
            }
            this.burst('test', 5)
        }
    }

    // Utility methods for managing particle systems
    getParticleSystemInfo(id: string): { particleCount: number; isActive: boolean } | null {
        const system = this.particleSystems.get(id)
        if (!system) return null
        
        return {
            particleCount: system.particles.length,
            isActive: system.isActive
        }
    }

    getAllParticleSystemIds(): string[] {
        return Array.from(this.particleSystems.keys())
    }

    getTotalParticleCount(): number {
        let total = 0
        for (const system of this.particleSystems.values()) {
            total += system.particles.length
        }
        return total
    }
}
