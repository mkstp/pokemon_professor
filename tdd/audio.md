# TDD: Audio

**File:** `js/audio.js`
**Depends on:** data

---

## Responsibility

Manages background music playback. Loads tracks defined in `data.audioTracks`, plays the correct track for the active scene, and handles switching without overlap. Does not manage sound effects — music only in the proof-of-concept.

---

## Data Structures

### tracks

Module-level object mapping track ids to loaded `Audio` instances:

```js
{
  'overworld': Audio,           // HTMLAudioElement, looping
  'dungeon': Audio,             // HTMLAudioElement, looping
  'indoor': Audio,              // HTMLAudioElement, looping
  'cafeteria': Audio,           // HTMLAudioElement, looping
  'castle': Audio,              // HTMLAudioElement, looping
  'battle_schwaartz': Audio,    // HTMLAudioElement, looping
  'battle_syntaxa': Audio,      // HTMLAudioElement, looping
  'battle_composita': Audio,    // HTMLAudioElement, looping
  'battle_recursio': Audio,     // HTMLAudioElement, looping
  'battle_bayesio': Audio,      // HTMLAudioElement, looping
  'battle_vec_tor': Audio,      // HTMLAudioElement, looping
  'battle_parsemore': Audio,    // HTMLAudioElement, looping
  'victory': Audio,             // HTMLAudioElement, non-looping
  'defeat': Audio,              // HTMLAudioElement, non-looping
}
```

Populated in `init()`. Keys match `AudioTrack.id` values in `data.audioTracks`.

---

### currentTrackId

Module-level string: the id of the track currently playing, or `null` if nothing is playing.

---

## Functions

### init()

- **Does:** Creates an `Audio` instance for each track defined in `data.audioTracks` and stores them in the `tracks` object.
- **Inputs:** none
- **Returns:** void
- **Side effects:** Instantiates `Audio` objects with `src` from `data.audioTracks`. Sets `loop` property per track definition. Does not begin playback.

---

### play(trackId)

- **Does:** Starts playback of the specified track from the beginning.
- **Inputs:** `trackId` — string: id of the track to play.
- **Returns:** void
- **Side effects:** Calls `.play()` on `tracks[trackId]`. Sets `currentTrackId = trackId`. No-ops if `trackId` is not in `tracks`.

---

### stop()

- **Does:** Stops the currently playing track and resets its position.
- **Inputs:** none
- **Returns:** void
- **Side effects:** Calls `.pause()` and resets `.currentTime = 0` on `tracks[currentTrackId]` if one is playing. Sets `currentTrackId = null`.

---

### switchTo(trackId)

- **Does:** Stops the current track (if any) and starts the specified track. No-ops if the specified track is already playing.
- **Inputs:** `trackId` — string: id of the track to switch to.
- **Returns:** void
- **Side effects:** Calls `stop()` if a different track is playing. Calls `play(trackId)`.

---

## Module Interfaces

**Reads from:**
- `data` — `audioTracks` array for track ids, file paths, and loop settings

**Exposes to:**
- `game` — `init()` on startup; `switchTo(trackId)` called on scene transitions; `play('victory')` and `play('defeat')` called on battle resolution. For battles, `game.js` calls `switchTo('battle_' + professorId)` using the professor's id field from `data.js`.
