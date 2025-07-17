import { BaseGameState } from './BaseGameState'

export class NewShipOfferState extends BaseGameState {
    handle(): string | null {
        // This state is primarily handled by the NewShipOfferUISystem
        // The UI system will call restart methods when the user clicks "Get it"

        // No automatic transitions from this state
        return null
    }
}
