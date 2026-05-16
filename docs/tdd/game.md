# TDD: Game Bootstrap

**File:** `js/main.js`
**Depends on:** MainMenuScene, OverworldScene, BattleScene, BattleModeScene, DialogueScene, AudioScene, KioskScene

---

## Responsibility

Instantiates the Phaser game and registers all scenes. This is the entry point — it creates the `Phaser.Game` instance with its configuration and does nothing else. All game logic lives in the scene files.

---

## Data Structures

### Phaser.Game Config

The configuration object passed to `new Phaser.Game(config)`:

```js
{
  type:            Phaser.AUTO,    // renderer: WebGL if available, Canvas fallback
  width:           400,            // canvas width in pixels
  height:          400,            // canvas height in pixels
  backgroundColor: '#000000',      // fill colour shown before first scene renders
  pixelArt:        true,           // nearest-neighbour filtering; prevents dark fringe on scaled sprites
  scene: [                         // scene registry — first entry auto-starts on launch
    MainMenuScene,                 // ← entry point; all other scenes launched from here
    OverworldScene,
    BattleScene,
    BattleModeScene,               // opponent selector for jumping straight into any battle
    DialogueScene,
    AudioScene,
    KioskScene,                    // unified player menu (moves · items · collection); opened with I key
  ],
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
}
```

`MainMenuScene` auto-starts on launch. All other scenes are inactive until `MainMenuScene` (or a downstream scene) explicitly launches or wakes them. `AudioScene` is launched once by `MainMenuScene.create()` and runs permanently for the lifetime of the game.

---

## Functions

None. `main.js` contains only the config object and the `new Phaser.Game(config)` instantiation call.

---

## Module Interfaces

**Reads from:** none  
**Exposes to:** nothing — `main.js` is the application entry point, loaded by `index.html`. It registers scenes with the Phaser runtime; scene lifecycle from this point is managed by Phaser.
