import type { GameStateConfig } from '../../config/GameStateConfig'
import type { GameStateComponent } from '../../ecs/Component'
import type { World } from '../../ecs/World'
import type { GameWorld } from '../../GameWorld'
import { BaseGameState } from './BaseGameState'

export class NewShipOfferState extends BaseGameState {
    handle(
        gameState: GameStateComponent,
        config: GameStateConfig,
        world: World,
        gameWorld?: GameWorld,
    ): string | null {
        // This state is primarily handled by the NewShipOfferUISystem
        // The UI system will call restart methods when the user clicks "Get it"

        // No automatic transitions from this state
        return null
    }
}
