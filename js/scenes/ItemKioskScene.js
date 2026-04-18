// ItemKioskScene.js — item loadout manager
//
// Launched as an overlay from BattleModeScene's Items tab.
// Shows the full consumable catalogue; player slots up to 4 items.
// Spent (non-reloadable, repeatableSource=false) items are greyed and unselectable.
// Non-consumable owned items are shown below as read-only always-active passives.
// ESC saves loadout to engine and stops the scene.
//
// Canvas: 400×480 px.
// Depends on: engine.js (getAllConsumables, equipItem, unequipItem, getActiveItems,
//             isItemSpent, getState), data/items.js

import * as engine from '../engine.js';
import { items }   from '../data/items.js';

// ── Layout constants ──────────────────────────────────────────────────────────

const CANVAS_W = 400;
const CANVAS_H = 480;

const HEADER_Y     = 18;
const SLOT_STRIP_Y = 52;
const SLOT_STRIP_H = 28;
const SLOT_W       = 84;
const SLOT_GAP     = 5;
const SLOT_Y_TOP   = SLOT_STRIP_Y - SLOT_STRIP_H / 2 + 2;
const DIVIDER_Y    = 74;
const LIST_Y0      = 84;
const LIST_STEP    = 24;
const VISIBLE_ROWS = 9;

const PASSIVE_HDR_Y = LIST_Y0 + VISIBLE_ROWS * LIST_STEP + 8; // ~308
const PASSIVE_Y0    = PASSIVE_HDR_Y + 18;
const MAX_PASSIVES  = 3;
const DESC_Y        = PASSIVE_Y0 + MAX_PASSIVES * 20 + 6;     // ~392
const FOOTER_Y      = 462;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtEffect({ action, value }) {
  if (action === 'restore_hp')    return value === null ? 'full restore' : `+${value} HP`;
  if (action === 'boost_attack')  return `+${value} ATK`;
  if (action === 'boost_defense') return `+${value} DEF`;
  if (action === 'boost_exp')     return `+${value} XP`;
  return '';
}

// ── Scene ─────────────────────────────────────────────────────────────────────

export default class ItemKioskScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ItemKioskScene' });
  }

  init(data) {
    this.onClose = (data && data.onClose) || null;
  }

  create() {
    this.consumables  = engine.getAllConsumables();
    this.activeItems  = engine.getActiveItems(); // local copy; synced to engine on exit
    this.cursor       = 0;
    this.scrollOffset = 0;

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
    this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0xf0e8d0);
    this.add.rectangle(CANVAS_W / 2, SLOT_STRIP_Y, CANVAS_W, SLOT_STRIP_H, 0xd8cbb0);

    this.add.text(CANVAS_W / 2, HEADER_Y, 'ITEM KIOSK', {
      fontSize: '14px', fill: '#222222', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.activeCountText = this.add.text(CANVAS_W - 8, HEADER_Y, '', {
      fontSize: '11px', fill: '#226622', fontFamily: 'monospace',
    }).setOrigin(1, 0.5);

    this.slotGraphics = this.add.graphics();
    this.slotTexts = Array.from({ length: 4 }, (_, i) => {
      const cx = 8 + i * (SLOT_W + SLOT_GAP) + SLOT_W / 2;
      return this.add.text(cx, SLOT_STRIP_Y, '', {
        fontSize: '8px', fill: '#226622', fontFamily: 'monospace',
        wordWrap: { width: SLOT_W - 6 },
      }).setOrigin(0.5);
    });

    const divider = this.add.graphics();
    divider.lineStyle(1, 0x998877, 1);
    divider.lineBetween(0, DIVIDER_Y, CANVAS_W, DIVIDER_Y);

    this.rowTexts = Array.from({ length: VISIBLE_ROWS }, (_, i) =>
      this.add.text(10, LIST_Y0 + i * LIST_STEP, '', {
        fontSize: '11px', fill: '#222266', fontFamily: 'monospace',
      })
    );

    this.scrollIndicator = this.add.text(390, LIST_Y0 + (VISIBLE_ROWS / 2) * LIST_STEP, '', {
      fontSize: '10px', fill: '#998877', fontFamily: 'monospace',
    }).setOrigin(1, 0.5);

    // Passives section
    this.add.text(10, PASSIVE_HDR_Y, 'PASSIVE ITEMS', {
      fontSize: '10px', fill: '#886644', fontFamily: 'monospace',
    });
    const passiveDivider = this.add.graphics();
    passiveDivider.lineStyle(1, 0x998877, 0.5);
    passiveDivider.lineBetween(0, PASSIVE_HDR_Y + 12, CANVAS_W, PASSIVE_HDR_Y + 12);

    this.passiveTexts = Array.from({ length: MAX_PASSIVES }, (_, i) =>
      this.add.text(10, PASSIVE_Y0 + i * 20, '', {
        fontSize: '10px', fill: '#886644', fontFamily: 'monospace',
      })
    );

    this.descText = this.add.text(10, DESC_Y, '', {
      fontSize: '11px', fill: '#443300', fontFamily: 'monospace',
      wordWrap: { width: 380 },
    });

    this.footerText = this.add.text(CANVAS_W / 2, FOOTER_Y, '', {
      fontSize: '10px', fill: '#222222', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this._fullWarning = false;
  }

  // ── State-to-display sync ────────────────────────────────────────────────────

  _refresh() {
    this.activeCountText.setText(`Active: ${this.activeItems.length}/4`);

    // Slot strip
    this.slotGraphics.clear();
    for (let i = 0; i < 4; i++) {
      const x          = 8 + i * (SLOT_W + SLOT_GAP);
      const isOccupied = i < this.activeItems.length;
      const fillColor  = isOccupied ? 0xd0e8d0 : 0xe8e0d0;
      const lineColor  = isOccupied ? 0x226622 : 0x999988;
      this.slotGraphics.fillStyle(fillColor, 1);
      this.slotGraphics.fillRect(x, SLOT_Y_TOP, SLOT_W, SLOT_STRIP_H - 4);
      this.slotGraphics.lineStyle(1, lineColor, 1);
      this.slotGraphics.strokeRect(x, SLOT_Y_TOP, SLOT_W, SLOT_STRIP_H - 4);
      const item = isOccupied ? items.find(it => it.id === this.activeItems[i]) : null;
      this.slotTexts[i]
        .setText(isOccupied ? (item ? item.name : '?') : '—')
        .setStyle({ fill: isOccupied ? '#226622' : '#999988' });
    }

    // Consumables list
    this.rowTexts.forEach((rowText, rowSlot) => {
      const idx = this.scrollOffset + rowSlot;
      if (idx >= this.consumables.length) { rowText.setText('').setVisible(false); return; }
      rowText.setVisible(true);
      const item     = this.consumables[idx];
      const spent    = engine.isItemSpent(item.id);
      const slotIdx  = this.activeItems.indexOf(item.id);
      const isActive = slotIdx !== -1;
      const cursor   = idx === this.cursor ? '>' : ' ';
      const tag      = isActive ? `[${slotIdx + 1}]` : (spent ? '[✗]' : '[○]');
      const name     = item.name.length > 20 ? item.name.slice(0, 19) + '…' : item.name.padEnd(20);
      const eff      = fmtEffect(item.effect);
      rowText
        .setText(`${cursor} ${tag} ${name} ${eff}`)
        .setStyle({ fill: spent     ? '#aaaaaa'
                        : isActive  ? '#226622'
                        : idx === this.cursor ? '#222266'
                        : '#555544' });
    });

    // Scroll indicator
    const hasAbove = this.scrollOffset > 0;
    const hasBelow = this.scrollOffset + VISIBLE_ROWS < this.consumables.length;
    this.scrollIndicator.setText(
      hasAbove && hasBelow ? '▲\n▼' : hasAbove ? '▲' : hasBelow ? '▼' : ''
    );

    // Passives — show upgrades (permanent stat buffs) from catalogue as always-active passives
    const passives = items.filter(it => it.category === 'upgrade');
    this.passiveTexts.forEach((t, i) => {
      if (passives.length === 0 && i === 0) { t.setText('none'); return; }
      if (i >= passives.length)             { t.setText('');     return; }
      const p   = passives[i];
      const eff = fmtEffect(p.effect);
      t.setText(`${p.name}${eff ? '  ' + eff : ''}`);
    });

    // Description for highlighted consumable
    const sel = this.consumables[this.cursor];
    this.descText.setText(sel ? (sel.flavourText || '') : '');

    if (!this._fullWarning) {
      this.footerText.setText('ENTER: toggle  ESC: save & exit').setStyle({ fill: '#222222' });
    }
  }

  // ── Input handlers ───────────────────────────────────────────────────────────

  _moveCursor(dir) {
    const n = this.consumables.length;
    if (n === 0) return;
    this.cursor = (this.cursor + dir + n) % n;
    if (this.cursor < this.scrollOffset) {
      this.scrollOffset = this.cursor;
    } else if (this.cursor >= this.scrollOffset + VISIBLE_ROWS) {
      this.scrollOffset = this.cursor - VISIBLE_ROWS + 1;
    }
    this._refresh();
  }

  _toggleCurrent() {
    const item = this.consumables[this.cursor];
    if (!item) return;
    if (engine.isItemSpent(item.id)) return;
    const idx = this.activeItems.indexOf(item.id);
    if (idx !== -1) {
      this.activeItems.splice(idx, 1);
    } else if (this.activeItems.length < 4) {
      this.activeItems.push(item.id);
    } else {
      this._showFullWarning();
      return;
    }
    this._refresh();
  }

  _showFullWarning() {
    this._fullWarning = true;
    this.footerText.setText('Loadout full!').setStyle({ fill: '#cc2222' });
    this.time.delayedCall(1200, () => {
      this._fullWarning = false;
      this.footerText.setText('ENTER: toggle  ESC: save & exit').setStyle({ fill: '#222222' });
    });
  }

  // Syncs local loadout to engine state, then stops.
  _confirmAndExit() {
    engine.getActiveItems().forEach(id => engine.unequipItem(id));
    this.activeItems.forEach(id => engine.equipItem(id));
    if (this.onClose) this.onClose();
    this.scene.stop('ItemKioskScene');
  }
}
