import type { Camera, Scene, Texture } from 'three'
import {
    BufferGeometry,
    Color,
    Float32BufferAttribute,
    NormalBlending,
    Points,
    ShaderMaterial,
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

type ValueOrRange = number | { min: number; max: number }

function getValueFromValueOrRange(value: ValueOrRange): number {
    if (typeof value === 'number') {
        return value
    }
    return Math.random() * (value.max - value.min) + value.min
}

export interface ParticleEmissionConfig {
    // Emission settings
    emissionRate: number // particles per second
    burstCount: number // particles per burst
    burstInterval: number // seconds between bursts (-1 for no bursts)

    // Particle properties
    life: ValueOrRange
    size: ValueOrRange
    speed: ValueOrRange

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
    rotation: ValueOrRange
    rotationSpeed: ValueOrRange

    // Texture settings
    texture: string
    spriteSheet?: {
        columns: number
        rows: number
        frameDuration: number
        randomStartFrame: boolean
    }
}

export interface ParticleSystemConfig extends ParticleEmissionConfig {
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
    id: string
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
    autoRemove: boolean // Whether to automatically remove when lifetime is finished
    particlePool: Particle[]
}

// Reusable typed buffers per material group to avoid per-frame allocations
type MaterialGroupBuffers = {
    capacity: number
    count: number
    positions: Float32Array
    sizes: Float32Array
    colors: Float32Array
    angles: Float32Array
    frameIndices: Float32Array
    lastSortedFrame: number
}

export class ParticleSystem extends System {
    private textureLoader: TextureLoader
    private materials: Map<string, ShaderMaterial>
    private geometries: Map<string, BufferGeometry>
    private pointsObjects: Map<string, Points>
    private camera: Camera
    private particleSystems: Map<string, ParticleSystemInstance>
    private scene: Scene
    private groupBuffers: Map<string, MaterialGroupBuffers>
    private frameCounter: number
    private sortIntervalFrames: number

    constructor(world: World, scene: Scene, camera: Camera) {
        super(world, ['particle'])

        this.scene = scene
        this.textureLoader = new TextureLoader()
        this.particleSystems = new Map()
        this.materials = new Map()
        this.geometries = new Map()
        this.pointsObjects = new Map()
        this.groupBuffers = new Map()

        this.camera = camera

        // Frame counters for occasional particle sorting
        this.frameCounter = 0
        this.sortIntervalFrames = 2

        this.updateGeometry()
    }

    update(deltaTime: number): void {
        const systemsToRemove: string[] = []

        for (const system of this.particleSystems.values()) {
            if (system.isActive) {
                this.updateParticleSystem(system, deltaTime)

                // Check if system should be automatically removed
                if (system.autoRemove && this.shouldRemoveSystem(system)) {
                    systemsToRemove.push(system.id)
                }
            }
        }

        // Remove systems that have finished their lifetime
        for (const systemId of systemsToRemove) {
            this.removeParticleSystem(systemId)
        }

        this.updateGeometry()
        this.frameCounter++
    }

    createAndBurstParticleSystem(
        id: string,
        config: ParticleSystemConfig,
    ): void {
        this.createParticleSystem(id, config)
        this.burst(id)
    }

    createParticleSystem(id: string, config: ParticleSystemConfig): void {
        // Create material group identifier based on texture and sprite sheet settings
        const spriteKey = config.spriteSheet
            ? `${config.spriteSheet.columns}x${config.spriteSheet.rows}`
            : '1x1'
        const materialGroup = `${config.texture}_${spriteKey}`

        const system: ParticleSystemInstance = {
            id,
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
            autoRemove: true, // Default to auto-remove
            particlePool: [],
        }

        // Setup default curves or use custom ones
        this.setupAnimationCurves(system)

        // Create material and geometry for this group if they don't exist
        this.ensureMaterialGroup(materialGroup, system)

        this.particleSystems.set(id, system)
    }

    private ensureMaterialGroup(
        materialGroup: string,
        referenceSystem: ParticleSystemInstance,
    ): void {
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
                        value:
                            referenceSystem.config.spriteSheet?.columns || 1.0,
                    },
                    spriteRows: {
                        value: referenceSystem.config.spriteSheet?.rows || 1.0,
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

            // Create geometry for this group with initial capacity
            const geometry = new BufferGeometry()
            const initialCapacity = 256
            geometry.setAttribute(
                'position',
                new Float32BufferAttribute(
                    new Float32Array(initialCapacity * 3),
                    3,
                ),
            )
            geometry.setAttribute(
                'size',
                new Float32BufferAttribute(
                    new Float32Array(initialCapacity),
                    1,
                ),
            )
            geometry.setAttribute(
                'tintColor',
                new Float32BufferAttribute(
                    new Float32Array(initialCapacity * 4),
                    4,
                ),
            )
            geometry.setAttribute(
                'angle',
                new Float32BufferAttribute(
                    new Float32Array(initialCapacity),
                    1,
                ),
            )
            geometry.setAttribute(
                'frameIndex',
                new Float32BufferAttribute(
                    new Float32Array(initialCapacity),
                    1,
                ),
            )
            geometry.setDrawRange(0, 0)

            // Create points object and add to scene
            const points = new Points(geometry, material)
            points.renderOrder = 2
            this.scene.add(points)

            // Store references
            this.materials.set(materialGroup, material)
            this.geometries.set(materialGroup, geometry)
            this.pointsObjects.set(materialGroup, points)

            this.groupBuffers.set(materialGroup, {
                capacity: initialCapacity,
                count: 0,
                positions: geometry.getAttribute('position')
                    .array as Float32Array,
                sizes: geometry.getAttribute('size').array as Float32Array,
                colors: geometry.getAttribute('tintColor')
                    .array as Float32Array,
                angles: geometry.getAttribute('angle').array as Float32Array,
                frameIndices: geometry.getAttribute('frameIndex')
                    .array as Float32Array,
                lastSortedFrame: -1,
            })
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
            system.alphaSpline.AddPoint(0.0, 1)
            system.alphaSpline.AddPoint(1.0, 1)
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
            system.sizeSpline.AddPoint(1.0, 1.0)
        }
    }

    removeParticleSystem(id: string): void {
        const system = this.particleSystems.get(id)
        if (system) {
            this.particleSystems.delete(id)

            // Check if any other systems use the same material group
            const stillInUse = Array.from(this.particleSystems.values()).some(
                (s) => s.materialGroup === system.materialGroup,
            )

            // If no other systems use this material group, clean it up
            if (!stillInUse) {
                const points = this.pointsObjects.get(system.materialGroup)
                if (points) {
                    this.scene.remove(points)
                }

                this.materials.delete(system.materialGroup)
                this.geometries.delete(system.materialGroup)
                this.pointsObjects.delete(system.materialGroup)
                this.groupBuffers.delete(system.materialGroup)
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

    setAutoRemove(id: string, autoRemove: boolean): void {
        const system = this.particleSystems.get(id)
        if (system) {
            system.autoRemove = autoRemove
        }
    }

    burst(systemId: string, count?: number): void {
        const system = this.particleSystems.get(systemId)
        if (system) {
            const burstCount = count ?? system.config.burstCount
            this.addParticles(system, burstCount)
        }
    }

    private updateParticleSystem(
        system: ParticleSystemInstance,
        deltaTime: number,
    ): void {
        // Handle emission over time
        if (system.config.emissionRate > 0) {
            system.timeToSpawn += deltaTime
            const particlesToSpawn = Math.floor(
                system.timeToSpawn * system.config.emissionRate,
            )
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
            const life = getValueFromValueOrRange(config.life)
            const size = getValueFromValueOrRange(config.size)
            const speed = getValueFromValueOrRange(config.speed)

            // Generate spawn position
            const spawnPos = this.generateSpawnPosition(config)
            spawnPos.add(config.position)

            // Generate velocity direction
            const velocity =
                this.generateVelocityDirection(config).multiplyScalar(speed)

            // Generate rotation
            const rotation = getValueFromValueOrRange(config.rotation)
            const rotationSpeed = getValueFromValueOrRange(config.rotationSpeed)

            // Generate frame index for sprite sheets
            let frameIndex = 0
            if (config.spriteSheet?.randomStartFrame) {
                frameIndex = Math.floor(
                    Math.random() *
                        (config.spriteSheet.columns * config.spriteSheet.rows),
                )
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
                systemId: system.id,
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
                    (Math.random() - 0.5) * config.spawnArea.size.z,
                )
                break
            case 'sphere': {
                const radius = config.spawnArea.size.x
                const theta = Math.random() * Math.PI * 2
                const phi = Math.acos(2 * Math.random() - 1)
                const r = radius * Math.cbrt(Math.random())
                pos.set(
                    r * Math.sin(phi) * Math.cos(theta),
                    r * Math.sin(phi) * Math.sin(theta),
                    r * Math.cos(phi),
                )
                break
            }
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
            const up =
                Math.abs(direction.y) < 0.9
                    ? new Vector3(0, 1, 0)
                    : new Vector3(1, 0, 0)
            const right = new Vector3().crossVectors(direction, up).normalize()
            const newUp = new Vector3().crossVectors(right, direction)

            // Apply spread
            const spreadDirection = new Vector3(
                Math.sin(phi) * Math.cos(theta),
                Math.sin(phi) * Math.sin(theta),
                Math.cos(phi),
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

    private updateParticles(
        system: ParticleSystemInstance,
        deltaTime: number,
    ): void {
        const config = system.config

        // Update life and compact in-place to avoid array churn
        let writeIndex = 0
        for (
            let readIndex = 0;
            readIndex < system.particles.length;
            readIndex++
        ) {
            const p = system.particles[readIndex]
            p.life -= deltaTime
            if (p.life <= 0) {
                // Return to pool for reuse
                system.particlePool.push(p)
                continue
            }

            const t = 1.0 - p.life / p.maxLife

            // Update rotation
            p.rotation += p.rotationSpeed * deltaTime

            // Update properties using splines
            p.alpha = system.alphaSpline.Get(t)
            p.currentSize = p.size * system.sizeSpline.Get(t)
            p.color.copy(system.colorSpline.Get(t))

            // Update physics without creating temporaries
            p.velocity.addScaledVector(p.acceleration, deltaTime)
            p.position.addScaledVector(p.velocity, deltaTime)

            // Apply drag via scalar multiplication
            if (config.drag > 0) {
                const dragFactor = Math.max(0, 1 - deltaTime * config.drag)
                p.velocity.multiplyScalar(dragFactor)
            }

            // Update sprite sheet animation
            if (config.spriteSheet && config.spriteSheet.frameDuration > 0) {
                const totalFrames =
                    config.spriteSheet.columns * config.spriteSheet.rows
                p.frameIndex =
                    Math.floor(
                        (p.maxLife - p.life) / config.spriteSheet.frameDuration,
                    ) % totalFrames
            }

            if (writeIndex !== readIndex) {
                system.particles[writeIndex] = p
            }
            writeIndex++
        }
        if (writeIndex < system.particles.length) {
            system.particles.length = writeIndex
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
            materialGroups.get(system.materialGroup)?.push(system)
        }

        // Update geometry for each material group using reusable typed buffers
        for (const [materialGroup, systems] of materialGroups) {
            const geometry = this.geometries.get(materialGroup)
            const buffers = this.groupBuffers.get(materialGroup)
            if (!geometry || !buffers) continue

            // Count particles
            let particleCount = 0
            for (const system of systems) {
                particleCount += system.particles.length
            }

            // Grow buffers if needed
            if (particleCount > buffers.capacity) {
                let newCapacity = buffers.capacity
                while (newCapacity < particleCount) newCapacity *= 2

                buffers.capacity = newCapacity
                buffers.positions = new Float32Array(newCapacity * 3)
                buffers.sizes = new Float32Array(newCapacity)
                buffers.colors = new Float32Array(newCapacity * 4)
                buffers.angles = new Float32Array(newCapacity)
                buffers.frameIndices = new Float32Array(newCapacity)

                geometry.setAttribute(
                    'position',
                    new Float32BufferAttribute(buffers.positions, 3),
                )
                geometry.setAttribute(
                    'size',
                    new Float32BufferAttribute(buffers.sizes, 1),
                )
                geometry.setAttribute(
                    'tintColor',
                    new Float32BufferAttribute(buffers.colors, 4),
                )
                geometry.setAttribute(
                    'angle',
                    new Float32BufferAttribute(buffers.angles, 1),
                )
                geometry.setAttribute(
                    'frameIndex',
                    new Float32BufferAttribute(buffers.frameIndices, 1),
                )
            }

            // Collect particles and optionally sort
            const allParticles: Particle[] = []
            for (const system of systems) {
                const arr = system.particles
                for (let i = 0; i < arr.length; i++) allParticles.push(arr[i])
            }

            const shouldSort =
                this.frameCounter - buffers.lastSortedFrame >=
                this.sortIntervalFrames
            if (shouldSort && allParticles.length > 1) {
                allParticles.sort(
                    (a, b) =>
                        this.camera.position.distanceToSquared(b.position) -
                        this.camera.position.distanceToSquared(a.position),
                )
                buffers.lastSortedFrame = this.frameCounter
            }

            // Fill typed arrays
            let i = 0
            let i3 = 0
            let i4 = 0
            for (const p of allParticles) {
                buffers.positions[i3 + 0] = p.position.x
                buffers.positions[i3 + 1] = p.position.y
                buffers.positions[i3 + 2] = p.position.z
                buffers.colors[i4 + 0] = p.color.r
                buffers.colors[i4 + 1] = p.color.g
                buffers.colors[i4 + 2] = p.color.b
                buffers.colors[i4 + 3] = p.alpha
                buffers.sizes[i] = p.currentSize
                buffers.angles[i] = p.rotation
                buffers.frameIndices[i] = Math.floor(p.frameIndex)
                i++
                i3 += 3
                i4 += 4
            }
            buffers.count = allParticles.length

            // Mark updates and set draw range
            geometry.attributes.position.needsUpdate = true
            geometry.attributes.size.needsUpdate = true
            geometry.attributes.tintColor.needsUpdate = true
            geometry.attributes.angle.needsUpdate = true
            geometry.attributes.frameIndex.needsUpdate = true
            geometry.setDrawRange(0, buffers.count)
        }

        // Hide geometries that have no particles by using draw range
        for (const [materialGroup, geometry] of this.geometries) {
            if (!materialGroups.has(materialGroup)) {
                geometry.setDrawRange(0, 0)
                const buffers = this.groupBuffers.get(materialGroup)
                if (buffers) buffers.count = 0
            }
        }
    }

    // Utility methods for managing particle systems
    getParticleSystemInfo(id: string): {
        particleCount: number
        isActive: boolean
        autoRemove: boolean
    } | null {
        const system = this.particleSystems.get(id)
        if (!system) return null

        return {
            particleCount: system.particles.length,
            isActive: system.isActive,
            autoRemove: system.autoRemove,
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

    /**
     * Determines if a particle system should be automatically removed.
     * A system is removed when:
     * 1. It has no particles remaining AND
     * 2. It's not actively emitting particles (no continuous emission or burst cycles)
     */
    private shouldRemoveSystem(system: ParticleSystemInstance): boolean {
        // Don't remove if there are still particles alive
        if (system.particles.length > 0) {
            return false
        }

        // Don't remove if system has continuous emission
        if (system.config.emissionRate > 0) {
            return false
        }

        // Don't remove if system has burst cycles (recurring bursts)
        if (system.config.burstInterval > 0) {
            return false
        }

        // System has no particles and no active emission - safe to remove
        return true
    }
}
