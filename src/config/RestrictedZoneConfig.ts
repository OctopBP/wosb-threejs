export interface RestrictedZoneConfig {
    centerX: number
    centerY: number
    centerZ: number
    radius: number
}

export const restrictedZonesConfig = {
    pushBackForce: 2.0,
}

/**
 * Predefined restricted zones for the game world
 * These spherical areas will be off-limits to ships
 */
export const restrictedZones: RestrictedZoneConfig[] = [
    { centerX: -11.5, centerY: 0, centerZ: -31.5, radius: 1 },
    { centerX: -13, centerY: 0, centerZ: -31.5, radius: 1 },
    { centerX: -14.5, centerY: 0, centerZ: -31.5, radius: 1.5 },
    { centerX: -17, centerY: 0, centerZ: -31.5, radius: 2 },

    { centerX: -16.5, centerY: 0, centerZ: 10, radius: 3 },
    { centerX: -18.5, centerY: 0, centerZ: 7, radius: 2.5 },
    { centerX: -19.75, centerY: 0, centerZ: 5.25, radius: 1 },
    { centerX: -20.5, centerY: 0, centerZ: 4, radius: 1 },

    { centerX: 19.25, centerY: 0, centerZ: 15.75, radius: 2.5 },
]

/**
 * Check if a position is inside any restricted zone
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param z - Z coordinate
 * @returns The restricted zone if position is inside one, null otherwise
 */
export function getRestrictedZoneAt(
    x: number,
    z: number,
    y?: number,
): RestrictedZoneConfig | null {
    const yPos = y ?? 0

    for (const zone of restrictedZones) {
        // Calculate distance from point to sphere center
        const dx = x - zone.centerX
        const dy = yPos - zone.centerY
        const dz = z - zone.centerZ
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

        // Check if point is inside the sphere
        if (distance <= zone.radius) {
            return zone
        }
    }
    return null
}

/**
 * Calculate push-back direction to move a ship out of a restricted zone
 * @param shipX - Ship's X position
 * @param shipZ - Ship's Z position
 * @param zone - The restricted zone
 * @returns Direction vector to push the ship away from the zone
 */
export function calculatePushBackDirection(
    shipX: number,
    shipZ: number,
    zone: RestrictedZoneConfig,
): { x: number; z: number } {
    // Calculate direction from sphere center to ship
    const dirX = shipX - zone.centerX
    const dirZ = shipZ - zone.centerZ

    // If ship is exactly at center, push in a default direction
    if (dirX === 0 && dirZ === 0) {
        return { x: 1, z: 0 }
    }

    // Normalize the direction
    const length = Math.sqrt(dirX * dirX + dirZ * dirZ)
    return {
        x: dirX / length,
        z: dirZ / length,
    }
}
