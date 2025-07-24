// Island configuration based on islands.glb model data
export interface IslandData {
    // name: string
    position: { x: number; y: number; z: number }
    // scale: { x: number; y: number; z: number }
    collisionRadius: number
}

// Island positions extracted from islands.glb glTF file
export const ISLAND_DATA: IslandData[] = [
    {
        position: { x: 5, y: 0.01, z: -25 },
        collisionRadius: 15.0,
    },
    {
        position: { x: -25, y: 0.01, z: -38 },
        collisionRadius: 35.0,
    },
    {
        position: { x: 20, y: 0.01, z: -15 },
        collisionRadius: 20.0,
    },
    {
        position: { x: 52, y: 0.01, z: 22 },
        collisionRadius: 30.0,
    },
    {
        position: { x: -16, y: 0.01, z: 16 },
        collisionRadius: 10.0,
    },
    {
        position: { x: -22, y: 0.01, z: 54 },
        collisionRadius: 12.0,
    },
    {
        position: { x: 17, y: 0.01, z: 60 },
        collisionRadius: 10.0,
    },
    {
        position: { x: -65, y: 0.01, z: -30 },
        collisionRadius: 40.0,
    },
    {
        position: { x: -82, y: 0.01, z: 10 },
        collisionRadius: 40.0,
    },
    {
        position: { x: -80, y: 0.01, z: 48 },
        collisionRadius: 40.0,
    },
    {
        position: { x: 70, y: 0.01, z: 65 },
        collisionRadius: 40.0,
    },
    {
        position: { x: 45, y: 0.01, z: 100 },
        collisionRadius: 35.0,
    },
    {
        position: { x: 5, y: 0.01, z: 130 },
        collisionRadius: 60.0,
    },
    {
        position: { x: -30, y: 0.01, z: 100 },
        collisionRadius: 30.0,
    },
    {
        position: { x: -52, y: 0.01, z: 80 },
        collisionRadius: 20.0,
    },
]

// Grid configuration for pathfinding
export const PATHFINDING_CONFIG = {
    gridSize: 2.0, // Size of each grid cell in world units
    worldBounds: {
        minX: -80,
        maxX: 80,
        minZ: -40,
        maxZ: 120,
    },
    islandPadding: 2.0, // Extra padding around islands for safety
} as const

// Calculate grid dimensions
export const GRID_WIDTH = Math.ceil(
    (PATHFINDING_CONFIG.worldBounds.maxX -
        PATHFINDING_CONFIG.worldBounds.minX) /
        PATHFINDING_CONFIG.gridSize,
)
export const GRID_HEIGHT = Math.ceil(
    (PATHFINDING_CONFIG.worldBounds.maxZ -
        PATHFINDING_CONFIG.worldBounds.minZ) /
        PATHFINDING_CONFIG.gridSize,
)

// Grid cell types
export enum CellType {
    SEA = 0,
    ISLAND = 1,
}

// Convert world coordinates to grid coordinates
export function worldToGrid(
    worldX: number,
    worldZ: number,
): { x: number; z: number } {
    const gridX = Math.floor(
        (worldX - PATHFINDING_CONFIG.worldBounds.minX) /
            PATHFINDING_CONFIG.gridSize,
    )
    const gridZ = Math.floor(
        (worldZ - PATHFINDING_CONFIG.worldBounds.minZ) /
            PATHFINDING_CONFIG.gridSize,
    )
    return { x: gridX, z: gridZ }
}

// Convert grid coordinates to world coordinates (center of cell)
export function gridToWorld(
    gridX: number,
    gridZ: number,
): { x: number; z: number } {
    const worldX =
        PATHFINDING_CONFIG.worldBounds.minX +
        (gridX + 0.5) * PATHFINDING_CONFIG.gridSize
    const worldZ =
        PATHFINDING_CONFIG.worldBounds.minZ +
        (gridZ + 0.5) * PATHFINDING_CONFIG.gridSize
    return { x: worldX, z: worldZ }
}

// Check if grid coordinates are within bounds
export function isValidGridPosition(gridX: number, gridZ: number): boolean {
    return gridX >= 0 && gridX < GRID_WIDTH && gridZ >= 0 && gridZ < GRID_HEIGHT
}
