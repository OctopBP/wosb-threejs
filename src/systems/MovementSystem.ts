import type {
    InputComponent,
    MovementConfigComponent,
    PhysicsComponent,
    PhysicsForceComponent,
    PositionComponent,
    RotationSpeedComponent,
    SpeedComponent,
} from '../ecs/Component'
import type { Entity } from '../ecs/Entity'
import { System } from '../ecs/System'
import type { World } from '../ecs/World'

export class MovementSystem extends System {
    constructor(world: World) {
        super(world, [
            'position',
            'speed',
            'movementConfig',
            'physics',
            'alive',
        ])
    }

    update(deltaTime: number): void {
        const entities = this.getEntities()

        for (const entity of entities) {
            const position = entity.getComponent<PositionComponent>('position')
            const speed = entity.getComponent<SpeedComponent>('speed')
            const config =
                entity.getComponent<MovementConfigComponent>('movementConfig')
            const physics = entity.getComponent<PhysicsComponent>('physics')

            if (!position || !speed || !config || !physics) {
                continue
            }

            this.applyMovementForces(entity, speed, config, deltaTime)
        }
    }

    private applyMovementForces(
        entity: Entity,
        speed: SpeedComponent,
        config: MovementConfigComponent,
        deltaTime: number,
    ): void {
        // Get or create physics force component
        let forceComp =
            entity.getComponent<PhysicsForceComponent>('physicsForce')
        if (!forceComp) {
            forceComp = {
                type: 'physicsForce',
                force: { x: 0, y: 0, z: 0 },
                torque: { x: 0, y: 0, z: 0 },
                applyAtCenterOfMass: true,
            }
            entity.addComponent<PhysicsForceComponent>(forceComp)
        }

        // Calculate forward force based on current speed
        if (speed.currentSpeed > 0) {
            const position = entity.getComponent<PositionComponent>('position')
            if (position) {
                // Ship model faces backwards by default, so we add Math.PI
                const forwardAngle = position.rotationY + Math.PI
                const forwardX = Math.sin(forwardAngle)
                const forwardZ = Math.cos(forwardAngle)

                // Apply forward force proportional to desired speed
                const targetForce =
                    speed.currentSpeed * config.accelerationForce

                forceComp.force.x += forwardX * targetForce * deltaTime
                forceComp.force.z += forwardZ * targetForce * deltaTime
            }
        }

        // Apply forces for input-based movement if entity has input
        if (entity.hasComponent('input')) {
            const input = entity.getComponent<InputComponent>('input')
            if (input && input.hasInput) {
                // Apply turning torque based on input direction
                const turnTorque =
                    input.direction.x * config.rotationAcceleration * deltaTime
                forceComp.torque.y += turnTorque

                // Apply forward/backward force based on input
                const position =
                    entity.getComponent<PositionComponent>('position')
                if (position) {
                    const forwardAngle = position.rotationY + Math.PI
                    const forwardX = Math.sin(forwardAngle)
                    const forwardZ = Math.cos(forwardAngle)

                    const movementForce =
                        input.direction.y * config.accelerationForce * deltaTime
                    forceComp.force.x += forwardX * movementForce
                    forceComp.force.z += forwardZ * movementForce
                }
            }
        }

        // Apply rotational forces for rotation speed component
        if (entity.hasComponent('rotationSpeed')) {
            const rotationSpeed =
                entity.getComponent<RotationSpeedComponent>('rotationSpeed')
            if (rotationSpeed && rotationSpeed.currentRotationSpeed !== 0) {
                forceComp.torque.y +=
                    rotationSpeed.currentRotationSpeed *
                    config.rotationAcceleration *
                    deltaTime
            }
        }
    }
}
