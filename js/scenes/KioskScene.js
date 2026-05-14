// KioskScene.js — unified player menu (moves · items · collection · controls)
//
// Four tabs cycled with TAB. Opened with I from the overworld and BattleModeScene.
// ESC saves all state and exits regardless of which tab is active.
//
// Canvas: 400×480 px.
// Init params: { mode: 'battle' | 'overworld', startTab: 'moves'|'items'|'collection'|'controls', onClose }
//   battle:    all consumables available (engine.getAllConsumables())
//   overworld: only consumables the player has collected (filtered via engine.hasItem)
//
// Depends on: engine.js, data/moves.js, data/items.js

import * as engine from '../engine.js';
import { professorMoves, npcMoves } from '../data/moves.js';
import { items } from '../data/items.js';

const ALL_MOVE_MAP = Object.fromEntries(
  [...professorMoves, ...npcMoves].map(m => [m.id, m])
);

// ── Shared layout ─────────────────────────────────────────────────────────────

const CANVAS_W  = 400;
const CANVAS_H  = 480;
const TAB_BAR_H = 28;
const FOOTER_Y  = 468;

// Four equal tabs across the full width
const TAB_W      = Math.floor(CANVAS_W / 4); // 100
const TAB_LABELS = ['MOVES', 'ITEMS', 'COLLECTION', 'CONTROLS'];
const TAB_KEYS   = ['moves', 'items', 'collection', 'controls'];
const TAB_CENTERS = [
  Math.floor(TAB_W / 2),             // 50
  TAB_W + Math.floor(TAB_W / 2),     // 150
  TAB_W * 2 + Math.floor(TAB_W / 2), // 250
  TAB_W * 3 + Math.floor(TAB_W / 2), // 350
];

// ── MOVES tab layout ──────────────────────────────────────────────────────────

const M_COUNTER_Y    = 43;
const M_SLOT_STRIP_Y = 70;
const M_SLOT_STRIP_H = 32;
const M_SLOT_W       = 90;
const M_SLOT_GAP     = 5;
const M_SLOT_Y_TOP   = M_SLOT_STRIP_Y - M_SLOT_STRIP_H / 2 + 2; // 56
const M_DIVIDER_Y    = 88;
const M_LIST_Y0      = 98;
const M_LIST_STEP    = 26;
const M_VISIBLE_ROWS = 8;  // 98 + 8×26 = 306
const M_DESC_Y       = 316;

// ── ITEMS tab layout ──────────────────────────────────────────────────────────

const I_COUNTER_Y    = 43;
const I_SLOT_STRIP_Y = 68;
const I_SLOT_STRIP_H = 26;
const I_SLOT_W       = 84;
const I_SLOT_GAP     = 5;
const I_SLOT_Y_TOP   = I_SLOT_STRIP_Y - I_SLOT_STRIP_H / 2 + 2; // 57
const I_DIVIDER_Y    = 84;
const I_LIST_Y0      = 94;
const I_LIST_STEP    = 23;
const I_VISIBLE_ROWS = 11; // 94 + 11×23 = 347
const I_DESC_Y       = 356;

// ── COLLECTION tab layout ─────────────────────────────────────────────────────

const CELL_W       = 80;  // CANVAS_W / 5
const CELL_H       = 90;
const GRID_ROW_GAP = 6;
const GRID_Y0      = 46;
const SPRITE_SIZE  = 48;
const SPRITE_X_OFF = (CELL_W - SPRITE_SIZE) / 2; // 16
const SPRITE_Y_OFF = 8;
const NAME_Y_OFF   = SPRITE_Y_OFF + SPRITE_SIZE + 4; // 60
const COLL_DESC_Y  = GRID_Y0 + 2 * CELL_H + GRID_ROW_GAP + 12; // 244

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

export default class KioskScene extends Phaser.Scene {
  constructor() {
    super({ key: 'KioskScene' });
  }

  init(data) {
    this.mode     = (data && data.mode)     || 'battle';
    this.startTab = (data && data.startTab) || 'moves';
    this.onClose  = (data && data.onClose)  || null;
  }

  create() {
    const state = engine.getState();

    // MOVES state
    this.learnedMoves      = state.learnedMoves.map(id => ALL_MOVE_MAP[id]).filter(Boolean);
    this.activeMoves       = [...state.activeMoves];
    this.movesCursor       = 0;
    this.movesScrollOffset = 0;
    this._movesFullWarning = false;

    // ITEMS state
    const allConsumables = engine.getAllConsumables();
    this.consumables = this.mode === 'overworld'
      ? allConsumables.filter(item => engine.hasItem(item.id))
      : allConsumables;
    this.activeItems       = engine.getActiveItems();
    this.itemsCursor       = 0;
    this.itemsScrollOffset = 0;
    this._itemsFullWarning = false;

    // COLLECTION state
    this.collCursor = 0;

    // Build UI layers (order matters: later = higher z)
    this._buildBlocker();
    this._buildBackground();
    this._buildTabBar();
    this._buildMovesUI();
    this._buildItemsUI();
    this._buildCollectionUI();
    this._buildControlsUI();
    this._buildSharedFooter();

    this._setTab(this.startTab);

    // Keyboard
    const keys = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.UP,
      down:  Phaser.Input.Keyboard.KeyCodes.DOWN,
      left:  Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      esc:   Phaser.Input.Keyboard.KeyCodes.ESC,
      tab:   Phaser.Input.Keyboard.KeyCodes.TAB,
      i:     Phaser.Input.Keyboard.KeyCodes.I,
    });

    keys.up.on('down',    () => this._onUp());
    keys.down.on('down',  () => this._onDown());
    keys.left.on('down',  () => this._onLeft());
    keys.right.on('down', () => this._onRight());
    keys.enter.on('down', () => this._onConfirm());
    keys.space.on('down', () => this._onConfirm());
    keys.esc.on('down',   () => this._confirmAndExit());
    keys.tab.on('down',   () => this._cycleTab());
    keys.i.on('down',     () => this._confirmAndExit());
  }

  // ── Shared structure ──────────────────────────────────────────────────────────

  _buildBlocker() {
    // Invisible interactive rect — absorbs pointer events so underlying scene can't be clicked.
    this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x000000, 0)
      .setInteractive();
  }

  _buildBackground() {
    this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0xf0e8d0);
  }

  _buildTabBar() {
    this.add.rectangle(CANVAS_W / 2, TAB_BAR_H / 2, CANVAS_W, TAB_BAR_H, 0x2a2040);

    this._tabTexts = TAB_KEYS.map((_, i) =>
      this.add.text(TAB_CENTERS[i], TAB_BAR_H / 2, TAB_LABELS[i], {
        fontSize: '10px', fill: '#888899', fontFamily: 'monospace',
      }).setOrigin(0.5)
    );

    this._tabActiveGfx = this.add.graphics();
  }

  _refreshTabBar() {
    this._tabTexts.forEach((txt, i) => {
      txt.setStyle({ fill: TAB_KEYS[i] === this.activeTab ? '#ffffff' : '#556666' });
    });

    this._tabActiveGfx.clear();
    const activeIdx = TAB_KEYS.indexOf(this.activeTab);
    if (activeIdx !== -1) {
      this._tabActiveGfx.fillStyle(0x6655cc, 1);
      this._tabActiveGfx.fillRect(TAB_W * activeIdx, TAB_BAR_H - 3, TAB_W, 3);
    }
  }

  _buildSharedFooter() {
    this.footerText = this.add.text(CANVAS_W / 2, FOOTER_Y, '', {
      fontSize: '10px', fill: '#222222', fontFamily: 'monospace',
    }).setOrigin(0.5);
  }

  _updateFooter() {
    if (this._movesFullWarning || this._itemsFullWarning) return;
    if (this.activeTab === 'collection') {
      this.footerText.setText('← →: browse  ↑ ↓: row  TAB: next  I/ESC: exit').setStyle({ fill: '#222222' });
    } else if (this.activeTab === 'controls') {
      this.footerText.setText('TAB: next tab  I/ESC: exit').setStyle({ fill: '#222222' });
    } else {
      this.footerText.setText('ENTER: toggle  TAB: next  I/ESC: save & exit').setStyle({ fill: '#222222' });
    }
  }

  // ── Tab switching ─────────────────────────────────────────────────────────────

  _setTab(tab) {
    this.activeTab = tab;
    this._refreshTabBar();

    this._movesObjs.forEach(o => o.setVisible(tab === 'moves'));
    this._itemsObjs.forEach(o => o.setVisible(tab === 'items'));
    this._collObjs.forEach(o => o.setVisible(tab === 'collection'));
    this._controlsObjs.forEach(o => o.setVisible(tab === 'controls'));

    if (tab === 'moves')           this._refreshMoves();
    else if (tab === 'items')      this._refreshItems();
    else if (tab === 'collection') this._refreshCollection();
    // controls tab is static — no refresh needed

    this._updateFooter();
  }

  _cycleTab() {
    const idx = TAB_KEYS.indexOf(this.activeTab);
    this._setTab(TAB_KEYS[(idx + 1) % TAB_KEYS.length]);
  }

  // ── Input routing ─────────────────────────────────────────────────────────────

  _onUp() {
    if (this.activeTab === 'moves')           this._moveMovesCursor(-1);
    else if (this.activeTab === 'items')      this._moveItemsCursor(-1);
    else if (this.activeTab === 'collection') {
      this.collCursor = Math.max(0, this.collCursor - 5);
      this._refreshCollection();
    }
  }

  _onDown() {
    if (this.activeTab === 'moves')           this._moveMovesCursor(1);
    else if (this.activeTab === 'items')      this._moveItemsCursor(1);
    else if (this.activeTab === 'collection') {
      this.collCursor = Math.min(COLLECTIBLE_IDS.length - 1, this.collCursor + 5);
      this._refreshCollection();
    }
  }

  _onLeft() {
    if (this.activeTab === 'collection') {
      this.collCursor = Math.max(0, this.collCursor - 1);
      this._refreshCollection();
    }
  }

  _onRight() {
    if (this.activeTab === 'collection') {
      this.collCursor = Math.min(COLLECTIBLE_IDS.length - 1, this.collCursor + 1);
      this._refreshCollection();
    }
  }

  _onConfirm() {
    if (this.activeTab === 'moves')      this._toggleCurrentMove();
    else if (this.activeTab === 'items') this._toggleCurrentItem();
  }

  // ── Save & exit ───────────────────────────────────────────────────────────────

  _confirmAndExit() {
    engine.setActiveMoves(this.activeMoves);
    engine.getActiveItems().forEach(id => engine.unequipItem(id));
    this.activeItems.forEach(id => engine.equipItem(id));
    if (this.onClose) this.onClose();
    this.scene.stop('KioskScene');
  }

  // ── MOVES tab: UI construction ────────────────────────────────────────────────

  _buildMovesUI() {
    this._movesObjs = [];
    const t = obj => { this._movesObjs.push(obj); return obj; };

    t(this.add.rectangle(CANVAS_W / 2, M_SLOT_STRIP_Y, CANVAS_W, M_SLOT_STRIP_H, 0xd8cbb0));

    this.movesActiveCountText = t(this.add.text(CANVAS_W - 8, M_COUNTER_Y, '', {
      fontSize: '11px', fill: '#226622', fontFamily: 'monospace',
    }).setOrigin(1, 0.5));

    this.movesSlotGfx = t(this.add.graphics());
    this.movesSlotTexts = Array.from({ length: 4 }, (_, i) => {
      const cx = 8 + i * (M_SLOT_W + M_SLOT_GAP) + M_SLOT_W / 2;
      return t(this.add.text(cx, M_SLOT_STRIP_Y, '', {
        fontSize: '9px', fill: '#226622', fontFamily: 'monospace',
        wordWrap: { width: M_SLOT_W - 6 },
      }).setOrigin(0.5));
    });

    const mDiv = t(this.add.graphics());
    mDiv.lineStyle(1, 0x998877, 1);
    mDiv.lineBetween(0, M_DIVIDER_Y, CANVAS_W, M_DIVIDER_Y);

    this.movesRowTexts = Array.from({ length: M_VISIBLE_ROWS }, (_, i) =>
      t(this.add.text(10, M_LIST_Y0 + i * M_LIST_STEP, '', {
        fontSize: '12px', fill: '#222266', fontFamily: 'monospace',
      }))
    );

    this.movesScrollIndicator = t(this.add.text(390, M_LIST_Y0 + (M_VISIBLE_ROWS / 2) * M_LIST_STEP, '', {
      fontSize: '10px', fill: '#998877', fontFamily: 'monospace',
    }).setOrigin(1, 0.5));

    this.movesDescText = t(this.add.text(10, M_DESC_Y, '', {
      fontSize: '11px', fill: '#443300', fontFamily: 'monospace',
      wordWrap: { width: 380 },
    }));
  }

  // ── MOVES tab: refresh ────────────────────────────────────────────────────────

  _refreshMoves() {
    this.movesActiveCountText.setText(`Active: ${this.activeMoves.length}/4`);

    this.movesSlotGfx.clear();
    for (let i = 0; i < 4; i++) {
      const x          = 8 + i * (M_SLOT_W + M_SLOT_GAP);
      const isOccupied = i < this.activeMoves.length;
      const fillColor  = isOccupied ? 0xd0e8d0 : 0xe8e0d0;
      const lineColor  = isOccupied ? 0x226622 : 0x999988;
      this.movesSlotGfx.fillStyle(fillColor, 1);
      this.movesSlotGfx.fillRect(x, M_SLOT_Y_TOP, M_SLOT_W, M_SLOT_STRIP_H - 4);
      this.movesSlotGfx.lineStyle(1, lineColor, 1);
      this.movesSlotGfx.strokeRect(x, M_SLOT_Y_TOP, M_SLOT_W, M_SLOT_STRIP_H - 4);
      if (isOccupied) {
        const move = ALL_MOVE_MAP[this.activeMoves[i]];
        this.movesSlotTexts[i].setText(move ? move.name : '?').setStyle({ fill: '#226622' });
      } else {
        this.movesSlotTexts[i].setText('—').setStyle({ fill: '#999988' });
      }
    }

    this.movesRowTexts.forEach((rowText, rowSlot) => {
      const moveIdx = this.movesScrollOffset + rowSlot;
      if (moveIdx >= this.learnedMoves.length) { rowText.setText('').setVisible(false); return; }
      rowText.setVisible(true);
      const move     = this.learnedMoves[moveIdx];
      const slotIdx  = this.activeMoves.indexOf(move.id);
      const isActive = slotIdx !== -1;
      const cursor   = moveIdx === this.movesCursor ? '>' : ' ';
      const tag      = isActive ? `[${slotIdx + 1}]` : '[○]';
      const name     = move.name.length > 18 ? move.name.slice(0, 17) + '…' : move.name.padEnd(18);
      const dmg      = move.damage > 0 ? `DMG:${move.damage}` : 'DMG: —';
      rowText
        .setText(`${cursor} ${tag} ${name} ${dmg}`)
        .setStyle({ fill: isActive ? '#226622' : (moveIdx === this.movesCursor ? '#222266' : '#555544') });
    });

    const hasAbove = this.movesScrollOffset > 0;
    const hasBelow = this.movesScrollOffset + M_VISIBLE_ROWS < this.learnedMoves.length;
    this.movesScrollIndicator.setText(
      hasAbove && hasBelow ? '▲\n▼' : hasAbove ? '▲' : hasBelow ? '▼' : ''
    );

    const selected = this.learnedMoves[this.movesCursor];
    this.movesDescText.setText(selected ? selected.description : '');

    if (!this._movesFullWarning) this._updateFooter();
  }

  // ── MOVES tab: input handlers ─────────────────────────────────────────────────

  _moveMovesCursor(dir) {
    const n = this.learnedMoves.length;
    if (n === 0) return;
    this.movesCursor = (this.movesCursor + dir + n) % n;
    if (this.movesCursor < this.movesScrollOffset) {
      this.movesScrollOffset = this.movesCursor;
    } else if (this.movesCursor >= this.movesScrollOffset + M_VISIBLE_ROWS) {
      this.movesScrollOffset = this.movesCursor - M_VISIBLE_ROWS + 1;
    }
    this._refreshMoves();
  }

  _toggleCurrentMove() {
    const move = this.learnedMoves[this.movesCursor];
    if (!move) return;
    const idx = this.activeMoves.indexOf(move.id);
    if (idx !== -1) {
      this.activeMoves.splice(idx, 1);
    } else if (this.activeMoves.length < 4) {
      this.activeMoves.push(move.id);
    } else {
      this._showMovesFullWarning();
      return;
    }
    this._refreshMoves();
  }

  _showMovesFullWarning() {
    this._movesFullWarning = true;
    this.footerText.setText('Loadout full!').setStyle({ fill: '#cc2222' });
    this.time.delayedCall(1200, () => {
      this._movesFullWarning = false;
      this._updateFooter();
    });
  }

  // ── ITEMS tab: UI construction ────────────────────────────────────────────────

  _buildItemsUI() {
    this._itemsObjs = [];
    const t = obj => { this._itemsObjs.push(obj); return obj; };

    t(this.add.rectangle(CANVAS_W / 2, I_SLOT_STRIP_Y, CANVAS_W, I_SLOT_STRIP_H, 0xd8cbb0));

    this.itemsActiveCountText = t(this.add.text(8, I_COUNTER_Y, '', {
      fontSize: '11px', fill: '#226622', fontFamily: 'monospace',
    }).setOrigin(0, 0.5));

    this.itemsSlotGfx = t(this.add.graphics());
    this.itemsSlotTexts = Array.from({ length: 4 }, (_, i) => {
      const cx = 8 + i * (I_SLOT_W + I_SLOT_GAP) + I_SLOT_W / 2;
      return t(this.add.text(cx, I_SLOT_STRIP_Y, '', {
        fontSize: '8px', fill: '#226622', fontFamily: 'monospace',
        wordWrap: { width: I_SLOT_W - 6 },
      }).setOrigin(0.5));
    });

    const iDiv = t(this.add.graphics());
    iDiv.lineStyle(1, 0x998877, 1);
    iDiv.lineBetween(0, I_DIVIDER_Y, CANVAS_W, I_DIVIDER_Y);

    this.itemsRowTexts = Array.from({ length: I_VISIBLE_ROWS }, (_, i) =>
      t(this.add.text(10, I_LIST_Y0 + i * I_LIST_STEP, '', {
        fontSize: '11px', fill: '#222266', fontFamily: 'monospace',
      }))
    );

    this.itemsScrollIndicator = t(this.add.text(390, I_LIST_Y0 + (I_VISIBLE_ROWS / 2) * I_LIST_STEP, '', {
      fontSize: '10px', fill: '#998877', fontFamily: 'monospace',
    }).setOrigin(1, 0.5));

    this.itemsDescText = t(this.add.text(10, I_DESC_Y, '', {
      fontSize: '11px', fill: '#443300', fontFamily: 'monospace',
      wordWrap: { width: 380 },
    }));
  }

  // ── ITEMS tab: refresh ────────────────────────────────────────────────────────

  _refreshItems() {
    this.itemsActiveCountText.setText(`Active: ${this.activeItems.length}/4`);

    this.itemsSlotGfx.clear();
    for (let i = 0; i < 4; i++) {
      const x          = 8 + i * (I_SLOT_W + I_SLOT_GAP);
      const isOccupied = i < this.activeItems.length;
      const fillColor  = isOccupied ? 0xd0e8d0 : 0xe8e0d0;
      const lineColor  = isOccupied ? 0x226622 : 0x999988;
      this.itemsSlotGfx.fillStyle(fillColor, 1);
      this.itemsSlotGfx.fillRect(x, I_SLOT_Y_TOP, I_SLOT_W, I_SLOT_STRIP_H - 4);
      this.itemsSlotGfx.lineStyle(1, lineColor, 1);
      this.itemsSlotGfx.strokeRect(x, I_SLOT_Y_TOP, I_SLOT_W, I_SLOT_STRIP_H - 4);
      const item = isOccupied ? items.find(it => it.id === this.activeItems[i]) : null;
      this.itemsSlotTexts[i]
        .setText(isOccupied ? (item ? item.name : '?') : '—')
        .setStyle({ fill: isOccupied ? '#226622' : '#999988' });
    }

    this.itemsRowTexts.forEach((rowText, rowSlot) => {
      const idx      = this.itemsScrollOffset + rowSlot;
      if (idx >= this.consumables.length) { rowText.setText('').setVisible(false); return; }
      rowText.setVisible(true);
      const item     = this.consumables[idx];
      const spent    = engine.isItemSpent(item.id);
      const slotIdx  = this.activeItems.indexOf(item.id);
      const isActive = slotIdx !== -1;
      const cursor   = idx === this.itemsCursor ? '>' : ' ';
      const tag      = isActive ? `[${slotIdx + 1}]` : (spent ? '[✗]' : '[○]');
      const name     = trunc(item.name, 20).padEnd(20);
      const eff      = fmtEffect(item.effect);
      rowText
        .setText(`${cursor} ${tag} ${name} ${eff}`)
        .setStyle({ fill: spent ? '#aaaaaa' : isActive ? '#226622' : idx === this.itemsCursor ? '#222266' : '#555544' });
    });

    const hasAbove = this.itemsScrollOffset > 0;
    const hasBelow = this.itemsScrollOffset + I_VISIBLE_ROWS < this.consumables.length;
    this.itemsScrollIndicator.setText(
      hasAbove && hasBelow ? '▲\n▼' : hasAbove ? '▲' : hasBelow ? '▼' : ''
    );

    const sel = this.consumables[this.itemsCursor];
    this.itemsDescText.setText(sel ? (sel.flavourText || '') : '');

    if (!this._itemsFullWarning) this._updateFooter();
  }

  // ── ITEMS tab: input handlers ─────────────────────────────────────────────────

  _moveItemsCursor(dir) {
    const n = this.consumables.length;
    if (n === 0) return;
    this.itemsCursor = (this.itemsCursor + dir + n) % n;
    if (this.itemsCursor < this.itemsScrollOffset) {
      this.itemsScrollOffset = this.itemsCursor;
    } else if (this.itemsCursor >= this.itemsScrollOffset + I_VISIBLE_ROWS) {
      this.itemsScrollOffset = this.itemsCursor - I_VISIBLE_ROWS + 1;
    }
    this._refreshItems();
  }

  _toggleCurrentItem() {
    const item = this.consumables[this.itemsCursor];
    if (!item) return;
    if (engine.isItemSpent(item.id)) return;
    const idx = this.activeItems.indexOf(item.id);
    if (idx !== -1) {
      this.activeItems.splice(idx, 1);
    } else if (this.activeItems.length < 4) {
      this.activeItems.push(item.id);
    } else {
      this._showItemsFullWarning();
      return;
    }
    this._refreshItems();
  }

  _showItemsFullWarning() {
    this._itemsFullWarning = true;
    this.footerText.setText('Loadout full!').setStyle({ fill: '#cc2222' });
    this.time.delayedCall(1200, () => {
      this._itemsFullWarning = false;
      this._updateFooter();
    });
  }

  // ── COLLECTION tab: UI construction ──────────────────────────────────────────

  _buildCollectionUI() {
    this._collObjs = [];
    const t = obj => { this._collObjs.push(obj); return obj; };

    t(this.add.text(4, GRID_Y0 - 12, 'BADGES', {
      fontSize: '8px', fill: '#998877', fontFamily: 'monospace',
    }));
    t(this.add.text(4, GRID_Y0 + CELL_H + GRID_ROW_GAP - 12, 'COLLECTIBLES', {
      fontSize: '8px', fill: '#998877', fontFamily: 'monospace',
    }));

    this.collCellGfx   = t(this.add.graphics());
    this.collCursorGfx = t(this.add.graphics());

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

    this.collItemName   = t(this.add.text(10, COLL_DESC_Y, '', {
      fontSize: '12px', fill: '#222222', fontFamily: 'monospace',
    }));
    this.collItemDesc   = t(this.add.text(10, COLL_DESC_Y + 18, '', {
      fontSize: '10px', fill: '#554433', fontFamily: 'monospace',
      wordWrap: { width: 380 },
    }));
    this.collItemStatus = t(this.add.text(10, COLL_DESC_Y + 62, '', {
      fontSize: '10px', fill: '#226622', fontFamily: 'monospace',
    }));
  }

  // ── COLLECTION tab: refresh ───────────────────────────────────────────────────

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

      if (i === this.collCursor) {
        this.collCursorGfx.lineStyle(2, 0x886644, 1);
        this.collCursorGfx.strokeRect(cellX + 2, cellY + 2, CELL_W - 4, CELL_H - 4);
      }

      this.collCellGfx.fillStyle(owned ? 0xd4a820 : 0x2a2520, owned ? 1 : 0.85);
      this.collCellGfx.fillRect(spriteX, spriteY, SPRITE_SIZE, SPRITE_SIZE);
      this.collCellGfx.lineStyle(1, owned ? 0xaa8800 : 0x443c36, 1);
      this.collCellGfx.strokeRect(spriteX, spriteY, SPRITE_SIZE, SPRITE_SIZE);

      const item = items.find(it => it.id === id);
      this.collNameTexts[i]
        .setText(item ? trunc(item.name, 10) : id)
        .setStyle({ fill: owned ? '#eedd88' : '#554433' });
    });

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

    this._updateFooter();
  }

  // ── CONTROLS tab: UI construction ────────────────────────────────────────────

  _buildControlsUI() {
    this._controlsObjs = [];
    const t = obj => { this._controlsObjs.push(obj); return obj; };

    const hdr = (y, label) => t(this.add.text(10, y, label, {
      fontSize: '11px', fill: '#443300', fontFamily: 'monospace', fontStyle: 'bold',
    }));
    const row = (y, key, desc) => {
      t(this.add.text(10,  y, key,  { fontSize: '11px', fill: '#222266', fontFamily: 'monospace' }));
      t(this.add.text(160, y, desc, { fontSize: '11px', fill: '#443300', fontFamily: 'monospace' }));
    };

    hdr(40, 'OVERWORLD');
    row( 56, '↑ ↓ ← →',       'Move');
    row( 70, 'Enter',           'Interact');
    row( 84, 'I',               'Open menu');

    hdr(106, 'MENU');
    row(122, 'Tab',             'Next tab (wraps)');
    row(136, '↑ ↓',            'Navigate list');
    row(150, '← → (collection)', 'Browse grid');
    row(164, 'Enter / Space',   'Select or toggle');
    row(178, 'I or ESC',        'Save and exit');

    hdr(200, 'BATTLE');
    row(216, '↑ ↓',            'Navigate menus');
    row(230, 'Enter / Space',   'Confirm');
    row(244, 'ESC',             'Back (shortcut)');
    row(258, 'Back (menu item)', 'Return to actions');
  }
}
