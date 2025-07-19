import type { Camera, Scene } from 'three'
import {
    BufferGeometry,
    Color,
    Float32BufferAttribute,
    NormalBlending,
    Points,
    ShaderMaterial,
    TextureLoader,
    Vector3,
} from 'three'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'
import particleFragmentShader from '../shaders/particle.frag?raw'
import particleVertexShader from '../shaders/particle.vert?raw'

export type Particle = {
    position: Vector3
    life: number
    maxLife: number
    alpha: number
    color: Color
    size: number
    velocity: Vector3
    currentSize: number
    rotation: number
}

class LinearSpline<T> {
    private points: [number, T][]
    private lerp: (t: number, a: T, b: T) => T

    constructor(lerp: (t: number, a: T, b: T) => T) {
        this.points = []
        this.lerp = lerp
    }

    AddPoint(t: number, d: T) {
        this.points.push([t, d])
    }

    Get(t: number) {
        let p1 = 0

        for (let i = 0; i < this.points.length; i++) {
            if (this.points[i][0] >= t) {
                break
            }
            p1 = i
        }

        const p2 = Math.min(this.points.length - 1, p1 + 1)

        if (p1 === p2) {
            return this.points[p1][1]
        }

        return this.lerp(
            (t - this.points[p1][0]) /
                (this.points[p2][0] - this.points[p1][0]),
            this.points[p1][1],
            this.points[p2][1],
        )
    }
}

export class PartialeSystem extends System {
    private textureLoader: TextureLoader
    private material: ShaderMaterial
    private camera: Camera
    private particles: Particle[]
    private geometry: BufferGeometry
    private points: Points
    private alphaSpline: LinearSpline<number>
    private colorSpline: LinearSpline<Color>
    private sizeSpline: LinearSpline<number>
    private timeToSpawn: number = 0

    constructor(world: World, scene: Scene, camera: Camera) {
        super(world, ['particle'])

        this.textureLoader = new TextureLoader()

        const pointMultiplier =
            window.innerHeight /
            (2.0 * Math.tan((0.5 * 60.0 * Math.PI) / 180.0))

        this.material = new ShaderMaterial({
            uniforms: {
                pointMultiplier: { value: pointMultiplier },
                diffuseTexture: {
                    value: this.textureLoader.load(
                        'assets/sprites/gunsmoke.png',
                    ),
                },
            },
            vertexShader: particleVertexShader,
            fragmentShader: particleFragmentShader,
            blending: NormalBlending,
            depthTest: true,
            depthWrite: false,
            transparent: true,
            vertexColors: true,
        })

        this.camera = camera
        this.particles = []

        this.geometry = new BufferGeometry()
        this.geometry.setAttribute(
            'position',
            new Float32BufferAttribute([], 3),
        )
        this.geometry.setAttribute('size', new Float32BufferAttribute([], 1))
        this.geometry.setAttribute(
            'tintColor',
            new Float32BufferAttribute([], 4),
        )
        this.geometry.setAttribute('angle', new Float32BufferAttribute([], 1))

        this.points = new Points(this.geometry, this.material)
        scene.add(this.points)

        this.alphaSpline = new LinearSpline((t, a, b) => {
            return a + t * (b - a)
        })
        this.alphaSpline.AddPoint(0.0, 0.0)
        this.alphaSpline.AddPoint(0.1, 1.0)
        this.alphaSpline.AddPoint(0.6, 1.0)
        this.alphaSpline.AddPoint(1.0, 0.0)

        this.colorSpline = new LinearSpline((t, a, b) => a.clone().lerp(b, t))
        this.colorSpline.AddPoint(0.0, new Color(0xffff80))
        this.colorSpline.AddPoint(1.0, new Color(0xff8080))

        this.sizeSpline = new LinearSpline((t, a, b) => a + t * (b - a))
        this.sizeSpline.AddPoint(0.0, 1.0)
        this.sizeSpline.AddPoint(0.5, 5.0)
        this.sizeSpline.AddPoint(1.0, 1.0)

        window.addEventListener('keydown', this.onKeyUp.bind(this))

        this.updateGeometry()
    }

    update(deltaTime: number): void {
        this.addParticlesByTime(deltaTime)
        this.updateParticles(deltaTime)
        this.updateGeometry()
    }

    private onKeyUp(_event: KeyboardEvent): void {
        if (_event.code.toLocaleLowerCase() === 'keyv') {
            console.log('AddParticles')
            this.addParticles(1)
        }
    }

    addParticlesByTime(timeElapsed: number) {
        const emission = 5.0

        this.timeToSpawn += timeElapsed
        const n = Math.floor(this.timeToSpawn * emission)
        this.timeToSpawn -= n / emission

        this.addParticles(n)
    }

    addParticles(n: number) {
        for (let i = 0; i < n; i++) {
            const life = (Math.random() * 0.75 + 0.25) * 2.0
            this.particles.push({
                position: new Vector3(
                    (Math.random() * 2 - 1) * 1.0,
                    (Math.random() * 2 - 1) * 1.0,
                    (Math.random() * 2 - 1) * 1.0,
                ),
                size: (Math.random() * 0.5 + 0.5) * 4.0,
                currentSize: 1,
                color: new Color(),
                alpha: 1.0,
                life: life,
                maxLife: life,
                rotation: Math.random() * 2.0 * Math.PI,
                velocity: new Vector3(0, -15, 0),
            })

            console.log('particles length', this.particles.length)
        }
    }

    updateParticles(deltaTime: number): void {
        for (const p of this.particles) {
            p.life -= deltaTime
        }

        this.particles = this.particles.filter((p) => p.life > 0.0)

        for (const p of this.particles) {
            const t = 1.0 - p.life / p.maxLife

            p.rotation += deltaTime * 0.5
            p.alpha = this.alphaSpline.Get(t)
            p.currentSize = p.size * this.sizeSpline.Get(t)
            p.color.copy(this.colorSpline.Get(t))

            p.position.add(p.velocity.clone().multiplyScalar(deltaTime))

            const drag = p.velocity.clone()
            drag.multiplyScalar(deltaTime * 0.1)
            drag.x =
                Math.sign(p.velocity.x) *
                Math.min(Math.abs(drag.x), Math.abs(p.velocity.x))
            drag.y =
                Math.sign(p.velocity.y) *
                Math.min(Math.abs(drag.y), Math.abs(p.velocity.y))
            drag.z =
                Math.sign(p.velocity.z) *
                Math.min(Math.abs(drag.z), Math.abs(p.velocity.z))
            p.velocity.sub(drag)
        }

        this.particles.sort(
            (a, b) =>
                this.camera.position.distanceTo(a.position) -
                this.camera.position.distanceTo(b.position),
        )
    }

    private updateGeometry(): void {
        const positions = []
        const sizes = []
        const colors = []
        const angles = []

        for (const p of this.particles) {
            positions.push(p.position.x, p.position.y, p.position.z)
            colors.push(p.color.r, p.color.g, p.color.b, p.alpha)
            sizes.push(p.currentSize)
            angles.push(p.rotation)
        }

        this.geometry.setAttribute(
            'position',
            new Float32BufferAttribute(positions, 3),
        )
        this.geometry.setAttribute('size', new Float32BufferAttribute(sizes, 1))
        this.geometry.setAttribute(
            'tintColor',
            new Float32BufferAttribute(colors, 4),
        )
        this.geometry.setAttribute(
            'angle',
            new Float32BufferAttribute(angles, 1),
        )

        this.geometry.attributes.position.needsUpdate = true
        this.geometry.attributes.size.needsUpdate = true
        this.geometry.attributes.tintColor.needsUpdate = true
        this.geometry.attributes.angle.needsUpdate = true
    }
}
