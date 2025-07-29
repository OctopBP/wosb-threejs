export interface SpawnZoneConfig {
    minX: number
    maxX: number
    minZ: number
    maxZ: number
    minY?: number
    maxY?: number
    name?: string // Optional name for debugging
}

/**
 * Predefined spawn zones for the game world
 * These areas are where enemy ships can spawn
 */
export const spawnZones: SpawnZoneConfig[] = [
    // Large open water areas away from islands/obstacles
    { minX: -80, maxX: -50, minZ: -50, maxZ: 50, name: "Western Ocean" },
    { minX: 50, maxX: 80, minZ: -50, maxZ: 50, name: "Eastern Ocean" },
    { minX: -50, maxX: 50, minZ: -80, maxZ: -50, name: "Southern Ocean" },
    { minX: -50, maxX: 50, minZ: 50, maxZ: 80, name: "Northern Ocean" },
    
    // Smaller areas between islands for variety
    { minX: -15, maxX: 15, minZ: 65, maxZ: 75, name: "North Channel" },
    { minX: -15, maxX: 15, minZ: -75, maxZ: -65, name: "South Channel" },
    { minX: 65, maxX: 75, minZ: -15, maxZ: 15, name: "East Channel" },
    { minX: -75, maxX: -65, minZ: -15, maxZ: 15, name: "West Channel" },
]

/**
 * Check if a position is inside any spawn zone
 * @param x - X coordinate
 * @param z - Z coordinate
 * @param y - Y coordinate (optional)
 * @returns The spawn zone if position is inside one, null otherwise
 */
export function getSpawnZoneAt(
    x: number,
    z: number,
    y?: number,
): SpawnZoneConfig | null {
    for (const zone of spawnZones) {
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
                (zoneX - playerX) ** 2 + (zoneZ - playerZ) ** 2
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