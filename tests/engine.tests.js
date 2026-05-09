// tests/engine.test.js — consolidated version

import { test, assert } from './runner.js';
import * as engine from '../js/engine.js';
import { professors } from '../js/data/professors.js';
import { npcMoves } from '../js/data/moves.js';

const PRE_CASTLE_IDS = professors.slice(0, -1).map(p => p.id);

// ─── Helpers ────────────────────────────────────────────────────────────────

function setup() {
  engine.init();
  return engine.getState();
}

const get = () => engine.getState();

// ─── INIT ───────────────────────────────────────────────────────────────────

test('init(): defaults', () => {
  const s = setup();
  assert.equal(s.playerHP, 100);
  assert.equal(s.currentRegion, 'outdoor_campus');
  assert.equal(s.activeScene, 'overworld');
  assert.equal(s.xp, 0);
  assert.equal(s.level, 1);
  assert.equal(s.damageBuff, 0);
  assert.equal(s.defenseStat, 0);
  assert.equal(s.defeatedProfessors.length, 0);
  assert.equal(s.inventory.length, 0);
  assert.equal(s.expBoost, 0);
});

test('init(): learnedMoves + activeMoves seeded correctly', () => {
  const s = setup();
  assert.equal(s.learnedMoves.length, 4);
  assert.equal(s.activeMoves.length, 4);
  assert.ok(s.activeMoves.every(id => s.learnedMoves.includes(id)));
});

test('init(): starting move IDs exist in npcMoves', () => {
  const s = setup();
  const known = new Set(npcMoves.map(m => m.id));
  s.learnedMoves.forEach(id => assert.ok(known.has(id)));
});

// ─── setPlayerHP ────────────────────────────────────────────────────────────

test('setPlayerHP: normal + clamp', () => {
  setup();
  engine.setPlayerHP(75);
  assert.equal(get().playerHP, 75);

  engine.setPlayerHP(150);
  assert.equal(get().playerHP, get().playerMaxHP);
});

test('setPlayerHP(0): triggers reset, preserves defeats', () => {
  setup();
  engine.setPlayerHP(50);
  engine.defeatProfessor('prof_schwaartz');
  engine.setPlayerHP(0);

  const s = get();
  assert.equal(s.playerHP, s.playerMaxHP);
  assert.equal(s.currentRegion, 'outdoor_campus');
  assert.equal(s.activeScene, 'overworld');
  assert.ok(engine.isDefeated('prof_schwaartz'));
});

// ─── defeatProfessor ────────────────────────────────────────────────────────

test('defeatProfessor: basic + idempotent', () => {
  setup();
  engine.defeatProfessor('prof_schwaartz');
  engine.defeatProfessor('prof_schwaartz');

  const s = get();
  assert.ok(engine.isDefeated('prof_schwaartz'));
  assert.equal(s.defeatedProfessors.length, 1);
});

test('defeatProfessor: does not affect HP/region', () => {
  setup();
  engine.setPlayerHP(40);
  engine.defeatProfessor('prof_schwaartz');
  assert.equal(get().playerHP, 40);
});

// ─── allProfessorsDefeated ──────────────────────────────────────────────────

test('allProfessorsDefeated: false → partial → true', () => {
  setup();
  assert.ok(!engine.allProfessorsDefeated());

  engine.defeatProfessor(PRE_CASTLE_IDS[0]);
  assert.ok(!engine.allProfessorsDefeated());

  PRE_CASTLE_IDS.forEach(id => engine.defeatProfessor(id));
  assert.ok(engine.allProfessorsDefeated());
});

// ─── awardXP ────────────────────────────────────────────────────────────────

test('awardXP: accumulation + threshold', () => {
  setup();
  engine.awardXP(30);
  engine.awardXP(39);
  assert.equal(get().xp, 69);

  const leveled = engine.awardXP(1);
  assert.equal(leveled, true);
});

test('awardXP: level-up effects', () => {
  setup();
  engine.setPlayerHP(50);
  engine.awardXP(100);

  const s = get();
  assert.equal(s.level, 2);
  assert.ok(s.damageBuff > 0);
  assert.ok(s.defenseStat > 0);
  assert.equal(s.playerHP, s.playerMaxHP);
});

test('awardXP: carry-over', () => {
  setup();
  engine.awardXP(85);
  assert.equal(get().xp, 15);
});

// ─── XP persistence across faint ────────────────────────────────────────────

test('XP + level + buffs persist through faint', () => {
  setup();
  engine.awardXP(100);
  const before = get();

  engine.setPlayerHP(0);
  const after = get();

  assert.equal(after.xp, before.xp);
  assert.equal(after.level, before.level);
  assert.equal(after.damageBuff, before.damageBuff);
});

// ─── learnedMoves / activeMoves ─────────────────────────────────────────────

test('addLearnedMove: add + idempotent', () => {
  setup();
  const before = get().learnedMoves.length;
  engine.addLearnedMove('cite_this');
  engine.addLearnedMove('cite_this');
  assert.equal(get().learnedMoves.length, before + 1);
});

test('setActiveMoves: updates loadout', () => {
  setup();
  const loadout = ['cite_this', 'all_nighter', 'counterexample', 'correction'];
  engine.setActiveMoves(loadout);
  assert.equal(get().activeMoves[0], 'cite_this');
});

// ─── Inventory ──────────────────────────────────────────────────────────────

test('addItem: add + stack', () => {
  setup();
  engine.addItem('triscuit');
  engine.addItem('triscuit');
  const entry = get().inventory.find(e => e.itemId === 'triscuit');
  assert.equal(entry.qty, 2);
});

test('addItem: upgrade applies effect immediately', () => {
  setup();
  const before = get().defenseStat;
  engine.addItem('emotional_support_pickle');
  assert.equal(get().defenseStat, before + 5);
});

test('hasItem: lifecycle', () => {
  setup();
  assert.equal(engine.hasItem('triscuit'), false);

  engine.addItem('triscuit');
  assert.equal(engine.hasItem('triscuit'), true);

  engine.removeItem('triscuit');
  assert.equal(engine.hasItem('triscuit'), false);
});

test('removeItem: decrement + no-op', () => {
  setup();
  engine.addItem('triscuit');
  engine.addItem('triscuit');
  engine.removeItem('triscuit');
  assert.equal(get().inventory.find(e => e.itemId === 'triscuit').qty, 1);

  engine.removeItem('nonexistent');
  assert.equal(get().inventory.length, 1);
});

test('getConsumables: filters correctly', () => {
  setup();
  engine.addItem('triscuit');
  engine.addItem('id_card');
  engine.addItem('emotional_support_pickle');

  const c = engine.getConsumables();
  assert.equal(c.length, 1);
  assert.equal(c[0].itemId, 'triscuit');
});

// ─── useItem (table-driven effects) ─────────────────────────────────────────

[
  {
    id: 'triscuit',
    setup: () => engine.setPlayerHP(70),
    check: () => assert.equal(get().playerHP, 75)
  },
  {
    id: 'carls_large_cheese_steak_sub',
    setup: () => engine.setPlayerHP(30),
    check: () => assert.equal(get().playerHP, get().playerMaxHP)
  },
  {
    id: 'dreamy_ramen',
    check: () => assert.equal(get().expBoost, 15)
  },
  {
    id: 'large_coffee',
    check: () => assert.ok(get().damageBuff > 0)
  },
  {
    id: 'pms_peanut_butter_cup',
    check: () => assert.ok(get().defenseStat > 0)
  }
].forEach(({ id, setup: s, check }) => {
  test(`useItem: ${id}`, () => {
    setup();
    if (s) s();
    engine.addItem(id);
    const result = engine.useItem(id);
    assert.ok(result !== null);
    check();
  });
});

test('useItem: removes item + null when absent', () => {
  setup();
  engine.addItem('triscuit');
  engine.useItem('triscuit');
  assert.equal(engine.hasItem('triscuit'), false);

  assert.equal(engine.useItem('triscuit'), null);
});

// ─── expBoost interaction ───────────────────────────────────────────────────

test('awardXP uses expBoost and resets it', () => {
  setup();
  engine.addItem('dreamy_ramen');
  engine.useItem('dreamy_ramen');
  engine.awardXP(30);

  assert.equal(get().xp, 45);
  assert.equal(get().expBoost, 0);
});

// ─── direct stat modifiers ──────────────────────────────────────────────────

test('addDamageBuff + addDefenseStat', () => {
  setup();
  engine.addDamageBuff(5);
  engine.addDamageBuff(3);
  engine.addDefenseStat(8);

  const s = get();
  assert.equal(s.damageBuff, 8);
  assert.equal(s.defenseStat, 8);
});

// ─── persistence ────────────────────────────────────────────────────────────

test('inventory persists through faint', () => {
  setup();
  engine.addItem('triscuit');
  engine.setPlayerHP(0);
  assert.ok(engine.hasItem('triscuit'));
});