import * as THREE from 'three'
import type { World } from '../ecs'
import type {
    AliveComponent,
    FoamTrailComponent,
    PositionComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'

const PROCEDURAL_TEXTURE_CONFIG = {
    textureSize: 512,
    waterSize: 200,
    spotRadius: 0.004, // in UV space
    fadeValue: 1, // 0-255, higher = faster fade
}

export class ProceduralTextureSystem extends System {
    private texture: THREE.Texture
    private canvas: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D
    private size: number

    constructor(world: World) {
        super(world, ['position', 'foamTrail', 'alive'])

        this.size = PROCEDURAL_TEXTURE_CONFIG.textureSize
        this.canvas = document.createElement('canvas')
        this.canvas.width = this.canvas.height = this.size
        const ctx = this.canvas.getContext('2d', {
            // Frequent getImageData readbacks benefit from this flag
            // See https://html.spec.whatwg.org/multipage/canvas.html#concept-canvas-will-read-frequently
            willReadFrequently: true,
        } as CanvasRenderingContext2DSettings)
        if (!ctx) {
            throw new Error('Failed to get canvas context')
        }
        this.ctx = ctx
        this.texture = new THREE.Texture(this.canvas)
        this.texture.needsUpdate = true
        this.texture.wrapS = this.texture.wrapT = THREE.RepeatWrapping
        this.clearToBlack()
    }

    private clearToBlack() {
        this.ctx.fillStyle = 'black'
        this.ctx.fillRect(0, 0, this.size, this.size)
    }

    private worldToUV(x: number, z: number): { u: number; v: number } {
        // Map world X/Z to [0,1] UV (water is waterSize x waterSize, centered at waterCenterX, waterCenterZ)
        const u =
            (x + PROCEDURAL_TEXTURE_CONFIG.waterSize / 2) /
            PROCEDURAL_TEXTURE_CONFIG.waterSize
        const v =
            (z + PROCEDURAL_TEXTURE_CONFIG.waterSize / 2) /
            PROCEDURAL_TEXTURE_CONFIG.waterSize
        return { u, v }
    }

    private drawWhiteSpot(u: number, v: number, radius: number) {
        // radius in UV space (0-1), convert to pixels
        const px = u * this.size
        const py = v * this.size
        const pr = radius * this.size
        this.ctx.beginPath()
        this.ctx.arc(px, py, pr, 0, Math.PI * 2)
        this.ctx.fillStyle = 'white'
        this.ctx.fill()
    }

    update(): void {
        // True per-pixel fade: subtract a value from each pixel's RGB
        const fadeValue = PROCEDURAL_TEXTURE_CONFIG.fadeValue
        const imageData = this.ctx.getImageData(0, 0, this.size, this.size)
        const data = imageData.data
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.max(0, data[i] - fadeValue) // R
            data[i + 1] = Math.max(0, data[i + 1] - fadeValue) // G
            data[i + 2] = Math.max(0, data[i + 2] - fadeValue) // B
            // Alpha stays 255
        }
        this.ctx.putImageData(imageData, 0, 0)

        for (const entity of this.getEntities()) {
            const alive = entity.getComponent<AliveComponent>('alive')
            if (!alive) {
                continue
            }

            const foamTrail =
                entity.getComponent<FoamTrailComponent>('foamTrail')
            const position = entity.getComponent<PositionComponent>('position')

            if (!position || !foamTrail) {
                continue
            }

            const { u, v } = this.worldToUV(position.x, position.z)
            if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
                this.drawWhiteSpot(u, v, foamTrail.size)
            }
        }
        this.texture.needsUpdate = true
    }

    getTexture(): THREE.Texture {
        return this.texture
    }
}
