import type { PerspectiveCamera } from 'three'
import { Vector3 } from 'three'
import type { CameraTargetComponent, PositionComponent } from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class CameraSystem extends System {
    private camera: PerspectiveCamera
    private currentTargetId: number | null = null
    private currentPosition: Vector3 = new Vector3()
    private currentTarget: Vector3 = new Vector3()

    constructor(world: World, camera: PerspectiveCamera) {
        super(world)
        this.camera = camera

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
        if (!this.currentTargetId) {
            return
        }

        const targetEntity = this.world.getEntity(this.currentTargetId)
        if (!targetEntity) {
            return
        }

        const targetPosition =
            targetEntity.getComponent<PositionComponent>('position')
        const targetComponent =
            targetEntity.getComponent<CameraTargetComponent>('cameraTarget')

        if (!targetPosition || !targetComponent) {
            return
        }

        // Calculate target position with offset
        const targetPos = new Vector3(
            targetPosition.x + targetComponent.offset.x,
            targetPosition.y + targetComponent.offset.y,
            targetPosition.z + targetComponent.offset.z,
        )

        // Lerp to the new positions
        this.currentPosition.lerp(targetPos, targetComponent.lerpFactor)
        this.currentTarget.lerp(targetPosition, targetComponent.lerpFactor)
    }

    private applyCamera(): void {
        this.camera.position.copy(this.currentPosition)
        this.camera.lookAt(this.currentTarget)
        this.camera.updateProjectionMatrix()
    }

    public getCurrentState(): string | null {
        if (!this.currentTargetId) {
            return 'No Target'
        }

        const targetEntity = this.world.getEntity(this.currentTargetId)
        if (!targetEntity) {
            return 'Invalid Target'
        }

        const targetComponent =
            targetEntity.getComponent<CameraTargetComponent>('cameraTarget')
        return targetComponent
            ? `Following (ID: ${this.currentTargetId})`
            : 'Unknown Target'
    }
}
