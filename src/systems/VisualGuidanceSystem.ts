import type { Scene } from 'three'
import {
    BufferAttribute,
    BufferGeometry,
    CircleGeometry,
    Color,
    ConeGeometry,
    Group,
    LineBasicMaterial,
    LineLoop,
    Mesh,
    MeshBasicMaterial,
    Vector3,
} from 'three'
import type {
    EnemyComponent,
    PositionComponent,
    VisualGuidanceComponent,
    WeaponComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class VisualGuidanceSystem extends System {
    private scene: Scene

    constructor(world: World, scene: Scene) {
        super(world, ['visualGuidance', 'position'])
        this.scene = scene
    }

    update(_deltaTime: number): void {
        const entities = this.getEntities()

        for (const entity of entities) {
            const visualGuidance =
                entity.getComponent<VisualGuidanceComponent>('visualGuidance')
            const position = entity.getComponent<PositionComponent>('position')

            if (!visualGuidance || !position) continue

            // Update range circle if needed
            if (visualGuidance.showRangeCircle) {
                this.updateRangeCircle(entity.id, visualGuidance, position)
            } else {
                this.removeRangeCircle(visualGuidance)
            }

            // Update enemy arrows if needed
            if (visualGuidance.showEnemyArrows) {
                this.updateEnemyArrows(entity.id, visualGuidance, position)
            } else {
                this.removeEnemyArrows(visualGuidance)
            }
        }
    }

    private updateRangeCircle(
        entityId: number,
        visualGuidance: VisualGuidanceComponent,
        position: PositionComponent,
    ): void {
        // Get weapon component to determine range
        const entity = this.world.getEntity(entityId)
        const weapon = entity?.getComponent<WeaponComponent>('weapon')

        if (!weapon) return

        const currentRadius = weapon.range

        // Create or update range circle
        if (
            !visualGuidance.rangeCircleMesh ||
            visualGuidance.rangeCircleRadius !== currentRadius
        ) {
            this.removeRangeCircle(visualGuidance)
            visualGuidance.rangeCircleMesh = this.createRangeCircle(
                currentRadius,
                visualGuidance,
            )
            visualGuidance.rangeCircleRadius = currentRadius
            this.scene.add(visualGuidance.rangeCircleMesh)
        }

        // Update position
        if (visualGuidance.rangeCircleMesh) {
            visualGuidance.rangeCircleMesh.position.set(
                position.x,
                position.y,
                position.z,
            )
        }
    }

    private updateEnemyArrows(
        entityId: number,
        visualGuidance: VisualGuidanceComponent,
        position: PositionComponent,
    ): void {
        // Get all enemy entities
        const enemies = this.world.getEntitiesWithComponents([
            'enemy',
            'position',
        ])

        // Clear old arrows
        this.removeEnemyArrows(visualGuidance)
        visualGuidance.enemyArrows = []

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
        const closestEnemies = enemyDistances.slice(0, visualGuidance.maxArrows)

        // Create arrows for closest enemies
        for (const enemyData of closestEnemies) {
            if (!enemyData) continue

            const arrow = this.createEnemyArrow(
                enemyData.direction,
                enemyData.distance,
                visualGuidance,
                position,
            )

            if (arrow) {
                visualGuidance.enemyArrows.push({
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

    private createRangeCircle(
        radius: number,
        visualGuidance: VisualGuidanceComponent,
    ): Group {
        const group = new Group()

        // Create circle outline using LineLoop for better performance
        const circleGeometry = new CircleGeometry(radius, 64)
        const vertices = circleGeometry.attributes.position.array

        // Extract just the perimeter vertices
        const perimeterVertices: number[] = []
        for (let i = 3; i < vertices.length; i += 3) {
            // Skip center vertex
            perimeterVertices.push(
                vertices[i],
                vertices[i + 1],
                vertices[i + 2],
            )
        }

        const lineGeometry = new BufferGeometry()
        lineGeometry.setAttribute(
            'position',
            new BufferAttribute(new Float32Array(perimeterVertices), 3),
        )

        const lineMaterial = new LineBasicMaterial({
            color: visualGuidance.rangeCircleColor,
            opacity: visualGuidance.rangeCircleOpacity,
            transparent: true,
        })

        const circle = new LineLoop(lineGeometry, lineMaterial)
        circle.rotation.x = -Math.PI / 2 // Lay flat on the ground

        group.add(circle)
        return group
    }

    private createEnemyArrow(
        direction: { x: number; z: number },
        distance: number,
        visualGuidance: VisualGuidanceComponent,
        position: PositionComponent,
    ): Group | null {
        if (distance === 0) return null

        const group = new Group()

        // Create arrow using cone geometry
        const arrowGeometry = new ConeGeometry(0.3, 1.0, 8)
        const arrowMaterial = new MeshBasicMaterial({
            color: visualGuidance.arrowColor,
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

        // Calculate the angle to point toward the enemy
        const angle = Math.atan2(normalizedX, normalizedZ)

        // Rotate the cone to point horizontally toward the enemy
        // Cone points up by default, so rotate it to point horizontally
        arrow.rotation.x = Math.PI / 2 // Point horizontally
        arrow.rotation.y = angle // Point toward enemy

        // Scale arrow
        arrow.scale.setScalar(visualGuidance.arrowScale)

        group.add(arrow)
        return group
    }

    private removeRangeCircle(visualGuidance: VisualGuidanceComponent): void {
        if (visualGuidance.rangeCircleMesh) {
            this.scene.remove(visualGuidance.rangeCircleMesh)
            visualGuidance.rangeCircleMesh = undefined
        }
    }

    private removeEnemyArrows(visualGuidance: VisualGuidanceComponent): void {
        for (const arrow of visualGuidance.enemyArrows) {
            if (arrow.arrowMesh) {
                this.scene.remove(arrow.arrowMesh)
            }
        }
        visualGuidance.enemyArrows = []
    }

    cleanup(): void {
        // Clean up all visual guidance elements when system is destroyed
        const entities = this.getEntities()

        for (const entity of entities) {
            const visualGuidance =
                entity.getComponent<VisualGuidanceComponent>('visualGuidance')
            if (visualGuidance) {
                this.removeRangeCircle(visualGuidance)
                this.removeEnemyArrows(visualGuidance)
            }
        }
    }
}
