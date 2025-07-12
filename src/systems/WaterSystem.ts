import type { Clock, Scene, ShaderMaterial } from 'three'
import { Mesh, PlaneGeometry } from 'three'
import { defaultWaterConfig, type WaterConfig } from '../config/WaterConfig'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import { createWaterMaterialFromConfig } from '../materials/WaterMaterial'

export class WaterSystem extends System {
    private scene: Scene
    private waterMesh: Mesh | null = null
    private waterMaterial: ShaderMaterial | null = null
    private clock: Clock
    private config: WaterConfig

    constructor(
        world: World,
        scene: Scene,
        clock: Clock,
        config?: Partial<WaterConfig>,
    ) {
        super(world, []) // No specific components needed
        this.scene = scene
        this.clock = clock

        // Merge provided config with defaults
        this.config = { ...defaultWaterConfig, ...config }

        this.createWaterSurface()
    }

    private createWaterSurface(): void {
        // Create detailed water geometry using config parameters
        const waterGeometry = new PlaneGeometry(
            this.config.waterSize,
            this.config.waterSize,
            this.config.geometrySegments,
            this.config.geometrySegments,
        )

        // Create water material using configuration
        this.waterMaterial = createWaterMaterialFromConfig(this.config)

        // Create water mesh
        this.waterMesh = new Mesh(waterGeometry, this.waterMaterial)
        this.waterMesh.rotation.x = -Math.PI / 2 // Rotate to be horizontal
        this.waterMesh.position.y = this.config.waterLevel
        this.waterMesh.name = 'water'
        this.waterMesh.receiveShadow = true

        // Add to scene
        this.scene.add(this.waterMesh)
    }

    update(_deltaTime: number): void {
        if (!this.waterMaterial) return

        // Update time uniform for animation
        this.waterMaterial.uniforms.uTime.value = this.clock.getElapsedTime()

        // Update animated uniforms based on config
        this.updateWaveAnimation()
        this.updateFoamAnimation()
    }

    private updateWaveAnimation(): void {
        if (!this.waterMaterial) return

        const time = this.clock.getElapsedTime()

        // Dynamic wave parameters based on config
        const baseSpeed = this.config.waveSpeed
        const baseAmplitude = this.config.waveAmplitude

        // Add subtle variation to wave parameters
        this.waterMaterial.uniforms.uWaveSpeed.value =
            baseSpeed + Math.sin(time * 0.5) * (baseSpeed * 0.2)
        this.waterMaterial.uniforms.uWaveAmplitude.value =
            baseAmplitude + Math.sin(time * 0.3) * (baseAmplitude * 0.3)
    }

    private updateFoamAnimation(): void {
        if (!this.waterMaterial) return

        const time = this.clock.getElapsedTime()

        // Animate foam threshold for dynamic foam patterns
        const baseThreshold = this.config.foamThreshold
        const animatedThreshold = baseThreshold + 0.02 * Math.sin(time * 2.0)
        this.waterMaterial.uniforms.uFoamThreshold.value = animatedThreshold
    }

    // Configuration methods
    getWaterLevel(): number {
        return this.config.waterLevel
    }

    setWaterLevel(level: number): void {
        this.config.waterLevel = level
        if (this.waterMaterial) {
            this.waterMaterial.uniforms.uWaterLevel.value = level
        }
        if (this.waterMesh) {
            this.waterMesh.position.y = level
        }
    }

    updateConfig(newConfig: Partial<WaterConfig>): void {
        // Update configuration
        this.config = { ...this.config, ...newConfig }

        // Update material uniforms
        if (this.waterMaterial) {
            this.waterMaterial.uniforms.uColorNear.value = this.config.colorNear
            this.waterMaterial.uniforms.uColorFar.value = this.config.colorFar
            this.waterMaterial.uniforms.uWaveSpeed.value = this.config.waveSpeed
            this.waterMaterial.uniforms.uWaveAmplitude.value =
                this.config.waveAmplitude
            this.waterMaterial.uniforms.uTextureSize.value =
                this.config.textureSize
            this.waterMaterial.uniforms.uWaterLevel.value =
                this.config.waterLevel
            this.waterMaterial.uniforms.uFoamDepth.value = this.config.foamDepth
        }

        // Update mesh position
        if (this.waterMesh) {
            this.waterMesh.position.y = this.config.waterLevel
        }
    }

    getConfig(): WaterConfig {
        return { ...this.config }
    }

    // Preset methods for easy configuration switching
    applyPreset(preset: WaterConfig): void {
        this.updateConfig(preset)
    }

    cleanup(): void {
        if (this.waterMesh) {
            this.scene.remove(this.waterMesh)

            // Dispose geometry and material
            if (this.waterMesh.geometry) {
                this.waterMesh.geometry.dispose()
            }
            if (this.waterMaterial) {
                this.waterMaterial.dispose()
            }

            this.waterMesh = null
            this.waterMaterial = null
        }
    }
}
