import {
    Vector3,
    Vector2,
    Texture,
    ShaderMaterial,
    UniformsUtils,
    UniformsLib,
    Color,
    FrontSide,
    Matrix4,
    PerspectiveCamera,
    Vector4,
    LinearFilter,
    RGBAFormat,
    WebGLRenderTarget,
    PlaneGeometry,
    Mesh,
    Scene,
    TextureLoader,
    Plane
} from 'three'
import type { Camera, WebGLRenderer, Side } from 'three'

const WaterShader = {
    uniforms: {
        ...UniformsLib.fog,
        normalSampler: { value: null },
        mirrorSampler: { value: null },
        alpha: { value: 1.0 },
        time: { value: 0.0 },
        size: { value: 1.0 },
        distortionScale: { value: 20.0 },
        textureMatrix: { value: new Matrix4() },
        sunColor: { value: new Color(0x7F7F7F) },
        sunDirection: { value: new Vector3(0.70707, 0.70707, 0) },
        eye: { value: new Vector3() },
        waterColor: { value: new Color(0x555555) }
    },

    vertexShader: /* glsl */ `
        uniform mat4 textureMatrix;
        uniform float time;

        varying vec4 mirrorCoord;
        varying vec4 worldPosition;

        #include <common>
        #include <fog_pars_vertex>
        #include <shadowmap_pars_vertex>
        #include <logdepthbuf_pars_vertex>

        void main() {
            mirrorCoord = modelMatrix * vec4( position, 1.0 );
            worldPosition = mirrorCoord.xyzw;
            mirrorCoord = textureMatrix * mirrorCoord;
            
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            gl_Position = projectionMatrix * mvPosition;

            #include <beginnormal_vertex>
            #include <defaultnormal_vertex>
            #include <logdepthbuf_vertex>
            #include <fog_vertex>
            #include <shadowmap_vertex>
        }
    `,

    fragmentShader: /* glsl */ `
        uniform sampler2D mirrorSampler;
        uniform float alpha;
        uniform float time;
        uniform float size;
        uniform float distortionScale;
        uniform sampler2D normalSampler;
        uniform vec3 sunColor;
        uniform vec3 sunDirection;
        uniform vec3 eye;
        uniform vec3 waterColor;

        varying vec4 mirrorCoord;
        varying vec4 worldPosition;

        vec4 getNoise( vec2 uv ) {
            vec2 uv0 = ( uv / 103.0 ) + vec2(time / 17.0, time / 29.0);
            vec2 uv1 = uv / 107.0-vec2( time / -19.0, time / 31.0 );
            vec2 uv2 = uv / vec2( 8907.0, 9803.0 ) + vec2( time / 101.0, time / 97.0 );
            vec2 uv3 = uv / vec2( 1091.0, 1027.0 ) - vec2( time / 109.0, time / -113.0 );
            
            vec4 noise = texture2D( normalSampler, uv0 ) +
                        texture2D( normalSampler, uv1 ) +
                        texture2D( normalSampler, uv2 ) +
                        texture2D( normalSampler, uv3 );
            return noise * 0.5 - 1.0;
        }

        void sunLight( const vec3 surfaceNormal, const vec3 eyeDirection, float shiny, float spec, float diffuse, inout vec3 diffuseColor, inout vec3 specularColor ) {
            vec3 reflection = normalize( reflect( -sunDirection, surfaceNormal ) );
            float direction = max( 0.0, dot( eyeDirection, reflection ) );
            specularColor += pow( direction, shiny ) * sunColor * spec;
            diffuseColor += max( dot( sunDirection, surfaceNormal ), 0.0 ) * sunColor * diffuse;
        }

        #include <common>
        #include <packing>
        #include <bsdfs>
        #include <fog_pars_fragment>
        #include <logdepthbuf_pars_fragment>
        #include <lights_pars_begin>
        #include <shadowmap_pars_fragment>
        #include <shadowmask_pars_fragment>

        void main() {
            #include <logdepthbuf_fragment>
            vec4 noise = getNoise( worldPosition.xz * size );
            vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );

            vec3 diffuseLight = vec3(0.0);
            vec3 specularLight = vec3(0.0);

            vec3 worldToEye = eye - worldPosition.xyz;
            vec3 eyeDirection = normalize( worldToEye );
            
            sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );

            float distance = length(worldToEye);

            vec2 distortion = surfaceNormal.xz * ( 0.001 + 1.0 / distance ) * distortionScale;
            vec3 reflectionSample = vec3( texture2D( mirrorSampler, mirrorCoord.xy / mirrorCoord.w + distortion ) );

            float theta = max( dot( eyeDirection, surfaceNormal ), 0.0 );
            float rf0 = 0.3;
            float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );
            
            vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) ) * waterColor;
            vec3 albedo = mix( ( sunColor * diffuseLight * 0.3 + scatter ) * getShadowMask(), ( vec3( 0.1 ) + reflectionSample * 0.9 + reflectionSample * specularLight ), reflectance);
            vec3 outgoingLight = albedo;
            
            gl_FragColor = vec4( outgoingLight, alpha );

            #include <tonemapping_fragment>
            #include <fog_fragment>
        }
    `
}

export interface WaterMaterialOptions {
    textureWidth?: number
    textureHeight?: number
    waterNormals?: Texture
    sunDirection?: Vector3
    sunColor?: Color
    waterColor?: Color
    eye?: Vector3
    distortionScale?: number
    side?: Side
    fog?: boolean
}

export class WaterMaterial extends ShaderMaterial {
    public mirrorCamera: PerspectiveCamera
    public renderTarget: WebGLRenderTarget
    public matrixWorld: Matrix4 = new Matrix4()
    public mirrorWorldPosition: Vector3 = new Vector3()
    public cameraWorldPosition: Vector3 = new Vector3()
    public rotationMatrix: Matrix4 = new Matrix4()
    public lookAtPosition: Vector3 = new Vector3(0, 0, -1)
    public clipPlane: Vector4 = new Vector4()
    public view: Vector3 = new Vector3()
    public target: Vector3 = new Vector3()
    public q: Vector4 = new Vector4()
    public textureMatrix: Matrix4 = new Matrix4()
    private plane: Plane = new Plane()

    constructor(options: WaterMaterialOptions = {}) {
        super()

        this.setValues({
            vertexShader: WaterShader.vertexShader,
            fragmentShader: WaterShader.fragmentShader,
            uniforms: UniformsUtils.clone(WaterShader.uniforms),
            transparent: true,
            side: options.side || FrontSide,
            fog: options.fog !== false
        })

        const textureWidth = options.textureWidth || 512
        const textureHeight = options.textureHeight || 512

        this.renderTarget = new WebGLRenderTarget(textureWidth, textureHeight, {
            format: RGBAFormat,
            minFilter: LinearFilter,
            magFilter: LinearFilter
        })

        this.mirrorCamera = new PerspectiveCamera()

        // Set uniforms
        this.uniforms.mirrorSampler.value = this.renderTarget.texture
        this.uniforms.textureMatrix.value = this.textureMatrix
        this.uniforms.alpha.value = 1.0
        this.uniforms.time.value = 0.0
        this.uniforms.normalSampler.value = options.waterNormals || null
        this.uniforms.sunColor.value = options.sunColor || new Color(0x7F7F7F)
        this.uniforms.waterColor.value = options.waterColor || new Color(0x555555)
        this.uniforms.eye.value = options.eye || new Vector3(0, 0, 0)
        this.uniforms.distortionScale.value = options.distortionScale || 20.0
        this.uniforms.sunDirection.value = options.sunDirection || new Vector3(0.70707, 0.70707, 0)

        if (options.waterNormals) {
            options.waterNormals.wrapS = options.waterNormals.wrapT = 1000 // RepeatWrapping
        }
    }

    updateTextureMatrix(camera: Camera): void {
        this.mirrorWorldPosition.setFromMatrixPosition(this.matrixWorld)
        this.cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld)

        this.rotationMatrix.extractRotation(this.matrixWorld)

        this.lookAtPosition.set(0, 0, -1)
        this.lookAtPosition.applyMatrix4(this.rotationMatrix)
        this.lookAtPosition.add(this.mirrorWorldPosition)

        this.target.subVectors(this.mirrorWorldPosition, this.lookAtPosition)
        this.target.reflect(this.lookAtPosition).negate()
        this.target.add(this.mirrorWorldPosition)

        this.mirrorCamera.position.copy(this.mirrorWorldPosition)
        this.mirrorCamera.up.set(0, 1, 0)
        this.mirrorCamera.up.applyMatrix4(this.rotationMatrix)
        this.mirrorCamera.up.reflect(this.lookAtPosition)
        this.mirrorCamera.lookAt(this.target)

        this.mirrorCamera.far = (camera as PerspectiveCamera).far

        this.mirrorCamera.updateMatrixWorld()
        this.mirrorCamera.projectionMatrix.copy((camera as PerspectiveCamera).projectionMatrix)

        this.textureMatrix.set(
            0.5, 0.0, 0.0, 0.5,
            0.0, 0.5, 0.0, 0.5,
            0.0, 0.0, 0.5, 0.5,
            0.0, 0.0, 0.0, 1.0
        )
        this.textureMatrix.multiply(this.mirrorCamera.projectionMatrix)
        this.textureMatrix.multiply(this.mirrorCamera.matrixWorldInverse)
        this.textureMatrix.multiply(this.matrixWorld)

        this.plane.setFromNormalAndCoplanarPoint(this.lookAtPosition, this.mirrorWorldPosition)
        this.plane.applyMatrix4(this.mirrorCamera.matrixWorldInverse)
        this.clipPlane.set(this.plane.normal.x, this.plane.normal.y, this.plane.normal.z, this.plane.constant)

        this.mirrorCamera.projectionMatrix.elements[2] = this.clipPlane.x
        this.mirrorCamera.projectionMatrix.elements[6] = this.clipPlane.y
        this.mirrorCamera.projectionMatrix.elements[10] = this.clipPlane.z + 1.0
        this.mirrorCamera.projectionMatrix.elements[14] = this.clipPlane.w
    }

    render(renderer: WebGLRenderer, scene: Scene, camera: Camera): void {
        this.uniforms.eye.value.copy(camera.position)
        
        const currentRenderTarget = renderer.getRenderTarget()
        const currentXrEnabled = renderer.xr.enabled
        const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate

        renderer.xr.enabled = false
        renderer.shadowMap.autoUpdate = false

        renderer.setRenderTarget(this.renderTarget)
        renderer.state.buffers.depth.setMask(true)

        if (renderer.autoClear === false) renderer.clear()

        renderer.render(scene, this.mirrorCamera)

        renderer.xr.enabled = currentXrEnabled
        renderer.shadowMap.autoUpdate = currentShadowAutoUpdate
        renderer.setRenderTarget(currentRenderTarget)

        const viewport = camera.userData?.viewport

        if (viewport !== undefined) {
            renderer.state.viewport(viewport)
        }
    }

    updateTime(time: number): void {
        this.uniforms.time.value = time
    }

    dispose(): void {
        this.renderTarget.dispose()
    }
}