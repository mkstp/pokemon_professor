// BattleModeScene.js — battle mode opponent selector
//
// Registered under the key 'OverworldScene' so that BattleScene.endBattle()
// can wake it without modification. Renders as a three-tab shell:
//
//   Tab bar (y 0–30): [← Menu] | Opponents | Moves | Items
//   Content panel (y 30–480): swaps based on active tab
//
// Opponents tab — unified HP-sorted list of all opponents (professors + students)
// Moves tab    — launches MoveKioskScene as overlay
// Items tab    — launches ItemKioskScene as overlay

import * as engine from '../engine.js';
import { professors } from '../data/professors.js';
import { studentNPCs } from '../data/students.js';

// ── Tab bar ──────────────────────────────────────────────────────────────────

const TAB_H      = 30;   // height of the tab bar
const MENU_BTN_W = 70;   // width reserved for ← Menu button (left-aligned)

// Three equal tabs filling the remaining 330 px after the menu slot
const TAB_W   = 110;
const TAB_CENTERS = [
  MENU_BTN_W + TAB_W * 0 + TAB_W / 2,  // x = 125
  MENU_BTN_W + TAB_W * 1 + TAB_W / 2,  // x = 235
  MENU_BTN_W + TAB_W * 2 + TAB_W / 2,  // x = 345
];
const TAB_LABELS = ['Opponents', 'Moves', 'Items'];
const TAB_KEYS   = ['opponents', 'moves', 'items'];

// ── Opponents list layout ─────────────────────────────────────────────────────

const OPP_COL_X      = 200;
const OPP_BTN_W      = 340;
const BTN_H          =  34;
const BTN_Y0         = TAB_H + 54; // first button centre within content panel
const BTN_GAP        =  44;
const OPPS_PER_PAGE  =   8;

export default class BattleModeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OverworldScene' }); // key must match BattleScene's wake/stop calls
  }

  create(data) {
    this._studPage     = 0;
    this._activeTab    = 'opponents';
    this._fromMainMenu = !!(data && data.fromMainMenu);
    this._pendingUnlock = null;
    engine.init();

    if (!this._fromMainMenu) {
      this.scene.launch('AudioScene');
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
    }

    this._buildUI();
  }

  wake() {
    this._studPage  = 0;
    this._activeTab = 'opponents';
    engine.init();
    const audio = this.scene.get('AudioScene');
    if (audio) {
      audio.stop();
      audio.switchTo('intro_credits');
    }
    this._buildUI();
  }

  _buildUI() {
    this.children.removeAll(true);

    // Full background
    this.add.rectangle(200, 240, 400, 480, 0x1a1a2e);

    this._buildTabBar();
    this._buildTabContent();
  }

  // ── Tab bar ────────────────────────────────────────────────────────────────

  _buildTabBar() {
    // Tab bar background strip
    this.add.rectangle(200, TAB_H / 2, 400, TAB_H, 0x0e0e1f);

    // ← Menu button — always in the tab bar row when entered from main menu
    if (this._fromMainMenu) {
      const bg = this.add.rectangle(MENU_BTN_W / 2, TAB_H / 2, MENU_BTN_W, TAB_H, 0x2a2a4a)
        .setInteractive({ useHandCursor: true });
      this.add.text(MENU_BTN_W / 2, TAB_H / 2, '← Menu', {
        fontSize: '11px', color: '#ccccff', fontFamily: 'monospace',
      }).setOrigin(0.5);
      bg.on('pointerover',  () => bg.setFillStyle(0x3a3a6a));
      bg.on('pointerout',   () => bg.setFillStyle(0x2a2a4a));
      bg.on('pointerdown',  () => {
        this.scene.sleep('OverworldScene');
        this.scene.wake('MainMenuScene');
      });
    }

    // Three tab buttons
    TAB_KEYS.forEach((key, i) => {
      const isActive = this._activeTab === key;
      const x        = TAB_CENTERS[i];
      const bgColor  = isActive ? 0x3a3a6a : 0x1e1e38;
      const txtColor = isActive ? '#ffffff' : '#8888aa';

      const bg = this.add.rectangle(x, TAB_H / 2, TAB_W, TAB_H, bgColor)
        .setInteractive({ useHandCursor: true });

      this.add.text(x, TAB_H / 2, TAB_LABELS[i], {
        fontSize: '11px', color: txtColor, fontFamily: 'monospace',
      }).setOrigin(0.5);

      // Active-tab underline
      if (isActive) {
        this.add.rectangle(x, TAB_H - 2, TAB_W, 2, 0x6666ff);
      }

      bg.on('pointerover', () => { if (!isActive) bg.setFillStyle(0x2a2a4a); });
      bg.on('pointerout',  () => { if (!isActive) bg.setFillStyle(0x1e1e38); });
      bg.on('pointerdown', () => {
        if (key === 'moves') {
          this.scene.launch('MoveKioskScene', {});
          return;
        }
        if (key === 'items') {
          this.scene.launch('ItemKioskScene', {});
          return;
        }
        if (this._activeTab !== key) {
          this._activeTab = key;
          this._studPage  = 0;
          this._buildUI();
        }
      });
    });

    // Separator line below tab bar
    this.add.rectangle(200, TAB_H, 400, 1, 0x333355);
  }

  // ── Tab content dispatcher ─────────────────────────────────────────────────

  _buildTabContent() {
    if (this._activeTab === 'opponents') { this._buildOpponentsTab(); return; }
    if (this._activeTab === 'moves')     { this._buildMovesTab();     return; }
    if (this._activeTab === 'items')     { this._buildItemsTab();     return; }
  }

  // ── Opponents tab ──────────────────────────────────────────────────────────

  _buildOpponentsTab() {
    // Unified HP-sorted list of all opponents
    const allOpponents = [
      ...professors.map(p => ({ name: p.name, hp: p.hp, tag: 'prof',    id: p.id, opponentType: 'professor' })),
      ...studentNPCs.map(s => ({ name: s.name, hp: s.hp, tag: 'student', id: s.id, opponentType: 'student'   })),
    ].sort((a, b) => a.hp - b.hp);

    const totalPages = Math.ceil(allOpponents.length / OPPS_PER_PAGE);
    const pageStart  = this._studPage * OPPS_PER_PAGE;
    const pageSlice  = allOpponents.slice(pageStart, pageStart + OPPS_PER_PAGE);

    this.add.text(200, TAB_H + 16, 'select opponent to battle', {
      fontSize: '10px', color: '#666688', fontFamily: 'monospace',
    }).setOrigin(0.5);

    pageSlice.forEach((opp, i) => {
      const rank = pageStart + i + 1;
      const y    = BTN_Y0 + i * BTN_GAP;
      this._makeButton(OPP_COL_X, y, OPP_BTN_W, BTN_H,
        opp.name,
        `${opp.tag}  —  ${opp.hp} HP`,
        `#${rank}`,
        () => this._startBattle(
          opp.opponentType === 'professor'
            ? { opponentType: 'professor', professorId: opp.id }
            : { opponentType: 'student',   studentId:   opp.id }
        )
      );
    });

    const PAGE_Y = 462;
    this.add.text(200, PAGE_Y, `${this._studPage + 1} / ${totalPages}`, {
      fontSize: '11px', color: '#8888aa', fontFamily: 'monospace',
    }).setOrigin(0.5);

    if (this._studPage > 0) {
      this._makeNavButton(200 - 60, PAGE_Y, 'Prev',
        () => { this._studPage -= 1; this._buildUI(); });
    }
    if (this._studPage < totalPages - 1) {
      this._makeNavButton(200 + 60, PAGE_Y, 'Next',
        () => { this._studPage += 1; this._buildUI(); });
    }
  }

  // ── Moves tab (placeholder — implemented in test_project-zt8) ─────────────

  _buildMovesTab() {
    this.add.text(200, 255, 'Move Kiosk', {
      fontSize: '14px', color: '#aaaacc', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.add.text(200, 280, 'coming soon', {
      fontSize: '11px', color: '#555577', fontFamily: 'monospace',
    }).setOrigin(0.5);
  }

  // ── Items tab (placeholder — implemented in test_project-dlo) ─────────────

  _buildItemsTab() {
    this.add.text(200, 255, 'Item Kiosk', {
      fontSize: '14px', color: '#aaaacc', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.add.text(200, 280, 'coming soon', {
      fontSize: '11px', color: '#555577', fontFamily: 'monospace',
    }).setOrigin(0.5);
  }

  // ── Shared button helpers ──────────────────────────────────────────────────

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

  // ── Battle launch ──────────────────────────────────────────────────────────

  _startBattle(data) {
    if (this._pendingUnlock) {
      this.sound.off('unlocked', this._pendingUnlock);
      this._pendingUnlock = null;
    }
    this.scene.launch('BattleScene', data);
    this.scene.sleep('OverworldScene');
  }
}
