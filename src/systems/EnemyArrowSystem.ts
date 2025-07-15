import type { Scene } from 'three'
import { ConeGeometry, Group, Mesh, MeshBasicMaterial } from 'three'
import type { EnemyArrowComponent, PositionComponent } from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class EnemyArrowSystem extends System {
    private scene: Scene

    constructor(world: World, scene: Scene) {
        super(world, ['enemyArrow', 'position'])
        this.scene = scene
    }

    update(_deltaTime: number): void {
        const entities = this.getEntities()

        for (const entity of entities) {
            const enemyArrow =
                entity.getComponent<EnemyArrowComponent>('enemyArrow')
            const position = entity.getComponent<PositionComponent>('position')

            if (!enemyArrow || !position) continue

            // Update enemy arrows if needed
            if (enemyArrow.showEnemyArrows) {
                this.updateEnemyArrows(entity.id, enemyArrow, position)
            } else {
                this.removeEnemyArrows(enemyArrow)
            }
        }
    }

    private updateEnemyArrows(
        entityId: number,
        enemyArrow: EnemyArrowComponent,
        position: PositionComponent,
    ): void {
        // Get all enemy entities
        const enemies = this.world.getEntitiesWithComponents([
            'enemy',
            'position',
        ])

        // Clear old arrows
        this.removeEnemyArrows(enemyArrow)
        enemyArrow.enemyArrows = []

        // Find closest enemies and create arrows
        const enemyDistances = enemies
            .map((enemy) => {
                const enemyPos =
                    enemy.getComponent<PositionComponent>('position')
                if (!enemyPos) return null

                const dx = enemyPos.x - position.x
                const dz = enemyPos.z - position.z
                const distance = Math.sqrt(dx * dx + dz * dz)

                return {
                    enemy,
                    distance,
                    direction: { x: dx, z: dz },
                }
            })
            .filter((item) => item !== null)

        // Sort by distance and take the closest ones up to maxArrows
        enemyDistances.sort((a, b) => a!.distance - b!.distance)
        const closestEnemies = enemyDistances.slice(0, enemyArrow.maxArrows)

        // Create arrows for closest enemies
        for (const enemyData of closestEnemies) {
            if (!enemyData) continue

            const arrow = this.createEnemyArrow(
                enemyData.direction,
                enemyData.distance,
                enemyArrow,
                position,
            )

            if (arrow) {
                enemyArrow.enemyArrows.push({
                    enemyId: enemyData.enemy.id,
                    arrowMesh: arrow,
                    direction: {
                        x: enemyData.direction.x / enemyData.distance, // Normalize
                        z: enemyData.direction.z / enemyData.distance,
                    },
                    distance: enemyData.distance,
                })
                this.scene.add(arrow)
            }
        }
    }

    private createEnemyArrow(
        direction: { x: number; z: number },
        distance: number,
        enemyArrow: EnemyArrowComponent,
        position: PositionComponent,
    ): Group | null {
        if (distance === 0) return null

        const group = new Group()

        // Create arrow using cone geometry
        const arrowGeometry = new ConeGeometry(0.3, 1.0, 8)
        const arrowMaterial = new MeshBasicMaterial({
            color: enemyArrow.arrowColor,
        })

        const arrow = new Mesh(arrowGeometry, arrowMaterial)

        // Position arrow at a fixed radius around the player
        const arrowRadius = 3.0 // Distance from player to place arrows
        const normalizedX = direction.x / distance
        const normalizedZ = direction.z / distance

        arrow.position.set(
            position.x + normalizedX * arrowRadius,
            position.y + 1.0, // Slightly above ground
            position.z + normalizedZ * arrowRadius,
        )

        // Calculate direction vector from player to enemy (already in direction parameter)
        // direction = enemy.position - player.position
        const directionX = direction.x
        const directionZ = direction.z

        // Calculate angle from direction vector
        // atan2(x, z) gives angle in XZ plane where Z is forward in Three.js
        const angle = Math.atan2(directionX, directionZ)

        // Rotate the cone to point horizontally toward the enemy
        // Cone points up by default (along Y axis)
        arrow.rotation.x = -Math.PI / 2 // Tip cone forward (negative to point outward)
        arrow.rotation.y = angle // Rotate around Y axis to point toward enemy

        // Scale arrow
        arrow.scale.setScalar(enemyArrow.arrowScale)

        group.add(arrow)
        return group
    }

    private removeEnemyArrows(enemyArrow: EnemyArrowComponent): void {
        for (const arrow of enemyArrow.enemyArrows) {
            if (arrow.arrowMesh) {
                this.scene.remove(arrow.arrowMesh)
            }
        }
        enemyArrow.enemyArrows = []
    }

    cleanup(): void {
        // Clean up all enemy arrow elements when system is destroyed
        const entities = this.getEntities()

        for (const entity of entities) {
            const enemyArrow =
                entity.getComponent<EnemyArrowComponent>('enemyArrow')
            if (enemyArrow) {
                this.removeEnemyArrows(enemyArrow)
            }
        }
    }
}
