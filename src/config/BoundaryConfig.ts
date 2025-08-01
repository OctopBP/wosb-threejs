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
