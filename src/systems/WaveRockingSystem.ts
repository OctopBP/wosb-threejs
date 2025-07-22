import type {
    PositionComponent,
    RenderableComponent,
    VelocityComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export interface WaveConfig {
    // Visual effects
    verticalAmplitude: number
    verticalFrequency: number
    rollAmplitude: number
    rollFrequency: number
    pitchAmplitude: number
    pitchFrequency: number
    spatialVariation: number

    // Movement effects
    waveResistance: number
    wavePushStrength: number
    wavePushFrequency: number
    turbulenceStrength: number
}

export class WaveRockingSystem extends System {
    private time: number = 0

    // Wave configuration
    private readonly waveConfig: WaveConfig = {
        // Vertical bobbing (Y position)
        verticalAmplitude: 0.15, // How much the ship bobs up/down
        verticalFrequency: 0.8, // How fast the bobbing motion

        // Rolling motion (Z rotation)
        rollAmplitude: 0.08, // How much the ship rolls side to side (radians)
        rollFrequency: 0.6, // How fast the rolling motion

        // Pitching motion (X rotation)
        pitchAmplitude: 0.05, // How much the ship pitches forward/back (radians)
        pitchFrequency: 0.7, // How fast the pitching motion

        // Wave variation based on position
        spatialVariation: 0.3, // How much waves vary based on ship position

        // Movement effects
        waveResistance: 0.15, // How much waves resist movement
        wavePushStrength: 0.8, // How strong wave currents push ships
        wavePushFrequency: 0.4, // Frequency of wave push effects
        turbulenceStrength: 0.3, // Random turbulence strength
    }

    constructor(world: World) {
        // Apply to entities with position, velocity, and renderable components that are ships
        super(world, ['position', 'velocity', 'renderable'])
    }

    update(deltaTime: number): void {
        this.time += deltaTime

        const entities = this.getEntities()

        for (const entity of entities) {
            const position = entity.getComponent<PositionComponent>('position')
            const velocity = entity.getComponent<VelocityComponent>('velocity')
            const renderable =
                entity.getComponent<RenderableComponent>('renderable')

            if (!position || !velocity || !renderable) continue

            // Only apply to ship meshes
            if (!this.isShipMesh(renderable.meshType)) continue

            this.applyWaveMotion(position, deltaTime)
            this.applyWaveMovementEffects(position, velocity, deltaTime)
        }
    }

    private isShipMesh(meshType: string): boolean {
        // Check if the mesh type represents a ship
        return (
            meshType.includes('ship') ||
            meshType === 'enemy1' ||
            meshType === 'boss'
        )
    }

    private applyWaveMotion(
        position: PositionComponent,
        deltaTime: number,
    ): void {
        // Create spatial variation based on ship position
        const spatialOffsetX = position.x * this.waveConfig.spatialVariation
        const spatialOffsetZ = position.z * this.waveConfig.spatialVariation

        // Store original position if not already stored
        if (!position.originalY) {
            position.originalY = position.y
        }
        if (!position.originalRotationX) {
            position.originalRotationX = position.rotationX
        }
        if (!position.originalRotationZ) {
            position.originalRotationZ = position.rotationZ
        }

        // Apply vertical bobbing
        const verticalWave =
            Math.sin(
                this.time * this.waveConfig.verticalFrequency +
                    spatialOffsetX +
                    spatialOffsetZ,
            ) * this.waveConfig.verticalAmplitude

        position.y = position.originalY + verticalWave

        // Apply rolling motion (side to side)
        const rollWave =
            Math.sin(
                this.time * this.waveConfig.rollFrequency +
                    spatialOffsetX * 0.7,
            ) * this.waveConfig.rollAmplitude

        position.rotationZ = position.originalRotationZ + rollWave

        // Apply pitching motion (forward/back)
        const pitchWave =
            Math.cos(
                this.time * this.waveConfig.pitchFrequency +
                    spatialOffsetZ * 0.8,
            ) * this.waveConfig.pitchAmplitude

        position.rotationX = position.originalRotationX + pitchWave
    }

    private applyWaveMovementEffects(
        position: PositionComponent,
        velocity: VelocityComponent,
        deltaTime: number,
    ): void {
        // Create spatial variation for movement effects
        const spatialOffsetX = position.x * this.waveConfig.spatialVariation
        const spatialOffsetZ = position.z * this.waveConfig.spatialVariation

        // Calculate current movement magnitude for resistance
        const currentSpeed = Math.sqrt(
            velocity.dx * velocity.dx + velocity.dz * velocity.dz,
        )

        // Apply wave resistance - stronger resistance for faster movement
        if (currentSpeed > 0.1) {
            const resistanceMultiplier =
                1.0 - this.waveConfig.waveResistance * deltaTime
            velocity.dx *= resistanceMultiplier
            velocity.dz *= resistanceMultiplier
        }

        // Apply wave push forces (ocean currents)
        const wavePushX =
            Math.sin(
                this.time * this.waveConfig.wavePushFrequency +
                    spatialOffsetX * 0.5,
            ) *
            this.waveConfig.wavePushStrength *
            deltaTime

        const wavePushZ =
            Math.cos(
                this.time * this.waveConfig.wavePushFrequency +
                    spatialOffsetZ * 0.7,
            ) *
            this.waveConfig.wavePushStrength *
            deltaTime

        // Apply the push forces
        velocity.dx += wavePushX
        velocity.dz += wavePushZ

        // Add some turbulence for more realistic feel
        const turbulenceX =
            (Math.random() - 0.5) *
            this.waveConfig.turbulenceStrength *
            deltaTime
        const turbulenceZ =
            (Math.random() - 0.5) *
            this.waveConfig.turbulenceStrength *
            deltaTime

        velocity.dx += turbulenceX
        velocity.dz += turbulenceZ

        // Apply some vertical wave motion to velocity for more dynamic feel
        const verticalWaveForce =
            Math.cos(
                this.time * this.waveConfig.verticalFrequency * 2 +
                    spatialOffsetX +
                    spatialOffsetZ,
            ) *
            0.2 *
            deltaTime

        velocity.dy += verticalWaveForce
    }

    /**
     * Update wave configuration for runtime adjustments
     */
    public updateWaveConfig(partialConfig: Partial<WaveConfig>): void {
        Object.assign(this.waveConfig, partialConfig)
    }

    /**
     * Get current wave configuration
     */
    public getWaveConfig(): Readonly<WaveConfig> {
        return this.waveConfig
    }
}
