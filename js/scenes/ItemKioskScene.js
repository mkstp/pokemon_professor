// ItemKioskScene.js — item loadout manager
//
// Two views, toggled with TAB:
//   ITEMS      — consumable catalogue + 4-slot battle loadout
//   COLLECTION — 5×2 sprite gallery of all collectibles (badges, upgrades, key items)
//
// Launched as an overlay from BattleModeScene's Items tab.
// ESC saves loadout to engine and stops the scene.
//
// Canvas: 400×480 px.
// Depends on: engine.js, data/items.js

import * as engine from '../engine.js';
import { items }   from '../data/items.js';

// ── Layout: shared ────────────────────────────────────────────────────────────

const CANVAS_W = 400;
const CANVAS_H = 480;
const HEADER_Y = 18;
const FOOTER_Y = 462;

// ── Layout: ITEMS view ────────────────────────────────────────────────────────

const SLOT_STRIP_Y = 52;
const SLOT_STRIP_H = 28;
const SLOT_W       = 84;
const SLOT_GAP     = 5;
const SLOT_Y_TOP   = SLOT_STRIP_Y - SLOT_STRIP_H / 2 + 2;
const DIVIDER_Y    = 74;
const LIST_Y0      = 84;
const LIST_STEP    = 24;
const VISIBLE_ROWS = 11; // expanded from 9; passives section moved to COLLECTION view
const ITEMS_DESC_Y = LIST_Y0 + VISIBLE_ROWS * LIST_STEP + 10; // ~358

// ── Layout: COLLECTION view ───────────────────────────────────────────────────

const CELL_W       = 80;  // CANVAS_W / 5
const CELL_H       = 100;
const GRID_ROW_GAP = 8;
const GRID_Y0      = 50;
const SPRITE_SIZE  = 48;
const SPRITE_X_OFF = (CELL_W - SPRITE_SIZE) / 2; // 16 — centres sprite in cell
const SPRITE_Y_OFF = 10;
const NAME_Y_OFF   = SPRITE_Y_OFF + SPRITE_SIZE + 6; // 64
const COLL_DESC_Y  = GRID_Y0 + 2 * CELL_H + GRID_ROW_GAP + 16; // ~274

// Collectibles in display order: row 1 = badges (5), row 2 = key items + upgrades (5)
const COLLECTIBLE_IDS = [
  'meal_lovers_badge',
  'music_league_badge',
  'dialecters_badge',
  'token_of_appreciation_badge',
  'community_badge',
  'id_card',
  'secret_code',
  'star_gourd',
  'emotional_support_pickle',
  'campus_swag_bag',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtEffect({ action, value }) {
  if (action === 'restore_hp')    return value === null ? 'full restore' : `+${value} HP`;
  if (action === 'boost_attack')  return `+${value} ATK`;
  if (action === 'boost_defense') return `+${value} DEF`;
  if (action === 'boost_exp')     return `+${value} XP`;
  return '';
}

function trunc(str, len) {
  return str.length > len ? str.slice(0, len - 1) + '…' : str;
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
    this.activeItems  = engine.getActiveItems();
    this.cursor       = 0;
    this.scrollOffset = 0;
    this.collCursor   = 0; // collection view cursor, 0–9
    this.view         = 'items';

    // Shared background and footer (always visible)
    this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0xf0e8d0);
    this.footerText = this.add.text(CANVAS_W / 2, FOOTER_Y, '', {
      fontSize: '10px', fill: '#222222', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this._buildItemsUI();
    this._buildCollectionUI();
    this._setView('items');

    const keys = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.UP,
      down:  Phaser.Input.Keyboard.KeyCodes.DOWN,
      left:  Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      esc:   Phaser.Input.Keyboard.KeyCodes.ESC,
      tab:   Phaser.Input.Keyboard.KeyCodes.TAB,
    });

    keys.up.on('down',    () => this._onUp());
    keys.down.on('down',  () => this._onDown());
    keys.left.on('down',  () => this._onLeft());
    keys.right.on('down', () => this._onRight());
    keys.enter.on('down', () => this._onConfirm());
    keys.space.on('down', () => this._onConfirm());
    keys.esc.on('down',   () => this._confirmAndExit());
    keys.tab.on('down',   () => this._toggleView());
  }

  // ── ITEMS view construction ──────────────────────────────────────────────────

  _buildItemsUI() {
    this._itemsObjs = [];
    const t = obj => { this._itemsObjs.push(obj); return obj; };

    t(this.add.rectangle(CANVAS_W / 2, SLOT_STRIP_Y, CANVAS_W, SLOT_STRIP_H, 0xd8cbb0));
    t(this.add.text(CANVAS_W / 2, HEADER_Y, 'ITEM KIOSK', {
      fontSize: '14px', fill: '#222222', fontFamily: 'monospace',
    }).setOrigin(0.5));
    t(this.add.text(CANVAS_W - 8, HEADER_Y, 'ITEMS  |  collection', {
      fontSize: '9px', fill: '#886644', fontFamily: 'monospace',
    }).setOrigin(1, 0.5));

    this.activeCountText = t(this.add.text(8, HEADER_Y, '', {
      fontSize: '11px', fill: '#226622', fontFamily: 'monospace',
    }).setOrigin(0, 0.5));

    this.slotGraphics = t(this.add.graphics());
    this.slotTexts = Array.from({ length: 4 }, (_, i) => {
      const cx = 8 + i * (SLOT_W + SLOT_GAP) + SLOT_W / 2;
      return t(this.add.text(cx, SLOT_STRIP_Y, '', {
        fontSize: '8px', fill: '#226622', fontFamily: 'monospace',
        wordWrap: { width: SLOT_W - 6 },
      }).setOrigin(0.5));
    });

    const div = t(this.add.graphics());
    div.lineStyle(1, 0x998877, 1);
    div.lineBetween(0, DIVIDER_Y, CANVAS_W, DIVIDER_Y);

    this.rowTexts = Array.from({ length: VISIBLE_ROWS }, (_, i) =>
      t(this.add.text(10, LIST_Y0 + i * LIST_STEP, '', {
        fontSize: '11px', fill: '#222266', fontFamily: 'monospace',
      }))
    );

    this.scrollIndicator = t(this.add.text(390, LIST_Y0 + (VISIBLE_ROWS / 2) * LIST_STEP, '', {
      fontSize: '10px', fill: '#998877', fontFamily: 'monospace',
    }).setOrigin(1, 0.5));

    this.descText = t(this.add.text(10, ITEMS_DESC_Y, '', {
      fontSize: '11px', fill: '#443300', fontFamily: 'monospace',
      wordWrap: { width: 380 },
    }));

    this._fullWarning = false;
  }

  // ── COLLECTION view construction ─────────────────────────────────────────────

  _buildCollectionUI() {
    this._collObjs = [];
    const t = obj => { this._collObjs.push(obj); return obj; };

    t(this.add.text(CANVAS_W / 2, HEADER_Y, 'COLLECTION', {
      fontSize: '14px', fill: '#222222', fontFamily: 'monospace',
    }).setOrigin(0.5));
    t(this.add.text(CANVAS_W - 8, HEADER_Y, 'items  |  COLLECTION', {
      fontSize: '9px', fill: '#886644', fontFamily: 'monospace',
    }).setOrigin(1, 0.5));

    // Row labels
    t(this.add.text(4, GRID_Y0 - 14, 'BADGES', {
      fontSize: '8px', fill: '#998877', fontFamily: 'monospace',
    }));
    t(this.add.text(4, GRID_Y0 + CELL_H + GRID_ROW_GAP - 14, 'COLLECTIBLES', {
      fontSize: '8px', fill: '#998877', fontFamily: 'monospace',
    }));

    // Cell graphics (sprite placeholders + cursor highlight drawn here each refresh)
    this.collCellGfx   = t(this.add.graphics());
    this.collCursorGfx = t(this.add.graphics());

    // Name text for each cell — positioned relative to cell top-left
    this.collNameTexts = COLLECTIBLE_IDS.map((_, i) => {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const cx  = col * CELL_W + CELL_W / 2;
      const cy  = GRID_Y0 + row * (CELL_H + GRID_ROW_GAP) + NAME_Y_OFF;
      return t(this.add.text(cx, cy, '', {
        fontSize: '8px', fill: '#ccbbaa', fontFamily: 'monospace',
        align: 'center', wordWrap: { width: CELL_W - 6 },
      }).setOrigin(0.5, 0));
    });

    // Description panel for selected collectible
    this.collItemName   = t(this.add.text(10, COLL_DESC_Y, '', {
      fontSize: '12px', fill: '#222222', fontFamily: 'monospace',
    }));
    this.collItemDesc   = t(this.add.text(10, COLL_DESC_Y + 20, '', {
      fontSize: '10px', fill: '#554433', fontFamily: 'monospace',
      wordWrap: { width: 380 },
    }));
    this.collItemStatus = t(this.add.text(10, COLL_DESC_Y + 64, '', {
      fontSize: '10px', fill: '#226622', fontFamily: 'monospace',
    }));
  }

  // ── View switching ────────────────────────────────────────────────────────────

  _setView(view) {
    this.view = view;
    this._itemsObjs.forEach(o => o.setVisible(view === 'items'));
    this._collObjs.forEach(o => o.setVisible(view === 'collection'));
    if (view === 'items') {
      this._fullWarning = false;
      this.footerText.setText('ENTER: toggle  TAB: collection  ESC: save & exit').setStyle({ fill: '#222222' });
      this._refresh();
    } else {
      this.footerText.setText('← →: browse  ↑ ↓: row  TAB: items  ESC: exit').setStyle({ fill: '#222222' });
      this._refreshCollection();
    }
  }

  _toggleView() {
    this._setView(this.view === 'items' ? 'collection' : 'items');
  }

  // ── Input routing ─────────────────────────────────────────────────────────────

  _onUp() {
    if (this.view === 'items') {
      this._moveCursor(-1);
    } else {
      this.collCursor = Math.max(0, this.collCursor - 5);
      this._refreshCollection();
    }
  }

  _onDown() {
    if (this.view === 'items') {
      this._moveCursor(1);
    } else {
      this.collCursor = Math.min(COLLECTIBLE_IDS.length - 1, this.collCursor + 5);
      this._refreshCollection();
    }
  }

  _onLeft() {
    if (this.view === 'collection') {
      this.collCursor = Math.max(0, this.collCursor - 1);
      this._refreshCollection();
    }
  }

  _onRight() {
    if (this.view === 'collection') {
      this.collCursor = Math.min(COLLECTIBLE_IDS.length - 1, this.collCursor + 1);
      this._refreshCollection();
    }
  }

  _onConfirm() {
    if (this.view === 'items') this._toggleCurrent();
  }

  // ── Refresh: ITEMS view ──────────────────────────────────────────────────────

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
      const name     = trunc(item.name, 20).padEnd(20);
      const eff      = fmtEffect(item.effect);
      rowText
        .setText(`${cursor} ${tag} ${name} ${eff}`)
        .setStyle({ fill: spent      ? '#aaaaaa'
                        : isActive   ? '#226622'
                        : idx === this.cursor ? '#222266'
                        : '#555544' });
    });

    // Scroll indicator
    const hasAbove = this.scrollOffset > 0;
    const hasBelow = this.scrollOffset + VISIBLE_ROWS < this.consumables.length;
    this.scrollIndicator.setText(
      hasAbove && hasBelow ? '▲\n▼' : hasAbove ? '▲' : hasBelow ? '▼' : ''
    );

    // Description for highlighted item
    const sel = this.consumables[this.cursor];
    this.descText.setText(sel ? (sel.flavourText || '') : '');

    if (!this._fullWarning) {
      this.footerText.setText('ENTER: toggle  TAB: collection  ESC: save & exit').setStyle({ fill: '#222222' });
    }
  }

  // ── Refresh: COLLECTION view ─────────────────────────────────────────────────

  _refreshCollection() {
    this.collCellGfx.clear();
    this.collCursorGfx.clear();

    COLLECTIBLE_IDS.forEach((id, i) => {
      const col     = i % 5;
      const row     = Math.floor(i / 5);
      const cellX   = col * CELL_W;
      const cellY   = GRID_Y0 + row * (CELL_H + GRID_ROW_GAP);
      const spriteX = cellX + SPRITE_X_OFF;
      const spriteY = cellY + SPRITE_Y_OFF;
      const owned   = engine.hasItem(id);

      // Cursor highlight
      if (i === this.collCursor) {
        this.collCursorGfx.lineStyle(2, 0x886644, 1);
        this.collCursorGfx.strokeRect(cellX + 2, cellY + 2, CELL_W - 4, CELL_H - 4);
      }

      // Sprite placeholder rect — swap for this.add.image() once assets are loaded.
      // Acquired: warm gold fill. Unacquired: dark shadow fill.
      this.collCellGfx.fillStyle(owned ? 0xd4a820 : 0x2a2520, owned ? 1 : 0.85);
      this.collCellGfx.fillRect(spriteX, spriteY, SPRITE_SIZE, SPRITE_SIZE);
      this.collCellGfx.lineStyle(1, owned ? 0xaa8800 : 0x443c36, 1);
      this.collCellGfx.strokeRect(spriteX, spriteY, SPRITE_SIZE, SPRITE_SIZE);

      // Cell name
      const item = items.find(it => it.id === id);
      this.collNameTexts[i]
        .setText(item ? trunc(item.name, 10) : id)
        .setStyle({ fill: owned ? '#eedd88' : '#554433' });
    });

    // Description panel for cursor item
    const curId   = COLLECTIBLE_IDS[this.collCursor];
    const curItem = items.find(it => it.id === curId);
    const owned   = engine.hasItem(curId);
    if (curItem) {
      this.collItemName
        .setText(curItem.name)
        .setStyle({ fill: owned ? '#ddcc55' : '#998877' });
      this.collItemDesc.setText(owned ? (curItem.flavourText || '') : '???');
      this.collItemStatus
        .setText(owned ? '✓ Acquired' : 'Not yet acquired')
        .setStyle({ fill: owned ? '#226622' : '#775544' });
    }
  }

  // ── ITEMS view input handlers ────────────────────────────────────────────────

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
      this.footerText.setText('ENTER: toggle  TAB: collection  ESC: save & exit').setStyle({ fill: '#222222' });
    });
  }

  _confirmAndExit() {
    engine.getActiveItems().forEach(id => engine.unequipItem(id));
    this.activeItems.forEach(id => engine.equipItem(id));
    if (this.onClose) this.onClose();
    this.scene.stop('ItemKioskScene');
  }
}
