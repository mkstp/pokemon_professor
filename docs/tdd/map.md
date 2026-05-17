# TDD: Overworld Scene

**File:** `js/scenes/CourtyardScene.js`
**Depends on:** engine, data, visuals

---

## Responsibility

Renders the tile-based campus map and handles all overworld gameplay: player movement, encounter trigger detection, region transitions, ambient NPC interactions, and player menu access. Delegates weather effects to `visuals.js`. Transitions to `BattleScene` on professor encounter; launches `DialogueScene` for overworld dialogue and ambient NPC interactions; launches `KioskScene` for move/item/collection management.

---

## Map Asset Convention

Each region has a dedicated Tiled map file (`.tmj`, Tiled JSON format) at `assets/maps/<region_id>.tmj`. All regions share one tileset PNG: `assets/tilesets/stardew-outdoors-spring.png` (656×1664px, 16×16 tiles, 41 columns). The Tiled-internal name for this tileset is `PC _ Computer - Stardew Valley - Tilesets - Outdoors (Spring)`.

### Tile layers (render order, bottom to top)

| Layer name | Purpose                                                     |
|------------|-------------------------------------------------------------|
| `Ground`   | Base terrain — always walkable; rendered first              |
| `World`    | Walls, furniture, obstacles — collision tiles live here     |
| `Above`    | Tree canopies, overhangs — rendered above the player sprite |

The player sprite is inserted into the Phaser display list between `World` and `Above` so that tall objects correctly occlude the player.

### Collision

Collision is defined by marking individual tiles in the shared tileset editor with the custom boolean property `collides: true`. In code, the `World` layer activates those tiles:

```js
worldLayer.setCollisionByProperty({ collides: true });
this.physics.add.collider(player, worldLayer);
```

No separate collision geometry is needed. Every map that paints a tile with `collides: true` onto its `World` layer inherits correct blocking automatically.

### Object layer

Each map has one object layer named `Objects`. All non-visual, game-logic elements are defined here as named rectangle objects with Tiled custom properties:

| Object `type`  | Required properties                              | Optional properties                                      | Purpose                              |
|----------------|--------------------------------------------------|----------------------------------------------------------|--------------------------------------|
| `spawn`        | —                                                | —                                                        | Default player spawn point           |
| `encounter`    | `professorId` (string)                           | `requiresAllDefeated` (bool)                             | Triggers a professor encounter       |
| `transition`   | `targetRegion` (string), `targetTileX` (int), `targetTileY` (int) | `requiresAllDefeated` (bool), `requiresItem` (string) | Moves player to another region       |
| `npc`          | `npcId` (string)                                 | —                                                        | Ambient NPC position                 |

`requiresAllDefeated: true` blocks the object until `engine.allProfessorsDefeated()` returns true (used for the castle gate). `requiresItem` blocks the object until the named item is in the player's inventory (used for the courtyard code gate).

`data.regions` contains display and audio metadata only (`id`, `displayName`, `mapFile`, `weatherEffect`, `music`). All spatial data — spawn point, encounter zones, transition zones, NPC positions — is defined in the Objects layer of each map file.

---

## Sprite Sheet Convention

All overworld sprite sheets — player and professor NPCs — follow the same layout:

- **Frame size:** 64×64px
- **Grid:** 4 columns × 4 rows (256×256px total)
- **Row order:** down (row 0), left (row 1), right (row 2), up (row 3)
- **Frames per row:** 4 (idle, step-left, idle, step-right)
- **Walk animation:** frames 0–2 of each row at frameRate 8, repeat -1
- **Idle frame:** frame 1 of the current direction row

---

## Data Structures

None. Scene-level references (player sprite, tilemap layers, collision group, object zone arrays, weather emitter) are stored as Phaser GameObjects or plain arrays on `this`.

The following arrays are populated in `create()` from the Objects layer and used by the check methods in `update()`:

- `this.encounterZones` — `[{ bounds: Phaser.Geom.Rectangle, professorId, requiresAllDefeated }]`
- `this.transitionZones` — `[{ bounds: Phaser.Geom.Rectangle, targetRegion, targetTileX, targetTileY, requiresAllDefeated, requiresItem }]`
- `this.npcObjects` — `[{ bounds: Phaser.Geom.Rectangle, npcId }]`

---

## Phaser Scene Lifecycle

### preload()

- **Does:** Queues all overworld assets for loading.
- **Returns:** void
- **Side effects:**
  - `this.load.image('tileset', 'assets/tilesets/stardew-outdoors-spring.png')`
  - `this.load.tilemapTiledJSON(region.id, region.mapFile)` where `region` is `data.regions[engine.getState().currentRegion]`
  - `this.load.spritesheet('player', data.player.sprites.overworld, { frameWidth: 64, frameHeight: 64 })`
  - `this.load.spritesheet(prof.id, prof.sprites.overworld, { frameWidth: 64, frameHeight: 64 })` for every professor in `data.professors`

---

### create()

- **Does:** Builds the scene. Called by Phaser after `preload()` completes.
- **Returns:** void
- **Side effects:**
  - Creates tilemap: `this.make.tilemap({ key: region.id })`
  - Adds tileset: `map.addTilesetImage('PC _ Computer - Stardew Valley - Tilesets - Outdoors (Spring)', 'tileset')`
  - Creates layers: `groundLayer = map.createLayer('Ground', tileset)`, `worldLayer = map.createLayer('World', tileset)`
  - Activates collision: `worldLayer.setCollisionByProperty({ collides: true })`
  - Reads the `Objects` layer; populates `this.encounterZones`, `this.transitionZones`, `this.npcObjects`; extracts the `spawn` object's pixel position as the player's starting point.
  - Adds player sprite at the spawn pixel position; adds Arcade Physics body; adds collider against `worldLayer`.
  - Creates walk animations (`walk-down`, `walk-left`, `walk-right`, `walk-up`) and sets idle frame.
  - Creates `aboveLayer = map.createLayer('Above', tileset)`; sets its depth above the player sprite.
  - Adds NPC sprites for each undefeated professor at their `npc` object position; hides sprites for defeated professors.
  - Binds cursor keys via `this.input.keyboard.createCursorKeys()`.
  - Calls `visuals.createWeather(this, region.weatherEffect)` if applicable.
  - Calls `this.scene.get('AudioScene').switchTo(region.music)`.
  - Sets `this._transitioning = false`.
  - Fades the camera in from black: `this.cameras.main.fadeIn(300, 0, 0, 0)`.

---

### update(time, delta)

- **Does:** Processes player movement each frame.
- **Inputs:** `time` (ms since game start), `delta` (ms since last frame).
- **Returns:** void
- **Side effects:**
  - On directional key press (debounced — one tile per keydown): plays the walk animation for that direction; tweens the player sprite 16px in that direction. Phaser Arcade Physics prevents movement into `worldLayer` collision tiles — no manual walkability check is needed.
  - On tween complete: snaps to the tile centre; plays idle frame; updates `engine.setPlayerPosition(x, y)` in tile coordinates; calls `checkEncounterTrigger()` and `checkRegionTransition()`.
  - If `this._transitioning` is true, skips all input processing and returns early.

---

### checkEncounterTrigger()

- **Does:** Tests whether the player's current world position overlaps any encounter zone.
- **Returns:** void
- **Side effects:** Iterates `this.encounterZones`. For a matching zone whose professor is not defeated (`engine.isDefeated(id)` is false) and whose `requiresAllDefeated` condition (if set) is satisfied, calls `engine.setPendingEncounter(professorId)` then launches `DialogueScene` with the pre-battle sequence key.

---

### checkRegionTransition()

- **Does:** Tests whether the player's current world position overlaps any transition zone.
- **Returns:** void
- **Side effects:** Iterates `this.transitionZones`. For a matching zone whose conditions are satisfied (`requiresAllDefeated`, `requiresItem`):
  1. Sets `this._transitioning = true` to lock input and prevent re-entry.
  2. Calls `this.cameras.main.fadeOut(300, 0, 0, 0)`.
  3. Listens once for `'camerafadeoutcomplete'` on `this.cameras.main`: in that handler, calls `engine.setRegion(targetRegion)` and `engine.setPlayerPosition(targetTileX, targetTileY)`, then calls `this.scene.restart()`.

---

### checkAmbientNPCInteraction()

- **Does:** Checks whether the player is adjacent to an ambient NPC and the interact key is pressed.
- **Returns:** void
- **Side effects:** Reads `data.ambientNPCs` for the current region. If the player is adjacent to an NPC and presses the interact key, launches `DialogueScene` with the NPC's sequence key. Calls `engine.addItem(reward)` after dialogue if the NPC has an uncollected reward.

---

### Player Menu Access

The player menu (`KioskScene`) is accessible at any time in the overworld by pressing `I`. Init params: `{ mode: 'overworld', onClose }`. The overworld disables its keyboard input while the menu is open and re-enables it in `onClose`.

---

## Module Interfaces

**Reads from:**
- `engine` — `getState()` (currentRegion, playerPosition, defeatedProfessors); `isDefeated()`, `allProfessorsDefeated()`, `setPlayerPosition()`, `setRegion()`, `setPendingEncounter()`, `addItem()`
- `data` — `data.regions[id].mapFile`, `data.regions[id].weatherEffect`, `data.regions[id].music`; `data.professors` (all, for spritesheet preloading); `data.player.sprites.overworld`; `data.ambientNPCs`
- `visuals` — `createWeather(scene, weatherType)`

**Exposes to:**
- `main.js` — registered as `'CourtyardScene'`; started on game launch
- `BattleScene` — started via `this.scene.start('BattleScene', { professorId })` after pre-battle dialogue
- `DialogueScene` — launched via `this.scene.launch('DialogueScene', { sequenceKey, onComplete })`
- `KioskScene` — launched as overlay on `I` keypress
- `AudioScene` — accessed via `this.scene.get('AudioScene').switchTo(trackId)`
