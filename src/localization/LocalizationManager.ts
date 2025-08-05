interface LocalizationData {
    [key: string]: string | LocalizationData
}

export class LocalizationManager {
    private static instance: LocalizationManager
    private currentLanguage = 'en'
    private fallbackLanguage = 'en'
    private localizationData: { [language: string]: LocalizationData } = {}
    private isInitialized = false

    private constructor() {}

    static getInstance(): LocalizationManager {
        if (!LocalizationManager.instance) {
            LocalizationManager.instance = new LocalizationManager()
        }
        return LocalizationManager.instance
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return

        // Detect language from bridge if available
        this.detectLanguage()

        // Load localization data
        await this.loadLocalizationData()

        this.isInitialized = true
    }

    private detectLanguage(): void {
        try {
            // Check if bridge is available and has language property
            if (
                typeof window !== 'undefined' &&
                (window as any).bridge?.platform?.language
            ) {
                const bridgeLanguage = (window as any).bridge.platform.language
                if (bridgeLanguage && typeof bridgeLanguage === 'string') {
                    // Map common language codes to our supported languages
                    const languageMap: { [key: string]: string } = {
                        ru: 'ru',
                        'ru-RU': 'ru',
                        en: 'en',
                        'en-US': 'en',
                        'en-GB': 'en',
                    }

                    const mappedLanguage =
                        languageMap[bridgeLanguage.toLowerCase()]
                    if (mappedLanguage) {
                        this.currentLanguage = mappedLanguage
                        return
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to detect language from bridge:', error)
        }

        // Fallback to browser language
        const browserLanguage =
            navigator.language || navigator.languages?.[0] || 'en'
        const languageCode = browserLanguage.split('-')[0].toLowerCase()

        if (languageCode === 'ru') {
            this.currentLanguage = 'ru'
        } else {
            this.currentLanguage = 'en'
        }
    }

    private async loadLocalizationData(): Promise<void> {
        try {
            // Load English (fallback)
            const enResponse = await fetch('/localization/en.json')
            this.localizationData.en = await enResponse.json()

            // Load Russian
            const ruResponse = await fetch('/localization/ru.json')
            this.localizationData.ru = await ruResponse.json()
        } catch (error) {
            console.error('Failed to load localization data:', error)
            // Create minimal fallback data
            this.localizationData.en = {
                goals: {
                    tutorial: '',
                    initialWave: 'Destroy {enemyCount} enemy',
                    wave1: 'Destroy {enemyCount} enemies',
                    wave2: 'Destroy {enemyCount} enemies',
                    bossFight: 'Destroy the boss',
                },
                tutorial: {
                    moveInstruction: 'Move using WASD or arrow keys',
                },
                newShipOffer: {
                    topText: 'Need something more powerful?',
                    bottomText: 'Get your "Black Prince"\nfor free right now',
                    buttonText: 'GET IT',
                },
            }
        }
    }

    getText(key: string, params?: { [key: string]: string | number }): string {
        const keys = key.split('.')
        let data =
            this.localizationData[this.currentLanguage] ||
            this.localizationData[this.fallbackLanguage]

        if (!data) {
            console.warn(
                `No localization data available for language: ${this.currentLanguage}`,
            )
            return key
        }

        // Navigate to the nested key
        for (const k of keys) {
            if (data && typeof data === 'object' && k in data) {
                data = data[k]
            } else {
                console.warn(`Localization key not found: ${key}`)
                return key
            }
        }

        if (typeof data !== 'string') {
            console.warn(`Localization value is not a string: ${key}`)
            return key
        }

        // Interpolate parameters
        if (params) {
            return data.replace(/\{(\w+)\}/g, (match, paramName) => {
                return params[paramName]?.toString() || match
            })
        }

        return data
    }

    getCurrentLanguage(): string {
        return this.currentLanguage
    }

    setLanguage(language: string): void {
        if (this.localizationData[language]) {
            this.currentLanguage = language
        } else {
            console.warn(`Language not supported: ${language}`)
        }
    }

    isLanguageSupported(language: string): boolean {
        return language in this.localizationData
    }

    getSupportedLanguages(): string[] {
        return Object.keys(this.localizationData)
    }
}
