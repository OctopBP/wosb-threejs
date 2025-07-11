import * as BABYLON from 'babylonjs'
import { GameWorld } from './GameWorld';

export class AppOne {
    engine: BABYLON.Engine;
    scene: BABYLON.Scene;
    gameWorld: GameWorld;

    constructor(readonly canvas: HTMLCanvasElement) {
        this.engine = new BABYLON.Engine(canvas)
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
        this.scene = createScene(this.engine, this.canvas)
        
        // Initialize the game world with leveling system
        this.gameWorld = new GameWorld(this.scene);
        
        // Create a player entity
        this.gameWorld.createPlayer();
        
        // Setup testing/demo controls
        this.setupLevelingDemo();
    }

    private setupLevelingDemo(): void {
        // Add keyboard controls for testing the leveling system
        this.scene.onKeyboardObservable.add((kbInfo: BABYLON.KeyboardInfo) => {
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    switch (kbInfo.event.code) {
                        case 'KeyX':
                            // Award 50 XP
                            this.gameWorld.awardXP(50);
                            console.log('Awarded 50 XP! Current level:', this.gameWorld.getPlayerLevel());
                            break;
                        case 'KeyC':
                            // Award 200 XP (for quicker testing)
                            this.gameWorld.awardXP(200);
                            console.log('Awarded 200 XP! Current level:', this.gameWorld.getPlayerLevel());
                            break;
                        case 'KeyD':
                            // Debug current state
                            this.gameWorld.debugLeveling();
                            break;
                        case 'KeyR':
                            // Reset to level 1
                            this.gameWorld.forceLevel(1);
                            console.log('Reset to level 1');
                            break;
                        case 'KeyF':
                            // Force to max level
                            this.gameWorld.forceLevel(6);
                            console.log('Forced to max level');
                            break;
                    }
                    break;
            }
        });
        
        // Display controls in console
        console.log('🎮 LEVELING SYSTEM DEMO CONTROLS:');
        console.log('Press X - Award 50 XP');
        console.log('Press C - Award 200 XP');
        console.log('Press D - Debug current state');
        console.log('Press R - Reset to level 1');
        console.log('Press F - Force to max level');
    }

    debug(debugOn: boolean = true) {
        if (debugOn) {
            this.scene.debugLayer.show({ overlay: true });
        } else {
            this.scene.debugLayer.hide();
        }
    }

    run() {
        this.debug(true);
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }
}


var createScene = function (engine: BABYLON.Engine, canvas: HTMLCanvasElement) {
    // this is the default code from the playground:

    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);

    // This creates and positions a free camera (non-mesh)
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);

    // This targets the camera to scene origin
    camera.setTarget(BABYLON.Vector3.Zero());

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    // Our built-in 'sphere' shape.
    var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, scene);
    // Move the sphere upward 1/2 its height
    let startPos = 2;
    sphere.position.y = startPos;

    // Our built-in 'ground' shape.
    var ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);
    var groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.8, 0.5); // RGB for a greenish color
    ground.material = groundMaterial;
    groundMaterial.bumpTexture = new BABYLON.Texture("./normal.jpg", scene);
    //groundMaterial.bumpTexture.level = 0.125;    


    var redMaterial = new BABYLON.StandardMaterial("redMaterial", scene);
    redMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0); // RGB for red
    sphere.material = redMaterial;

    var sphereVelocity = 0;
    var gravity = 0.009;
    var reboundLoss = 0.1;

    scene.registerBeforeRender(() => {
        sphereVelocity += gravity;
        let newY = sphere.position.y - sphereVelocity;
        sphere.position.y -= sphereVelocity
        if (newY < 1) {
            sphereVelocity = (reboundLoss - 1) * sphereVelocity;
            newY = 1;
        }
        sphere.position.y = newY;
        if (Math.abs(sphereVelocity) <= gravity && newY < 1 + gravity) {
            sphere.position.y = startPos++;
        }
    });

    return scene;
};