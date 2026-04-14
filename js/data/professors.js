// data/professors.js — professor objects and professor move definitions
'use strict';

// ─── PROFESSOR MOVES ──────────────────────────────────────────────────────────
// All moves available to professors. Professors reference these by id.
// battle.js looks up professor moves from this array during combat.
//
// Note: the data TDD lists only playerMoves in its exports table; professorMoves
// is added here because battle.js requires it to resolve professor move ids to
// damage and effect values. The TDD will need updating when battle.js is written.
//
// damage: exact integer HP dealt to the player.
// effect: 'disrupt' | 'self_damage' | 'deferred' | null
//   disrupt     — player's next move deals half damage (tracked via battleState.disrupted)
//   self_damage — professor takes 25% recoil after dealing damage
//   deferred    — damage stored; applied at the start of the professor's next turn
// See tdd/battle.md § Move Effects for implementation detail.

export const professorMoves = [

  // ── Prof. Schwaartz — Phonetics ──────────────────────────────────────────
  {
    id: 'minimal_pair',
    name: 'Minimal Pair',
    damage: 18,
    description: 'Exploits a subtle phonemic distinction the student almost missed.',
    effect: null,
  },
  {
    id: 'voiced_fricative',
    name: 'Voiced Fricative',
    damage: 12,
    description: 'A rapid, buzzing attack. Continuous and insistent.',
    effect: null,
  },
  {
    id: 'stress_shift',
    name: 'Stress Shift',
    damage: 16,
    description: 'Disrupts the student\'s rhythm — their next move is less effective.',
    effect: 'disrupt',
  },
  {
    id: 'aspiration',
    name: 'Aspiration',
    damage: 10,
    description: 'A sudden burst of air. Quick and slightly disorienting.',
    effect: null,
  },

  // ── Prof. Syntaxa — Syntax ────────────────────────────────────────────────
  {
    id: 'passive_voice',
    name: 'Passive Voice',
    damage: 20,
    description: 'The agent is obscured. The threat arrives indirectly.',
    effect: null,
  },
  {
    id: 'xbar_probe',
    name: 'X-Bar Probe',
    damage: 22,
    description: 'A precise, rule-governed strike targeting structural weakness.',
    effect: null,
  },
  {
    id: 'merge_op',
    name: 'Merge Op.',
    damage: 32,
    description: 'Two elements combine into something more powerful than either.',
    effect: null,
  },
  {
    id: 'deep_structure',
    name: 'Deep Structure',
    damage: 28,
    description: 'Attacks underlying form, not surface appearance.',
    effect: null,
  },

  // ── Prof. Composita — Semantics ───────────────────────────────────────────
  {
    id: 'presupposition_failure',
    name: 'Presupposition Failure',
    damage: 22,
    description: 'Attacks an assumption the student didn\'t know they were making.',
    effect: null,
  },
  {
    id: 'scope_ambiguity',
    name: 'Scope Ambiguity',
    damage: 20,
    description: 'The effect is unclear until after it resolves.',
    effect: 'deferred',
  },
  {
    id: 'entailment',
    name: 'Entailment',
    damage: 30,
    description: 'Slow and inevitable. If the premises hold, the conclusion follows.',
    effect: null,
  },
  {
    id: 'deixis',
    name: 'Deixis',
    damage: 20,
    description: 'Meaning shifts with context. Effect varies by situation.',
    effect: null,
  },

  // ── Prof. Recursio — Data Structures & Algorithms ─────────────────────────
  {
    id: 'depth_first',
    name: 'Depth First',
    damage: 24,
    description: 'Commits fully to one branch — relentless until it hits a dead end.',
    effect: null,
  },
  {
    id: 'merge_sort',
    name: 'Merge Sort',
    damage: 22,
    description: 'Methodical, divide-and-conquer. Builds to a clean resolution.',
    effect: null,
  },
  {
    id: 'stack_overflow',
    name: 'Stack Overflow',
    damage: 35,
    description: 'Chaotic, unpredictable. Recursive descent that exceeds its bounds.',
    effect: null,
  },
  {
    id: 'big_o',
    name: 'Big O',
    damage: 10,
    description: 'More taunt than attack — reduces the student\'s next move\'s effectiveness.',
    effect: 'disrupt',
  },

  // ── Prof. Bayesio — NLP / Deep Learning ──────────────────────────────────
  {
    id: 'prior_strike',
    name: 'Prior Strike',
    damage: 18,
    description: 'A prior belief applied before any evidence arrives.',
    effect: null,
  },
  {
    id: 'posterior',
    name: 'Posterior',
    damage: 24,
    description: 'Grows stronger as evidence accumulates. Resolves next turn.',
    effect: 'deferred',
  },
  {
    id: 'language_model',
    name: 'Language Model',
    damage: 22,
    description: 'Predicts the student\'s next move and disrupts it.',
    effect: 'disrupt',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    damage: 36,
    description: 'High variance, unpredictable. How surprised are you about to be?',
    effect: null,
  },

  // ── Prof. Parsemore — Computational Linguistics / Corpus Analysis (Secret Boss) ──
  {
    id: 'chunker',
    name: 'Chunker',
    damage: 20,
    description: 'Rapid shallow parsing — hits fast and covers ground before the student can react.',
    effect: null,
  },
  {
    id: 'dep_parse',
    name: 'Dep. Parse',
    damage: 26,
    description: 'Identifies the structural weak point and targets it precisely. Disrupts the student\'s next move.',
    effect: 'disrupt',
  },
  {
    id: 'corpus_crush',
    name: 'Corpus Crush',
    damage: 42,
    description: 'The weight of 400 million tokens, applied at once. Recoil: even the corpus takes a toll.',
    effect: 'self_damage',
  },
  {
    id: 'full_parse',
    name: 'Full Parse',
    damage: 50,
    description: 'An exhaustive structural analysis. Leaves nowhere to hide — but the effect arrives next turn.',
    effect: 'deferred',
  },

  // ── Prof. Vec Tor — Computational Semantics (Final Boss) ──────────────────
  {
    id: 'word2vec',
    name: 'Word2Vec',
    damage: 28,
    description: 'Maps the student into an unfavourable semantic space.',
    effect: null,
  },
  {
    id: 'cosine_slam',
    name: 'Cosine Slam',
    damage: 34,
    description: 'Measures and exploits the distance between your position and a winning one.',
    effect: null,
  },
  {
    id: 'gradient_blast',
    name: 'Gradient Blast',
    damage: 40,
    description: 'The full force of optimisation applied at once.',
    effect: null,
  },
  {
    id: 'attention',
    name: 'Attention!',
    damage: 48,
    description: 'Concentrates all weight on a single point. Resolves next turn.',
    effect: 'deferred',
  },
];

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
    hp: 60,
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
    hp: 80,
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
    hp: 100,
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
    hp: 120,
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
    hp: 140,
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
    hp: 160,
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
    hp: 200,
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
