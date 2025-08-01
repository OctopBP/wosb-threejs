export interface RestrictedZoneConfig {
    minX: number
    maxX: number
    minZ: number
    maxZ: number
    minY?: number
    maxY?: number
}

export const restrictedZonesConfig = {
    pushBackForce: 2.0,
}

/**
 * Predefined restricted zones for the game world
 * These areas will be off-limits to ships
 */
export const restrictedZones: RestrictedZoneConfig[] = [
    { minX: -19, maxX: -10, minZ: -33, maxZ: -30 },
    { minX: -21, maxX: -14, minZ: 2, maxZ: 13 },
    { minX: 17, maxX: 21.5, minZ: 13.5, maxZ: 18 },
]

/**
 * Check if a position is inside any restricted zone
 * @param x - X coordinate
 * @param z - Z coordinate
 * @param y - Y coordinate (optional)
 * @returns The restricted zone if position is inside one, null otherwise
 */
export function getRestrictedZoneAt(
    x: number,
    z: number,
    y?: number,
): RestrictedZoneConfig | null {
    for (const zone of restrictedZones) {
        // Check X and Z bounds
        if (
            x >= zone.minX &&
            x <= zone.maxX &&
            z >= zone.minZ &&
            z <= zone.maxZ
        ) {
            // Check Y bounds if specified
            if (zone.minY !== undefined && y !== undefined && y < zone.minY) {
                continue
            }
            if (zone.maxY !== undefined && y !== undefined && y > zone.maxY) {
                continue
            }
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
    // Find the closest edge of the zone
    const centerX = (zone.minX + zone.maxX) / 2
    const centerZ = (zone.minZ + zone.maxZ) / 2

    // Calculate direction from zone center to ship
    const dirX = shipX - centerX
    const dirZ = shipZ - centerZ

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
