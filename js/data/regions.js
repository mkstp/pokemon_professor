// data/regions.js — TILE constants and region definitions
'use strict';

// ─── TILE CONSTANTS ───────────────────────────────────────────────────────────
// Used in region tileMap arrays. map.js reads these to determine walkability
// and visual appearance. Keep in sync with map.js tile renderer.

export const TILE = {
  FLOOR: 0,  // walkable; appearance determined by region theme
  WALL:  1,  // impassable obstacle
  WATER: 2,  // impassable; rendered as pond/water tile
};

// ─── REGIONS ──────────────────────────────────────────────────────────────────
// Keyed by region id.
//
// tileMap: 2D array of TILE constants — row-major, indexed tileMap[y][x].
// These are placeholder grids (10 wide × 8 tall) for the proof-of-concept.
// The map module will expand them into full campus layouts during map work.
//
// connections: array of { tile, targetRegion, targetTile }
//   tile:         {x,y} the player steps on to trigger a transition (this region)
//   targetRegion: id of the region to enter
//   targetTile:   {x,y} the player arrives at in the target region
//   The castle connection in outdoor_campus is gated — map.js checks
//   engine state and blocks it until all five prior professors are defeated.
//
// encounterTiles: array of { tile, professorId }
//   Stepping on this tile triggers the named professor's sequence.
//   game.js checks whether the professor is already defeated before triggering.

export const regions = {

  outdoor_campus: {
    id: 'outdoor_campus',
    displayName: 'Outdoor Campus',
    // Tile key:  0 = FLOOR  1 = WALL  2 = WATER
    // Rows 3–4, cols 3–4: the pond.
    // South wall (row 7) has exits at col 2 (main building) and col 7 (lab wing).
    // North-east corner (col 9, row 1): hill path to castle (gated).
    tileMap: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],  // col 9 = hill path exit (castle, gated)
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 2, 2, 0, 0, 0, 0, 1],  // pond
      [1, 0, 0, 2, 2, 0, 0, 0, 0, 1],  // pond
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 0, 1, 1, 1, 1, 0, 1, 1],  // exits: col 2 = main building, col 7 = lab wing
    ],
    entryPosition: { x: 5, y: 6 },
    connections: [
      { tile: { x: 2, y: 7 }, targetRegion: 'main_building', targetTile: { x: 2, y: 6 } },
      { tile: { x: 7, y: 7 }, targetRegion: 'lab_wing',      targetTile: { x: 1, y: 6 } },
      { tile: { x: 9, y: 1 }, targetRegion: 'castle',        targetTile: { x: 5, y: 6 } },  // gated
    ],
    weatherEffect: 'rain',
    music: 'overworld',
    encounterTiles: [
      { tile: { x: 5, y: 3 }, professorId: 'prof_schwaartz' },  // pond walkway
    ],
  },

  main_building: {
    id: 'main_building',
    displayName: 'Main Building',
    // South wall exits: col 2 = outdoor campus, col 4 = cafeteria,
    //                   col 6 = graduate lounge, col 8 = basement stairs.
    // East wall (col 9, row 3): corridor to lab wing.
    tileMap: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],  // col 9 = lab wing corridor
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 0, 1, 0, 1, 0, 1, 0, 1],  // exits at cols 2, 4, 6, 8
    ],
    entryPosition: { x: 2, y: 6 },
    connections: [
      { tile: { x: 2, y: 7 }, targetRegion: 'outdoor_campus',  targetTile: { x: 2, y: 6 } },
      { tile: { x: 4, y: 7 }, targetRegion: 'cafeteria',       targetTile: { x: 5, y: 1 } },
      { tile: { x: 6, y: 7 }, targetRegion: 'graduate_lounge', targetTile: { x: 5, y: 1 } },
      { tile: { x: 8, y: 7 }, targetRegion: 'basement',        targetTile: { x: 5, y: 1 } },
      { tile: { x: 9, y: 3 }, targetRegion: 'lab_wing',        targetTile: { x: 1, y: 3 } },
    ],
    weatherEffect: null,
    music: 'indoor',
    encounterTiles: [
      { tile: { x: 5, y: 5 }, professorId: 'prof_syntaxa' },    // classroom, ground floor
      { tile: { x: 7, y: 2 }, professorId: 'prof_composita' },  // library mezzanine
    ],
  },

  cafeteria: {
    id: 'cafeteria',
    displayName: 'Cafeteria',
    tileMap: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 0, 1, 1, 1, 1],  // exit at col 5
    ],
    entryPosition: { x: 5, y: 1 },
    connections: [
      { tile: { x: 5, y: 7 }, targetRegion: 'main_building', targetTile: { x: 4, y: 6 } },
    ],
    weatherEffect: null,
    music: 'cafeteria',
    encounterTiles: [],
  },

  graduate_lounge: {
    id: 'graduate_lounge',
    displayName: 'Graduate Lounge',
    // North wall (row 0, col 5): code-gated door to the courtyard.
    // The code gate is enforced by map.js — the connection entry exists here
    // so the region graph is complete; access logic lives in the map module.
    tileMap: [
      [1, 1, 1, 1, 1, 0, 1, 1, 1, 1],  // col 5 = code-gated door to courtyard
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 0, 1, 1, 1, 1],  // col 5 = exit to main building
    ],
    entryPosition: { x: 5, y: 1 },
    connections: [
      { tile: { x: 5, y: 7 }, targetRegion: 'main_building', targetTile: { x: 6, y: 6 } },
      { tile: { x: 5, y: 0 }, targetRegion: 'courtyard',     targetTile: { x: 5, y: 6 } },  // code-gated
    ],
    weatherEffect: null,
    music: 'indoor',
    encounterTiles: [],
  },

  basement: {
    id: 'basement',
    displayName: 'PhD Dungeon',
    // Entrance at top (row 0, col 5) — player comes down the stairwell.
    tileMap: [
      [1, 1, 1, 1, 1, 0, 1, 1, 1, 1],  // entrance from main building
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    entryPosition: { x: 5, y: 1 },
    connections: [
      { tile: { x: 5, y: 0 }, targetRegion: 'main_building', targetTile: { x: 8, y: 6 } },
    ],
    weatherEffect: 'monitor_glow',
    music: 'dungeon',
    encounterTiles: [
      { tile: { x: 5, y: 6 }, professorId: 'prof_recursio' },
    ],
  },

  lab_wing: {
    id: 'lab_wing',
    displayName: 'Lab Wing',
    // West wall (col 0, row 6): path back to outdoor campus.
    // South wall (row 7, col 5): corridor to main building.
    tileMap: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 1],  // col 0 = main building corridor (east)
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 1],  // col 0 = outdoor campus path (west)
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    entryPosition: { x: 1, y: 3 },
    connections: [
      { tile: { x: 0, y: 3 }, targetRegion: 'main_building',  targetTile: { x: 8, y: 3 } },
      { tile: { x: 0, y: 6 }, targetRegion: 'outdoor_campus', targetTile: { x: 7, y: 6 } },
    ],
    weatherEffect: 'monitor_glow',
    music: 'indoor',
    encounterTiles: [
      { tile: { x: 7, y: 2 }, professorId: 'prof_bayesio' },  // GPU lab, upper floor
    ],
  },

  courtyard: {
    id: 'courtyard',
    displayName: 'The Courtyard',
    // Secret area behind the main building, accessible only via a code-gated
    // door in the graduate lounge. Prof. Parsemore waits at the far end.
    // Enclosed on all sides — no exits except back through the door.
    tileMap: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],  // north wall — enclosed
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],  // Parsemore at col 5
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 0, 1, 1, 1, 1],  // col 5 = exit south to graduate lounge
    ],
    entryPosition: { x: 5, y: 6 },
    connections: [
      { tile: { x: 5, y: 7 }, targetRegion: 'graduate_lounge', targetTile: { x: 5, y: 1 } },
    ],
    weatherEffect: 'mist',
    music: 'indoor',
    encounterTiles: [
      { tile: { x: 5, y: 2 }, professorId: 'prof_parsemore' },
    ],
  },

  castle: {
    id: 'castle',
    displayName: 'The Castle',
    // Player enters from the south (hill path from outdoor campus).
    // Prof. Vec Tor waits at the far end of the great hall.
    tileMap: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 0, 1, 1, 1, 1],  // exit at col 5 (south, back to outdoor campus)
    ],
    entryPosition: { x: 5, y: 6 },
    connections: [
      { tile: { x: 5, y: 7 }, targetRegion: 'outdoor_campus', targetTile: { x: 8, y: 2 } },
    ],
    weatherEffect: 'candlelight',
    music: 'castle',
    encounterTiles: [
      { tile: { x: 5, y: 2 }, professorId: 'prof_vec_tor' },
    ],
  },
};
