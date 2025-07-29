export interface SpawnZoneConfig {
    minX: number
    maxX: number
    minZ: number
    maxZ: number
}

/**
 * Predefined spawn zones for the game world
 * These areas are where enemy ships can spawn
 */
export const spawnZones: SpawnZoneConfig[] = [
    // Large open water areas away from islands/obstacles
    { minX: -45, maxX: 15, minZ: 58, maxZ: 75 },
    { minX: -45, maxX: -25, minZ: 0, maxZ: 58 },
    { minX: -33, maxX: 10, minZ: -7, maxZ: 10 },
    { minX: -10, maxX: 25, minZ: 0, maxZ: 57 },
    { minX: -25, maxX: -10, minZ: 15, maxZ: 45 },
    { minX: 22, maxX: 32, minZ: 58, maxZ: 75 },
]

/**
 * Check if a position is inside any spawn zone
 * @param x - X coordinate
 * @param z - Z coordinate
 * @param y - Y coordinate (optional)
 * @returns The spawn zone if position is inside one, null otherwise
 */
export function getSpawnZoneAt(x: number, z: number): SpawnZoneConfig | null {
    for (const zone of spawnZones) {
        // Check X and Z bounds
        if (
            x >= zone.minX &&
            x <= zone.maxX &&
            z >= zone.minZ &&
            z <= zone.maxZ
        ) {
            return zone
        }
    }
    return null
}

/**
 * Find a random valid spawn position within any spawn zone, at a given distance from player
 * @param playerX - Player's X position
 * @param playerZ - Player's Z position
 * @param spawnDistance - Desired distance from player
 * @param maxAttempts - Maximum attempts to find a valid position
 * @returns Valid spawn position or null if none found
 */
export function findValidSpawnPosition(
    playerX: number,
    playerZ: number,
    spawnDistance: number,
    maxAttempts: number = 50,
): { x: number; z: number; zone: SpawnZoneConfig } | null {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Generate random angle around player
        const angle = Math.random() * 2 * Math.PI
        const candidateX = playerX + Math.cos(angle) * spawnDistance
        const candidateZ = playerZ + Math.sin(angle) * spawnDistance

        // Check if this position is in a valid spawn zone
        const zone = getSpawnZoneAt(candidateX, candidateZ)
        if (zone) {
            return { x: candidateX, z: candidateZ, zone }
        }
    }

    // If we can't find a valid position at the exact distance, try to find any position in spawn zones
    // and adjust to maintain approximate distance
    for (const zone of spawnZones) {
        for (let attempt = 0; attempt < 10; attempt++) {
            // Random position within the zone
            const zoneX = zone.minX + Math.random() * (zone.maxX - zone.minX)
            const zoneZ = zone.minZ + Math.random() * (zone.maxZ - zone.minZ)

            // Check if distance is reasonable (within 50% variance of desired distance)
            const distance = Math.sqrt(
                (zoneX - playerX) ** 2 + (zoneZ - playerZ) ** 2,
            )
            const minDistance = spawnDistance * 0.5
            const maxDistance = spawnDistance * 1.5

            if (distance >= minDistance && distance <= maxDistance) {
                return { x: zoneX, z: zoneZ, zone }
            }
        }
    }

    return null
}

/**
 * Get all spawn zones for debug visualization
 */
export function getAllSpawnZones(): SpawnZoneConfig[] {
    return spawnZones
}
