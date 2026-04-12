// DebugSelectorScene.js — battle debug selector (debug.html only)
//
// Registered under the key 'OverworldScene' so that BattleScene.endBattle()
// can wake it without modification. Displays a clickable list of all professors;
// selecting one sleeps this scene and launches BattleScene directly.
//
// After a battle ends, BattleScene stops itself and wakes 'OverworldScene'
// (this scene), which rebuilds the selector so the next battle can be chosen.

import * as engine from '../engine.js';
import { professors } from '../data.js';

const BTN_W  = 360;
const BTN_H  =  42;
const BTN_X  = 200;
const BTN_Y0 =  72; // y-centre of first button
const BTN_GAP =  52; // spacing between button centres

export default class DebugSelectorScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OverworldScene' }); // key must match BattleScene's wake/stop calls
  }

  // First run: launch AudioScene once and build the initial UI.
  create() {
    engine.init();
    this.scene.launch('AudioScene');
    this._buildUI();
  }

  // Called by BattleScene.endBattle() after each battle completes.
  // Resets engine state so the next battle starts at full HP.
  wake() {
    engine.init();
    this._buildUI();
  }

  // Clears the canvas and redraws the professor selector.
  _buildUI() {
    this.children.removeAll(true);

    // Background
    this.add.rectangle(200, 200, 400, 400, 0x1a1a2e);

    // Title
    this.add.text(200, 24, 'Battle Debug', {
      fontSize: '16px', color: '#aaaacc', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.add.text(200, 44, 'select a professor to battle', {
      fontSize: '10px', color: '#666688', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // One button per professor, in encounter order.
    professors.forEach((prof, i) => {
      const y = BTN_Y0 + i * BTN_GAP;

      const bg = this.add.rectangle(BTN_X, y, BTN_W, BTN_H, 0x2a2a4a)
        .setInteractive({ useHandCursor: true });

      this.add.text(BTN_X - BTN_W / 2 + 12, y - 9, prof.name, {
        fontSize: '13px', color: '#ccccff', fontFamily: 'monospace',
      }).setOrigin(0, 0.5);

      this.add.text(BTN_X - BTN_W / 2 + 12, y + 9,
        `${prof.field}  —  ${prof.hp} HP`, {
          fontSize: '10px', color: '#8888aa', fontFamily: 'monospace',
        }).setOrigin(0, 0.5);

      // HP pip in top-right corner of button.
      this.add.text(BTN_X + BTN_W / 2 - 10, y, `#${i + 1}`, {
        fontSize: '10px', color: '#555577', fontFamily: 'monospace',
      }).setOrigin(1, 0.5);

      bg.on('pointerover',  () => bg.setFillStyle(0x3a3a6a));
      bg.on('pointerout',   () => bg.setFillStyle(0x2a2a4a));
      bg.on('pointerdown',  () => this._startBattle(prof.id));
    });
  }

  // Sleeps this scene and launches BattleScene for the chosen professor.
  // Mirrors the call pattern used by the real OverworldScene.
  _startBattle(professorId) {
    this.scene.launch('BattleScene', { professorId });
    this.scene.sleep('OverworldScene');
  }
}
