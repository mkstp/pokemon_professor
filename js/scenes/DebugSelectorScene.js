// DebugSelectorScene.js — battle debug selector (debug.html only)
//
// Registered under the key 'OverworldScene' so that BattleScene.endBattle()
// can wake it without modification. Displays a two-column selector:
//   Left column  — professors (7 entries, pass { opponentType: 'professor' })
//   Right column — student NPCs (15 entries, pass { opponentType: 'student' })
//
// After a battle ends, BattleScene stops itself and wakes 'OverworldScene'
// (this scene), which rebuilds the selector so the next battle can be chosen.
//
// Canvas: 400×900 px (debug.html sets height: 900 to fit all 15 student rows).

import * as engine from '../engine.js';
import { professors } from '../data/professors.js';
import { studentNPCs } from '../data/students.js';

// ── Column layout constants ──────────────────────────────────────────────────

// Professors column (left)
const PROF_COL_X  = 100;
const PROF_BTN_W  = 185;

// Students column (right)
const STUD_COL_X  = 300;
const STUD_BTN_W  = 185;

// Shared vertical layout
const BTN_H   =  38;
const BTN_Y0  =  72; // y-centre of first button in each column
const BTN_GAP =  50; // spacing between button centres

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

  // Clears the canvas and redraws the full two-column selector.
  _buildUI() {
    this.children.removeAll(true);

    // Background (covers 400×900 canvas)
    this.add.rectangle(200, 450, 400, 900, 0x1a1a2e);

    // Column headers
    this.add.text(PROF_COL_X, 16, 'Professors', {
      fontSize: '13px', color: '#aaaacc', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(STUD_COL_X, 16, 'Student NPCs', {
      fontSize: '13px', color: '#aaaacc', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Vertical divider between columns
    this.add.rectangle(200, 450, 2, 900, 0x333355);

    // Subtitle
    this.add.text(200, 36, 'select opponent to battle', {
      fontSize: '10px', color: '#666688', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Professor buttons (left column, encounter order)
    professors.forEach((prof, i) => {
      const y = BTN_Y0 + i * BTN_GAP;
      this._makeButton(PROF_COL_X, y, PROF_BTN_W, BTN_H, prof.name,
        `${prof.field}  —  ${prof.hp} HP`, `#${i + 1}`,
        () => this._startBattle({ opponentType: 'professor', professorId: prof.id })
      );
    });

    // Student NPC buttons (right column, data order)
    studentNPCs.forEach((npc, i) => {
      const y = BTN_Y0 + i * BTN_GAP;
      this._makeButton(STUD_COL_X, y, STUD_BTN_W, BTN_H, npc.name,
        `${npc.hp} HP`, `#${i + 1}`,
        () => this._startBattle({ opponentType: 'student', studentId: npc.id })
      );
    });
  }

  // Creates a clickable button with a title, subtitle, and index label.
  // onClick is called when the button is pressed.
  _makeButton(x, y, w, h, title, subtitle, indexLabel, onClick) {
    const bg = this.add.rectangle(x, y, w, h, 0x2a2a4a)
      .setInteractive({ useHandCursor: true });

    this.add.text(x - w / 2 + 8, y - 8, title, {
      fontSize: '12px', color: '#ccccff', fontFamily: 'monospace',
    }).setOrigin(0, 0.5);

    this.add.text(x - w / 2 + 8, y + 8, subtitle, {
      fontSize: '9px', color: '#8888aa', fontFamily: 'monospace',
    }).setOrigin(0, 0.5);

    this.add.text(x + w / 2 - 6, y, indexLabel, {
      fontSize: '9px', color: '#555577', fontFamily: 'monospace',
    }).setOrigin(1, 0.5);

    bg.on('pointerover',  () => bg.setFillStyle(0x3a3a6a));
    bg.on('pointerout',   () => bg.setFillStyle(0x2a2a4a));
    bg.on('pointerdown',  onClick);
  }

  // Sleeps this scene and launches BattleScene with the chosen opponent data.
  // data must include opponentType and either professorId or studentId.
  _startBattle(data) {
    this.scene.launch('BattleScene', data);
    this.scene.sleep('OverworldScene');
  }
}
