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
                window.bridge?.platform?.language
            ) {
                const bridgeLanguage = window.bridge.platform.language
                if (bridgeLanguage && typeof bridgeLanguage === 'string') {
                    // Map common language codes to our supported languages
                    const languageMap: { [key: string]: string } = {
                        ru: 'ru',
                        'ru-RU': 'ru',
                        de: 'de',
                        'de-DE': 'de',
                        es: 'es',
                        'es-ES': 'es',
                        fr: 'fr',
                        'fr-FR': 'fr',
                        pt: 'pt',
                        'pt-BR': 'pt',
                        'pt-PT': 'pt',
                        pl: 'pl',
                        'pl-PL': 'pl',
                        hi: 'hi',
                        'hi-IN': 'hi',
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

        // Map browser language codes to our supported languages
        const supportedLanguages = [
            'en',
            'ru',
            'de',
            'es',
            'fr',
            'pt',
            'pl',
            'hi',
        ]
        if (supportedLanguages.includes(languageCode)) {
            this.currentLanguage = languageCode
        } else {
            this.currentLanguage = 'en'
        }
    }

    private async loadLocalizationData(): Promise<void> {
        try {
            const languages = ['en', 'ru', 'de', 'es', 'fr', 'pt', 'pl', 'hi']

            for (const lang of languages) {
                try {
                    const response = await fetch(
                        `assets/localization/${lang}.json`,
                    )
                    if (response.ok) {
                        this.localizationData[lang] = await response.json()
                    } else {
                        console.warn(`Failed to load ${lang} localization data`)
                    }
                } catch (error) {
                    console.warn(
                        `Failed to load ${lang} localization data:`,
                        error,
                    )
                }
            }
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
        let data: LocalizationData | string =
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
                data = data[k] as LocalizationData | string
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
            return data.replace(
                /\{(\w+)\}/g,
                (match: string, paramName: string) => {
                    return params[paramName]?.toString() || match
                },
            )
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
