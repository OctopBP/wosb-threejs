// Simple test to verify camera system components
import { defaultCameraConfig } from './config/CameraConfig'

console.log('Testing camera configuration...')
console.log('Default config states:', Object.keys(defaultCameraConfig.states))
console.log('Player focus state:', defaultCameraConfig.states.playerFocus)
console.log('Enemy focus state:', defaultCameraConfig.states.enemyFocus)
console.log('Boss preview state:', defaultCameraConfig.states.bossPreview)
console.log('Cinematic state:', defaultCameraConfig.states.cinematic)

console.log('Screen shake presets:', Object.keys(defaultCameraConfig.screenShakePresets))
console.log('Zoom presets:', Object.keys(defaultCameraConfig.zoomPresets))

console.log('Camera system test completed successfully!')