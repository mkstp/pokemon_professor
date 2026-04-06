# TDD: Game

**File:** `js/game.js`
**Depends on:** engine, map, battle, dialogue, audio, data

---

## Responsibility

Initialises all modules, owns the game loop, and manages scene transitions. `game.js` is the orchestrator — it decides which modules are active each frame and routes input, update, and draw calls accordingly. It holds no game state of its own.

---

## Data Structures

None. All state is owned by `engine.js`.

---

## Functions

### init()

- **Does:** Loads all modules, binds input listeners, and starts the game loop.
- **Inputs:** none
- **Returns:** void
- **Side effects:** Calls `engine.init()`, `data.init()`, `audio.init()`, `map.init()`, registers `keydown` event listener on `window`, calls `requestAnimationFrame(gameLoop)`.

---

### gameLoop(timestamp)

- **Does:** Advances the game by one frame — updates the active scene, then draws it.
- **Inputs:** `timestamp` — number: milliseconds since page load, provided by `requestAnimationFrame`.
- **Returns:** void
- **Side effects:** Calls `update()` and `draw()` on the active scene's module(s); schedules the next frame via `requestAnimationFrame(gameLoop)`.

The active scene is read from `engine.getState().activeScene`. Routing logic:

```
'overworld' → map.update(), map.draw(ctx), dialogue.draw(ctx) if dialogue active
'battle'    → battle.update(), battle.draw(ctx), dialogue.draw(ctx) if dialogue active
```

---

### update()

- **Does:** Delegates per-frame update logic to the active scene's module.
- **Inputs:** none
- **Returns:** void
- **Side effects:** May call `map.update()` or `battle.update()`. May call `switchScene()` if module signals a scene change.

---

### draw()

- **Does:** Clears the canvas and delegates draw calls to active modules in layer order.
- **Inputs:** none
- **Returns:** void
- **Side effects:** Writes to the canvas context (`ctx`). Draw order: map/battle background → UI elements → dialogue overlay (if active).

---

### switchScene(scene, options)

- **Does:** Transitions the game to a new scene, initialising the incoming module and stopping the outgoing one.
- **Inputs:** `scene` — string: `'overworld'` or `'battle'`; `options` — object (optional): scene-specific data (e.g. `{ professorId: 'prof_syntax' }` for a battle transition).
- **Returns:** void
- **Side effects:** Calls `engine.setScene(scene)`. For `'battle'`: calls `battle.init(options.professorId)`, `audio.switchTo('battle')`. For `'overworld'`: calls `audio.switchTo('overworld')`. Starts dialogue sequence if applicable via `dialogue.init(sequenceKey)`.

---

### handleInput(event)

- **Does:** Routes a keydown event to the appropriate handler for the active scene.
- **Inputs:** `event` — KeyboardEvent: the raw browser event.
- **Returns:** void
- **Side effects:** May call `map.handleInput(event.key)`, `battle.handleInput(event.key)`, or `dialogue.advance()` depending on active scene and dialogue state.

---

## Module Interfaces

**Reads from:** `engine` — `getState().activeScene` to determine routing each frame; `getState().pendingEncounter` to detect encounter triggers set by `map.js`.
**Exposes to:** All modules — `game.js` is the top-level caller. No other module calls into `game.js` directly; they communicate via `engine` state or return values.
