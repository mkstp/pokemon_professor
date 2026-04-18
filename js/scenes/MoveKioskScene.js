// MoveKioskScene.js — move loadout manager
//
// Launched from the overworld (trigger tracked in issue test_project-yys).
// Displays all moves in the player's learnedMoves pool and lets them assign
// up to 4 to their active battle loadout. Saves to engine state on exit.
//
// Canvas: 400×400 px.
// Depends on: engine.js (state reads/writes), data/moves.js

import * as engine        from '../engine.js';
import { playerMoves, professorMoves, npcMoves } from '../data/moves.js';

// Unified move lookup across all three tables. IDs are globally unique.
const ALL_MOVE_MAP = Object.fromEntries(
  [...professorMoves, ...npcMoves, ...playerMoves].map(m => [m.id, m])
);

// ── Layout constants (canvas pixels) ─────────────────────────────────────────

const CANVAS_W = 400;
const CANVAS_H = 400;

// Header row: title + active counter
const HEADER_Y = 20;

// Active slot strip: 4 boxes showing current loadout
const SLOT_STRIP_Y   = 60;
const SLOT_STRIP_H   = 36;
const SLOT_W         = 90;
const SLOT_GAP       = 5;
const SLOT_Y_TOP     = SLOT_STRIP_Y - SLOT_STRIP_H / 2 + 2;

// Divider between slot strip and move list
const DIVIDER_Y = 82;

// Move list: sliding visible window
const LIST_Y0      = 93;
const LIST_STEP    = 28;
const VISIBLE_ROWS = 8; // max rows shown at once; fits in 241 px list area (8 × 28 = 224 px)

// Description area below the list
const DESC_Y = 334;

// Footer: keyboard hints
const FOOTER_Y = 386;

// ── Scene ─────────────────────────────────────────────────────────────────────

export default class MoveKioskScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MoveKioskScene' });
  }

  // Receives optional onClose callback from the launching scene.
  init(data) {
    this.onClose = data.onClose || null;
  }

  create() {
    const state = engine.getState();
    this.learnedMoves  = state.learnedMoves.map(id => ALL_MOVE_MAP[id]).filter(Boolean);
    this.activeMoves   = [...state.activeMoves]; // local copy; written to engine on exit
    this.cursor        = 0;
    this.scrollOffset  = 0;

    this._buildUI();
    this._refresh();

    const keys = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.UP,
      down:  Phaser.Input.Keyboard.KeyCodes.DOWN,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      esc:   Phaser.Input.Keyboard.KeyCodes.ESC,
    });

    keys.up.on('down',    () => this._moveCursor(-1));
    keys.down.on('down',  () => this._moveCursor(1));
    keys.enter.on('down', () => this._toggleCurrent());
    keys.space.on('down', () => this._toggleCurrent());
    keys.esc.on('down',   () => this._confirmAndExit());
  }

  // ── UI construction ─────────────────────────────────────────────────────────

  _buildUI() {
    // Parchment background
    this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0xf0e8d0);

    // Slot strip background
    this.add.rectangle(CANVAS_W / 2, SLOT_STRIP_Y, CANVAS_W, SLOT_STRIP_H, 0xd8cbb0);

    // Title
    this.add.text(CANVAS_W / 2, HEADER_Y, 'MOVE KIOSK', {
      fontSize: '14px', fill: '#222222', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Active counter — updated each refresh
    this.activeCountText = this.add.text(CANVAS_W - 8, HEADER_Y, '', {
      fontSize: '11px', fill: '#226622', fontFamily: 'monospace',
    }).setOrigin(1, 0.5);

    // Slot graphics and labels — refreshed each time loadout changes
    this.slotGraphics = this.add.graphics();
    this.slotTexts    = Array.from({ length: 4 }, (_, i) => {
      const cx = 8 + i * (SLOT_W + SLOT_GAP) + SLOT_W / 2;
      return this.add.text(cx, SLOT_STRIP_Y, '', {
        fontSize: '9px', fill: '#226622', fontFamily: 'monospace',
        wordWrap: { width: SLOT_W - 6 },
      }).setOrigin(0.5);
    });

    // Divider
    const divider = this.add.graphics();
    divider.lineStyle(1, 0x998877, 1);
    divider.lineBetween(0, DIVIDER_Y, CANVAS_W, DIVIDER_Y);

    // Move list rows — fixed pool of VISIBLE_ROWS slots; content shifts with scrollOffset
    this.rowTexts = Array.from({ length: VISIBLE_ROWS }, (_, i) =>
      this.add.text(10, LIST_Y0 + i * LIST_STEP, '', {
        fontSize: '12px', fill: '#222266', fontFamily: 'monospace',
      })
    );

    // Scroll indicator: shows ▲ / ▼ / ▲▼ when items exist above or below the window
    this.scrollIndicator = this.add.text(390, LIST_Y0 + (VISIBLE_ROWS / 2) * LIST_STEP, '', {
      fontSize: '10px', fill: '#998877', fontFamily: 'monospace',
    }).setOrigin(1, 0.5);

    // Description of the currently highlighted move
    this.descText = this.add.text(10, DESC_Y, '', {
      fontSize: '11px', fill: '#443300', fontFamily: 'monospace',
      wordWrap: { width: 380 },
    });

    // Footer hints
    this.footerText = this.add.text(CANVAS_W / 2, FOOTER_Y, '', {
      fontSize: '10px', fill: '#222222', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this._fullWarning = false;
  }

  // ── State-to-display sync ────────────────────────────────────────────────────

  _refresh() {
    // Active counter
    this.activeCountText.setText(`Active: ${this.activeMoves.length}/4`);

    // Slot strip boxes
    this.slotGraphics.clear();
    for (let i = 0; i < 4; i++) {
      const x          = 8 + i * (SLOT_W + SLOT_GAP);
      const isOccupied = i < this.activeMoves.length;
      const fillColor  = isOccupied ? 0xd0e8d0 : 0xe8e0d0;
      const lineColor  = isOccupied ? 0x226622 : 0x999988;

      this.slotGraphics.fillStyle(fillColor, 1);
      this.slotGraphics.fillRect(x, SLOT_Y_TOP, SLOT_W, SLOT_STRIP_H - 4);
      this.slotGraphics.lineStyle(1, lineColor, 1);
      this.slotGraphics.strokeRect(x, SLOT_Y_TOP, SLOT_W, SLOT_STRIP_H - 4);

      if (isOccupied) {
        const move = ALL_MOVE_MAP[this.activeMoves[i]];
        this.slotTexts[i].setText(move ? move.name : '?').setStyle({ fill: '#226622' });
      } else {
        this.slotTexts[i].setText('—').setStyle({ fill: '#999988' });
      }
    }

    // Move list rows — render only the visible window [scrollOffset, scrollOffset + VISIBLE_ROWS)
    this.rowTexts.forEach((rowText, rowSlot) => {
      const moveIdx = this.scrollOffset + rowSlot;
      if (moveIdx >= this.learnedMoves.length) {
        rowText.setText('').setVisible(false);
        return;
      }
      rowText.setVisible(true);
      const move     = this.learnedMoves[moveIdx];
      const slotIdx  = this.activeMoves.indexOf(move.id);
      const isActive = slotIdx !== -1;
      const cursor   = moveIdx === this.cursor ? '>' : ' ';
      const tag      = isActive ? `[${slotIdx + 1}]` : '[○]';
      // Fixed-width name column (18 chars) keeps DMG aligned
      const name     = move.name.length > 18 ? move.name.slice(0, 17) + '…' : move.name.padEnd(18);
      const dmg      = move.damage > 0 ? `DMG:${move.damage}` : 'DMG: —';
      const line     = `${cursor} ${tag} ${name} ${dmg}`;
      const color    = isActive ? '#226622' : (moveIdx === this.cursor ? '#222266' : '#555544');
      rowText.setText(line).setStyle({ fill: color });
    });

    // Scroll indicator
    const hasAbove = this.scrollOffset > 0;
    const hasBelow = this.scrollOffset + VISIBLE_ROWS < this.learnedMoves.length;
    this.scrollIndicator.setText(
      hasAbove && hasBelow ? '▲\n▼' : hasAbove ? '▲' : hasBelow ? '▼' : ''
    );

    // Description for highlighted move
    const selected = this.learnedMoves[this.cursor];
    this.descText.setText(selected ? selected.description : '');

    // Footer — not overwritten if a full-warning timer is running
    if (!this._fullWarning) {
      this.footerText.setText('ENTER: toggle  ESC: save & exit').setStyle({ fill: '#222222' });
    }
  }

  // ── Input handlers ───────────────────────────────────────────────────────────

  _moveCursor(dir) {
    const n = this.learnedMoves.length;
    if (n === 0) return;
    this.cursor = (this.cursor + dir + n) % n;
    // Keep cursor inside the visible window
    if (this.cursor < this.scrollOffset) {
      this.scrollOffset = this.cursor;
    } else if (this.cursor >= this.scrollOffset + VISIBLE_ROWS) {
      this.scrollOffset = this.cursor - VISIBLE_ROWS + 1;
    }
    this._refresh();
  }

  _toggleCurrent() {
    const move = this.learnedMoves[this.cursor];
    if (!move) return;

    const idx = this.activeMoves.indexOf(move.id);
    if (idx !== -1) {
      // Already active — remove from loadout
      this.activeMoves.splice(idx, 1);
    } else if (this.activeMoves.length < 4) {
      // Inactive and space available — add to loadout
      this.activeMoves.push(move.id);
    } else {
      // Loadout full — flash warning and do not modify
      this._showFullWarning();
      return;
    }

    this._refresh();
  }

  // Flashes a "Loadout full!" message in the footer for 1200 ms.
  _showFullWarning() {
    this._fullWarning = true;
    this.footerText.setText('Loadout full!').setStyle({ fill: '#cc2222' });
    this.time.delayedCall(1200, () => {
      this._fullWarning = false;
      this.footerText.setText('ENTER: toggle  ESC: save & exit').setStyle({ fill: '#222222' });
    });
  }

  // Saves the local loadout to engine state, fires the callback, and stops.
  _confirmAndExit() {
    engine.setActiveMoves(this.activeMoves);
    if (this.onClose) this.onClose();
    this.scene.stop('MoveKioskScene');
  }
}
