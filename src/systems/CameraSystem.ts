import type { PerspectiveCamera } from 'three'
import { Vector3 } from 'three'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import type { 
    CameraStateComponent, 
    CameraTargetComponent, 
    PositionComponent,
    PlayerComponent,
    EnemyComponent
} from '../ecs/Component'
import type { CameraConfig, CameraState } from '../config/CameraConfig'
import { defaultCameraConfig } from '../config/CameraConfig'

// Easing functions for smooth transitions
const easingFunctions = {
    linear: (t: number) => t,
    easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeIn: (t: number) => t * t,
    easeOut: (t: number) => t * (2 - t)
}

export class CameraSystem extends System {
    private camera: PerspectiveCamera
    private config: CameraConfig
    private cameraEntityId: number | null = null
    private currentTargetId: number | null = null
    private isMobile: boolean

    constructor(world: World, camera: PerspectiveCamera, config: CameraConfig = defaultCameraConfig) {
        super(world)
        this.camera = camera
        this.config = config
        this.isMobile = this.detectMobile()
        
        // Create camera entity with state component
        this.initializeCameraEntity()
    }

    private detectMobile(): boolean {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    }

    private initializeCameraEntity(): void {
        // Create camera entity
        const cameraEntity = this.world.createEntity()
        this.cameraEntityId = cameraEntity.id

        // Add camera state component
        const initialState = this.config.states.playerFocus
        const cameraState: CameraStateComponent = {
            type: 'cameraState',
            currentState: 'playerFocus',
            targetState: 'playerFocus',
            transitionProgress: 1.0,
            transitionDuration: 0,
            transitionEasing: 'easeInOut',
            screenShake: {
                active: false,
                intensity: 0,
                frequency: 0,
                duration: 0,
                elapsedTime: 0,
                originalPosition: { x: 0, y: 0, z: 0 }
            },
            zoom: {
                active: false,
                targetFOV: initialState.fov,
                startFOV: initialState.fov,
                duration: 0,
                elapsedTime: 0
            },
            position: { ...initialState.position },
            target: { ...initialState.target },
            fov: initialState.fov
        }

        cameraEntity.addComponent(cameraState)
        
        // Apply initial camera state
        this.applyCameraState(cameraState)
    }

    update(deltaTime: number): void {
        if (!this.cameraEntityId) return

        const cameraEntity = this.world.getEntity(this.cameraEntityId)
        if (!cameraEntity) return
        const cameraState = cameraEntity.getComponent<CameraStateComponent>('cameraState')
        if (!cameraState) return

        // Update camera target
        this.updateCameraTarget(cameraState)

        // Update transitions
        this.updateTransitions(cameraState, deltaTime)

        // Update screen shake
        this.updateScreenShake(cameraState, deltaTime)

        // Update zoom
        this.updateZoom(cameraState, deltaTime)

        // Apply final camera state
        this.applyCameraState(cameraState)
    }

    private updateCameraTarget(cameraState: CameraStateComponent): void {
        // Find the highest priority camera target
        let highestPriority = -1
        let newTargetId: number | null = null

        for (const entity of this.world.getEntitiesWithComponent('cameraTarget')) {
            const targetComponent = entity.getComponent<CameraTargetComponent>('cameraTarget')
            if (targetComponent && targetComponent.priority > highestPriority) {
                highestPriority = targetComponent.priority
                newTargetId = entity.id
            }
        }

        // If target changed, transition to new target
        if (newTargetId !== this.currentTargetId) {
            this.currentTargetId = newTargetId
            if (newTargetId) {
                const targetEntity = this.world.getEntity(newTargetId)
                if (targetEntity) {
                    const targetComponent = targetEntity.getComponent<CameraTargetComponent>('cameraTarget')
                    if (targetComponent) {
                        this.transitionToTarget(newTargetId, targetComponent)
                    }
                }
            }
        }

        // Update camera position to follow current target
        if (this.currentTargetId) {
            this.followTarget(cameraState, this.currentTargetId)
        }
    }

    private followTarget(cameraState: CameraStateComponent, targetId: number): void {
        const targetEntity = this.world.getEntity(targetId)
        if (!targetEntity) return
        const targetPosition = targetEntity.getComponent<PositionComponent>('position')
        const targetComponent = targetEntity.getComponent<CameraTargetComponent>('cameraTarget')
        
        if (!targetPosition || !targetComponent) return

        // Calculate target position with offset
        const targetX = targetPosition.x + targetComponent.offset.x
        const targetY = targetPosition.y + targetComponent.offset.y
        const targetZ = targetPosition.z + targetComponent.offset.z

        // Apply mobile adjustments if needed
        const adjustments = this.isMobile ? this.config.global.mobileAdjustments : { fovMultiplier: 1, heightOffset: 0, distanceMultiplier: 1 }

        // Update camera target
        cameraState.target.x = targetX
        cameraState.target.y = targetY
        cameraState.target.z = targetZ

        // Update camera position based on current state
        const stateConfig = this.config.states[cameraState.currentState as keyof typeof this.config.states]
        if (stateConfig) {
            const adjustedPosition = {
                x: targetX + stateConfig.position.x * adjustments.distanceMultiplier,
                y: targetY + stateConfig.position.y + adjustments.heightOffset,
                z: targetZ + stateConfig.position.z * adjustments.distanceMultiplier
            }

            // Smoothly interpolate to new position
            const lerpFactor = 0.05 // Adjust for smoother/faster following
            cameraState.position.x += (adjustedPosition.x - cameraState.position.x) * lerpFactor
            cameraState.position.y += (adjustedPosition.y - cameraState.position.y) * lerpFactor
            cameraState.position.z += (adjustedPosition.z - cameraState.position.z) * lerpFactor
        }
    }

    private updateTransitions(cameraState: CameraStateComponent, deltaTime: number): void {
        if (cameraState.transitionProgress < 1.0) {
            cameraState.transitionProgress += deltaTime / cameraState.transitionDuration
            cameraState.transitionProgress = Math.min(cameraState.transitionProgress, 1.0)

            // Apply easing
            const easedProgress = easingFunctions[cameraState.transitionEasing](cameraState.transitionProgress)

            // Interpolate between states
            const currentState = this.config.states[cameraState.currentState as keyof typeof this.config.states]
            const targetState = this.config.states[cameraState.targetState as keyof typeof this.config.states]

            if (currentState && targetState) {
                cameraState.position.x = currentState.position.x + (targetState.position.x - currentState.position.x) * easedProgress
                cameraState.position.y = currentState.position.y + (targetState.position.y - currentState.position.y) * easedProgress
                cameraState.position.z = currentState.position.z + (targetState.position.z - currentState.position.z) * easedProgress
                cameraState.fov = currentState.fov + (targetState.fov - currentState.fov) * easedProgress
            }
        }
    }

    private updateScreenShake(cameraState: CameraStateComponent, deltaTime: number): void {
        if (!cameraState.screenShake.active) return

        cameraState.screenShake.elapsedTime += deltaTime

        if (cameraState.screenShake.elapsedTime >= cameraState.screenShake.duration) {
            // End screen shake
            cameraState.screenShake.active = false
            cameraState.position.x = cameraState.screenShake.originalPosition.x
            cameraState.position.y = cameraState.screenShake.originalPosition.y
            cameraState.position.z = cameraState.screenShake.originalPosition.z
        } else {
            // Apply screen shake
            const progress = cameraState.screenShake.elapsedTime / cameraState.screenShake.duration
            const intensity = cameraState.screenShake.intensity * (1 - progress) // Fade out over time
            
            const shakeX = Math.sin(cameraState.screenShake.elapsedTime * cameraState.screenShake.frequency) * intensity
            const shakeY = Math.cos(cameraState.screenShake.elapsedTime * cameraState.screenShake.frequency * 0.7) * intensity
            const shakeZ = Math.sin(cameraState.screenShake.elapsedTime * cameraState.screenShake.frequency * 1.3) * intensity

            cameraState.position.x = cameraState.screenShake.originalPosition.x + shakeX
            cameraState.position.y = cameraState.screenShake.originalPosition.y + shakeY
            cameraState.position.z = cameraState.screenShake.originalPosition.z + shakeZ
        }
    }

    private updateZoom(cameraState: CameraStateComponent, deltaTime: number): void {
        if (!cameraState.zoom.active) return

        cameraState.zoom.elapsedTime += deltaTime

        if (cameraState.zoom.elapsedTime >= cameraState.zoom.duration) {
            // End zoom
            cameraState.zoom.active = false
            cameraState.fov = cameraState.zoom.targetFOV
        } else {
            // Apply zoom
            const progress = cameraState.zoom.elapsedTime / cameraState.zoom.duration
            const easedProgress = easingFunctions.easeInOut(progress)
            
            cameraState.fov = cameraState.zoom.startFOV + (cameraState.zoom.targetFOV - cameraState.zoom.startFOV) * easedProgress
        }
    }

    private applyCameraState(cameraState: CameraStateComponent): void {
        // Apply position
        this.camera.position.set(cameraState.position.x, cameraState.position.y, cameraState.position.z)
        
        // Apply target (lookAt)
        this.camera.lookAt(new Vector3(cameraState.target.x, cameraState.target.y, cameraState.target.z))
        
        // Apply FOV
        this.camera.fov = cameraState.fov
        this.camera.updateProjectionMatrix()
    }

    // Public API methods

    public transitionToState(stateName: string, duration?: number): void {
        if (!this.cameraEntityId) return

        const cameraEntity = this.world.getEntity(this.cameraEntityId)
        if (!cameraEntity) return
        const cameraState = cameraEntity.getComponent<CameraStateComponent>('cameraState')
        if (!cameraState) return

        const targetState = this.config.states[stateName as keyof typeof this.config.states]
        if (!targetState) {
            console.warn(`Camera state "${stateName}" not found`)
            return
        }

        cameraState.targetState = stateName
        cameraState.currentState = cameraState.targetState
        cameraState.transitionProgress = 0.0
        cameraState.transitionDuration = duration || targetState.transitionDuration
        cameraState.transitionEasing = targetState.transitionEasing

        // Apply screen shake if configured
        if (targetState.screenShake) {
            this.triggerScreenShake(targetState.screenShake.intensity, targetState.screenShake.frequency, targetState.screenShake.duration)
        }

        // Apply zoom if configured
        if (targetState.zoom) {
            this.triggerZoom(targetState.zoom.targetFOV, targetState.zoom.duration)
        }
    }

    public transitionToTarget(targetId: number, targetComponent: CameraTargetComponent): void {
        const stateName = targetComponent.customCameraState || this.getDefaultStateForTargetType(targetComponent.targetType)
        this.transitionToState(stateName)
    }

    private getDefaultStateForTargetType(targetType: string): string {
        switch (targetType) {
            case 'player': return 'playerFocus'
            case 'enemy': return 'enemyFocus'
            case 'boss': return 'bossPreview'
            case 'cinematic': return 'cinematic'
            default: return 'playerFocus'
        }
    }

    public triggerScreenShake(intensity: number, frequency: number, duration: number): void {
        if (!this.cameraEntityId) return

        const cameraEntity = this.world.getEntity(this.cameraEntityId)
        if (!cameraEntity) return
        const cameraState = cameraEntity.getComponent<CameraStateComponent>('cameraState')
        if (!cameraState) return

        cameraState.screenShake.active = true
        cameraState.screenShake.intensity = intensity
        cameraState.screenShake.frequency = frequency
        cameraState.screenShake.duration = duration
        cameraState.screenShake.elapsedTime = 0
        cameraState.screenShake.originalPosition = { ...cameraState.position }
    }

    public triggerScreenShakePreset(presetName: keyof typeof this.config.screenShakePresets): void {
        const preset = this.config.screenShakePresets[presetName]
        if (preset) {
            this.triggerScreenShake(preset.intensity, preset.frequency, preset.duration)
        }
    }

    public triggerZoom(targetFOV: number, duration: number): void {
        if (!this.cameraEntityId) return

        const cameraEntity = this.world.getEntity(this.cameraEntityId)
        if (!cameraEntity) return
        const cameraState = cameraEntity.getComponent<CameraStateComponent>('cameraState')
        if (!cameraState) return

        cameraState.zoom.active = true
        cameraState.zoom.targetFOV = targetFOV
        cameraState.zoom.startFOV = cameraState.fov
        cameraState.zoom.duration = duration
        cameraState.zoom.elapsedTime = 0
    }

    public triggerZoomPreset(presetName: keyof typeof this.config.zoomPresets): void {
        const preset = this.config.zoomPresets[presetName]
        if (preset) {
            this.triggerZoom(preset.targetFOV, preset.duration)
        }
    }

    public addCameraTarget(entityId: number, targetType: 'player' | 'enemy' | 'boss' | 'cinematic', priority: number = 0, offset?: { x: number; y: number; z: number }): void {
        const cameraTarget = {
            type: 'cameraTarget',
            priority,
            targetType,
            offset: offset || { x: 0, y: 0, z: 0 }
        }
        const entity = this.world.getEntity(entityId)
        if (entity) {
            entity.addComponent(cameraTarget)
        }
    }

    public removeCameraTarget(entityId: number): void {
        const entity = this.world.getEntity(entityId)
        if (entity) {
            entity.removeComponent('cameraTarget')
        }
    }

    public getCurrentState(): string | null {
        if (!this.cameraEntityId) return null
        const cameraEntity = this.world.getEntity(this.cameraEntityId)
        if (!cameraEntity) return null
        const cameraState = cameraEntity.getComponent<CameraStateComponent>('cameraState')
        return cameraState?.currentState || null
    }

    public getCurrentTarget(): number | null {
        return this.currentTargetId
    }

    public updateConfig(newConfig: CameraConfig): void {
        this.config = newConfig
    }
}