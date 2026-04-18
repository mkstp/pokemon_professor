// tests/battle_scene.test.js — unit tests for BattleScene refactored sub-functions
//
// Tests: _applyDeferredDamage, _applyPlayerMove, _applyOpponentTurn, _setUIMode.
// Uses Object.create(BattleScene.prototype) to bypass Phaser scene initialisation
// and exercise game-logic methods in isolation from Phaser rendering.
//
// phaser-stub.js MUST be imported first — it sets globalThis.Phaser before
// BattleScene.js is evaluated by the browser's module loader.

import './phaser-stub.js';
import { test, assert } from './runner.js';
import BattleScene from '../js/scenes/BattleScene.js';
import { applyDeferredDamage, applyPlayerMove, applyOpponentTurn } from '../js/scenes/battle/resolver.js';
import * as engine from '../js/engine.js';
import { playerMoves, professorMoves, npcMoves } from '../js/data/moves.js';
import { items } from '../js/data/items.js';

// ─── Test helpers ─────────────────────────────────────────────────────────────

// Creates a BattleScene instance without running Phaser's constructor.
// Sets the minimal instance properties required by the sub-functions under test.
// opponentType: 'professor' | 'student' — controls which move map _applyOpponentTurn uses.
function makeScene(opponentId = 'prof_schwaartz', opponentType = 'professor') {
  const scene = Object.create(BattleScene.prototype);
  scene.opponentType = opponentType;
  scene.opponentId   = opponentId;
  return scene;
}

// Creates a context object (ctx) that matches what resolveTurn() passes to
// each resolver function. seq collects simplified descriptors instead of closures,
// making it easy to assert on which steps were added.
// opponentType and opponentId are now part of ctx (extracted from `this` in BattleScene).
function makeCtx(bs, opponentType = 'professor', opponentId = 'prof_schwaartz') {
  const seq = [];
  const text   = msg    => seq.push({ type: 'text', msg });
  const animP  = (f, t) => seq.push({ type: 'animP',  from: f, to: t });
  const animPl = (f, t) => seq.push({ type: 'animPl', from: f, to: t });
  return { bs, seq, text, animP, animPl, opponentType, opponentId };
}

// Creates a minimal battleState for testing.
// opponentMoves[] is an array of valid move IDs (professorMove or npcMove);
// it is set as bs.professor.moves so _applyOpponentTurn can look them up.
function makeBattleState({ professorMoves = ['minimal_pair'], professorHP = 100 } = {}) {
  return {
    professor: {
      id:    'prof_schwaartz',
      name:  'Prof. Schwaartz',
      hp:    professorHP,
      moves: professorMoves,
    },
    professorHP,
    playerMoves:         [],
    selectedMoveIndex:   0,
    menuLevel:           'action',
    selectedActionIndex: 0,
    selectedItemIndex:   0,
    itemScrollOffset:    0,
    phase:               'resolve',
    outcome:             null,
    disrupted:           false,
    professorSkipped:    false,
    professorHalved:     false,
    deferredDamage:      0,
    lastProfessorDamage: 0,
    // New fields for student NPC / npcMove effects.
    playerSkipped:       false,
    npcSkippedTurns:     0,
    npcHalvedNext:       false,
    npcDoubledNext:      false,
    npcBoostNext10:      false,
    npcBoostedTurns:     0,
    npcVulnTurns:        0,
    npcIncomingHalved:   false,
    playerReducedNext10: 0,
    lastPlayerDamage:    0,
  };
}

// Creates a mock Phaser Text object that records setVisible calls.
function mockText() {
  const t = { _visible: true };
  t.setVisible = (v) => { t._visible = v; return t; };
  return t;
}

// ─── _applyDeferredDamage ─────────────────────────────────────────────────────

test('applyDeferredDamage: returns false and adds nothing to seq when deferredDamage is 0', () => {
  engine.init();
  const bs  = makeBattleState();
  const ctx = makeCtx(bs);

  const result = applyDeferredDamage(ctx);

  assert.equal(result, false, 'should return false — no damage to apply');
  assert.equal(ctx.seq.length, 0, 'seq should be empty when deferredDamage is 0');
});

test('applyDeferredDamage: deducts damage, pushes text+animPl, returns false when player survives', () => {
  engine.init(); // playerHP = 100
  const bs  = makeBattleState();
  bs.deferredDamage = 20;
  const ctx = makeCtx(bs);

  const result = applyDeferredDamage(ctx);

  assert.equal(result, false, 'player survives — should return false');
  assert.equal(bs.deferredDamage, 0, 'deferredDamage should be cleared after application');
  assert.equal(bs.lastProfessorDamage, 20, 'lastProfessorDamage should record the deferred amount');
  assert.equal(engine.getState().playerHP, 80, 'engine playerHP should drop by 20');
  assert.equal(ctx.seq.length, 2, 'seq should have exactly two steps: text + animPl');
  assert.equal(ctx.seq[0].type, 'text',   'first step should be a text line');
  assert.equal(ctx.seq[1].type, 'animPl', 'second step should be a player HP animation');
});

test('applyDeferredDamage: returns true when deferred damage kills player', () => {
  engine.init();
  engine.setPlayerHP(10); // 10 HP remaining
  const bs  = makeBattleState();
  bs.deferredDamage = 20; // 10 - 20 → death
  const ctx = makeCtx(bs);

  const result = applyDeferredDamage(ctx);

  assert.equal(result, true, 'should return true when player HP drops to 0');
});

// ─── _applyPlayerMove ─────────────────────────────────────────────────────────

test('applyPlayerMove: normal move deducts damage from professorHP and returns null', () => {
  engine.init();
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'counterexample', name: 'Counterexample', damage: 22, effect: null }];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs);

  const result = applyPlayerMove(ctx);

  assert.equal(result, null, 'professor survives — should return null');
  assert.equal(bs.professorHP, 78, 'professorHP should drop by 22');
  assert.equal(ctx.seq.length, 2, 'seq should have text + animP');
  assert.equal(ctx.seq[0].type, 'text',  'first step should be text');
  assert.equal(ctx.seq[1].type, 'animP', 'second step should be professor HP animation');
});

test('applyPlayerMove: returns win when player move drops professorHP to 0', () => {
  engine.init();
  const bs = makeBattleState({ professorHP: 10 });
  bs.playerMoves       = [{ id: 'counterexample', name: 'Counterexample', damage: 22, effect: null }];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs);

  const result = applyPlayerMove(ctx);

  assert.equal(result, 'win', 'should return win when professor HP ≤ 0');
  assert.equal(bs.professorHP, 0, 'professorHP should be clamped to 0');
});

test('applyPlayerMove: disrupted flag halves damage and is cleared after use', () => {
  engine.init();
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'counterexample', name: 'Counterexample', damage: 40, effect: null }];
  bs.selectedMoveIndex = 0;
  bs.disrupted         = true;
  const ctx = makeCtx(bs);

  applyPlayerMove(ctx);

  assert.equal(bs.professorHP, 80, 'disrupted should halve 40 to 20');
  assert.equal(bs.disrupted, false, 'disrupted flag should be cleared after use');
});

test('applyPlayerMove: skip effect sets professorSkipped', () => {
  engine.init();
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'cite_this', name: 'Cite This!', damage: 15, effect: 'skip' }];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs);

  applyPlayerMove(ctx);

  assert.equal(bs.professorSkipped, true, 'skip effect should set professorSkipped');
});

test('applyPlayerMove: halve_next effect sets professorHalved', () => {
  engine.init();
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'non_sequitur', name: 'Non-Sequitur', damage: 0, effect: 'halve_next' }];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs);

  applyPlayerMove(ctx);

  assert.equal(bs.professorHalved, true, 'halve_next should set professorHalved');
});

test('applyPlayerMove: player_recoil reduces player HP by 10', () => {
  engine.init(); // playerHP = 100
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'all_nighter', name: 'All-Nighter', damage: 38, effect: 'player_recoil' }];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs);

  applyPlayerMove(ctx);

  assert.equal(engine.getState().playerHP, 90, 'player_recoil should deal 10 HP to player');
});

test('applyPlayerMove: counter deals 40 damage when lastProfessorDamage >= 30', () => {
  engine.init();
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves         = [{ id: 'correction', name: 'Correction', damage: 20, effect: 'counter' }];
  bs.selectedMoveIndex   = 0;
  bs.lastProfessorDamage = 35; // meets the ≥ 30 threshold
  const ctx = makeCtx(bs);

  applyPlayerMove(ctx);

  assert.equal(bs.professorHP, 60, 'counter should deal 40 damage when threshold is met');
});

test('applyPlayerMove: counter deals base damage when lastProfessorDamage < 30', () => {
  engine.init();
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves         = [{ id: 'correction', name: 'Correction', damage: 20, effect: 'counter' }];
  bs.selectedMoveIndex   = 0;
  bs.lastProfessorDamage = 10; // below threshold
  const ctx = makeCtx(bs);

  applyPlayerMove(ctx);

  assert.equal(bs.professorHP, 80, 'counter should deal base 20 damage when threshold is not met');
});

test('applyPlayerMove: clear_debuff effect clears disrupted flag', () => {
  engine.init();
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'hot_take', name: 'Hot Take', damage: 10, effect: 'clear_debuff' }];
  bs.selectedMoveIndex = 0;
  bs.disrupted         = true; // pre-existing debuff
  const ctx = makeCtx(bs);

  applyPlayerMove(ctx);

  assert.equal(bs.disrupted, false, 'clear_debuff should clear the disrupted flag');
});

test('applyPlayerMove: player_recoil killing the player returns loss', () => {
  engine.init();
  engine.setPlayerHP(5); // 5 HP remaining — recoil will kill
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'all_nighter', name: 'All-Nighter', damage: 38, effect: 'player_recoil' }];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs);

  const result = applyPlayerMove(ctx);

  assert.equal(result, 'loss', 'should return loss when player_recoil kills the player');
});

// ─── _applyOpponentTurn ──────────────────────────────────────────────────────

test('applyOpponentTurn: skips and returns null when professorSkipped is true', () => {
  engine.init();
  const bs = makeBattleState();
  bs.professorSkipped = true;
  const ctx = makeCtx(bs);

  const result = applyOpponentTurn(ctx);

  assert.equal(result, null, 'skipped turn should return null');
  assert.equal(bs.professorSkipped, false, 'professorSkipped flag should be cleared');
  assert.equal(ctx.seq.length, 1, 'should push exactly one text step (stunned message)');
  assert.equal(ctx.seq[0].type, 'text', 'step should be a text line');
});

test('applyOpponentTurn: normal move deals damage and returns null', () => {
  engine.init(); // playerHP = 100
  // minimal_pair: damage 18, effect null
  const bs  = makeBattleState({ professorMoves: ['minimal_pair'] });
  const ctx = makeCtx(bs);

  const result = applyOpponentTurn(ctx);

  assert.equal(result, null, 'normal move should return null');
  assert.equal(engine.getState().playerHP, 82, 'player HP should drop by 18 (minimal_pair damage)');
  assert.equal(bs.lastProfessorDamage, 18, 'lastProfessorDamage should be recorded');
});

test('applyOpponentTurn: returns loss when professor move drops player HP to 0', () => {
  engine.init();
  engine.setPlayerHP(10); // low HP — stack_overflow (35 dmg) will kill
  const bs  = makeBattleState({ professorMoves: ['stack_overflow'] });
  const ctx = makeCtx(bs);

  const result = applyOpponentTurn(ctx);

  assert.equal(result, 'loss', 'should return loss when player HP drops to 0');
});

test('applyOpponentTurn: disrupt effect sets disrupted flag', () => {
  engine.init();
  // stress_shift: damage 16, effect 'disrupt'
  const bs  = makeBattleState({ professorMoves: ['stress_shift'] });
  const ctx = makeCtx(bs);

  applyOpponentTurn(ctx);

  assert.equal(bs.disrupted, true, 'disrupt effect should set bs.disrupted');
});

test('applyOpponentTurn: deferred move stores damage and returns null', () => {
  engine.init();
  // scope_ambiguity: damage 20, effect 'deferred'
  const bs  = makeBattleState({ professorMoves: ['scope_ambiguity'] });
  const ctx = makeCtx(bs);

  const result = applyOpponentTurn(ctx);

  assert.equal(result, null, 'deferred move should return null');
  assert.equal(bs.deferredDamage, 20, 'deferredDamage should be set to the move damage');
  assert.equal(engine.getState().playerHP, 100, 'player HP should not change immediately');
});

test('applyOpponentTurn: professorHalved flag halves professor damage and is cleared', () => {
  engine.init(); // playerHP = 100
  // minimal_pair: damage 18 → halved to 9
  const bs = makeBattleState({ professorMoves: ['minimal_pair'] });
  bs.professorHalved = true;
  const ctx = makeCtx(bs);

  applyOpponentTurn(ctx);

  assert.equal(engine.getState().playerHP, 91, 'professor damage should be halved (18 → 9)');
  assert.equal(bs.professorHalved, false, 'professorHalved flag should be cleared after use');
});

// ─── _setUIMode ───────────────────────────────────────────────────────────────

function mockItemUI(scene) {
  scene.itemTexts    = [mockText(), mockText(), mockText(), mockText()];
  scene.itemDescText = mockText();
}

test('_setUIMode: action mode shows actionTexts, hides moveTexts, moveDescText, battleLogText, itemTexts', () => {
  const scene = makeScene();
  scene.actionTexts  = [mockText(), mockText(), mockText()];
  scene.moveTexts    = [mockText(), mockText(), mockText(), mockText()];
  scene.moveDescText = mockText();
  scene.battleLogText = mockText();
  mockItemUI(scene);

  scene._setUIMode('action');

  assert.ok(scene.actionTexts.every(t => t._visible),    'actionTexts should be visible');
  assert.ok(scene.moveTexts.every(t => !t._visible),     'moveTexts should be hidden');
  assert.ok(!scene.moveDescText._visible,                 'moveDescText should be hidden');
  assert.ok(!scene.battleLogText._visible,                'battleLogText should be hidden');
  assert.ok(scene.itemTexts.every(t => !t._visible),     'itemTexts should be hidden');
  assert.ok(!scene.itemDescText._visible,                 'itemDescText should be hidden');
});

test('_setUIMode: moves mode shows moveTexts and moveDescText, hides actionTexts, battleLogText, itemTexts', () => {
  const scene = makeScene();
  scene.actionTexts   = [mockText(), mockText(), mockText()];
  scene.moveTexts     = [mockText(), mockText(), mockText(), mockText()];
  scene.moveDescText  = mockText();
  scene.battleLogText = mockText();
  mockItemUI(scene);

  scene._setUIMode('moves');

  assert.ok(scene.moveTexts.every(t => t._visible),     'moveTexts should be visible');
  assert.ok(scene.moveDescText._visible,                 'moveDescText should be visible');
  assert.ok(scene.actionTexts.every(t => !t._visible),  'actionTexts should be hidden');
  assert.ok(!scene.battleLogText._visible,               'battleLogText should be hidden');
  assert.ok(scene.itemTexts.every(t => !t._visible),    'itemTexts should be hidden');
  assert.ok(!scene.itemDescText._visible,                'itemDescText should be hidden');
});

test('_setUIMode: log mode shows battleLogText, hides actionTexts, moveTexts, moveDescText, itemTexts', () => {
  const scene = makeScene();
  scene.actionTexts   = [mockText(), mockText(), mockText()];
  scene.moveTexts     = [mockText(), mockText(), mockText(), mockText()];
  scene.moveDescText  = mockText();
  scene.battleLogText = mockText();
  mockItemUI(scene);

  scene._setUIMode('log');

  assert.ok(scene.battleLogText._visible,                'battleLogText should be visible');
  assert.ok(scene.actionTexts.every(t => !t._visible),  'actionTexts should be hidden');
  assert.ok(scene.moveTexts.every(t => !t._visible),    'moveTexts should be hidden');
  assert.ok(!scene.moveDescText._visible,                'moveDescText should be hidden');
  assert.ok(scene.itemTexts.every(t => !t._visible),    'itemTexts should be hidden');
  assert.ok(!scene.itemDescText._visible,                'itemDescText should be hidden');
});

// ─── applyPlayerMove — new effects ───────────────────────────────────────────

test('applyPlayerMove: playerSkipped causes player to skip and clears the flag', () => {
  engine.init();
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'counterexample', name: 'Counterexample', damage: 22, effect: null }];
  bs.selectedMoveIndex = 0;
  bs.playerSkipped     = true;
  const ctx = makeCtx(bs);

  const result = applyPlayerMove(ctx);

  assert.equal(result, null, 'skipped player turn should return null');
  assert.equal(bs.playerSkipped, false, 'playerSkipped should be cleared after use');
  assert.equal(bs.professorHP, 100, 'no damage should be dealt when player is skipped');
  assert.equal(ctx.seq.length, 1, 'should push exactly one text step');
});

test('applyPlayerMove: playerReducedNext10 reduces damage by 10 flat and clears the field', () => {
  engine.init();
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves         = [{ id: 'counterexample', name: 'Counterexample', damage: 22, effect: null }];
  bs.selectedMoveIndex   = 0;
  bs.playerReducedNext10 = 10;
  const ctx = makeCtx(bs);

  applyPlayerMove(ctx);

  assert.equal(bs.professorHP, 88, 'playerReducedNext10 should reduce 22 to 12');
  assert.equal(bs.playerReducedNext10, 0, 'playerReducedNext10 should be cleared after use');
});

test('applyPlayerMove: npcVulnTurns adds 5 damage to NPC and decrements counter', () => {
  engine.init();
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'counterexample', name: 'Counterexample', damage: 22, effect: null }];
  bs.selectedMoveIndex = 0;
  bs.npcVulnTurns      = 2;
  const ctx = makeCtx(bs);

  applyPlayerMove(ctx);

  assert.equal(bs.professorHP, 75, 'npcVulnTurns should add 5 damage (22 + 5 = 27)');
  assert.equal(bs.npcVulnTurns, 1, 'npcVulnTurns should decrement by 1');
});

test('applyPlayerMove: npcIncomingHalved halves final player damage and clears flag', () => {
  engine.init();
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'counterexample', name: 'Counterexample', damage: 22, effect: null }];
  bs.selectedMoveIndex = 0;
  bs.npcIncomingHalved = true;
  const ctx = makeCtx(bs);

  applyPlayerMove(ctx);

  assert.equal(bs.professorHP, 89, 'npcIncomingHalved should halve 22 to 11');
  assert.equal(bs.npcIncomingHalved, false, 'npcIncomingHalved should be cleared after use');
});

test('applyPlayerMove: lastPlayerDamage is set to the actual damage dealt', () => {
  engine.init();
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'counterexample', name: 'Counterexample', damage: 30, effect: null }];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs);

  applyPlayerMove(ctx);

  assert.equal(bs.lastPlayerDamage, 30, 'lastPlayerDamage should record the damage dealt');
});

// ─── applyOpponentTurn — new NPC effects ─────────────────────────────────────

test('applyOpponentTurn: npcSkippedTurns > 0 causes NPC to skip and decrements counter', () => {
  engine.init();
  const bs = makeBattleState();
  bs.npcSkippedTurns = 2;
  const ctx = makeCtx(bs);

  const result = applyOpponentTurn(ctx);

  assert.equal(result, null, 'skipped NPC turn should return null');
  assert.equal(bs.npcSkippedTurns, 1, 'npcSkippedTurns should decrement by 1');
  assert.equal(engine.getState().playerHP, 100, 'player HP should not change during NPC skip');
  assert.equal(ctx.seq.length, 1, 'should push one text step');
});

test('applyOpponentTurn: skip_opponent effect sets playerSkipped', () => {
  engine.init();
  const bs = makeBattleState({ professorMoves: ['access_denied'], professorHP: 80 });
  const ctx = makeCtx(bs, 'student', 'student_rohan');

  applyOpponentTurn(ctx);

  assert.equal(bs.playerSkipped, true, 'skip_opponent should set playerSkipped');
});

test('applyOpponentTurn: halve_next effect (NPC side) sets disrupted', () => {
  engine.init();
  const bs  = makeBattleState({ professorMoves: ['non_sequitur'], professorHP: 80 });
  const ctx = makeCtx(bs, 'student', 'student_simon');

  applyOpponentTurn(ctx);

  assert.equal(bs.disrupted, true, 'NPC halve_next should set bs.disrupted');
});

test('applyOpponentTurn: heal effect restores NPC HP up to max', () => {
  engine.init();
  // office_hours: damage 0, effect 'heal', healAmount 25
  const bs = makeBattleState({ professorMoves: ['office_hours'], professorHP: 60 });
  bs.professor.hp = 80; // max HP for this NPC
  const ctx = makeCtx(bs, 'student', 'student_mina');

  applyOpponentTurn(ctx);

  assert.equal(bs.professorHP, 80, 'heal should cap at max HP (60 + 25 capped at 80)');
});

test('applyOpponentTurn: skip_self sets npcSkippedTurns to 1', () => {
  engine.init();
  // lit_review_dump: damage 25, effect 'skip_self'
  const bs  = makeBattleState({ professorMoves: ['lit_review_dump'], professorHP: 80 });
  const ctx = makeCtx(bs, 'student', 'student_voss');

  applyOpponentTurn(ctx);

  assert.equal(bs.npcSkippedTurns, 1, 'skip_self should set npcSkippedTurns to 1');
});

test('applyOpponentTurn: skip_self_2 sets npcSkippedTurns to 2', () => {
  engine.init();
  // burnout: damage 40, effect 'skip_self_2'
  const bs  = makeBattleState({ professorMoves: ['burnout'], professorHP: 80 });
  const ctx = makeCtx(bs, 'student', 'student_simon');

  applyOpponentTurn(ctx);

  assert.equal(bs.npcSkippedTurns, 2, 'skip_self_2 should set npcSkippedTurns to 2');
});

test('applyOpponentTurn: npcDoubledNext doubles NPC damage on the following turn', () => {
  engine.init(); // playerHP = 100
  // counterexample: damage 22, effect null (in npcMoves pool)
  const bs = makeBattleState({ professorMoves: ['counterexample'], professorHP: 80 });
  bs.npcDoubledNext = true;
  const ctx = makeCtx(bs, 'student', 'student_elena');

  applyOpponentTurn(ctx);

  assert.equal(engine.getState().playerHP, 56, 'npcDoubledNext should double 22 to 44');
  assert.equal(bs.npcDoubledNext, false, 'npcDoubledNext should be cleared after use');
});

test('applyOpponentTurn: student self_damage deals flat 10 recoil (not 25%)', () => {
  engine.init();
  // all_nighter: damage 38, effect 'self_damage'
  const bs  = makeBattleState({ professorMoves: ['all_nighter'], professorHP: 80 });
  const ctx = makeCtx(bs, 'student', 'student_simon');

  applyOpponentTurn(ctx);

  assert.equal(bs.professorHP, 70, 'student self_damage should deal flat 10 recoil (80 - 10 = 70)');
});

test('applyOpponentTurn: mutual_damage_20 deals 20 to player and 20 to NPC', () => {
  engine.init(); // playerHP = 100
  // meaning_crisis: damage 0, effect 'mutual_damage_20'
  const bs  = makeBattleState({ professorMoves: ['meaning_crisis'], professorHP: 80 });
  const ctx = makeCtx(bs, 'student', 'student_marcellus');

  applyOpponentTurn(ctx);

  assert.equal(engine.getState().playerHP, 80, 'mutual_damage_20 should deal 20 to player');
  assert.equal(bs.professorHP, 60, 'mutual_damage_20 should deal 20 to NPC');
});

test('applyOpponentTurn: conditional_damage deals 40 when lastPlayerDamage >= 30', () => {
  engine.init();
  // correction: damage 20, effect 'conditional_damage'
  const bs = makeBattleState({ professorMoves: ['correction'], professorHP: 80 });
  bs.lastPlayerDamage = 35;
  const ctx = makeCtx(bs, 'student', 'student_voss');

  applyOpponentTurn(ctx);

  assert.equal(engine.getState().playerHP, 60, 'conditional_damage should deal 40 when lastPlayerDamage >= 30');
});

test('applyOpponentTurn: conditional_damage deals base damage when lastPlayerDamage < 30', () => {
  engine.init();
  // correction: damage 20, effect 'conditional_damage'
  const bs = makeBattleState({ professorMoves: ['correction'], professorHP: 80 });
  bs.lastPlayerDamage = 15;
  const ctx = makeCtx(bs, 'student', 'student_voss');

  applyOpponentTurn(ctx);

  assert.equal(engine.getState().playerHP, 80, 'conditional_damage should deal base 20 when threshold not met');
});

test('applyOpponentTurn: clear_buffs clears disrupted and playerReducedNext10', () => {
  engine.init();
  // undergrad_flashback: damage 14, effect 'clear_buffs'
  const bs = makeBattleState({ professorMoves: ['undergrad_flashback'], professorHP: 80 });
  bs.disrupted           = true;
  bs.playerReducedNext10 = 10;
  const ctx = makeCtx(bs, 'student', 'student_lab_sentinel_k');

  applyOpponentTurn(ctx);

  assert.equal(bs.disrupted, false, 'clear_buffs should clear disrupted');
  assert.equal(bs.playerReducedNext10, 0, 'clear_buffs should clear playerReducedNext10');
});

// ─── damageBuff & defenseStat ────────────────────────────────────────────────

test('applyPlayerMove: damageBuff from engine state is added to base move damage', () => {
  engine.init();
  engine.awardXP(100); // level up — damageBuff becomes > 0
  const damageBuff = engine.getState().damageBuff;
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'counterexample', name: 'Counterexample', damage: 22, effect: null }];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs);

  applyPlayerMove(ctx);

  assert.equal(bs.professorHP, 100 - (22 + damageBuff), 'damageBuff should be added to move damage');
});

test('applyPlayerMove: damageBuff of 0 does not alter base damage', () => {
  engine.init(); // damageBuff starts at 0
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'counterexample', name: 'Counterexample', damage: 22, effect: null }];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs);

  applyPlayerMove(ctx);

  assert.equal(bs.professorHP, 78, 'zero damageBuff should leave damage unchanged at 22');
});

test('applyOpponentTurn: defenseStat from engine state reduces incoming damage', () => {
  engine.init();
  engine.awardXP(100); // level up — defenseStat becomes > 0
  const defenseStat = engine.getState().defenseStat;
  // minimal_pair: damage 18
  const bs  = makeBattleState({ professorMoves: ['minimal_pair'] });
  const ctx = makeCtx(bs);

  applyOpponentTurn(ctx);

  const expectedHP = 100 - Math.max(0, 18 - defenseStat);
  assert.equal(engine.getState().playerHP, expectedHP, 'defenseStat should reduce incoming damage');
});

test('applyOpponentTurn: defenseStat of 0 does not alter incoming damage', () => {
  engine.init(); // defenseStat = 0
  // minimal_pair: damage 18
  const bs  = makeBattleState({ professorMoves: ['minimal_pair'] });
  const ctx = makeCtx(bs);

  applyOpponentTurn(ctx);

  assert.equal(engine.getState().playerHP, 82, 'zero defenseStat should leave damage unchanged');
});

// ─── _awardBattleXP ──────────────────────────────────────────────────────────

test('_awardBattleXP: awards positive XP for a professor victory', () => {
  engine.init();
  const scene = makeScene('prof_schwaartz', 'professor');
  scene._awardBattleXP();
  assert.ok(engine.getState().xp > 0, 'professor victory should award XP');
});

test('_awardBattleXP: awards positive XP for a student victory', () => {
  engine.init();
  const scene = makeScene('student_rohan', 'student');
  scene._awardBattleXP();
  assert.ok(engine.getState().xp > 0, 'student victory should award XP');
});

test('_awardBattleXP: professor awards more XP than student', () => {
  engine.init();
  const prof = makeScene('prof_schwaartz', 'professor');
  prof._awardBattleXP();
  const profXP = engine.getState().xp;

  engine.init();
  const stud = makeScene('student_rohan', 'student');
  stud._awardBattleXP();
  const studXP = engine.getState().xp;

  assert.ok(profXP > studXP, 'professors should award more XP than students');
});

test('_awardBattleXP: returns { levelled, amount } object', () => {
  engine.init();
  const scene  = makeScene('prof_schwaartz', 'professor');
  const result = scene._awardBattleXP();
  assert.ok(typeof result === 'object' && result !== null, 'return value should be an object');
  assert.ok('levelled' in result, 'object should have a levelled property');
  assert.ok('amount'   in result, 'object should have an amount property');
  assert.ok(result.amount > 0, 'amount should be a positive number');
});

// ─── drawHPBars — XP bar ──────────────────────────────────────────────────────

test('drawHPBars: calls _drawPlayerXPBar with current xp and xpToNextLevel', () => {
  engine.init();
  const scene = makeScene();
  scene.battleState = makeBattleState({ professorHP: 80 });
  scene.battleState.professor = { id: 'prof_schwaartz', name: 'Prof. Schwaartz', hp: 80, moves: [] };
  // Stub the draw helpers that touch Phaser objects.
  scene._drawProfHPBar   = () => {};
  scene._drawPlayerHPBar = () => {};
  const xpBarCalls = [];
  scene._drawPlayerXPBar = (xp, xpToNextLevel) => xpBarCalls.push({ xp, xpToNextLevel });

  scene.drawHPBars();

  assert.equal(xpBarCalls.length, 1, '_drawPlayerXPBar should be called once by drawHPBars');
  const { xp, xpToNextLevel } = engine.getState();
  assert.equal(xpBarCalls[0].xp, xp, 'should pass current xp from engine state');
  assert.equal(xpBarCalls[0].xpToNextLevel, xpToNextLevel, 'should pass xpToNextLevel from engine state');
});

// ─── _drawPlayerXPBar ─────────────────────────────────────────────────────────

test('_drawPlayerXPBar: draws full bar when xp equals xpToNextLevel', () => {
  const scene = makeScene();
  const calls = [];
  const mockGraphics = {
    clear:    () => {},
    fillStyle: () => {},
    fillRect:  (x, y, w, h) => calls.push({ x, y, w, h }),
  };
  scene.playerXPBar = mockGraphics;

  scene._drawPlayerXPBar(100, 100); // xp = xpToNextLevel → ratio 1.0

  // Expect two fillRect calls: background (full width) then fill (full width).
  assert.equal(calls.length, 2, 'should call fillRect twice (background + fill)');
  assert.equal(calls[0].w, calls[1].w, 'full xp should render fill at same width as background');
});

test('_drawPlayerXPBar: draws empty fill when xp is 0', () => {
  const scene = makeScene();
  const calls = [];
  const mockGraphics = {
    clear:    () => {},
    fillStyle: () => {},
    fillRect:  (x, y, w, h) => calls.push({ x, y, w, h }),
  };
  scene.playerXPBar = mockGraphics;

  scene._drawPlayerXPBar(0, 100); // ratio 0 → fill width 0

  assert.equal(calls.length, 2, 'should call fillRect twice (background + fill)');
  assert.equal(calls[1].w, 0, 'zero xp should render fill with width 0');
});

test('_drawPlayerXPBar: renders empty bar when xpToNextLevel is 0 (guards divide-by-zero)', () => {
  const scene = makeScene();
  const calls = [];
  const mockGraphics = {
    clear:    () => {},
    fillStyle: () => {},
    fillRect:  (x, y, w, h) => calls.push({ x, y, w, h }),
  };
  scene.playerXPBar = mockGraphics;

  scene._drawPlayerXPBar(50, 0); // xpToNextLevel = 0 → ratio should be 0, not NaN/Infinity

  assert.equal(calls.length, 2, 'should still draw two rects even when xpToNextLevel is 0');
  assert.equal(calls[1].w, 0, 'fill width should be 0 when xpToNextLevel is 0');
});

test('_drawPlayerXPBar: clamps ratio to 1 if xp exceeds xpToNextLevel', () => {
  const scene = makeScene();
  const calls = [];
  const mockGraphics = {
    clear:    () => {},
    fillStyle: () => {},
    fillRect:  (x, y, w, h) => calls.push({ x, y, w, h }),
  };
  scene.playerXPBar = mockGraphics;

  scene._drawPlayerXPBar(150, 100); // xp > xpToNextLevel → should clamp to full width

  assert.equal(calls[0].w, calls[1].w, 'overflowing xp should clamp fill to full bar width');
});

// ─── _endSeq — XP animation, XP message, and level-up ───────────────────────

// Helper: creates a scene wired for _endSeq testing.
// _awardBattleXP is stubbed to return { levelled, amount } without touching Phaser or engine.
// _animatePlayerXP and _drawPlayerXPBar are stubbed to record calls without Phaser tweens.
// _showLine is stubbed to record logged messages and invoke next() synchronously.
// playerLevelText is a minimal mock supporting setText().
function makeEndSeqScene({ levelled = false, amount = 20 } = {}) {
  const scene = makeScene();
  scene.battleState = makeBattleState();
  scene._awardBattleXP = () => ({ levelled, amount });
  scene._runSequence   = () => {}; // no-op: prevents seq from being consumed
  const xpAnimCalls = [];
  const xpBarCalls  = [];
  const logLines    = [];
  const levelTexts  = [];
  scene._animatePlayerXP  = (from, to, max, next) => { xpAnimCalls.push({ from, to, max }); next(); };
  scene._drawPlayerXPBar  = (xp, max)             => xpBarCalls.push({ xp, max });
  scene._showLine         = (msg, next)            => { logLines.push(msg); next(); };
  scene.playerLevelText   = { setText: t => levelTexts.push(t) };
  scene._xpAnimCalls  = xpAnimCalls;
  scene._xpBarCalls   = xpBarCalls;
  scene._logLines     = logLines;
  scene._levelTexts   = levelTexts;
  return scene;
}

test('_endSeq: win (no level-up) pushes exactly 2 steps — animation then XP message', () => {
  engine.init();
  const scene = makeEndSeqScene({ levelled: false, amount: 20 });
  const seq   = [];

  scene._endSeq(seq, 'win');

  assert.equal(seq.length, 2, 'win with no level-up should push 2 steps');
  seq.forEach(step => step(() => {}));
  assert.equal(scene._xpAnimCalls.length, 1, '_animatePlayerXP should be called once');
});

test('_endSeq: win (no level-up) shows "You earned N XP!" after animation', () => {
  engine.init();
  const scene = makeEndSeqScene({ levelled: false, amount: 20 });
  const seq   = [];

  scene._endSeq(seq, 'win');
  seq.forEach(step => step(() => {}));

  assert.equal(scene._logLines.length, 1, 'exactly one log message should appear');
  assert.ok(scene._logLines[0].includes('20'), 'message should state the XP amount');
  assert.ok(scene._logLines[0].toLowerCase().includes('xp'), 'message should mention XP');
});

test('_endSeq: win (no level-up) animates from xpBefore to xpAfter using xpMaxBefore', () => {
  engine.init();
  engine.awardXP(30); // prime engine: xp = 30 before the battle
  const { xp: xpBefore, xpToNextLevel: xpMax } = engine.getState();
  const scene = makeEndSeqScene({ levelled: false, amount: 20 });
  scene._awardBattleXP = () => {
    engine.awardXP(20); // 30 + 20 = 50 — well below 100, no level-up
    return { levelled: false, amount: 20 };
  };
  const seq = [];

  scene._endSeq(seq, 'win');
  seq.forEach(step => step(() => {}));

  const call = scene._xpAnimCalls[0];
  assert.equal(call.from, xpBefore, 'animation should start from xp before the award');
  assert.equal(call.to,   50,       'animation should end at xp after the award (50)');
  assert.equal(call.max,  xpMax,    'denominator should be xpToNextLevel before the award');
});

test('_endSeq: loss pushes no steps and does not call _animatePlayerXP', () => {
  engine.init();
  const scene = makeEndSeqScene({ levelled: false });
  const seq   = [];

  scene._endSeq(seq, 'loss');

  assert.equal(seq.length, 0, 'loss should push no seq steps');
  assert.equal(scene._xpAnimCalls.length, 0, '_animatePlayerXP should not be called on loss');
});

test('_endSeq: level-up pushes exactly 4 steps — fill anim, XP message, level-up message, bar reset', () => {
  engine.init();
  const scene = makeEndSeqScene({ levelled: true, amount: 50 });
  const seq = [];

  scene._endSeq(seq, 'win');

  assert.equal(seq.length, 4, 'level-up win should push exactly 4 steps');
});

test('_endSeq: level-up — XP message appears before level-up message', () => {
  engine.init();
  engine.awardXP(80); // xp = 80, xpMax = 100
  const { xp: xpBefore, xpToNextLevel: xpMax } = engine.getState();
  const scene = makeEndSeqScene({ levelled: true, amount: 50 });
  scene._awardBattleXP = () => {
    engine.awardXP(50); // 80 + 50 = 130 → level-up, remainder xp = 30
    return { levelled: true, amount: 50 };
  };
  const seq = [];

  scene._endSeq(seq, 'win');
  seq.forEach(step => step(() => {}));

  // Step 1: fill animation to xpMax
  const anim = scene._xpAnimCalls[0];
  assert.equal(anim.from, xpBefore, 'fill animation should start at xp before award');
  assert.equal(anim.to,   xpMax,    'fill animation should fill bar to xpToNextLevel');
  // Step 2: XP earned message
  assert.ok(scene._logLines[0].includes('50'), 'first log message should state XP amount (50)');
  // Step 3: level-up message
  assert.ok(scene._logLines[1].includes('Level up'), 'second log message should be the level-up line');
  // Step 4: bar reset to remainder xp (30)
  assert.equal(scene._xpBarCalls[0].xp, 30, 'bar should reset to xp remainder (30) after level-up');
});

test('_endSeq: level-up updates playerLevelText with new level', () => {
  engine.init();
  const scene = makeEndSeqScene({ levelled: true, amount: 50 });
  scene._awardBattleXP = () => {
    engine.awardXP(100); // triggers level-up → level becomes 2
    return { levelled: true, amount: 100 };
  };
  const seq = [];

  scene._endSeq(seq, 'win');
  seq.forEach(step => step(() => {}));

  assert.equal(scene._levelTexts.length, 1, 'playerLevelText.setText should be called once');
  assert.ok(scene._levelTexts[0].includes('2'), 'level text should reflect new level (2)');
});

// ─── learnedMoves award ──────────────────────────────────────────────────────

test('_endSeq: win awards all enemy moves to learnedMoves', () => {
  engine.init();
  const scene = makeEndSeqScene({ levelled: false, amount: 20 });
  scene.battleState.professor.moves = ['minimal_pair', 'stress_shift'];
  const seq = [];

  scene._endSeq(seq, 'win');

  const learned = engine.getState().learnedMoves;
  assert.ok(learned.includes('minimal_pair'), 'minimal_pair should be in learnedMoves after win');
  assert.ok(learned.includes('stress_shift'), 'stress_shift should be in learnedMoves after win');
});

test('_endSeq: loss does not award enemy moves to learnedMoves', () => {
  engine.init();
  const scene = makeEndSeqScene({ levelled: false, amount: 20 });
  scene.battleState.professor.moves = ['minimal_pair', 'stress_shift'];
  const seq = [];

  scene._endSeq(seq, 'loss');

  const learned = engine.getState().learnedMoves;
  assert.ok(!learned.includes('minimal_pair'), 'minimal_pair should not be in learnedMoves after loss');
  assert.ok(!learned.includes('stress_shift'), 'stress_shift should not be in learnedMoves after loss');
});

test('_endSeq: winning twice with the same moves does not duplicate learnedMoves entries', () => {
  engine.init();
  const scene = makeEndSeqScene({ levelled: false, amount: 20 });
  scene.battleState.professor.moves = ['minimal_pair'];

  scene._endSeq([], 'win');
  scene._endSeq([], 'win');

  const count = engine.getState().learnedMoves.filter(id => id === 'minimal_pair').length;
  assert.equal(count, 1, 'minimal_pair should appear exactly once in learnedMoves after two wins');
});

// ─── ALL_MOVE_MAP coverage (unified registry) ────────────────────────────────
// ALL_MOVE_MAP is a module-level constant and not exported. These tests verify
// the invariants it depends on: globally unique IDs across all three tables,
// so merging is unambiguous and resolution is safe.

test('move IDs are globally unique: no overlap between professorMoves and npcMoves', () => {
  const profIds = new Set(professorMoves.map(m => m.id));
  const npcIds  = npcMoves.map(m => m.id);
  const overlap = npcIds.filter(id => profIds.has(id));
  assert.equal(overlap.length, 0, `professor and NPC move IDs must not overlap; found: ${overlap.join(', ')}`);
});

test('move IDs are globally unique: no overlap between professorMoves and playerMoves', () => {
  const profIds   = new Set(professorMoves.map(m => m.id));
  const playerIds = playerMoves.map(m => m.id);
  const overlap   = playerIds.filter(id => profIds.has(id));
  assert.equal(overlap.length, 0, `professor and player move IDs must not overlap; found: ${overlap.join(', ')}`);
});

test('all playerMoves IDs exist in npcMoves (shared subset — expected)', () => {
  const npcIds    = new Set(npcMoves.map(m => m.id));
  const playerIds = playerMoves.map(m => m.id);
  const missing   = playerIds.filter(id => !npcIds.has(id));
  assert.equal(missing.length, 0, `every playerMove ID should also exist in npcMoves; missing: ${missing.join(', ')}`);
});

test('_endSeq: win awards NPC move IDs correctly', () => {
  engine.init();
  const scene = makeEndSeqScene({ levelled: false, amount: 20 });
  scene.battleState.professor.moves = ['lit_review_dump', 'burnout'];
  const seq = [];

  scene._endSeq(seq, 'win');

  const learned = engine.getState().learnedMoves;
  assert.ok(learned.includes('lit_review_dump'), 'NPC move lit_review_dump should be awarded on win');
  assert.ok(learned.includes('burnout'), 'NPC move burnout should be awarded on win');
});

// ─── _setUIMode — items mode ──────────────────────────────────────────────────

test('_setUIMode("items") shows itemTexts and itemDescText, hides action/moves/log', () => {
  engine.init();
  const scene = makeScene();
  scene.actionTexts   = [mockText(), mockText(), mockText()];
  scene.moveTexts     = [mockText(), mockText(), mockText(), mockText()];
  scene.moveDescText  = mockText();
  scene.battleLogText = mockText();
  scene.itemTexts     = [mockText(), mockText(), mockText(), mockText()];
  scene.itemDescText  = mockText();

  scene._setUIMode('items');

  assert.equal(scene.actionTexts[0]._visible,  false, 'actionTexts should be hidden in items mode');
  assert.equal(scene.moveTexts[0]._visible,     false, 'moveTexts should be hidden in items mode');
  assert.equal(scene.moveDescText._visible,     false, 'moveDescText should be hidden in items mode');
  assert.equal(scene.battleLogText._visible,    false, 'battleLogText should be hidden in items mode');
  assert.equal(scene.itemTexts[0]._visible,     true,  'itemTexts should be visible in items mode');
  assert.equal(scene.itemDescText._visible,     true,  'itemDescText should be visible in items mode');
});

// ─── _openItemMenu ────────────────────────────────────────────────────────────

test('_openItemMenu() calls _showNoItems() when inventory has no consumables', () => {
  engine.init();
  const scene = makeScene();
  let noItemsCalled = false;
  scene._showNoItems = () => { noItemsCalled = true; };

  scene._openItemMenu();

  assert.equal(noItemsCalled, true, '_showNoItems should be called when no consumables in inventory');
});

test('_openItemMenu() switches menuLevel to "items" when consumables are present', () => {
  engine.init();
  engine.addItem('triscuit');
  const scene = makeScene();
  scene.battleState = makeBattleState();
  scene.battleState.selectedItemIndex = 0;
  scene.battleState.itemScrollOffset  = 0;
  scene.actionTexts   = [mockText(), mockText(), mockText()];
  scene.moveTexts     = [mockText(), mockText(), mockText(), mockText()];
  scene.moveDescText  = mockText();
  scene.battleLogText = mockText();
  scene.itemTexts     = [mockText(), mockText(), mockText(), mockText()];
  scene.itemDescText  = mockText();
  scene.renderItemMenu = () => {};

  scene._openItemMenu();

  assert.equal(scene.battleState.menuLevel, 'items', 'menuLevel should be "items" after _openItemMenu');
});

// ─── _itemEffectMessage ───────────────────────────────────────────────────────

test('_itemEffectMessage returns "Restored N HP!" for restore_hp with a value', () => {
  engine.init();
  const scene = makeScene();
  const item = { effect: { action: 'restore_hp', value: 5 } };
  assert.equal(scene._itemEffectMessage(item), 'Restored 5 HP!');
});

test('_itemEffectMessage returns "Fully restored HP!" for restore_hp with null value', () => {
  engine.init();
  const scene = makeScene();
  const item = { effect: { action: 'restore_hp', value: null } };
  assert.equal(scene._itemEffectMessage(item), 'Fully restored HP!');
});

test('_itemEffectMessage returns "Attack boosted by N!" for boost_attack', () => {
  engine.init();
  const scene = makeScene();
  const item = { effect: { action: 'boost_attack', value: 15 } };
  assert.equal(scene._itemEffectMessage(item), 'Attack boosted by 15!');
});

test('_itemEffectMessage returns "Defense boosted by N!" for boost_defense', () => {
  engine.init();
  const scene = makeScene();
  const item = { effect: { action: 'boost_defense', value: 10 } };
  assert.equal(scene._itemEffectMessage(item), 'Defense boosted by 10!');
});

test('_itemEffectMessage returns "EXP gain boosted!" for boost_exp', () => {
  engine.init();
  const scene = makeScene();
  const item = { effect: { action: 'boost_exp', value: 15 } };
  assert.equal(scene._itemEffectMessage(item), 'EXP gain boosted!');
});
