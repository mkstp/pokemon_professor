// main.js — Phaser game entry point
//
// Creates the Phaser.Game instance and registers all scenes. No game logic
// lives here — all behaviour is in the scene files.

import OverworldScene    from './scenes/OverworldScene.js';
import BattleScene       from './scenes/BattleScene.js';
import DialogueScene     from './scenes/DialogueScene.js';
import AudioScene        from './scenes/AudioScene.js';
import MoveKioskScene    from './scenes/MoveKioskScene.js';

const config = {
  type:            Phaser.AUTO,   // WebGL if available, Canvas fallback
  width:           400,
  height:          400,
  backgroundColor: '#000000',
  pixelArt:        true,          // nearest-neighbour filtering; prevents dark fringe on scaled sprites
  scene: [
    // OverworldScene auto-starts first; it launches AudioScene and other scenes.
    OverworldScene,
    BattleScene,
    DialogueScene,
    AudioScene,
    MoveKioskScene,
  ],
  physics: {
    default: 'arcade',
    arcade:  { gravity: { y: 0 }, debug: false },
  },
};

new Phaser.Game(config);
