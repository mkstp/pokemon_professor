# TDD: Main Menu Scene

**File:** `js/scenes/MainMenuScene.js`
**Depends on:** engine, AudioScene

---

## Responsibility

Entry point for the game. Auto-started by Phaser on launch (first in the scene registry). Launches `AudioScene` once, plays `intro_credits` music, and presents the top-level option menu. Serves as the hub that all sub-modes return to; its `wake()` method is the canonical "return to title" landing point.

---

## Scene Lifecycle

### create()

- **Does:** Initialises engine state, launches `AudioScene`, starts `intro_credits` music, builds menu UI, registers keyboard input.
- **Returns:** void
- **Side effects:**
  - Calls `engine.init()` — establishes a clean game state for the session.
  - Calls `this.scene.launch('AudioScene')` — starts the persistent audio manager. Must only be called once; subsequent calls are no-ops in Phaser (scene is already active).
  - Calls `audio.switchTo('intro_credits')`, deferring via `sound.once('unlocked', ...)` if the audio context is not yet unlocked, or via `audio.events.once('create', ...)` if `AudioScene` has not finished its own `create()` cycle.
  - Calls `_buildUI()` and `_initKeyboard()`.

### wake()

Called by Phaser when `MainMenuScene` is woken after sleeping (i.e. on return from `OverworldScene` or `BattleModeScene`). Must restore the menu to a clean, interactive state.

- **Does:** Resets cursor to 0, rebuilds UI, switches audio to `intro_credits`.
- **Returns:** void
- **Side effects:**
  - Calls `_buildUI()` — removes all children and redraws, because the sleeping scene retains stale GameObjects.
  - Calls `audio.switchTo('intro_credits')` — stops whatever track was playing and resumes the title theme. Uses the same deferred pattern as `create()` to handle a not-yet-ready `AudioScene`.
  - Does **not** re-call `_initKeyboard()` — keyboard listeners registered in `create()` survive sleep/wake and remain active.
  - Does **not** call `engine.init()` — engine state is reset by whichever sub-scene the player entered. `MainMenuScene` does not own the reset on return.

---

## Menu Options

Three options rendered as interactive buttons, navigable by keyboard (↑ ↓ / Enter) and pointer:

| Index | Label | Action |
|-------|-------|--------|
| 0 | ▶ Full Game | `_enterFullGame()` |
| 1 | ⚔ Battle Mode | `_enterBattleMode()` |
| 2 | ✓ Run Tests | `window.location.href = 'tests/index.html'` |

`_cursor` tracks the highlighted option (0–2). `_buildUI()` re-renders on every cursor change.

---

## Functions

### _enterFullGame()

- **Does:** Puts `MainMenuScene` to sleep and launches `OverworldScene`.
- **Side effects:** `this.scene.sleep('MainMenuScene')`, `this.scene.launch('OverworldScene')`.
- **Audio:** No explicit audio call. `OverworldScene.create()` calls `audio.switchTo('overworld')`.

### _enterBattleMode()

- **Does:** Puts `MainMenuScene` to sleep and launches `BattleModeScene`.
- **Side effects:** `this.scene.sleep('MainMenuScene')`, `this.scene.launch('BattleModeScene', { fromMainMenu: true })`.
- **Audio:** No explicit audio call. Audio continues playing `intro_credits` — `BattleModeScene` does not change the track when `fromMainMenu` is true.

### _buildUI()

- **Does:** Removes all existing children and redraws the full menu (background, title, buttons, hint text).
- **Called by:** `create()`, `wake()`, and on every cursor navigation keypress.

### _initKeyboard()

- **Does:** Registers ↑ ↓ (navigate), Enter/Space (confirm) key handlers.
- **Called by:** `create()` only — not `wake()`. Handlers survive sleep/wake.

---

## Scene Transition Summary

| Trigger | This scene | Target scene |
|---------|-----------|--------------|
| Full Game selected | `sleep('MainMenuScene')` | `launch('OverworldScene')` |
| Battle Mode selected | `sleep('MainMenuScene')` | `launch('BattleModeScene', { fromMainMenu: true })` |
| Return from OverworldScene (via KioskScene) | `wake('MainMenuScene')` called by `KioskScene._executeReturnToTitle()` | — |
| Return from BattleModeScene | `wake('MainMenuScene')` called by `BattleModeScene._goBack()` | — |

`MainMenuScene` is always slept (not stopped) so that `wake()` can be used for cheap re-entry without re-running `preload()` or re-registering keyboard listeners.

---

## Module Interfaces

**Reads from:**
- `engine` — `engine.init()` on `create()`
- `AudioScene` — `switchTo('intro_credits')` on `create()` and `wake()`

**Exposes to:**
- `main.js` — registered as `'MainMenuScene'`; auto-started on game launch
- `BattleModeScene` — calls `this.scene.wake('MainMenuScene')` on back navigation
- `KioskScene` — calls `this.scene.wake('MainMenuScene')` from `_executeReturnToTitle()`
