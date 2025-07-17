import type { Material, Object3D, Scene, Texture } from 'three'
import {
    AdditiveBlending,
    type BufferAttribute,
    type BufferGeometry,
    CircleGeometry,
    Color,
    Mesh,
    MeshBasicMaterial,
    NormalBlending,
    PlaneGeometry,
    Points,
    PointsMaterial,
    RingGeometry,
    TextureLoader,
} from 'three'
import type {
    ParticleEmitterComponent,
    ParticleInstance,
    PositionComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class ParticleSystem extends System {
    private scene: Scene
    private textureLoader: TextureLoader
    private textureCache: Map<string, Texture>
    private particleIdCounter: number = 0

    constructor(world: World, scene: Scene) {
        super(world, ['particleEmitter', 'position'])
        this.scene = scene
        this.textureLoader = new TextureLoader()
        this.textureCache = new Map()
    }

    update(deltaTime: number): void {
        const entities = this.getEntities()

        for (const entity of entities) {
            const emitter =
                entity.getComponent<ParticleEmitterComponent>('particleEmitter')
            const position = entity.getComponent<PositionComponent>('position')

            if (!emitter || !position) continue

            if (!emitter.isActive) {
                this.cleanupDeadParticles(emitter)
                continue
            }

            // Update emitter timing
            emitter.elapsedTime += deltaTime

            // Check if emission should stop
            if (
                emitter.duration > 0 &&
                emitter.elapsedTime >= emitter.duration
            ) {
                emitter.isActive = false
                continue
            }

            // Emit new particles
            this.emitParticles(emitter, position, deltaTime)

            // Update existing particles
            this.updateParticles(emitter, deltaTime)

            // Remove dead particles
            this.cleanupDeadParticles(emitter)
        }
    }

    private emitParticles(
        emitter: ParticleEmitterComponent,
        position: PositionComponent,
        deltaTime: number,
    ): void {
        if (emitter.emissionType === 'burst') {
            // For burst, emit all particles at once if we haven't started yet
            if (emitter.elapsedTime === deltaTime) {
                // First frame
                const particlesToEmit = Math.min(
                    emitter.particleCount,
                    emitter.maxParticles - emitter.particles.length,
                )

                for (let i = 0; i < particlesToEmit; i++) {
                    this.createParticle(emitter, position)
                }
            }
        } else if (emitter.emissionType === 'continuous') {
            // For continuous, emit based on rate
            const emissionInterval = 1.0 / emitter.particleCount // particleCount = particles per second
            const timeSinceLastEmission =
                emitter.elapsedTime - emitter.lastEmissionTime

            if (timeSinceLastEmission >= emissionInterval) {
                const particlesToEmit = Math.floor(
                    timeSinceLastEmission / emissionInterval,
                )
                const actualParticlesToEmit = Math.min(
                    particlesToEmit,
                    emitter.maxParticles - emitter.particles.length,
                )

                for (let i = 0; i < actualParticlesToEmit; i++) {
                    this.createParticle(emitter, position)
                }

                emitter.lastEmissionTime = emitter.elapsedTime
            }
        }
    }

    private createParticle(
        emitter: ParticleEmitterComponent,
        emitterPosition: PositionComponent,
    ): void {
        const particle: ParticleInstance = {
            id: this.particleIdCounter++,
            position: {
                x:
                    emitterPosition.x +
                    emitter.startPosition.x +
                    (Math.random() - 0.5) * emitter.positionVariance.x,
                y:
                    emitterPosition.y +
                    emitter.startPosition.y +
                    (Math.random() - 0.5) * emitter.positionVariance.y,
                z:
                    emitterPosition.z +
                    emitter.startPosition.z +
                    (Math.random() - 0.5) * emitter.positionVariance.z,
            },
            velocity: {
                x:
                    emitter.startVelocity.x +
                    (Math.random() - 0.5) * emitter.velocityVariance.x,
                y:
                    emitter.startVelocity.y +
                    (Math.random() - 0.5) * emitter.velocityVariance.y,
                z:
                    emitter.startVelocity.z +
                    (Math.random() - 0.5) * emitter.velocityVariance.z,
            },
            size:
                emitter.startSize +
                (Math.random() - 0.5) * emitter.sizeVariance,
            lifetime: 0,
            maxLifetime:
                emitter.particleLifetime +
                (Math.random() - 0.5) * emitter.lifetimeVariance,
            opacity: emitter.startOpacity,
            color: emitter.startColor ? { ...emitter.startColor } : undefined,
            spriteFrame: emitter.spriteSheetConfig?.randomStartFrame
                ? Math.floor(
                      Math.random() * emitter.spriteSheetConfig.totalFrames,
                  )
                : 0,
        }

        // Create the visual representation
        particle.mesh = this.createParticleMesh(emitter, particle)
        if (particle.mesh) {
            this.scene.add(particle.mesh)
        }

        emitter.particles.push(particle)
    }

    private createParticleMesh(
        emitter: ParticleEmitterComponent,
        particle: ParticleInstance,
    ): Object3D | undefined {
        let material: Material
        let geometry: BufferGeometry

        switch (emitter.particleType) {
            case 'sprite':
            case 'spriteSheet':
                geometry = new PlaneGeometry(particle.size, particle.size)
                material = new MeshBasicMaterial({
                    transparent: true,
                    opacity: particle.opacity,
                    blending: AdditiveBlending,
                })

                if (emitter.texture) {
                    const texture = this.getTexture(emitter.texture)
                    if (texture) {
                        ;(material as MeshBasicMaterial).map = texture

                        // Handle sprite sheet UV mapping
                        if (
                            emitter.particleType === 'spriteSheet' &&
                            emitter.spriteSheetConfig
                        ) {
                            this.updateSpriteSheetUV(
                                geometry,
                                emitter.spriteSheetConfig,
                                particle.spriteFrame || 0,
                            )
                        }
                    }
                }

                if (particle.color) {
                    ;(material as MeshBasicMaterial).color = new Color(
                        particle.color.r,
                        particle.color.g,
                        particle.color.b,
                    )
                }
                break

            case 'shape':
                if (emitter.shapeConfig) {
                    switch (emitter.shapeConfig.type) {
                        case 'circle':
                            geometry = new CircleGeometry(particle.size / 2, 16)
                            break
                        case 'square':
                            geometry = new PlaneGeometry(
                                particle.size,
                                particle.size,
                            )
                            break
                        case 'triangle':
                            geometry = new CircleGeometry(particle.size / 2, 3)
                            break
                        default:
                            geometry = new CircleGeometry(particle.size / 2, 16)
                    }

                    material = new MeshBasicMaterial({
                        color: emitter.shapeConfig.color,
                        transparent: true,
                        opacity: particle.opacity,
                        blending: AdditiveBlending,
                    })
                } else {
                    // Fallback to circle
                    geometry = new CircleGeometry(particle.size / 2, 16)
                    material = new MeshBasicMaterial({
                        color: 0xffffff,
                        transparent: true,
                        opacity: particle.opacity,
                        blending: AdditiveBlending,
                    })
                }
                break

            default:
                return undefined
        }

        const mesh = new Mesh(geometry, material)
        mesh.position.set(
            particle.position.x,
            particle.position.y,
            particle.position.z,
        )

        return mesh
    }

    private updateSpriteSheetUV(
        geometry: BufferGeometry,
        config: NonNullable<ParticleEmitterComponent['spriteSheetConfig']>,
        frameIndex: number,
    ): void {
        const uvAttribute = geometry.getAttribute('uv') as BufferAttribute
        if (!uvAttribute) return

        const col = frameIndex % config.columns
        const row = Math.floor(frameIndex / config.columns)

        const uSize = 1.0 / config.columns
        const vSize = 1.0 / config.rows

        const uOffset = col * uSize
        const vOffset = row * vSize

        // Update UV coordinates for the plane
        const uvArray = uvAttribute.array as Float32Array

        // Bottom-left
        uvArray[0] = uOffset
        uvArray[1] = vOffset + vSize

        // Bottom-right
        uvArray[2] = uOffset + uSize
        uvArray[3] = vOffset + vSize

        // Top-right
        uvArray[4] = uOffset + uSize
        uvArray[5] = vOffset

        // Top-left
        uvArray[6] = uOffset
        uvArray[7] = vOffset

        uvAttribute.needsUpdate = true
    }

    private updateParticles(
        emitter: ParticleEmitterComponent,
        deltaTime: number,
    ): void {
        for (const particle of emitter.particles) {
            // Update lifetime
            particle.lifetime += deltaTime

            if (particle.lifetime >= particle.maxLifetime) {
                continue // Will be cleaned up in cleanup phase
            }

            // Update position with velocity and acceleration
            particle.velocity.x += emitter.acceleration.x * deltaTime
            particle.velocity.y += emitter.acceleration.y * deltaTime
            particle.velocity.z += emitter.acceleration.z * deltaTime

            particle.position.x += particle.velocity.x * deltaTime
            particle.position.y += particle.velocity.y * deltaTime
            particle.position.z += particle.velocity.z * deltaTime

            // Calculate life progress (0 to 1)
            const lifeProgress = particle.lifetime / particle.maxLifetime

            // Update size
            const currentSize = this.lerp(
                emitter.startSize,
                emitter.endSize,
                lifeProgress,
            )
            particle.size = currentSize

            // Update opacity
            const currentOpacity = this.lerp(
                emitter.startOpacity,
                emitter.endOpacity,
                lifeProgress,
            )
            particle.opacity = Math.max(0, Math.min(1, currentOpacity))

            // Update color if color animation is enabled
            if (emitter.startColor && emitter.endColor && particle.color) {
                particle.color.r = this.lerp(
                    emitter.startColor.r,
                    emitter.endColor.r,
                    lifeProgress,
                )
                particle.color.g = this.lerp(
                    emitter.startColor.g,
                    emitter.endColor.g,
                    lifeProgress,
                )
                particle.color.b = this.lerp(
                    emitter.startColor.b,
                    emitter.endColor.b,
                    lifeProgress,
                )
            }

            // Update sprite sheet frame
            if (
                emitter.particleType === 'spriteSheet' &&
                emitter.spriteSheetConfig &&
                particle.mesh
            ) {
                const frameProgress =
                    (particle.lifetime *
                        emitter.spriteSheetConfig.animationSpeed) %
                    emitter.spriteSheetConfig.totalFrames
                const newFrame = Math.floor(frameProgress)

                if (newFrame !== particle.spriteFrame) {
                    particle.spriteFrame = newFrame
                    const geometry = (particle.mesh as Mesh).geometry
                    this.updateSpriteSheetUV(
                        geometry,
                        emitter.spriteSheetConfig,
                        newFrame,
                    )
                }
            }

            // Update mesh properties
            if (particle.mesh) {
                particle.mesh.position.set(
                    particle.position.x,
                    particle.position.y,
                    particle.position.z,
                )

                // Update scale
                particle.mesh.scale.setScalar(currentSize / emitter.startSize)

                // Update material properties
                const material = (particle.mesh as Mesh)
                    .material as MeshBasicMaterial
                if (material) {
                    material.opacity = particle.opacity

                    if (particle.color) {
                        material.color.setRGB(
                            particle.color.r,
                            particle.color.g,
                            particle.color.b,
                        )
                    }
                }
            }
        }
    }

    private cleanupDeadParticles(emitter: ParticleEmitterComponent): void {
        for (let i = emitter.particles.length - 1; i >= 0; i--) {
            const particle = emitter.particles[i]

            if (particle.lifetime >= particle.maxLifetime) {
                // Remove from scene
                if (particle.mesh) {
                    this.scene.remove(particle.mesh)

                    // Dispose of geometry and material
                    const mesh = particle.mesh as Mesh
                    if (mesh.geometry) {
                        mesh.geometry.dispose()
                    }
                    if (mesh.material) {
                        if (Array.isArray(mesh.material)) {
                            mesh.material.forEach((mat) => mat.dispose())
                        } else {
                            mesh.material.dispose()
                        }
                    }
                }

                // Remove from particles array
                emitter.particles.splice(i, 1)
            }
        }
    }

    private getTexture(texturePath: string): Texture | null {
        if (this.textureCache.has(texturePath)) {
            return this.textureCache.get(texturePath) || null
        }

        try {
            const texture = this.textureLoader.load(texturePath)
            this.textureCache.set(texturePath, texture)
            return texture
        } catch (error) {
            console.warn(
                `Failed to load particle texture: ${texturePath}`,
                error,
            )
            return null
        }
    }

    private lerp(start: number, end: number, progress: number): number {
        return start + (end - start) * progress
    }

    cleanup(): void {
        // Clean up all particles and dispose resources
        const entities = this.getEntities()

        for (const entity of entities) {
            const emitter =
                entity.getComponent<ParticleEmitterComponent>('particleEmitter')
            if (emitter) {
                for (const particle of emitter.particles) {
                    if (particle.mesh) {
                        this.scene.remove(particle.mesh)
                        const mesh = particle.mesh as Mesh
                        if (mesh.geometry) mesh.geometry.dispose()
                        if (mesh.material) {
                            if (Array.isArray(mesh.material)) {
                                mesh.material.forEach((mat) => mat.dispose())
                            } else {
                                mesh.material.dispose()
                            }
                        }
                    }
                }
                emitter.particles = []
            }
        }

        // Clear texture cache
        for (const texture of this.textureCache.values()) {
            texture.dispose()
        }
        this.textureCache.clear()
    }
}
