// Base Component interface for ECS system
export interface Component {
    readonly type: string;
}

// Position component for entity location and rotation
export interface PositionComponent extends Component {
    type: 'position';
    x: number;
    y: number;
    z: number;
    rotationX: number;
    rotationY: number;
    rotationZ: number;
}

// Velocity component for entity movement
export interface VelocityComponent extends Component {
    type: 'velocity';
    dx: number;
    dy: number;
    dz: number;
    angularVelocityX: number;
    angularVelocityY: number;
    angularVelocityZ: number;
}

// Input component for storing current input state
export interface InputComponent extends Component {
    type: 'input';
    moveForward: boolean;
    moveBackward: boolean;
    moveLeft: boolean;
    moveRight: boolean;
    rotateLeft: boolean;
    rotateRight: boolean;
    pointerX: number;
    pointerY: number;
    isTouching: boolean;
    isPointerDown: boolean;
}

// Movement configuration component
export interface MovementConfigComponent extends Component {
    type: 'movementConfig';
    speed: number;
    rotationSpeed: number;
    responsiveness: number;
    dampening: number;
    maxSpeed: number;
    boundaries: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
        minZ: number;
        maxZ: number;
    };
}

// Renderable component for Babylon.js mesh
export interface RenderableComponent extends Component {
    type: 'renderable';
    meshId: string;
    mesh?: any; // BABYLON.Mesh
    meshType: 'placeholder' | 'ship' | 'enemy' | 'projectile';
    visible: boolean;
}

// Player tag component
export interface PlayerComponent extends Component {
    type: 'player';
}