import type { RestrictedZoneConfig } from '../config/RestrictedZoneConfig'
import {
    calculatePushBackDirection,
    getRestrictedZoneAt,
    restrictedZonesConfig,
} from '../config/RestrictedZoneConfig'
import type { PositionComponent, SpeedComponent } from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
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
                this.pushShipOutOfZone(
                    position,
                    speed,
                    restrictedZone,
                    deltaTime,
                )
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
        const pushForce = restrictedZonesConfig.pushBackForce * deltaTime

        // Move the ship in the push-back direction
        position.x += pushDirection.x * pushForce
        position.z += pushDirection.z * pushForce

        // Reduce the ship's speed to make the collision feel more realistic
        speed.currentSpeed = Math.max(0, speed.currentSpeed * 0.5)
    }
}
