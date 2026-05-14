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
    id: 'npc_ruby',
    name: 'Ruby',
    location: { region: 'tbd', tile: { x: 0, y: 0 } },
    dialogue: 'npc_ruby',
    reward: 'community_badge', //once you've talked to every character in the game (including parsemore)
    repeatableReward: false,
  },
];
