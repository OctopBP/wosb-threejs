import {
    DataTexture,
    FloatType,
    Mesh,
    NearestFilter,
    OrthographicCamera,
    PlaneGeometry,
    RGBAFormat,
    Scene,
    ShaderMaterial,
    Vector2,
    type WebGLRenderer,
    WebGLRenderTarget,
} from 'three'
import type {
    PlayerComponent,
    PositionComponent,
    RenderableComponent,
} from '../ecs/Component'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

// Shader for drawing ship trails (white circles)
const trailVertexShader = `
    varying vec2 vUv;
    
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`

const trailFragmentShader = `
    uniform sampler2D uPreviousFrame;
    uniform vec2 uShipPositions[64];  // Support up to 64 ships
    uniform int uShipCount;
    uniform vec2 uTextureSize;
    uniform float uFadeAmount;
    uniform float uTrailRadius;
    uniform vec2 uWorldSize;
    
    varying vec2 vUv;
    
    void main() {
        // Sample previous frame
        vec4 previousColor = texture2D(uPreviousFrame, vUv);
        
        // Apply fade
        float fadedIntensity = max(0.0, previousColor.r - uFadeAmount);
        
        // Calculate world position from UV
        vec2 worldPos = (vUv - 0.5) * uWorldSize;
        
        // Add new ship trails
        float newTrail = 0.0;
        for(int i = 0; i < 64; i++) {
            if(i >= uShipCount) break;
            
            vec2 shipPos = uShipPositions[i];
            float distance = length(worldPos - shipPos);
            
            if(distance < uTrailRadius) {
                float intensity = 1.0 - (distance / uTrailRadius);
                newTrail = max(newTrail, intensity);
            }
        }
        
        // Combine faded previous trails with new trails
        float finalIntensity = max(fadedIntensity, newTrail);
        
        gl_FragColor = vec4(finalIntensity, finalIntensity, finalIntensity, 1.0);
    }
`

export class TrailTextureSystem extends System {
    private renderer: WebGLRenderer
    private renderTarget!: WebGLRenderTarget
    private renderTargetBack!: WebGLRenderTarget
    private trailScene!: Scene
    private trailCamera!: OrthographicCamera
    private trailMaterial!: ShaderMaterial
    private trailMesh!: Mesh
    private textureSize = 512
    private worldSize = new Vector2(100, 100) // World size that the texture covers
    private fadeAmount = 0.01 // How much to fade per frame
    private trailRadius = 2.0 // Radius of ship trail circles

    constructor(world: World, renderer: WebGLRenderer) {
        super(world, ['position'])
        this.renderer = renderer

        this.initializeRenderTargets()
        this.initializeTrailScene()
    }

    private initializeRenderTargets(): void {
        // Create two render targets for ping-pong rendering
        this.renderTarget = new WebGLRenderTarget(
            this.textureSize,
            this.textureSize,
            {
                format: RGBAFormat,
                type: FloatType,
                minFilter: NearestFilter,
                magFilter: NearestFilter,
                generateMipmaps: false,
            },
        )

        this.renderTargetBack = new WebGLRenderTarget(
            this.textureSize,
            this.textureSize,
            {
                format: RGBAFormat,
                type: FloatType,
                minFilter: NearestFilter,
                magFilter: NearestFilter,
                generateMipmaps: false,
            },
        )

        // Initialize with black texture
        const blackData = new Float32Array(
            this.textureSize * this.textureSize * 4,
        )
        for (let i = 0; i < blackData.length; i += 4) {
            blackData[i] = 0 // R
            blackData[i + 1] = 0 // G
            blackData[i + 2] = 0 // B
            blackData[i + 3] = 1 // A
        }

        const blackTexture = new DataTexture(
            blackData,
            this.textureSize,
            this.textureSize,
            RGBAFormat,
            FloatType,
        )
        blackTexture.needsUpdate = true

        // Clear both render targets to black
        const currentRenderTarget = this.renderer.getRenderTarget()
        this.renderer.setRenderTarget(this.renderTarget)
        this.renderer.clear()
        this.renderer.setRenderTarget(this.renderTargetBack)
        this.renderer.clear()
        this.renderer.setRenderTarget(currentRenderTarget)
    }

    private initializeTrailScene(): void {
        this.trailScene = new Scene()

        // Orthographic camera for full-screen quad
        this.trailCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)

        // Create trail material
        this.trailMaterial = new ShaderMaterial({
            vertexShader: trailVertexShader,
            fragmentShader: trailFragmentShader,
            uniforms: {
                uPreviousFrame: { value: null },
                uShipPositions: { value: [] },
                uShipCount: { value: 0 },
                uTextureSize: {
                    value: new Vector2(this.textureSize, this.textureSize),
                },
                uFadeAmount: { value: this.fadeAmount },
                uTrailRadius: { value: this.trailRadius },
                uWorldSize: { value: this.worldSize },
            },
        })

        // Create full-screen quad
        const geometry = new PlaneGeometry(2, 2)
        this.trailMesh = new Mesh(geometry, this.trailMaterial)
        this.trailScene.add(this.trailMesh)
    }

    update(_deltaTime: number): void {
        // Collect ship positions
        const shipPositions: Vector2[] = []
        const entities = this.getEntities()

        for (const entity of entities) {
            const position = entity.getComponent<PositionComponent>('position')
            const renderable =
                entity.getComponent<RenderableComponent>('renderable')

            if (!position || !renderable || !renderable.visible) continue

            // Check if this is a ship (player or enemy)
            const isPlayer = entity.hasComponent('player')
            const isEnemy = entity.hasComponent('enemy')

            if (isPlayer || isEnemy) {
                shipPositions.push(new Vector2(position.x, position.z))
            }
        }

        // Update shader uniforms
        this.trailMaterial.uniforms.uPreviousFrame.value =
            this.renderTargetBack.texture
        this.trailMaterial.uniforms.uShipPositions.value = shipPositions
        this.trailMaterial.uniforms.uShipCount.value = shipPositions.length

        // Render to the front render target
        const currentRenderTarget = this.renderer.getRenderTarget()
        this.renderer.setRenderTarget(this.renderTarget)
        this.renderer.render(this.trailScene, this.trailCamera)
        this.renderer.setRenderTarget(currentRenderTarget)

        // Swap render targets for next frame
        const temp = this.renderTarget
        this.renderTarget = this.renderTargetBack
        this.renderTargetBack = temp
    }

    // Get the current trail texture to use in water shader
    getTrailTexture() {
        return this.renderTargetBack.texture
    }

    // Get world size for shader calculations
    getWorldSize(): Vector2 {
        return this.worldSize
    }

    // Get/Set parameters for GUI controls
    getFadeAmount(): number {
        return this.fadeAmount
    }

    setFadeAmount(value: number): void {
        this.fadeAmount = value
        if (this.trailMaterial?.uniforms) {
            this.trailMaterial.uniforms.uFadeAmount.value = value
        }
    }

    getTrailRadius(): number {
        return this.trailRadius
    }

    setTrailRadius(value: number): void {
        this.trailRadius = value
        if (this.trailMaterial?.uniforms) {
            this.trailMaterial.uniforms.uTrailRadius.value = value
        }
    }

    // Debug visualization - create a mesh that shows the trail texture
    createDebugVisualization(): Mesh {
        const debugGeometry = new PlaneGeometry(20, 20)
        const debugMaterial = new ShaderMaterial({
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D uTrailTexture;
                varying vec2 vUv;
                void main() {
                    float intensity = texture2D(uTrailTexture, vUv).r;
                    gl_FragColor = vec4(intensity, intensity, intensity, 1.0);
                }
            `,
            uniforms: {
                uTrailTexture: { value: this.getTrailTexture() },
            },
        })

        const debugMesh = new Mesh(debugGeometry, debugMaterial)
        debugMesh.position.set(0, 5, 0)
        debugMesh.rotation.x = -Math.PI / 2
        debugMesh.name = 'TrailTextureDebug'

        return debugMesh
    }

    // Update debug visualization texture
    updateDebugVisualization(mesh: Mesh): void {
        if (mesh.material instanceof ShaderMaterial && mesh.material.uniforms) {
            mesh.material.uniforms.uTrailTexture.value = this.getTrailTexture()
        }
    }

    cleanup(): void {
        this.renderTarget?.dispose()
        this.renderTargetBack?.dispose()
        this.trailMaterial?.dispose()
        this.trailMesh?.geometry?.dispose()
    }
}
