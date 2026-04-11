# TDD: Visual Assets

**Not a JS module** — this document specifies the asset production pipeline and file conventions. No corresponding `.js` file. Asset loading is handled by `engine.js`.

**Depends on:** data (sprite paths referenced in professor and player objects)

---

## Responsibility

Defines what visual assets the game requires, how they are produced, how they are named, and how they are referenced in code. Covers two contexts: the overworld (small, top-down sprites) and battle (large, detailed sprites). These are distinct asset types produced by different means.

---

## Two-Tier Sprite System

The game uses two distinct sprite tiers, consistent with the Pokemon source material:

| Tier | Context | Visual role | Resolution | Production method |
|------|---------|-------------|------------|-------------------|
| Battle sprites | Battle scene | Detailed character portraits; the primary visual during combat | 96×96 px | AI-generated (Midjourney) → cleaned up in Aseprite |
| Overworld sprites | Overworld map | Small top-down figures conveying silhouette and colour; not portraits | 32×32 px | Hand-drawn in Aseprite |

These tiers are independent. A battle sprite and an overworld sprite for the same character do not need to match in detail — they need to share dominant colour and be recognisable as the same character at their respective scales.

---

## Asset Inventory

### Professors (×7, including reserve)

Each professor requires:

| Asset | Frames | Notes |
|-------|--------|-------|
| Battle sprite | 1 | Static, front-facing. Faint state achieved via code (palette flash or opacity), not a separate frame. |
| Overworld sprite | 2 | Simple idle cycle: neutral and a single-step shift. Top-down perspective. |

### Player character

| Asset | Frames | Notes |
|-------|--------|-------|
| Battle sprite (back) | 1 | Back-facing, static. Consistent style with professor battle sprites. |
| Overworld sprite | 12 | Walk cycle: 4 directions × 3 frames each (left, centre, right step). |

---

## Sprite Sheet Layout

### Professor overworld sprite sheet (per professor)

A single PNG, 64×32 px: two frames side by side.

```
[ frame 0 | frame 1 ]
  32×32      32×32
```

### Player overworld sprite sheet

A single PNG, 96×128 px: 4 rows (directions) × 3 columns (frames).

```
Row 0 (down):  [ L | C | R ]
Row 1 (left):  [ L | C | R ]
Row 2 (right): [ L | C | R ]
Row 3 (up):    [ L | C | R ]
```

Each cell is 32×32 px.

### Battle sprites

Single PNG per character, 96×96 px. No sprite sheet — one file per sprite.

---

## File Structure and Naming

```
assets/
  sprites/
    battle/
      schwaartz.png
      syntaxa.png
      composita.png
      recursio.png
      bayesio.png
      vec_tor.png
      parsemore.png
      player.png
    overworld/
      schwaartz.png
      syntaxa.png
      composita.png
      recursio.png
      bayesio.png
      vec_tor.png
      parsemore.png
      player.png
```

File names match professor `id` fields in `data.js`. `player.png` in each directory refers to the player character.

---

## Data References

Each professor object in `data.js` includes a `sprites` property:

```js
{
  id: 'schwaartz',
  // ... other fields
  sprites: {
    battle: 'assets/sprites/battle/schwaartz.png',
    overworld: 'assets/sprites/overworld/schwaartz.png',
  },
}
```

The player object follows the same structure:

```js
player: {
  sprites: {
    battle: 'assets/sprites/battle/player.png',
    overworld: 'assets/sprites/overworld/player.png',
  },
}
```

---

## Asset Loading

Sprites are loaded by the Phaser scenes that use them, via `this.load.image()` and `this.load.spritesheet()` in each scene's `preload()` method. `OverworldScene` loads overworld spritesheets; `BattleScene` loads battle sprites. Phaser caches loaded textures globally — an asset loaded by one scene is available to all subsequent scenes without reloading.

Sprite paths in `data.js` (`professor.sprites.battle`, `professor.sprites.overworld`) serve as the texture keys passed to `this.load` calls. If a texture key is not found at render time, Phaser renders a default missing-texture indicator — this makes missing assets immediately visible during development.

---

## Production Workflow

### Battle sprites (Midjourney → Aseprite)

1. Generate Prof. Schwaartz first using her visual design brief as the prompt, with pixel art style directives.
2. Use the Schwaartz output as a style reference (`--sref`) for all subsequent professor generations. This enforces visual consistency across the roster.
3. Import each generated image into Aseprite. Resize canvas to 96×96 if needed. Clean up edges and reduce the palette to a retro-appropriate range (16–32 colours per sprite).
4. Export as PNG to `assets/sprites/battle/`.

### Overworld sprites (Aseprite, hand-drawn)

1. Work at 24×24 px per frame. At this resolution, the goal is silhouette and dominant colour — not portrait likeness.
2. Reference each professor's battle sprite for colour palette only.
3. Draw two idle frames per professor; assemble into the 48×24 sprite sheet format.
4. Draw the player walk cycle (12 frames) in the 72×96 sheet format.
5. Export as PNG to `assets/sprites/overworld/`.

---

## Constraints

- All sprites must use a consistent pixel density — do not mix 96×96 and 128×128 battle sprites.
- Overworld sprites must all use the same 24×24 cell size so the map renderer can draw them without per-character configuration.
- No sprite should require transparency in unexpected places — use a consistent background colour (e.g. magenta `#FF00FF`) as a chroma key if needed, or export with a clean alpha channel.
