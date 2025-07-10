import { System } from '../ecs/System';
import { World } from '../ecs/World';
import { InputComponent } from '../ecs/Component';

export class InputSystem extends System {
    private canvas: HTMLCanvasElement;
    private keysPressed: Set<string> = new Set();
    private pointerPosition: { x: number; y: number } = { x: 0, y: 0 };
    private isPointerDown: boolean = false;
    private isTouching: boolean = false;

    constructor(world: World, canvas: HTMLCanvasElement) {
        super(world, ['input']); // Requires entities with input component
        this.canvas = canvas;
    }

    init(): void {
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Keyboard events
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));

        // Mouse events
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseleave', this.onMouseLeave.bind(this));

        // Touch events
        this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });

        // Prevent context menu on right-click/long press
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    // Keyboard event handlers
    private onKeyDown(event: KeyboardEvent): void {
        this.keysPressed.add(event.code.toLowerCase());
    }

    private onKeyUp(event: KeyboardEvent): void {
        this.keysPressed.delete(event.code.toLowerCase());
    }

    // Mouse event handlers
    private onMouseDown(event: MouseEvent): void {
        this.isPointerDown = true;
        this.updatePointerPosition(event.clientX, event.clientY);
    }

    private onMouseUp(event: MouseEvent): void {
        this.isPointerDown = false;
    }

    private onMouseMove(event: MouseEvent): void {
        this.updatePointerPosition(event.clientX, event.clientY);
    }

    private onMouseLeave(event: MouseEvent): void {
        this.isPointerDown = false;
    }

    // Touch event handlers
    private onTouchStart(event: TouchEvent): void {
        event.preventDefault();
        this.isTouching = true;
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            this.updatePointerPosition(touch.clientX, touch.clientY);
        }
    }

    private onTouchEnd(event: TouchEvent): void {
        event.preventDefault();
        this.isTouching = false;
    }

    private onTouchMove(event: TouchEvent): void {
        event.preventDefault();
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            this.updatePointerPosition(touch.clientX, touch.clientY);
        }
    }

    private updatePointerPosition(clientX: number, clientY: number): void {
        const rect = this.canvas.getBoundingClientRect();
        // Normalize coordinates to -1 to 1 range
        this.pointerPosition.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        this.pointerPosition.y = -(((clientY - rect.top) / rect.height) * 2 - 1); // Invert Y for screen coords
    }

    private isKeyPressed(keyCode: string): boolean {
        return this.keysPressed.has(keyCode.toLowerCase());
    }

    update(deltaTime: number): void {
        const entities = this.getEntities();

        for (const entity of entities) {
            const inputComponent = entity.getComponent<InputComponent>('input');
            if (!inputComponent) continue;

            // Update keyboard input (WASD and Arrow keys)
            inputComponent.moveForward = 
                this.isKeyPressed('keyw') || this.isKeyPressed('arrowup');
            inputComponent.moveBackward = 
                this.isKeyPressed('keys') || this.isKeyPressed('arrowdown');
            inputComponent.moveLeft = 
                this.isKeyPressed('keya') || this.isKeyPressed('arrowleft');
            inputComponent.moveRight = 
                this.isKeyPressed('keyd') || this.isKeyPressed('arrowright');

            // Optional rotation keys (Q/E)
            inputComponent.rotateLeft = this.isKeyPressed('keyq');
            inputComponent.rotateRight = this.isKeyPressed('keye');

            // Update pointer/touch input
            inputComponent.pointerX = this.pointerPosition.x;
            inputComponent.pointerY = this.pointerPosition.y;
            inputComponent.isPointerDown = this.isPointerDown;
            inputComponent.isTouching = this.isTouching;
        }
    }

    cleanup(): void {
        // Remove event listeners
        window.removeEventListener('keydown', this.onKeyDown.bind(this));
        window.removeEventListener('keyup', this.onKeyUp.bind(this));
        
        this.canvas.removeEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.removeEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.removeEventListener('mouseleave', this.onMouseLeave.bind(this));
        
        this.canvas.removeEventListener('touchstart', this.onTouchStart.bind(this));
        this.canvas.removeEventListener('touchend', this.onTouchEnd.bind(this));
        this.canvas.removeEventListener('touchmove', this.onTouchMove.bind(this));
    }
}