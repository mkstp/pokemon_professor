// data/professors.js — professor character definitions
'use strict';

// ─── PROFESSORS ───────────────────────────────────────────────────────────────
// Six active professors in encounter sequence order (1 = first, 6 = final boss).
// moves: array of professorMove ids — battle.js selects randomly each turn.
// battleMusic: audioTrack id to play during this professor's battle.
//   Convention: 'battle_<professorId>'.
// sprite: path to the battle sprite image (assets/sprites/battle/).
//   For professors with multi-level art, sprites[] overrides sprite: it lists three
//   paths in ascending energy order (l1 = full HP, l3 = low HP / most energised).
//   sprite is still required as a Phaser preload fallback for single-image professors.

export const professors = [
  {
    id: 'prof_schwaartz',
    name: 'Prof. Schwaartz',
    field: 'Phonetics',
    hp: 80,
    location: {
      region: 'outdoor_campus',
      tile: { x: 5, y: 3 },
    },
    moves: ['minimal_pair', 'voiced_fricative', 'stress_shift', 'aspiration'],
    dialogue: {
      preBattle: 'prof_schwaartz_pre',
      postWin:   'prof_schwaartz_win',
      postLoss:  'prof_schwaartz_loss',
    },
    reward: 'id_card',
    sprite:      'assets/sprites/battle/schwaartz_l1.png',
    sprites:     [
      'assets/sprites/battle/schwaartz_l1.png',   // > 66 % HP
      'assets/sprites/battle/schwaartz_l2.png',   // 34 – 66 % HP
      'assets/sprites/battle/schwaartz_l3.png',   // ≤ 33 % HP  (most energised)
    ],
    battleMusic: 'battle_prof_schwaartz',
  },
  {
    id: 'prof_syntaxa',
    name: 'Prof. Syntaxa',
    field: 'Syntax',
    hp: 100,
    location: {
      region: 'main_building',
      tile: { x: 5, y: 5 },
    },
    moves: ['passive_voice', 'xbar_probe', 'merge_op', 'deep_structure'],
    dialogue: {
      preBattle: 'prof_syntaxa_pre',
      postWin:   'prof_syntaxa_win',
      postLoss:  'prof_syntaxa_loss',
    },
    sprite:  'assets/sprites/battle/syntaxa_l1.png',
    sprites: [
      'assets/sprites/battle/syntaxa_l1.png',
      'assets/sprites/battle/syntaxa_l2.png',
      'assets/sprites/battle/syntaxa_l3.png',
    ],
    battleMusic: 'battle_prof_syntaxa',
  },
  {
    id: 'prof_composita',
    name: 'Prof. Composita',
    field: 'Semantics',
    hp: 130,
    location: {
      region: 'main_building',
      tile: { x: 7, y: 3 },
    },
    moves: ['presupposition_failure', 'scope_ambiguity', 'entailment', 'deixis'],
    dialogue: {
      preBattle: 'prof_composita_pre',
      postWin:   'prof_composita_win',
      postLoss:  'prof_composita_loss',
    },
    sprite:  'assets/sprites/battle/composita_l1.png',
    sprites: [
      'assets/sprites/battle/composita_l1.png',
      'assets/sprites/battle/composita_l2.png',
      'assets/sprites/battle/composita_l3.png',
    ],
    battleMusic: 'battle_prof_composita',
  },
  {
    id: 'prof_recursio',
    name: 'Prof. Recursio',
    field: 'Data Structures & Algorithms',
    hp: 170,
    location: {
      region: 'basement',
      tile: { x: 5, y: 6 },
    },
    moves: ['depth_first', 'merge_sort', 'stack_overflow', 'big_o'],
    dialogue: {
      preBattle: 'prof_recursio_pre',
      postWin:   'prof_recursio_win',
      postLoss:  'prof_recursio_loss',
    },
    sprite:  'assets/sprites/battle/recursio_l1.png',
    sprites: [
      'assets/sprites/battle/recursio_l1.png',
      'assets/sprites/battle/recursio_l2.png',
      'assets/sprites/battle/recursio_l3.png',
    ],
    battleMusic: 'battle_prof_recursio',
  },
  {
    id: 'prof_bayesio',
    name: 'Prof. Bayesio',
    field: 'NLP / Deep Learning',
    hp: 210,
    location: {
      region: 'lab_wing',
      tile: { x: 7, y: 2 },
    },
    moves: ['prior_strike', 'posterior', 'language_model', 'perplexity'],
    dialogue: {
      preBattle: 'prof_bayesio_pre',
      postWin:   'prof_bayesio_win',
      postLoss:  'prof_bayesio_loss',
    },
    sprite:  'assets/sprites/battle/bayesio_l1.png',
    sprites: [
      'assets/sprites/battle/bayesio_l1.png',
      'assets/sprites/battle/bayesio_l2.png',
      'assets/sprites/battle/bayesio_l3.png',
    ],
    battleMusic: 'battle_prof_bayesio',
  },
  {
    id: 'prof_vec_tor',
    name: 'Prof. Vec Tor',
    field: 'Computational Semantics',
    hp: 300,
    location: {
      region: 'castle',
      tile: { x: 5, y: 2 },
    },
    moves: ['word2vec', 'cosine_slam', 'gradient_blast', 'attention'],
    dialogue: {
      preBattle: 'prof_vec_tor_pre',
      postWin:   'prof_vec_tor_win',
      postLoss:  'prof_vec_tor_loss',
    },
    reward: 'secret_code',
    sprite:  'assets/sprites/battle/vec_tor_l1.png',
    sprites: [
      'assets/sprites/battle/vec_tor_l1.png',
      'assets/sprites/battle/vec_tor_l2.png',
      'assets/sprites/battle/vec_tor_l3.png',
    ],
    battleMusic: 'battle_prof_vec_tor',
  },
  {
    id: 'prof_parsemore',
    name: 'Prof. Parsemore',
    field: 'Computational Linguistics / Corpus Analysis',
    hp: 400,
    location: {
      region: 'courtyard',
      tile: { x: 5, y: 2 },
    },
    moves: ['chunker', 'dep_parse', 'corpus_crush', 'full_parse'],
    dialogue: {
      preBattle: 'prof_parsemore_pre',
      postWin:   'prof_parsemore_win',
      postLoss:  'prof_parsemore_loss',
    },
    sprite:  'assets/sprites/battle/parsemore_l1.png',
    sprites: [
      'assets/sprites/battle/parsemore_l1.png',
      'assets/sprites/battle/parsemore_l2.png',
      'assets/sprites/battle/parsemore_l3.png',
    ],
    battleMusic: 'battle_prof_parsemore',
  },
];
