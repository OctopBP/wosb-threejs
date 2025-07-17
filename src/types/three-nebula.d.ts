declare module 'three-nebula' {
    import { Scene, Color, Vector3, Object3D } from 'three'

    export class System {
        constructor()
        addRenderer(renderer: any): void
        addEmitter(emitter: Emitter): void
        removeEmitter(emitter: Emitter): void
        update(): void
        destroy(): void
    }

    export class Emitter {
        position: Vector3
        constructor()
        setRate(rate: Rate): void
        addInitializer(initializer: any): void
        addBehaviour(behaviour: any): void
        setTotalEmitTimes(times: number): void
        setLife(life: number): void
        emit(): void
        stopEmit(): void
    }

    export class Rate {
        constructor(numPan: Span, timePan: Span)
    }

    export class Span {
        constructor(min: number, max: number)
    }

    export class Position {
        constructor(zone: any)
    }

    export class Mass {
        constructor(mass: number)
    }

    export class Radius {
        constructor(min: number, max: number)
    }

    export class Life {
        constructor(min: number, max: number)
    }

    export class Velocity {
        constructor(zone: any, span: Span)
    }

    export class RandomDrift {
        constructor(x: number, y: number, z: number, delay: number)
    }

    export class Rotate {
        constructor(x: string | number, y: string | number, z?: string | number)
    }

    export class Scale {
        constructor(start: number, end: number)
    }

    export class Alpha {
        constructor(start: number, end: number)
    }

    export class Color {
        constructor(start: Color, end?: Color)
    }

    export class SpriteRenderer {
        constructor(scene: Scene, type: string)
    }

    export class MeshRenderer {
        constructor(scene: Scene, mesh: Object3D)
    }

    export class Vector3D {
        constructor(x: number, y: number, z: number)
    }

    export class SphereZone {
        constructor(x: number, y: number, z: number, radius: number)
    }

    export class PointZone {
        constructor(x: number, y: number, z: number)
    }
}