import { InputComponent, MovementConfigComponent, VelocityComponent } from '../ecs/Component'
import { System } from '../ecs/System'
import { World } from '../ecs/World'

export class AccelerationSystem extends System {
    constructor(world: World) {
        super(world, ["velocity", "input", "movementConfig"]);
    }

    update(deltaTime: number): void {
        const entities = this.getEntities();

        for (const entity of entities) {
            const velocity = entity.getComponent<VelocityComponent>("velocity");
            const input = entity.getComponent<InputComponent>("input");
            const config =
                entity.getComponent<MovementConfigComponent>("movementConfig");

            if (!velocity || !input || !config) continue;

            if (input.hasInput) {
                this.applyAcceleration(velocity, input, config, deltaTime);
            } else {
                this.applyDeceleration(velocity, config, deltaTime);
            }

            this.applyLinearDampening(velocity, config, deltaTime);
            this.enforceMaxSpeed(velocity, config);
        }
    }

    private applyAcceleration(
        velocity: VelocityComponent,
        input: InputComponent,
        config: MovementConfigComponent,
        deltaTime: number
    ): void {
        const accelerationForce = config.accelerationForce * deltaTime;

        // Apply forward/backward acceleration (Y becomes Z for 3D movement)
        velocity.dz += input.direction.y * accelerationForce;

        // Apply strafe acceleration (X direction)
        velocity.dx += input.direction.x * accelerationForce;

        // Note: We don't apply Y-axis acceleration here as ships typically don't move up/down
        // unless specifically intended (like in a 3D space game)
    }

    private applyDeceleration(
        velocity: VelocityComponent,
        config: MovementConfigComponent,
        deltaTime: number
    ): void {
        const decelerationForce = config.decelerationForce * deltaTime;

        // Calculate current speed for each axis
        const currentSpeedX = Math.abs(velocity.dx);
        const currentSpeedZ = Math.abs(velocity.dz);

        // Apply deceleration that doesn't overshoot zero
        if (currentSpeedX > 0) {
            const decelerationX = Math.min(decelerationForce, currentSpeedX);
            velocity.dx -= Math.sign(velocity.dx) * decelerationX;
        }

        if (currentSpeedZ > 0) {
            const decelerationZ = Math.min(decelerationForce, currentSpeedZ);
            velocity.dz -= Math.sign(velocity.dz) * decelerationZ;
        }

        // Stop very small velocities to prevent jitter
        if (Math.abs(velocity.dx) < 0.01) velocity.dx = 0;
        if (Math.abs(velocity.dz) < 0.01) velocity.dz = 0;
    }

    private applyLinearDampening(
        velocity: VelocityComponent,
        config: MovementConfigComponent,
        deltaTime: number
    ): void {
        const dampening = Math.pow(config.linearDampening, deltaTime);

        velocity.dx *= dampening;
        velocity.dy *= dampening;
        velocity.dz *= dampening;
    }

    private enforceMaxSpeed(
        velocity: VelocityComponent,
        config: MovementConfigComponent
    ): void {
        // Calculate current speed magnitude
        const currentSpeed = Math.sqrt(
            velocity.dx ** 2 + velocity.dy ** 2 + velocity.dz ** 2
        );

        // If speed exceeds maximum, scale it down
        if (currentSpeed > config.maxSpeed) {
            const scale = config.maxSpeed / currentSpeed;
            velocity.dx *= scale;
            velocity.dy *= scale;
            velocity.dz *= scale;
        }
    }
}
