# World of Sea Battle - Playable Ad Game Development Rules

## Project Overview

This is a 20-30 second HTML5 playable advertisement game built with Vite, TypeScript, and Three.js. The game showcases naval combat mechanics with progressive ship upgrades, culminating in a boss encounter that drives conversion to the main game.

## Tech Stack

* **Build Tool**: Vite for fast development and optimized bundling
* **Language**: TypeScript for type safety and better development experience
* **3D Engine**: Three.js for 3D rendering and game logic
* **Target**: Mobile web browsers (iOS Safari, Android Chrome) with desktop fallback
* **File Size**: <10MB total bundle size
* **Performance**: 60 FPS on mid-tier mobile devices

## Project Structure Rules

### File Organization

```text
src/
├── scenes/           # Scene management and game states
├── entities/         # Game objects and characters
├── systems/          # Game logic and mechanics
├── ui/              # User interface components
├── config/          # Configuration files
├── localization/    # Text and language files
├── utils/           # Utility functions and helpers
├── types/           # TypeScript type definitions
└── assets/          # Static assets (models, textures, audio)
```

### Naming Conventions

* **Files**: PascalCase for classes, camelCase for utilities (e.g.,  `PlayerShip.ts`,  `mathUtils.ts`)
* **Classes**: PascalCase (e.g.,  `PlayerShip`,  `CombatSystem`)
* **Functions/Variables**: camelCase (e.g.,  `updatePosition`,  `currentLevel`)
* **Constants**: SCREAMING_SNAKE_CASE (e.g.,  `MAX_LEVEL`,  `CANNON_DAMAGE`)
* **Enums**: PascalCase with descriptive names (e.g.,  `ShipType`,  `GameState`)

## Code Quality Standards

### TypeScript Requirements

* Use strict TypeScript configuration
* Define interfaces for all data structures
* Use enums for constants and state management
* Implement proper error handling with typed exceptions
* Use generics where appropriate for reusability

### Architecture Patterns

* **Entity-Component System**: Separate concerns between entities, components, and systems
* **Configuration-Driven**: All values must be configurable through config files
* **Modular Design**: Each class should have a single responsibility
* **Event-Driven**: Use event system for loose coupling between systems
* **Factory Pattern**: Use factories for creating entities with different configurations

### Performance Guidelines

* Minimize object allocation in game loops
* Use object pooling for frequently created/destroyed objects (projectiles, particles)
* Optimize texture loading and memory usage
* Implement level-of-detail (LOD) for complex models
* Use efficient collision detection algorithms
* Profile and optimize render calls

## Configuration Management

### Config Structure

* `config/GameConfig.ts` - Core game settings
* `config/ShipConfig.ts` - Ship progression and stats
* `config/CombatConfig.ts` - Combat mechanics and balance
* `config/UIConfig.ts` - Interface layouts and styling
* `config/AudioConfig.ts` - Sound and music settings

### Configuration Rules

* NO hardcoded values in implementation files
* All numeric values must be configurable
* Use typed configuration objects with validation
* Support environment-specific configs (dev/prod)
* Enable real-time config updates for debugging

### Example Config Pattern

```typescript
export interface ShipConfigData {
  readonly levels: ReadonlyArray<ShipLevel>;
  readonly baseSpeed: number;
  readonly upgradeEffects: UpgradeEffects;
}

export const SHIP_CONFIG: ShipConfigData = {
  levels: [...],
  baseSpeed: 5.0,
  upgradeEffects: {...}
};
```

## Localization Requirements

### Text Management

* All user-facing text must be in `localization/` directory
* Use key-based system with nested objects for organization
* Support dynamic text interpolation
* Implement fallback language (English) for missing translations
* Keep text keys descriptive and hierarchical

### Localization Structure

```text
localization/
├── en/
│   ├── ui.json         # Interface text
│   ├── gameplay.json   # Game messages
│   └── cta.json       # Call-to-action screen
└── LocalizationManager.ts
```

### Text Usage Pattern

```typescript
// ❌ BAD - Hardcoded text
element.textContent = "Level: 1";

// ✅ GOOD - Localized text
element.textContent = LocalizationManager.getText('ui.level', { level: 1 });
```

## Component Architecture

### Scene Management

* Each scene should extend a base `Scene` class
* Implement proper cleanup and resource management
* Use scene transitions with loading states
* Handle resize and orientation changes

### Entity Design

* Use composition over inheritance
* Implement component-based architecture
* Separate visual representation from game logic
* Use interfaces for entity behaviors

### System Implementation

* Systems should be stateless when possible
* Implement clear update/render separation
* Use dependency injection for system communication
* Handle system lifecycle properly (init/update/cleanup)

## UI Development Guidelines

### Interface Components

* Create reusable UI components
* Separate presentation from logic
* Implement responsive design for different screen sizes
* Use consistent styling and theming

### HUD Requirements

* Real-time performance monitoring in debug mode
* Configurable layout positions
* Smooth animations and transitions
* Touch-friendly sizing for mobile

## Audio Integration

### Audio Management

* Implement audio pooling for performance
* Support muted playback mode
* Use compressed audio formats for web
* Implement dynamic audio mixing based on game state

### Audio Categories

* **Music**: Background tracks with smooth transitions
* **SFX**: Combat sounds, UI feedback, environmental audio
* **Voice**: Optional narrator or announcement sounds

## Testing Standards

### Test Categories

* Unit tests for utility functions and configurations
* Integration tests for system interactions
* Performance tests for mobile compatibility
* User acceptance tests for conversion flow

### Testing Tools

* Use Vitest for unit testing
* Implement automated performance profiling
* Test on real mobile devices
* A/B testing framework for CTA optimization

## Development Workflow

### Code Organization

* One class per file
* Group related functionality in directories
* Use barrel exports (index.ts) for clean imports
* Implement proper dependency management

### Documentation

* Minimal inline comments - code should be self-documenting
* Document complex algorithms or business logic
* Maintain README for setup and development
* Use JSDoc for public API documentation

### Version Control

* Atomic commits with descriptive messages
* Feature branch workflow
* Code review requirements
* Automated testing before merge

## Performance Optimization

### Mobile Optimization

* Target 60 FPS on iPhone 8 / Android equivalent
* Minimize draw calls and state changes
* Use texture atlasing for UI elements
* Implement efficient particle systems

### Bundle Optimization

* Code splitting for faster initial load
* Asset compression and optimization
* Tree shaking for unused code elimination
* Progressive loading for large assets

## Error Handling

### Error Management

* Graceful degradation for unsupported features
* User-friendly error messages
* Automatic error reporting (non-PII)
* Recovery mechanisms for common failures

### Debugging Support

* Development mode with enhanced logging
* Performance monitoring and profiling tools
* Visual debugging for collision detection
* Network connectivity handling

## Security Considerations

### Data Protection

* No collection of personal information
* Secure communication with analytics endpoints
* Validate all user inputs
* Implement CSP headers for web deployment

## Deployment Guidelines

### Build Process

* Multi-environment build configurations
* Asset optimization pipeline
* Bundle size monitoring
* Performance testing integration

### Platform Compatibility

* Cross-browser testing on target platforms
* Fallback handling for unsupported features
* Progressive enhancement approach
* Accessibility compliance (WCAG 2.1 AA)

## Code Examples

### Preferred Patterns

```typescript
// Entity with configurable behavior
export class PlayerShip extends Entity {
  constructor(
    scene: Scene,
    private config: ShipConfigData,
    private progressionSystem: ProgressionSystem
  ) {
    super(scene);
    this.initializeFromConfig();
  }
}

// System with clear responsibilities
export class CombatSystem implements ISystem {
  update(deltaTime: number, entities: Entity[]): void {
    this.processCollisions(entities);
    this.updateProjectiles(deltaTime);
    this.handleCombatEvents();
  }
}

// Configuration-driven setup
const gameConfig = GameConfigManager.load();
const scene = new GameScene(gameConfig.scene);
```

## Quality Checklist

Before committing code, ensure:

* [ ] No hardcoded values in implementation
* [ ] All text uses localization system
* [ ] TypeScript strict mode compliance
* [ ] Mobile performance tested
* [ ] Error handling implemented
* [ ] Configuration validation added
* [ ] Documentation updated if needed
* [ ] Bundle size impact assessed

Follow these rules consistently to maintain code quality, performance, and maintainability throughout the development process.
