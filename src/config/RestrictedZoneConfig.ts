/**
 * Configuration for restricted zones where ships cannot move
 * 
 * Restricted zones are box-shaped areas where ships cannot enter.
 * When a ship tries to enter a restricted zone, it will be pushed back
 * with a force proportional to the zone's pushBackForce setting.
 * 
 * Usage:
 * 1. Ships automatically can't enter these zones due to RestrictedZoneSystem
 * 2. You can visualize zones in debug mode using the debug system
 * 3. Add new zones to the restrictedZones array below
 * 
 * Debug visualization:
 * - Press the appropriate debug key to enable "showRestrictedZones"
 * - Zones will appear as red wireframe boxes
 */

export interface RestrictedZoneConfig {
    minX: number
    maxX: number
    minZ: number
    maxZ: number
    minY?: number
    maxY?: number
    name: string
    pushBackForce: number
}

/**
 * Predefined restricted zones for the game world
 * These areas will be off-limits to ships
 */
export const restrictedZones: RestrictedZoneConfig[] = [
    // Island area - ships shouldn't be able to move onto land
    {
        minX: -5,
        maxX: 5,
        minZ: -5,
        maxZ: 5,
        name: 'Central Island',
        pushBackForce: 2.0,
    },
    // Example northern reef area
    {
        minX: -15,
        maxX: -10,
        minZ: 15,
        maxZ: 20,
        name: 'Northern Reef',
        pushBackForce: 1.5,
    },
    // Example southern shallow waters
    {
        minX: 10,
        maxX: 15,
        minZ: -20,
        maxZ: -15,
        name: 'Southern Shallows',
        pushBackForce: 1.5,
    },
    // Example eastern rocks
    {
        minX: 20,
        maxX: 25,
        minZ: -5,
        maxZ: 5,
        name: 'Eastern Rocks',
        pushBackForce: 2.0,
    },
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
        if (x >= zone.minX && x <= zone.maxX && z >= zone.minZ && z <= zone.maxZ) {
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