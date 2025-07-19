import { Color, Vector3 } from 'three'
import type { ParticleSystem, ParticleSystemConfig } from '../systems/ParticleSystem'

/**
 * Example configurations for the flexible particle system
 */
export class ParticleSystemExamples {
    /**
     * Creates a fire effect using burst and continuous emission
     */
    static createFireEffect(particleSystem: ParticleSystem, position: Vector3): void {
        const fireConfig: ParticleSystemConfig = {
            id: 'fire',
            position: position,
            
            // Emission settings
            emissionRate: 15.0, // 15 particles per second
            burstCount: 5, // 5 particles per burst
            burstInterval: 0.5, // burst every 0.5 seconds
            
            // Particle properties
            life: { min: 1.0, max: 2.5 },
            size: { min: 1.0, max: 3.0 },
            speed: { min: 2.0, max: 8.0 },
            
            // Spawn area
            spawnArea: {
                type: 'box',
                size: new Vector3(0.5, 0.1, 0.5)
            },
            
            // Direction - upward with some spread
            direction: new Vector3(0, 1, 0),
            directionSpread: Math.PI * 0.3, // 54 degrees
            
            // Physics
            gravity: new Vector3(0, 2.0, 0), // slight upward force for fire
            drag: 0.5,
            
            // Visual properties
            startColor: new Color(0xff4400), // orange-red
            endColor: new Color(0x440000), // dark red
            rotation: { min: 0, max: Math.PI * 2 },
            rotationSpeed: { min: -3, max: 3 },
            
            // Texture
            texture: 'assets/sprites/fire.png',
            
            // Custom animation curves
            sizeOverTime: [
                { time: 0.0, value: 0.5 },
                { time: 0.3, value: 1.5 },
                { time: 1.0, value: 0.2 }
            ],
            alphaOverTime: [
                { time: 0.0, value: 0.8 },
                { time: 0.7, value: 1.0 },
                { time: 1.0, value: 0.0 }
            ]
        }
        
        particleSystem.createParticleSystem(fireConfig)
    }

    /**
     * Creates a smoke effect with continuous emission
     */
    static createSmokeEffect(particleSystem: ParticleSystem, position: Vector3): void {
        const smokeConfig: ParticleSystemConfig = {
            id: 'smoke',
            position: position,
            
            // Emission settings
            emissionRate: 8.0, // 8 particles per second
            burstCount: 0,
            burstInterval: -1, // no bursts
            
            // Particle properties
            life: { min: 3.0, max: 5.0 },
            size: { min: 2.0, max: 4.0 },
            speed: { min: 1.0, max: 3.0 },
            
            // Spawn area
            spawnArea: {
                type: 'sphere',
                size: new Vector3(0.3, 0, 0) // radius in x
            },
            
            // Direction - upward with spread
            direction: new Vector3(0, 1, 0),
            directionSpread: Math.PI * 0.2, // 36 degrees
            
            // Physics
            gravity: new Vector3(0, 1.0, 0), // light upward force
            drag: 0.8,
            
            // Visual properties
            startColor: new Color(0x888888), // gray
            endColor: new Color(0x222222), // dark gray
            rotation: { min: 0, max: Math.PI * 2 },
            rotationSpeed: { min: -1, max: 1 },
            
            // Texture
            texture: 'assets/sprites/smoke.png',
            
            // Custom animation curves
            sizeOverTime: [
                { time: 0.0, value: 0.3 },
                { time: 0.5, value: 1.0 },
                { time: 1.0, value: 2.0 }
            ],
            alphaOverTime: [
                { time: 0.0, value: 0.6 },
                { time: 0.4, value: 0.8 },
                { time: 1.0, value: 0.0 }
            ]
        }
        
        particleSystem.createParticleSystem(smokeConfig)
    }

    /**
     * Creates an explosion effect with burst emission only
     */
    static createExplosionEffect(particleSystem: ParticleSystem, position: Vector3): void {
        const explosionConfig: ParticleSystemConfig = {
            id: 'explosion',
            position: position,
            
            // Emission settings - burst only
            emissionRate: 0, // no continuous emission
            burstCount: 50, // large burst
            burstInterval: -1, // single burst
            
            // Particle properties
            life: { min: 0.5, max: 1.5 },
            size: { min: 1.0, max: 5.0 },
            speed: { min: 5.0, max: 20.0 },
            
            // Spawn area
            spawnArea: {
                type: 'point',
                size: new Vector3(0, 0, 0)
            },
            
            // Direction - all directions
            direction: new Vector3(0, 1, 0),
            directionSpread: Math.PI, // full sphere
            
            // Physics
            gravity: new Vector3(0, -10.0, 0), // gravity pulls down
            drag: 2.0, // high drag
            
            // Visual properties
            startColor: new Color(0xffff00), // yellow
            endColor: new Color(0xff0000), // red
            rotation: { min: 0, max: Math.PI * 2 },
            rotationSpeed: { min: -10, max: 10 },
            
            // Texture
            texture: 'assets/sprites/explosion.png',
            
            // Custom color progression
            colorOverTime: [
                { time: 0.0, value: new Color(0xffffff) }, // white
                { time: 0.2, value: new Color(0xffff00) }, // yellow
                { time: 0.6, value: new Color(0xff4400) }, // orange
                { time: 1.0, value: new Color(0x440000) }  // dark red
            ]
        }
        
        particleSystem.createParticleSystem(explosionConfig)
        
        // Trigger the explosion immediately
        particleSystem.burst('explosion')
        
        // Deactivate after burst (optional)
        setTimeout(() => {
            particleSystem.deactivateParticleSystem('explosion')
        }, 100)
    }

    /**
     * Creates a magic sparkle effect using sprite sheet animation
     */
    static createSparkleEffect(particleSystem: ParticleSystem, position: Vector3): void {
        const sparkleConfig: ParticleSystemConfig = {
            id: 'sparkles',
            position: position,
            
            // Emission settings
            emissionRate: 5.0,
            burstCount: 3,
            burstInterval: 1.0, // burst every second
            
            // Particle properties
            life: { min: 2.0, max: 3.0 },
            size: { min: 1.5, max: 2.5 },
            speed: { min: 0.5, max: 2.0 },
            
            // Spawn area
            spawnArea: {
                type: 'sphere',
                size: new Vector3(1.0, 0, 0)
            },
            
            // Direction - random
            direction: new Vector3(0, 1, 0),
            directionSpread: Math.PI, // full sphere
            
            // Physics
            gravity: new Vector3(0, 0, 0), // no gravity
            drag: 1.0,
            
            // Visual properties
            startColor: new Color(0xffffff), // white
            endColor: new Color(0x4444ff), // blue
            rotation: { min: 0, max: Math.PI * 2 },
            rotationSpeed: { min: -5, max: 5 },
            
            // Sprite sheet texture - 4x4 grid (16 frames total)
            texture: 'assets/sprites/sparkle_sheet.png',
            spriteSheet: {
                columns: 4,      // 4 columns in the sprite sheet
                rows: 4,         // 4 rows in the sprite sheet
                animationSpeed: 8.0, // 8 frames per second
                randomStartFrame: true // Each particle starts at a random frame
            }
        }
        
        particleSystem.createParticleSystem(sparkleConfig)
    }

    /**
     * Creates a coin collection effect with sprite sheet animation
     */
    static createCoinEffect(particleSystem: ParticleSystem, position: Vector3): void {
        const coinConfig: ParticleSystemConfig = {
            id: 'coins',
            position: position,
            
            // Emission settings - burst only
            emissionRate: 0,
            burstCount: 8,
            burstInterval: -1,
            
            // Particle properties
            life: { min: 1.5, max: 2.0 },
            size: { min: 2.0, max: 3.0 },
            speed: { min: 3.0, max: 8.0 },
            
            // Spawn area
            spawnArea: {
                type: 'point',
                size: new Vector3(0, 0, 0)
            },
            
            // Direction - upward with spread
            direction: new Vector3(0, 1, 0),
            directionSpread: Math.PI * 0.4,
            
            // Physics
            gravity: new Vector3(0, -5.0, 0),
            drag: 1.5,
            
            // Visual properties
            startColor: new Color(0xffd700), // gold
            endColor: new Color(0xffaa00), // orange
            rotation: { min: 0, max: Math.PI * 2 },
            rotationSpeed: { min: -8, max: 8 },
            
            // Spinning coin sprite sheet - 1x8 strip (8 frames)
            texture: 'assets/sprites/coin_spin.png',
            spriteSheet: {
                columns: 8,      // 8 frames in a horizontal strip
                rows: 1,         // Single row
                animationSpeed: 12.0, // Fast spinning animation
                randomStartFrame: false // All coins start synchronized
            }
        }
        
        particleSystem.createParticleSystem(coinConfig)
    }

    /**
     * Creates a rain effect
     */
    static createRainEffect(particleSystem: ParticleSystem, position: Vector3): void {
        const rainConfig: ParticleSystemConfig = {
            id: 'rain',
            position: position,
            
            // Emission settings
            emissionRate: 20.0, // lots of raindrops
            burstCount: 0,
            burstInterval: -1,
            
            // Particle properties
            life: { min: 2.0, max: 4.0 },
            size: { min: 0.5, max: 1.0 },
            speed: { min: 15.0, max: 25.0 },
            
            // Spawn area - wide area above
            spawnArea: {
                type: 'box',
                size: new Vector3(20, 1, 20)
            },
            
            // Direction - downward
            direction: new Vector3(0, -1, 0),
            directionSpread: 0.1, // slight spread
            
            // Physics
            gravity: new Vector3(0, -5.0, 0), // additional downward force
            drag: 0.0, // no drag for rain
            
            // Visual properties
            startColor: new Color(0x6666ff), // light blue
            endColor: new Color(0x4444bb), // darker blue
            rotation: { min: 0, max: 0 }, // no rotation
            rotationSpeed: { min: 0, max: 0 },
            
            // Texture
            texture: 'assets/sprites/raindrop.png'
        }
        
        particleSystem.createParticleSystem(rainConfig)
    }

    /**
     * Example of how to use the particle system
     */
    static setupExampleScene(particleSystem: ParticleSystem): void {
        // Create different effects at different positions
        this.createFireEffect(particleSystem, new Vector3(-5, 0, 0))
        this.createSmokeEffect(particleSystem, new Vector3(-5, 2, 0))
        this.createSparkleEffect(particleSystem, new Vector3(0, 1, 0))
        this.createRainEffect(particleSystem, new Vector3(0, 10, 0))
        
        // Create an explosion after 3 seconds
        setTimeout(() => {
            this.createExplosionEffect(particleSystem, new Vector3(5, 0, 0))
        }, 3000)
        
        // Log particle system info every 2 seconds
        setInterval(() => {
            console.log('Active particle systems:', particleSystem.getAllParticleSystemIds())
            console.log('Total particles:', particleSystem.getTotalParticleCount())
            
            // Log individual system info
            for (const id of particleSystem.getAllParticleSystemIds()) {
                const info = particleSystem.getParticleSystemInfo(id)
                console.log(`${id}: ${info?.particleCount} particles, active: ${info?.isActive}`)
            }
        }, 2000)
    }
}