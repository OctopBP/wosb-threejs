import type { RestrictedZoneConfig } from '../config/RestrictedZoneConfig'
import { getRestrictedZoneAt } from '../config/RestrictedZoneConfig'
import type { PositionComponent, SpeedComponent } from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
/**
 * System that prevents ships from entering restricted zones
 * Checks ship positions and trims them to stay within allowed areas
 */
export class RestrictedZoneSystem extends System {
    constructor(world: World) {
        // Target entities that have position, speed, and are alive (ships)
        super(world, ['position', 'speed', 'alive', 'player'])
    }

    update(_deltaTime: number): void {
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
                // Ship is in a restricted zone - trim its position
                this.trimShipPosition(position, speed, restrictedZone)
            }
        }
    }

    /**
     * Trim a ship's position to stay outside of a restricted zone
     */
    private trimShipPosition(
        position: PositionComponent,
        speed: SpeedComponent,
        zone: RestrictedZoneConfig,
    ): void {
        // Calculate direction from zone center to ship
        const dirX = position.x - zone.centerX
        const dirZ = position.z - zone.centerZ

        // If ship is exactly at center, move it in a default direction
        if (dirX === 0 && dirZ === 0) {
            position.x = zone.centerX + zone.radius
            position.z = zone.centerZ
            return
        }

        // Calculate distance from zone center
        const distance = Math.sqrt(dirX * dirX + dirZ * dirZ)

        // If ship is inside the zone, move it to the boundary
        if (distance < zone.radius) {
            // Normalize direction and scale to radius
            const normalizedDirX = dirX / distance
            const normalizedDirZ = dirZ / distance

            // Set position to boundary of the zone
            position.x = zone.centerX + normalizedDirX * zone.radius
            position.z = zone.centerZ + normalizedDirZ * zone.radius
        }

        // Reduce the ship's speed to make the collision feel more realistic
        speed.currentSpeed = Math.max(0, speed.currentSpeed * 0.5)
    }
}
