# Coding Brief: engine.js

**File:** `js/engine.js`  
**Depends on:** `js/data.js` (read-only; one function call)  
**Exposes to:** every other module — this is the shared state layer

---

## Purpose

Owns the single `gameState` object. All other modules read and write game state by calling functions on this module. No module touches `gameState` directly.

---

## Data Contract

engine.js imports two things from data.js:

```js
import { regions, professors } from './data.js';
```

**Used in `setRegion(regionId)`:**
```js
regions[regionId].entryPosition  // → { x: number, y: number }
```

**Used in `allProfessorsDefeated()`:**
```js
// The five professors who must be defeated before the castle unlocks.
// Derived from professors array — all except the last entry (prof_vec_tor).
professors.slice(0, -1).map(p => p.id)
// → ['prof_schwaartz', 'prof_syntaxa', 'prof_composita', 'prof_recursio', 'prof_bayesio']
```

**Starting values (used in `init()` and `resetGame()`):**
```js
currentRegion:  'outdoor_campus'
playerPosition: regions['outdoor_campus'].entryPosition  // → { x: 5, y: 6 }
playerHP:       100
activeScene:    'overworld'
```

---

## gameState

Module-level object. Private — never exported directly.

```js
{
  activeScene:         string,       // 'overworld' | 'battle'
  playerHP:            number,       // 0–100
  playerPosition:      { x, y },    // tile coordinates in current region
  currentRegion:       string,       // region id, e.g. 'outdoor_campus'
  defeatedProfessors:  string[],     // professor ids in defeat order
  pendingEncounter:    string|null,  // professor id awaiting encounter, or null
}
```

---

## Functions (all exported)

| Function | Inputs | Returns | Behaviour |
|---|---|---|---|
| `init()` | — | void | Set gameState to starting values (see above) |
| `getState()` | — | object | Return gameState; callers treat it as read-only |
| `setPlayerHP(hp)` | hp: number | void | Clamp to [0, 100]; if hp ≤ 0, call `resetGame()` |
| `setPlayerPosition(x, y)` | x, y: number | void | Write playerPosition |
| `setRegion(regionId)` | regionId: string | void | Write currentRegion; write playerPosition from `regions[regionId].entryPosition` |
| `setScene(scene)` | scene: string | void | Write activeScene |
| `setPendingEncounter(id)` | id: string\|null | void | Write pendingEncounter |
| `defeatProfessor(id)` | id: string | void | Append to defeatedProfessors if not already present |
| `isDefeated(id)` | id: string | boolean | True if id is in defeatedProfessors |
| `allProfessorsDefeated()` | — | boolean | True if all five non-final professors are in defeatedProfessors |
| `resetGame()` | — | void | Restore HP, position, region, scene to starting values; **do not clear defeatedProfessors** |

---

## Notes

- `resetGame()` is called automatically by `setPlayerHP()` when HP hits zero. It is also the player-faint handler — do not clear `defeatedProfessors` on reset, progress persists across faints.
- `allProfessorsDefeated()` checks only the first five professors; the final boss (prof_vec_tor) is not in this check — it gates the castle entrance, not itself.
- engine.js has no draw logic and no input handling. It is pure state.
