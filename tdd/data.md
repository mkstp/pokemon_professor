# TDD: Data

**File:** `js/data.js`
**Depends on:** none

---

## Responsibility

Defines and exports all static game data: professors, player moves, dialogue sequences, map regions, and audio tracks. Contains no logic. All other modules import from `data.js`; none write back to it.

---

## Data Structures

### Professor

```js
{
  id: string,           // unique identifier (e.g. 'prof_phonetics')
  name: string,         // display name (e.g. 'Professor Aldridge')
  field: string,        // academic field label shown in battle UI
  hp: number,           // starting HP
  location: {
    region: string,     // region id where encounter trigger lives
    tile: { x: number, y: number }, // encounter trigger tile coordinates
  },
  moves: array,         // array of Move ids this professor can use (see Move)
  dialogue: {
    preBattle: string,  // key into dialogueSequences for pre-battle sequence
    postWin: string,    // key into dialogueSequences for post-battle win
    postLoss: string,   // key into dialogueSequences for post-battle loss
  },
  sprite: string,       // path to professor sprite sheet
}
```

---

### Move

```js
{
  id: string,           // unique identifier (e.g. 'minimal_pair')
  name: string,         // display name in battle UI
  damage: number,       // fixed HP damage dealt to target
  description: string,  // one-line description shown in move selection UI
  effect: string|null,  // optional: 'disrupt' | 'self_damage' | 'deferred' (see Battle TDD for effect logic)
}
```

---

### DialogueSequence

```js
[
  { speaker: string, line: string },  // ordered array of speaker + line pairs
  ...
]
```

Stored as a flat object keyed by sequence id:

```js
dialogueSequences = {
  'prof_phonetics_pre':  [ ... ],
  'prof_phonetics_win':  [ ... ],
  'prof_phonetics_loss': [ ... ],
  // ... one entry per professor per trigger point
}
```

---

### Region

```js
{
  id: string,             // unique identifier (e.g. 'outdoor', 'main_building')
  displayName: string,    // shown in UI on region entry
  tileMap: array,         // 2D array of tile ids defining the region layout
  entryPosition: { x: number, y: number }, // default player position on entry
  connections: array,     // array of { tile: {x,y}, targetRegion: string, targetTile: {x,y} }
  weatherEffect: string|null, // effect id applied in this region ('rain' | 'monitor_glow' | etc.)
  music: string,          // track id to play in this region's overworld
  encounterTiles: array,  // array of { tile: {x,y}, professorId: string }
}
```

---

### AudioTrack

```js
{
  id: string,     // unique identifier (e.g. 'overworld', 'battle', 'victory')
  src: string,    // path to audio file
  loop: boolean,  // whether the track loops
}
```

---

## Functions

### init()

- **Does:** No-op — all data is defined at module load time as constants. Exported to satisfy callers that call `init()` on every module; has no effect.
- **Inputs:** none
- **Returns:** void
- **Side effects:** none

---

## Exports

`data.js` exports the following named constants. All are defined inline — no fetch or async loading in the proof-of-concept.

| Export | Type | Contents |
|--------|------|----------|
| `professors` | array | All six Professor objects, ordered by encounter sequence |
| `playerMoves` | array | All player Move objects |
| `professorMoves` | array | All professor Move objects |
| `dialogueSequences` | object | All DialogueSequence arrays, keyed by sequence id |
| `regions` | object | All Region objects, keyed by region id |
| `audioTracks` | array | All AudioTrack objects |

---

## Module Interfaces

**Reads from:** none
**Exposes to:** `engine` (region entry positions), `OverworldScene` (region definitions, encounter tiles), `BattleScene` (professor stats, moves), `DialogueScene` (dialogue sequences), `AudioScene` (track definitions)
