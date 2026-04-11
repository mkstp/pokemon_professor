# TDD: Dialogue Scene

**File:** `js/scenes/DialogueScene.js`
**Depends on:** data

---

## Responsibility

Manages playback of scripted dialogue sequences and renders the dialogue box overlay. Launched on top of the active scene — does not replace it. Stops itself when the sequence ends and notifies the calling scene, which then resumes its own logic.

---

## Data Structures

### dialogueState

Module-level object:

```js
{
  sequence:      array,        // the DialogueSequence array from data.dialogueSequences
  currentIndex:  number,       // index of the line currently displayed
  onComplete:    string|null,  // event key to emit on the calling scene when the sequence ends
}
```

---

## Phaser Scene Lifecycle

### init(data)

- **Does:** Receives launch data and loads the dialogue sequence.
- **Inputs:** `data` — object: `{ sequenceKey: string, onComplete?: string }`.
- **Returns:** void
- **Side effects:** Reads `data.dialogueSequences[sequenceKey]`. Sets `dialogueState.sequence`, `dialogueState.currentIndex = 0`, `dialogueState.onComplete = data.onComplete ?? null`.

---

### create()

- **Does:** Builds the dialogue box UI and displays the first line.
- **Returns:** void
- **Side effects:**
  - Adds a semi-transparent `Phaser.GameObjects.Rectangle` at the bottom of the screen as the dialogue box background.
  - Adds a `Phaser.GameObjects.Text` for the speaker name.
  - Adds a `Phaser.GameObjects.Text` for the dialogue line body.
  - Renders `dialogueState.sequence[0]` (speaker and line text).
  - Binds confirm keys (Space, Enter) to `advance()`.

---

## Functions

### advance()

- **Does:** Advances to the next line in the sequence. If the sequence is complete, emits the completion event and stops the scene.
- **Returns:** void
- **Side effects:** Increments `dialogueState.currentIndex` and updates the speaker and line Text objects. If `currentIndex >= sequence.length`: if `dialogueState.onComplete` is set, retrieves the calling scene via `this.scene.manager` and emits `onComplete` on it; calls `this.scene.stop()`.

---

## Module Interfaces

**Reads from:**
- `data` — `dialogueSequences` object, accessed by key in `init()`

**Exposes to:**
- `main.js` — registered as `'DialogueScene'`
- `OverworldScene` and `BattleScene` — launched via `this.scene.launch('DialogueScene', { sequenceKey, onComplete })`; both scenes listen for the `onComplete` event to resume their logic after the sequence finishes
