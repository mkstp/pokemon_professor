# TDD: Battle

**File:** `js/battle.js`
**Depends on:** engine, data

---

## Responsibility

Owns the turn-based battle loop: move selection, damage resolution, and HP management. Renders the battle screen. Signals `game.js` when the battle ends by writing outcome to engine state. Does not manage dialogue — `game.js` activates `dialogue.js` before and after battle.

---

## Data Structures

### battleState

Module-level object, active only during a battle scene:

```js
{
  professor: object,        // the Professor object from data.js for this encounter
  professorHP: number,      // professor's current HP (starts at professor.hp)
  playerMoves: array,       // player's available Move objects (from data.playerMoves)
  selectedMoveIndex: number,// index of the currently highlighted move (0–3)
  phase: string,            // 'select' | 'resolve' | 'end'
  lastActionText: string,   // description of the last action, shown in battle log
  outcome: string|null,     // null during battle; 'win' | 'loss' on resolution
}
```

---

## Functions

### init(professorId)

- **Does:** Prepares the battle state for a new encounter.
- **Inputs:** `professorId` — string: id of the professor to battle.
- **Returns:** void
- **Side effects:** Reads professor data from `data.professors`. Sets module-level `battleState` with professor, full professor HP, player moves, `selectedMoveIndex: 0`, `phase: 'select'`, `lastActionText: ''`, `outcome: null`. Does not modify engine state.

---

### update()

- **Does:** Advances battle logic by one frame. In `'select'` phase, waits for input. In `'resolve'` phase, executes the selected move and professor's response, then returns to `'select'` or transitions to `'end'`.
- **Inputs:** none
- **Returns:** void
- **Side effects:** May call `resolveTurn()`. May call `engine.setPlayerHP()`, `engine.defeatProfessor()`. Sets `battleState.phase` and `battleState.outcome` on resolution.

---

### draw(ctx)

- **Does:** Renders the full battle screen: professor sprite, HP bars (player and professor), move selection menu, and last action text.
- **Inputs:** `ctx` — CanvasRenderingContext2D.
- **Returns:** void
- **Side effects:** Writes to canvas. Reads `battleState` and `engine.getState().playerHP`.

---

### handleInput(key)

- **Does:** Routes input during the battle scene. Moves the move cursor or confirms selection.
- **Inputs:** `key` — string: key identifier.
- **Returns:** void
- **Side effects:** Updates `battleState.selectedMoveIndex` on arrow key. Calls `selectMove(battleState.selectedMoveIndex)` on confirm key (Enter or Space). On 'r' or Escape, calls `flee()`.

---

### selectMove(moveIndex)

- **Does:** Locks in the player's selected move and transitions battle phase to `'resolve'`.
- **Inputs:** `moveIndex` — number: index into `battleState.playerMoves`.
- **Returns:** void
- **Side effects:** Writes `battleState.phase = 'resolve'`. Stores the selected move for `resolveTurn()`.

---

### resolveTurn()

- **Does:** Applies the player's move to the professor, then applies the professor's move to the player. Checks for win or loss after each application.
- **Inputs:** none
- **Returns:** void
- **Side effects:**
  - Reduces `battleState.professorHP` by player move damage. Applies move effect if present (see Move effects below).
  - If `professorHP <= 0`: calls `engine.defeatProfessor(professorId)`, sets `battleState.phase = 'end'`, `battleState.outcome = 'win'`. Does not proceed to professor move.
  - Otherwise: selects professor move (random from professor's move list), reduces player HP via `engine.setPlayerHP()`.
  - If `engine.getState().playerHP <= 0`: sets `battleState.phase = 'end'`, `battleState.outcome = 'loss'`. (`engine.setPlayerHP()` will call `engine.resetGame()` automatically.)
  - Updates `battleState.lastActionText` with a plain-English description of what happened.

---

### flee()

- **Does:** Exits the battle without resolution. Returns the player to the overworld.
- **Inputs:** none
- **Returns:** void
- **Side effects:** Sets `battleState.outcome = 'fled'`. `game.js` reads this on the next frame and calls `switchScene('overworld')`. Professor is not marked as defeated.

---

### getOutcome()

- **Does:** Returns the current battle outcome so `game.js` can react to it.
- **Inputs:** none
- **Returns:** string|null: `'win'` | `'loss'` | `'fled'` | `null` (battle ongoing).
- **Side effects:** none

---

## Move Effects

Three optional effect types, applied in `resolveTurn()` after damage:

| Effect | Behaviour |
|--------|-----------|
| `'disrupt'` | Player's next move deals half damage. Tracked via a `disrupted` flag in `battleState`. |
| `'self_damage'` | After dealing damage, the professor also takes recoil damage (25% of move damage). |
| `'deferred'` | Damage is not applied immediately — stored and applied at the start of the professor's next turn. |

---

## Module Interfaces

**Reads from:**
- `engine` — player HP (for display and loss detection); clears `pendingEncounter` indirectly via `game.js`
- `data` — professor definitions (HP, moves), player move definitions

**Exposes to:**
- `game` — `init(professorId)`, `update()`, `draw(ctx)`, `handleInput(key)`, `getOutcome()` — called by the game loop each frame during the battle scene
