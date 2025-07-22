import type { PositionComponent, RenderableComponent } from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class WaveRockingSystem extends System {
    private time: number = 0

    // Wave configuration
    private readonly waveConfig = {
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
    }

    constructor(world: World) {
        // Apply to entities with position and renderable components that are ships
        super(world, ['position', 'renderable'])
    }

    update(deltaTime: number): void {
        this.time += deltaTime

        const entities = this.getEntities()

        for (const entity of entities) {
            const position = entity.getComponent<PositionComponent>('position')
            const renderable =
                entity.getComponent<RenderableComponent>('renderable')

            if (!position || !renderable) continue

            // Only apply to ship meshes
            if (!this.isShipMesh(renderable.meshType)) continue

            this.applyWaveMotion(position, deltaTime)
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
}
