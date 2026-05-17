# TDD: Audio Scene

**File:** `js/scenes/AudioScene.js`
**Depends on:** data

---

## Responsibility

Manages all background music playback. Runs as a persistent, always-active Phaser scene so that music continues uninterrupted across overworld/battle scene transitions. Other scenes access it via `this.scene.get('AudioScene')`.

---

## Data Structures

### tracks

Module-level object mapping track ids to Phaser `BaseSound` instances:

```js
{
  'overworld':         BaseSound,  // looping
  'dungeon':           BaseSound,  // looping
  'indoor':            BaseSound,  // looping
  'cafeteria':         BaseSound,  // looping
  'castle':            BaseSound,  // looping
  'battle_prof_schwaartz':  BaseSound,  // looping
  'battle_prof_syntaxa':    BaseSound,  // looping
  'battle_prof_composita':  BaseSound,  // looping
  'battle_prof_recursio':   BaseSound,  // looping
  'battle_prof_bayesio':    BaseSound,  // looping
  'battle_prof_vec_tor':    BaseSound,  // looping
  'battle_prof_parsemore':  BaseSound,  // looping
  'victory':           BaseSound,  // non-looping
  'defeat':            BaseSound,  // non-looping
}
```

Populated in `create()`. Keys match `AudioTrack.id` values in `data.audioTracks`.

---

### currentTrackId

Module-level string: the id of the track currently playing, or `null` if nothing is playing.

---

## Phaser Scene Lifecycle

### preload()

- **Does:** Queues all audio files for loading.
- **Returns:** void
- **Side effects:** Calls `this.load.audio(id, path)` for each entry in `data.audioTracks`.

---

### create()

- **Does:** Adds all loaded audio files as `BaseSound` instances and marks this scene as persistent.
- **Returns:** void
- **Side effects:**
  - Calls `this.sound.add(id, { loop })` for each track in `data.audioTracks`; stores results in `tracks`.
  - Calls `this.scene.setActive(true).setVisible(false)` to keep the scene running without rendering anything.

---

## Functions

### switchTo(trackId)

- **Does:** Stops the currently playing track (if any) and starts the specified track. No-ops if the track is already playing.
- **Inputs:** `trackId` — string: id of the track to switch to.
- **Returns:** void
- **Side effects:** Stops and resets `tracks[currentTrackId]` if it differs from `trackId`. Calls `tracks[trackId].play()`. Updates `currentTrackId`.

---

### play(trackId)

- **Does:** Plays a track from the beginning without stopping the current background track.
- **Inputs:** `trackId` — string: id of the track to play.
- **Returns:** void
- **Side effects:** Calls `tracks[trackId].play()`. Used for one-shot sounds (victory, defeat) that overlay the current music.

---

### stop()

- **Does:** Stops the currently playing background track and resets its position.
- **Returns:** void
- **Side effects:** Calls `.stop()` on `tracks[currentTrackId]`. Sets `currentTrackId = null`.

---

## Module Interfaces

**Reads from:**
- `data` — `audioTracks` array for track ids, file paths, and loop settings

**Exposes to:**
- `main.js` — registered as `'AudioScene'`; started alongside `CourtyardScene` on game launch
- `CourtyardScene`, `BattleScene` — call `this.scene.get('AudioScene').switchTo(trackId)` on scene create and transitions; call `.play('victory')` or `.play('defeat')` on battle resolution
