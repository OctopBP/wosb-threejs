import type { Camera, Side, WebGLRenderer } from 'three'
import {
    Color,
    FrontSide,
    LinearFilter,
    Matrix4,
    Mesh,
    PerspectiveCamera,
    Plane,
    PlaneGeometry,
    RGBAFormat,
    type Scene,
    ShaderMaterial,
    type Texture,
    TextureLoader,
    UniformsLib,
    UniformsUtils,
    Vector2,
    Vector3,
    Vector4,
    WebGLRenderTarget,
} from 'three'
import fragmentShader from '../shaders/water/fragment.glsl?raw'
import vertexShader from '../shaders/water/vertex.glsl?raw'

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
        sunColor: { value: new Color(0x7f7f7f) },
        sunDirection: { value: new Vector3(0.70707, 0.70707, 0) },
        eye: { value: new Vector3() },
        waterColor: { value: new Color(0x555555) },
    },
    vertexShader,
    fragmentShader,
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
            fog: options.fog !== false,
        })

        const textureWidth = options.textureWidth || 512
        const textureHeight = options.textureHeight || 512

        this.renderTarget = new WebGLRenderTarget(textureWidth, textureHeight, {
            format: RGBAFormat,
            minFilter: LinearFilter,
            magFilter: LinearFilter,
        })

        this.mirrorCamera = new PerspectiveCamera()

        // Set uniforms
        this.uniforms.mirrorSampler.value = this.renderTarget.texture
        this.uniforms.textureMatrix.value = this.textureMatrix
        this.uniforms.alpha.value = 1.0
        this.uniforms.time.value = 0.0
        this.uniforms.normalSampler.value = options.waterNormals || null
        this.uniforms.sunColor.value = options.sunColor || new Color(0x7f7f7f)
        this.uniforms.waterColor.value =
            options.waterColor || new Color(0x555555)
        this.uniforms.eye.value = options.eye || new Vector3(0, 0, 0)
        this.uniforms.distortionScale.value = options.distortionScale || 20.0
        this.uniforms.sunDirection.value =
            options.sunDirection || new Vector3(0.70707, 0.70707, 0)

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
        this.mirrorCamera.projectionMatrix.copy(
            (camera as PerspectiveCamera).projectionMatrix,
        )

        this.textureMatrix.set(
            0.5,
            0.0,
            0.0,
            0.5,
            0.0,
            0.5,
            0.0,
            0.5,
            0.0,
            0.0,
            0.5,
            0.5,
            0.0,
            0.0,
            0.0,
            1.0,
        )
        this.textureMatrix.multiply(this.mirrorCamera.projectionMatrix)
        this.textureMatrix.multiply(this.mirrorCamera.matrixWorldInverse)
        this.textureMatrix.multiply(this.matrixWorld)

        this.plane.setFromNormalAndCoplanarPoint(
            this.lookAtPosition,
            this.mirrorWorldPosition,
        )
        this.plane.applyMatrix4(this.mirrorCamera.matrixWorldInverse)
        this.clipPlane.set(
            this.plane.normal.x,
            this.plane.normal.y,
            this.plane.normal.z,
            this.plane.constant,
        )

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
