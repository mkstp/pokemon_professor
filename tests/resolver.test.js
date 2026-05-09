// tests/resolver.test.js — consolidated

import { test, assert } from './runner.js';
import { applyDeferredDamage, applyPlayerMove, applyOpponentTurn } from '../js/scenes/battle/resolver.js';
import * as engine from '../js/engine.js';
import { professorMoves, npcMoves } from '../js/data/moves.js';

// ─── Helpers ─────────────────────────────────────────────────

function makeCtx(bs, opponentType = 'professor', opponentId = 'prof_schwaartz') {
  const seq = [];
  return {
    bs,
    seq,
    text: msg => seq.push({ type: 'text', msg }),
    animP: (f, t) => seq.push({ type: 'animP', from: f, to: t }),
    animPl: (f, t) => seq.push({ type: 'animPl', from: f, to: t }),
    opponentType,
    opponentId,
  };
}

function makeEntity({ hp = 100, maxHP = 100, name = 'Test' } = {}) {
  return {
    hp, maxHP, name,
    skippedTurns: 0,
    outgoingHalved: false,
    outgoingDoubled: false,
    outgoingBonus: 0,
    boostedTurns: 0,
    boostedAmount: 0,
    vulnTurns: 0,
    vulnBonus: 5,
    incomingHalved: false,
    reducedNext: 0,
    priority: false,
    lastDamage: 0,
    lastEffect: null,
    pendingSwapped: null,
    deferredIncoming: 0,
    lockedMove: null,
    guessedMove: null,
  };
}

function makeBattleState({ professorMoves: pm = ['minimal_pair'], professorHP = 100 } = {}) {
  return {
    professor: { id: 'prof_schwaartz', name: 'Prof. Schwaartz', hp: professorHP, moves: pm },
    player: makeEntity({ name: 'You' }),
    opponent: makeEntity({ hp: professorHP, maxHP: professorHP, name: 'Prof. Schwaartz' }),
    playerMoves: [],
    selectedMoveIndex: 0,
    phase: 'resolve',
  };
}

// NEW HELPERS
function setupTest(options = {}, ctxOptions = {}) {
  engine.init();
  const bs = makeBattleState(options);
  const ctx = makeCtx(bs, ctxOptions.opponentType, ctxOptions.opponentId);
  return { bs, ctx };
}

function setSinglePlayerMove(bs, move) {
  bs.playerMoves = [move];
  bs.selectedMoveIndex = 0;
}

const getPlayerHP = () => engine.getState().playerHP;
const hasStep = (ctx, type) => ctx.seq.some(s => s.type === type);

// ─── applyDeferredDamage ─────────────────────────────────────

test('applyDeferredDamage: no-op when zero', () => {
  const { ctx } = setupTest();
  assert.equal(applyDeferredDamage(ctx), false);
  assert.equal(ctx.seq.length, 0);
});

test('applyDeferredDamage: applies damage', () => {
  const { bs, ctx } = setupTest();
  bs.player.deferredIncoming = 20;

  applyDeferredDamage(ctx);

  assert.equal(getPlayerHP(), 80);
  assert.equal(bs.player.deferredIncoming, 0);
  assert.ok(hasStep(ctx, 'text'));
  assert.ok(hasStep(ctx, 'animPl'));
});

test('applyDeferredDamage: lethal returns true', () => {
  engine.init();
  engine.setPlayerHP(10);
  const bs = makeBattleState();
  bs.player.deferredIncoming = 20;
  assert.equal(applyDeferredDamage(makeCtx(bs)), true);
});

// ─── applyPlayerMove (table-driven basics) ───────────────────

[
  {
    desc: 'normal damage',
    setup: bs => setSinglePlayerMove(bs, { damage: 22 }),
    check: bs => assert.equal(bs.opponent.hp, 78),
  },
  {
    desc: 'win condition',
    setup: bs => {
      bs.opponent.hp = 10;
      setSinglePlayerMove(bs, { damage: 22 });
    },
    result: 'win',
  },
  {
    desc: 'skipped turn',
    setup: bs => {
      bs.player.skippedTurns = 1;
      setSinglePlayerMove(bs, { damage: 22 });
    },
    check: bs => assert.equal(bs.opponent.hp, 100),
  }
].forEach(({ desc, setup, check, result }) => {
  test(`applyPlayerMove: ${desc}`, () => {
    const { bs, ctx } = setupTest();
    setup(bs);
    const res = applyPlayerMove(ctx);
    if (result) assert.equal(res, result);
    if (check) check(bs);
  });
});

// ─── Player modifiers (already good pattern) ─────────────────

[
  {
    desc: 'outgoingHalved',
    setup: bs => { bs.player.outgoingHalved = true; },
    expected: 80,
  },
  {
    desc: 'reducedNext',
    setup: bs => { bs.player.reducedNext = 10; },
    expected: 70,
  },
].forEach(({ desc, setup, expected }) => {
  test(`applyPlayerMove: ${desc}`, () => {
    const { bs, ctx } = setupTest();
    setSinglePlayerMove(bs, { damage: 40 });
    setup(bs);
    applyPlayerMove(ctx);
    assert.equal(bs.opponent.hp, expected);
  });
});

// ─── Player effects (consolidated) ───────────────────────────

[
  {
    desc: 'skip_opponent',
    move: { effect: 'skip_opponent', damage: 10 },
    check: bs => assert.equal(bs.opponent.skippedTurns, 1),
  },
  {
    desc: 'priority',
    move: { effect: 'priority', damage: 10 },
    check: bs => assert.equal(bs.player.priority, true),
  },
  {
    desc: 'halve_next',
    move: { effect: 'halve_next', damage: 0 },
    check: bs => assert.equal(bs.opponent.outgoingHalved, true),
  },
].forEach(({ desc, move, check }) => {
  test(`applyPlayerMove: effect ${desc}`, () => {
    const { bs, ctx } = setupTest();
    setSinglePlayerMove(bs, move);
    applyPlayerMove(ctx);
    check(bs);
  });
});

// ─── Explicit edge cases (kept separate) ─────────────────────

test('self_damage kills player → loss', () => {
  engine.init();
  engine.setPlayerHP(5);
  const bs = makeBattleState();
  setSinglePlayerMove(bs, { effect: 'self_damage', recoilAmount: 10 });
  assert.equal(applyPlayerMove(makeCtx(bs)), 'loss');
});

test('counter high vs low damage', () => {
  const { bs, ctx } = setupTest();
  setSinglePlayerMove(bs, { effect: 'counter', damage: 20 });

  bs.opponent.lastDamage = 35;
  applyPlayerMove(ctx);
  assert.equal(bs.opponent.hp, 60);

  bs.opponent.hp = 100;
  bs.opponent.lastDamage = 10;
  applyPlayerMove(ctx);
  assert.equal(bs.opponent.hp, 80);
});

// ─── applyOpponentTurn (condensed) ───────────────────────────

test('opponent skip', () => {
  const { bs, ctx } = setupTest();
  bs.opponent.skippedTurns = 1;
  applyOpponentTurn(ctx);
  assert.equal(bs.opponent.skippedTurns, 0);
});

test('opponent deals damage', () => {
  const { ctx } = setupTest();
  applyOpponentTurn(ctx);
  assert.equal(getPlayerHP(), 87);
});

test('opponent lethal', () => {
  engine.init();
  engine.setPlayerHP(10);
  const bs = makeBattleState({ professorMoves: ['stack_overflow'] });
  assert.equal(applyOpponentTurn(makeCtx(bs)), 'loss');
});

// ─── Opponent modifiers ──────────────────────────────────────

[
  {
    desc: 'outgoingHalved',
    setup: bs => { bs.opponent.outgoingHalved = true; },
    expected: 94,
  },
].forEach(({ desc, setup, expected }) => {
  test(`applyOpponentTurn: ${desc}`, () => {
    const { bs, ctx } = setupTest();
    setup(bs);
    applyOpponentTurn(ctx);
    assert.equal(getPlayerHP(), expected);
  });
});

// ─── Uniqueness tests (unchanged) ────────────────────────────

test('move IDs unique (prof vs npc)', () => {
  const profIds = new Set(professorMoves.map(m => m.id));
  const overlap = npcMoves.map(m => m.id).filter(id => profIds.has(id));
  assert.equal(overlap.length, 0);
});

// ─── self_vuln: player side ──────────────────────────────────────────────────

test('self_vuln: player using impostor_syndrome takes extra damage next turn', () => {
  const { bs, ctx } = setupTest({ professorMoves: ['minimal_pair'] });
  // Player uses impostor_syndrome: sets player.vulnTurns=1, vulnBonus=5
  setSinglePlayerMove(bs, { effect: 'self_vuln', damage: 8, vulnTurns: 1, vulnBonus: 5 });
  applyPlayerMove(ctx);
  assert.equal(bs.player.vulnTurns, 1);

  // Opponent attacks: minimal_pair deals 13; with vuln bonus +5 → 18 total
  applyOpponentTurn(ctx);
  assert.equal(getPlayerHP(), 82); // 100-18 = 82
  assert.equal(bs.player.vulnTurns, 0);
});

// ─── cancel_effect ───────────────────────────────────────────────────────────

// Deterministic: professor pool has one move, so guess always matches.
test('cancel_effect: correct prediction cancels opponent move (no damage)', () => {
  const { bs, ctx } = setupTest({ professorMoves: ['minimal_pair'] });
  // Player uses cancel_effect — only one move in pool so guess = minimal_pair
  setSinglePlayerMove(bs, { effect: 'cancel_effect', damage: 0 });
  applyPlayerMove(ctx);
  assert.equal(bs.player.guessedMove, 'minimal_pair');

  const hpBefore = getPlayerHP();
  applyOpponentTurn(ctx);
  assert.equal(getPlayerHP(), hpBefore); // no damage taken
  assert.equal(bs.player.guessedMove, null);
});

test('cancel_effect: wrong prediction does not cancel', () => {
  const { bs, ctx } = setupTest({ professorMoves: ['minimal_pair', 'aspiration'] });
  // Force a wrong guess by presetting guessedMove to a move not in the pool
  bs.player.guessedMove = 'nonexistent_move';

  const hpBefore = getPlayerHP();
  applyOpponentTurn(ctx);
  assert.ok(getPlayerHP() < hpBefore); // damage was taken
  assert.equal(bs.player.guessedMove, null);
});

// NPC using cancel_effect against player
test('cancel_effect (opponent): correct NPC prediction cancels player move', () => {
  const { bs, ctx } = setupTest({ professorMoves: ['minimal_pair'] });
  // Preset the opponent's guessedMove to the move the player will use
  const playerMove = { id: 'test_move', effect: 'cancel_effect', damage: 40 };
  setSinglePlayerMove(bs, playerMove);
  bs.opponent.guessedMove = 'test_move';

  applyPlayerMove(ctx);
  assert.equal(bs.opponent.hp, 100); // no damage dealt
  assert.equal(bs.opponent.guessedMove, null);
});