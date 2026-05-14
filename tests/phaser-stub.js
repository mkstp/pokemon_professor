// tests/phaser-stub.js — minimal Phaser 3 stub for unit tests
//
// Sets globalThis.Phaser so BattleScene.js (which does `class BattleScene extends Phaser.Scene`)
// can be imported in a non-Phaser environment. Only covers what is needed for the class
// definition to load without error; does not implement scene lifecycle or rendering.
//
// Import this BEFORE any file that imports BattleScene:
//   import './phaser-stub.js';
//   import BattleScene from '../js/scenes/BattleScene.js';
//
// In ES module execution order, a leaf module (no imports) listed first in a file
// executes before later imports, guaranteeing the global is in place when BattleScene.js
// is evaluated.

globalThis.Phaser = {
  Scene: class Scene {
    constructor(_config) {}
  },
  Input: {
    Keyboard: {
      KeyCodes: {
        UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39,
        ENTER: 13, SPACE: 32, ESC: 27, TAB: 9, R: 82, I: 73,
      },
    },
  },
};
