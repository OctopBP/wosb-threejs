import { CanvasTexture, Vector3 } from 'three'

/**
 * Create a smoke-like texture programmatically
 */
export function createSmokeTexture(size: number = 64): CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d')!
    
    // Create multiple layers of soft circles for a more organic smoke look
    context.clearRect(0, 0, size, size)
    
    const center = size / 2
    
    // Main circle with radial gradient
    const mainGradient = context.createRadialGradient(center, center, 0, center, center, center)
    mainGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
    mainGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)')
    mainGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)')
    mainGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    
    context.fillStyle = mainGradient
    context.fillRect(0, 0, size, size)
    
    // Add some noise/irregularity with smaller circles
    for (let i = 0; i < 8; i++) {
        const offsetX = (Math.random() - 0.5) * size * 0.3
        const offsetY = (Math.random() - 0.5) * size * 0.3
        const radius = size * (0.1 + Math.random() * 0.2)
        
        const noiseGradient = context.createRadialGradient(
            center + offsetX, center + offsetY, 0,
            center + offsetX, center + offsetY, radius
        )
        noiseGradient.addColorStop(0, `rgba(255, 255, 255, ${0.2 + Math.random() * 0.3})`)
        noiseGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
        
        context.fillStyle = noiseGradient
        context.beginPath()
        context.arc(center + offsetX, center + offsetY, radius, 0, Math.PI * 2)
        context.fill()
    }
    
    const texture = new CanvasTexture(canvas)
    return texture
}

/**
 * Create a spark/flash texture
 */
export function createSparkTexture(size: number = 32): CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d')!
    
    const center = size / 2
    
    // Create a bright center with sharp falloff
    const gradient = context.createRadialGradient(center, center, 0, center, center, center)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(0.1, 'rgba(255, 200, 100, 0.9)')
    gradient.addColorStop(0.3, 'rgba(255, 150, 50, 0.7)')
    gradient.addColorStop(0.7, 'rgba(255, 100, 0, 0.3)')
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)')
    
    context.fillStyle = gradient
    context.fillRect(0, 0, size, size)
    
    const texture = new CanvasTexture(canvas)
    return texture
}

/**
 * Calculate direction vector from shooter rotation
 */
export function getDirectionFromRotation(rotationY: number): Vector3 {
    const forwardX = Math.sin(rotationY)
    const forwardZ = Math.cos(rotationY)
    return new Vector3(forwardX, 0, forwardZ)
}

/**
 * Create a muzzle flash at weapon position
 */
export interface MuzzleFlashConfig {
    position: Vector3
    direction: Vector3
    intensity?: number
    size?: number
}

/**
 * Create gun smoke at weapon position
 */
export interface GunSmokeConfig {
    position: Vector3
    direction: Vector3
    amount?: number
    spread?: number
}