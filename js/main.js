// main.js — Phaser game entry point
//
// Creates the Phaser.Game instance and registers all scenes. No game logic
// lives here — all behaviour is in the scene files.

import CourtyardScene    from './scenes/CourtyardScene.js';
import BattleScene       from './scenes/BattleScene.js';
import BattleModeScene   from './scenes/BattleModeScene.js';
import DialogueScene     from './scenes/DialogueScene.js';
import AudioScene        from './scenes/AudioScene.js';
import KioskScene        from './scenes/KioskScene.js';
import MainMenuScene     from './scenes/MainMenuScene.js';

const config = {
  type:            Phaser.AUTO,   // WebGL if available, Canvas fallback
  width:           400,
  height:          400,
  backgroundColor: '#0f0f1a',
  pixelArt:        true,          // nearest-neighbour filtering; prevents dark fringe on scaled sprites
  scale: {
    mode:       Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    // MainMenuScene auto-starts first; all other scenes are launched from there.
    MainMenuScene,
    CourtyardScene,
    BattleScene,
    BattleModeScene,
    DialogueScene,
    AudioScene,
    KioskScene,
  ],
  physics: {
    default: 'arcade',
    arcade:  { gravity: { y: 0 }, debug: false },
  },
};

new Phaser.Game(config);
