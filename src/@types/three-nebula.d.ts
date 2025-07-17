declare module 'three-nebula' {
    import { Scene, Vector3, Texture } from 'three'

    export class System {
        constructor()
        addEmitter(emitter: Emitter): void
        removeEmitter(emitter: Emitter): void
        addRenderer(renderer: Renderer): void
        update(deltaTime: number): void
        destroy(): void
    }

    export class Emitter {
        particles: any[]
        isEmitting: boolean
        
        constructor()
        addInitialize(initializer: Initialize): void
        addBehaviour(behaviour: Behaviour): void
        setRate(rate: Rate): void
        emit(): void
        stopEmit(): void
        destroy(): void
    }

    export class Rate {
        constructor(numPan: Span, timePan: Span)
    }

    export class Span {
        constructor(min: number, max: number)
        constructor(value: number)
    }

    export class Position {
        constructor(position: Vector3)
        constructor(x: Span | number, y: Span | number, z: Span | number)
    }

    export class Mass {
        constructor(mass: number)
    }

    export class VectorVelocity {
        constructor(x: Span | number, y: Span | number, z: Span | number)
    }

    export class Force {
        constructor(x: number, y: number, z: number)
    }

    export class Life {
        constructor(min: number, max: number)
    }

    export class Scale {
        constructor(start: number, end: number)
    }

    export class Color {
        constructor(
            startR: number, startG: number, startB: number,
            endR: number, endG: number, endB: number
        )
    }

    export class Alpha {
        constructor(start: number, end: number)
    }

    export class Body {
        constructor(bodySprite: BodySprite)
    }

    export class BodySprite {
        constructor(texture: Texture)
    }

    export class SpriteRenderer {
        constructor(scene: Scene)
    }

    // Base interfaces
    export interface Initialize {}
    export interface Behaviour {}
    export interface Renderer {}
}