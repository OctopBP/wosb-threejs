import type { PerspectiveCamera } from 'three'
import { Vector3 } from 'three'
import type { CameraTargetComponent, PositionComponent } from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class CameraSystem extends System {
    private camera: PerspectiveCamera
    private currentTargetId: number | null = null
    private lerpFactor: number = 0.05
    private currentPosition: Vector3 = new Vector3()
    private currentTarget: Vector3 = new Vector3()

    constructor(
        world: World,
        camera: PerspectiveCamera,
        lerpFactor: number = 0.05,
    ) {
        super(world)
        this.camera = camera
        this.lerpFactor = lerpFactor

        // Initialize camera position
        this.currentPosition.copy(camera.position)
        this.currentTarget.set(0, 0, 0)
    }

    update(): void {
        // Find the highest priority camera target
        this.updateCurrentTarget()

        // Follow the current target if one exists
        if (this.currentTargetId) {
            this.followTarget()
        }

        // Apply the camera position and target
        this.applyCamera()
    }

    private updateCurrentTarget(): void {
        let highestPriority = -1
        let newTargetId: number | null = null

        for (const entity of this.world.getEntitiesWithComponent(
            'cameraTarget',
        )) {
            const targetComponent =
                entity.getComponent<CameraTargetComponent>('cameraTarget')
            if (targetComponent && targetComponent.priority > highestPriority) {
                highestPriority = targetComponent.priority
                newTargetId = entity.id
            }
        }

        this.currentTargetId = newTargetId
    }

    private followTarget(): void {
        if (!this.currentTargetId) return

        const targetEntity = this.world.getEntity(this.currentTargetId)
        if (!targetEntity) return

        const targetPosition =
            targetEntity.getComponent<PositionComponent>('position')
        const targetComponent =
            targetEntity.getComponent<CameraTargetComponent>('cameraTarget')

        if (!targetPosition || !targetComponent) return

        // Calculate target position with offset
        const targetPos = new Vector3(
            targetPosition.x + targetComponent.offset.x,
            targetPosition.y + targetComponent.offset.y,
            targetPosition.z + targetComponent.offset.z,
        )

        // Calculate camera position (target position + camera offset)
        const cameraPos = new Vector3(
            targetPos.x + (targetComponent.cameraOffset?.x || 0),
            targetPos.y + (targetComponent.cameraOffset?.y || 10),
            targetPos.z + (targetComponent.cameraOffset?.z || 10),
        )

        // Lerp to the new positions
        this.currentPosition.lerp(cameraPos, this.lerpFactor)
        this.currentTarget.lerp(targetPos, this.lerpFactor)
    }

    private applyCamera(): void {
        this.camera.position.copy(this.currentPosition)
        this.camera.lookAt(this.currentTarget)
        this.camera.updateProjectionMatrix()
    }

    // Public API methods
    public setTarget(entityId: number): void {
        this.currentTargetId = entityId
    }

    public addCameraTarget(
        entityId: number,
        priority: number = 0,
        offset?: { x: number; y: number; z: number },
        cameraOffset?: { x: number; y: number; z: number },
    ): void {
        const entity = this.world.getEntity(entityId)
        if (entity) {
            const cameraTarget: CameraTargetComponent = {
                type: 'cameraTarget',
                priority,
                targetType: 'generic',
                offset: offset || { x: 0, y: 0, z: 0 },
                cameraOffset: cameraOffset || { x: 0, y: 10, z: 10 },
            }
            entity.addComponent(cameraTarget)
        }
    }

    public removeCameraTarget(entityId: number): void {
        const entity = this.world.getEntity(entityId)
        if (entity) {
            entity.removeComponent('cameraTarget')
        }
    }

    public getCurrentTarget(): number | null {
        return this.currentTargetId
    }

    public setLerpFactor(factor: number): void {
        this.lerpFactor = Math.max(0.001, Math.min(1, factor))
    }

    public getLerpFactor(): number {
        return this.lerpFactor
    }
}
