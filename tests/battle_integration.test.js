// tests/battle_integration.test.js — integration tests for the battle turn loop
//
// Drives full-turn scenarios through the three resolver functions together:
// applyDeferredDamage → applyPlayerMove / applyOpponentTurn (in priority order).
// Tests use real data (moves, professors) and real engine state — no mocks.

import './phaser-stub.js';
import { test, assert } from './runner.js';
import { applyDeferredDamage, applyPlayerMove, applyOpponentTurn } from '../js/scenes/battle/resolver.js';
import * as engine from '../js/engine.js';
import { npcMoves } from '../js/data/moves.js';

// ─── Helpers (mirrors battle_scene.test.js) ───────────────────────────────────

function makeCtx(bs, opponentType = 'professor', opponentId = 'prof_schwaartz') {
  const seq = [];
  const text   = msg    => seq.push({ type: 'text', msg });
  const animP  = (f, t) => seq.push({ type: 'animP',  from: f, to: t });
  const animPl = (f, t) => seq.push({ type: 'animPl', from: f, to: t });
  return { bs, seq, text, animP, animPl, opponentType, opponentId };
}

function makeEntity({ hp = 100, maxHP = 100, name = 'Test' } = {}) {
  return {
    hp, maxHP, name,
    skippedTurns:     0,
    outgoingHalved:   false,
    outgoingDoubled:  false,
    outgoingBonus:    0,
    boostedTurns:     0,
    boostedAmount:    0,
    vulnTurns:        0,
    vulnBonus:        5,
    incomingHalved:   false,
    reducedNext:      0,
    priority:         false,
    lastDamage:       0,
    lastEffect:       null,
    pendingSwapped:   null,
    deferredIncoming: 0,
    lockedMove:       null,
  };
}

function makeBattleState({ profMoves = ['minimal_pair'], professorHP = 100 } = {}) {
  return {
    professor: {
      id:    'prof_schwaartz',
      name:  'Prof. Schwaartz',
      hp:    professorHP,
      moves: profMoves,
    },
    player:              makeEntity({ hp: 100, maxHP: 100, name: 'You' }),
    opponent:            makeEntity({ hp: professorHP, maxHP: professorHP, name: 'Prof. Schwaartz' }),
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

// hot_take: damage 10, effect 'priority' — sets priority flag; no direct HP side effects.
const hotTake = npcMoves.find(m => m.id === 'hot_take');

// ─── Tests ────────────────────────────────────────────────────────────────────

test('applyPlayerMove() returns win and marks professor defeated when opponent HP reaches 0', () => {
  engine.init();
  const bs  = makeBattleState({ professorHP: 1 });
  bs.playerMoves       = [hotTake];
  bs.selectedMoveIndex = 0;
  const ctx = makeCtx(bs);

  const deferred = applyDeferredDamage(ctx);
  assert.equal(deferred, false, 'no deferred damage');

  const result = applyPlayerMove(ctx);
  assert.equal(result, 'win', 'applyPlayerMove returns win');
  assert.equal(engine.isDefeated('prof_schwaartz'), true, 'professor marked defeated in engine');
});

test('applyOpponentTurn() returns loss when opponent kills the player', () => {
  engine.init();
  engine.setPlayerHP(10);
  const bs = makeBattleState({ profMoves: ['minimal_pair'] });
  bs.player.hp = 10;
  const ctx = makeCtx(bs);

  const result = applyOpponentTurn(ctx);
  assert.equal(result, 'loss', 'opponent kills player — returns loss');
  assert.equal(bs.player.hp, 0, 'player HP at 0');
});

test('opponent priority: opponent acts first, player takes damage before dealing it', () => {
  engine.init();
  const bs = makeBattleState({ profMoves: ['minimal_pair'], professorHP: 50 });
  bs.playerMoves       = [hotTake];
  bs.selectedMoveIndex = 0;
  bs.opponent.priority = true;
  const ctx = makeCtx(bs);

  // Replicate the npcGoesFirst detection from BattleScene.resolveTurn().
  const npcGoesFirst = bs.opponent.priority && !bs.player.priority;
  bs.opponent.priority = false;
  bs.player.priority   = false;

  assert.equal(npcGoesFirst, true, 'npcGoesFirst should be true');

  // Opponent goes first: minimal_pair deals 13 damage (defenseStat = 0 after init).
  const oppResult = applyOpponentTurn(ctx);
  assert.equal(oppResult, null, 'opponent turn does not end battle');
  assert.equal(bs.player.hp, 87, 'player HP reduced by 13 before player acts');

  // Player acts second: hot_take deals 10 damage.
  const playerResult = applyPlayerMove(ctx);
  assert.equal(playerResult, null, 'player turn does not end battle');
  assert.equal(bs.opponent.hp, 40, 'opponent HP reduced by 10 after player acts');
});

test('winning a battle then awarding 50 XP triggers level-up when near threshold', () => {
  engine.init();

  // Bring XP to 60 (threshold = 70 — 10 short of level-up).
  const preLevelUp = engine.awardXP(60);
  assert.equal(preLevelUp, false, 'no level-up yet at 60 XP');
  assert.equal(engine.getState().level, 1, 'still level 1');

  // Win the battle.
  const bs = makeBattleState({ professorHP: 1 });
  bs.playerMoves       = [hotTake];
  bs.selectedMoveIndex = 0;
  const result = applyPlayerMove(makeCtx(bs));
  assert.equal(result, 'win', 'battle won');

  // Award professor XP (50): 60 + 50 = 110 ≥ 70 → level-up.
  const levelled = engine.awardXP(50);
  assert.equal(levelled, true, 'level-up triggered');
  assert.equal(engine.getState().level, 2, 'player is now level 2');
  assert.ok(engine.getState().damageBuff > 0, 'damageBuff increased after level-up');
});
