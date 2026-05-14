// OverworldScene.js — STUB for battle milestone
//
// Full implementation is tracked in the Beads backlog. This stub exists solely
// to satisfy the scene registry and provide a wake target for BattleScene.
//
// For the milestone: launches AudioScene and BattleScene (Schwaartz), then
// sleeps itself so BattleScene can wake it on exit.
//
// I key is wired here for when the full overworld is implemented; it has no
// visible effect in the stub because the scene sleeps immediately.

import * as engine from '../engine.js';

export default class OverworldScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OverworldScene' });
  }

  create() {
    // Initialise game state. Must run before any scene reads from engine.js.
    engine.init();

    // I key opens the unified player menu in overworld mode.
    this.input.keyboard.on('keydown-I', () => {
      this.input.keyboard.enabled = false;
      this.scene.launch('KioskScene', {
        mode: 'overworld',
        onClose: () => { this.input.keyboard.enabled = true; },
      });
    });

    // Persistent hint for the player menu — visible once the full overworld is active.
    this.add.text(8, 472, '[ I ] Menu', {
      fontSize: '10px', fill: '#444444', fontFamily: 'monospace',
    });

    // Start the persistent audio manager alongside this scene.
    this.scene.launch('AudioScene');

    // Launch the battle directly for milestone testing.
    this.scene.launch('BattleScene', { professorId: 'prof_schwaartz' });

    // Sleep so BattleScene has a valid scene to wake when it ends.
    this.scene.sleep('OverworldScene');
  }
}
