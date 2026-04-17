// tests/move_kiosk_scene.test.js — unit tests for MoveKioskScene
//
// Two test helpers:
//   makeScene()     — bypasses create() and Phaser; sets up learnedMoves/activeMoves
//                     directly for testing pure logic methods (_moveCursor, _toggleCurrent,
//                     _confirmAndExit).
//   makeSceneViaCreate() — calls create() with a real engine environment so we can test
//                          that create() reads from engine state correctly.
//
// phaser-stub.js MUST be imported first — it sets globalThis.Phaser before
// MoveKioskScene.js is evaluated.

import './phaser-stub.js';
import { test, assert } from './runner.js';
import MoveKioskScene from '../js/scenes/MoveKioskScene.js';
import { playerMoves }    from '../js/data/playerMoves.js';
import { professorMoves } from '../js/data/professors.js';
import { npcMoves }       from '../js/data/students.js';
import * as engine from '../js/engine.js';

// Replicate MoveKioskScene's internal ALL_MOVE_MAP so tests can resolve move objects.
const ALL_MOVE_MAP = Object.fromEntries(
  [...professorMoves, ...npcMoves, ...playerMoves].map(m => [m.id, m])
);

// Known move IDs from data/playerMoves.js — used as test fixtures.
// STARTING_MOVE_IDS in engine.js = ['non_sequitur', 'all_nighter', 'counterexample', 'correction']
const MOVE_A = 'non_sequitur';     // in STARTING_MOVE_IDS
const MOVE_B = 'all_nighter';      // in STARTING_MOVE_IDS
const MOVE_C = 'counterexample';   // in STARTING_MOVE_IDS
const MOVE_D = 'correction';       // in STARTING_MOVE_IDS
const MOVE_E = 'cite_this';        // NOT in STARTING_MOVE_IDS — useful for overflow tests

// ─── Minimal Phaser stubs ──────────────────────────────────────────────────────

function textStub() {
  const obj = {
    setText()    { return this; },
    setStyle()   { return this; },
    setOrigin()  { return this; },
    setVisible() { return this; },
  };
  return obj;
}

function makeAddStub() {
  return {
    rectangle: () => ({ setInteractive: () => ({}) }),
    text:      () => textStub(),
    graphics:  () => ({
      clear: () => {}, fillStyle: () => {}, fillRect:   () => {},
      lineStyle: () => {}, strokeRect: () => {}, lineBetween: () => {},
    }),
  };
}

function makeInputStub() {
  return {
    keyboard: {
      addKeys: () => ({
        up:    { on: () => {} }, down:  { on: () => {} },
        enter: { on: () => {} }, space: { on: () => {} }, esc: { on: () => {} },
      }),
    },
  };
}

// ─── makeScene — logic tests (bypasses create()) ──────────────────────────────
//
// Sets learnedMoves/activeMoves/cursor directly so logic methods can be
// exercised without caring about engine.init() default state.

function makeScene({ learnedIds = [], activeIds = [], onClose = null } = {}) {
  const scene = Object.create(MoveKioskScene.prototype);
  scene.init({ onClose });

  scene.learnedMoves  = learnedIds.map(id => ALL_MOVE_MAP[id]).filter(Boolean);
  scene.activeMoves   = [...activeIds];
  scene.cursor        = 0;
  scene.scrollOffset  = 0;
  scene._fullWarning  = false;

  // Stub display objects so _refresh (which rowTexts, slotTexts, etc.) won't throw.
  scene._refresh   = () => {};
  scene.footerText = textStub();
  scene.time       = { delayedCall: () => {} };
  scene.scene      = { stop: () => {} };

  return scene;
}

// makeSceneWithMoves — builds a scene with N synthetic move objects, bypassing
// ALL_MOVE_MAP. Used for scroll tests that need more moves than are in the
// real data without requiring knowledge of specific IDs.
function makeSceneWithMoves(count) {
  const scene = Object.create(MoveKioskScene.prototype);
  scene.init({ onClose: null });

  scene.learnedMoves = Array.from({ length: count }, (_, i) => ({
    id: `move_${i}`, name: `Move ${i}`, damage: i * 5,
    description: `Description for move ${i}`, effect: null,
  }));
  scene.activeMoves  = [];
  scene.cursor       = 0;
  scene.scrollOffset = 0;
  scene._fullWarning = false;

  scene._refresh   = () => {};
  scene.footerText = textStub();
  scene.time       = { delayedCall: () => {} };
  scene.scene      = { stop: () => {} };

  return scene;
}

// ─── makeSceneViaCreate — create() tests ──────────────────────────────────────
//
// Calls create() for real so we can assert it reads from engine state.
// Stubs all Phaser display methods but lets create() run to completion.

function makeSceneViaCreate({ learnedIds = [], activeIds = [], onClose = null } = {}) {
  engine.init();
  // addLearnedMove is idempotent — safe to call for IDs already in the starting set.
  learnedIds.forEach(id => engine.addLearnedMove(id));
  engine.setActiveMoves(activeIds);

  const scene = Object.create(MoveKioskScene.prototype);
  scene.init({ onClose });

  scene.add   = makeAddStub();
  scene.input = makeInputStub();
  scene.time  = { delayedCall: () => {} };
  scene.scene = { stop: () => {} };

  scene.create();

  // Stub _refresh after create() so subsequent method calls don't need real display objects.
  scene._refresh = () => {};
  return scene;
}

// ─── create() — state initialisation ─────────────────────────────────────────

test('MoveKioskScene: create() sets cursor to 0', () => {
  // engine.init() seeds 4 starting moves; setActiveMoves to just MOVE_A.
  const scene = makeSceneViaCreate({ activeIds: [MOVE_A] });
  assert.equal(scene.cursor, 0, 'cursor should be 0 after create()');
});

test('MoveKioskScene: create() populates learnedMoves from engine state', () => {
  // engine.init() always seeds exactly 4 starting moves.
  engine.init();
  const scene = makeSceneViaCreate({});
  assert.equal(scene.learnedMoves.length, 4, 'learnedMoves should have 4 entries (the 4 starting moves)');
  assert.ok(scene.learnedMoves.every(m => m && m.id), 'all entries should be resolved move objects');
});

test('MoveKioskScene: create() includes extra learned moves beyond starting set', () => {
  // MOVE_E (cite_this) is not in STARTING_MOVE_IDS — adding it should produce 5 learned moves.
  const scene = makeSceneViaCreate({ learnedIds: [MOVE_E] });
  assert.equal(scene.learnedMoves.length, 5, 'learnedMoves should have 5 entries after adding MOVE_E');
});

test('MoveKioskScene: create() sets activeMoves as a copy of engine state activeMoves', () => {
  const scene = makeSceneViaCreate({ activeIds: [MOVE_A, MOVE_B] });
  assert.equal(scene.activeMoves.length, 2, 'activeMoves should have 2 entries');
  assert.equal(scene.activeMoves[0], MOVE_A, 'first active move should match engine state');
  assert.equal(scene.activeMoves[1], MOVE_B, 'second active move should match engine state');
});

test('MoveKioskScene: create() activeMoves is a local copy — not the engine array', () => {
  const scene = makeSceneViaCreate({ activeIds: [MOVE_A] });
  scene.activeMoves.push('fake_id');
  // Engine state should be unchanged until _confirmAndExit() is called.
  assert.equal(engine.getState().activeMoves.length, 1, 'pushing to local copy should not affect engine state');
});

// ─── _moveCursor() ────────────────────────────────────────────────────────────

test('MoveKioskScene: _moveCursor(1) increments cursor by 1', () => {
  const scene = makeScene({ learnedIds: [MOVE_A, MOVE_B, MOVE_C] });
  scene._moveCursor(1);
  assert.equal(scene.cursor, 1, 'cursor should move to 1');
});

test('MoveKioskScene: _moveCursor(-1) wraps cursor from 0 to last index', () => {
  const scene = makeScene({ learnedIds: [MOVE_A, MOVE_B, MOVE_C] });
  scene._moveCursor(-1);
  assert.equal(scene.cursor, 2, 'cursor should wrap to index 2');
});

test('MoveKioskScene: _moveCursor(1) wraps cursor from last index to 0', () => {
  const scene = makeScene({ learnedIds: [MOVE_A, MOVE_B, MOVE_C] });
  scene.cursor = 2;
  scene._moveCursor(1);
  assert.equal(scene.cursor, 0, 'cursor should wrap from index 2 to 0');
});

// ─── _toggleCurrent() ────────────────────────────────────────────────────────

test('MoveKioskScene: _toggleCurrent() adds inactive move to activeMoves', () => {
  const scene = makeScene({ learnedIds: [MOVE_A, MOVE_B], activeIds: [MOVE_A] });
  scene.cursor = 1; // pointing at MOVE_B (inactive)
  scene._toggleCurrent();
  assert.includes(scene.activeMoves, MOVE_B, 'MOVE_B should be added to activeMoves');
});

test('MoveKioskScene: _toggleCurrent() removes active move from activeMoves', () => {
  const scene = makeScene({ learnedIds: [MOVE_A, MOVE_B], activeIds: [MOVE_A, MOVE_B] });
  scene.cursor = 0; // pointing at MOVE_A (active)
  scene._toggleCurrent();
  assert.equal(scene.activeMoves.includes(MOVE_A), false, 'MOVE_A should be removed from activeMoves');
});

test('MoveKioskScene: _toggleCurrent() does not add a 5th move when loadout is full', () => {
  const scene = makeScene({
    learnedIds: [MOVE_A, MOVE_B, MOVE_C, MOVE_D, MOVE_E],
    activeIds:  [MOVE_A, MOVE_B, MOVE_C, MOVE_D],
  });
  scene.cursor = 4; // pointing at MOVE_E (inactive); loadout is full
  scene._toggleCurrent();
  assert.equal(scene.activeMoves.length, 4, 'activeMoves should still have 4 entries');
  assert.equal(scene.activeMoves.includes(MOVE_E), false, 'MOVE_E should not be added');
});

test('MoveKioskScene: _toggleCurrent() allows removing an active move when loadout is full', () => {
  const scene = makeScene({
    learnedIds: [MOVE_A, MOVE_B, MOVE_C, MOVE_D, MOVE_E],
    activeIds:  [MOVE_A, MOVE_B, MOVE_C, MOVE_D],
  });
  scene.cursor = 0; // pointing at MOVE_A (active); loadout is full
  scene._toggleCurrent();
  assert.equal(scene.activeMoves.length, 3, 'activeMoves should have 3 entries after removal');
  assert.equal(scene.activeMoves.includes(MOVE_A), false, 'MOVE_A should be removed');
});

// ─── _confirmAndExit() ────────────────────────────────────────────────────────

test('MoveKioskScene: _confirmAndExit() saves local activeMoves to engine state', () => {
  engine.init();
  const scene = makeScene({ learnedIds: [MOVE_A, MOVE_B, MOVE_C], activeIds: [] });
  scene.activeMoves = [MOVE_B, MOVE_C];
  scene._confirmAndExit();
  assert.equal(engine.getState().activeMoves.length, 2, 'engine should have 2 active moves');
  assert.equal(engine.getState().activeMoves[0], MOVE_B, 'first active move should be MOVE_B');
  assert.equal(engine.getState().activeMoves[1], MOVE_C, 'second active move should be MOVE_C');
});

test('MoveKioskScene: _confirmAndExit() calls onClose callback', () => {
  let closeCalled = false;
  const scene = makeScene({ learnedIds: [MOVE_A], activeIds: [MOVE_A], onClose: () => { closeCalled = true; } });
  scene._confirmAndExit();
  assert.ok(closeCalled, 'onClose should be called on exit');
});

test('MoveKioskScene: _confirmAndExit() does not throw when onClose is null', () => {
  engine.init();
  const scene = makeScene({ learnedIds: [MOVE_A], activeIds: [MOVE_A], onClose: null });
  scene._confirmAndExit();
  assert.ok(true, 'no error when onClose is null');
});

// ─── _buildUI row count ───────────────────────────────────────────────────────

test('MoveKioskScene: create() builds exactly VISIBLE_ROWS (8) row text objects', () => {
  // Before scrolling: code created 1 text per learned move (5 here).
  // After scrolling: code should always create exactly VISIBLE_ROWS = 8 objects.
  const scene = makeSceneViaCreate({ learnedIds: [MOVE_E] }); // 5 learned moves
  assert.equal(scene.rowTexts.length, 8, '_buildUI should create exactly 8 (VISIBLE_ROWS) row text objects');
});

// ─── scrolling — scrollOffset initialisation ──────────────────────────────────

test('MoveKioskScene: create() sets scrollOffset to 0', () => {
  const scene = makeSceneViaCreate({});
  assert.equal(scene.scrollOffset, 0, 'scrollOffset should be 0 after create()');
});

// ─── scrolling — _moveCursor scroll clamping ──────────────────────────────────

test('MoveKioskScene: scrollOffset stays 0 when all moves fit within VISIBLE_ROWS', () => {
  const scene = makeSceneWithMoves(4); // 4 < VISIBLE_ROWS (8)
  scene._moveCursor(1);
  scene._moveCursor(1);
  scene._moveCursor(1); // cursor reaches index 3 (last), still fits
  assert.equal(scene.scrollOffset, 0, 'scrollOffset should remain 0 when list fits on screen');
});

test('MoveKioskScene: _moveCursor(1) advances scrollOffset when cursor exits bottom of window', () => {
  const scene = makeSceneWithMoves(10);
  scene.cursor = 7; // last visible row at scrollOffset=0 (VISIBLE_ROWS-1)
  scene._moveCursor(1); // cursor → 8, which is >= 0 + 8 = VISIBLE_ROWS
  assert.equal(scene.cursor,       8, 'cursor should be 8');
  assert.equal(scene.scrollOffset, 1, 'scrollOffset should advance to 1');
});

test('MoveKioskScene: _moveCursor(-1) decrements scrollOffset when cursor exits top of window', () => {
  const scene = makeSceneWithMoves(10);
  scene.scrollOffset = 3;
  scene.cursor       = 3; // at the top of the visible window
  scene._moveCursor(-1); // cursor → 2, which is < scrollOffset (3)
  assert.equal(scene.cursor,       2, 'cursor should be 2');
  assert.equal(scene.scrollOffset, 2, 'scrollOffset should decrease to 2');
});

test('MoveKioskScene: _moveCursor wraps from last to 0 and resets scrollOffset to 0', () => {
  const scene = makeSceneWithMoves(10);
  scene.cursor       = 9;
  scene.scrollOffset = 2; // scrolled partway down
  scene._moveCursor(1); // wraps to 0; 0 < scrollOffset(2) → clamp scrollOffset to 0
  assert.equal(scene.cursor,       0, 'cursor should wrap to 0');
  assert.equal(scene.scrollOffset, 0, 'scrollOffset should reset to 0 after wrap-to-top');
});

test('MoveKioskScene: _moveCursor wraps from 0 to last and adjusts scrollOffset', () => {
  const scene = makeSceneWithMoves(10);
  // cursor=0, scrollOffset=0; wrap to index 9
  // 9 >= 0 + 8 → scrollOffset = 9 - 8 + 1 = 2
  scene._moveCursor(-1);
  assert.equal(scene.cursor,       9, 'cursor should wrap to 9');
  assert.equal(scene.scrollOffset, 2, 'scrollOffset should be 2 (9 - VISIBLE_ROWS + 1)');
});

// ─── scrolling — _refresh renders scroll-relative rows ────────────────────────

test('MoveKioskScene: _refresh() renders move at scrollOffset in the first row slot', () => {
  const scene = makeSceneWithMoves(10);
  scene.scrollOffset = 3;
  scene.cursor       = 3; // cursor on the first visible move

  // Capture setText calls on each row text.
  const rowSetTexts = [];
  scene.rowTexts = Array.from({ length: 8 }, () => {
    const calls = [];
    rowSetTexts.push(calls);
    return { setText(t) { calls.push(t); return this; }, setStyle() { return this; }, setVisible() { return this; } };
  });

  // Wire up the other display objects _refresh needs.
  scene.activeCountText = textStub();
  scene.slotGraphics    = {
    clear: () => {}, fillStyle: () => {}, fillRect:   () => {},
    lineStyle: () => {}, strokeRect: () => {},
  };
  scene.slotTexts       = Array.from({ length: 4 }, () => textStub());
  scene.descText        = textStub();
  scene.footerText      = textStub();
  scene.scrollIndicator = textStub();

  // Call the real _refresh.
  MoveKioskScene.prototype._refresh.call(scene);

  // Row 0 should show 'move_3' (cursor on move 3, scrollOffset 3 → row 0 gets '>')
  assert.ok(rowSetTexts[0].length > 0, 'first row text should have setText called');
  assert.ok(rowSetTexts[0][0].startsWith('>'), 'first row should be the cursor row (move at scrollOffset)');
});

test('MoveKioskScene: _refresh() hides row texts beyond the move list length', () => {
  // 3 moves, VISIBLE_ROWS=8 → rows 3-7 should be hidden
  const scene = makeSceneWithMoves(3);

  const visibilities = [];
  scene.rowTexts = Array.from({ length: 8 }, () => {
    const record = { visible: true };
    return {
      setText()    { return this; },
      setStyle()   { return this; },
      setVisible(v) { record.visible = v; return this; },
      _record:     record,
    };
  });

  scene.activeCountText = textStub();
  scene.slotGraphics    = {
    clear: () => {}, fillStyle: () => {}, fillRect:   () => {},
    lineStyle: () => {}, strokeRect: () => {},
  };
  scene.slotTexts       = Array.from({ length: 4 }, () => textStub());
  scene.descText        = textStub();
  scene.footerText      = textStub();
  scene.scrollIndicator = textStub();

  MoveKioskScene.prototype._refresh.call(scene);

  // Rows 0-2 should be visible; rows 3-7 should be hidden.
  for (let i = 3; i < 8; i++) {
    assert.equal(scene.rowTexts[i]._record.visible, false, `row ${i} should be hidden when beyond move list`);
  }
});
