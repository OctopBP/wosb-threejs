import { getRestrictedZoneAt } from './RestrictedZoneConfig'

export interface BoundaryConfig {
    minX: number
    maxX: number
    minZ: number
    maxZ: number
    minY?: number
    maxY?: number
}

export const shipBoundaryConfig: BoundaryConfig = {
    minX: -42,
    maxX: 33,
    minZ: -46,
    maxZ: 32,
}

export const boundarySystemConfig = {
    speedReductionOnHit: 0.3,
    pushBackForce: 1.5,
}

/**
 * Check if a position is outside the boundary
 * @param x - X coordinate
 * @param z - Z coordinate
 * @param y - Y coordinate (optional)
 * @param boundary - The boundary configuration
 * @returns true if position is outside boundary, false otherwise
 */
export function isOutsideBoundary(
    x: number,
    z: number,
    y?: number,
    boundary: BoundaryConfig = shipBoundaryConfig,
): boolean {
    // Check X and Z bounds
    if (
        x < boundary.minX ||
        x > boundary.maxX ||
        z < boundary.minZ ||
        z > boundary.maxZ
    ) {
        return true
    }

    // Check Y bounds if specified
    if (boundary.minY !== undefined && y !== undefined && y < boundary.minY) {
        return true
    }
    if (boundary.maxY !== undefined && y !== undefined && y > boundary.maxY) {
        return true
    }

    return false
}

/**
 * Clamp a position to stay within the boundary
 * @param x - X coordinate
 * @param z - Z coordinate
 * @param y - Y coordinate (optional)
 * @param boundary - The boundary configuration
 * @returns Clamped position
 */
export function clampToBoundary(
    x: number,
    z: number,
    y?: number,
    boundary: BoundaryConfig = shipBoundaryConfig,
): { x: number; z: number; y?: number } {
    const clampedX = Math.max(boundary.minX, Math.min(boundary.maxX, x))
    const clampedZ = Math.max(boundary.minZ, Math.min(boundary.maxZ, z))
    let clampedY = y

    if (
        boundary.minY !== undefined &&
        y !== undefined &&
        clampedY !== undefined
    ) {
        clampedY = Math.max(boundary.minY, clampedY)
    }
    if (boundary.maxY !== undefined && clampedY !== undefined) {
        clampedY = Math.min(boundary.maxY, clampedY)
    }

    return {
        x: clampedX,
        z: clampedZ,
        ...(clampedY !== undefined && { y: clampedY }),
    }
}

/**
 * Find a random valid spawn position within the ship boundary, at a given distance from player
 * @param playerX - Player's X position
 * @param playerZ - Player's Z position
 * @param spawnDistance - Desired distance from player
 * @param maxAttempts - Maximum attempts to find a valid position
 * @returns Valid spawn position or null if none found
 */
export function findValidSpawnPositionInBoundary(
    playerX: number,
    playerZ: number,
    spawnDistance: number,
    maxAttempts: number = 50,
): { x: number; z: number } | null {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Generate random angle around player
        const angle = Math.random() * 2 * Math.PI
        const candidateX = playerX + Math.cos(angle) * spawnDistance
        const candidateZ = playerZ + Math.sin(angle) * spawnDistance

        // Check if this position is within ship boundary
        if (!isOutsideBoundary(candidateX, candidateZ)) {
            // Check if this position is not in a restricted zone
            const restrictedZone = getRestrictedZoneAt(candidateX, candidateZ)
            if (!restrictedZone) {
                return { x: candidateX, z: candidateZ }
            }
        }
    }

    // If we can't find a valid position at the exact distance, try to find any position in boundary
    // and adjust to maintain approximate distance
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Random position within the boundary
        const boundaryX =
            shipBoundaryConfig.minX +
            Math.random() * (shipBoundaryConfig.maxX - shipBoundaryConfig.minX)
        const boundaryZ =
            shipBoundaryConfig.minZ +
            Math.random() * (shipBoundaryConfig.maxZ - shipBoundaryConfig.minZ)

        // Check if this position is not in a restricted zone
        const restrictedZone = getRestrictedZoneAt(boundaryX, boundaryZ)
        if (!restrictedZone) {
            // Check if distance is reasonable (within 50% variance of desired distance)
            const distance = Math.sqrt(
                (boundaryX - playerX) ** 2 + (boundaryZ - playerZ) ** 2,
            )
            const minDistance = spawnDistance * 0.5
            const maxDistance = spawnDistance * 1.5

            if (distance >= minDistance && distance <= maxDistance) {
                return { x: boundaryX, z: boundaryZ }
            }
        }
    }

    return null
}
