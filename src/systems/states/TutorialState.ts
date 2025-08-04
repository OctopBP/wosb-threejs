import type { GameStateConfig } from '../../config/GameStateConfig'
import type { GameStateComponent, InputComponent } from '../../ecs/Component'
import type { World } from '../../ecs/World'
import { BaseGameState } from './BaseGameState'

export class TutorialState extends BaseGameState {
    private tutorialCompleted = false
    private tutorialStartTime: number = 0

    handle(
        gameState: GameStateComponent,
        config: GameStateConfig,
        world: World,
    ): string | null {
        // Initialize tutorial start time on first call
        if (this.tutorialStartTime === 0) {
            this.tutorialStartTime = performance.now() / 1000
        }

        // Check for player input to complete tutorial
        if (!this.tutorialCompleted) {
            const playerEntities = world.getEntitiesWithComponents([
                'player',
                'input',
            ])
            if (playerEntities.length > 0) {
                const player = playerEntities[0]
                const input = player.getComponent<InputComponent>('input')

                if (input && input.hasInput) {
                    this.tutorialCompleted = true
                }
            }
        }

        // If tutorial is completed, transition to initial wave
        if (this.tutorialCompleted) {
            return 'initialWave'
        }

        return null // Stay in tutorial state
    }
}
