// data/students.js — student NPC battle character definitions
'use strict';

// ─── STUDENT NPCs ─────────────────────────────────────────────────────────────
// Battle-capable student characters encountered in the overworld.
// hp: 80 placeholder — requires balancing pass before final implementation.
// sprite: placeholder path — requires art asset pass.
// Schema: see tdd/data.md § StudentNPC.

export const studentNPCs = [
  {
    id: 'student_halvorsen',
    name: 'Halvorsen',
    hp: 80,
    moves: ['counterexample', 'correction', 'peer_review', 'cite_this'],
    dialogue: {
      preBattle: 'student_halvorsen_pre',
      postWin:   'student_halvorsen_win',
      postLoss:  'student_halvorsen_loss',
      reward:    'student_halvorsen_reward',
    },
    sprite: 'assets/sprites/battle/student_halvorsen.png',
  },
  {
    id: 'student_rohan',
    name: 'Rohan',
    hp: 80,
    moves: ['hot_take', 'non_sequitur', 'scope_creep', 'room_booking_rant'],
    dialogue: {
      preBattle: 'student_rohan_pre',
      postWin:   'student_rohan_win',
      postLoss:  'student_rohan_loss',
    },
    sprite: 'assets/sprites/battle/student_rohan.png',
  },
  {
    id: 'student_voss',
    name: 'Voss',
    hp: 80,
    moves: ['correction', 'counterexample', 'citation_needed', 'deadline_panic'],
    dialogue: {
      preBattle: 'student_voss_pre',
      postWin:   'student_voss_win',
      postLoss:  'student_voss_loss',
    },
    sprite: 'assets/sprites/battle/student_voss.png',
  },
  {
    id: 'student_lab_sentinel_k',
    name: 'Lab Sentinel K',
    hp: 80,
    moves: ['cite_this', 'peer_review', 'undergrad_flashback', 'access_denied'],
    dialogue: {
      preBattle: 'student_lab_sentinel_k_pre',
      postWin:   'student_lab_sentinel_k_win',
      postLoss:  'student_lab_sentinel_k_loss',
    },
    sprite: 'assets/sprites/battle/student_lab_sentinel_k.png',
  },
  {
    id: 'student_finnegan',
    name: 'Finnegan',
    hp: 80,
    moves: ['correction', 'non_sequitur', 'hot_take', 'question_mark'],
    dialogue: {
      preBattle: 'student_finnegan_pre',
      postWin:   'student_finnegan_win',
      postLoss:  'student_finnegan_loss',
    },
    sprite: 'assets/sprites/battle/student_finnegan.png',
  },
  {
    id: 'student_simon',
    name: 'Simon',
    hp: 80,
    moves: ['all_nighter', 'burnout', 'overfit_model', 'whiteboard_spiral'],
    dialogue: {
      preBattle: 'student_simon_pre',
      postWin:   'student_simon_win',
      postLoss:  'student_simon_loss',
    },
    sprite: 'assets/sprites/battle/student_simon.png',
  },
  {
    id: 'student_chadwick',
    name: 'Chadwick',
    hp: 80,
    moves: ['hot_take', 'conference_talk', 'group_project', 'deadline_panic'],
    dialogue: {
      preBattle: 'student_chadwick_pre',
      postWin:   'student_chadwick_win',
      postLoss:  'student_chadwick_loss',
    },
    sprite: 'assets/sprites/battle/student_chadwick.png',
  },
  {
    id: 'student_mina',
    name: 'Mina',
    hp: 80,
    moves: ['impostor_syndrome', 'deadline_panic', 'revise_and_resubmit', 'office_hours'],
    dialogue: {
      preBattle: 'student_mina_pre',
      postWin:   'student_mina_win',
      postLoss:  'student_mina_loss',
    },
    sprite: 'assets/sprites/battle/student_mina.png',
  },
  {
    id: 'student_jax',
    name: 'Jax',
    hp: 80,
    moves: ['non_sequitur', 'hot_take', 'whiteboard_spiral', 'group_project'],
    dialogue: {
      preBattle: 'student_jax_pre',
      postWin:   'student_jax_win',
      postLoss:  'student_jax_loss',
    },
    sprite: 'assets/sprites/battle/student_jax.png',
  },
  {
    id: 'student_marcellus',
    name: 'Marcellus',
    hp: 80,
    moves: ['non_sequitur', 'counterexample', 'scope_creep', 'meaning_crisis'],
    dialogue: {
      preBattle: 'student_marcellus_pre',
      postWin:   'student_marcellus_win',
      postLoss:  'student_marcellus_loss',
      reward:    'student_marcellus_reward',
    },
    reward:  'star_gourd',
    sprite: 'assets/sprites/battle/student_marcellus.png',
  },
  {
    id: 'student_elena',
    name: 'Elena',
    hp: 80,
    moves: ['conference_talk', 'advisor_email', 'tenure_track_dream', 'colloquium_circuit'],
    dialogue: {
      preBattle: 'student_elena_pre',
      postWin:   'student_elena_win',
      postLoss:  'student_elena_loss',
    },
    sprite: 'assets/sprites/battle/student_elena.png',
  },
  {
    id: 'student_soren',
    name: 'Soren',
    hp: 80,
    moves: ['hot_take', 'non_sequitur', 'scope_creep', 'undergrad_flashback'],
    dialogue: {
      preBattle: 'student_soren_pre',
      postWin:   'student_soren_win',
      postLoss:  'student_soren_loss',
    },
    sprite: 'assets/sprites/battle/student_soren.png',
  },
  {
    id: 'student_valentine',
    name: 'Valentine',
    hp: 80,
    moves: ['whiteboard_spiral', 'non_sequitur', 'hot_take', 'dataset_leak'],
    dialogue: {
      preBattle: 'student_valentine_pre',
      postWin:   'student_valentine_win',
      postLoss:  'student_valentine_loss',
    },
    sprite: 'assets/sprites/battle/student_valentine.png',
  },
  {
    id: 'student_lionel',
    name: 'Lionel',
    hp: 80,
    moves: ['group_project', 'revise_and_resubmit', 'hot_take', 'deep_cut'],
    dialogue: {
      preBattle: 'student_lionel_pre',
      postWin:   'student_lionel_win',
      postLoss:  'student_lionel_loss',
      reward:    'student_lionel_reward',
    },
    reward:  'music_league_badge',
    sprite: 'assets/sprites/battle/student_lionel.png',
  },
  {
    id: 'student_suzanna',
    name: 'Suzanna',
    hp: 80,
    moves: ['revise_and_resubmit', 'office_hours', 'all_nighter', 'silver_lining'],
    dialogue: {
      preBattle: 'student_suzanna_pre',
      postWin:   'student_suzanna_win',
      postLoss:  'student_suzanna_loss',
      reward:    'student_suzanna_reward',
    },
    reward:  'dialecters_badge',
    sprite: 'assets/sprites/battle/student_suzanna.png',
  },
];
