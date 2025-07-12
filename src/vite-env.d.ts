/// <reference types="vite/client" />

declare type MouseWheelEvent = WheelEvent

declare module '*.glsl' {
    const value: string
    export default value
}
