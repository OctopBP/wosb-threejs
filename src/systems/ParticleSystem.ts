import type { Scene } from 'three'
import {
    AdditiveBlending,
    BufferGeometry,
    Color,
    Float32BufferAttribute,
    type Material,
    Mesh,
    MeshBasicMaterial,
    NormalBlending,
    Points,
    PointsMaterial,
    ShaderMaterial,
    SphereGeometry,
    type Sprite,
    SpriteMaterial,
    Texture,
    TextureLoader,
    Vector3,
} from 'three'
import type {
    ParticleComponent,
    ParticleEmitterComponent,
    ParticleRendererComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

// Vertex shader for particle rendering
const particleVertexShader = `
    attribute float size;
    attribute float alpha;
    attribute vec3 color;
    
    varying float vAlpha;
    varying vec3 vColor;
    
    void main() {
        vAlpha = alpha;
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
    }
`

// Fragment shader for particle rendering
const particleFragmentShader = `
    varying float vAlpha;
    varying vec3 vColor;
    
    void main() {
        gl_FragColor = vec4(vColor, vAlpha);
    }
`

export class ParticleSystem extends System {
    private scene: Scene
    private textureLoader: TextureLoader
    private particleMeshes: Map<number, Points | Sprite> = new Map()
    private particleData: Map<
        number,
        {
            positions: Float32Array
            colors: Float32Array
            sizes: Float32Array
            alphas: Float32Array
            count: number
        }
    > = new Map()

    constructor(world: World, scene: Scene) {
        super(world, ['particle', 'particleEmitter', 'particleRenderer'])
        this.scene = scene
        this.textureLoader = new TextureLoader()
    }

    update(deltaTime: number): void {
        // Update particle emitters
        this.updateEmitters(deltaTime)

        // Update individual particles
        this.updateParticles(deltaTime)

        // Update particle rendering
        this.updateParticleRendering()

        // Clean up dead particles
        this.cleanupDeadParticles()
    }

    private updateEmitters(deltaTime: number): void {
        const emitters = this.world.getEntitiesWithComponent('particleEmitter')

        for (const entity of emitters) {
            const emitter =
                entity.getComponent<ParticleEmitterComponent>('particleEmitter')
            if (!emitter || !emitter.isActive) continue

            const currentTime = performance.now()

            if (emitter.emissionType === 'burst') {
                // Handle burst emission
                if (emitter.burstCount > 0) {
                    this.emitBurst(emitter, emitter.burstCount)
                    emitter.burstCount = 0
                    emitter.isActive = false
                }
            } else if (emitter.emissionType === 'continuous') {
                // Handle continuous emission
                const timeSinceLastEmission =
                    currentTime - emitter.lastEmissionTime
                const particlesToEmit = Math.floor(
                    (timeSinceLastEmission * emitter.emissionRate) / 1000,
                )

                if (particlesToEmit > 0) {
                    // Check if we've reached the maximum particle limit
                    if (
                        emitter.maxParticles &&
                        emitter.totalEmitted >= emitter.maxParticles
                    ) {
                        emitter.isActive = false
                        continue
                    }

                    this.emitBurst(emitter, particlesToEmit)
                    emitter.lastEmissionTime = currentTime
                    emitter.totalEmitted += particlesToEmit
                }
            }
        }
    }

    private emitBurst(emitter: ParticleEmitterComponent, count: number): void {
        for (let i = 0; i < count; i++) {
            this.createParticle(emitter)
        }
    }

    private createParticle(emitter: ParticleEmitterComponent): void {
        const entity = this.world.createEntity()

        // Calculate emission position
        const position = this.calculateEmissionPosition(emitter)

        // Calculate velocity based on direction and spread
        const velocity = this.calculateParticleVelocity(emitter)

        // Calculate random properties
        const age = 0
        const maxAge = this.randomRange(
            emitter.particleConfig.minAge,
            emitter.particleConfig.maxAge,
        )
        const size = this.randomRange(
            emitter.particleConfig.minSize,
            emitter.particleConfig.maxSize,
        )
        const rotationSpeed = this.randomRange(
            emitter.particleConfig.minRotationSpeed,
            emitter.particleConfig.maxRotationSpeed,
        )

        // Create particle component
        const particle: ParticleComponent = {
            type: 'particle',
            age,
            maxAge,
            isDead: false,
            position: { ...position },
            velocity: { ...velocity },
            acceleration: { x: 0, y: 0, z: 0 },
            size,
            initialSize: size,
            finalSize: size * emitter.particleConfig.finalSizeMultiplier,
            color: { ...emitter.particleConfig.color },
            initialColor: { ...emitter.particleConfig.color },
            finalColor: { ...emitter.particleConfig.finalColor },
            rotation: 0,
            rotationSpeed,
            spriteIndex: 0,
            totalSprites:
                emitter.particleConfig.useSpriteSheet &&
                emitter.particleConfig.spriteSheetConfig
                    ? emitter.particleConfig.spriteSheetConfig.totalFrames
                    : 1,
            spriteAnimationSpeed:
                emitter.particleConfig.useSpriteSheet &&
                emitter.particleConfig.spriteSheetConfig
                    ? emitter.particleConfig.spriteSheetConfig.animationSpeed
                    : 0,
            gravity: emitter.particleConfig.gravity,
            drag: emitter.particleConfig.drag,
        }

        // Create renderer component
        const renderer: ParticleRendererComponent = {
            type: 'particleRenderer',
            renderType: emitter.particleConfig.useSpriteSheet
                ? 'spriteSheet'
                : 'sprite',
            shapeType: 'circle',
            blending: 'additive',
            visible: true,
        }

        // Set up sprite sheet if needed
        if (
            emitter.particleConfig.useSpriteSheet &&
            emitter.particleConfig.spriteSheetConfig
        ) {
            renderer.textureUrl =
                emitter.particleConfig.spriteSheetConfig.textureUrl
            this.loadSpriteSheetTexture(
                renderer,
                emitter.particleConfig.spriteSheetConfig,
            )
        }

        entity.addComponent(particle)
        entity.addComponent(renderer)
    }

    private calculateEmissionPosition(emitter: ParticleEmitterComponent): {
        x: number
        y: number
        z: number
    } {
        const basePosition = { ...emitter.position }

        switch (emitter.emissionArea.type) {
            case 'point': {
                return basePosition
            }

            case 'sphere': {
                const radius = emitter.emissionArea.radius || 1
                const sphereRandom = this.randomSpherePoint()
                return {
                    x: basePosition.x + sphereRandom.x * radius,
                    y: basePosition.y + sphereRandom.y * radius,
                    z: basePosition.z + sphereRandom.z * radius,
                }
            }

            case 'box': {
                const width = emitter.emissionArea.width || 1
                const height = emitter.emissionArea.height || 1
                const depth = emitter.emissionArea.depth || 1
                return {
                    x: basePosition.x + (Math.random() - 0.5) * width,
                    y: basePosition.y + (Math.random() - 0.5) * height,
                    z: basePosition.z + (Math.random() - 0.5) * depth,
                }
            }

            case 'circle': {
                const circleRadius = emitter.emissionArea.radius || 1
                const angle = Math.random() * Math.PI * 2
                const distance = Math.random() * circleRadius
                return {
                    x: basePosition.x + Math.cos(angle) * distance,
                    y: basePosition.y,
                    z: basePosition.z + Math.sin(angle) * distance,
                }
            }

            default: {
                return basePosition
            }
        }
    }

    private calculateParticleVelocity(emitter: ParticleEmitterComponent): {
        x: number
        y: number
        z: number
    } {
        const speed = this.randomRange(
            emitter.particleConfig.minSpeed,
            emitter.particleConfig.maxSpeed,
        )
        const direction = emitter.particleConfig.direction
        const spread = emitter.particleConfig.directionSpread

        // Apply random spread to the direction
        const spreadX = (Math.random() - 0.5) * spread
        const spreadY = (Math.random() - 0.5) * spread
        const spreadZ = (Math.random() - 0.5) * spread

        const finalDirection = {
            x: direction.x + spreadX,
            y: direction.y + spreadY,
            z: direction.z + spreadZ,
        }

        // Normalize and apply speed
        const length = Math.sqrt(
            finalDirection.x * finalDirection.x +
                finalDirection.y * finalDirection.y +
                finalDirection.z * finalDirection.z,
        )

        if (length > 0) {
            return {
                x: (finalDirection.x / length) * speed,
                y: (finalDirection.y / length) * speed,
                z: (finalDirection.z / length) * speed,
            }
        }

        return { x: 0, y: 0, z: 0 }
    }

    private updateParticles(deltaTime: number): void {
        const particles = this.world.getEntitiesWithComponent('particle')

        for (const entity of particles) {
            const particle = entity.getComponent<ParticleComponent>('particle')
            if (!particle || particle.isDead) continue

            // Update age
            particle.age += deltaTime
            if (particle.age >= particle.maxAge) {
                particle.isDead = true
                continue
            }

            // Calculate life progress (0 to 1)
            const lifeProgress = particle.age / particle.maxAge

            // Update position
            particle.velocity.x += particle.acceleration.x * deltaTime
            particle.velocity.y += particle.acceleration.y * deltaTime
            particle.velocity.z += particle.acceleration.z * deltaTime

            // Apply gravity
            particle.velocity.y -= particle.gravity * deltaTime

            // Apply drag
            const dragFactor = 1 - particle.drag * deltaTime
            particle.velocity.x *= dragFactor
            particle.velocity.y *= dragFactor
            particle.velocity.z *= dragFactor

            // Update position
            particle.position.x += particle.velocity.x * deltaTime
            particle.position.y += particle.velocity.y * deltaTime
            particle.position.z += particle.velocity.z * deltaTime

            // Update rotation
            particle.rotation += particle.rotationSpeed * deltaTime

            // Update size over lifetime
            if (particle.initialSize !== particle.finalSize) {
                particle.size = this.lerp(
                    particle.initialSize,
                    particle.finalSize,
                    lifeProgress,
                )
            }

            // Update color over lifetime
            if (particle.initialColor !== particle.finalColor) {
                particle.color.r = this.lerp(
                    particle.initialColor.r,
                    particle.finalColor.r,
                    lifeProgress,
                )
                particle.color.g = this.lerp(
                    particle.initialColor.g,
                    particle.finalColor.g,
                    lifeProgress,
                )
                particle.color.b = this.lerp(
                    particle.initialColor.b,
                    particle.finalColor.b,
                    lifeProgress,
                )
                particle.color.a = this.lerp(
                    particle.initialColor.a,
                    particle.finalColor.a,
                    lifeProgress,
                )
            }

            // Update sprite animation
            if (particle.totalSprites > 1) {
                particle.spriteIndex =
                    Math.floor(particle.age * particle.spriteAnimationSpeed) %
                    particle.totalSprites
            }
        }
    }

    private updateParticleRendering(): void {
        const particles = this.world.getEntitiesWithComponent('particle')
        const renderers =
            this.world.getEntitiesWithComponent('particleRenderer')

        // Group particles by render type for efficient rendering
        const particleGroups = new Map<
            string,
            Array<{
                entity: import('../ecs/Entity').Entity
                particle: ParticleComponent
                renderer: ParticleRendererComponent
            }>
        >()

        for (const entity of particles) {
            const particle = entity.getComponent<ParticleComponent>('particle')
            const renderer =
                entity.getComponent<ParticleRendererComponent>(
                    'particleRenderer',
                )

            if (!particle || !renderer || particle.isDead) continue

            const groupKey = `${renderer.renderType}_${renderer.blending}`
            if (!particleGroups.has(groupKey)) {
                particleGroups.set(groupKey, [])
            }
            particleGroups.get(groupKey)?.push({ entity, particle, renderer })
        }

        // Update each group
        for (const [groupKey, group] of particleGroups) {
            this.updateParticleGroup(group, groupKey)
        }
    }

    private updateParticleGroup(
        group: Array<{
            entity: import('../ecs/Entity').Entity
            particle: ParticleComponent
            renderer: ParticleRendererComponent
        }>,
        groupKey: string,
    ): void {
        if (group.length === 0) return

        const firstRenderer = group[0].renderer
        const renderType = firstRenderer.renderType
        const blending = firstRenderer.blending

        // Get or create particle mesh for this group
        let particleMesh = this.particleMeshes.get(group.length)
        let particleData = this.particleData.get(group.length)

        if (
            !particleMesh ||
            !particleData ||
            particleData.count !== group.length
        ) {
            // Create new particle mesh
            particleData = {
                positions: new Float32Array(group.length * 3),
                colors: new Float32Array(group.length * 3),
                sizes: new Float32Array(group.length),
                alphas: new Float32Array(group.length),
                count: group.length,
            }

            const geometry = new BufferGeometry()
            geometry.setAttribute(
                'position',
                new Float32BufferAttribute(particleData.positions, 3),
            )
            geometry.setAttribute(
                'color',
                new Float32BufferAttribute(particleData.colors, 3),
            )
            geometry.setAttribute(
                'size',
                new Float32BufferAttribute(particleData.sizes, 1),
            )
            geometry.setAttribute(
                'alpha',
                new Float32BufferAttribute(particleData.alphas, 1),
            )

            let material: Material

            if (renderType === 'sprite' || renderType === 'spriteSheet') {
                // Use sprite material
                material = new SpriteMaterial({
                    color: 0xffffff,
                    transparent: true,
                    blending:
                        blending === 'additive'
                            ? AdditiveBlending
                            : NormalBlending,
                })
                particleMesh = new Points(geometry, material)
            } else {
                // Use custom shader material for shapes
                material = new ShaderMaterial({
                    vertexShader: particleVertexShader,
                    fragmentShader: particleFragmentShader,
                    transparent: true,
                    blending:
                        blending === 'additive'
                            ? AdditiveBlending
                            : NormalBlending,
                })
                particleMesh = new Points(geometry, material)
            }

            this.particleMeshes.set(group.length, particleMesh)
            this.particleData.set(group.length, particleData)
            this.scene.add(particleMesh)
        }

        // Update particle data
        for (let i = 0; i < group.length; i++) {
            const { particle } = group[i]
            const index = i * 3

            // Position
            if (particleData) {
                particleData.positions[index] = particle.position.x
                particleData.positions[index + 1] = particle.position.y
                particleData.positions[index + 2] = particle.position.z

                // Color
                particleData.colors[index] = particle.color.r
                particleData.colors[index + 1] = particle.color.g
                particleData.colors[index + 2] = particle.color.b

                // Size
                particleData.sizes[i] = particle.size

                // Alpha
                particleData.alphas[i] = particle.color.a
            }
        }

        // Update geometry attributes
        const geometry = particleMesh?.geometry
        if (geometry) {
            geometry.attributes.position.needsUpdate = true
            geometry.attributes.color.needsUpdate = true
            geometry.attributes.size.needsUpdate = true
            geometry.attributes.alpha.needsUpdate = true
        }
    }

    private cleanupDeadParticles(): void {
        const particles = this.world.getEntitiesWithComponent('particle')

        for (const entity of particles) {
            const particle = entity.getComponent<ParticleComponent>('particle')
            if (particle?.isDead) {
                this.world.removeEntity(entity.id)
            }
        }
    }

    private loadSpriteSheetTexture(
        renderer: ParticleRendererComponent,
        config: { textureUrl: string },
    ): void {
        this.textureLoader.load(config.textureUrl, (texture) => {
            renderer.texture = texture
            // Set up sprite sheet UV coordinates here if needed
        })
    }

    // Utility methods
    private randomRange(min: number, max: number): number {
        return Math.random() * (max - min) + min
    }

    private randomSpherePoint(): { x: number; y: number; z: number } {
        const u = Math.random()
        const v = Math.random()
        const theta = 2 * Math.PI * u
        const phi = Math.acos(2 * v - 1)
        const r = Math.cbrt(Math.random())

        return {
            x: r * Math.sin(phi) * Math.cos(theta),
            y: r * Math.sin(phi) * Math.sin(theta),
            z: r * Math.cos(phi),
        }
    }

    private lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t
    }

    // Public methods for creating particle effects
    public createExplosion(
        position: { x: number; y: number; z: number },
        config: Partial<ParticleEmitterComponent['particleConfig']> = {},
    ): void {
        const entity = this.world.createEntity()

        const emitter: ParticleEmitterComponent = {
            type: 'particleEmitter',
            emissionType: 'burst',
            burstCount: 50,
            emissionRate: 0,
            lastEmissionTime: 0,
            position,
            emissionArea: {
                type: 'sphere',
                radius: 0.5,
            },
            particleConfig: {
                minAge: 0.5,
                maxAge: 2.0,
                minSize: 0.1,
                maxSize: 0.3,
                sizeOverLifetime: true,
                finalSizeMultiplier: 0.1,
                color: { r: 1, g: 0.5, b: 0, a: 1 },
                colorOverLifetime: true,
                finalColor: { r: 0.5, g: 0, b: 0, a: 0 },
                minSpeed: 2,
                maxSpeed: 5,
                direction: { x: 0, y: 1, z: 0 },
                directionSpread: Math.PI * 2,
                gravity: 2,
                drag: 0.1,
                minRotationSpeed: -2,
                maxRotationSpeed: 2,
                useSpriteSheet: false,
                ...config,
            },
            isActive: true,
            totalEmitted: 0,
        }

        entity.addComponent(emitter)
    }

    public createFireEffect(
        position: { x: number; y: number; z: number },
        config: Partial<ParticleEmitterComponent['particleConfig']> = {},
    ): void {
        const entity = this.world.createEntity()

        const emitter: ParticleEmitterComponent = {
            type: 'particleEmitter',
            emissionType: 'continuous',
            burstCount: 0,
            emissionRate: 30,
            lastEmissionTime: performance.now(),
            position,
            emissionArea: {
                type: 'circle',
                radius: 0.2,
            },
            particleConfig: {
                minAge: 1.0,
                maxAge: 2.5,
                minSize: 0.05,
                maxSize: 0.15,
                sizeOverLifetime: true,
                finalSizeMultiplier: 0.5,
                color: { r: 1, g: 0.3, b: 0, a: 1 },
                colorOverLifetime: true,
                finalColor: { r: 0.5, g: 0, b: 0, a: 0 },
                minSpeed: 0.5,
                maxSpeed: 1.5,
                direction: { x: 0, y: 1, z: 0 },
                directionSpread: 0.3,
                gravity: -0.5,
                drag: 0.05,
                minRotationSpeed: -1,
                maxRotationSpeed: 1,
                useSpriteSheet: false,
                ...config,
            },
            isActive: true,
            totalEmitted: 0,
        }

        entity.addComponent(emitter)
    }

    public createSparkleEffect(
        position: { x: number; y: number; z: number },
        config: Partial<ParticleEmitterComponent['particleConfig']> = {},
    ): void {
        const entity = this.world.createEntity()

        const emitter: ParticleEmitterComponent = {
            type: 'particleEmitter',
            emissionType: 'burst',
            burstCount: 20,
            emissionRate: 0,
            lastEmissionTime: 0,
            position,
            emissionArea: {
                type: 'sphere',
                radius: 0.1,
            },
            particleConfig: {
                minAge: 0.8,
                maxAge: 1.5,
                minSize: 0.02,
                maxSize: 0.05,
                sizeOverLifetime: true,
                finalSizeMultiplier: 0.1,
                color: { r: 1, g: 1, b: 1, a: 1 },
                colorOverLifetime: true,
                finalColor: { r: 1, g: 1, b: 0, a: 0 },
                minSpeed: 1,
                maxSpeed: 3,
                direction: { x: 0, y: 0, z: 0 },
                directionSpread: Math.PI * 2,
                gravity: 0,
                drag: 0.02,
                minRotationSpeed: -5,
                maxRotationSpeed: 5,
                useSpriteSheet: false,
                ...config,
            },
            isActive: true,
            totalEmitted: 0,
        }

        entity.addComponent(emitter)
    }
}
