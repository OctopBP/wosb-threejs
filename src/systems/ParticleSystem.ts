import {
    BufferGeometry,
    Color,
    Float32BufferAttribute,
    Points,
    PointsMaterial,
    type Scene,
    Vector3,
} from 'three'

export interface Particle {
    position: Vector3
    velocity: Vector3
    life: number
    maxLife: number
    size: number
    alpha: number
}

export interface ParticleEmitterConfig {
    position: Vector3
    particleCount: number
    spawnRate: number // particles per second
    life: number
    spread: number
    velocityBase: Vector3
    velocityVariation: Vector3
    size: number
    sizeVariation: number
    color: Color
    gravity: Vector3
}

export class SimpleParticleSystem {
    public particles: Particle[] = []
    private geometry: BufferGeometry
    private material: PointsMaterial
    private points: Points
    private lastSpawnTime: number = 0
    private config: ParticleEmitterConfig
    private positions: Float32Array
    private colors: Float32Array
    private sizes: Float32Array

    constructor(scene: Scene, config: ParticleEmitterConfig) {
        this.config = config

        // Create buffers for max particles
        const maxParticles = config.particleCount
        this.positions = new Float32Array(maxParticles * 3)
        this.colors = new Float32Array(maxParticles * 3)
        this.sizes = new Float32Array(maxParticles)

        // Create geometry and material
        this.geometry = new BufferGeometry()
        this.geometry.setAttribute(
            'position',
            new Float32BufferAttribute(this.positions, 3),
        )
        this.geometry.setAttribute(
            'color',
            new Float32BufferAttribute(this.colors, 3),
        )
        this.geometry.setAttribute(
            'size',
            new Float32BufferAttribute(this.sizes, 1),
        )

        this.material = new PointsMaterial({
            size: config.size,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true,
        })

        this.points = new Points(this.geometry, this.material)
        scene.add(this.points)
    }

    update(deltaTime: number): void {
        const currentTime = performance.now() / 1000

        // Spawn new particles
        if (currentTime - this.lastSpawnTime > 1 / this.config.spawnRate) {
            this.spawnParticle()
            this.lastSpawnTime = currentTime
        }

        // Update existing particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i]

            // Update life
            particle.life -= deltaTime

            if (particle.life <= 0) {
                // Remove dead particle
                this.particles.splice(i, 1)
                continue
            }

            // Update position with velocity and gravity
            particle.velocity.add(
                this.config.gravity.clone().multiplyScalar(deltaTime),
            )
            particle.position.add(
                particle.velocity.clone().multiplyScalar(deltaTime),
            )

            // Update alpha based on life
            particle.alpha = particle.life / particle.maxLife
        }

        // Update geometry buffers
        this.updateBuffers()
    }

    private spawnParticle(): void {
        if (this.particles.length >= this.config.particleCount) {
            return // Don't exceed max particles
        }

        const particle: Particle = {
            position: this.config.position.clone(),
            velocity: new Vector3(
                this.config.velocityBase.x +
                    (Math.random() - 0.5) * this.config.velocityVariation.x,
                this.config.velocityBase.y +
                    (Math.random() - 0.5) * this.config.velocityVariation.y,
                this.config.velocityBase.z +
                    (Math.random() - 0.5) * this.config.velocityVariation.z,
            ),
            life: this.config.life,
            maxLife: this.config.life,
            size:
                this.config.size +
                (Math.random() - 0.5) * this.config.sizeVariation,
            alpha: 1.0,
        }

        // Add some random spread to initial position
        particle.position.add(
            new Vector3(
                (Math.random() - 0.5) * this.config.spread,
                (Math.random() - 0.5) * this.config.spread,
                (Math.random() - 0.5) * this.config.spread,
            ),
        )

        this.particles.push(particle)
    }

    private updateBuffers(): void {
        const particleCount = this.particles.length

        for (let i = 0; i < particleCount; i++) {
            const particle = this.particles[i]
            const i3 = i * 3

            // Update position
            this.positions[i3] = particle.position.x
            this.positions[i3 + 1] = particle.position.y
            this.positions[i3 + 2] = particle.position.z

            // Update color with alpha
            const color = this.config.color.clone()
            color.multiplyScalar(particle.alpha)
            this.colors[i3] = color.r
            this.colors[i3 + 1] = color.g
            this.colors[i3 + 2] = color.b

            // Update size
            this.sizes[i] = particle.size * particle.alpha
        }

        // Clear unused particles
        for (let i = particleCount; i < this.config.particleCount; i++) {
            const i3 = i * 3
            this.positions[i3] = 0
            this.positions[i3 + 1] = 0
            this.positions[i3 + 2] = 0
            this.colors[i3] = 0
            this.colors[i3 + 1] = 0
            this.colors[i3 + 2] = 0
            this.sizes[i] = 0
        }

        // Mark attributes as needing update
        this.geometry.getAttribute('position').needsUpdate = true
        this.geometry.getAttribute('color').needsUpdate = true
        this.geometry.getAttribute('size').needsUpdate = true

        // Update draw range
        this.geometry.setDrawRange(0, particleCount)
    }

    setPosition(position: Vector3): void {
        this.config.position = position
    }

    dispose(): void {
        this.geometry.dispose()
        this.material.dispose()
        this.points.parent?.remove(this.points)
    }

    // Factory method for gun smoke particles
    static createGunSmoke(
        scene: Scene,
        position: Vector3,
    ): SimpleParticleSystem {
        const config: ParticleEmitterConfig = {
            position: position.clone(),
            particleCount: 50,
            spawnRate: 20, // 20 particles per second
            life: 2.0, // 2 seconds
            spread: 0.2,
            velocityBase: new Vector3(0, 1, 0), // Upward movement
            velocityVariation: new Vector3(2, 1, 2), // Some random movement
            size: 0.1,
            sizeVariation: 0.05,
            color: new Color(0.7, 0.7, 0.7), // Gray smoke
            gravity: new Vector3(0, -0.5, 0), // Light downward pull
        }

        return new SimpleParticleSystem(scene, config)
    }
}
