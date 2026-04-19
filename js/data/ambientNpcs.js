// data/ambientNpcs.js — ambient (non-battle) NPC definitions
'use strict';

// ─── AMBIENT NPCs ─────────────────────────────────────────────────────────────
// Non-battle NPCs encountered in the overworld. Interaction triggers dialogue
// and optionally gives an item. Schema: see tdd/data.md § AmbientNPC.
//
// dialogue: key referencing a sequence in dialogue.js (dialogueSequences).
// location: placement is TBD — region and tile coordinates will be assigned
// during map work. Placeholders used here so the schema is complete.

export const ambientNPCs = [
  {
    id: 'npc_casey',
    name: 'Casey',
    location: { region: 'tbd', tile: { x: 0, y: 0 } },
    dialogue: 'npc_casey',
    reward: 'meal_lovers_badge', //once you've aquired all food items at least once
    repeatableReward: false,
  },
  {
    id: 'npc_antaeus',
    name: 'Antaeus',
    location: { region: 'tbd', tile: { x: 0, y: 0 } },
    dialogue: 'npc_antaeus',
    reward: 'meaningful_spaghetti',
    repeatableReward: true,
  },
  {
    id: 'npc_clara',
    name: 'Clara',
    location: { region: 'tbd', tile: { x: 0, y: 0 } },
    dialogue: 'npc_clara',
    reward: 'triscuit',
    repeatableReward: true,
  },
  {
    id: 'npc_beckett',
    name: 'Beckett',
    location: { region: 'tbd', tile: { x: 0, y: 0 } },
    dialogue: 'npc_beckett',
    reward: 'emotional_support_pickle',
    repeatableReward: false,
  },
  {
    id: 'npc_emeryn',
    name: 'Emeryn',
    location: { region: 'tbd', tile: { x: 0, y: 0 } },
    dialogue: 'npc_emeryn',
    reward: 'purim_cookie',
    repeatableReward: true,
  },
  {
    id: 'npc_kyle',
    name: 'Kyle',
    location: { region: 'tbd', tile: { x: 0, y: 0 } },
    dialogue: 'npc_kyle',
    reward: 'carls_large_cheese_steak_sub',
    repeatableReward: false,
  },
  {
    id: 'npc_ruby',
    name: 'Ruby',
    location: { region: 'tbd', tile: { x: 0, y: 0 } },
    dialogue: 'npc_ruby',
    reward: 'community_badge', //once you've talked to every character in the game (including parsemore)
    repeatableReward: false,
  },
];
