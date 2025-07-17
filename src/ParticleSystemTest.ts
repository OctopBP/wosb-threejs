import { Vector3 } from 'three'
import { createExplosionEffect, addThrustEffect } from './entities/ParticleFactory'
import type { GameWorld } from './GameWorld'

/**
 * Test function to verify particle system is working
 * Call this from your game to test particle effects
 */
export function testParticleSystem(gameWorld: GameWorld): void {
    console.log('🎆 Testing particle system...')
    
    // Test 1: Create explosion at origin
    const explosionPos = new Vector3(0, 2, 0)
    createExplosionEffect(gameWorld['world'], explosionPos, 1.5)
    console.log('✨ Created explosion effect at origin')
    
    // Test 2: Create explosion to the right
    setTimeout(() => {
        const rightPos = new Vector3(5, 2, 0)
        createExplosionEffect(gameWorld['world'], rightPos, 2.0)
        console.log('💥 Created larger explosion to the right')
    }, 1000)
    
    // Test 3: Create explosion to the left
    setTimeout(() => {
        const leftPos = new Vector3(-5, 2, 0)
        createExplosionEffect(gameWorld['world'], leftPos, 1.0)
        console.log('🔥 Created explosion to the left')
    }, 2000)
    
    // Test 4: Add thrust to player if available
    setTimeout(() => {
        const player = gameWorld.getPlayerEntity()
        if (player) {
            addThrustEffect(player, 1.2)
            console.log('🚀 Added thrust effect to player')
            
            // Remove thrust after 3 seconds
            setTimeout(() => {
                const thrustParticle = player.getComponent('particle')
                if (thrustParticle) {
                    player.removeComponent('particle')
                    console.log('⭐ Removed thrust effect from player')
                }
            }, 3000)
        }
    }, 3000)
    
    console.log('🎭 Particle test sequence started! Watch for effects over 6 seconds.')
}

/**
 * Add this to your main game loop or call from console to test
 * Example usage in AppOne.ts or GameWorld.ts:
 * 
 * import { testParticleSystem } from './ParticleSystemTest'
 * 
 * // In your game initialization or after a key press:
 * testParticleSystem(this.gameWorld)
 */