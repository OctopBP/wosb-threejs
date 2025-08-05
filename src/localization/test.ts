import { LocalizationManager } from './LocalizationManager'

// Simple test function to verify localization works
export async function testLocalization(): Promise<void> {
    const manager = LocalizationManager.getInstance()
    await manager.initialize()

    console.log('Current language:', manager.getCurrentLanguage())
    console.log('Supported languages:', manager.getSupportedLanguages())

    // Test text retrieval
    const goalText = manager.getText('goals.initialWave', { enemyCount: 5 })
    console.log('Goal text:', goalText)

    const tutorialText = manager.getText('tutorial.moveInstruction')
    console.log('Tutorial text:', tutorialText)

    const offerText = manager.getText('newShipOffer.topText')
    console.log('Offer text:', offerText)

    // Test language switching
    manager.setLanguage('en')
    console.log(
        'English goal text:',
        manager.getText('goals.initialWave', { enemyCount: 3 }),
    )

    manager.setLanguage('ru')
    console.log(
        'Russian goal text:',
        manager.getText('goals.initialWave', { enemyCount: 3 }),
    )
}
