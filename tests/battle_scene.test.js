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
import * as engine from '../js/engine.js';

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

// Creates a context object (ctx) that matches what resolveTurn() will pass to
// each sub-function. seq collects simplified descriptors instead of closures,
// making it easy to assert on which steps were added.
function makeCtx(bs) {
  const seq = [];
  const text   = msg    => seq.push({ type: 'text', msg });
  const animP  = (f, t) => seq.push({ type: 'animP',  from: f, to: t });
  const animPl = (f, t) => seq.push({ type: 'animPl', from: f, to: t });
  return { bs, seq, text, animP, animPl };
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

test('_applyDeferredDamage: returns false and adds nothing to seq when deferredDamage is 0', () => {
  engine.init();
  const scene = makeScene();
  const bs    = makeBattleState();
  const ctx   = makeCtx(bs);

  const result = scene._applyDeferredDamage(ctx);

  assert.equal(result, false, 'should return false — no damage to apply');
  assert.equal(ctx.seq.length, 0, 'seq should be empty when deferredDamage is 0');
});

test('_applyDeferredDamage: deducts damage, pushes text+animPl, returns false when player survives', () => {
  engine.init(); // playerHP = 100
  const scene = makeScene();
  const bs    = makeBattleState();
  bs.deferredDamage = 20;
  const ctx = makeCtx(bs);

  const result = scene._applyDeferredDamage(ctx);

  assert.equal(result, false, 'player survives — should return false');
  assert.equal(bs.deferredDamage, 0, 'deferredDamage should be cleared after application');
  assert.equal(bs.lastProfessorDamage, 20, 'lastProfessorDamage should record the deferred amount');
  assert.equal(engine.getState().playerHP, 80, 'engine playerHP should drop by 20');
  assert.equal(ctx.seq.length, 2, 'seq should have exactly two steps: text + animPl');
  assert.equal(ctx.seq[0].type, 'text',   'first step should be a text line');
  assert.equal(ctx.seq[1].type, 'animPl', 'second step should be a player HP animation');
});

test('_applyDeferredDamage: returns true when deferred damage kills player', () => {
  engine.init();
  engine.setPlayerHP(10); // 10 HP remaining
  const scene = makeScene();
  const bs    = makeBattleState();
  bs.deferredDamage = 20; // 10 - 20 → death
  const ctx = makeCtx(bs);

  const result = scene._applyDeferredDamage(ctx);

  assert.equal(result, true, 'should return true when player HP drops to 0');
});

// ─── _applyPlayerMove ─────────────────────────────────────────────────────────

test('_applyPlayerMove: normal move deducts damage from professorHP and returns null', () => {
  engine.init();
  const scene = makeScene();
  const bs    = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'counterexample', name: 'Counterexample', damage: 22, effect: null }];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs);

  const result = scene._applyPlayerMove(ctx);

  assert.equal(result, null, 'professor survives — should return null');
  assert.equal(bs.professorHP, 78, 'professorHP should drop by 22');
  assert.equal(ctx.seq.length, 2, 'seq should have text + animP');
  assert.equal(ctx.seq[0].type, 'text',  'first step should be text');
  assert.equal(ctx.seq[1].type, 'animP', 'second step should be professor HP animation');
});

test('_applyPlayerMove: returns win when player move drops professorHP to 0', () => {
  engine.init();
  const scene = makeScene();
  const bs    = makeBattleState({ professorHP: 10 });
  bs.playerMoves       = [{ id: 'counterexample', name: 'Counterexample', damage: 22, effect: null }];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs);

  const result = scene._applyPlayerMove(ctx);

  assert.equal(result, 'win', 'should return win when professor HP ≤ 0');
  assert.equal(bs.professorHP, 0, 'professorHP should be clamped to 0');
});

test('_applyPlayerMove: disrupted flag halves damage and is cleared after use', () => {
  engine.init();
  const scene = makeScene();
  const bs    = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'counterexample', name: 'Counterexample', damage: 40, effect: null }];
  bs.selectedMoveIndex = 0;
  bs.disrupted         = true;
  const ctx = makeCtx(bs);

  scene._applyPlayerMove(ctx);

  assert.equal(bs.professorHP, 80, 'disrupted should halve 40 to 20');
  assert.equal(bs.disrupted, false, 'disrupted flag should be cleared after use');
});

test('_applyPlayerMove: skip effect sets professorSkipped', () => {
  engine.init();
  const scene = makeScene();
  const bs    = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'cite_this', name: 'Cite This!', damage: 15, effect: 'skip' }];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs);

  scene._applyPlayerMove(ctx);

  assert.equal(bs.professorSkipped, true, 'skip effect should set professorSkipped');
});

test('_applyPlayerMove: halve_next effect sets professorHalved', () => {
  engine.init();
  const scene = makeScene();
  const bs    = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'non_sequitur', name: 'Non-Sequitur', damage: 0, effect: 'halve_next' }];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs);

  scene._applyPlayerMove(ctx);

  assert.equal(bs.professorHalved, true, 'halve_next should set professorHalved');
});

test('_applyPlayerMove: player_recoil reduces player HP by 10', () => {
  engine.init(); // playerHP = 100
  const scene = makeScene();
  const bs    = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'all_nighter', name: 'All-Nighter', damage: 38, effect: 'player_recoil' }];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs);

  scene._applyPlayerMove(ctx);

  assert.equal(engine.getState().playerHP, 90, 'player_recoil should deal 10 HP to player');
});

test('_applyPlayerMove: counter deals 40 damage when lastProfessorDamage >= 30', () => {
  engine.init();
  const scene = makeScene();
  const bs    = makeBattleState({ professorHP: 100 });
  bs.playerMoves          = [{ id: 'correction', name: 'Correction', damage: 20, effect: 'counter' }];
  bs.selectedMoveIndex    = 0;
  bs.lastProfessorDamage  = 35; // meets the ≥ 30 threshold
  const ctx = makeCtx(bs);

  scene._applyPlayerMove(ctx);

  assert.equal(bs.professorHP, 60, 'counter should deal 40 damage when threshold is met');
});

test('_applyPlayerMove: counter deals base damage when lastProfessorDamage < 30', () => {
  engine.init();
  const scene = makeScene();
  const bs    = makeBattleState({ professorHP: 100 });
  bs.playerMoves          = [{ id: 'correction', name: 'Correction', damage: 20, effect: 'counter' }];
  bs.selectedMoveIndex    = 0;
  bs.lastProfessorDamage  = 10; // below threshold
  const ctx = makeCtx(bs);

  scene._applyPlayerMove(ctx);

  assert.equal(bs.professorHP, 80, 'counter should deal base 20 damage when threshold is not met');
});

test('_applyPlayerMove: clear_debuff effect clears disrupted flag', () => {
  engine.init();
  const scene = makeScene();
  const bs    = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'hot_take', name: 'Hot Take', damage: 10, effect: 'clear_debuff' }];
  bs.selectedMoveIndex = 0;
  bs.disrupted         = true; // pre-existing debuff
  const ctx = makeCtx(bs);

  scene._applyPlayerMove(ctx);

  assert.equal(bs.disrupted, false, 'clear_debuff should clear the disrupted flag');
});

test('_applyPlayerMove: player_recoil killing the player returns loss', () => {
  engine.init();
  engine.setPlayerHP(5); // 5 HP remaining — recoil will kill
  const scene = makeScene();
  const bs    = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'all_nighter', name: 'All-Nighter', damage: 38, effect: 'player_recoil' }];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs);

  const result = scene._applyPlayerMove(ctx);

  assert.equal(result, 'loss', 'should return loss when player_recoil kills the player');
});

// ─── _applyOpponentTurn ──────────────────────────────────────────────────────

test('_applyOpponentTurn: skips and returns null when professorSkipped is true', () => {
  engine.init();
  const scene = makeScene();
  const bs    = makeBattleState();
  bs.professorSkipped = true;
  const ctx = makeCtx(bs);

  const result = scene._applyOpponentTurn(ctx);

  assert.equal(result, null, 'skipped turn should return null');
  assert.equal(bs.professorSkipped, false, 'professorSkipped flag should be cleared');
  assert.equal(ctx.seq.length, 1, 'should push exactly one text step (stunned message)');
  assert.equal(ctx.seq[0].type, 'text', 'step should be a text line');
});

test('_applyOpponentTurn: normal move deals damage and returns null', () => {
  engine.init(); // playerHP = 100
  const scene = makeScene();
  // minimal_pair: damage 18, effect null
  const bs = makeBattleState({ professorMoves: ['minimal_pair'] });
  const ctx = makeCtx(bs);

  const result = scene._applyOpponentTurn(ctx);

  assert.equal(result, null, 'normal move should return null');
  assert.equal(engine.getState().playerHP, 82, 'player HP should drop by 18 (minimal_pair damage)');
  assert.equal(bs.lastProfessorDamage, 18, 'lastProfessorDamage should be recorded');
});

test('_applyOpponentTurn: returns loss when professor move drops player HP to 0', () => {
  engine.init();
  engine.setPlayerHP(10); // low HP — stack_overflow (35 dmg) will kill
  const scene = makeScene();
  const bs = makeBattleState({ professorMoves: ['stack_overflow'] });
  const ctx = makeCtx(bs);

  const result = scene._applyOpponentTurn(ctx);

  assert.equal(result, 'loss', 'should return loss when player HP drops to 0');
});

test('_applyOpponentTurn: disrupt effect sets disrupted flag', () => {
  engine.init();
  const scene = makeScene();
  // stress_shift: damage 16, effect 'disrupt'
  const bs = makeBattleState({ professorMoves: ['stress_shift'] });
  const ctx = makeCtx(bs);

  scene._applyOpponentTurn(ctx);

  assert.equal(bs.disrupted, true, 'disrupt effect should set bs.disrupted');
});

test('_applyOpponentTurn: deferred move stores damage and returns null', () => {
  engine.init();
  const scene = makeScene();
  // scope_ambiguity: damage 20, effect 'deferred'
  const bs = makeBattleState({ professorMoves: ['scope_ambiguity'] });
  const ctx = makeCtx(bs);

  const result = scene._applyOpponentTurn(ctx);

  assert.equal(result, null, 'deferred move should return null');
  assert.equal(bs.deferredDamage, 20, 'deferredDamage should be set to the move damage');
  assert.equal(engine.getState().playerHP, 100, 'player HP should not change immediately');
});

test('_applyOpponentTurn: professorHalved flag halves professor damage and is cleared', () => {
  engine.init(); // playerHP = 100
  const scene = makeScene();
  // minimal_pair: damage 18 → halved to 9
  const bs = makeBattleState({ professorMoves: ['minimal_pair'] });
  bs.professorHalved = true;
  const ctx = makeCtx(bs);

  scene._applyOpponentTurn(ctx);

  assert.equal(engine.getState().playerHP, 91, 'professor damage should be halved (18 → 9)');
  assert.equal(bs.professorHalved, false, 'professorHalved flag should be cleared after use');
});

// ─── _setUIMode ───────────────────────────────────────────────────────────────

test('_setUIMode: action mode shows actionTexts, hides moveTexts, moveDescText, battleLogText', () => {
  const scene = makeScene();
  scene.actionTexts  = [mockText(), mockText(), mockText()];
  scene.moveTexts    = [mockText(), mockText(), mockText(), mockText()];
  scene.moveDescText = mockText();
  scene.battleLogText = mockText();

  scene._setUIMode('action');

  assert.ok(scene.actionTexts.every(t => t._visible),    'actionTexts should be visible');
  assert.ok(scene.moveTexts.every(t => !t._visible),     'moveTexts should be hidden');
  assert.ok(!scene.moveDescText._visible,                 'moveDescText should be hidden');
  assert.ok(!scene.battleLogText._visible,                'battleLogText should be hidden');
});

test('_setUIMode: moves mode shows moveTexts and moveDescText, hides actionTexts and battleLogText', () => {
  const scene = makeScene();
  scene.actionTexts   = [mockText(), mockText(), mockText()];
  scene.moveTexts     = [mockText(), mockText(), mockText(), mockText()];
  scene.moveDescText  = mockText();
  scene.battleLogText = mockText();

  scene._setUIMode('moves');

  assert.ok(scene.moveTexts.every(t => t._visible),     'moveTexts should be visible');
  assert.ok(scene.moveDescText._visible,                 'moveDescText should be visible');
  assert.ok(scene.actionTexts.every(t => !t._visible),  'actionTexts should be hidden');
  assert.ok(!scene.battleLogText._visible,               'battleLogText should be hidden');
});

test('_setUIMode: log mode shows battleLogText, hides actionTexts, moveTexts, moveDescText', () => {
  const scene = makeScene();
  scene.actionTexts   = [mockText(), mockText(), mockText()];
  scene.moveTexts     = [mockText(), mockText(), mockText(), mockText()];
  scene.moveDescText  = mockText();
  scene.battleLogText = mockText();

  scene._setUIMode('log');

  assert.ok(scene.battleLogText._visible,                'battleLogText should be visible');
  assert.ok(scene.actionTexts.every(t => !t._visible),  'actionTexts should be hidden');
  assert.ok(scene.moveTexts.every(t => !t._visible),    'moveTexts should be hidden');
  assert.ok(!scene.moveDescText._visible,                'moveDescText should be hidden');
});

// ─── _applyPlayerMove — new effects ──────────────────────────────────────────

test('_applyPlayerMove: playerSkipped causes player to skip and clears the flag', () => {
  engine.init();
  const scene = makeScene();
  const bs    = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'counterexample', name: 'Counterexample', damage: 22, effect: null }];
  bs.selectedMoveIndex = 0;
  bs.playerSkipped     = true;
  const ctx = makeCtx(bs);

  const result = scene._applyPlayerMove(ctx);

  assert.equal(result, null, 'skipped player turn should return null');
  assert.equal(bs.playerSkipped, false, 'playerSkipped should be cleared after use');
  assert.equal(bs.professorHP, 100, 'no damage should be dealt when player is skipped');
  assert.equal(ctx.seq.length, 1, 'should push exactly one text step');
});

test('_applyPlayerMove: playerReducedNext10 reduces damage by 10 flat and clears the field', () => {
  engine.init();
  const scene = makeScene();
  const bs    = makeBattleState({ professorHP: 100 });
  bs.playerMoves          = [{ id: 'counterexample', name: 'Counterexample', damage: 22, effect: null }];
  bs.selectedMoveIndex    = 0;
  bs.playerReducedNext10  = 10;
  const ctx = makeCtx(bs);

  scene._applyPlayerMove(ctx);

  assert.equal(bs.professorHP, 88, 'playerReducedNext10 should reduce 22 to 12');
  assert.equal(bs.playerReducedNext10, 0, 'playerReducedNext10 should be cleared after use');
});

test('_applyPlayerMove: npcVulnTurns adds 5 damage to NPC and decrements counter', () => {
  engine.init();
  const scene = makeScene();
  const bs    = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'counterexample', name: 'Counterexample', damage: 22, effect: null }];
  bs.selectedMoveIndex = 0;
  bs.npcVulnTurns      = 2;
  const ctx = makeCtx(bs);

  scene._applyPlayerMove(ctx);

  assert.equal(bs.professorHP, 75, 'npcVulnTurns should add 5 damage (22 + 5 = 27)');
  assert.equal(bs.npcVulnTurns, 1, 'npcVulnTurns should decrement by 1');
});

test('_applyPlayerMove: npcIncomingHalved halves final player damage and clears flag', () => {
  engine.init();
  const scene = makeScene();
  const bs    = makeBattleState({ professorHP: 100 });
  bs.playerMoves        = [{ id: 'counterexample', name: 'Counterexample', damage: 22, effect: null }];
  bs.selectedMoveIndex  = 0;
  bs.npcIncomingHalved  = true;
  const ctx = makeCtx(bs);

  scene._applyPlayerMove(ctx);

  assert.equal(bs.professorHP, 89, 'npcIncomingHalved should halve 22 to 11');
  assert.equal(bs.npcIncomingHalved, false, 'npcIncomingHalved should be cleared after use');
});

test('_applyPlayerMove: lastPlayerDamage is set to the actual damage dealt', () => {
  engine.init();
  const scene = makeScene();
  const bs    = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'counterexample', name: 'Counterexample', damage: 30, effect: null }];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs);

  scene._applyPlayerMove(ctx);

  assert.equal(bs.lastPlayerDamage, 30, 'lastPlayerDamage should record the damage dealt');
});

// ─── _applyOpponentTurn — new NPC effects ─────────────────────────────────────

test('_applyOpponentTurn: npcSkippedTurns > 0 causes NPC to skip and decrements counter', () => {
  engine.init();
  const scene = makeScene();
  const bs    = makeBattleState();
  bs.npcSkippedTurns = 2;
  const ctx = makeCtx(bs);

  const result = scene._applyOpponentTurn(ctx);

  assert.equal(result, null, 'skipped NPC turn should return null');
  assert.equal(bs.npcSkippedTurns, 1, 'npcSkippedTurns should decrement by 1');
  assert.equal(engine.getState().playerHP, 100, 'player HP should not change during NPC skip');
  assert.equal(ctx.seq.length, 1, 'should push one text step');
});

test('_applyOpponentTurn: skip_opponent effect sets playerSkipped', () => {
  engine.init();
  const scene = makeScene('student_rohan', 'student');
  const bs    = makeBattleState({ professorMoves: ['room_booking_rant'], professorHP: 80 });
  // room_booking_rant: damage 18, effect 'chance_skip_opponent' — test skip_opponent directly
  // Use access_denied: damage 0, effect 'skip_opponent'
  bs.professor.moves = ['access_denied'];
  const ctx = makeCtx(bs);

  scene._applyOpponentTurn(ctx);

  assert.equal(bs.playerSkipped, true, 'skip_opponent should set playerSkipped');
});

test('_applyOpponentTurn: halve_next effect (NPC side) sets disrupted', () => {
  engine.init();
  const scene = makeScene('student_simon', 'student');
  const bs    = makeBattleState({ professorMoves: ['non_sequitur'], professorHP: 80 });
  const ctx = makeCtx(bs);

  scene._applyOpponentTurn(ctx);

  assert.equal(bs.disrupted, true, 'NPC halve_next should set bs.disrupted');
});

test('_applyOpponentTurn: heal effect restores NPC HP up to max', () => {
  engine.init();
  const scene = makeScene('student_mina', 'student');
  // office_hours: damage 0, effect 'heal', healAmount 25
  const bs    = makeBattleState({ professorMoves: ['office_hours'], professorHP: 60 });
  bs.professor.hp = 80; // max HP for this NPC
  const ctx = makeCtx(bs);

  scene._applyOpponentTurn(ctx);

  assert.equal(bs.professorHP, 80, 'heal should cap at max HP (60 + 25 capped at 80)');
});

test('_applyOpponentTurn: skip_self sets npcSkippedTurns to 1', () => {
  engine.init();
  const scene = makeScene('student_voss', 'student');
  // lit_review_dump: damage 25, effect 'skip_self'
  const bs    = makeBattleState({ professorMoves: ['lit_review_dump'], professorHP: 80 });
  const ctx = makeCtx(bs);

  scene._applyOpponentTurn(ctx);

  assert.equal(bs.npcSkippedTurns, 1, 'skip_self should set npcSkippedTurns to 1');
});

test('_applyOpponentTurn: skip_self_2 sets npcSkippedTurns to 2', () => {
  engine.init();
  const scene = makeScene('student_simon', 'student');
  // burnout: damage 40, effect 'skip_self_2'
  const bs    = makeBattleState({ professorMoves: ['burnout'], professorHP: 80 });
  const ctx = makeCtx(bs);

  scene._applyOpponentTurn(ctx);

  assert.equal(bs.npcSkippedTurns, 2, 'skip_self_2 should set npcSkippedTurns to 2');
});

test('_applyOpponentTurn: npcDoubledNext doubles NPC damage on the following turn', () => {
  engine.init(); // playerHP = 100
  const scene = makeScene('student_elena', 'student');
  // Use a plain damage move; prime npcDoubledNext so damage is doubled.
  // counterexample: damage 22, effect null (in npcMoves pool)
  const bs    = makeBattleState({ professorMoves: ['counterexample'], professorHP: 80 });
  bs.npcDoubledNext = true;
  const ctx = makeCtx(bs);

  scene._applyOpponentTurn(ctx);

  assert.equal(engine.getState().playerHP, 56, 'npcDoubledNext should double 22 to 44');
  assert.equal(bs.npcDoubledNext, false, 'npcDoubledNext should be cleared after use');
});

test('_applyOpponentTurn: student self_damage deals flat 10 recoil (not 25%)', () => {
  engine.init();
  const scene = makeScene('student_simon', 'student');
  // all_nighter: damage 38, effect 'self_damage'
  const bs    = makeBattleState({ professorMoves: ['all_nighter'], professorHP: 80 });
  const ctx = makeCtx(bs);

  scene._applyOpponentTurn(ctx);

  assert.equal(bs.professorHP, 70, 'student self_damage should deal flat 10 recoil (80 - 10 = 70)');
});

test('_applyOpponentTurn: mutual_damage_20 deals 20 to player and 20 to NPC', () => {
  engine.init(); // playerHP = 100
  const scene = makeScene('student_marcellus', 'student');
  // meaning_crisis: damage 0, effect 'mutual_damage_20'
  const bs    = makeBattleState({ professorMoves: ['meaning_crisis'], professorHP: 80 });
  const ctx = makeCtx(bs);

  scene._applyOpponentTurn(ctx);

  assert.equal(engine.getState().playerHP, 80, 'mutual_damage_20 should deal 20 to player');
  assert.equal(bs.professorHP, 60, 'mutual_damage_20 should deal 20 to NPC');
});

test('_applyOpponentTurn: conditional_damage deals 40 when lastPlayerDamage >= 30', () => {
  engine.init();
  const scene = makeScene('student_voss', 'student');
  // correction: damage 20, effect 'conditional_damage'
  const bs    = makeBattleState({ professorMoves: ['correction'], professorHP: 80 });
  bs.lastPlayerDamage = 35;
  const ctx = makeCtx(bs);

  scene._applyOpponentTurn(ctx);

  assert.equal(engine.getState().playerHP, 60, 'conditional_damage should deal 40 when lastPlayerDamage >= 30');
});

test('_applyOpponentTurn: conditional_damage deals base damage when lastPlayerDamage < 30', () => {
  engine.init();
  const scene = makeScene('student_voss', 'student');
  // correction: damage 20, effect 'conditional_damage'
  const bs    = makeBattleState({ professorMoves: ['correction'], professorHP: 80 });
  bs.lastPlayerDamage = 15;
  const ctx = makeCtx(bs);

  scene._applyOpponentTurn(ctx);

  assert.equal(engine.getState().playerHP, 80, 'conditional_damage should deal base 20 when threshold not met');
});

test('_applyOpponentTurn: clear_buffs clears disrupted and playerReducedNext10', () => {
  engine.init();
  const scene = makeScene('student_lab_sentinel_k', 'student');
  // undergrad_flashback: damage 14, effect 'clear_buffs'
  const bs    = makeBattleState({ professorMoves: ['undergrad_flashback'], professorHP: 80 });
  bs.disrupted          = true;
  bs.playerReducedNext10 = 10;
  const ctx = makeCtx(bs);

  scene._applyOpponentTurn(ctx);

  assert.equal(bs.disrupted, false, 'clear_buffs should clear disrupted');
  assert.equal(bs.playerReducedNext10, 0, 'clear_buffs should clear playerReducedNext10');
});
