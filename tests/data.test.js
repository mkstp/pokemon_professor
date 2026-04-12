// tests/data.test.js — test suite for js/data.js
// Covers: structural completeness, referential integrity, and value constraints.
// All tests are synchronous (data.js contains no async operations).

import { test, assert } from './runner.js';
import {
  TILE,
  professorMoves,
  playerMoves,
  professors,
  dialogueSequences,
  regions,
  audioTracks,
} from '../js/data.js';

// ─── TILE CONSTANTS ───────────────────────────────────────────────────────────

test('TILE exports FLOOR, WALL, and WATER constants', () => {
  assert.ok('FLOOR' in TILE, 'TILE.FLOOR missing');
  assert.ok('WALL'  in TILE, 'TILE.WALL missing');
  assert.ok('WATER' in TILE, 'TILE.WATER missing');
});

test('TILE constants are distinct numbers', () => {
  assert.ok(typeof TILE.FLOOR === 'number', 'TILE.FLOOR is not a number');
  assert.ok(typeof TILE.WALL  === 'number', 'TILE.WALL is not a number');
  assert.ok(typeof TILE.WATER === 'number', 'TILE.WATER is not a number');
  assert.ok(TILE.FLOOR !== TILE.WALL,  'FLOOR and WALL must differ');
  assert.ok(TILE.FLOOR !== TILE.WATER, 'FLOOR and WATER must differ');
  assert.ok(TILE.WALL  !== TILE.WATER, 'WALL and WATER must differ');
});

// ─── PROFESSOR MOVES — structure ──────────────────────────────────────────────

test('professorMoves is a non-empty array', () => {
  assert.isArray(professorMoves);
  assert.ok(professorMoves.length > 0, 'professorMoves is empty');
});

test('every professorMove has required fields', () => {
  const required = ['id', 'name', 'damage', 'description', 'effect'];
  for (const move of professorMoves) {
    for (const field of required) {
      assert.ok(field in move, `professorMove "${move.id ?? '?'}" missing field "${field}"`);
    }
  }
});

test('every professorMove damage is a non-negative integer', () => {
  for (const move of professorMoves) {
    assert.ok(
      Number.isInteger(move.damage) && move.damage >= 0,
      `professorMove "${move.id}" damage must be a non-negative integer, got ${move.damage}`
    );
  }
});

test('professorMove effect values are from the allowed set', () => {
  const allowed = new Set(['disrupt', 'self_damage', 'deferred', null]);
  for (const move of professorMoves) {
    assert.ok(
      allowed.has(move.effect),
      `professorMove "${move.id}" has unexpected effect "${move.effect}"`
    );
  }
});

test('professorMove ids are unique', () => {
  const ids = professorMoves.map(m => m.id);
  const unique = new Set(ids);
  assert.equal(unique.size, ids.length, 'duplicate professorMove ids found');
});

// ─── PLAYER MOVES — structure ─────────────────────────────────────────────────

test('playerMoves contains exactly 6 entries', () => {
  assert.equal(playerMoves.length, 6);
});

test('every playerMove has required fields', () => {
  const required = ['id', 'name', 'damage', 'description', 'effect'];
  for (const move of playerMoves) {
    for (const field of required) {
      assert.ok(field in move, `playerMove "${move.id ?? '?'}" missing field "${field}"`);
    }
  }
});

test('every playerMove damage is a non-negative integer', () => {
  for (const move of playerMoves) {
    assert.ok(
      Number.isInteger(move.damage) && move.damage >= 0,
      `playerMove "${move.id}" damage must be a non-negative integer, got ${move.damage}`
    );
  }
});

test('playerMove ids are unique', () => {
  const ids = playerMoves.map(m => m.id);
  const unique = new Set(ids);
  assert.equal(unique.size, ids.length, 'duplicate playerMove ids found');
});

// ─── PROFESSORS — structure ───────────────────────────────────────────────────

test('professors contains exactly 7 entries', () => {
  assert.equal(professors.length, 7);
});

test('every professor has required fields', () => {
  const required = ['id', 'name', 'field', 'hp', 'location', 'moves', 'dialogue', 'sprite', 'battleMusic'];
  for (const prof of professors) {
    for (const field of required) {
      assert.ok(field in prof, `professor "${prof.id ?? '?'}" missing field "${field}"`);
    }
  }
});

test('every professor location has region and tile with x and y', () => {
  for (const prof of professors) {
    const loc = prof.location;
    assert.ok(typeof loc.region === 'string' && loc.region.length > 0,
      `professor "${prof.id}" location.region is not a non-empty string`);
    assert.ok(loc.tile && typeof loc.tile.x === 'number' && typeof loc.tile.y === 'number',
      `professor "${prof.id}" location.tile must have numeric x and y`);
  }
});

test('every professor dialogue has preBattle, postWin, postLoss keys', () => {
  for (const prof of professors) {
    const d = prof.dialogue;
    assert.ok(typeof d.preBattle === 'string', `professor "${prof.id}" missing dialogue.preBattle`);
    assert.ok(typeof d.postWin   === 'string', `professor "${prof.id}" missing dialogue.postWin`);
    assert.ok(typeof d.postLoss  === 'string', `professor "${prof.id}" missing dialogue.postLoss`);
  }
});

test('every professor has exactly 4 moves', () => {
  for (const prof of professors) {
    assert.equal(prof.moves.length, 4, `professor "${prof.id}" has ${prof.moves.length} moves (expected 4)`);
  }
});

test('every professor hp is a positive integer', () => {
  for (const prof of professors) {
    assert.ok(
      Number.isInteger(prof.hp) && prof.hp > 0,
      `professor "${prof.id}" hp must be a positive integer, got ${prof.hp}`
    );
  }
});

test('professor ids are unique', () => {
  const ids = professors.map(p => p.id);
  const unique = new Set(ids);
  assert.equal(unique.size, ids.length, 'duplicate professor ids found');
});

// ─── PROFESSORS — referential integrity ──────────────────────────────────────

test('every professor move id exists in professorMoves', () => {
  const knownIds = new Set(professorMoves.map(m => m.id));
  for (const prof of professors) {
    for (const moveId of prof.moves) {
      assert.ok(
        knownIds.has(moveId),
        `professor "${prof.id}" references unknown move id "${moveId}"`
      );
    }
  }
});

test('every professor dialogue key exists in dialogueSequences', () => {
  for (const prof of professors) {
    const keys = [prof.dialogue.preBattle, prof.dialogue.postWin, prof.dialogue.postLoss];
    for (const key of keys) {
      assert.ok(
        key in dialogueSequences,
        `professor "${prof.id}" references missing dialogueSequence key "${key}"`
      );
    }
  }
});

test('every professor location.region exists in regions', () => {
  for (const prof of professors) {
    assert.ok(
      prof.location.region in regions,
      `professor "${prof.id}" location.region "${prof.location.region}" not found in regions`
    );
  }
});

test('every professor battleMusic id exists in audioTracks', () => {
  const trackIds = new Set(audioTracks.map(t => t.id));
  for (const prof of professors) {
    assert.ok(
      trackIds.has(prof.battleMusic),
      `professor "${prof.id}" battleMusic "${prof.battleMusic}" not found in audioTracks`
    );
  }
});

// ─── DIALOGUE SEQUENCES — structure ──────────────────────────────────────────

test('every dialogueSequence is a non-empty array', () => {
  for (const [key, seq] of Object.entries(dialogueSequences)) {
    assert.isArray(seq, `dialogueSequences["${key}"] is not an array`);
    assert.ok(seq.length > 0, `dialogueSequences["${key}"] is empty`);
  }
});

test('every dialogueSequence entry has speaker and line strings', () => {
  for (const [key, seq] of Object.entries(dialogueSequences)) {
    for (let i = 0; i < seq.length; i++) {
      const entry = seq[i];
      assert.ok(
        typeof entry.speaker === 'string' && entry.speaker.length > 0,
        `dialogueSequences["${key}"][${i}] missing speaker`
      );
      assert.ok(
        typeof entry.line === 'string' && entry.line.length > 0,
        `dialogueSequences["${key}"][${i}] missing line`
      );
    }
  }
});

// ─── REGIONS — structure ──────────────────────────────────────────────────────

test('regions contains at least one entry', () => {
  assert.ok(Object.keys(regions).length > 0, 'regions object is empty');
});

test('every region has required fields', () => {
  const required = ['id', 'displayName', 'tileMap', 'entryPosition', 'connections', 'weatherEffect', 'music', 'encounterTiles'];
  for (const [key, region] of Object.entries(regions)) {
    for (const field of required) {
      assert.ok(field in region, `region "${key}" missing field "${field}"`);
    }
  }
});

test('every region id matches its key in the regions object', () => {
  for (const [key, region] of Object.entries(regions)) {
    assert.equal(region.id, key, `region key "${key}" does not match region.id "${region.id}"`);
  }
});

test('every region tileMap is a non-empty array of arrays', () => {
  for (const [key, region] of Object.entries(regions)) {
    assert.isArray(region.tileMap, `region "${key}" tileMap is not an array`);
    assert.ok(region.tileMap.length > 0, `region "${key}" tileMap has no rows`);
    for (let y = 0; y < region.tileMap.length; y++) {
      assert.isArray(region.tileMap[y], `region "${key}" tileMap[${y}] is not an array`);
      assert.ok(region.tileMap[y].length > 0, `region "${key}" tileMap[${y}] has no columns`);
    }
  }
});

test('every region tileMap row has the same length', () => {
  for (const [key, region] of Object.entries(regions)) {
    const width = region.tileMap[0].length;
    for (let y = 1; y < region.tileMap.length; y++) {
      assert.equal(
        region.tileMap[y].length, width,
        `region "${key}" tileMap row ${y} has length ${region.tileMap[y].length}, expected ${width}`
      );
    }
  }
});

test('every region tileMap value is a known TILE constant', () => {
  const validValues = new Set(Object.values(TILE));
  for (const [key, region] of Object.entries(regions)) {
    for (let y = 0; y < region.tileMap.length; y++) {
      for (let x = 0; x < region.tileMap[y].length; x++) {
        const val = region.tileMap[y][x];
        assert.ok(
          validValues.has(val),
          `region "${key}" tileMap[${y}][${x}] = ${val}, not a known TILE constant`
        );
      }
    }
  }
});

test('every region entryPosition has numeric x and y', () => {
  for (const [key, region] of Object.entries(regions)) {
    const ep = region.entryPosition;
    assert.ok(
      ep && typeof ep.x === 'number' && typeof ep.y === 'number',
      `region "${key}" entryPosition must have numeric x and y`
    );
  }
});

test('every region entryPosition is within tileMap bounds', () => {
  for (const [key, region] of Object.entries(regions)) {
    const { x, y } = region.entryPosition;
    const height = region.tileMap.length;
    const width  = region.tileMap[0].length;
    assert.ok(
      y >= 0 && y < height && x >= 0 && x < width,
      `region "${key}" entryPosition (${x},${y}) is outside tileMap bounds (${width}×${height})`
    );
  }
});

test('every region entryPosition is on a walkable tile', () => {
  for (const [key, region] of Object.entries(regions)) {
    const { x, y } = region.entryPosition;
    const tile = region.tileMap[y][x];
    assert.equal(
      tile, TILE.FLOOR,
      `region "${key}" entryPosition (${x},${y}) is not a FLOOR tile (got ${tile})`
    );
  }
});

test('every region connection has tile, targetRegion, and targetTile', () => {
  for (const [key, region] of Object.entries(regions)) {
    for (let i = 0; i < region.connections.length; i++) {
      const conn = region.connections[i];
      assert.ok(conn.tile && typeof conn.tile.x === 'number' && typeof conn.tile.y === 'number',
        `region "${key}" connection[${i}] missing tile with x/y`);
      assert.ok(typeof conn.targetRegion === 'string' && conn.targetRegion.length > 0,
        `region "${key}" connection[${i}] missing targetRegion`);
      assert.ok(conn.targetTile && typeof conn.targetTile.x === 'number' && typeof conn.targetTile.y === 'number',
        `region "${key}" connection[${i}] missing targetTile with x/y`);
    }
  }
});

test('every region connection targetRegion exists in regions', () => {
  for (const [key, region] of Object.entries(regions)) {
    for (const conn of region.connections) {
      assert.ok(
        conn.targetRegion in regions,
        `region "${key}" connection to unknown region "${conn.targetRegion}"`
      );
    }
  }
});

test('every region encounterTile has tile and professorId', () => {
  for (const [key, region] of Object.entries(regions)) {
    for (let i = 0; i < region.encounterTiles.length; i++) {
      const et = region.encounterTiles[i];
      assert.ok(et.tile && typeof et.tile.x === 'number' && typeof et.tile.y === 'number',
        `region "${key}" encounterTiles[${i}] missing tile with x/y`);
      assert.ok(typeof et.professorId === 'string' && et.professorId.length > 0,
        `region "${key}" encounterTiles[${i}] missing professorId`);
    }
  }
});

test('every region encounterTile professorId exists in professors', () => {
  const profIds = new Set(professors.map(p => p.id));
  for (const [key, region] of Object.entries(regions)) {
    for (const et of region.encounterTiles) {
      assert.ok(
        profIds.has(et.professorId),
        `region "${key}" encounterTile references unknown professor "${et.professorId}"`
      );
    }
  }
});

test('every region music id exists in audioTracks', () => {
  const trackIds = new Set(audioTracks.map(t => t.id));
  for (const [key, region] of Object.entries(regions)) {
    assert.ok(
      trackIds.has(region.music),
      `region "${key}" music "${region.music}" not found in audioTracks`
    );
  }
});

// ─── AUDIO TRACKS — structure ─────────────────────────────────────────────────

test('audioTracks is a non-empty array', () => {
  assert.isArray(audioTracks);
  assert.ok(audioTracks.length > 0, 'audioTracks is empty');
});

test('every audioTrack has id, src, and loop fields', () => {
  for (const track of audioTracks) {
    assert.ok(typeof track.id  === 'string'  && track.id.length  > 0, `audioTrack missing id`);
    assert.ok(typeof track.src === 'string'  && track.src.length > 0, `audioTrack "${track.id}" missing src`);
    assert.ok(typeof track.loop === 'boolean', `audioTrack "${track.id}" loop must be boolean, got ${typeof track.loop}`);
  }
});

test('audioTrack ids are unique', () => {
  const ids = audioTracks.map(t => t.id);
  const unique = new Set(ids);
  assert.equal(unique.size, ids.length, 'duplicate audioTrack ids found');
});

// ─── CROSS-CHECKS ─────────────────────────────────────────────────────────────

test('each professor appears in their declared region\'s encounterTiles', () => {
  for (const prof of professors) {
    const region = regions[prof.location.region];
    const found  = region.encounterTiles.some(et => et.professorId === prof.id);
    assert.ok(
      found,
      `professor "${prof.id}" declares location in "${prof.location.region}" but is not in that region's encounterTiles`
    );
  }
});

test('professors are ordered by increasing HP (encounter sequence)', () => {
  // HP should increase as the encounter sequence progresses.
  for (let i = 1; i < professors.length; i++) {
    assert.ok(
      professors[i].hp >= professors[i - 1].hp,
      `professors out of HP order at index ${i}: "${professors[i].id}" (${professors[i].hp}) after "${professors[i-1].id}" (${professors[i-1].hp})`
    );
  }
});

// ─── PROFESSOR SPRITES — multi-level ─────────────────────────────────────────

test('professors with sprites[] have exactly 3 entries', () => {
  for (const prof of professors) {
    if (prof.sprites) {
      assert.equal(
        prof.sprites.length, 3,
        `professor "${prof.id}" sprites[] must have exactly 3 entries`
      );
    }
  }
});

test('professors with sprites[] have non-empty string paths at every level', () => {
  for (const prof of professors) {
    if (prof.sprites) {
      for (let i = 0; i < prof.sprites.length; i++) {
        assert.ok(
          typeof prof.sprites[i] === 'string' && prof.sprites[i].length > 0,
          `professor "${prof.id}" sprites[${i}] must be a non-empty string`
        );
      }
    }
  }
});

test('professors with sprites[] have sprites[0] matching the sprite field', () => {
  // sprites[0] is the l1 (full-HP) path and doubles as the single-image fallback.
  for (const prof of professors) {
    if (prof.sprites) {
      assert.equal(
        prof.sprites[0], prof.sprite,
        `professor "${prof.id}" sprites[0] must match the sprite field`
      );
    }
  }
});

test('schwaartz sprite paths point to the l1/l2/l3 files that exist', () => {
  const schwaartz = professors.find(p => p.id === 'prof_schwaartz');
  assert.ok(schwaartz.sprites, 'schwaartz should have a sprites[] array');
  assert.ok(schwaartz.sprites[0].includes('schwaartz_l1'), 'sprites[0] should be the l1 file');
  assert.ok(schwaartz.sprites[1].includes('schwaartz_l2'), 'sprites[1] should be the l2 file');
  assert.ok(schwaartz.sprites[2].includes('schwaartz_l3'), 'sprites[2] should be the l3 file');
});

// ─── AUDIO TRACKS — SFX entries ──────────────────────────────────────────────

test('audioTracks includes the three battle SFX entries', () => {
  const ids = new Set(audioTracks.map(t => t.id));
  assert.ok(ids.has('sfx_hit_light'),    'sfx_hit_light missing from audioTracks');
  assert.ok(ids.has('sfx_hit_heavy'),    'sfx_hit_heavy missing from audioTracks');
  assert.ok(ids.has('sfx_dialogue_adv'), 'sfx_dialogue_adv missing from audioTracks');
});

test('SFX audioTracks have loop: false', () => {
  const sfxIds = ['sfx_hit_light', 'sfx_hit_heavy', 'sfx_dialogue_adv'];
  for (const id of sfxIds) {
    const track = audioTracks.find(t => t.id === id);
    assert.ok(track, `${id} not found in audioTracks`);
    assert.equal(track.loop, false, `${id} must have loop: false`);
  }
});
