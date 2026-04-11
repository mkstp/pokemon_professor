// tests/engine.test.js — test suite for js/engine.js
// Covers: state initialisation, HP management, win state, loss state, and reset behaviour.
// engine.js is pure JS with no Phaser dependency, so all tests are synchronous.

import { test, assert } from './runner.js';
import * as engine from '../js/engine.js';
import { professors } from '../js/data.js';

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
