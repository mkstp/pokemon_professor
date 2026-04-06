# TDD: Map

**File:** `js/map.js`
**Depends on:** engine, data

---

## Responsibility

Renders the tile-based overworld: tiles, player sprite, weather overlays, and atmospheric effects. Handles player movement, detects encounter triggers, and detects region transitions. Signals encounters to `game.js` by writing to engine state; does not resolve them.

---

## Data Structures

### inputState

Module-level object tracking which movement keys are currently held:

```js
{
  up: boolean,
  down: boolean,
  left: boolean,
  right: boolean,
}
```

Updated by `handleInput()`. Read by `update()` each frame to compute movement.

---

## Functions

### init(ctx)

- **Does:** Stores the canvas context and loads the tile spritesheet. Reads starting region and player position from engine state.
- **Inputs:** `ctx` — CanvasRenderingContext2D: the game canvas context.
- **Returns:** void
- **Side effects:** Stores `ctx` reference. Loads tile and player sprite images. Reads `engine.getState().currentRegion` and `engine.getState().playerPosition` to set initial render state.

---

### update()

- **Does:** Moves the player based on current input, checks for region transitions, and checks for encounter triggers.
- **Inputs:** none
- **Returns:** void
- **Side effects:**
  - Reads `inputState` to compute next player position.
  - Calls `engine.setPlayerPosition(x, y)` if movement is valid (target tile is walkable).
  - Calls `checkRegionTransition(x, y)` — if triggered, calls `engine.setRegion(targetRegion)`.
  - Calls `checkEncounterTrigger(x, y)` — if triggered, calls `engine.setPendingEncounter(professorId)`.

---

### draw(ctx)

- **Does:** Draws the current region in layer order: tiles → professor sprites (if not defeated) → player sprite → weather overlay.
- **Inputs:** `ctx` — CanvasRenderingContext2D.
- **Returns:** void
- **Side effects:** Writes to canvas. Reads `engine.getState()` for player position and defeated professors. Reads `data.regions[currentRegion]` for tile layout and weather effect.

---

### handleInput(key)

- **Does:** Updates `inputState` when a movement key is pressed or released.
- **Inputs:** `key` — string: the key identifier (e.g. `'ArrowUp'`, `'w'`).
- **Returns:** void
- **Side effects:** Writes to module-level `inputState`.

---

### checkEncounterTrigger(x, y)

- **Does:** Checks whether the player's current tile is a professor encounter trigger. Gates the castle encounter on `engine.allProfessorsDefeated()`.
- **Inputs:** `x` — number: tile column; `y` — number: tile row.
- **Returns:** void
- **Side effects:** If the tile matches an entry in `data.regions[currentRegion].encounterTiles` and the professor is not already defeated, calls `engine.setPendingEncounter(professorId)`. If the tile is the castle encounter and `engine.allProfessorsDefeated()` is false, does nothing (path remains blocked).

---

### checkRegionTransition(x, y)

- **Does:** Checks whether the player's current tile is a region transition point.
- **Inputs:** `x` — number: tile column; `y` — number: tile row.
- **Returns:** void
- **Side effects:** If the tile matches a connection in `data.regions[currentRegion].connections`, calls `engine.setRegion(targetRegion)` with the target tile as the entry position.

---

### drawWeather(ctx)

- **Does:** Renders the weather overlay for the current region.
- **Inputs:** `ctx` — CanvasRenderingContext2D.
- **Returns:** void
- **Side effects:** Writes to canvas. Effect type is read from `data.regions[currentRegion].weatherEffect`. No-ops if `weatherEffect` is null.

---

## Module Interfaces

**Reads from:**
- `engine` — player position, current region, defeated professors list, `allProfessorsDefeated()` result
- `data` — region tile maps, encounter tiles, region connections, weather effects

**Exposes to:**
- `game` — `init(ctx)`, `update()`, `draw(ctx)`, `handleInput(key)` called by the game loop each frame during the overworld scene
