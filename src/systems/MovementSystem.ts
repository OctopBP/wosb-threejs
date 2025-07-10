import { System } from '../ecs/System';
import { World } from '../ecs/World';
import { 
    PositionComponent, 
    VelocityComponent, 
    InputComponent, 
    MovementConfigComponent 
} from '../ecs/Component';

export class MovementSystem extends System {
    constructor(world: World) {
        super(world, ['position', 'velocity', 'input', 'movementConfig']);
    }

    update(deltaTime: number): void {
        const entities = this.getEntities();

        for (const entity of entities) {
            const position = entity.getComponent<PositionComponent>('position');
            const velocity = entity.getComponent<VelocityComponent>('velocity');
            const input = entity.getComponent<InputComponent>('input');
            const config = entity.getComponent<MovementConfigComponent>('movementConfig');

            if (!position || !velocity || !input || !config) continue;

            this.processKeyboardInput(input, velocity, config, deltaTime);
            this.processPointerInput(input, velocity, config, deltaTime);
            this.applyDampening(velocity, config, deltaTime);
            this.updatePosition(position, velocity, config, deltaTime);
            this.enforceBoundaries(position, config);
        }
    }

    private processKeyboardInput(
        input: InputComponent, 
        velocity: VelocityComponent, 
        config: MovementConfigComponent,
        deltaTime: number
    ): void {
        const acceleration = config.speed * config.responsiveness * deltaTime;

        // Forward/Backward movement (Z-axis)
        if (input.moveForward) {
            velocity.dz += acceleration;
        }
        if (input.moveBackward) {
            velocity.dz -= acceleration;
        }

        // Left/Right movement (X-axis)
        if (input.moveLeft) {
            velocity.dx -= acceleration;
        }
        if (input.moveRight) {
            velocity.dx += acceleration;
        }

        // Rotation (Y-axis)
        const rotationAcceleration = config.rotationSpeed * config.responsiveness * deltaTime;
        if (input.rotateLeft) {
            velocity.angularVelocityY += rotationAcceleration;
        }
        if (input.rotateRight) {
            velocity.angularVelocityY -= rotationAcceleration;
        }
    }

    private processPointerInput(
        input: InputComponent, 
        velocity: VelocityComponent, 
        config: MovementConfigComponent,
        deltaTime: number
    ): void {
        // Only process pointer input if touching or mouse is down
        if (!input.isTouching && !input.isPointerDown) return;

        const acceleration = config.speed * config.responsiveness * deltaTime * 0.5; // Reduce sensitivity for touch

        // Use pointer position to influence movement
        // Pointer X affects left/right movement
        if (Math.abs(input.pointerX) > 0.1) { // Dead zone
            velocity.dx += input.pointerX * acceleration;
        }

        // Pointer Y affects forward/backward movement
        if (Math.abs(input.pointerY) > 0.1) { // Dead zone
            velocity.dz += input.pointerY * acceleration;
        }

        // Automatic forward movement when touching/clicking
        velocity.dz += acceleration * 0.5;
    }

    private applyDampening(
        velocity: VelocityComponent, 
        config: MovementConfigComponent, 
        deltaTime: number
    ): void {
        const dampening = Math.pow(config.dampening, deltaTime);

        // Apply dampening to linear velocity
        velocity.dx *= dampening;
        velocity.dy *= dampening;
        velocity.dz *= dampening;

        // Apply dampening to angular velocity
        velocity.angularVelocityX *= dampening;
        velocity.angularVelocityY *= dampening;
        velocity.angularVelocityZ *= dampening;

        // Clamp velocities to max speed
        const speed = Math.sqrt(velocity.dx ** 2 + velocity.dy ** 2 + velocity.dz ** 2);
        if (speed > config.maxSpeed) {
            const scale = config.maxSpeed / speed;
            velocity.dx *= scale;
            velocity.dy *= scale;
            velocity.dz *= scale;
        }
    }

    private updatePosition(
        position: PositionComponent, 
        velocity: VelocityComponent, 
        config: MovementConfigComponent,
        deltaTime: number
    ): void {
        // Update linear position
        position.x += velocity.dx * deltaTime;
        position.y += velocity.dy * deltaTime;
        position.z += velocity.dz * deltaTime;

        // Update rotation
        position.rotationX += velocity.angularVelocityX * deltaTime;
        position.rotationY += velocity.angularVelocityY * deltaTime;
        position.rotationZ += velocity.angularVelocityZ * deltaTime;

        // Keep rotation angles in reasonable range
        position.rotationX = this.normalizeAngle(position.rotationX);
        position.rotationY = this.normalizeAngle(position.rotationY);
        position.rotationZ = this.normalizeAngle(position.rotationZ);
    }

    private enforceBoundaries(
        position: PositionComponent, 
        config: MovementConfigComponent
    ): void {
        const bounds = config.boundaries;

        // Clamp position within boundaries
        position.x = Math.max(bounds.minX, Math.min(bounds.maxX, position.x));
        position.y = Math.max(bounds.minY, Math.min(bounds.maxY, position.y));
        position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, position.z));
    }

    private normalizeAngle(angle: number): number {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    }

    private lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }
}