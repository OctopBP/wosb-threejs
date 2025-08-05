# Localization System

This directory contains the localization system for the World of Sea Battle game.

## Overview

The localization system supports multiple languages and automatically detects the user's language preference from:
1. The Playgama bridge platform language setting (`bridge.platform.language`)
2. The browser's language settings as fallback

## Files

* `LocalizationManager.ts` - Main localization manager class
* `test.ts` - Test functions for the localization system

## Localization Files

The actual localization data is stored in `public/localization/` :
* `en.json` - English translations
* `ru.json` - Russian translations

## Usage

### Basic Usage

```typescript
import { LocalizationManager } from './localization/LocalizationManager'

// Get the singleton instance
const manager = LocalizationManager.getInstance()

// Initialize (done automatically in main.ts)
await manager.initialize()

// Get localized text
const text = manager.getText('goals.initialWave', { enemyCount: 5 })

// Switch languages
manager.setLanguage('en')
manager.setLanguage('ru')
```

### Text Keys

The localization system uses dot-notation keys:

* `goals.tutorial` - Tutorial goal text
* `goals.initialWave` - Initial wave goal text
* `goals.wave1` - Wave 1 goal text
* `goals.wave2` - Wave 2 goal text
* `goals.bossFight` - Boss fight goal text
* `tutorial.moveInstruction` - Movement tutorial instruction
* `newShipOffer.topText` - New ship offer top text
* `newShipOffer.bottomText` - New ship offer bottom text
* `newShipOffer.buttonText` - New ship offer button text

### Parameter Interpolation

Text can include parameters using `{parameterName}` syntax:

```typescript
// In JSON: "Destroy {enemyCount} enemies"
const text = manager.getText('goals.wave1', { enemyCount: 10 })
// Result: "Destroy 10 enemies"
```

## Language Detection

The system automatically detects the user's language:

1. **Bridge Platform**: Checks `bridge.platform.language` if available
2. **Browser Language**: Falls back to `navigator.language`
3. **Default**: Uses English if no supported language is detected

## Supported Languages

* `en` - English (default)
* `ru` - Russian

## Adding New Languages

1. Create a new JSON file in `public/localization/` (e.g.,  `fr.json`)
2. Add the language loading in `LocalizationManager.ts`
3. Update the language mapping if needed

## Adding New Text Keys

1. Add the key to all language JSON files
2. Use the key in your code with `manager.getText('your.key')`
3. For parameterized text, use `{paramName}` syntax in the JSON
