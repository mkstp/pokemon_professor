// data/audio.js — audio track definitions
'use strict';

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
