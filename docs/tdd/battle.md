# TDD: Battle Scene

**File:** `js/scenes/BattleScene.js`
**Depends on:** engine, data

---

## Responsibility

Owns the turn-based battle loop: move selection, damage resolution, and HP management. Renders all battle UI as Phaser GameObjects. Returns control to `OverworldScene` when the battle ends. Does not manage dialogue — `OverworldScene` launches `DialogueScene` before the battle; `BattleScene` launches it after.

---

## Data Structures

### battleState

Module-level object, active only during a battle:

```js
{
  professor:          object,      // the Professor object from data.js for this encounter
  professorHP:        number,      // professor's current HP (starts at professor.hp)
  playerMoves:        array,       // player's available Move objects (from data.playerMoves)
  selectedMoveIndex:  number,      // index of the currently highlighted move (0–3)
  phase:              string,      // 'select' | 'resolve' | 'end'
  lastActionText:     string,      // description of the last action, shown in the battle log
  outcome:            string|null, // null during battle; 'win' | 'loss' | 'fled' on resolution
  disrupted:          boolean,     // true if the 'disrupt' move effect is active on the player
}
```

---

## Phaser Scene Lifecycle

### init(data)

- **Does:** Receives scene launch data and stores the professor id for use in `create()`.
- **Inputs:** `data` — object: `{ professorId: string }`, passed by `OverworldScene` via `this.scene.start('BattleScene', data)`.
- **Returns:** void
- **Side effects:** Stores `data.professorId` as a scene-level variable.

---

### create()

- **Does:** Builds all battle UI GameObjects and initialises `battleState`.
- **Returns:** void
- **Side effects:**
  - Reads the professor definition from `data.professors`. Sets `battleState` to starting values.
  - Adds professor sprite (`Phaser.GameObjects.Image`) and player sprite (back-facing).
  - Creates HP bars for player and professor as `Phaser.GameObjects.Graphics` objects.
  - Creates move menu as four `Phaser.GameObjects.Text` objects; highlights `selectedMoveIndex`.
  - Creates a battle log `Phaser.GameObjects.Text` for `lastActionText`.
  - Binds keyboard input: arrow keys update `selectedMoveIndex` and re-render the move menu; Enter/Space calls `selectMove()`; Escape or 'r' calls `flee()`.
  - Calls `this.scene.get('AudioScene').switchTo('battle_' + professorId)`.

---

### update()

- **Does:** Advances battle logic each frame. No-ops unless phase is `'resolve'` or `'end'`.
- **Returns:** void
- **Side effects:** If `battleState.phase === 'resolve'`, calls `resolveTurn()`. If `battleState.phase === 'end'`, calls `endBattle()`.

---

## Functions

### selectMove(moveIndex)

- **Does:** Locks in the player's chosen move and sets the battle phase to `'resolve'`.
- **Inputs:** `moveIndex` — number: index into `battleState.playerMoves`.
- **Returns:** void
- **Side effects:** Stores the selected move for use in `resolveTurn()`. Sets `battleState.phase = 'resolve'`.

---

### resolveTurn()

- **Does:** Applies the player's move to the professor, then applies the professor's move to the player. Checks win/loss after each step.
- **Returns:** void
- **Side effects:**
  - Reduces `battleState.professorHP` by player move damage (halved first if `battleState.disrupted` is true; resets `disrupted` afterwards). Applies move effect if present (see Move Effects below).
  - If `professorHP <= 0`: calls `engine.defeatProfessor(professorId)`, sets `battleState.phase = 'end'`, `battleState.outcome = 'win'`. Does not proceed to professor move.
  - Otherwise: selects a professor move at random; reduces player HP via `engine.setPlayerHP()`. (`engine.setPlayerHP()` calls `engine.resetGame()` automatically if HP reaches zero.)
  - If player HP reaches zero: sets `battleState.phase = 'end'`, `battleState.outcome = 'loss'`.
  - Updates `battleState.lastActionText`. Redraws HP bar Graphics and battle log Text.
  - If phase was not set to `'end'`, resets `battleState.phase = 'select'`.

---

### flee()

- **Does:** Exits the battle without resolution.
- **Returns:** void
- **Side effects:** Sets `battleState.outcome = 'fled'`. Sets `battleState.phase = 'end'` to trigger `endBattle()` on the next frame.

---

### endBattle()

- **Does:** Stops the battle scene and returns control to `OverworldScene`.
- **Returns:** void
- **Side effects:** If outcome is `'win'`, launches `DialogueScene` with the post-battle sequence key and waits for it to complete before waking the overworld. Calls `this.scene.get('AudioScene').switchTo('overworld')`. Stops this scene and wakes `OverworldScene` via `this.scene.wake('OverworldScene')`.

---

## Move Effects

Three optional effect types, applied in `resolveTurn()` after damage:

| Effect | Behaviour |
|---|---|
| `'disrupt'` | Sets `battleState.disrupted = true`. The player's next move deals half damage; the flag resets after it is applied. |
| `'self_damage'` | After dealing damage, the professor also takes recoil damage equal to 25% of the move's damage value. |
| `'deferred'` | Damage is not applied immediately — stored and applied at the start of the professor's next turn. |

---

## Module Interfaces

**Reads from:**
- `engine` — player HP (display and loss detection); `defeatProfessor()`, `setPlayerHP()`
- `data` — professor definitions (HP, moves), player move definitions

**Exposes to:**
- `main.js` — registered as `'BattleScene'`
- `OverworldScene` — started via `this.scene.start('BattleScene', { professorId })`; returns by waking `OverworldScene` when the battle ends
- `AudioScene` — accessed via `this.scene.get('AudioScene').switchTo(trackId)`
- `DialogueScene` — launched via `this.scene.launch('DialogueScene', { sequenceKey, onComplete })` for post-battle dialogue
