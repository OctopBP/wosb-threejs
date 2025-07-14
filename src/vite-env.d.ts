/// <reference types="vite/client" />

declare type MouseWheelEvent = WheelEvent

// Shader module declarations
declare module '*.glsl?raw' {
    const content: string
    export default content
}

declare module '*.vert?raw' {
    const content: string
    export default content
}

declare module '*.frag?raw' {
    const content: string
    export default content
}
