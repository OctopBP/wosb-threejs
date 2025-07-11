# Three.js + Vite Game Engine

## Description

This is a **Three.js + Vite** TypeScript game engine featuring an Entity Component System (ECS) architecture. Originally migrated from Babylon.js, it maintains the same excellent project structure while leveraging Three.js for 3D rendering.

**Key Features:**
- 🎮 Entity Component System (ECS) architecture
- 🚀 Three.js for 3D rendering and physics
- ⚡ Vite for fast development and building
- 🎯 TypeScript for type safety
- 🎨 Hot module replacement for rapid development
- 🧪 Production-ready build system

## Instructions

- Clone or download the repo
- `npm install`
- For development: `npm run dev`
- For production: `npm run build` then to preview what was built `npm run preview`

## Development Mode and Debugging
First `npm run dev`
Then in VSCode press F5, otherwise just open a browser at http://localhost:3000/

## Production Build
First `npm run build`
A `dist` folder is created and contains the distribution. 
You can `npm run preview` it on your development machine.
Production preview runs at http://localhost:5000/. The terminal will display external URLs if you want to test from a phone or tablet.

## File Structure

### /index.html
This file is used as a template by Vite to create the actual **index.html** that will be served to the client.

### /public
This folder contains your HTML assets. The files in this folder are served by the test webserver as root files.

### /src 
This is where you should place all your application code.

### /src/main.ts
This is the entry point of the app.

### /src/AppOne.ts
The main application class that initializes Three.js renderer, scene, camera, and the game world.

### /src/GameWorld.ts
Manages the ECS world and coordinates all game systems.

### /src/ecs/
Entity Component System implementation with:
- **Entity.ts** - Game entities
- **Component.ts** - Component definitions
- **System.ts** - System base class
- **World.ts** - ECS world management

### /src/systems/
Game systems including:
- **RenderSystem.ts** - Three.js rendering and mesh management
- **MovementSystem.ts** - Entity movement
- **WeaponSystem.ts** - Projectile firing
- **CollisionSystem.ts** - Collision detection
- **InputSystem.ts** - User input handling

### /src/entities/
Entity factory functions for creating game objects.

### /src/config/
Configuration files for models, movement, weapons, and enemies.

## Architecture

This project uses a modern ECS (Entity Component System) architecture:

- **Entities** are containers with unique IDs
- **Components** are data structures (Position, Velocity, Renderable, etc.)
- **Systems** contain the game logic and operate on entities with specific components

This architecture provides excellent performance, modularity, and maintainability for game development.

## Thank You!

Thank you for using it! Feel free to contribute in any way you can/want, just keep in mind that this should stay as a clean, well-structured game engine foundation.

Enjoy building your games! 🎮
