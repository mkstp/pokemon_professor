// js/scenes/battle/resolver.js — pure battle turn logic
//
// Exports three functions that resolve each phase of a battle turn.
// No Phaser dependency — all visual feedback is pushed onto ctx.seq as callbacks.
//
// ctx shape:
//   bs           — battleState reference (mutated in place)
//   seq          — ordered visual steps array (populated by text/animP/animPl)
//   text(msg)    — pushes a text-line step onto seq
//   animP(f,t)   — pushes a professor HP animation step onto seq
//   animPl(f,t)  — pushes a player HP animation step onto seq
//   opponentType — 'professor' | 'student'
//   opponentId   — opponent identifier; used when calling engine.defeatProfessor on win

import * as engine from '../../engine.js';
import { professorMoves, npcMoves } from '../../data/moves.js';

const PROF_MOVE_MAP = Object.fromEntries(professorMoves.map(m => [m.id, m]));
const NPC_MOVE_MAP  = Object.fromEntries(npcMoves.map(m => [m.id, m]));

// ── Player effect handlers ────────────────────────────────────────────────────
// Called after base damage is applied to the opponent.
// Each handler receives an extended ctx (includes `move`) and may return 'loss'
// if the player faints from a side effect. Returning nothing means the turn continues.

const playerEffects = {
  skip({ bs, text }) {
    bs.professorSkipped = true;
    text(`${bs.professor.name} is stunned — skips their next turn.`);
  },
  skip_opponent({ bs, text }) {
    bs.professorSkipped = true;
    text(`${bs.professor.name} is stunned — skips their next turn.`);
  },
  disrupt({ bs, text }) {
    bs.professorSkipped = true;
    text(`${bs.professor.name} is thrown off — skips their next turn.`);
  },
  chance_skip_opponent({ bs, text }) {
    if (Math.random() < 0.5) {
      bs.professorSkipped = true;
      text(`${bs.professor.name} is stunned — skips their next turn.`);
    }
  },
  player_recoil({ text, animPl }) {
    const from  = engine.getState().playerHP;
    const newHP = from - 10;
    engine.setPlayerHP(newHP);
    text('You take 10 recoil damage.');
    animPl(from, Math.max(0, newHP));
    if (newHP <= 0) {
      text('You fainted from recoil!');
      return 'loss';
    }
  },
  self_damage({ text, animPl }) {
    const from  = engine.getState().playerHP;
    const newHP = from - 10;
    engine.setPlayerHP(newHP);
    text('You take 10 recoil damage.');
    animPl(from, Math.max(0, newHP));
    if (newHP <= 0) {
      text('You fainted from recoil!');
      return 'loss';
    }
  },
  heal({ text, animPl, move }) {
    const healAmt = move.healAmount ?? 10;
    const fromHP  = engine.getState().playerHP;
    engine.setPlayerHP(fromHP + healAmt);
    const healed  = engine.getState().playerHP - fromHP;
    text(`You recover ${healed} HP.`);
    animPl(fromHP, engine.getState().playerHP);
  },
  halve_next({ bs, text }) {
    bs.professorHalved = true;
    text(`${bs.professor.name}'s next move will deal half damage.`);
  },
  chance_halve_opponent({ bs, text }) {
    if (Math.random() < 0.25) {
      bs.professorHalved = true;
      text(`${bs.professor.name}'s next move will deal half damage.`);
    }
  },
  clear_debuff({ bs, text }) {
    bs.disrupted = false;
    text('Disruption effect cleared!');
  },
  mutual_damage_20({ text, animPl }) {
    const from  = engine.getState().playerHP;
    const newHP = from - 20;
    engine.setPlayerHP(newHP);
    text('You take 20 damage from the mutual exchange.');
    animPl(from, Math.max(0, newHP));
    if (newHP <= 0) {
      text('You fainted!');
      return 'loss';
    }
  },
  reveal_next({ bs, text, opponentType }) {
    const moveMap = opponentType === 'student' ? NPC_MOVE_MAP : PROF_MOVE_MAP;
    const moveIds = bs.professor.moves;
    const nextId  = moveIds[Math.floor(Math.random() * moveIds.length)];
    bs.npcRevealedMove = nextId;
    text(`Data leaked! ${bs.professor.name} will use ${moveMap[nextId].name} next turn.`);
  },
  priority({ bs, text }) {
    bs.playerPriority = true;
    text("You queue a priority message — you'll act first next turn!");
  },
  swap_effect({ bs, text }) {
    bs.pendingPlayerSwappedEffect = bs.lastPlayerEffect;
    if (bs.lastPlayerEffect) {
      text('You pivot your methodology — your previous technique will echo next turn!');
    } else {
      text('You pivot, but have no prior technique to echo.');
    }
  },
  // These effects modify damage before it's applied; no post-damage action needed.
  counter:            null,
  conditional_damage: null,
  chance_fail:        null,
  chance_bonus_10:    null,
};

// ── Opponent effect handlers ──────────────────────────────────────────────────
// Called after base damage is applied to the player.
// Each handler receives an extended ctx (includes `move`) and may return 'win' if
// the opponent faints from a side effect, or 'loss' if a chain hit kills the player.

const opponentEffects = {
  disrupt({ bs, text }) {
    bs.disrupted = true;
    text('Your next move will deal half damage!');
  },
  self_damage({ bs, text, animP, move, opponentType, opponentId }) {
    // Professor: 25% of original move damage. Student NPC: flat 10.
    const recoil   = opponentType === 'student' ? 10 : Math.floor(move.damage * 0.25);
    const fromPH   = bs.professorHP;
    bs.professorHP = Math.max(0, bs.professorHP - recoil);
    text(`${bs.professor.name} takes ${recoil} recoil damage.`);
    animP(fromPH, bs.professorHP);
    if (bs.professorHP <= 0) {
      if (opponentType === 'professor') engine.defeatProfessor(opponentId);
      text(`${bs.professor.name} faints from recoil!`);
      return 'win';
    }
  },
  skip_opponent({ bs, text }) {
    bs.playerSkipped = true;
    text("You are disrupted — you'll skip your next action!");
  },
  chance_skip_opponent({ bs, text }) {
    if (Math.random() < 0.5) {
      bs.playerSkipped = true;
      text("You are disrupted — you'll skip your next action!");
    } else {
      text('The disruption attempt failed.');
    }
  },
  // From the NPC's perspective, halve_next halves the player's next move.
  halve_next({ bs, text }) {
    bs.disrupted = true;
    text('Your next move will deal half damage!');
  },
  chance_halve_opponent({ bs, text }) {
    if (Math.random() < 0.25) {
      bs.disrupted = true;
      text('Your next move will deal half damage!');
    }
  },
  conditional_damage() {
    // Damage modification handled pre-damage in applyOpponentTurn; no post-damage state.
  },
  clear_debuff({ bs, text }) {
    bs.npcHalvedNext  = false;
    bs.npcDoubledNext = false;
    text(`${bs.professor.name} clears their debuffs.`);
  },
  heal({ bs, text, animP, move }) {
    const healAmt  = move.healAmount ?? 0;
    const oldHP    = bs.professorHP;
    bs.professorHP = Math.min(bs.professor.hp, bs.professorHP + healAmt);
    const gained   = bs.professorHP - oldHP;
    text(`${bs.professor.name} recovers ${gained} HP.`);
    animP(oldHP, bs.professorHP);
  },
  heal_and_reduce_next({ bs, text, animP, move }) {
    const healAmt  = move.healAmount ?? 0;
    const oldHP    = bs.professorHP;
    bs.professorHP = Math.min(bs.professor.hp, bs.professorHP + healAmt);
    const gained   = bs.professorHP - oldHP;
    bs.playerReducedNext10 += 10;
    text(`${bs.professor.name} recovers ${gained} HP. Your next move is weakened.`);
    animP(oldHP, bs.professorHP);
  },
  heal_and_shield({ bs, text, animP, move }) {
    const healAmt  = move.healAmount ?? 0;
    const oldHP    = bs.professorHP;
    bs.professorHP = Math.min(bs.professor.hp, bs.professorHP + healAmt);
    const gained   = bs.professorHP - oldHP;
    bs.npcIncomingHalved = true;
    text(`${bs.professor.name} recovers ${gained} HP and braces for impact.`);
    animP(oldHP, bs.professorHP);
  },
  reduce_next_10({ bs, text }) {
    bs.playerReducedNext10 += 10;
    text('Your next move is weakened.');
  },
  self_vuln_next({ bs }) {
    bs.npcVulnTurns = Math.max(bs.npcVulnTurns, 1);
  },
  self_vuln_2({ bs }) {
    bs.npcVulnTurns = Math.max(bs.npcVulnTurns, 2);
  },
  double_next({ bs, text }) {
    bs.npcDoubledNext = true;
    text(`${bs.professor.name} charges up for a powerful next move!`);
  },
  skip_self({ bs }) {
    bs.npcSkippedTurns = Math.max(bs.npcSkippedTurns, 1);
  },
  skip_self_2({ bs }) {
    bs.npcSkippedTurns = Math.max(bs.npcSkippedTurns, 2);
  },
  halve_self_next({ bs }) {
    bs.npcHalvedNext = true;
  },
  clear_buffs({ bs, text }) {
    bs.disrupted           = false;
    bs.playerReducedNext10 = 0;
    text('Your buffs are stripped away.');
  },
  nullify_last_buff({ bs, text }) {
    bs.disrupted = false;
    text('Your last buff is nullified!');
  },
  chance_boost_next_10({ bs }) {
    if (Math.random() < 0.5) bs.npcBoostNext10 = true;
  },
  boost_next_2({ bs, text }) {
    bs.npcBoostedTurns = 2;
    text(`${bs.professor.name} enters a flow state!`);
  },
  chance_fail() {
    // Roll handled pre-damage in applyOpponentTurn; no post-damage state.
  },
  chance_bonus_10() {
    // Roll handled pre-damage in applyOpponentTurn; no post-damage state.
  },
  mutual_damage_20({ bs, text, animP, opponentType, opponentId }) {
    const fromPH2  = bs.professorHP;
    bs.professorHP = Math.max(0, bs.professorHP - 20);
    text(`${bs.professor.name} also takes 20 damage!`);
    animP(fromPH2, bs.professorHP);
    if (bs.professorHP <= 0) {
      if (opponentType === 'professor') engine.defeatProfessor(opponentId);
      text(`${bs.professor.name} faints!`);
      return 'win';
    }
  },
  chain_hit_3({ bs, text, animPl, move }) {
    // First hit already applied in applyOpponentTurn. Each extra hit has 50% chance (max 2).
    let extraHits = 0;
    while (extraHits < 2 && Math.random() < 0.5) {
      const fromPH3 = engine.getState().playerHP;
      const toPH3   = fromPH3 - move.damage;
      engine.setPlayerHP(toPH3);
      bs.lastProfessorDamage += move.damage;
      animPl(fromPH3, Math.max(0, toPH3));
      extraHits++;
      if (toPH3 <= 0) {
        text(`Hit ${extraHits + 1} — you fainted!`);
        return 'loss';
      }
    }
    if (extraHits > 0) text(`Hit ${extraHits + 1} times!`);
  },
  reveal_next({ bs, text }) {
    const usedMove = bs.playerMoves[bs.selectedMoveIndex];
    bs.playerLockedMove = usedMove.id;
    text(`${bs.professor.name} reads your approach — you'll be locked into ${usedMove.name} next turn!`);
  },
  priority({ bs, text }) {
    bs.npcPriority = true;
    text(`${bs.professor.name} queues a priority message — they'll act first next turn!`);
  },
  swap_effect({ bs, text }) {
    bs.pendingSwappedEffect = bs.lastNpcEffect;
    if (bs.lastNpcEffect) {
      text(`${bs.professor.name} pivots their methodology — their previous technique will echo next turn!`);
    } else {
      text(`${bs.professor.name} pivots, but has nothing to echo.`);
    }
  },
};

// ── Exported functions ────────────────────────────────────────────────────────

// Applies any damage deferred from the previous professor turn.
// Pushes a text line and player HP animation to ctx.seq.
// Returns true if the player faints (loss condition); false otherwise.
export function applyDeferredDamage(ctx) {
  const { bs, text, animPl } = ctx;
  if (bs.deferredDamage <= 0) return false;

  const dmg  = bs.deferredDamage;
  bs.deferredDamage = 0;
  const fromHP = engine.getState().playerHP;
  const toHP   = fromHP - dmg;
  engine.setPlayerHP(toHP);
  bs.lastProfessorDamage = dmg;
  text(`The deferred effect hits! You take ${dmg} damage.`);
  animPl(fromHP, Math.max(0, toHP));

  return toHP <= 0;
}

// Applies the player's selected move: calculates damage, mutates professorHP,
// and dispatches the move's effect via playerEffects.
// Returns 'win' if the opponent is defeated, 'loss' if a side effect kills the player,
// or null if the turn continues.
export function applyPlayerMove(ctx) {
  const { bs, text, animP, opponentType, opponentId } = ctx;

  if (bs.playerSkipped) {
    bs.playerSkipped = false;
    text('You are disrupted and skip your action!');
    return null;
  }

  const lockedId = bs.playerLockedMove;
  if (lockedId) bs.playerLockedMove = null;
  const move = lockedId
    ? (bs.playerMoves.find(m => m.id === lockedId) ?? bs.playerMoves[bs.selectedMoveIndex])
    : bs.playerMoves[bs.selectedMoveIndex];
  if (lockedId) text(`You're locked in — forced to use ${move.name}!`);

  // 'counter' / 'conditional_damage': deal 40 if the opponent's last move dealt ≥ 30.
  let playerDamage = (move.effect === 'counter' || move.effect === 'conditional_damage') && bs.lastProfessorDamage >= 30
    ? 40
    : move.damage;

  playerDamage += engine.getState().damageBuff;

  if (bs.playerReducedNext10 > 0) {
    playerDamage = Math.max(0, playerDamage - bs.playerReducedNext10);
    bs.playerReducedNext10 = 0;
  }

  if (bs.disrupted) {
    playerDamage = Math.floor(playerDamage / 2);
    bs.disrupted = false;
  }

  bs.lastPlayerDamage = playerDamage;

  if (bs.npcVulnTurns > 0) {
    playerDamage += 5;
    bs.npcVulnTurns--;
  }

  if (bs.npcIncomingHalved) {
    playerDamage = Math.floor(playerDamage / 2);
    bs.npcIncomingHalved = false;
  }

  if (move.effect === 'chance_fail' && Math.random() < 0.2)   playerDamage = 0;
  if (move.effect === 'chance_bonus_10' && Math.random() < 0.3) playerDamage += 10;

  const fromProfHP = bs.professorHP;
  bs.professorHP   = Math.max(0, bs.professorHP - playerDamage);
  text(`You use ${move.name}! Deals ${playerDamage} damage.`);
  animP(fromProfHP, bs.professorHP);

  const handler = playerEffects[move.effect];
  if (handler) {
    const result = handler({ ...ctx, move });
    if (result) return result;
  }

  if (bs.pendingPlayerSwappedEffect && bs.pendingPlayerSwappedEffect !== 'swap_effect') {
    const swapHandler = playerEffects[bs.pendingPlayerSwappedEffect];
    if (swapHandler) {
      const swapResult = swapHandler({ ...ctx, move });
      if (swapResult) { bs.pendingPlayerSwappedEffect = null; return swapResult; }
    }
    bs.pendingPlayerSwappedEffect = null;
  }
  bs.lastPlayerEffect = move.effect;

  if (bs.professorHP <= 0) {
    if (opponentType === 'professor') engine.defeatProfessor(opponentId);
    text(`${bs.professor.name} is defeated!`);
    return 'win';
  }

  return null;
}

// Applies the opponent's turn: picks a random move and resolves its effect via
// opponentEffects. Works for both professors (PROF_MOVE_MAP) and student NPCs (NPC_MOVE_MAP).
// Returns 'loss' if the player faints, 'win' if the opponent faints from a side effect,
// or null if the turn continues normally.
export function applyOpponentTurn(ctx) {
  const { bs, text, animPl, opponentType } = ctx;

  if (bs.npcSkippedTurns > 0) {
    bs.npcSkippedTurns--;
    text(`${bs.professor.name} is exhausted and does nothing.`);
    return null;
  }

  if (bs.professorSkipped) {
    bs.professorSkipped = false;
    text(`${bs.professor.name} is stunned and does nothing.`);
    return null;
  }

  const moveMap   = opponentType === 'student' ? NPC_MOVE_MAP : PROF_MOVE_MAP;
  const moveIds   = bs.professor.moves;
  const oppMoveId = bs.npcRevealedMove ?? moveIds[Math.floor(Math.random() * moveIds.length)];
  bs.npcRevealedMove = null;
  const oppMove   = moveMap[oppMoveId];

  if (oppMove.effect === 'deferred') {
    bs.deferredDamage      = oppMove.damage;
    bs.lastProfessorDamage = 0;
    text(`${bs.professor.name} uses ${oppMove.name}. The effect is delayed...`);
    bs.lastNpcEffect       = oppMove.effect;
    bs.pendingSwappedEffect = null;
    return null;
  }

  let profDamage = oppMove.damage;

  if (bs.professorHalved) {
    profDamage         = Math.floor(profDamage / 2);
    bs.professorHalved = false;
    text(`${bs.professor.name}'s move is weakened!`);
  }

  if (bs.npcDoubledNext)  { profDamage *= 2;  bs.npcDoubledNext  = false; }
  if (bs.npcHalvedNext)   { profDamage  = Math.floor(profDamage / 2); bs.npcHalvedNext = false; }
  if (bs.npcBoostNext10)  { profDamage += 10; bs.npcBoostNext10  = false; }
  if (bs.npcBoostedTurns > 0) { profDamage += 20; bs.npcBoostedTurns--; }

  // mutual_damage_20: player always takes exactly 20; NPC side handled in the effect handler.
  if (oppMove.effect === 'mutual_damage_20') profDamage = 20;

  if (oppMove.effect === 'chance_fail'     && Math.random() < 0.2) profDamage = 0;
  if (oppMove.effect === 'chance_bonus_10' && Math.random() < 0.3) profDamage += 10;
  if (oppMove.effect === 'conditional_damage' && bs.lastPlayerDamage >= 30) profDamage = 40;

  profDamage = Math.max(0, profDamage - engine.getState().defenseStat);

  const fromPHP = engine.getState().playerHP;
  const toPHP   = fromPHP - profDamage;
  engine.setPlayerHP(toPHP);
  bs.lastProfessorDamage = profDamage;

  if (profDamage > 0) {
    text(`${bs.professor.name} uses ${oppMove.name}! Deals ${profDamage} damage.`);
  } else {
    text(`${bs.professor.name} uses ${oppMove.name}!`);
  }
  animPl(fromPHP, Math.max(0, toPHP));

  const handler = opponentEffects[oppMove.effect];
  if (handler) {
    const result = handler({ ...ctx, move: oppMove });
    if (result) return result;
  }

  if (bs.pendingSwappedEffect && bs.pendingSwappedEffect !== 'swap_effect') {
    const swapHandler = opponentEffects[bs.pendingSwappedEffect];
    if (swapHandler) {
      const swapResult = swapHandler({ ...ctx, move: oppMove });
      if (swapResult) { bs.pendingSwappedEffect = null; return swapResult; }
    }
    bs.pendingSwappedEffect = null;
  }
  bs.lastNpcEffect = oppMove.effect;

  if (toPHP <= 0) {
    text('You fainted!');
    return 'loss';
  }

  return null;
}
