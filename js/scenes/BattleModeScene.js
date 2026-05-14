// BattleModeScene.js — battle mode opponent selector
//
// Registered under the key 'OverworldScene' so that BattleScene.endBattle()
// can wake it without modification.
//
// Header strip (y 0–30): [← Menu]  |  BATTLE MODE
// Content panel (y 30–480): paginated opponent list
//
// Moves/Items configuration is handled by KioskScene (press I).
// Keyboard: ↑ ↓ navigate  ← → page  Enter battle  ESC back  I menu

import * as engine from '../engine.js';
import { professors } from '../data/professors.js';
import { studentNPCs } from '../data/students.js';

const HEADER_H    = 30;
const OPP_COL_X   = 200;
const OPP_BTN_W   = 340;
const BTN_H       =  34;
const BTN_Y0      = HEADER_H + 54; // first button centre (y = 84)
const BTN_GAP     =  44;
const OPPS_PER_PAGE = 8;

export default class BattleModeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OverworldScene' }); // key must match BattleScene's wake/stop calls
  }

  create(data) {
    this._studPage      = 0;
    this._cursor        = 0;
    this._fromMainMenu  = !!(data && data.fromMainMenu);
    this._pendingUnlock = null;
    engine.init();

    this._allOpponents = [
      ...professors.map(p => ({ name: p.name, hp: p.hp, tag: 'prof',    id: p.id, opponentType: 'professor' })),
      ...studentNPCs.map(s => ({ name: s.name, hp: s.hp, tag: 'student', id: s.id, opponentType: 'student'   })),
    ].sort((a, b) => a.hp - b.hp);

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
    this._initKeyboard();
  }

  wake() {
    this._studPage = 0;
    this._cursor   = 0;
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
    this.add.rectangle(200, 240, 400, 480, 0x1a1a2e);
    this._buildHeader();
    this._buildContent();
  }

  // ── Header ────────────────────────────────────────────────────────────────

  _buildHeader() {
    this.add.rectangle(200, HEADER_H / 2, 400, HEADER_H, 0x0e0e1f);

    if (this._fromMainMenu) {
      const menuBtnW = 70;
      const bg = this.add.rectangle(menuBtnW / 2, HEADER_H / 2, menuBtnW, HEADER_H, 0x2a2a4a)
        .setInteractive({ useHandCursor: true });
      this.add.text(menuBtnW / 2, HEADER_H / 2, '← Menu', {
        fontSize: '11px', color: '#ccccff', fontFamily: 'monospace',
      }).setOrigin(0.5);
      bg.on('pointerover',  () => bg.setFillStyle(0x3a3a6a));
      bg.on('pointerout',   () => bg.setFillStyle(0x2a2a4a));
      bg.on('pointerdown',  () => this._goBack());
    }

    this.add.text(200, HEADER_H / 2, 'BATTLE MODE', {
      fontSize: '11px', color: '#8888aa', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.rectangle(200, HEADER_H, 400, 1, 0x333355);
  }

  // ── Content ───────────────────────────────────────────────────────────────

  _buildContent() {
    const totalPages = Math.ceil(this._allOpponents.length / OPPS_PER_PAGE);
    const pageStart  = this._studPage * OPPS_PER_PAGE;
    const pageSlice  = this._allOpponents.slice(pageStart, pageStart + OPPS_PER_PAGE);

    this._cursor = Math.min(this._cursor, pageSlice.length - 1);

    this.add.text(200, HEADER_H + 16, 'select opponent to battle', {
      fontSize: '10px', color: '#666688', fontFamily: 'monospace',
    }).setOrigin(0.5);

    pageSlice.forEach((opp, i) => {
      const rank = pageStart + i + 1;
      const y    = BTN_Y0 + i * BTN_GAP;
      this._makeButton(
        OPP_COL_X, y, OPP_BTN_W, BTN_H,
        opp.name,
        `${opp.tag}  —  ${opp.hp} HP`,
        `#${rank}`,
        () => this._startBattle(
          opp.opponentType === 'professor'
            ? { opponentType: 'professor', professorId: opp.id }
            : { opponentType: 'student',   studentId:   opp.id }
        ),
        i === this._cursor
      );
    });

    const PAGE_Y = 448;
    this.add.text(200, PAGE_Y, `${this._studPage + 1} / ${totalPages}`, {
      fontSize: '11px', color: '#8888aa', fontFamily: 'monospace',
    }).setOrigin(0.5);

    if (this._studPage > 0) {
      this._makeNavButton(200 - 60, PAGE_Y, '← Prev',
        () => { this._studPage -= 1; this._cursor = 0; this._buildUI(); });
    }
    if (this._studPage < totalPages - 1) {
      this._makeNavButton(200 + 60, PAGE_Y, 'Next →',
        () => { this._studPage += 1; this._cursor = 0; this._buildUI(); });
    }

    this.add.text(200, 470, '↑ ↓: navigate  ← →: page  Enter: battle  I: menu', {
      fontSize: '9px', color: '#444466', fontFamily: 'monospace',
    }).setOrigin(0.5);
  }

  // ── Keyboard ──────────────────────────────────────────────────────────────

  _initKeyboard() {
    const keys = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.UP,
      down:  Phaser.Input.Keyboard.KeyCodes.DOWN,
      left:  Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      esc:   Phaser.Input.Keyboard.KeyCodes.ESC,
    });

    const totalPages = () => Math.ceil(this._allOpponents.length / OPPS_PER_PAGE);
    const pageSlice  = () => this._allOpponents.slice(
      this._studPage * OPPS_PER_PAGE,
      this._studPage * OPPS_PER_PAGE + OPPS_PER_PAGE
    );

    keys.up.on('down', () => {
      const len = pageSlice().length;
      this._cursor = (this._cursor - 1 + len) % len;
      this._buildUI();
    });

    keys.down.on('down', () => {
      this._cursor = (this._cursor + 1) % pageSlice().length;
      this._buildUI();
    });

    keys.left.on('down', () => {
      if (this._studPage > 0) {
        this._studPage -= 1;
        this._cursor    = 0;
        this._buildUI();
      }
    });

    keys.right.on('down', () => {
      if (this._studPage < totalPages() - 1) {
        this._studPage += 1;
        this._cursor    = 0;
        this._buildUI();
      }
    });

    const confirm = () => {
      const opp = pageSlice()[this._cursor];
      if (!opp) return;
      this._startBattle(
        opp.opponentType === 'professor'
          ? { opponentType: 'professor', professorId: opp.id }
          : { opponentType: 'student',   studentId:   opp.id }
      );
    };
    keys.enter.on('down', confirm);
    keys.space.on('down', confirm);

    keys.esc.on('down', () => this._goBack());

    this.input.keyboard.on('keydown-I', () => this._openKiosk('moves'));
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  _goBack() {
    if (!this._fromMainMenu) return;
    this.scene.sleep('OverworldScene');
    this.scene.wake('MainMenuScene');
  }

  _makeButton(x, y, w, h, title, subtitle, indexLabel, onClick, isSelected = false) {
    const baseFill = isSelected ? 0x3a3a6a : 0x2a2a4a;
    const bg = this.add.rectangle(x, y, w, h, baseFill)
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
    bg.on('pointerout',   () => bg.setFillStyle(baseFill));
    bg.on('pointerdown',  onClick);
  }

  _makeNavButton(x, y, label, onClick) {
    const bg = this.add.rectangle(x, y, 76, BTN_H, 0x2a2a4a)
      .setInteractive({ useHandCursor: true });

    this.add.text(x, y, label, {
      fontSize: '12px', color: '#ccccff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    bg.on('pointerover',  () => bg.setFillStyle(0x3a3a6a));
    bg.on('pointerout',   () => bg.setFillStyle(0x2a2a4a));
    bg.on('pointerdown',  onClick);
  }

  _openKiosk(startTab) {
    this.input.keyboard.enabled = false;
    this.scene.launch('KioskScene', {
      mode: 'battle',
      startTab: startTab || 'moves',
      onClose: () => { this.input.keyboard.enabled = true; },
    });
  }

  _startBattle(data) {
    if (this._pendingUnlock) {
      this.sound.off('unlocked', this._pendingUnlock);
      this._pendingUnlock = null;
    }
    this.scene.launch('BattleScene', data);
    this.scene.sleep('OverworldScene');
  }
}
