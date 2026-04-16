// tests/engine.test.js — test suite for js/engine.js
// Covers: state initialisation, HP management, win state, loss state, reset behaviour,
// XP/levelling, move pool management.

import { test, assert } from './runner.js';
import * as engine from '../js/engine.js';
import { professors } from '../js/data/professors.js';

// IDs of all professors who must be defeated before the castle unlocks.
// Mirrors the PRE_CASTLE_PROFESSOR_IDS slice in engine.js (all except the last).
const PRE_CASTLE_IDS = professors.slice(0, -1).map(p => p.id);

// ─── INIT ─────────────────────────────────────────────────────────────────────

test('init() sets playerHP to 100', () => {
  engine.init();
  assert.equal(engine.getState().playerHP, 100);
});

test('init() sets currentRegion to outdoor_campus', () => {
  engine.init();
  assert.equal(engine.getState().currentRegion, 'outdoor_campus');
});

test('init() clears defeatedProfessors', () => {
  engine.init();
  assert.equal(engine.getState().defeatedProfessors.length, 0, 'defeatedProfessors should be empty after init');
});

test('init() sets activeScene to overworld', () => {
  engine.init();
  assert.equal(engine.getState().activeScene, 'overworld');
});

// ─── setPlayerHP — clamping ───────────────────────────────────────────────────

test('setPlayerHP() updates playerHP to the given value', () => {
  engine.init();
  engine.setPlayerHP(75);
  assert.equal(engine.getState().playerHP, 75);
});

test('setPlayerHP() clamps above 100 to 100', () => {
  engine.init();
  engine.setPlayerHP(150);
  assert.equal(engine.getState().playerHP, 100);
});

// ─── LOSS STATE ───────────────────────────────────────────────────────────────
// When HP hits 0, engine.setPlayerHP() calls resetGame() automatically.
// Expected: HP restores to 100, region resets, scene resets — but progress survives.

test('setPlayerHP(0) restores playerHP to 100 (faint and respawn)', () => {
  engine.init();
  engine.setPlayerHP(50);
  engine.setPlayerHP(0);
  assert.equal(engine.getState().playerHP, 100, 'HP should be fully restored after fainting');
});

test('setPlayerHP(0) resets currentRegion to outdoor_campus', () => {
  engine.init();
  engine.setPlayerHP(0);
  assert.equal(engine.getState().currentRegion, 'outdoor_campus');
});

test('setPlayerHP(0) resets activeScene to overworld', () => {
  engine.init();
  engine.setScene('battle');
  engine.setPlayerHP(0);
  assert.equal(engine.getState().activeScene, 'overworld');
});

test('setPlayerHP(0) preserves defeated professors — progress is not lost on faint', () => {
  engine.init();
  engine.defeatProfessor('prof_schwaartz');
  engine.setPlayerHP(0);
  assert.ok(
    engine.isDefeated('prof_schwaartz'),
    'defeated professors must survive a faint'
  );
});

test('negative HP argument also triggers faint and respawn', () => {
  engine.init();
  engine.setPlayerHP(10);
  engine.setPlayerHP(-5);
  assert.equal(engine.getState().playerHP, 100, 'negative HP should clamp to 0 and trigger reset');
});

// ─── WIN STATE ────────────────────────────────────────────────────────────────
// A win calls engine.defeatProfessor(). Expected: professor recorded; HP/region unchanged.

test('defeatProfessor() records the professor as defeated', () => {
  engine.init();
  engine.defeatProfessor('prof_schwaartz');
  assert.ok(engine.isDefeated('prof_schwaartz'));
});

test('isDefeated() returns false before a professor is defeated', () => {
  engine.init();
  assert.ok(!engine.isDefeated('prof_schwaartz'), 'should not be defeated before defeatProfessor() is called');
});

test('defeatProfessor() is idempotent — calling it twice does not create duplicates', () => {
  engine.init();
  engine.defeatProfessor('prof_schwaartz');
  engine.defeatProfessor('prof_schwaartz');
  assert.equal(
    engine.getState().defeatedProfessors.length, 1,
    'second call to defeatProfessor() should not add a duplicate entry'
  );
});

test('defeatProfessor() does not reset HP or region', () => {
  engine.init();
  engine.setPlayerHP(40);
  engine.defeatProfessor('prof_schwaartz');
  assert.equal(engine.getState().playerHP, 40, 'HP should be unchanged after defeating a professor');
  assert.equal(engine.getState().currentRegion, 'outdoor_campus', 'region should be unchanged after defeating a professor');
});

// ─── allProfessorsDefeated ────────────────────────────────────────────────────

test('allProfessorsDefeated() returns false when no professors are defeated', () => {
  engine.init();
  assert.ok(!engine.allProfessorsDefeated());
});

test('allProfessorsDefeated() returns false when only some are defeated', () => {
  engine.init();
  engine.defeatProfessor(PRE_CASTLE_IDS[0]);
  engine.defeatProfessor(PRE_CASTLE_IDS[1]);
  assert.ok(!engine.allProfessorsDefeated(), 'should be false with only 2 of 5 defeated');
});

test('allProfessorsDefeated() returns true when all pre-castle professors are defeated', () => {
  engine.init();
  for (const id of PRE_CASTLE_IDS) {
    engine.defeatProfessor(id);
  }
  assert.ok(engine.allProfessorsDefeated(), 'should be true once all 5 pre-castle professors are defeated');
});

test('allProfessorsDefeated() excludes the final boss (prof_vec_tor)', () => {
  engine.init();
  // Defeat all pre-castle professors but NOT vec_tor — should still return true.
  for (const id of PRE_CASTLE_IDS) {
    engine.defeatProfessor(id);
  }
  assert.ok(
    engine.allProfessorsDefeated(),
    'allProfessorsDefeated() should not require vec_tor to be defeated'
  );
});

// ─── INIT — progression fields ────────────────────────────────────────────────

test('init() sets xp to 0', () => {
  engine.init();
  assert.equal(engine.getState().xp, 0);
});

test('init() sets level to 1', () => {
  engine.init();
  assert.equal(engine.getState().level, 1);
});

test('init() sets damageBuff to 0', () => {
  engine.init();
  assert.equal(engine.getState().damageBuff, 0);
});

test('init() sets defenseStat to 0', () => {
  engine.init();
  assert.equal(engine.getState().defenseStat, 0);
});

test('init() seeds learnedMoves with 4 starting moves', () => {
  engine.init();
  assert.equal(engine.getState().learnedMoves.length, 4);
});

test('init() seeds activeMoves with 4 starting moves matching learnedMoves', () => {
  engine.init();
  const state = engine.getState();
  assert.equal(state.activeMoves.length, 4);
  assert.ok(
    state.activeMoves.every(id => state.learnedMoves.includes(id)),
    'all activeMoves should be in learnedMoves after init'
  );
});

// ─── awardXP ─────────────────────────────────────────────────────────────────

test('awardXP() increases xp by the given amount', () => {
  engine.init();
  engine.awardXP(30);
  assert.equal(engine.getState().xp, 30);
});

test('awardXP() returns false when no level-up occurs', () => {
  engine.init();
  const leveledUp = engine.awardXP(30);
  assert.equal(leveledUp, false);
});

test('awardXP() returns true when XP reaches the level-up threshold', () => {
  engine.init();
  const leveledUp = engine.awardXP(100);
  assert.equal(leveledUp, true);
});

test('awardXP() increments level on level-up', () => {
  engine.init();
  engine.awardXP(100);
  assert.equal(engine.getState().level, 2);
});

test('awardXP() carries over excess XP after level-up', () => {
  engine.init();
  engine.awardXP(130); // threshold 100 — 30 XP should carry over
  assert.equal(engine.getState().xp, 30);
});

test('awardXP() increases damageBuff on level-up', () => {
  engine.init();
  engine.awardXP(100);
  assert.ok(engine.getState().damageBuff > 0, 'damageBuff should increase after level-up');
});

test('awardXP() increases defenseStat on level-up', () => {
  engine.init();
  engine.awardXP(100);
  assert.ok(engine.getState().defenseStat > 0, 'defenseStat should increase after level-up');
});

test('awardXP() accumulates across multiple calls without level-up', () => {
  engine.init();
  engine.awardXP(30);
  engine.awardXP(40);
  assert.equal(engine.getState().xp, 70);
});

// ─── XP persistence across faint ────────────────────────────────────────────

test('XP is preserved when player faints (resetGame does not clear xp)', () => {
  engine.init();
  engine.awardXP(50);
  engine.setPlayerHP(0); // triggers resetGame()
  assert.equal(engine.getState().xp, 50, 'xp should survive a faint');
});

test('level is preserved when player faints', () => {
  engine.init();
  engine.awardXP(100); // level up to 2
  engine.setPlayerHP(0); // faint
  assert.equal(engine.getState().level, 2, 'level should survive a faint');
});

test('damageBuff is preserved when player faints', () => {
  engine.init();
  engine.awardXP(100);
  const buff = engine.getState().damageBuff;
  engine.setPlayerHP(0);
  assert.equal(engine.getState().damageBuff, buff, 'damageBuff should survive a faint');
});

// ─── addLearnedMove ──────────────────────────────────────────────────────────

test('addLearnedMove() adds a new move id to learnedMoves', () => {
  engine.init();
  engine.addLearnedMove('cite_this');
  assert.ok(engine.getState().learnedMoves.includes('cite_this'));
});

test('addLearnedMove() is idempotent — calling it twice does not create duplicates', () => {
  engine.init();
  const before = engine.getState().learnedMoves.length;
  engine.addLearnedMove('cite_this');
  engine.addLearnedMove('cite_this');
  assert.equal(engine.getState().learnedMoves.length, before + 1);
});

// ─── setActiveMoves ──────────────────────────────────────────────────────────

test('setActiveMoves() updates activeMoves to the provided array', () => {
  engine.init();
  const newLoadout = ['cite_this', 'all_nighter', 'counterexample', 'correction'];
  engine.setActiveMoves(newLoadout);
  const active = engine.getState().activeMoves;
  assert.equal(active.length, 4);
  assert.equal(active[0], 'cite_this');
  assert.equal(active[1], 'all_nighter');
});
