// tests/battle_scene.test.js — unit tests for BattleScene refactored sub-functions
//
// Tests: _applyDeferredDamage, _applyPlayerMove, _applyProfessorTurn, _setUIMode.
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
function makeScene(professorId = 'prof_schwaartz') {
  const scene = Object.create(BattleScene.prototype);
  scene.professorId = professorId;
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
// professorMoves[] is an array of valid professorMove IDs from data.js;
// it is set as bs.professor.moves so _applyProfessorTurn can look them up.
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

// ─── _applyProfessorTurn ──────────────────────────────────────────────────────

test('_applyProfessorTurn: skips and returns null when professorSkipped is true', () => {
  engine.init();
  const scene = makeScene();
  const bs    = makeBattleState();
  bs.professorSkipped = true;
  const ctx = makeCtx(bs);

  const result = scene._applyProfessorTurn(ctx);

  assert.equal(result, null, 'skipped turn should return null');
  assert.equal(bs.professorSkipped, false, 'professorSkipped flag should be cleared');
  assert.equal(ctx.seq.length, 1, 'should push exactly one text step (stunned message)');
  assert.equal(ctx.seq[0].type, 'text', 'step should be a text line');
});

test('_applyProfessorTurn: normal move deals damage and returns null', () => {
  engine.init(); // playerHP = 100
  const scene = makeScene();
  // minimal_pair: damage 18, effect null
  const bs = makeBattleState({ professorMoves: ['minimal_pair'] });
  const ctx = makeCtx(bs);

  const result = scene._applyProfessorTurn(ctx);

  assert.equal(result, null, 'normal move should return null');
  assert.equal(engine.getState().playerHP, 82, 'player HP should drop by 18 (minimal_pair damage)');
  assert.equal(bs.lastProfessorDamage, 18, 'lastProfessorDamage should be recorded');
});

test('_applyProfessorTurn: returns loss when professor move drops player HP to 0', () => {
  engine.init();
  engine.setPlayerHP(10); // low HP — stack_overflow (35 dmg) will kill
  const scene = makeScene();
  const bs = makeBattleState({ professorMoves: ['stack_overflow'] });
  const ctx = makeCtx(bs);

  const result = scene._applyProfessorTurn(ctx);

  assert.equal(result, 'loss', 'should return loss when player HP drops to 0');
});

test('_applyProfessorTurn: disrupt effect sets disrupted flag', () => {
  engine.init();
  const scene = makeScene();
  // stress_shift: damage 16, effect 'disrupt'
  const bs = makeBattleState({ professorMoves: ['stress_shift'] });
  const ctx = makeCtx(bs);

  scene._applyProfessorTurn(ctx);

  assert.equal(bs.disrupted, true, 'disrupt effect should set bs.disrupted');
});

test('_applyProfessorTurn: deferred move stores damage and returns null', () => {
  engine.init();
  const scene = makeScene();
  // scope_ambiguity: damage 20, effect 'deferred'
  const bs = makeBattleState({ professorMoves: ['scope_ambiguity'] });
  const ctx = makeCtx(bs);

  const result = scene._applyProfessorTurn(ctx);

  assert.equal(result, null, 'deferred move should return null');
  assert.equal(bs.deferredDamage, 20, 'deferredDamage should be set to the move damage');
  assert.equal(engine.getState().playerHP, 100, 'player HP should not change immediately');
});

test('_applyProfessorTurn: professorHalved flag halves professor damage and is cleared', () => {
  engine.init(); // playerHP = 100
  const scene = makeScene();
  // minimal_pair: damage 18 → halved to 9
  const bs = makeBattleState({ professorMoves: ['minimal_pair'] });
  bs.professorHalved = true;
  const ctx = makeCtx(bs);

  scene._applyProfessorTurn(ctx);

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
