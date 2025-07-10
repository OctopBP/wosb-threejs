import {
    createMovementConfig,
    type MovementConfigPreset,
} from '../config/MovementPresets'
import type {
    InputComponent,
    MovementConfigComponent,
    PlayerComponent,
    PositionComponent,
    RenderableComponent,
    VelocityComponent,
} from '../ecs/Component'
import { Entity } from '../ecs/Entity'

export class PlayerFactory {
    static createPlayerShip(
        configOverrides: Partial<MovementConfigPreset> = {},
    ): Entity {
        const entity = new Entity()

        // Position component - start at origin
        const position: PositionComponent = {
            type: 'position',
            x: 0,
            y: 0.1, // Slightly above the ground
            z: 0,
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
        }
        entity.addComponent(position)

        // Velocity component - no initial movement
        const velocity: VelocityComponent = {
            type: 'velocity',
            dx: 0,
            dy: 0,
            dz: 0,
            angularVelocityX: 0,
            angularVelocityY: 0,
            angularVelocityZ: 0,
        }
        entity.addComponent(velocity)

        // Input component - no initial input with direction output
        const input: InputComponent = {
            type: 'input',
            // Raw input state
            moveForward: false,
            moveBackward: false,
            moveLeft: false,
            moveRight: false,
            pointerX: 0,
            pointerY: 0,
            isTouching: false,
            isPointerDown: false,
            // Processed direction output
            direction: {
                x: 0, // left/right direction
                y: 0, // forward/backward direction
            },
            hasInput: false,
        }
        entity.addComponent(input)

        // Movement configuration using balanced preset
        const movementConfig = createMovementConfig(configOverrides)
        entity.addComponent(movementConfig)

        // Renderable component - use placeholder ship for now
        const renderable: RenderableComponent = {
            type: 'renderable',
            meshId: `player_ship_${entity.id}`,
            mesh: undefined, // Will be created by RenderSystem
            meshType: 'placeholder',
            visible: true,
        }
        entity.addComponent(renderable)

        // Player tag component
        const player: PlayerComponent = {
            type: 'player',
        }
        entity.addComponent(player)

        return entity
    }

    static updateMovementConfig(
        entity: Entity,
        overrides: Partial<Omit<MovementConfigComponent, 'type'>>,
    ): void {
        const config =
            entity.getComponent<MovementConfigComponent>('movementConfig')
        if (config) {
            Object.assign(config, overrides)
        }
    }
}
