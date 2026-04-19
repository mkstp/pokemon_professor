# TDD: Battle Scene

**Files:** `js/scenes/BattleScene.js`, `js/scenes/battle/resolver.js`
**Depends on:** engine, data

---

## Responsibility

Owns the turn-based battle loop: move selection, damage resolution, and HP management. Renders all battle UI as Phaser GameObjects. Returns control to `OverworldScene` when the battle ends. Does not manage dialogue — `OverworldScene` launches `DialogueScene` before the battle; `BattleScene` launches it after.

Battle turn logic (damage application, move effects) is extracted into `js/scenes/battle/resolver.js`. `BattleScene` handles all Phaser rendering, input, and scene lifecycle; `resolver.js` handles pure game-logic functions with no Phaser dependency. This boundary keeps `BattleScene` navigable as UI code.

Supports two opponent types: professors (the primary encounter type) and student NPCs (triggered in the overworld or from the debug selector).

---

## Data Structures

### battleState

Module-level object, active only during a battle:

```js
{
  // Core
  professor:            object,      // opponent object (Professor or StudentNPC) for this encounter
  professorHP:          number,      // opponent's current HP (starts at professor.hp / npc.hp)
  playerMoves:          array,       // player's active Move objects resolved from engine.activeMoves
  selectedMoveIndex:    number,      // index of the currently highlighted move (0–3)
  menuLevel:            string,      // 'action' | 'move' | 'item' — current menu depth
  selectedActionIndex:  number,      // index in the top-level action menu
  selectedItemIndex:    number,      // index in the item sub-menu
  itemScrollOffset:     number,      // scroll position in item list
  phase:                string,      // 'select' | 'resolve' | 'end'
  outcome:              string|null, // null during battle; 'win' | 'loss' | 'fled' on resolution
  // Professor-side status flags
  disrupted:            boolean,     // player's next move deals half damage (professor 'disrupt' effect)
  professorSkipped:     boolean,     // professor skips their next action (player 'skip' effect)
  professorHalved:      boolean,     // professor's next move deals half damage (player 'halve_next' effect)
  deferredDamage:       number,      // stored damage applied at the start of professor's next turn
  lastProfessorDamage:  number,      // damage dealt by professor on their last turn (used by 'counter')
  // Student NPC / npcMove status flags (used when opponentType === 'student')
  playerSkipped:        boolean,     // player skips their next action
  npcSkippedTurns:      number,      // turns the NPC will skip
  npcHalvedNext:        boolean,     // NPC's next move deals half damage
  npcDoubledNext:       boolean,     // NPC's next move deals double damage
  npcBoostNext10:       boolean,     // NPC gains +10 damage on next move
  npcBoostedTurns:      number,      // turns remaining on NPC damage boost
  npcVulnTurns:         number,      // turns player takes double damage
  npcIncomingHalved:    boolean,     // NPC takes half damage from player's next move
  playerReducedNext10:  number,      // player's next move is reduced by this amount
  lastPlayerDamage:     number,      // damage dealt by player on their last turn
  npcRevealedMove:      string|null, // ID of NPC's next move if revealed by 'reveal_next'
  npcPriority:          boolean,     // NPC acts first next turn
  lastNpcEffect:        string|null,
  pendingSwappedEffect: string|null,
  playerLockedMove:     string|null,
  playerPriority:       boolean,
  lastPlayerEffect:     string|null,
  pendingPlayerSwappedEffect: string|null,
}
```

### opponentType / opponentId

Set on the `BattleScene` instance via `init(data)`. Controls which move map and data source `resolver.js` uses when resolving opponent turns.

```js
// data passed to BattleScene via this.scene.start('BattleScene', data)
{
  opponentType: 'professor' | 'student',
  opponentId:   string,  // id from professors[] or studentNPCs[]
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

### Professor move effects (applied when the professor acts)

| Effect | Behaviour |
|---|---|
| `null` | No secondary effect. |
| `'disrupt'` | Sets `battleState.disrupted = true`. The player's next move deals half damage; the flag resets after it is applied. |
| `'self_damage'` | After dealing damage, the professor also takes recoil damage equal to 25% of the move's damage value. |
| `'deferred'` | Damage is not applied immediately — stored in `deferredDamage` and applied at the start of the professor's next turn. |

### Player move effects (applied when the player acts)

| Effect | Behaviour |
|---|---|
| `null` | No secondary effect. |
| `'skip'` | Sets `battleState.professorSkipped = true` — professor skips their next action. |
| `'halve_next'` | Sets `battleState.professorHalved = true` — professor's next move deals half damage. |
| `'player_recoil'` | Player takes recoil damage equal to 25% of the damage dealt. |
| `'counter'` | Deals damage equal to `lastProfessorDamage` instead of the move's base damage. |
| `'clear_debuff'` | Clears `battleState.disrupted` and resets `battleState.professorHalved`. |

### NpcMove effects (applied when a student NPC opponent acts)

A parallel set of effects controls the student NPC battle system. Effects marked *stubbed* display flavour text but have no mechanical resolution yet.

| Effect | Behaviour |
|---|---|
| `null` | No secondary effect. |
| `'heal'` | NPC restores `healAmount` HP. |
| `'heal_and_reduce_next'` | NPC heals and reduces player's next move damage by 10. |
| `'heal_and_shield'` | NPC heals and halves incoming damage on the next player move. |
| `'disrupt'` | Halves player's next move damage. |
| `'self_damage'` | NPC takes 25% recoil damage after dealing damage. |
| `'skip_opponent'` | Player skips their next action. |
| `'skip_self_2'` | NPC skips its next two turns. |
| `'conditional_damage'` | Damage equals `lastPlayerDamage` (counters the player's last move). |
| `'double_next'` | NPC's next move deals double damage. |
| `'boost_next'` | NPC's next move gains a fixed bonus (`bonusAmount`). |
| `'nullify_last_buff'` | Clears player's most recent buff. |
| `'clear_buffs'` | Clears all active player buff modifiers. |
| `'vulnerability'` | Player takes double damage for the next turn. |
| `'swap_effect'` *(stubbed)* | Applies last used effect to the next move. |
| `'priority'` *(stubbed)* | NPC acts first next round regardless of turn order. |
| `'reveal_next'` *(stubbed)* | Reveals the NPC's next selected move to the player. |

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
