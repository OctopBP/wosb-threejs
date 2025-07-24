// Island configuration based on islands.glb model data
export interface IslandData {
    position: { x: number; y: number; z: number }
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
