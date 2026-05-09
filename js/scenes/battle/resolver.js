// js/scenes/battle/resolver.js — pure battle turn logic
//
// Exports three functions that resolve each phase of a battle turn.
// No Phaser dependency — all visual feedback is pushed onto ctx.seq as callbacks.
//
// ctx shape:
//   bs           — battleState reference (mutated in place)
//   seq          — ordered visual steps array
//   text(msg)    — pushes a text-line step onto seq
//   animP(f,t)   — pushes a professor HP animation step onto seq
//   animPl(f,t)  — pushes a player HP animation step onto seq
//   opponentType — 'professor' | 'student'
//   opponentId   — opponent identifier; used when calling engine.defeatProfessor on win
//
// Symmetric entity model
// ──────────────────────
// bs.player and bs.opponent both conform to the same interface:
//   hp, maxHP, name,
//   skippedTurns, outgoingHalved, outgoingDoubled, outgoingBonus,
//   boostedTurns, boostedAmount, vulnTurns, vulnBonus,
//   incomingHalved, reducedNext, priority,
//   lastDamage, lastEffect, pendingSwapped, deferredIncoming, lockedMove, guessedMove
//
// applyPlayerMove binds self=player / target=opponent before dispatching.
// applyOpponentTurn binds self=opponent / target=player before dispatching.
// A single `effects` map handles both sides; each handler uses self/target.
// After each resolver call, engine.setPlayerHP(bs.player.hp) is called once.

import * as engine from '../../engine.js';
import { professorMoves, npcMoves } from '../../data/moves.js';

const PROF_MOVE_MAP = Object.fromEntries(professorMoves.map(m => [m.id, m]));
const NPC_MOVE_MAP  = Object.fromEntries(npcMoves.map(m => [m.id, m]));

// ── Unified effects map ───────────────────────────────────────────────────────
// Effect handlers receive an extended ctx that adds:
//   self, target      — entity references swapped by the caller
//   animSelf, animTarget — HP bar animation callbacks for self / target
//   selfFaintResult   — 'loss'|'win' returned when self faints
//   targetFaintResult — 'win'|'loss' returned when target faints mid-handler
//   actingSide        — 'player'|'opponent' (for the few effects that are asymmetric)
//   move              — the move being used

const effects = {

  // ── Stun / skip target ────────────────────────────────────────────────────
  skip_opponent({ target, text }) {
    target.skippedTurns = Math.max(target.skippedTurns, 1);
    text(`${target.name} is stunned — skips their next turn.`);
  },
  halve_next({ target, text }) {
    target.outgoingHalved = true;
    text(`${target.name}'s next move will deal half damage.`);
  },
  chance_skip_opponent({ target, text, move }) {
    if (Math.random() < (move.skipChance ?? 0.5)) {
      target.skippedTurns = Math.max(target.skippedTurns, 1);
      text(`${target.name} is stunned — skips their next turn.`);
    }
  },
  chance_halve_opponent({ target, text, move }) {
    if (Math.random() < (move.halveChance ?? 0.25)) {
      target.outgoingHalved = true;
      text(`${target.name}'s next move will deal half damage.`);
    }
  },

  // ── Self-targeting effects ────────────────────────────────────────────────
  self_damage({ self, text, animSelf, move, selfFaintResult, opponentType, opponentId }) {
    const recoil = move.recoilPercent
      ? Math.floor(move.damage * move.recoilPercent)
      : (move.recoilAmount ?? 10);
    const fromHP = self.hp;
    self.hp = Math.max(0, self.hp - recoil);
    text(`${self.name} takes ${recoil} recoil damage.`);
    animSelf(fromHP, self.hp);
    if (self.hp <= 0) {
      if (selfFaintResult === 'win' && opponentType === 'professor') engine.defeatProfessor(opponentId);
      text(`${self.name} faints from recoil!`);
      return selfFaintResult;
    }
  },
  heal({ self, text, animSelf, move }) {
    const oldHP = self.hp;
    self.hp = Math.min(self.maxHP, self.hp + (move.healAmount ?? 10));
    const gained = self.hp - oldHP;
    text(`${self.name} recovers ${gained} HP.`);
    animSelf(oldHP, self.hp);
  },
  // halves your next attack damage
  halve_self_next({ self }) {
    self.outgoingHalved = true;
  },
  //doubles your next attack damage
  double_next({ self, text }) {
    self.outgoingDoubled = true;
    text(`${self.name} charges up for a powerful next move!`);
  },
  //skips your next turn
  skip_self({ self, move }) {
    self.skippedTurns = Math.max(self.skippedTurns, move.skipTurns ?? 1);
  },
  //increases the damage dealt to you by the opponent for x turns
  self_vuln({ self, move }) {
    self.vulnTurns = Math.max(self.vulnTurns, move.vulnTurns ?? 1);
    self.vulnBonus = move.vulnBonus ?? 5;
  },
  //chance to boost your damage on next turn
  chance_boost_next({ self, move }) {
    if (Math.random() < (move.boostChance ?? 0.5)) self.outgoingBonus += (move.boostAmount ?? 10);
  },
  //chance to boost your damage over x next turns
  boost_sustained({ self, text, move }) {
    self.boostedTurns  = move.boostTurns  ?? 2;
    self.boostedAmount = move.boostAmount ?? 20;
    text(`${self.name} enters a flow state!`);
  },

  // ── Debuff / buff manipulation ────────────────────────────────────────────
  clear_debuff({ self, text }) {
    self.outgoingHalved = false;
    text('Disruption effect cleared!');
  },
  clear_buffs({ target, text }) {
    target.outgoingHalved = false;
    target.reducedNext    = 0;
    text(`${target.name}'s buffs are stripped away.`);
  },
  nullify_last_buff({ target, text }) {
    target.outgoingHalved = false;
    text(`${target.name}'s last buff is nullified!`);
  },
  reduce_next_10({ target, text, move }) {
    target.reducedNext += (move.reduceAmount ?? 10);
    text(`${target.name}'s next move is weakened.`);
  },
  //heals self and reduced next turns impact by a flat amount
  heal_and_reduce_next({ self, target, text, animSelf, move }) {
    const oldHP = self.hp;
    self.hp = Math.min(self.maxHP, self.hp + (move.healAmount ?? 0));
    const gained = self.hp - oldHP;
    target.reducedNext += (move.reduceAmount ?? 10);
    text(`${self.name} recovers ${gained} HP. ${target.name}'s next move is weakened.`);
    animSelf(oldHP, self.hp);
  },

  //heals and reduces next turns impact by half
  heal_and_shield({ self, text, animSelf, move }) {
    const oldHP = self.hp;
    self.hp = Math.min(self.maxHP, self.hp + (move.healAmount ?? 0));
    const gained = self.hp - oldHP;
    self.incomingHalved = true;
    text(`${self.name} recovers ${gained} HP and braces for impact.`);
    animSelf(oldHP, self.hp);
  },

  // ── Multi-hit ─────────────────────────────────────────────────────────────
  chain_hit({ target, text, animTarget, move, targetFaintResult }) {
    let extraHits = 0;
    const maxExtra  = (move.maxChainHits ?? 3) - 1;
    const hitChance = move.chainHitChance ?? 0.5;
    while (extraHits < maxExtra && Math.random() < hitChance) {
      const fromHP = target.hp;
      target.hp = Math.max(0, target.hp - move.damage);
      animTarget(fromHP, target.hp);
      extraHits++;
      if (target.hp <= 0) {
        text(`Hit ${extraHits + 1} — ${target.name} fainted!`);
        return targetFaintResult;
      }
    }
    if (extraHits > 0) text(`Hit ${extraHits + 1} times!`);
  },

  // ── Mutual damage ─────────────────────────────────────────────────────────
  // Both sides take damage. self pays the cost with move.mutualChance probability.
  chance_mutual_damage_30({ self, text, animSelf, move, selfFaintResult, opponentType, opponentId }) {
    if (Math.random() < (move.mutualChance ?? 0.5)) {
      const mutualDmg = move.mutualDamage ?? 30;
      const fromHP = self.hp;
      self.hp = Math.max(0, self.hp - mutualDmg);
      text(`${self.name} also takes ${mutualDmg} damage!`);
      animSelf(fromHP, self.hp);
      if (self.hp <= 0) {
        if (selfFaintResult === 'win' && opponentType === 'professor') engine.defeatProfessor(opponentId);
        text(`${self.name} faints!`);
        return selfFaintResult;
      }
    }
  },

  // ── Move prediction / lock-in ─────────────────────────────────────────────
  // Asymmetric by design: player reveals opponent's random next move;
  // opponent reads the player's currently selected move.
  reveal_next({ self, target, text, bs, actingSide, opponentType }) {
    if (actingSide === 'player') {
      const moveMap = opponentType === 'student' ? NPC_MOVE_MAP : PROF_MOVE_MAP;
      const moveIds = bs.professor.moves;
      const nextId  = moveIds[Math.floor(Math.random() * moveIds.length)];
      target.lockedMove = nextId;
      text(`Data leaked! ${target.name} will use ${moveMap[nextId].name} next turn.`);
    } else {
      const usedMove = bs.playerMoves[bs.selectedMoveIndex];
      target.lockedMove = usedMove.id;
      text(`${self.name} reads your approach — you'll be locked into ${usedMove.name} next turn!`);
    }
  },
  priority({ self, text }) {
    self.priority = true;
    text(`${self.name} queues priority — acts first next turn!`);
  },
  swap_effect({ self, text }) {
    self.pendingSwapped = self.lastEffect;
    if (self.lastEffect) {
      text(`${self.name} pivots — previous technique echoes next turn!`);
    } else {
      text(`${self.name} pivots, but has nothing to echo.`);
    }
  },

  // ── Move prediction / cancel ──────────────────────────────────────────────
  // self randomly guesses one of target's moves. If the guess matches the move
  // target actually uses on their next turn, that move is cancelled (no damage,
  // no effect). Checked at the top of applyOpponentTurn / applyPlayerMove.
  cancel_effect({ self, target, text, bs, actingSide, opponentType }) {
    if (actingSide === 'player') {
      const moveMap = opponentType === 'student' ? NPC_MOVE_MAP : PROF_MOVE_MAP;
      const moveIds = bs.professor.moves;
      const guessedId = moveIds[Math.floor(Math.random() * moveIds.length)];
      self.guessedMove = guessedId;
      const guessedName = moveMap[guessedId]?.name ?? guessedId;
      text(`${self.name} predicts: ${guessedName}!`);
    } else {
      const playerMoveList = bs.playerMoves;
      const guessedMove = playerMoveList[Math.floor(Math.random() * playerMoveList.length)];
      self.guessedMove = guessedMove.id;
      text(`${self.name} predicts your next move: ${guessedMove.name}!`);
    }
  },

  // ── Pre-damage modifiers (resolved before the main damage step) ───────────
  counter:            null,
  conditional_damage: null,
  chance_fail:        null,
  chance_bonus_10:    null,
  deferred:           null,
};

// ── Exported functions ────────────────────────────────────────────────────────

// Applies any damage deferred from the previous opponent turn.
// Returns true if the player faints; false otherwise.
export function applyDeferredDamage(ctx) {
  const { bs, text, animPl } = ctx;
  const player = bs.player;

  // Sync from engine in case an item was used between turns.
  player.hp = engine.getState().playerHP;

  if (player.deferredIncoming <= 0) return false;

  const dmg = player.deferredIncoming;
  player.deferredIncoming = 0;
  const fromHP = player.hp;
  player.hp = Math.max(0, player.hp - dmg);
  bs.opponent.lastDamage = dmg;
  text(`The deferred effect hits! You take ${dmg} damage.`);
  animPl(fromHP, player.hp);
  engine.setPlayerHP(player.hp);

  return player.hp <= 0;
}

// Applies the player's selected move.
// Returns 'win', 'loss', or null.
export function applyPlayerMove(ctx) {
  const { bs, text, animP, animPl, opponentType, opponentId } = ctx;
  const player   = bs.player;
  const opponent = bs.opponent;

  // Sync from engine in case an item was used between turns.
  player.hp = engine.getState().playerHP;

  if (player.skippedTurns > 0) {
    player.skippedTurns--;
    text('You are disrupted and skip your action!');
    return null;
  }

  const lockedId = player.lockedMove;
  if (lockedId) player.lockedMove = null;
  const move = lockedId
    ? (bs.playerMoves.find(m => m.id === lockedId) ?? bs.playerMoves[bs.selectedMoveIndex])
    : bs.playerMoves[bs.selectedMoveIndex];
  if (lockedId) text(`You're locked in — forced to use ${move.name}!`);

  if (opponent.guessedMove) {
    const guessed = opponent.guessedMove;
    opponent.guessedMove = null;
    if (guessed === move.id) {
      text(`${opponent.name} predicted correctly — your ${move.name} is cancelled!`);
      engine.setPlayerHP(player.hp);
      return null;
    }
  }

  // counter / conditional_damage: deal 40 if opponent's last move dealt ≥ 30.
  let dmg = (move.effect === 'counter' || move.effect === 'conditional_damage') && opponent.lastDamage >= 30
    ? 40
    : move.damage;

  dmg += engine.getState().damageBuff;

  if (player.reducedNext > 0)  { dmg = Math.max(0, dmg - player.reducedNext); player.reducedNext = 0; }
  if (player.outgoingHalved)   { dmg = Math.floor(dmg / 2); player.outgoingHalved = false; }
  if (player.outgoingDoubled)  { dmg *= 2; player.outgoingDoubled = false; }
  if (player.outgoingBonus > 0){ dmg += player.outgoingBonus; player.outgoingBonus = 0; }
  if (player.boostedTurns > 0) { dmg += player.boostedAmount; player.boostedTurns--; }

  player.lastDamage = dmg;

  if (opponent.vulnTurns > 0)   { dmg += opponent.vulnBonus; opponent.vulnTurns--; }
  if (opponent.incomingHalved)  { dmg = Math.floor(dmg / 2); opponent.incomingHalved = false; }
  if (move.effect === 'chance_fail'     && Math.random() < (move.failureChance ?? 0.2)) dmg = 0;
  if (move.effect === 'chance_bonus_10' && Math.random() < (move.bonusChance ?? 0.3)) dmg += (move.bonusAmount ?? 10);

  const fromOppHP = opponent.hp;
  opponent.hp = Math.max(0, opponent.hp - dmg);
  text(`You use ${move.name}! Deals ${dmg} damage.`);
  animP(fromOppHP, opponent.hp);

  const extCtx = {
    ...ctx, move,
    self: player, target: opponent,
    animSelf: animPl, animTarget: animP,
    selfFaintResult: 'loss', targetFaintResult: 'win',
    actingSide: 'player',
  };

  const handler = effects[move.effect];
  if (handler) {
    const result = handler(extCtx);
    if (result) { engine.setPlayerHP(player.hp); return result; }
  }

  if (player.pendingSwapped && player.pendingSwapped !== 'swap_effect') {
    const swapHandler = effects[player.pendingSwapped];
    if (swapHandler) {
      const swapResult = swapHandler(extCtx);
      if (swapResult) { player.pendingSwapped = null; engine.setPlayerHP(player.hp); return swapResult; }
    }
    player.pendingSwapped = null;
  }
  player.lastEffect = move.effect;

  if (opponent.hp <= 0) {
    if (opponentType === 'professor') engine.defeatProfessor(opponentId);
    text(`${opponent.name} is defeated!`);
    engine.setPlayerHP(player.hp);
    return 'win';
  }

  engine.setPlayerHP(player.hp);
  return null;
}

// Applies the opponent's turn.
// Returns 'loss', 'win', or null.
export function applyOpponentTurn(ctx) {
  const { bs, text, animP, animPl, opponentType } = ctx;
  const opponent = bs.opponent;
  const player   = bs.player;

  // Sync from engine in case an item was used between turns.
  player.hp = engine.getState().playerHP;

  if (opponent.skippedTurns > 0) {
    opponent.skippedTurns--;
    text(`${opponent.name} is unable to act this turn.`);
    return null;
  }

  const moveMap   = opponentType === 'student' ? NPC_MOVE_MAP : PROF_MOVE_MAP;
  const moveIds   = bs.professor.moves;
  const oppMoveId = opponent.lockedMove ?? moveIds[Math.floor(Math.random() * moveIds.length)];
  opponent.lockedMove = null;
  const oppMove = moveMap[oppMoveId];

  if (player.guessedMove) {
    const guessed = player.guessedMove;
    player.guessedMove = null;
    if (guessed === oppMoveId) {
      text(`Prediction correct! ${opponent.name}'s ${oppMove.name} is cancelled!`);
      engine.setPlayerHP(player.hp);
      return null;
    }
  }

  if (oppMove.effect === 'deferred') {
    player.deferredIncoming = oppMove.damage;
    opponent.lastDamage     = 0;
    text(`${opponent.name} uses ${oppMove.name}. The effect is delayed...`);
    opponent.lastEffect     = oppMove.effect;
    opponent.pendingSwapped = null;
    return null;
  }

  let dmg = oppMove.damage;

  if (opponent.outgoingHalved)  { dmg = Math.floor(dmg / 2); opponent.outgoingHalved = false; text(`${opponent.name}'s move is weakened!`); }
  if (opponent.outgoingDoubled) { dmg *= 2; opponent.outgoingDoubled = false; }
  if (opponent.outgoingBonus > 0){ dmg += opponent.outgoingBonus; opponent.outgoingBonus = 0; }
  if (opponent.boostedTurns > 0){ dmg += opponent.boostedAmount; opponent.boostedTurns--; }

  // chance_mutual_damage_30: the attack damage equals mutualDamage (both sides pay the same cost).
  if (oppMove.effect === 'chance_mutual_damage_30') dmg = oppMove.mutualDamage ?? 30;
  if (oppMove.effect === 'chance_fail'     && Math.random() < (oppMove.failureChance ?? 0.2)) dmg = 0;
  if (oppMove.effect === 'chance_bonus_10' && Math.random() < (oppMove.bonusChance ?? 0.3))   dmg += (oppMove.bonusAmount ?? 10);
  if (oppMove.effect === 'conditional_damage' && player.lastDamage >= 30) dmg = 40;

  dmg = Math.max(0, dmg - engine.getState().defenseStat);
  if (player.vulnTurns > 0) { dmg += player.vulnBonus; player.vulnTurns--; }

  const fromPlayerHP = player.hp;
  player.hp = Math.max(0, player.hp - dmg);
  opponent.lastDamage = dmg;

  if (dmg > 0) {
    text(`${opponent.name} uses ${oppMove.name}! Deals ${dmg} damage.`);
  } else {
    text(`${opponent.name} uses ${oppMove.name}!`);
  }
  animPl(fromPlayerHP, player.hp);

  const extCtx = {
    ...ctx, move: oppMove,
    self: opponent, target: player,
    animSelf: animP, animTarget: animPl,
    selfFaintResult: 'win', targetFaintResult: 'loss',
    actingSide: 'opponent',
  };

  const handler = effects[oppMove.effect];
  if (handler) {
    const result = handler(extCtx);
    if (result) { engine.setPlayerHP(player.hp); return result; }
  }

  if (opponent.pendingSwapped && opponent.pendingSwapped !== 'swap_effect') {
    const swapHandler = effects[opponent.pendingSwapped];
    if (swapHandler) {
      const swapResult = swapHandler(extCtx);
      if (swapResult) { opponent.pendingSwapped = null; engine.setPlayerHP(player.hp); return swapResult; }
    }
    opponent.pendingSwapped = null;
  }
  opponent.lastEffect = oppMove.effect;

  engine.setPlayerHP(player.hp);

  if (player.hp <= 0) {
    text('You fainted!');
    return 'loss';
  }

  return null;
}
