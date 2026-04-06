# TDD: Dialogue

**File:** `js/dialogue.js`
**Depends on:** data

---

## Responsibility

Manages playback of scripted dialogue sequences and renders the dialogue box overlay. Scene-agnostic: can overlay the overworld or the battle screen. `game.js` decides when to activate it; `dialogue.js` only manages the sequence and draws the box.

---

## Data Structures

### dialogueState

Module-level object:

```js
{
  active: boolean,          // whether a sequence is currently playing
  sequence: array,          // the current DialogueSequence array (from data.js)
  currentIndex: number,     // index of the line currently displayed
}
```

---

## Functions

### init(sequenceKey)

- **Does:** Loads a dialogue sequence and activates the dialogue box.
- **Inputs:** `sequenceKey` — string: key into `data.dialogueSequences` (e.g. `'prof_phonetics_pre'`).
- **Returns:** void
- **Side effects:** Reads `data.dialogueSequences[sequenceKey]`. Sets `dialogueState.sequence`, `dialogueState.currentIndex = 0`, `dialogueState.active = true`.

---

### advance()

- **Does:** Advances to the next line in the sequence. If the last line is already displayed, marks the sequence complete.
- **Inputs:** none
- **Returns:** void
- **Side effects:** Increments `dialogueState.currentIndex`. If `currentIndex >= sequence.length`, sets `dialogueState.active = false`.

---

### draw(ctx)

- **Does:** Renders the dialogue box with the current speaker name and line. No-ops if `dialogueState.active` is false.
- **Inputs:** `ctx` — CanvasRenderingContext2D.
- **Returns:** void
- **Side effects:** Writes to canvas. Draws a text box at the bottom of the screen with speaker name and the current line. Retro pixel font. Does not clear the canvas — draws on top of whatever the active scene has already drawn.

---

### isActive()

- **Does:** Reports whether a dialogue sequence is currently in progress.
- **Inputs:** none
- **Returns:** boolean: `true` if `dialogueState.active` is true.
- **Side effects:** none

---

## Module Interfaces

**Reads from:**
- `data` — `dialogueSequences` object, accessed by key in `init()`

**Exposes to:**
- `game` — `init(sequenceKey)` to start a sequence; `draw(ctx)` called each frame when active (overlaid on scene); `advance()` called by `game.handleInput()` when the player presses confirm during dialogue; `isActive()` checked by `game.js` to suppress battle/movement input while dialogue is running
