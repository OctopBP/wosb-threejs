import { Entity } from '../ecs/Entity';
import { 
    PositionComponent, 
    VelocityComponent, 
    InputComponent, 
    MovementConfigComponent, 
    RenderableComponent, 
    PlayerComponent 
} from '../ecs/Component';

export class PlayerFactory {
    static createPlayerShip(): Entity {
        const entity = new Entity();

        // Position component - start at origin
        const position: PositionComponent = {
            type: 'position',
            x: 0,
            y: 0.1, // Slightly above the ground
            z: 0,
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0
        };
        entity.addComponent(position);

        // Velocity component - no initial movement
        const velocity: VelocityComponent = {
            type: 'velocity',
            dx: 0,
            dy: 0,
            dz: 0,
            angularVelocityX: 0,
            angularVelocityY: 0,
            angularVelocityZ: 0
        };
        entity.addComponent(velocity);

        // Input component - no initial input
        const input: InputComponent = {
            type: 'input',
            moveForward: false,
            moveBackward: false,
            moveLeft: false,
            moveRight: false,
            rotateLeft: false,
            rotateRight: false,
            pointerX: 0,
            pointerY: 0,
            isTouching: false,
            isPointerDown: false
        };
        entity.addComponent(input);

        // Movement configuration - tuned for responsive but smooth movement
        const movementConfig: MovementConfigComponent = {
            type: 'movementConfig',
            speed: 5.0,           // Base movement speed
            rotationSpeed: 2.0,   // Rotation speed in radians/second
            responsiveness: 3.0,  // How quickly the ship responds to input
            dampening: 0.85,      // How quickly movement decays (0-1, closer to 1 = less dampening)
            maxSpeed: 8.0,        // Maximum speed limit
            boundaries: {
                minX: -10,
                maxX: 10,
                minY: 0,
                maxY: 5,
                minZ: -10,
                maxZ: 10
            }
        };
        entity.addComponent(movementConfig);

        // Renderable component - use placeholder ship for now
        const renderable: RenderableComponent = {
            type: 'renderable',
            meshId: `player_ship_${entity.id}`,
            mesh: undefined, // Will be created by RenderSystem
            meshType: 'placeholder',
            visible: true
        };
        entity.addComponent(renderable);

        // Player tag component
        const player: PlayerComponent = {
            type: 'player'
        };
        entity.addComponent(player);

        return entity;
    }

    static updateMovementConfig(
        entity: Entity, 
        overrides: Partial<Omit<MovementConfigComponent, 'type'>>
    ): void {
        const config = entity.getComponent<MovementConfigComponent>('movementConfig');
        if (config) {
            Object.assign(config, overrides);
        }
    }
}