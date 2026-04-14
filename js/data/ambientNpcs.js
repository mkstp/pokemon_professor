// data/ambientNpcs.js — ambient (non-battle) NPC definitions
'use strict';

// ─── AMBIENT NPCs ─────────────────────────────────────────────────────────────
// Non-battle NPCs encountered in the overworld. Interaction triggers dialogue
// and optionally gives an item. Schema: see tdd/data.md § AmbientNPC.
//
// location: placement is TBD — region and tile coordinates will be assigned
// during map work. Placeholders used here so the schema is complete.

export const ambientNPCs = [
  {
    id: 'npc_casey',
    name: 'Casey',
    location: { region: 'tbd', tile: { x: 0, y: 0 } },
    dialogue: [
      'You\'ve tried enough. You get it.',
    ],
    reward: 'meal_lovers_badge',
    repeatableReward: false,
  },
  {
    id: 'npc_antaeus',
    name: 'Antaeus',
    location: { region: 'tbd', tile: { x: 0, y: 0 } },
    dialogue: [
      'Hungry? Take something.',
      'There\'s always more.',
    ],
    // reward: TBD — gives grad lounge food but no specific item id assigned yet
    repeatableReward: true,
  },
  {
    id: 'npc_clara',
    name: 'Clara',
    location: { region: 'tbd', tile: { x: 0, y: 0 } },
    dialogue: [
      '…',
    ],
    reward: 'triscuit',
    repeatableReward: true,
  },
  {
    id: 'npc_beckett',
    name: 'Beckett',
    location: { region: 'tbd', tile: { x: 0, y: 0 } },
    dialogue: [
      'You look like you need this.',
    ],
    reward: 'emotional_support_pickle',
    repeatableReward: false,
  },
  {
    id: 'npc_emeryn',
    name: 'Emeryn',
    location: { region: 'tbd', tile: { x: 0, y: 0 } },
    dialogue: [
      'Oh — hi. I wasn\'t expecting anyone.',
      'Um… do you want a cookie?',
      'I made too many.',
    ],
    reward: 'purim_cookie',
    repeatableReward: true,
  },
  {
    id: 'npc_kyle',
    name: 'Kyle',
    location: { region: 'tbd', tile: { x: 0, y: 0 } },
    dialogue: [
      'You eating right? Doesn\'t look like it.',
    ],
    reward: 'carls_large_cheese_steak_sub',
    repeatableReward: false,
  },
  {
    id: 'npc_ruby',
    name: 'Ruby',
    location: { region: 'tbd', tile: { x: 0, y: 0 } },
    dialogue: [
      'You\'ve been showing up.',
      'People notice more than you think.',
    ],
    reward: 'community_badge',
    repeatableReward: false,
  },
];
