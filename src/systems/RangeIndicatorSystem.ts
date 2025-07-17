import type { Scene } from 'three'
import {
    BufferAttribute,
    BufferGeometry,
    CircleGeometry,
    Group,
    LineBasicMaterial,
    LineLoop,
} from 'three'
import type {
    PositionComponent,
    RangeIndicatorComponent,
    WeaponComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class RangeIndicatorSystem extends System {
    private scene: Scene

    constructor(world: World, scene: Scene) {
        super(world, ['rangeIndicator', 'position'])
        this.scene = scene
    }

    update(_deltaTime: number): void {
        const entities = this.getEntities()

        for (const entity of entities) {
            const rangeIndicator =
                entity.getComponent<RangeIndicatorComponent>('rangeIndicator')
            const position = entity.getComponent<PositionComponent>('position')

            if (!rangeIndicator || !position) continue

            // Update range circle if needed
            if (rangeIndicator.showRangeCircle) {
                this.updateRangeCircle(entity.id, rangeIndicator, position)
            } else {
                this.removeRangeCircle(rangeIndicator)
            }
        }
    }

    private updateRangeCircle(
        entityId: number,
        rangeIndicator: RangeIndicatorComponent,
        position: PositionComponent,
    ): void {
        // Get weapon component to determine range
        const entity = this.world.getEntity(entityId)
        const weapon = entity?.getComponent<WeaponComponent>('weapon')

        if (!weapon) return

        const currentRadius = weapon.range

        // Create or update range circle
        if (
            !rangeIndicator.rangeCircleMesh ||
            rangeIndicator.rangeCircleRadius !== currentRadius
        ) {
            this.removeRangeCircle(rangeIndicator)
            rangeIndicator.rangeCircleMesh = this.createRangeCircle(
                currentRadius,
                rangeIndicator,
            )
            rangeIndicator.rangeCircleRadius = currentRadius
            this.scene.add(rangeIndicator.rangeCircleMesh)
        }

        // Update position
        if (rangeIndicator.rangeCircleMesh) {
            rangeIndicator.rangeCircleMesh.position.set(
                position.x,
                position.y,
                position.z,
            )
        }
    }

    private createRangeCircle(
        radius: number,
        rangeIndicator: RangeIndicatorComponent,
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
            color: rangeIndicator.rangeCircleColor,
            opacity: rangeIndicator.rangeCircleOpacity,
            transparent: true,
        })

        const circle = new LineLoop(lineGeometry, lineMaterial)
        circle.rotation.x = -Math.PI / 2 // Lay flat on the ground

        group.add(circle)
        return group
    }

    private removeRangeCircle(rangeIndicator: RangeIndicatorComponent): void {
        if (rangeIndicator.rangeCircleMesh) {
            this.scene.remove(rangeIndicator.rangeCircleMesh)
            rangeIndicator.rangeCircleMesh = undefined
        }
    }

    cleanup(): void {
        // Clean up all range indicator elements when system is destroyed
        const entities = this.getEntities()

        for (const entity of entities) {
            const rangeIndicator =
                entity.getComponent<RangeIndicatorComponent>('rangeIndicator')
            if (rangeIndicator) {
                this.removeRangeCircle(rangeIndicator)
            }
        }
    }
}
