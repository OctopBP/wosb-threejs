export interface EnemyAIConfig {
    rayCasting: {
        maxRayDistance: number
        rayStep: number
        angleStep: number
        maxAngleAttempts: number
    }
}

export const enemyAIConfig: EnemyAIConfig = {
    rayCasting: {
        maxRayDistance: 50, // Maximum distance to check for obstacles
        rayStep: 0.5, // Check every 0.5 units along the ray
        angleStep: Math.PI / 8, // 22.5 degrees between ray attempts
        maxAngleAttempts: 16, // Try up to 16 different angles
    },
}
