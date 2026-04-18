# TDD: Engine

**File:** `js/engine.js`
**Depends on:** none

---

## Responsibility

Owns the single `gameState` object — the authoritative record of everything that changes during play. All other modules read from and write to game state through this module's interface. No module modifies state directly; they call engine functions.

---

## Data Structures

### gameState

```js
{
  activeScene: string,         // current scene: 'overworld' | 'battle'
  playerHP: number,            // current player HP (max: 100)
  playerPosition: {            // player's tile coordinates in the current region
    x: number,
    y: number,
  },
  currentRegion: string,       // active map region id (e.g. 'outdoor', 'main_building')
  defeatedProfessors: array,   // ids of defeated professors, in defeat order
  pendingEncounter: string|null, // professor id set by map.js when player steps on trigger; null otherwise
  // Progression — persist across faints; reset only on page reload (no save/load)
  xp: number,                  // accumulated XP within the session (starts at 0)
  level: number,               // current player level (starts at 1)
  xpToNextLevel: number,       // XP threshold for the next level-up
  damageBuff: number,          // flat bonus added to all player move damage
  defenseStat: number,         // flat reduction applied to all incoming damage (min 0)
  // Move loadout — persist across faints; reset only on page reload
  learnedMoves: string[],      // all move IDs the player has unlocked (starts with 4 default moves)
  activeMoves: string[],       // ordered 4-move battle loadout (subset of learnedMoves)
}
```

---

## Functions

### init()

- **Does:** Sets `gameState` to its starting values.
- **Inputs:** none
- **Returns:** void
- **Side effects:** Writes initial values to `gameState`: `activeScene: 'overworld'`, `playerHP: 100`, `playerPosition: { x: <pond start>, y: <pond start> }`, `currentRegion: 'outdoor'`, `defeatedProfessors: []`, `pendingEncounter: null`, `xp: 0`, `level: 1`, `xpToNextLevel: 100`, `damageBuff: 0`, `defenseStat: 0`, `learnedMoves: [<4 starting move IDs>]`, `activeMoves: [<4 starting move IDs>]`.

---

### getState()

- **Does:** Returns the current game state.
- **Inputs:** none
- **Returns:** object: the `gameState` object. Callers should treat this as read-only.
- **Side effects:** none

---

### setPlayerHP(hp)

- **Does:** Updates the player's current HP.
- **Inputs:** `hp` — number: new HP value. Clamped to `[0, 100]`.
- **Returns:** void
- **Side effects:** Writes `gameState.playerHP`. If `hp <= 0`, also calls `resetGame()`.

---

### setPlayerPosition(x, y)

- **Does:** Updates the player's tile position within the current region.
- **Inputs:** `x` — number: tile column; `y` — number: tile row.
- **Returns:** void
- **Side effects:** Writes `gameState.playerPosition`.

---

### setRegion(regionId)

- **Does:** Updates the player's current map region and resets position to that region's entry point.
- **Inputs:** `regionId` — string: target region id (must exist in `data.regions`).
- **Returns:** void
- **Side effects:** Writes `gameState.currentRegion`. Writes `gameState.playerPosition` to the target region's entry coordinates (read from `data.regions[regionId].entryPosition`).

---

### setScene(scene)

- **Does:** Sets the active scene.
- **Inputs:** `scene` — string: `'overworld'` or `'battle'`.
- **Returns:** void
- **Side effects:** Writes `gameState.activeScene`.

---

### setPendingEncounter(professorId)

- **Does:** Flags that the player has stepped onto a professor's encounter tile.
- **Inputs:** `professorId` — string: id of the professor to encounter, or `null` to clear.
- **Returns:** void
- **Side effects:** Writes `gameState.pendingEncounter`.

---

### defeatProfessor(professorId)

- **Does:** Records a professor as defeated.
- **Inputs:** `professorId` — string: id of the defeated professor.
- **Returns:** void
- **Side effects:** Appends `professorId` to `gameState.defeatedProfessors` if not already present.

---

### isDefeated(professorId)

- **Does:** Checks whether a professor has been defeated.
- **Inputs:** `professorId` — string.
- **Returns:** boolean: `true` if `professorId` is in `defeatedProfessors`.
- **Side effects:** none

---

### allProfessorsDefeated()

- **Does:** Checks whether all five pre-castle professors have been defeated.
- **Inputs:** none
- **Returns:** boolean: `true` if `defeatedProfessors` contains all five non-final professor ids.
- **Side effects:** none

---

### resetGame()

- **Does:** Resets game state to starting values — used on player faint.
- **Inputs:** none
- **Returns:** void
- **Side effects:** Restores `playerHP`, `playerPosition`, `currentRegion`, and `activeScene` to starting values. Does **not** clear `defeatedProfessors`, `xp`, `level`, `xpToNextLevel`, `damageBuff`, `defenseStat`, `learnedMoves`, or `activeMoves` — all progression and move state persists across faints. State resets to zero only when `init()` is called (page load).

---

### awardXP(amount)

- **Does:** Adds XP and handles level-up if the threshold is crossed.
- **Inputs:** `amount` — number: XP to award.
- **Returns:** boolean: `true` if a level-up occurred, `false` otherwise. (Used by BattleScene to trigger the level-up UI message.)
- **Side effects:** Increments `gameState.xp`. If `xp >= xpToNextLevel`: increments `level`, resets `xp` to the carry-over remainder, updates `xpToNextLevel` (constant or per-level formula), increments `damageBuff` and `defenseStat` by their per-level amounts.

---

### addLearnedMove(moveId)

- **Does:** Adds a move ID to the player's learned move pool.
- **Inputs:** `moveId` — string: id of the move to unlock.
- **Returns:** void
- **Side effects:** Appends `moveId` to `gameState.learnedMoves` if not already present.

---

### setActiveMoves(moveIds)

- **Does:** Updates the player's active battle loadout.
- **Inputs:** `moveIds` — string[]: ordered array of exactly 4 move IDs, all of which must be in `learnedMoves`.
- **Returns:** void
- **Side effects:** Writes `gameState.activeMoves`.

---

## Module Interfaces

**Reads from:** `data` — region entry positions when `setRegion()` is called.
**Exposes to:** All Phaser scenes — `engine.js` is the shared state layer. Every scene that needs to read or write game state imports and calls engine functions.
