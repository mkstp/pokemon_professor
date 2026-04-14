// data/playerMoves.js — player move definitions
'use strict';

// ─── PLAYER MOVES ─────────────────────────────────────────────────────────────
// Six moves, always available, no PP limits.
// damage: exact integer. No random variance in proof-of-concept.
//
// effect strings used here extend beyond the three defined in tdd/battle.md.
// battle.js will need to implement each when the battle module is written:
//
//   'skip'          — professor skips their next action entirely
//   'player_recoil' — player takes 10 HP recoil after dealing damage
//   'clear_debuff'  — clears any active disruption debuff on the player
//   'halve_next'    — professor's next move deals half damage
//   'counter'       — damage doubles to 40 if the professor's last move dealt ≥ 30

export const playerMoves = [
  {
    id: 'counterexample',
    name: 'Counterexample',
    damage: 22,
    description: 'Produce a data point that breaks the professor\'s framework.',
    effect: null,
  },
  {
    id: 'cite_this',
    name: 'Cite This!',
    damage: 15,
    description: 'Weaponise the literature. Low damage, but the professor loses their next action.',
    effect: 'skip',
  },
  {
    id: 'all_nighter',
    name: 'All-Nighter',
    damage: 38,
    description: 'Burns bright. Deals 10 recoil damage to the student after use.',
    effect: 'player_recoil',
  },
  {
    id: 'hot_take',
    name: 'Hot Take',
    damage: 10,
    description: 'Quick and irreverent. Always connects. Clears any disruption debuff.',
    effect: 'clear_debuff',
  },
  {
    id: 'non_sequitur',
    name: 'Non-Sequitur',
    damage: 0,
    description: 'No damage — just bafflement. The professor\'s next move deals half damage.',
    effect: 'halve_next',
  },
  {
    id: 'correction',
    name: 'Correction',
    damage: 20,
    description: '"Actually—" Doubles to 40 if the professor\'s last move dealt 30 or more damage.',
    effect: 'counter',
  },
];
