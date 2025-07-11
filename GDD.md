# Game Design Document

## World of Sea Battle - Playable Ad

### Version 1.0

### Date: December 2024

---

## 1. Game Overview

### 1.1 Game Concept

**World of Sea Battle** is a short-form playable advertisement designed to showcase the core naval combat mechanics of the main game. Players control a small sailboat that progressively upgrades through combat encounters, culminating in a boss battle that drives conversion to the full game.

### 1.2 Target Platform

* **Primary:** Mobile Web (iOS Safari, Android Chrome)
* **Secondary:** Desktop Web
* **Format:** HTML5 Playable Ad
* **Duration:** 20-30 seconds
* **File Size:** <10MB (industry standard for playable ads)

### 1.3 Core Pillars

1. **Progressive Power Fantasy** - Start weak, become powerful
2. **Immediate Gratification** - Quick wins and visual upgrades
3. **Compelling Hook** - Boss encounter creates desire for full game
4. **Intuitive Controls** - No learning curve, instant engagement

---

## 2. Core Gameplay Mechanics

### 2.1 Movement System

* **Control Method:** Touch/drag or mouse for steering
* **Movement Type:** Free directional movement in 2D space
* **Speed:** Dynamic based on ship level and upgrades
* **Boundaries:** Invisible ocean boundaries prevent leaving play area

### 2.2 Combat System

* **Engagement:** Proximity-based automatic combat initiation
* **Attack Range:** Visual circle indicator around player ship
* **Damage Calculation:** Level-based damage output
* **Visual Feedback:** Cannon fire animations, explosion effects
* **Loot Collection:** Automatic barrel collection on enemy defeat

### 2.3 Progression Mechanics

* **Experience Sources:**
  + Enemy ship defeats (primary)
  + Treasure chest discoveries (secondary)
  + Environmental pickups (barrels, crates)
* **Level Requirements:** Incremental XP thresholds
* **Upgrade Triggers:** Immediate visual transformation on level up

---

## 3. Game Flow & Pacing

### 3.1 Phase 1: Introduction (0-15 seconds)

**Objective:** Establish context and controls

* Player spawns in center of ocean environment
* 6-8 enemy ships visible with names/flags (fake multiplayer illusion)
* UI displays: "Level: 1" and "Kills: 0/10"
* Subtle control hint animation (touch/drag indicator)
* Background music establishes nautical theme

### 3.2 Phase 2: First Victory (15-30 seconds)

**Objective:** Deliver immediate satisfaction

* Player approaches nearest enemy (guided by design)
* Automatic combat engagement with satisfying VFX
* Cannon volleys → explosion → barrel drops
* **Level Up Event:**
  + Screen flash/particle effects
  + Ship visual upgrade (additional sail)
  + UI updates to "Level: 2"
  + Brief celebratory audio sting

### 3.3 Phase 3: Power Progression (30-60 seconds)

**Objective:** Demonstrate growth curve

* **Enemy Variety:**
  + 3-4 weak ships (quick defeats)
  + 2-3 upgraded enemies (require multiple hits)
* **Environmental Rewards:**
  + 2-3 treasure chests for bonus XP
  + Scattered barrels for minor progression
* **Progressive Upgrades:**
  + Level 3: Additional cannons
  + Level 4: Ship hull color change
  + Level 5: Decorative elements (flags, trim)
  + Level 6: Size increase + elite appearance

### 3.4 Phase 4: Boss Encounter (60-75 seconds)

**Objective:** Create challenge and desire

* **Setup Phase:**
  + All enemies defeated, ocean appears empty
  + Screen edges pulse red (danger indicator)
  + Text warning: "WARNING! Enemy battleship approaching"
* **Boss Reveal:**
  + Camera pans to show massive enemy ship
  + Boss ship 3x larger than player, heavily armed
  + Intimidating design with dark colors, multiple cannon tiers
* **Engagement:**
  + Camera returns to player
  + Player attacks deal minimal visible damage
  + Boss remains threatening and powerful

### 3.5 Phase 5: Call-to-Action (75-90 seconds)

**Objective:** Drive conversion

* **Game Logo Reveal:** "World of Sea Battle"
* **Tagline:** "Become the Legend of the Archipelago"
* **Value Proposition:** "Need something stronger? Claim your '[Elite Battleship]' for free right now!"
* **Hero Ship Image:** Impressive vessel that visually matches boss power level
* **CTA Button:** Large, prominent "Get Ship" button
* **Urgency Elements:** Limited time offer indicators

---

## 4. Visual Design

### 4.1 Art Style

* **Theme:** Stylized nautical/pirate aesthetic
* **Color Palette:** Ocean blues, warm ship browns, vibrant upgrade colors
* **Lighting:** Dynamic with sunset/golden hour ambiance
* **Camera:** Top-down perspective with slight isometric tilt

### 4.2 Ship Design Progression

* **Level 1:** Small wooden sailboat, single mast, basic brown hull
* **Level 2:** Additional sail, rope details
* **Level 3:** Cannon ports added, slightly larger
* **Level 4:** Hull color upgrade (blue/red accents)
* **Level 5:** Decorative flags, improved sails
* **Level 6:** Larger size, multiple masts, elite appearance

### 4.3 Environmental Elements

* **Ocean:** Animated water with subtle wave motion
* **Background:** Distant islands/coastline for context
* **Weather:** Clear conditions for optimal visibility
* **Debris:** Floating barrels, wooden crates for collection

### 4.4 VFX Requirements

* **Combat Effects:**
  + Cannon muzzle flashes
  + Cannonball trails
  + Explosion particles (fire, smoke, debris)
* **Progression Effects:**
  + Level-up screen flash
  + Sparkle particles around ship upgrades
  + Treasure chest opening animation
* **Boss Effects:**
  + Screen edge red pulse
  + Camera shake during boss reveal
  + Intimidating aura around boss ship

---

## 5. Audio Design

### 5.1 Music

* **Main Theme:** Adventurous nautical orchestral track
* **Intensity:** Builds progressively with player power
* **Boss Theme:** Dramatic, threatening musical shift
* **Duration:** 90-second loop with natural endpoints

### 5.2 Sound Effects

* **Combat:** Cannon fire, explosions, wood impacts
* **Progression:** Level-up chimes, treasure collection
* **UI:** Button presses, menu transitions
* **Ambient:** Ocean waves, seagulls, ship creaking

### 5.3 Audio Mixing

* **Priority:** Critical gameplay sounds > music > ambient
* **Compression:** Optimized for mobile speakers
* **Fallback:** Silent mode functionality for muted playback

---

## 6. User Interface

### 6.1 HUD Elements

* **Ship Level:** Top-left corner, highly visible
* **Kill Counter:** "Kills: X/10" below level indicator
* **Control Hints:** Subtle animation on first load
* **Progress Bar:** Optional XP visualization

### 6.2 Call-to-Action Screen

* **Logo:** Prominent game branding
* **Hero Image:** Compelling ship illustration
* **Button Design:** High contrast, finger-friendly size
* **Information Hierarchy:** Clear value proposition flow

### 6.3 Responsive Design

* **Mobile Portrait:** Primary layout optimization
* **Mobile Landscape:** Adapted UI positioning
* **Desktop:** Scaled appropriately for mouse interaction

---

## 7. Technical Specifications

### 7.1 Engine & Framework

* **Rendering:** Three.js 3D engine
* **Language:** TypeScript for type safety
* **Build Tool:** Vite for development and bundling
* **Package Management:** npm

### 7.2 Performance Targets

* **Frame Rate:** 60 FPS on mid-tier mobile devices
* **Load Time:** <3 seconds on 3G connection
* **Memory Usage:** <100MB RAM consumption
* **Battery Impact:** Minimal drain during playback

### 7.3 Compatibility

* **iOS:** Safari 12+, iOS 12+
* **Android:** Chrome 70+, Android 7+
* **Desktop:** Chrome 70+, Firefox 65+, Safari 12+

### 7.4 File Structure

```text
src/
  ├── scenes/
  │   ├── GameScene.ts        # Main gameplay scene
  │   ├── MenuScene.ts        # CTA screen
  │   └── LoadingScene.ts     # Asset loading
  ├── entities/
  │   ├── PlayerShip.ts       # Player ship class
  │   ├── EnemyShip.ts        # Enemy ship variants
  │   └── BossShip.ts         # Boss encounter
  ├── systems/
  │   ├── CombatSystem.ts     # Combat mechanics
  │   ├── ProgressionSystem.ts # Leveling logic
  │   └── VFXSystem.ts        # Visual effects
  ├── ui/
  │   ├── HUD.ts              # In-game interface
  │   └── CTA.ts              # Call-to-action screen
  └── assets/
      ├── models/             # 3D ship models
      ├── textures/           # Ship and environment textures
      ├── audio/              # Sound effects and music
      └── vfx/                # Particle effect definitions
```

---

## 8. Monetization Strategy

### 8.1 Conversion Funnel

1. **Awareness:** Player sees ad in social feed/game
2. **Interest:** Engages with playable content
3. **Desire:** Experiences progression and hits boss wall
4. **Action:** Clicks "Get Ship" to download full game

### 8.2 Psychological Triggers

* **Loss Aversion:** Boss encounter shows player's weakness
* **Achievement:** Progression creates investment in character
* **Social Proof:** Fake multiplayer suggests active community
* **Urgency:** Limited-time offer language

### 8.3 A/B Testing Variables

* **CTA Button:** Color, size, text variations
* **Offer Presentation:** Free vs. premium ship emphasis
* **Boss Difficulty:** Frustration vs. challenge balance
* **Progression Speed:** Fast vs. gradual leveling

---

## 9. Success Metrics

### 9.1 Engagement KPIs

* **Completion Rate:** >70% players reach CTA screen
* **Average Session Time:** 75-90 seconds
* **Interaction Rate:** >80% players move beyond tutorial
* **Retention:** Players who engage for >30 seconds

### 9.2 Conversion KPIs

* **Click-Through Rate:** >8% (industry benchmark: 3-5%)
* **Install Rate:** >20% of clicks result in app store visits
* **Cost Per Install:** Target based on full game LTV

### 9.3 Technical KPIs

* **Load Success Rate:** >95% on target devices
* **Frame Rate Consistency:** <5% of users experience drops
* **Error Rate:** <1% critical failures

---

## 10. Development Timeline

### 10.1 Phase 1: Core Framework (Week 1)

* Basic ship movement and controls
* Simple combat system implementation
* Enemy AI and spawning logic
* Basic progression mechanics

### 10.2 Phase 2: Visual Polish (Week 2)

* Ship upgrade visual system
* VFX implementation (combat, progression)
* UI/HUD development
* Basic audio integration

### 10.3 Phase 3: Boss & CTA (Week 3)

* Boss encounter scripting
* Call-to-action screen development
* Advanced VFX for boss sequence
* Music and sound polish

### 10.4 Phase 4: Optimization (Week 4)

* Performance optimization for mobile
* Cross-platform testing
* A/B testing setup for CTA variants
* Final bug fixes and polish

---

## 11. Risk Assessment

### 11.1 Technical Risks

* **Performance:** Complex VFX may impact frame rate
* **Compatibility:** Browser-specific rendering issues
* **File Size:** Asset optimization challenges

### 11.2 Design Risks

* **Pacing:** Too fast/slow progression curve
* **Difficulty:** Boss encounter frustration vs. motivation
* **Clarity:** Control scheme accessibility

### 11.3 Business Risks

* **Conversion:** CTA effectiveness uncertainty
* **Competition:** Similar playable ads in market
* **Platform:** Ad network policy compliance

---

## 12. Post-Launch Support

### 12.1 Analytics Integration

* **Player Behavior:** Heat maps, interaction tracking
* **Performance Monitoring:** Frame rate, load times
* **Conversion Tracking:** Funnel analysis, drop-off points

### 12.2 Iteration Plan

* **Weekly Reviews:** Metric analysis and optimization
* **A/B Testing:** Continuous CTA optimization
* **Feature Updates:** Based on player feedback and data

### 12.3 Maintenance

* **Bug Fixes:** Critical issue response within 24 hours
* **Platform Updates:** Browser compatibility maintenance
* **Content Refresh:** Seasonal variations if successful

---

*This document serves as the foundation for development and should be updated as the project evolves based on testing and feedback.*
