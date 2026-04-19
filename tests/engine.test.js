// tests/engine.test.js — test suite for js/engine.js
// Covers: state initialisation, HP management, win state, loss state, reset behaviour,
// XP/levelling, move pool management.

import { test, assert } from './runner.js';
import * as engine from '../js/engine.js';
import { professors } from '../js/data/professors.js';
import { playerMoves } from '../js/data/moves.js';

// IDs of all professors who must be defeated before the castle unlocks.
// Mirrors the PRE_CASTLE_PROFESSOR_IDS slice in engine.js (all except vec_tor, the final boss).
// Includes parsemore (secret boss) — encountered before the castle, counts toward the gate.
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

test('setPlayerHP() clamps above playerMaxHP to playerMaxHP', () => {
  engine.init();
  engine.setPlayerHP(150);
  assert.equal(engine.getState().playerHP, engine.getState().playerMaxHP);
});

// ─── LOSS STATE ───────────────────────────────────────────────────────────────
// When HP hits 0, engine.setPlayerHP() calls resetGame() automatically.
// Expected: HP restores to 100, region resets, scene resets — but progress survives.

test('setPlayerHP(0) restores playerHP to playerMaxHP (faint and respawn)', () => {
  engine.init();
  engine.setPlayerHP(50);
  engine.setPlayerHP(0);
  assert.equal(engine.getState().playerHP, engine.getState().playerMaxHP, 'HP should be fully restored after fainting');
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
  assert.equal(engine.getState().playerHP, engine.getState().playerMaxHP, 'negative HP should clamp to 0 and trigger reset');
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

// Regression: STARTING_MOVE_IDS must reference IDs that exist in moves.js playerMoves.
// Previously engine.js had stale IDs (all_nighter, counterexample, correction) from a
// deleted playerMoves.js, causing ALL_MOVE_MAP lookups to return undefined in BattleScene.
test('init() starting move IDs all exist in the playerMoves data table', () => {
  engine.init();
  const knownIds = new Set(playerMoves.map(m => m.id));
  const state = engine.getState();
  state.learnedMoves.forEach(id => {
    assert.ok(knownIds.has(id), `starting move id "${id}" not found in playerMoves data`);
  });
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
  const leveledUp = engine.awardXP(70); // XP_PER_LEVEL = 70
  assert.equal(leveledUp, true);
});

test('awardXP() increments level on level-up', () => {
  engine.init();
  engine.awardXP(100);
  assert.equal(engine.getState().level, 2);
});

test('awardXP() carries over excess XP after level-up', () => {
  engine.init();
  engine.awardXP(85); // 85 - 70 (threshold) = 15 carry-over
  assert.equal(engine.getState().xp, 15);
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

test('awardXP() increases playerMaxHP by 5*level on level-up', () => {
  engine.init();
  engine.awardXP(70); // level 1 → 2, gain = 5*1 = 5
  assert.equal(engine.getState().playerMaxHP, 105);
});

test('awardXP() restores playerHP to new playerMaxHP on level-up', () => {
  engine.init();
  engine.setPlayerHP(50); // take some damage
  engine.awardXP(70); // level up
  const { playerHP, playerMaxHP } = engine.getState();
  assert.equal(playerHP, playerMaxHP, 'HP should be fully restored to new max on level-up');
});

test('awardXP() accumulates across multiple calls without level-up', () => {
  engine.init();
  engine.awardXP(30);
  engine.awardXP(39); // 69 total — just under the 70 threshold
  assert.equal(engine.getState().xp, 69);
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

// ─── INVENTORY — init ────────────────────────────────────────────────────────

test('init() sets inventory to empty array', () => {
  engine.init();
  assert.isArray(engine.getState().inventory, 'inventory should be an array');
  assert.equal(engine.getState().inventory.length, 0);
});

test('init() sets expBoost to 0', () => {
  engine.init();
  assert.equal(engine.getState().expBoost, 0);
});

// ─── addItem ─────────────────────────────────────────────────────────────────

test('addItem() adds a consumable to inventory with qty 1', () => {
  engine.init();
  engine.addItem('triscuit');
  const inv = engine.getState().inventory;
  assert.equal(inv.length, 1);
  assert.equal(inv[0].itemId, 'triscuit');
  assert.equal(inv[0].qty, 1);
});

test('addItem() increments qty when the same item is added again', () => {
  engine.init();
  engine.addItem('triscuit');
  engine.addItem('triscuit');
  const entry = engine.getState().inventory.find(e => e.itemId === 'triscuit');
  assert.equal(entry.qty, 2, 'qty should be 2 after adding the same item twice');
});

test('addItem() for upgrade immediately applies boost_defense to defenseStat', () => {
  engine.init();
  const before = engine.getState().defenseStat;
  engine.addItem('emotional_support_pickle'); // effect: boost_defense, value: 5
  assert.equal(engine.getState().defenseStat, before + 5, 'defenseStat should increase by 5 on upgrade acquisition');
});

test('addItem() for upgrade still records it in inventory', () => {
  engine.init();
  engine.addItem('emotional_support_pickle');
  assert.ok(engine.hasItem('emotional_support_pickle'), 'upgrade should appear in inventory after addItem');
});

// ─── hasItem ─────────────────────────────────────────────────────────────────

test('hasItem() returns false when item not in inventory', () => {
  engine.init();
  assert.equal(engine.hasItem('triscuit'), false);
});

test('hasItem() returns true after addItem()', () => {
  engine.init();
  engine.addItem('triscuit');
  assert.equal(engine.hasItem('triscuit'), true);
});

test('hasItem() returns false after item qty drops to 0', () => {
  engine.init();
  engine.addItem('triscuit');
  engine.removeItem('triscuit');
  assert.equal(engine.hasItem('triscuit'), false, 'hasItem should be false after qty reaches 0');
});

// ─── removeItem ──────────────────────────────────────────────────────────────

test('removeItem() decrements qty by 1', () => {
  engine.init();
  engine.addItem('triscuit');
  engine.addItem('triscuit');
  engine.removeItem('triscuit');
  const entry = engine.getState().inventory.find(e => e.itemId === 'triscuit');
  assert.equal(entry.qty, 1, 'qty should be 1 after one removal from qty 2');
});

test('removeItem() is a no-op when item not in inventory', () => {
  engine.init();
  engine.removeItem('triscuit'); // should not throw
  assert.equal(engine.getState().inventory.length, 0);
});

// ─── getConsumables ──────────────────────────────────────────────────────────

test('getConsumables() returns only consumable-category items', () => {
  engine.init();
  engine.addItem('triscuit');                // consumable
  engine.addItem('id_card');                 // key_item
  engine.addItem('emotional_support_pickle'); // upgrade
  const consumables = engine.getConsumables();
  assert.equal(consumables.length, 1, 'should return only the 1 consumable');
  assert.equal(consumables[0].itemId, 'triscuit');
});

test('getConsumables() excludes items with qty 0', () => {
  engine.init();
  engine.addItem('triscuit');
  engine.removeItem('triscuit');
  const consumables = engine.getConsumables();
  assert.equal(consumables.length, 0, 'depleted consumable should not appear in getConsumables');
});

// ─── useItem ─────────────────────────────────────────────────────────────────

test('useItem() returns the item definition object', () => {
  engine.init();
  engine.addItem('triscuit');
  const result = engine.useItem('triscuit');
  assert.ok(result !== null, 'useItem should return the item, not null');
  assert.equal(result.id, 'triscuit');
});

test('useItem() applies restore_hp effect to playerHP', () => {
  engine.init();
  engine.setPlayerHP(70);
  engine.addItem('triscuit'); // effect: restore_hp, value: 5
  engine.useItem('triscuit');
  assert.equal(engine.getState().playerHP, 75, 'HP should increase by 5 after using triscuit');
});

test('useItem() removes the item from inventory after use', () => {
  engine.init();
  engine.addItem('triscuit');
  engine.useItem('triscuit');
  assert.equal(engine.hasItem('triscuit'), false, 'item should be removed from inventory after use');
});

test('useItem() returns null when item is not in inventory', () => {
  engine.init();
  const result = engine.useItem('triscuit');
  assert.equal(result, null, 'should return null if item is not in inventory');
});

test('useItem() with full-restore item (null value) restores HP to playerMaxHP', () => {
  engine.init();
  engine.setPlayerHP(30);
  engine.addItem('carls_large_cheese_steak_sub'); // effect: restore_hp, value: null
  engine.useItem('carls_large_cheese_steak_sub');
  assert.equal(engine.getState().playerHP, engine.getState().playerMaxHP, 'null HP restore value should fully restore HP');
});

test('useItem() with boost_exp consumable increases expBoost', () => {
  engine.init();
  engine.addItem('dreamy_ramen'); // effect: boost_exp, value: 15
  engine.useItem('dreamy_ramen');
  assert.equal(engine.getState().expBoost, 15, 'expBoost should increase by 15 after using dreamy_ramen');
});

test('useItem() with boost_attack consumable increases damageBuff', () => {
  engine.init();
  const before = engine.getState().damageBuff;
  engine.addItem('large_coffee'); // effect: boost_attack, value: 15
  engine.useItem('large_coffee');
  assert.equal(engine.getState().damageBuff, before + 15, 'damageBuff should increase by 15 after using large_coffee');
});

test('useItem() with boost_defense consumable increases defenseStat', () => {
  engine.init();
  const before = engine.getState().defenseStat;
  engine.addItem('pms_peanut_butter_cup'); // effect: boost_defense, value: 15
  engine.useItem('pms_peanut_butter_cup');
  assert.equal(engine.getState().defenseStat, before + 15, 'defenseStat should increase by 15 after using peanut butter cup');
});

// ─── awardXP with expBoost ────────────────────────────────────────────────────

test('awardXP() includes expBoost in the total and resets it to 0', () => {
  engine.init();
  engine.addItem('dreamy_ramen'); // boost_exp: 15
  engine.useItem('dreamy_ramen');
  engine.awardXP(30);
  assert.equal(engine.getState().xp, 45, 'XP should be 30 base + 15 boost = 45');
  assert.equal(engine.getState().expBoost, 0, 'expBoost should be reset to 0 after awardXP');
});

test('awardXP() with no expBoost behaves as before', () => {
  engine.init();
  engine.awardXP(30);
  assert.equal(engine.getState().xp, 30, 'XP should be exactly 30 with no boost');
});

// ─── addDamageBuff / addDefenseStat ──────────────────────────────────────────

test('addDamageBuff() increases damageBuff by n', () => {
  engine.init();
  engine.addDamageBuff(10);
  assert.equal(engine.getState().damageBuff, 10);
});

test('addDamageBuff() is additive with existing damageBuff', () => {
  engine.init();
  engine.addDamageBuff(5);
  engine.addDamageBuff(3);
  assert.equal(engine.getState().damageBuff, 8);
});

test('addDefenseStat() increases defenseStat by n', () => {
  engine.init();
  engine.addDefenseStat(8);
  assert.equal(engine.getState().defenseStat, 8);
});

// ─── inventory persistence across faint ──────────────────────────────────────

test('inventory is preserved when player faints (resetGame does not clear inventory)', () => {
  engine.init();
  engine.addItem('triscuit');
  engine.setPlayerHP(0); // triggers resetGame()
  assert.ok(engine.hasItem('triscuit'), 'items should survive a faint');
});
