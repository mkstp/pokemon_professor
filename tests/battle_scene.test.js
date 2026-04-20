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

// Returns a fresh symmetric entity object with all fields at their default values.
function makeEntity({ hp = 100, maxHP = 100, name = 'Test' } = {}) {
  return {
    hp, maxHP, name,
    skippedTurns:    0,
    outgoingHalved:  false,
    outgoingDoubled: false,
    outgoingBonus:   0,
    boostedTurns:    0,
    boostedAmount:   0,
    vulnTurns:       0,
    vulnBonus:       5,
    incomingHalved:  false,
    reducedNext:     0,
    priority:        false,
    lastDamage:      0,
    lastEffect:      null,
    pendingSwapped:  null,
    deferredIncoming: 0,
    lockedMove:      null,
  };
}

// Creates a minimal battleState for testing.
// professorMoves[] is an array of valid move IDs used by the opponent.
function makeBattleState({ professorMoves = ['minimal_pair'], professorHP = 100 } = {}) {
  return {
    professor: {
      id:    'prof_schwaartz',
      name:  'Prof. Schwaartz',
      hp:    professorHP,
      moves: professorMoves,
    },
    player:   makeEntity({ hp: 100, maxHP: 100, name: 'You' }),
    opponent: makeEntity({ hp: professorHP, maxHP: professorHP, name: 'Prof. Schwaartz' }),
    playerMoves:         [],
    selectedMoveIndex:   0,
    menuLevel:           'action',
    selectedActionIndex: 0,
    selectedItemIndex:   0,
    itemScrollOffset:    0,
    phase:               'resolve',
    outcome:             null,
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
  bs.player.deferredIncoming = 20;
  const ctx = makeCtx(bs);

  const result = applyDeferredDamage(ctx);

  assert.equal(result, false, 'player survives — should return false');
  assert.equal(bs.player.deferredIncoming, 0, 'deferredIncoming should be cleared after application');
  assert.equal(bs.opponent.lastDamage, 20, 'opponent.lastDamage should record the deferred amount');
  assert.equal(engine.getState().playerHP, 80, 'engine playerHP should drop by 20');
  assert.equal(ctx.seq.length, 2, 'seq should have exactly two steps: text + animPl');
  assert.equal(ctx.seq[0].type, 'text',   'first step should be a text line');
  assert.equal(ctx.seq[1].type, 'animPl', 'second step should be a player HP animation');
});

test('applyDeferredDamage: returns true when deferred damage kills player', () => {
  engine.init();
  engine.setPlayerHP(10); // 10 HP remaining
  const bs  = makeBattleState();
  bs.player.deferredIncoming = 20; // 10 - 20 → death
  const ctx = makeCtx(bs);

  const result = applyDeferredDamage(ctx);

  assert.equal(result, true, 'should return true when player HP drops to 0');
});

// ─── _applyPlayerMove ─────────────────────────────────────────────────────────

test('applyPlayerMove: normal move deducts damage from opponent.hp and returns null', () => {
  engine.init();
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'counterexample', name: 'Counterexample', damage: 22, effect: null }];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs);

  const result = applyPlayerMove(ctx);

  assert.equal(result, null, 'professor survives — should return null');
  assert.equal(bs.opponent.hp, 78, 'opponent.hp should drop by 22');
  assert.equal(ctx.seq.length, 2, 'seq should have text + animP');
  assert.equal(ctx.seq[0].type, 'text',  'first step should be text');
  assert.equal(ctx.seq[1].type, 'animP', 'second step should be professor HP animation');
});

test('applyPlayerMove: returns win when player move drops opponent.hp to 0', () => {
  engine.init();
  const bs = makeBattleState({ professorHP: 10 });
  bs.playerMoves       = [{ id: 'counterexample', name: 'Counterexample', damage: 22, effect: null }];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs);

  const result = applyPlayerMove(ctx);

  assert.equal(result, 'win', 'should return win when professor HP ≤ 0');
  assert.equal(bs.opponent.hp, 0, 'opponent.hp should be clamped to 0');
});

test('applyPlayerMove: outgoingHalved halves damage and is cleared after use', () => {
  engine.init();
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves           = [{ id: 'counterexample', name: 'Counterexample', damage: 40, effect: null }];
  bs.selectedMoveIndex     = 0;
  bs.player.outgoingHalved = true;
  const ctx = makeCtx(bs);

  applyPlayerMove(ctx);

  assert.equal(bs.opponent.hp, 80, 'outgoingHalved should halve 40 to 20');
  assert.equal(bs.player.outgoingHalved, false, 'outgoingHalved flag should be cleared after use');
});

test('applyPlayerMove: skip effect stuns opponent', () => {
  engine.init();
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'cite_this', name: 'Cite This!', damage: 15, effect: 'skip' }];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs);

  applyPlayerMove(ctx);

  assert.equal(bs.opponent.skippedTurns, 1, 'skip effect should set opponent.skippedTurns to 1');
});

test('applyPlayerMove: halve_next effect sets opponent.outgoingHalved', () => {
  engine.init();
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'non_sequitur', name: 'Non-Sequitur', damage: 0, effect: 'halve_next' }];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs);

  applyPlayerMove(ctx);

  assert.equal(bs.opponent.outgoingHalved, true, 'halve_next should set opponent.outgoingHalved');
});

test('applyPlayerMove: self_damage reduces player HP by recoilAmount', () => {
  engine.init(); // playerHP = 100
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'all_nighter', name: 'All-Nighter', damage: 38, effect: 'self_damage', recoilAmount: 10 }];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs);

  applyPlayerMove(ctx);

  assert.equal(engine.getState().playerHP, 90, 'self_damage should deal 10 HP to player');
});

test('applyPlayerMove: counter deals 40 damage when opponent.lastDamage >= 30', () => {
  engine.init();
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves         = [{ id: 'correction', name: 'Correction', damage: 20, effect: 'counter' }];
  bs.selectedMoveIndex   = 0;
  bs.opponent.lastDamage = 35; // meets the ≥ 30 threshold
  const ctx = makeCtx(bs);

  applyPlayerMove(ctx);

  assert.equal(bs.opponent.hp, 60, 'counter should deal 40 damage when threshold is met');
});

test('applyPlayerMove: counter deals base damage when opponent.lastDamage < 30', () => {
  engine.init();
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves         = [{ id: 'correction', name: 'Correction', damage: 20, effect: 'counter' }];
  bs.selectedMoveIndex   = 0;
  bs.opponent.lastDamage = 10; // below threshold
  const ctx = makeCtx(bs);

  applyPlayerMove(ctx);

  assert.equal(bs.opponent.hp, 80, 'counter should deal base 20 damage when threshold is not met');
});

test('applyPlayerMove: clear_debuff effect clears player.outgoingHalved', () => {
  engine.init();
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves           = [{ id: 'hot_take', name: 'Hot Take', damage: 10, effect: 'clear_debuff' }];
  bs.selectedMoveIndex     = 0;
  bs.player.outgoingHalved = true; // pre-existing debuff
  const ctx = makeCtx(bs);

  applyPlayerMove(ctx);

  assert.equal(bs.player.outgoingHalved, false, 'clear_debuff should clear player.outgoingHalved');
});

test('applyPlayerMove: self_damage killing the player returns loss', () => {
  engine.init();
  engine.setPlayerHP(5); // 5 HP remaining — recoil will kill
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'all_nighter', name: 'All-Nighter', damage: 38, effect: 'self_damage', recoilAmount: 10 }];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs);

  const result = applyPlayerMove(ctx);

  assert.equal(result, 'loss', 'should return loss when self_damage kills the player');
});

// ─── _applyOpponentTurn ──────────────────────────────────────────────────────

test('applyOpponentTurn: skips and returns null when opponent.skippedTurns > 0', () => {
  engine.init();
  const bs = makeBattleState();
  bs.opponent.skippedTurns = 1;
  const ctx = makeCtx(bs);

  const result = applyOpponentTurn(ctx);

  assert.equal(result, null, 'skipped turn should return null');
  assert.equal(bs.opponent.skippedTurns, 0, 'skippedTurns should decrement to 0');
  assert.equal(ctx.seq.length, 1, 'should push exactly one text step');
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
  assert.equal(bs.opponent.lastDamage, 18, 'opponent.lastDamage should be recorded');
});

test('applyOpponentTurn: returns loss when professor move drops player HP to 0', () => {
  engine.init();
  engine.setPlayerHP(10); // low HP — stack_overflow (35 dmg) will kill
  const bs  = makeBattleState({ professorMoves: ['stack_overflow'] });
  const ctx = makeCtx(bs);

  const result = applyOpponentTurn(ctx);

  assert.equal(result, 'loss', 'should return loss when player HP drops to 0');
});

test('applyOpponentTurn: disrupt effect sets player.outgoingHalved', () => {
  engine.init();
  // stress_shift: damage 16, effect 'chance_skip_opponent' — use big_o (disrupt) instead
  const bs  = makeBattleState({ professorMoves: ['big_o'] });
  const ctx = makeCtx(bs);

  applyOpponentTurn(ctx);

  assert.equal(bs.player.outgoingHalved, true, 'disrupt effect should set player.outgoingHalved');
});

test('applyOpponentTurn: deferred move stores deferredIncoming and returns null', () => {
  engine.init();
  // scope_ambiguity: damage 20, effect 'deferred'
  const bs  = makeBattleState({ professorMoves: ['scope_ambiguity'] });
  const ctx = makeCtx(bs);

  const result = applyOpponentTurn(ctx);

  assert.equal(result, null, 'deferred move should return null');
  assert.equal(bs.player.deferredIncoming, 20, 'player.deferredIncoming should be set to the move damage');
  assert.equal(engine.getState().playerHP, 100, 'player HP should not change immediately');
});

test('applyOpponentTurn: opponent.outgoingHalved flag halves damage and is cleared', () => {
  engine.init(); // playerHP = 100
  // minimal_pair: damage 18 → halved to 9
  const bs = makeBattleState({ professorMoves: ['minimal_pair'] });
  bs.opponent.outgoingHalved = true;
  const ctx = makeCtx(bs);

  applyOpponentTurn(ctx);

  assert.equal(engine.getState().playerHP, 91, 'opponent damage should be halved (18 → 9)');
  assert.equal(bs.opponent.outgoingHalved, false, 'outgoingHalved flag should be cleared after use');
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

test('applyPlayerMove: player.skippedTurns causes player to skip and decrements counter', () => {
  engine.init();
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves          = [{ id: 'counterexample', name: 'Counterexample', damage: 22, effect: null }];
  bs.selectedMoveIndex    = 0;
  bs.player.skippedTurns  = 1;
  const ctx = makeCtx(bs);

  const result = applyPlayerMove(ctx);

  assert.equal(result, null, 'skipped player turn should return null');
  assert.equal(bs.player.skippedTurns, 0, 'skippedTurns should decrement to 0');
  assert.equal(bs.opponent.hp, 100, 'no damage should be dealt when player is skipped');
  assert.equal(ctx.seq.length, 1, 'should push exactly one text step');
});

test('applyPlayerMove: player.reducedNext reduces damage by 10 flat and clears the field', () => {
  engine.init();
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'counterexample', name: 'Counterexample', damage: 22, effect: null }];
  bs.selectedMoveIndex = 0;
  bs.player.reducedNext = 10;
  const ctx = makeCtx(bs);

  applyPlayerMove(ctx);

  assert.equal(bs.opponent.hp, 88, 'reducedNext should reduce 22 to 12');
  assert.equal(bs.player.reducedNext, 0, 'reducedNext should be cleared after use');
});

test('applyPlayerMove: opponent.vulnTurns adds vulnBonus damage and decrements counter', () => {
  engine.init();
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves          = [{ id: 'counterexample', name: 'Counterexample', damage: 22, effect: null }];
  bs.selectedMoveIndex    = 0;
  bs.opponent.vulnTurns   = 2;
  bs.opponent.vulnBonus   = 5;
  const ctx = makeCtx(bs);

  applyPlayerMove(ctx);

  assert.equal(bs.opponent.hp, 75, 'vulnTurns should add 5 damage (22 + 5 = 27)');
  assert.equal(bs.opponent.vulnTurns, 1, 'vulnTurns should decrement by 1');
});

test('applyPlayerMove: opponent.incomingHalved halves final player damage and clears flag', () => {
  engine.init();
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves             = [{ id: 'counterexample', name: 'Counterexample', damage: 22, effect: null }];
  bs.selectedMoveIndex       = 0;
  bs.opponent.incomingHalved = true;
  const ctx = makeCtx(bs);

  applyPlayerMove(ctx);

  assert.equal(bs.opponent.hp, 89, 'incomingHalved should halve 22 to 11');
  assert.equal(bs.opponent.incomingHalved, false, 'incomingHalved should be cleared after use');
});

test('applyPlayerMove: player.lastDamage is set to the actual damage dealt', () => {
  engine.init();
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'counterexample', name: 'Counterexample', damage: 30, effect: null }];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs);

  applyPlayerMove(ctx);

  assert.equal(bs.player.lastDamage, 30, 'player.lastDamage should record the damage dealt');
});

// ─── applyOpponentTurn — NPC effects ─────────────────────────────────────────

test('applyOpponentTurn: opponent.skippedTurns > 1 decrements counter without fainting', () => {
  engine.init();
  const bs = makeBattleState();
  bs.opponent.skippedTurns = 2;
  const ctx = makeCtx(bs);

  const result = applyOpponentTurn(ctx);

  assert.equal(result, null, 'skipped NPC turn should return null');
  assert.equal(bs.opponent.skippedTurns, 1, 'skippedTurns should decrement by 1');
  assert.equal(engine.getState().playerHP, 100, 'player HP should not change during NPC skip');
  assert.equal(ctx.seq.length, 1, 'should push one text step');
});

test('applyOpponentTurn: skip_opponent effect sets player.skippedTurns', () => {
  engine.init();
  const bs = makeBattleState({ professorMoves: ['access_denied'], professorHP: 80 });
  const ctx = makeCtx(bs, 'student', 'student_rohan');

  applyOpponentTurn(ctx);

  assert.equal(bs.player.skippedTurns, 1, 'skip_opponent should set player.skippedTurns to 1');
});

test('applyOpponentTurn: halve_next effect (NPC side) sets player.outgoingHalved', () => {
  engine.init();
  const bs  = makeBattleState({ professorMoves: ['non_sequitur'], professorHP: 80 });
  const ctx = makeCtx(bs, 'student', 'student_simon');

  applyOpponentTurn(ctx);

  assert.equal(bs.player.outgoingHalved, true, 'NPC halve_next should set player.outgoingHalved');
});

test('applyOpponentTurn: heal effect restores NPC HP up to maxHP', () => {
  engine.init();
  // office_hours: damage 0, effect 'heal', healAmount 15
  const bs = makeBattleState({ professorMoves: ['office_hours'], professorHP: 60 });
  bs.professor.hp      = 80; // max HP for this NPC
  bs.opponent.maxHP    = 80;
  const ctx = makeCtx(bs, 'student', 'student_mina');

  applyOpponentTurn(ctx);

  assert.equal(bs.opponent.hp, 75, 'heal should restore 15 HP (60 + 15 = 75, within max 80)');
});

test('applyOpponentTurn: skip_self (skipTurns:1) sets opponent.skippedTurns to 1', () => {
  engine.init();
  // lit_review_dump: damage 25, effect 'skip_self', skipTurns: 1
  const bs  = makeBattleState({ professorMoves: ['lit_review_dump'], professorHP: 80 });
  const ctx = makeCtx(bs, 'student', 'student_voss');

  applyOpponentTurn(ctx);

  assert.equal(bs.opponent.skippedTurns, 1, 'skip_self (skipTurns:1) should set skippedTurns to 1');
});

test('applyOpponentTurn: skip_self (skipTurns:2) sets opponent.skippedTurns to 2', () => {
  engine.init();
  // burnout: damage 40, effect 'skip_self', skipTurns: 2
  const bs  = makeBattleState({ professorMoves: ['burnout'], professorHP: 80 });
  const ctx = makeCtx(bs, 'student', 'student_simon');

  applyOpponentTurn(ctx);

  assert.equal(bs.opponent.skippedTurns, 2, 'skip_self (skipTurns:2) should set skippedTurns to 2');
});

test('applyOpponentTurn: outgoingDoubled doubles NPC damage on the following turn', () => {
  engine.init(); // playerHP = 100
  // counterexample: damage 22, effect null (in npcMoves pool)
  const bs = makeBattleState({ professorMoves: ['counterexample'], professorHP: 80 });
  bs.opponent.outgoingDoubled = true;
  const ctx = makeCtx(bs, 'student', 'student_elena');

  applyOpponentTurn(ctx);

  assert.equal(engine.getState().playerHP, 56, 'outgoingDoubled should double 22 to 44');
  assert.equal(bs.opponent.outgoingDoubled, false, 'outgoingDoubled should be cleared after use');
});

test('applyOpponentTurn: student self_damage deals flat recoilAmount (not percent)', () => {
  engine.init();
  // all_nighter: damage 38, effect 'self_damage', recoilAmount 10
  const bs  = makeBattleState({ professorMoves: ['all_nighter'], professorHP: 80 });
  const ctx = makeCtx(bs, 'student', 'student_simon');

  applyOpponentTurn(ctx);

  assert.equal(bs.opponent.hp, 70, 'student self_damage should deal flat 10 recoil (80 - 10 = 70)');
});

test('applyOpponentTurn: chance_mutual_damage_30 uses mutualDamage as attack damage', () => {
  engine.init(); // playerHP = 100
  // meaning_crisis: damage 30, mutualDamage 30, mutualChance 0.5
  const bs  = makeBattleState({ professorMoves: ['meaning_crisis'], professorHP: 80 });
  const ctx = makeCtx(bs, 'student', 'student_marcellus');

  applyOpponentTurn(ctx);

  // Player always takes mutualDamage (30) as the attack cost; NPC recoil is stochastic
  assert.equal(engine.getState().playerHP, 70, 'player should take mutualDamage (30) as attack');
});

test('applyOpponentTurn: conditional_damage deals 40 when player.lastDamage >= 30', () => {
  engine.init();
  // correction: damage 20, effect 'conditional_damage'
  const bs = makeBattleState({ professorMoves: ['correction'], professorHP: 80 });
  bs.player.lastDamage = 35;
  const ctx = makeCtx(bs, 'student', 'student_voss');

  applyOpponentTurn(ctx);

  assert.equal(engine.getState().playerHP, 60, 'conditional_damage should deal 40 when player.lastDamage >= 30');
});

test('applyOpponentTurn: conditional_damage deals base damage when player.lastDamage < 30', () => {
  engine.init();
  // correction: damage 20, effect 'conditional_damage'
  const bs = makeBattleState({ professorMoves: ['correction'], professorHP: 80 });
  bs.player.lastDamage = 15;
  const ctx = makeCtx(bs, 'student', 'student_voss');

  applyOpponentTurn(ctx);

  assert.equal(engine.getState().playerHP, 80, 'conditional_damage should deal base 20 when threshold not met');
});

test('applyOpponentTurn: clear_buffs clears player.outgoingHalved and player.reducedNext', () => {
  engine.init();
  // undergrad_flashback: damage 14, effect 'clear_buffs'
  const bs = makeBattleState({ professorMoves: ['undergrad_flashback'], professorHP: 80 });
  bs.player.outgoingHalved = true;
  bs.player.reducedNext    = 10;
  const ctx = makeCtx(bs, 'student', 'student_lab_sentinel_k');

  applyOpponentTurn(ctx);

  assert.equal(bs.player.outgoingHalved, false, 'clear_buffs should clear player.outgoingHalved');
  assert.equal(bs.player.reducedNext, 0, 'clear_buffs should clear player.reducedNext');
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

  assert.equal(bs.opponent.hp, 100 - (22 + damageBuff), 'damageBuff should be added to move damage');
});

test('applyPlayerMove: damageBuff of 0 does not alter base damage', () => {
  engine.init(); // damageBuff starts at 0
  const bs = makeBattleState({ professorHP: 100 });
  bs.playerMoves       = [{ id: 'counterexample', name: 'Counterexample', damage: 22, effect: null }];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs);

  applyPlayerMove(ctx);

  assert.equal(bs.opponent.hp, 78, 'zero damageBuff should leave damage unchanged at 22');
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

// ─── reveal_next / priority / swap_effect (bidirectional) ────────────────────

test('applyPlayerMove: reveal_next pre-rolls opponent.lockedMove and shows text', () => {
  engine.init();
  const bs = makeBattleState({ professorMoves: ['minimal_pair'] });
  bs.playerMoves = [{ id: 'dataset_leak', name: 'Dataset Leak', damage: 16, effect: 'reveal_next' }];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs, 'professor');

  applyPlayerMove(ctx);

  assert.equal(bs.opponent.lockedMove, 'minimal_pair', 'should store the pre-rolled NPC move id');
  assert.ok(ctx.seq.some(s => s.type === 'text' && s.msg.includes('Data leaked')), 'should show data leaked text');
});

test('applyPlayerMove: priority sets player.priority flag', () => {
  engine.init();
  const bs = makeBattleState();
  bs.playerMoves = [{ id: 'slack_message', name: 'Slack Message', damage: 10, effect: 'priority' }];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs);

  applyPlayerMove(ctx);

  assert.equal(bs.player.priority, true, 'should set player.priority');
});

test('applyPlayerMove: swap_effect stores player.lastEffect as player.pendingSwapped', () => {
  engine.init();
  const bs = makeBattleState();
  bs.player.lastEffect = 'skip';
  bs.playerMoves = [{ id: 'methodology_pivot', name: 'Methodology Pivot', damage: 14, effect: 'swap_effect' }];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs);

  applyPlayerMove(ctx);

  assert.equal(bs.player.pendingSwapped, 'skip', 'should store previous lastEffect in pendingSwapped');
});

test('applyPlayerMove: player.lockedMove forces specific move regardless of selectedMoveIndex', () => {
  engine.init();
  const bs = makeBattleState();
  bs.playerMoves = [
    { id: 'peer_review',  name: 'Peer Review',  damage: 20, effect: null },
    { id: 'office_hours', name: 'Office Hours', damage: 15, effect: null },
  ];
  bs.selectedMoveIndex  = 0; // would normally use peer_review
  bs.player.lockedMove  = 'office_hours';
  const ctx = makeCtx(bs);

  applyPlayerMove(ctx);

  assert.equal(bs.player.lockedMove, null, 'player.lockedMove should be cleared');
  assert.ok(ctx.seq.some(s => s.type === 'text' && s.msg.includes('Office Hours')), 'should use the locked move');
  assert.ok(ctx.seq.some(s => s.type === 'text' && s.msg.includes("locked in")), 'should show locked-in message');
});

test('applyPlayerMove: player.pendingSwapped fires after normal effect then clears', () => {
  engine.init();
  const bs = makeBattleState();
  bs.player.pendingSwapped = 'skip'; // skip = stun opponent
  bs.playerMoves = [{ id: 'peer_review', name: 'Peer Review', damage: 20, effect: null }];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs);

  applyPlayerMove(ctx);

  assert.equal(bs.opponent.skippedTurns, 1, 'pendingSwapped (skip) should have fired');
  assert.equal(bs.player.pendingSwapped, null, 'pendingSwapped should be cleared');
});

test('applyOpponentTurn: reveal_next stores player.lockedMove from selected player move', () => {
  engine.init();
  const bs = makeBattleState({ professorMoves: ['dataset_leak'] });
  bs.playerMoves = [{ id: 'peer_review', name: 'Peer Review', damage: 20, effect: null }];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs, 'student');

  applyOpponentTurn(ctx);

  assert.equal(bs.player.lockedMove, 'peer_review', 'should lock the player into their selected move');
  assert.ok(ctx.seq.some(s => s.type === 'text' && s.msg.includes('locked into')), 'should show lock message');
});

test('applyOpponentTurn: priority sets opponent.priority flag', () => {
  engine.init();
  const bs = makeBattleState({ professorMoves: ['slack_message'] });
  bs.playerMoves = [];
  const ctx = makeCtx(bs, 'student');

  applyOpponentTurn(ctx);

  assert.equal(bs.opponent.priority, true, 'should set opponent.priority');
});

test('applyOpponentTurn: swap_effect stores opponent.lastEffect as opponent.pendingSwapped', () => {
  engine.init();
  const bs = makeBattleState({ professorMoves: ['methodology_pivot'] });
  bs.opponent.lastEffect = 'disrupt';
  bs.playerMoves = [];
  const ctx = makeCtx(bs, 'student');

  applyOpponentTurn(ctx);

  assert.equal(bs.opponent.pendingSwapped, 'disrupt', 'should store previous lastEffect in pendingSwapped');
});

test('applyOpponentTurn: opponent.lockedMove used instead of random, then cleared', () => {
  engine.init();
  const bs = makeBattleState({ professorMoves: ['dataset_leak', 'conference_talk', 'whiteboard_spiral'] });
  bs.opponent.lockedMove = 'conference_talk';
  bs.playerMoves = [];
  const ctx = makeCtx(bs, 'student');

  applyOpponentTurn(ctx);

  assert.equal(bs.opponent.lockedMove, null, 'opponent.lockedMove should be cleared after use');
  assert.ok(ctx.seq.some(s => s.type === 'text' && s.msg.includes('Conference Talk')), 'should use the locked move');
});

test('applyOpponentTurn: opponent.pendingSwapped fires after normal effect then clears', () => {
  engine.init();
  const bs = makeBattleState({ professorMoves: ['citation_needed'] }); // nullify_last_buff
  bs.opponent.pendingSwapped = 'disrupt'; // disrupt sets player.outgoingHalved = true
  bs.playerMoves = [];
  const ctx = makeCtx(bs, 'student');

  applyOpponentTurn(ctx);

  assert.equal(bs.player.outgoingHalved, true, 'pendingSwapped (disrupt) should have fired');
  assert.equal(bs.opponent.pendingSwapped, null, 'pendingSwapped should be cleared');
});
