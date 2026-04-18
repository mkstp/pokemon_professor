# TDD: Game Bootstrap

**File:** `js/main.js`
**Depends on:** OverworldScene, BattleScene, DialogueScene, AudioScene

---

## Responsibility

Instantiates the Phaser game and registers all scenes. This is the entry point — it creates the `Phaser.Game` instance with its configuration and does nothing else. All game logic lives in the scene files.

---

## Data Structures

### Phaser.Game Config

The configuration object passed to `new Phaser.Game(config)`:

```js
{
  type:   Phaser.AUTO,         // renderer: WebGL if available, Canvas fallback
  width:  480,                 // canvas width in pixels
  height: 320,                 // canvas height in pixels
  backgroundColor: '#000000',  // fill colour shown before first scene renders
  scene: [                     // scene registry — first entry auto-starts on launch
    OverworldScene,
    BattleScene,
    DialogueScene,
    AudioScene,
  ],
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
}
```

---

## Functions

None. `main.js` contains only the config object and the `new Phaser.Game(config)` instantiation call.

---

## Module Interfaces

**Reads from:** none  
**Exposes to:** nothing — `main.js` is the application entry point, loaded by `index.html`. It registers scenes with the Phaser runtime; scene lifecycle from this point is managed by Phaser.
