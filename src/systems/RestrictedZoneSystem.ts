import type { PositionComponent, SpeedComponent } from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import {
    calculatePushBackDirection,
    getRestrictedZoneAt,
    type RestrictedZoneConfig,
} from '../config/RestrictedZoneConfig'

/**
 * System that prevents ships from entering restricted zones
 * Checks ship positions and pushes them back if they try to enter forbidden areas
 */
export class RestrictedZoneSystem extends System {
    constructor(world: World) {
        // Target entities that have position, speed, and are alive (ships)
        super(world, ['position', 'speed', 'alive'])
    }

    update(deltaTime: number): void {
        const entities = this.getEntities()

        for (const entity of entities) {
            const position = entity.getComponent<PositionComponent>('position')
            const speed = entity.getComponent<SpeedComponent>('speed')

            if (!position || !speed) {
                continue
            }

            // Check if the ship is in a restricted zone
            const restrictedZone = getRestrictedZoneAt(
                position.x,
                position.z,
                position.y,
            )

            if (restrictedZone) {
                // Ship is in a restricted zone - push it back
                this.pushShipOutOfZone(position, speed, restrictedZone, deltaTime)

                // Log for debugging (optional - can be removed in production)
                if (entity.hasComponent('player')) {
                    console.log(
                        `⚠️ Player ship pushed out of ${restrictedZone.name} at (${position.x.toFixed(1)}, ${position.z.toFixed(1)})`,
                    )
                } else if (entity.hasComponent('enemy')) {
                    console.log(
                        `🚫 Enemy ship blocked from ${restrictedZone.name}`,
                    )
                }
            }
        }
    }

    /**
     * Push a ship out of a restricted zone
     */
    private pushShipOutOfZone(
        position: PositionComponent,
        speed: SpeedComponent,
        zone: RestrictedZoneConfig,
        deltaTime: number,
    ): void {
        // Calculate the direction to push the ship
        const pushDirection = calculatePushBackDirection(
            position.x,
            position.z,
            zone,
        )

        // Apply push-back force
        const pushForce = zone.pushBackForce * deltaTime

        // Move the ship in the push-back direction
        position.x += pushDirection.x * pushForce
        position.z += pushDirection.z * pushForce

        // Reduce the ship's speed to make the collision feel more realistic
        speed.currentSpeed = Math.max(0, speed.currentSpeed * 0.5)
    }
}