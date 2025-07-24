// Island configuration based on islands.glb model data
export interface IslandData {
    name: string
    position: { x: number; y: number; z: number }
    rotation?: { x: number; y: number; z: number; w: number }
    scale: { x: number; y: number; z: number }
    collisionRadius: number
}

// Island positions extracted from islands.glb glTF file
export const ISLAND_DATA: IslandData[] = [
    {
        name: 's4',
        position: { x: -32.89, y: 0.01, z: -20.77 },
        rotation: { x: 0.0, y: -0.918339252, z: 0.0, w: -0.395794153 },
        scale: { x: 1.0, y: 1.0, z: 1.0 },
        collisionRadius: 8.0,
    },
    {
        name: 's1',
        position: { x: 44.85, y: 0.01, z: -10.71 },
        rotation: { x: 0.0, y: 0.5945439, z: 0.0, w: 0.8040632 },
        scale: { x: 1.0, y: 1.0, z: 1.0 },
        collisionRadius: 8.0,
    },
    {
        name: 's2',
        position: { x: 37.33, y: 0.01, z: 81.77 },
        rotation: { x: 0.0, y: -0.06110829, z: 0.0, w: 0.998131156 },
        scale: { x: 1.0, y: 1.0, z: 1.0 },
        collisionRadius: 8.0,
    },
    {
        name: 's3',
        position: { x: -28.63, y: 0.01, z: 48.69 },
        rotation: { x: 0.0, y: 0.3904391, z: 0.0, w: 0.9206288 },
        scale: { x: 1.0, y: 1.0, z: 1.0 },
        collisionRadius: 8.0,
    },
    {
        name: 'm_1',
        position: { x: 42.5, y: 0.06, z: -3.95 },
        rotation: { x: 0.0, y: -0.168478966, z: 0.0, w: 0.985705256 },
        scale: { x: 1.58, y: 1.0, z: 1.58 },
        collisionRadius: 12.0,
    },
    {
        name: 'm2',
        position: { x: 42.89, y: 0.06, z: 62.39 },
        rotation: { x: 0.0, y: -0.730440259, z: 0.0, w: 0.682976544 },
        scale: { x: 2.24, y: 1.0, z: 1.58 },
        collisionRadius: 15.0,
    },
    {
        name: 'm3',
        position: { x: -49.31, y: 0.0, z: 46.45 },
        rotation: { x: 0.0, y: 0.7446364, z: 0.0, w: 0.667470336 },
        scale: { x: 2.44, y: 2.44, z: 2.44 },
        collisionRadius: 18.0,
    },
    {
        name: 'm4',
        position: { x: -42.12, y: 0.0, z: -8.83 },
        rotation: { x: 0.0, y: -0.968601346, z: 0.0, w: 0.24861902 },
        scale: { x: 2.44, y: 2.44, z: 2.44 },
        collisionRadius: 18.0,
    },
]

// Grid configuration for pathfinding
export const PATHFINDING_CONFIG = {
    gridSize: 2.0, // Size of each grid cell in world units
    worldBounds: {
        minX: -80,
        maxX: 80,
        minZ: -40,
        maxZ: 100,
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
