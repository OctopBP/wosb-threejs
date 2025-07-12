import type { Clock, Scene, ShaderMaterial } from 'three'
import { Color, Mesh, PlaneGeometry } from 'three'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import { createWaterMaterial } from '../materials/WaterMaterial'

export class WaterSystem extends System {
    private scene: Scene
    private waterMesh: Mesh | null = null
    private waterMaterial: ShaderMaterial | null = null
    private clock: Clock
    private waterLevel: number = 0.8
    private waterSize: number = 200

    constructor(world: World, scene: Scene, clock: Clock) {
        super(world, []) // No specific components needed
        this.scene = scene
        this.clock = clock
        this.createWaterSurface()
    }

    private createWaterSurface(): void {
        // Create water geometry - large plane with high subdivision for wave animation
        const waterGeometry = new PlaneGeometry(
            this.waterSize,
            this.waterSize,
            128,
            128,
        )

        // Create water material with cartoon-style shader
        this.waterMaterial = createWaterMaterial({
            waterLevel: this.waterLevel,
            colorNear: new Color('#00fccd'),
            colorFar: new Color('#0066cc'),
            waveSpeed: 1.2,
            waveAmplitude: 0.1,
            textureSize: 50,
            foamDepth: 0.08,
        })

        // Create water mesh
        this.waterMesh = new Mesh(waterGeometry, this.waterMaterial)
        this.waterMesh.rotation.x = -Math.PI / 2 // Rotate to be horizontal
        this.waterMesh.position.y = this.waterLevel
        this.waterMesh.name = 'water'

        // Add to scene
        this.scene.add(this.waterMesh)
    }

    update(_deltaTime: number): void {
        if (!this.waterMaterial) return

        // Update time uniform for animation
        this.waterMaterial.uniforms.uTime.value = this.clock.getElapsedTime()

        // Update other animated uniforms
        this.updateWaveAnimation()
        this.updateFoamAnimation()
    }

    private updateWaveAnimation(): void {
        if (!this.waterMaterial) return

        const time = this.clock.getElapsedTime()

        // Update wave parameters for dynamic animation
        this.waterMaterial.uniforms.uWaveSpeed.value =
            1.2 + Math.sin(time * 0.5) * 0.3
        this.waterMaterial.uniforms.uWaveAmplitude.value =
            0.1 + Math.sin(time * 0.3) * 0.05
    }

    private updateFoamAnimation(): void {
        if (!this.waterMaterial) return

        const time = this.clock.getElapsedTime()

        // Animate foam threshold for dynamic foam patterns
        const baseThreshold = 0.6
        const animatedThreshold = baseThreshold + 0.02 * Math.sin(time * 2.0)
        this.waterMaterial.uniforms.uFoamThreshold.value = animatedThreshold
    }

    getWaterLevel(): number {
        return this.waterLevel
    }

    setWaterLevel(level: number): void {
        this.waterLevel = level
        if (this.waterMaterial) {
            this.waterMaterial.uniforms.uWaterLevel.value = level
        }
        if (this.waterMesh) {
            this.waterMesh.position.y = level
        }
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
