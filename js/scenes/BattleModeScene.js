// BattleModeScene.js — battle mode opponent selector
//
// Registered under the key 'OverworldScene' so that BattleScene.endBattle()
// can wake it without modification. Displays a two-column selector:
//   Left column  — professors (7 entries, pass { opponentType: 'professor' })
//   Right column — student NPCs (8 per page, paginated with Prev/Next nav)
//
// After a battle ends, BattleScene stops itself and wakes 'OverworldScene'
// (this scene), which rebuilds the selector so the next battle can be chosen.
//
// Canvas: 400×900 px.

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

// Student pagination
const STUDS_PER_PAGE = 8;

export default class BattleModeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OverworldScene' }); // key must match BattleScene's wake/stop calls
  }

  // First run: launch AudioScene once and build the initial UI.
  create() {
    this._studPage = 0;
    engine.init();
    this.scene.launch('AudioScene');
    // AudioScene.create() populates this.tracks asynchronously after preload completes.
    // Listening on its 'create' event guarantees tracks are ready before we try to play.
    this._pendingUnlock = null;
    this.scene.get('AudioScene').events.once('create', () => {
      if (this.sound.locked) {
        this._pendingUnlock = () => {
          this._pendingUnlock = null;
          this.scene.get('AudioScene').switchTo('intro_credits');
        };
        this.sound.once('unlocked', this._pendingUnlock);
      } else {
        this.scene.get('AudioScene').switchTo('intro_credits');
      }
    });
    this._buildUI();
  }

  // Called by BattleScene.endBattle() after each battle completes.
  // Resets engine state so the next battle starts at full HP.
  wake() {
    this._studPage = 0;
    engine.init();
    const audio = this.scene.get('AudioScene');
    if (audio) {
      audio.stop();
      audio.switchTo('intro_credits');
    }
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

    // Move Kiosk button — opens the loadout manager before a battle
    this._makeNavButton(200, 880, 'Move Kiosk', () => {
      this.scene.launch('MoveKioskScene', {});
    });

    // Professor buttons (left column, encounter order)
    professors.forEach((prof, i) => {
      const y = BTN_Y0 + i * BTN_GAP;
      this._makeButton(PROF_COL_X, y, PROF_BTN_W, BTN_H, prof.name,
        `${prof.field}  —  ${prof.hp} HP`, `#${i + 1}`,
        () => this._startBattle({ opponentType: 'professor', professorId: prof.id })
      );
    });

    // Student NPC buttons (right column, current page only)
    const pageStart  = this._studPage * STUDS_PER_PAGE;
    const pageSlice  = studentNPCs.slice(pageStart, pageStart + STUDS_PER_PAGE);
    const totalPages = Math.ceil(studentNPCs.length / STUDS_PER_PAGE);

    pageSlice.forEach((npc, i) => {
      const globalIndex = pageStart + i; // 0-based index across all students
      const y = BTN_Y0 + i * BTN_GAP;
      this._makeButton(STUD_COL_X, y, STUD_BTN_W, BTN_H, npc.name,
        `${npc.hp} HP`, `#${globalIndex + 1}`,
        () => this._startBattle({ opponentType: 'student', studentId: npc.id })
      );
    });

    // Page indicator
    this.add.text(STUD_COL_X, 500, `${this._studPage + 1} / ${totalPages}`, {
      fontSize: '11px', color: '#8888aa', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Prev / Next navigation buttons
    if (this._studPage > 0) {
      this._makeNavButton(STUD_COL_X - 44, 540, 'Prev',
        () => { this._studPage -= 1; this._buildUI(); });
    }
    if (this._studPage < totalPages - 1) {
      this._makeNavButton(STUD_COL_X + 44, 540, 'Next',
        () => { this._studPage += 1; this._buildUI(); });
    }
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

  // Creates a simple navigation button (no subtitle or index label).
  // Used for Prev / Next pagination controls in the student column.
  _makeNavButton(x, y, label, onClick) {
    const w  = 76;
    const h  = BTN_H;
    const bg = this.add.rectangle(x, y, w, h, 0x2a2a4a)
      .setInteractive({ useHandCursor: true });

    this.add.text(x, y, label, {
      fontSize: '12px', color: '#ccccff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    bg.on('pointerover',  () => bg.setFillStyle(0x3a3a6a));
    bg.on('pointerout',   () => bg.setFillStyle(0x2a2a4a));
    bg.on('pointerdown',  onClick);
  }

  // Sleeps this scene and launches BattleScene with the chosen opponent data.
  // data must include opponentType and either professorId or studentId.
  _startBattle(data) {
    if (this._pendingUnlock) {
      this.sound.off('unlocked', this._pendingUnlock);
      this._pendingUnlock = null;
    }
    this.scene.launch('BattleScene', data);
    this.scene.sleep('OverworldScene');
  }
}
