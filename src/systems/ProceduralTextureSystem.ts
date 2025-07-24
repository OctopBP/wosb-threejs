import * as THREE from 'three'
import type { World } from '../ecs'

import type { PositionComponent } from '../ecs/Component'
import { System } from '../ecs/System'

const WATER_SIZE = 150
const WATER_CENTER_X = 0
const WATER_CENTER_Z = 35

export class ProceduralTextureSystem extends System {
    private texture: THREE.Texture
    private canvas: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D
    private size: number

    constructor(world: World) {
        super(world, ['position'])

        this.size = 512
        this.canvas = document.createElement('canvas')
        this.canvas.width = this.canvas.height = this.size
        const ctx = this.canvas.getContext('2d')
        if (!ctx) throw new Error('Failed to get canvas context')
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
        // Map world X/Z to [0,1] UV (water is 150x150, centered at 0,0,35)
        const u = (x - (WATER_CENTER_X - WATER_SIZE / 2)) / WATER_SIZE
        const v = (z - (WATER_CENTER_Z - WATER_SIZE / 2)) / WATER_SIZE
        return { u, v }
    }

    private drawWhiteSpot(u: number, v: number, radius: number = 0.004) {
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
        const fadeValue = 1 // 0-255, higher = faster fade
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
            if (
                entity.hasComponent('player') ||
                entity.hasComponent('enemy') ||
                entity.hasComponent('boss')
            ) {
                const position =
                    entity.getComponent<PositionComponent>('position')

                if (!position) {
                    continue
                }

                const { u, v } = this.worldToUV(position.x, position.z)
                // Only draw if within [0,1] range
                if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
                    this.drawWhiteSpot(u, v)
                }
            }
        }
        this.texture.needsUpdate = true
    }

    getTexture(): THREE.Texture {
        return this.texture
    }
}
