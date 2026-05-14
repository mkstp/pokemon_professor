# TDD: Overworld Scene

**File:** `js/scenes/OverworldScene.js`
**Depends on:** engine, data, visuals

---

## Responsibility

Renders the tile-based campus map and handles all overworld gameplay: player movement, encounter trigger detection, region transitions, ambient NPC interactions, and player menu access. Delegates weather effects to `visuals.js`. Transitions to `BattleScene` on professor encounter; launches `DialogueScene` for overworld dialogue and ambient NPC interactions; launches `KioskScene` for move/item/collection management.

---

## Data Structures

None. Scene-level references (player sprite, active tilemap layers, weather emitter) are stored as Phaser GameObjects on `this` — not as plain data structures.

---

## Phaser Scene Lifecycle

### preload()

- **Does:** Queues all overworld assets for loading before the scene starts.
- **Returns:** void
- **Side effects:** Calls `this.load.image` and `this.load.spritesheet` to queue: tileset PNG, player walk spritesheet, professor NPC spritesheets. Tilemap tile data comes from `data.regions[id].tileMap` (inline 2D array) and is passed directly to `this.make.tilemap({ data, tileWidth, tileHeight })` — no external Tiled JSON file is used.

---

### create()

- **Does:** Builds the tilemap, player sprite, input bindings, and initial weather effect. Called by Phaser after `preload()` completes.
- **Returns:** void
- **Side effects:**
  - Creates tilemap from loaded data; adds tileset; creates base and collision tile layers.
  - Sets collision on tiles with the property `collides: true` (configured in Tiled).
  - Adds player sprite at the pixel position corresponding to `engine.getState().playerPosition`.
  - Binds cursor keys via `this.input.keyboard.createCursorKeys()`.
  - Reads `engine.getState().currentRegion`; calls `visuals.createWeather(this, region.weatherEffect)` if the region has a weather effect.
  - Calls `this.scene.get('AudioScene').switchTo('overworld')`.
  - Reads `engine.getState().defeatedProfessors` to hide NPC sprites for defeated professors.

---

### update(time, delta)

- **Does:** Processes tile-based player movement and checks for encounter and transition triggers after each step.
- **Inputs:** `time` — number: ms since game start; `delta` — number: ms since last frame.
- **Returns:** void
- **Side effects:**
  - On directional key press (debounced — one tile per keydown event): computes target tile. If the target tile is walkable (not collision-flagged), tweens the player sprite to the new pixel position and calls `engine.setPlayerPosition(x, y)`.
  - After each completed move, calls `checkEncounterTrigger(x, y)` and `checkRegionTransition(x, y)`.

---

### checkEncounterTrigger(x, y)

- **Does:** Checks whether the player's current tile matches an encounter trigger for an undefeated professor.
- **Inputs:** `x` — number: tile column; `y` — number: tile row.
- **Returns:** void
- **Side effects:** Reads `data.regions[regionId].encounterTiles`. If the tile matches a professor who is not defeated (`engine.isDefeated(id)` is false), calls `engine.setPendingEncounter(professorId)` then launches `DialogueScene` with the pre-battle sequence key. The castle encounter additionally requires `engine.allProfessorsDefeated()` to return true before triggering.

---

### checkRegionTransition(x, y)

- **Does:** Checks whether the player's current tile is a region transition point.
- **Inputs:** `x` — number: tile column; `y` — number: tile row.
- **Returns:** void
- **Side effects:** Reads `data.regions[regionId].connections`. If the tile matches a connection, calls `engine.setRegion(targetId)` and restarts the scene to load the new region's tilemap and weather.

---

### checkAmbientNPCInteraction(x, y)

- **Does:** Checks whether the player is adjacent to an ambient NPC and the interaction key is pressed.
- **Inputs:** `x` — number: tile column; `y` — number: tile row.
- **Returns:** void
- **Side effects:** Reads `data.ambientNPCs` for the current region. If the player is adjacent to an NPC tile and presses the interact key, launches `DialogueScene` with the NPC's dialogue sequence key. If the NPC has a `reward` and (`repeatableReward` is true or the item has not been given yet), calls `engine.addItem(reward)` after dialogue completes.

---

### Player Menu Access

The player menu (`KioskScene`) is accessible at any time in the overworld by pressing `I`. It opens as an overlay with three tabs — MOVES, ITEMS, COLLECTION — cycled with TAB. In overworld mode, only items the player has collected are shown in the ITEMS tab; MOVES and COLLECTION are always available. On exit (ESC or I), both the move loadout and item loadout are saved to engine state and the overworld resumes.

Init params: `{ mode: 'overworld', onClose }`. The overworld disables its own input while the menu is open and re-enables it in `onClose`.

---

## Module Interfaces

**Reads from:**
- `engine` — player position, current region, defeated professors; `isDefeated()`, `allProfessorsDefeated()`, `setPlayerPosition()`, `setRegion()`, `setPendingEncounter()`, `addItem()`
- `data` — region tile maps, encounter tiles, region connections, weather effects, `ambientNPCs`
- `visuals` — `createWeather(scene, weatherType)`, called in `create()`

**Exposes to:**
- `main.js` — registered as `'OverworldScene'`; first scene started on game launch
- `BattleScene` — started via `this.scene.start('BattleScene', { opponentType, opponentId })` after pre-battle dialogue completes
- `DialogueScene` — launched via `this.scene.launch('DialogueScene', { sequenceKey, onComplete })` for pre/post-encounter dialogue and ambient NPC interactions
- `KioskScene` — launched as overlay when player presses I in the overworld
- `AudioScene` — accessed via `this.scene.get('AudioScene').switchTo(trackId)`
