import type { BoundaryConfig } from '../config/BoundaryConfig'
import {
    boundarySystemConfig,
    clampToBoundary,
    isOutsideBoundary,
    shipBoundaryConfig,
} from '../config/BoundaryConfig'
import type { PositionComponent, SpeedComponent } from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

/**
 * System that prevents ships from leaving the defined boundary area
 * Checks ship positions and constrains them within the allowed movement area
 */
export class BoundarySystem extends System {
    private boundary: BoundaryConfig

    constructor(world: World, boundary: BoundaryConfig = shipBoundaryConfig) {
        // Target entities that have position, speed, and are alive (ships)
        super(world, ['position', 'speed', 'alive'])
        this.boundary = boundary
    }

    update(deltaTime: number): void {
        const entities = this.getEntities()

        for (const entity of entities) {
            const position = entity.getComponent<PositionComponent>('position')
            const speed = entity.getComponent<SpeedComponent>('speed')

            if (!position || !speed) {
                continue
            }

            // Check if the ship is outside the boundary
            if (
                isOutsideBoundary(
                    position.x,
                    position.z,
                    position.y,
                    this.boundary,
                )
            ) {
                // Ship is outside boundary - constrain it back inside
                this.constrainShipToBoundary(position, speed)
            }
        }
    }

    /**
     * Constrain a ship back inside the boundary
     */
    private constrainShipToBoundary(
        position: PositionComponent,
        speed: SpeedComponent,
    ): void {
        // Get the clamped position
        const clampedPos = clampToBoundary(
            position.x,
            position.z,
            position.y,
            this.boundary,
        )

        // Check which boundaries were hit to provide appropriate feedback
        const hitMinX = position.x < this.boundary.minX
        const hitMaxX = position.x > this.boundary.maxX
        const hitMinZ = position.z < this.boundary.minZ
        const hitMaxZ = position.z > this.boundary.maxZ

        // Update position to clamped values
        position.x = clampedPos.x
        position.z = clampedPos.z
        if (clampedPos.y !== undefined) {
            position.y = clampedPos.y
        }

        // Reduce speed when hitting boundary to make it feel more realistic
        if (hitMinX || hitMaxX || hitMinZ || hitMaxZ) {
            speed.currentSpeed *= boundarySystemConfig.speedReductionOnHit
        }

        // Optional: Add a small push-back effect to prevent sticking to boundaries
        if (hitMinX) {
            position.x += boundarySystemConfig.pushBackForce * 0.016 // Approximate frame time
        }
        if (hitMaxX) {
            position.x -= boundarySystemConfig.pushBackForce * 0.016
        }
        if (hitMinZ) {
            position.z += boundarySystemConfig.pushBackForce * 0.016
        }
        if (hitMaxZ) {
            position.z -= boundarySystemConfig.pushBackForce * 0.016
        }
    }

    /**
     * Update the boundary configuration
     */
    setBoundary(boundary: BoundaryConfig): void {
        this.boundary = boundary
    }

    /**
     * Get the current boundary configuration
     */
    getBoundary(): BoundaryConfig {
        return this.boundary
    }
}
