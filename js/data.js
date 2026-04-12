// data.js — all static game data
// No logic; no async loading. All values are defined at module load time.
// All other modules import from this file; none write back to it.
// init() is included for interface consistency with other modules.

'use strict';

// ─── TILE CONSTANTS ───────────────────────────────────────────────────────────
// Used in region tileMap arrays. map.js reads these to determine walkability
// and visual appearance. Keep in sync with map.js tile renderer.

export const TILE = {
  FLOOR: 0,  // walkable; appearance determined by region theme
  WALL:  1,  // impassable obstacle
  WATER: 2,  // impassable; rendered as pond/water tile
};

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
];

// ─── DIALOGUE SEQUENCES ───────────────────────────────────────────────────────
// Keyed by sequence id. Each value is an ordered array of { speaker, line } pairs.
// dialogue.js reads these and advances through them one line at a time.
// 'Student' is the player's speaker label throughout.

export const dialogueSequences = {

  // ── Prof. Schwaartz ───────────────────────────────────────────────────────
  'prof_schwaartz_pre': [
    { speaker: 'Prof. Schwaartz', line: 'Ah — you\'ve arrived. Listen to the pond for a moment. Do you hear the difference between that frog\'s call and the wind in the elms?' },
    { speaker: 'Prof. Schwaartz', line: 'No? That\'s alright. You will. Shall we begin?' },
  ],
  'prof_schwaartz_win': [
    { speaker: 'Prof. Schwaartz', line: 'Excellent. You have a good ear. Come find me again when you can identify a retroflex from twenty paces.' },
  ],
  'prof_schwaartz_loss': [
    { speaker: 'Prof. Schwaartz', line: 'Don\'t worry. Sound takes time. Try again — I\'m not going anywhere.' },
  ],

  // ── Prof. Syntaxa ─────────────────────────────────────────────────────────
  'prof_syntaxa_pre': [
    { speaker: 'Prof. Syntaxa', line: '"I could care less" is not idiomatic. It means the opposite of what you intend.' },
    { speaker: 'Prof. Syntaxa', line: 'Now. Let us see whether your structures hold.' },
  ],
  'prof_syntaxa_win': [
    { speaker: 'Prof. Syntaxa', line: 'Well-formed. I\'ll admit I didn\'t expect a complete derivation. Good work.' },
  ],
  'prof_syntaxa_loss': [
    { speaker: 'Prof. Syntaxa', line: 'Your argument was ungrammatical at the embedded clause. Revise and resubmit.' },
  ],

  // ── Prof. Composita ───────────────────────────────────────────────────────
  'prof_composita_pre': [
    { speaker: 'Prof. Composita', line: 'Oh, you\'re here to battle? Interesting. What do you mean by "battle," exactly?' },
    { speaker: 'Prof. Composita', line: 'I\'m being sincere. The word is doing a lot of work. Let\'s find out what it means together.' },
  ],
  'prof_composita_win': [
    { speaker: 'Prof. Composita', line: 'Hm. Perhaps I concede the point. Provisionally. The truth conditions seem to favour you.' },
  ],
  'prof_composita_loss': [
    { speaker: 'Prof. Composita', line: 'You see — even your loss is semantically rich. What did it denote?' },
  ],

  // ── Prof. Recursio ────────────────────────────────────────────────────────
  'prof_recursio_pre': [
    { speaker: 'Prof. Recursio', line: 'Oh good, you found the dungeon! Most people can\'t. It\'s basically a graph traversal problem — you just have to know which edges exist.' },
    { speaker: 'Prof. Recursio', line: 'Okay so here\'s the thing about this battle: it\'s a shortest-path problem. Unfortunately for you, I know the graph.' },
  ],
  'prof_recursio_win': [
    { speaker: 'Prof. Recursio', line: 'Huh. Your heuristic was better than mine. Okay. I respect that. What was your time complexity?' },
  ],
  'prof_recursio_loss': [
    { speaker: 'Prof. Recursio', line: 'Classic! You optimised locally and missed the global minimum. It happens to everyone.' },
  ],

  // ── Prof. Bayesio ─────────────────────────────────────────────────────────
  'prof_bayesio_pre': [
    { speaker: 'Prof. Bayesio', line: 'Hey! Sorry — one sec — okay, the training run is stable. What\'s up?' },
    { speaker: 'Prof. Bayesio', line: 'A battle? Sure. I should warn you: prior probability of your victory is essentially zero. I\'ve run the numbers.' },
  ],
  'prof_bayesio_win': [
    { speaker: 'Prof. Bayesio', line: 'Huh. You were an outlier I hadn\'t modelled. That\'s actually kind of exciting. Can I log this?' },
  ],
  'prof_bayesio_loss': [
    { speaker: 'Prof. Bayesio', line: 'Posterior confirmed. Don\'t worry — that\'s what learning rate schedules are for.' },
  ],

  // ── Prof. Vec Tor ─────────────────────────────────────────────────────────
  'prof_vec_tor_pre': [
    { speaker: 'Prof. Vec Tor', line: 'You\'ve come a long way. Phonetics, Syntax, Semantics, Algorithms, Deep Learning — you\'ve heard their arguments.' },
    { speaker: 'Prof. Vec Tor', line: 'Mine synthesises all of them. Meaning as geometry. Shall we see if you\'ve been paying attention?' },
  ],
  'prof_vec_tor_win': [
    { speaker: 'Prof. Vec Tor', line: 'The vectors align. Well done — that\'s not something I say lightly. You\'ve earned your credits.' },
  ],
  'prof_vec_tor_loss': [
    { speaker: 'Prof. Vec Tor', line: 'Your embedding was inconsistent. Come back when you\'ve found the right representation.' },
  ],
};

// ─── REGIONS ──────────────────────────────────────────────────────────────────
// Keyed by region id.
//
// tileMap: 2D array of TILE constants — row-major, indexed tileMap[y][x].
// These are placeholder grids (10 wide × 8 tall) for the proof-of-concept.
// The map module will expand them into full campus layouts during map work.
//
// connections: array of { tile, targetRegion, targetTile }
//   tile:         {x,y} the player steps on to trigger a transition (this region)
//   targetRegion: id of the region to enter
//   targetTile:   {x,y} the player arrives at in the target region
//   The castle connection in outdoor_campus is gated — map.js checks
//   engine state and blocks it until all five prior professors are defeated.
//
// encounterTiles: array of { tile, professorId }
//   Stepping on this tile triggers the named professor's sequence.
//   game.js checks whether the professor is already defeated before triggering.

export const regions = {

  outdoor_campus: {
    id: 'outdoor_campus',
    displayName: 'Outdoor Campus',
    // Tile key:  0 = FLOOR  1 = WALL  2 = WATER
    // Rows 3–4, cols 3–4: the pond.
    // South wall (row 7) has exits at col 2 (main building) and col 7 (lab wing).
    // North-east corner (col 9, row 1): hill path to castle (gated).
    tileMap: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],  // col 9 = hill path exit (castle, gated)
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 2, 2, 0, 0, 0, 0, 1],  // pond
      [1, 0, 0, 2, 2, 0, 0, 0, 0, 1],  // pond
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 0, 1, 1, 1, 1, 0, 1, 1],  // exits: col 2 = main building, col 7 = lab wing
    ],
    entryPosition: { x: 5, y: 6 },
    connections: [
      { tile: { x: 2, y: 7 }, targetRegion: 'main_building', targetTile: { x: 2, y: 6 } },
      { tile: { x: 7, y: 7 }, targetRegion: 'lab_wing',      targetTile: { x: 1, y: 6 } },
      { tile: { x: 9, y: 1 }, targetRegion: 'castle',        targetTile: { x: 5, y: 6 } },  // gated
    ],
    weatherEffect: 'rain',
    music: 'overworld',
    encounterTiles: [
      { tile: { x: 5, y: 3 }, professorId: 'prof_schwaartz' },  // pond walkway
    ],
  },

  main_building: {
    id: 'main_building',
    displayName: 'Main Building',
    // South wall exits: col 2 = outdoor campus, col 4 = cafeteria,
    //                   col 6 = graduate lounge, col 8 = basement stairs.
    // East wall (col 9, row 3): corridor to lab wing.
    tileMap: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],  // col 9 = lab wing corridor
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 0, 1, 0, 1, 0, 1, 0, 1],  // exits at cols 2, 4, 6, 8
    ],
    entryPosition: { x: 2, y: 6 },
    connections: [
      { tile: { x: 2, y: 7 }, targetRegion: 'outdoor_campus',  targetTile: { x: 2, y: 6 } },
      { tile: { x: 4, y: 7 }, targetRegion: 'cafeteria',       targetTile: { x: 5, y: 1 } },
      { tile: { x: 6, y: 7 }, targetRegion: 'graduate_lounge', targetTile: { x: 5, y: 1 } },
      { tile: { x: 8, y: 7 }, targetRegion: 'basement',        targetTile: { x: 5, y: 1 } },
      { tile: { x: 9, y: 3 }, targetRegion: 'lab_wing',        targetTile: { x: 1, y: 3 } },
    ],
    weatherEffect: null,
    music: 'indoor',
    encounterTiles: [
      { tile: { x: 5, y: 5 }, professorId: 'prof_syntaxa' },    // classroom, ground floor
      { tile: { x: 7, y: 2 }, professorId: 'prof_composita' },  // library mezzanine
    ],
  },

  cafeteria: {
    id: 'cafeteria',
    displayName: 'Cafeteria',
    tileMap: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 0, 1, 1, 1, 1],  // exit at col 5
    ],
    entryPosition: { x: 5, y: 1 },
    connections: [
      { tile: { x: 5, y: 7 }, targetRegion: 'main_building', targetTile: { x: 4, y: 6 } },
    ],
    weatherEffect: null,
    music: 'cafeteria',
    encounterTiles: [],
  },

  graduate_lounge: {
    id: 'graduate_lounge',
    displayName: 'Graduate Lounge',
    tileMap: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 0, 1, 1, 1, 1],  // exit at col 5
    ],
    entryPosition: { x: 5, y: 1 },
    connections: [
      { tile: { x: 5, y: 7 }, targetRegion: 'main_building', targetTile: { x: 6, y: 6 } },
    ],
    weatherEffect: null,
    music: 'indoor',
    encounterTiles: [],
  },

  basement: {
    id: 'basement',
    displayName: 'PhD Dungeon',
    // Entrance at top (row 0, col 5) — player comes down the stairwell.
    tileMap: [
      [1, 1, 1, 1, 1, 0, 1, 1, 1, 1],  // entrance from main building
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    entryPosition: { x: 5, y: 1 },
    connections: [
      { tile: { x: 5, y: 0 }, targetRegion: 'main_building', targetTile: { x: 8, y: 6 } },
    ],
    weatherEffect: 'monitor_glow',
    music: 'dungeon',
    encounterTiles: [
      { tile: { x: 5, y: 6 }, professorId: 'prof_recursio' },
    ],
  },

  lab_wing: {
    id: 'lab_wing',
    displayName: 'Lab Wing',
    // West wall (col 0, row 6): path back to outdoor campus.
    // South wall (row 7, col 5): corridor to main building.
    tileMap: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 1],  // col 0 = main building corridor (east)
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 1],  // col 0 = outdoor campus path (west)
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    entryPosition: { x: 1, y: 3 },
    connections: [
      { tile: { x: 0, y: 3 }, targetRegion: 'main_building',  targetTile: { x: 8, y: 3 } },
      { tile: { x: 0, y: 6 }, targetRegion: 'outdoor_campus', targetTile: { x: 7, y: 6 } },
    ],
    weatherEffect: 'monitor_glow',
    music: 'indoor',
    encounterTiles: [
      { tile: { x: 7, y: 2 }, professorId: 'prof_bayesio' },  // GPU lab, upper floor
    ],
  },

  castle: {
    id: 'castle',
    displayName: 'The Castle',
    // Player enters from the south (hill path from outdoor campus).
    // Prof. Vec Tor waits at the far end of the great hall.
    tileMap: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 0, 1, 1, 1, 1],  // exit at col 5 (south, back to outdoor campus)
    ],
    entryPosition: { x: 5, y: 6 },
    connections: [
      { tile: { x: 5, y: 7 }, targetRegion: 'outdoor_campus', targetTile: { x: 8, y: 2 } },
    ],
    weatherEffect: 'candlelight',
    music: 'castle',
    encounterTiles: [
      { tile: { x: 5, y: 2 }, professorId: 'prof_vec_tor' },
    ],
  },
};

// ─── AUDIO TRACKS ─────────────────────────────────────────────────────────────
// All tracks the game may play.
// id is used by audio.js to look up and play a track.
// Per-professor battle tracks follow the convention 'battle_<professorId>'.
//
// TODO: vec_tor has no dedicated battle track yet — castle theme used as placeholder.
//       Replace src with 'assets/music/vec_tor.mp3' once the track is created.
// TODO: victory and defeat jingles not yet sourced — placeholder paths used.
//       Sourcing these is tracked as an open issue.

export const audioTracks = [

  // Overworld and ambient tracks
  { id: 'overworld',  src: 'assets/music/overworld.mp3',  loop: true  },
  { id: 'indoor',     src: 'assets/music/indoor.mp3',     loop: true  },
  { id: 'cafeteria',  src: 'assets/music/cafeteria.mp3',  loop: true  },
  { id: 'dungeon',    src: 'assets/music/dungeon.mp3',    loop: true  },
  { id: 'castle',     src: 'assets/music/castle.mp3',     loop: true  },

  // Per-professor battle tracks
  { id: 'battle_prof_schwaartz', src: 'assets/music/schwaartz.mp3',  loop: true },
  { id: 'battle_prof_syntaxa',   src: 'assets/music/syntaxa.mp3',    loop: true },
  { id: 'battle_prof_composita', src: 'assets/music/composita.mp3',  loop: true },
  { id: 'battle_prof_recursio',  src: 'assets/music/recursio.mp3',   loop: true },
  { id: 'battle_prof_bayesio',   src: 'assets/music/bayesio.mp3',    loop: true },
  { id: 'battle_prof_vec_tor',   src: 'assets/music/vec_tor.mp3',    loop: true },
  { id: 'battle_prof_parsemore', src: 'assets/music/parsemore.mp3',  loop: true },
  
  // Post-battle jingles — short, no loop
  { id: 'victory', src: 'assets/music/victory.mp3', loop: false },  // TODO: file not yet sourced
  { id: 'defeat',  src: 'assets/music/defeat.mp3',  loop: false },  // TODO: file not yet sourced

  // Battle SFX — short, no loop. Files must be placed in assets/sfx/.
  // TODO: source and add hit_light.mp3, hit_heavy.mp3, dialogue_adv.mp3
  { id: 'sfx_hit_light',    src: 'assets/sfx/hit_light.mp3',    loop: false },
  { id: 'sfx_hit_heavy',    src: 'assets/sfx/hit_heavy.mp3',    loop: false },
  { id: 'sfx_dialogue_adv', src: 'assets/sfx/dialogue_adv.mp3', loop: false },
];

// ─── INIT ─────────────────────────────────────────────────────────────────────
// No-op — all data is defined at module load time.
// Included for interface consistency with other modules.

export function init() {}
