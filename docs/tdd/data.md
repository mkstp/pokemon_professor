# TDD: Data Layer

**Directory:** `js/data/`
**Depends on:** none

---

## Responsibility

Defines and exports all static game data. Contains no logic. All other modules import directly from the domain file that owns the data they need; no barrel or index file exists.

The data layer is split into domain files for LLM-context efficiency. Each file is self-contained and independently loadable. Consumers are updated to import from the specific file rather than a monolithic `data.js`.

---

## Files

| File | Exports | Consumed by |
|------|---------|-------------|
| `professors.js` | `professors` | `BattleScene`, `BattleModeScene`, `engine` |
| `moves.js` | `playerMoves`, `professorMoves`, `npcMoves` | `BattleScene`, `KioskScene`, `engine` |
| `students.js` | `studentNPCs` | `BattleScene`, `BattleModeScene` |
| `ambientNpcs.js` | `ambientNPCs` | `OverworldScene` |
| `items.js` | `items` | `BattleScene`, `engine`, overworld item interactions |
| `regions.js` | `TILE`, `regions` | `engine`, `OverworldScene` |
| `dialogue.js` | `dialogueSequences` | `DialogueScene` |
| `audio.js` | `audioTracks` | `AudioScene` |

---

## Data Structures

### Professor

```js
{
  id: string,           // unique identifier (e.g. 'prof_schwaartz')
  name: string,         // display name shown in battle UI
  field: string,        // academic field label shown in battle UI
  hp: number,           // starting HP
  location: {
    region: string,     // region id where the encounter tile lives
    tile: { x: number, y: number },
  },
  moves: string[],      // array of Move ids drawn from professorMoves
  dialogue: {
    preBattle: string,  // key into dialogueSequences
    postWin: string,    // key into dialogueSequences
    postLoss: string,   // key into dialogueSequences
  },
  sprite: string,       // path to primary sprite image (used as fallback and sprites[0])
  sprites?: string[],   // optional: array of 3 sprite paths [l1, l2, l3] for HP-tier visuals;
                        // present only for professors with multi-level sprite art.
                        // sprites[0] must equal sprite.
  battleMusic: string,  // audioTrack id for this professor's battle music
}
```

---

### Move

Shared schema. Used for professor moves (`professorMoves`), player moves (`playerMoves`), and NPC moves (`npcMoves`). Effects are described from the perspective of the move's user.

```js
{
  id: string,           // unique identifier (e.g. 'minimal_pair')
  name: string,         // display name in battle UI
  damage: number,       // fixed HP damage dealt to the opponent; 0 for effect-only moves
  description: string,  // one-line description shown in move selection UI
  effect: string|null,  // see Effect Reference below
}
```

**Effect Reference** — values used in `effect`:

| Value | Behaviour |
|-------|-----------|
| `null` | No secondary effect. |
| `'disrupt'` | Opponent's next move deals half damage. |
| `'self_damage'` | User takes 25% of the damage dealt as recoil. |
| `'deferred'` | Damage stored; applied at start of user's next turn. |
| `'skip_opponent'` | Opponent skips their next action. |
| `'skip_self_2'` | User skips next two turns. |
| `'heal'` | User restores HP; value specified in `healAmount`. |
| `'conditional_damage'` | Damage varies based on context; condition specified in `condition`. |
| `'reveal_next'` | Opponent's next selected move is revealed to the user. |
| `'clear_buffs'` | Removes opponent's active buff modifiers. |
| `'nullify_last_buff'` | Negates opponent's most recent buff. |
| `'boost_next'` | User's next move deals bonus damage; value specified in `bonusAmount`. |
| `'double_next'` | User's next move deals double damage. |
| `'priority'` | User acts first regardless of turn order next round. |
| `'swap_effect'` | Applies last used move's effect to the next move. |

> **TDD note:** The full effect list will expand as moves are implemented. Effects not yet implemented are stubs — the battle engine resolves unknown effects as `null` during development and logs a warning.

---

### StudentNPC

Battle-capable student characters. Encountered in the overworld; trigger a battle on interaction.

```js
{
  id: string,           // unique identifier (e.g. 'student_halvorsen')
  name: string,         // display name
  hp: number,           // starting HP (TBD — requires balancing pass)
  moves: string[],      // array of Move ids drawn from npcMoves
  dialogue: {
    preBattle: string,  // key into dialogueSequences
    postWin: string,    // key into dialogueSequences (player wins)
    postLoss: string,   // key into dialogueSequences (player loses)
    reward?: string,    // key into dialogueSequences; only present if NPC gives a reward on defeat
  },
  reward?: string,      // item id given to the player on defeat; omit if no reward
  sprite: string,       // path to NPC sprite sheet (TBD)
}
```

> **TDD note:** HP values for student NPCs are TBD pending a balancing pass against professor HP. Sprite paths are TBD.

---

### AmbientNPC

Non-battle NPCs encountered in the overworld. Interaction triggers dialogue and optionally gives an item.

```js
{
  id: string,           // unique identifier (e.g. 'npc_casey')
  name: string,         // display name
  location: {
    region: string,
    tile: { x: number, y: number },
  },
  dialogue: string,     // key into dialogueSequences (the NPC's interaction sequence)
  reward?: string,      // item id given on interaction; omit if no reward
  repeatableReward: boolean, // true = item is given each time player interacts
}
```

---

### Item

Items carried in the player's inventory. Two categories: consumable (single-use) and persistent (key items, upgrades, badges). Distinguished by `category`.

```js
{
  id: string,           // unique identifier (e.g. 'triscuit')
  name: string,         // display name
  flavourText: string|null,
  category: 'consumable' | 'key_item' | 'upgrade' | 'badge',
  effect: {
    action: 'restore_hp' | 'boost_attack' | 'boost_exp' | 'boost_defense' | 'unlock' | 'none',
    value: number|null, // null = TBD (requires balancing pass)
  },
  source: string|null,  // NPC id or free-text location description; null if not yet assigned
  repeatableSource: boolean, // true = source gives this item on every interaction
}
```

> **TDD note:** `effect.value` for most consumable HP restoration is TBD pending a balancing pass. The `unlock` action applies to key items only; the engine checks the player's inventory for the relevant key item id when attempting locked transitions or interactions.

---

### DialogueSequence

```js
[
  { speaker: string, line: string },
  ...
]
```

Stored as a flat object keyed by sequence id:

```js
dialogueSequences = {
  'prof_schwaartz_pre':  [ ... ],
  'prof_schwaartz_win':  [ ... ],
  'prof_schwaartz_loss': [ ... ],
  // one entry per professor and student NPC per trigger point
}
```

---

### Region

```js
{
  id: string,             // unique identifier (e.g. 'outdoor_campus')
  displayName: string,    // shown in UI on region entry
  tileMap: number[][],    // 2D array of TILE constants — row-major, indexed tileMap[y][x]
  entryPosition: { x: number, y: number },
  connections: [          // tile transitions to other regions
    { tile: {x,y}, targetRegion: string, targetTile: {x,y} },
    ...
  ],
  weatherEffect: string|null, // 'rain' | 'monitor_glow' | etc.
  music: string,          // audioTrack id
  encounterTiles: [       // tiles that trigger a professor encounter
    { tile: {x,y}, professorId: string },
    ...
  ],
}
```

**TILE constants** (exported from `regions.js`):

```js
TILE = {
  FLOOR: 0,  // walkable
  WALL:  1,  // impassable obstacle
  WATER: 2,  // impassable; rendered as water
}
```

---

### AudioTrack

```js
{
  id: string,     // unique identifier (e.g. 'overworld', 'battle', 'victory')
  src: string,    // path to audio file
  loop: boolean,
}
```

---

## Module Interfaces

**Reads from:** none

**Exposes to:**
- `engine` — `regions`, `professors`
- `OverworldScene` — `regions`, `ambientNPCs`
- `BattleScene` — `professors`, `professorMoves`, `playerMoves`, `studentNPCs`, `npcMoves`, `items`
- `DialogueScene` — `dialogueSequences`
- `AudioScene` — `audioTracks`
- `BattleModeScene` — `professors`
