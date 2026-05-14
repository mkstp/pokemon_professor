// tests/kiosk_scene.test.js — unit tests for KioskScene + engine item-loadout API
//
// Two helpers:
//   makeScene()          — bypasses create(); sets state directly for logic tests.
//   makeSceneViaCreate() — calls create() with a real engine environment.
//
// phaser-stub.js MUST be imported first.

import './phaser-stub.js';
import { test, assert } from './runner.js';
import KioskScene from '../js/scenes/KioskScene.js';
import { items } from '../js/data/items.js';
import { professorMoves, npcMoves } from '../js/data/moves.js';
import * as engine from '../js/engine.js';

const ALL_MOVE_MAP = Object.fromEntries(
  [...professorMoves, ...npcMoves].map(m => [m.id, m])
);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ITEM_A   = 'convenience_store_sushi';       // restore_hp 20, repeatableSource: false
const ITEM_B   = 'gluten_free_cafeteria_cookie';   // restore_hp 10, repeatableSource: true
const ITEM_C   = 'triscuit';                       // restore_hp 5,  repeatableSource: true
const ITEM_D   = 'pms_peanut_butter_cup';          // boost_defense 15, repeatableSource: false
const ITEM_E   = 'fruit_cup';                      // restore_hp 10, repeatableSource: false
const ITEM_KEY = 'id_card';                        // key_item — not equippable

const MOVE_A = 'non_sequitur';
const MOVE_B = 'all_nighter';
const MOVE_C = 'counterexample';
const MOVE_D = 'correction';
const MOVE_E = 'cite_this';

// ── Stubs ─────────────────────────────────────────────────────────────────────

function textStub() {
  return {
    setText()    { return this; },
    setStyle()   { return this; },
    setOrigin()  { return this; },
    setVisible() { return this; },
  };
}

function makeAddStub() {
  return {
    rectangle: () => ({
      setVisible()    { return this; },
      setInteractive(){ return this; },
    }),
    text:     () => textStub(),
    graphics: () => ({
      clear()      {},
      fillStyle()  {},
      fillRect()   {},
      lineStyle()  {},
      strokeRect() {},
      lineBetween(){},
      setVisible() { return this; },
    }),
  };
}

function makeInputStub() {
  return {
    keyboard: {
      addKeys: () => ({
        up:    { on() {} }, down:  { on() {} },
        left:  { on() {} }, right: { on() {} },
        enter: { on() {} }, space: { on() {} },
        esc:   { on() {} }, tab:   { on() {} },
        i:     { on() {} },
      }),
    },
  };
}

// ── makeScene — logic tests (bypasses create()) ───────────────────────────────

function makeScene({ mode = 'battle', learnedIds = [], moveActiveIds = [],
                     consumableIds = [], itemActiveIds = [], onClose = null } = {}) {
  engine.init();
  const scene = Object.create(KioskScene.prototype);
  scene.init({ mode, onClose });

  scene.learnedMoves      = learnedIds.map(id => ALL_MOVE_MAP[id]).filter(Boolean);
  scene.activeMoves       = [...moveActiveIds];
  scene.movesCursor       = 0;
  scene.movesScrollOffset = 0;
  scene._movesFullWarning = false;

  scene.consumables      = consumableIds.map(id => items.find(it => it.id === id)).filter(Boolean);
  scene.activeItems      = [...itemActiveIds];
  scene.itemsCursor      = 0;
  scene.itemsScrollOffset = 0;
  scene._itemsFullWarning = false;

  scene.collCursor = 0;
  scene.activeTab  = 'moves';

  // Stub display objects
  scene._movesObjs    = [];
  scene._itemsObjs    = [];
  scene._collObjs     = [];
  scene._controlsObjs = [];

  scene._refreshMoves      = () => {};
  scene._refreshItems      = () => {};
  scene._refreshCollection = () => {};
  scene._refreshTabBar     = () => {};
  scene._updateFooter      = () => {};

  scene.footerText = textStub();
  scene.time       = { delayedCall: () => {} };
  scene.scene      = { stop: () => {} };

  return scene;
}

// makeSceneWithMoves — synthetic move objects for scroll tests.
function makeSceneWithMoves(count) {
  engine.init();
  const scene = Object.create(KioskScene.prototype);
  scene.init({ mode: 'battle', onClose: null });

  scene.learnedMoves = Array.from({ length: count }, (_, i) => ({
    id: `move_${i}`, name: `Move ${i}`, damage: i * 5,
    description: `Description ${i}`, effect: null,
  }));
  scene.activeMoves       = [];
  scene.movesCursor       = 0;
  scene.movesScrollOffset = 0;
  scene._movesFullWarning = false;
  scene.consumables       = [];
  scene.activeItems       = [];
  scene._movesObjs        = [];
  scene._itemsObjs        = [];
  scene._collObjs         = [];
  scene._controlsObjs     = [];
  scene._refreshMoves     = () => {};
  scene._refreshItems     = () => {};
  scene._refreshTabBar    = () => {};
  scene._updateFooter     = () => {};
  scene.footerText        = textStub();
  scene.time              = { delayedCall: () => {} };
  scene.scene             = { stop: () => {} };
  return scene;
}

// makeSceneWithItems — synthetic consumable objects for scroll tests.
function makeSceneWithItems(count) {
  engine.init();
  const scene = Object.create(KioskScene.prototype);
  scene.init({ mode: 'battle', onClose: null });

  scene.learnedMoves       = [];
  scene.activeMoves        = [];
  scene.consumables = Array.from({ length: count }, (_, i) => ({
    id: `item_${i}`, name: `Item ${i}`, category: 'consumable',
    flavourText: '', effect: { action: 'restore_hp', value: 5 },
    repeatableSource: false,
  }));
  scene.activeItems        = [];
  scene.itemsCursor        = 0;
  scene.itemsScrollOffset  = 0;
  scene._itemsFullWarning  = false;
  scene._movesObjs         = [];
  scene._itemsObjs         = [];
  scene._collObjs          = [];
  scene._controlsObjs      = [];
  scene._refreshMoves      = () => {};
  scene._refreshItems      = () => {};
  scene._refreshTabBar     = () => {};
  scene._updateFooter      = () => {};
  scene.footerText         = textStub();
  scene.time               = { delayedCall: () => {} };
  scene.scene              = { stop: () => {} };
  return scene;
}

// makeSceneViaCreate — calls create() for real with a stubbed Phaser environment.
function makeSceneViaCreate({ mode = 'battle', learnedIds = [], moveActiveIds = [],
                               itemActiveIds = [], onClose = null } = {}) {
  engine.init();
  learnedIds.forEach(id => engine.addLearnedMove(id));
  engine.setActiveMoves(moveActiveIds);
  itemActiveIds.forEach(id => engine.equipItem(id));

  const scene = Object.create(KioskScene.prototype);
  scene.init({ mode, onClose });
  scene.add   = makeAddStub();
  scene.input = makeInputStub();
  scene.time  = { delayedCall: () => {} };
  scene.scene = { stop: () => {} };

  scene.create();

  // Stub refresh after create() so logic tests don't need live display objects.
  scene._refreshMoves      = () => {};
  scene._refreshItems      = () => {};
  scene._refreshCollection = () => {};
  return scene;
}

// ─── Engine: equipItem ────────────────────────────────────────────────────────

test('engine.equipItem: adds consumable to activeItems', () => {
  engine.init();
  engine.equipItem(ITEM_A);
  assert.includes(engine.getActiveItems(), ITEM_A, 'ITEM_A should appear in activeItems after equipItem');
});

test('engine.equipItem: no-op if item is already in activeItems', () => {
  engine.init();
  engine.equipItem(ITEM_A);
  engine.equipItem(ITEM_A);
  assert.equal(engine.getActiveItems().length, 1, 'duplicate equipItem should not create a second entry');
});

test('engine.equipItem: no-op if item is not a consumable', () => {
  engine.init();
  engine.equipItem(ITEM_KEY);
  assert.equal(engine.getActiveItems().length, 0, 'key_item should not be equippable');
});

test('engine.equipItem: no-op when activeItems is at the 4-item cap', () => {
  engine.init();
  [ITEM_A, ITEM_B, ITEM_C, ITEM_D].forEach(id => engine.equipItem(id));
  engine.equipItem(ITEM_E);
  assert.equal(engine.getActiveItems().length, 4, 'fifth equipItem should be silently ignored');
  assert.equal(engine.getActiveItems().includes(ITEM_E), false, 'ITEM_E should not appear in activeItems');
});

// ─── Engine: unequipItem ──────────────────────────────────────────────────────

test('engine.unequipItem: removes item from activeItems', () => {
  engine.init();
  engine.equipItem(ITEM_A);
  engine.unequipItem(ITEM_A);
  assert.equal(engine.getActiveItems().includes(ITEM_A), false, 'ITEM_A should be absent after unequipItem');
});

test('engine.unequipItem: no-op if item is not in activeItems', () => {
  engine.init();
  engine.unequipItem(ITEM_A);
  assert.equal(engine.getActiveItems().length, 0, 'activeItems should remain empty');
});

// ─── Engine: getActiveItems ───────────────────────────────────────────────────

test('engine.getActiveItems: returns a copy — mutation does not affect engine state', () => {
  engine.init();
  engine.equipItem(ITEM_A);
  const copy = engine.getActiveItems();
  copy.push('fake_id');
  assert.equal(engine.getActiveItems().length, 1, 'mutating the returned array should not alter engine state');
});

// ─── Engine: useActiveItem ────────────────────────────────────────────────────

test('engine.useActiveItem: returns null if item is not in the active loadout', () => {
  engine.init();
  assert.equal(engine.useActiveItem(ITEM_A), null, 'should return null for item not in loadout');
});

test('engine.useActiveItem: returns the item definition when used', () => {
  engine.init();
  engine.equipItem(ITEM_A);
  const result = engine.useActiveItem(ITEM_A);
  assert.ok(result && result.id === ITEM_A, 'should return the item definition');
});

test('engine.useActiveItem: removes item from activeItems after use', () => {
  engine.init();
  engine.equipItem(ITEM_A);
  engine.useActiveItem(ITEM_A);
  assert.equal(engine.getActiveItems().includes(ITEM_A), false, 'item should be absent after use');
});

test('engine.useActiveItem: applies restore_hp effect to playerHP', () => {
  engine.init();
  engine.setPlayerHP(50);
  engine.equipItem(ITEM_A); // restore_hp 20
  engine.useActiveItem(ITEM_A);
  assert.equal(engine.getState().playerHP, 70, 'playerHP should increase by 20');
});

test('engine.useActiveItem: marks item as spent when repeatableSource is false', () => {
  engine.init();
  engine.equipItem(ITEM_A);
  engine.useActiveItem(ITEM_A);
  assert.ok(engine.isItemSpent(ITEM_A), 'ITEM_A should be marked spent after use');
});

test('engine.useActiveItem: does not mark item as spent when repeatableSource is true', () => {
  engine.init();
  engine.equipItem(ITEM_B);
  engine.useActiveItem(ITEM_B);
  assert.equal(engine.isItemSpent(ITEM_B), false, 'ITEM_B should not be spent — source is repeatable');
});

test('engine.isItemSpent: returns false before any item is used', () => {
  engine.init();
  assert.equal(engine.isItemSpent(ITEM_A), false, 'item should not be spent before use');
});

// ─── KioskScene: create() ─────────────────────────────────────────────────────

test('KioskScene: create() populates learnedMoves from engine state', () => {
  engine.init();
  const scene = makeSceneViaCreate({});
  assert.equal(scene.learnedMoves.length, 4, 'learnedMoves should have 4 starting moves');
  assert.ok(scene.learnedMoves.every(m => m && m.id), 'all entries should be resolved move objects');
});

test('KioskScene: create() sets activeMoves as a copy of engine state', () => {
  const scene = makeSceneViaCreate({ moveActiveIds: [MOVE_A, MOVE_B] });
  assert.equal(scene.activeMoves.length, 2, 'activeMoves should have 2 entries');
  assert.equal(scene.activeMoves[0], MOVE_A, 'first active move should match engine state');
});

test('KioskScene: create() activeMoves is a local copy — mutation does not affect engine', () => {
  const scene = makeSceneViaCreate({ moveActiveIds: [MOVE_A] });
  scene.activeMoves.push('fake_id');
  assert.equal(engine.getState().activeMoves.length, 1, 'pushing to local copy should not affect engine state');
});

test('KioskScene: create() populates consumables from the full catalogue in battle mode', () => {
  const scene = makeSceneViaCreate({ mode: 'battle' });
  assert.ok(scene.consumables.length > 0, 'consumables should be populated');
  assert.ok(scene.consumables.every(i => i.category === 'consumable'), 'all entries should be consumables');
});

test('KioskScene: create() copies activeItems from engine state', () => {
  const scene = makeSceneViaCreate({ itemActiveIds: [ITEM_A, ITEM_B] });
  assert.equal(scene.activeItems.length, 2, 'activeItems should have 2 entries');
  assert.equal(scene.activeItems[0], ITEM_A, 'first entry should be ITEM_A');
});

test('KioskScene: create() initialises cursors and scroll offsets to 0', () => {
  const scene = makeSceneViaCreate({});
  assert.equal(scene.movesCursor,       0, 'movesCursor should be 0');
  assert.equal(scene.movesScrollOffset, 0, 'movesScrollOffset should be 0');
  assert.equal(scene.itemsCursor,       0, 'itemsCursor should be 0');
  assert.equal(scene.itemsScrollOffset, 0, 'itemsScrollOffset should be 0');
  assert.equal(scene.collCursor,        0, 'collCursor should be 0');
});

test('KioskScene: create() starts on moves tab', () => {
  const scene = makeSceneViaCreate({});
  assert.equal(scene.activeTab, 'moves', 'activeTab should default to moves');
});

// ─── KioskScene: mode filtering ───────────────────────────────────────────────

test('KioskScene: overworld mode shows only consumables the player has collected', () => {
  engine.init();
  engine.addItem(ITEM_A); // player collected this item
  const scene = makeSceneViaCreate({ mode: 'overworld' });
  assert.ok(scene.consumables.every(item => engine.hasItem(item.id)),
    'overworld mode should only include items the player has collected');
});

test('KioskScene: battle mode shows all consumables regardless of inventory', () => {
  engine.init();
  // Player has no items collected, but battle mode gives access to all consumables.
  const scene = makeSceneViaCreate({ mode: 'battle' });
  const allConsumables = engine.getAllConsumables();
  assert.equal(scene.consumables.length, allConsumables.length,
    'battle mode should show all consumables from the catalogue');
});

// ─── KioskScene: _cycleTab() ──────────────────────────────────────────────────

test('KioskScene: _cycleTab() advances from moves to items', () => {
  const scene = makeScene({});
  scene.activeTab = 'moves';
  scene._cycleTab();
  assert.equal(scene.activeTab, 'items', 'tab should advance from moves to items');
});

test('KioskScene: _cycleTab() advances from items to collection', () => {
  const scene = makeScene({});
  scene.activeTab = 'items';
  scene._cycleTab();
  assert.equal(scene.activeTab, 'collection', 'tab should advance from items to collection');
});

test('KioskScene: _cycleTab() advances from collection to controls', () => {
  const scene = makeScene({});
  scene.activeTab = 'collection';
  scene._cycleTab();
  assert.equal(scene.activeTab, 'controls', 'tab should advance from collection to controls');
});

test('KioskScene: _cycleTab() wraps from controls back to moves', () => {
  const scene = makeScene({});
  scene.activeTab = 'controls';
  scene._cycleTab();
  assert.equal(scene.activeTab, 'moves', 'tab should wrap from controls back to moves');
});

// ─── KioskScene: _toggleCurrentMove() ────────────────────────────────────────

test('KioskScene: _toggleCurrentMove() adds inactive move to activeMoves', () => {
  const scene = makeScene({ learnedIds: [MOVE_A, MOVE_B], moveActiveIds: [MOVE_A] });
  scene.movesCursor = 1; // pointing at MOVE_B
  scene._toggleCurrentMove();
  assert.includes(scene.activeMoves, MOVE_B, 'MOVE_B should be added to activeMoves');
});

test('KioskScene: _toggleCurrentMove() removes active move from activeMoves', () => {
  const scene = makeScene({ learnedIds: [MOVE_A, MOVE_B], moveActiveIds: [MOVE_A, MOVE_B] });
  scene.movesCursor = 0;
  scene._toggleCurrentMove();
  assert.equal(scene.activeMoves.includes(MOVE_A), false, 'MOVE_A should be removed');
});

test('KioskScene: _toggleCurrentMove() does not add a 5th move when loadout is full', () => {
  const scene = makeScene({
    learnedIds:    [MOVE_A, MOVE_B, MOVE_C, MOVE_D, MOVE_E],
    moveActiveIds: [MOVE_A, MOVE_B, MOVE_C, MOVE_D],
  });
  scene.movesCursor = 4;
  scene._toggleCurrentMove();
  assert.equal(scene.activeMoves.length, 4, 'activeMoves should still have 4 entries');
  assert.equal(scene.activeMoves.includes(MOVE_E), false, 'MOVE_E should not be added');
});

test('KioskScene: _toggleCurrentMove() allows removing a move when loadout is full', () => {
  const scene = makeScene({
    learnedIds:    [MOVE_A, MOVE_B, MOVE_C, MOVE_D, MOVE_E],
    moveActiveIds: [MOVE_A, MOVE_B, MOVE_C, MOVE_D],
  });
  scene.movesCursor = 0;
  scene._toggleCurrentMove();
  assert.equal(scene.activeMoves.length, 3, 'one move should be removed');
  assert.equal(scene.activeMoves.includes(MOVE_A), false, 'MOVE_A should be removed');
});

// ─── KioskScene: _toggleCurrentItem() ────────────────────────────────────────

test('KioskScene: _toggleCurrentItem() adds inactive item to activeItems', () => {
  const scene = makeScene({ consumableIds: [ITEM_A, ITEM_B], itemActiveIds: [ITEM_A] });
  scene.itemsCursor = 1;
  scene._toggleCurrentItem();
  assert.includes(scene.activeItems, ITEM_B, 'ITEM_B should be added to activeItems');
});

test('KioskScene: _toggleCurrentItem() removes active item from activeItems', () => {
  const scene = makeScene({ consumableIds: [ITEM_A, ITEM_B], itemActiveIds: [ITEM_A, ITEM_B] });
  scene.itemsCursor = 0;
  scene._toggleCurrentItem();
  assert.equal(scene.activeItems.includes(ITEM_A), false, 'ITEM_A should be removed');
});

test('KioskScene: _toggleCurrentItem() does not add a spent item', () => {
  engine.init();
  engine.equipItem(ITEM_A);
  engine.useActiveItem(ITEM_A); // marks as spent

  const scene = Object.create(KioskScene.prototype);
  scene.init({ mode: 'battle', onClose: null });
  scene.consumables       = [items.find(it => it.id === ITEM_A)];
  scene.activeItems       = [];
  scene.itemsCursor       = 0;
  scene.itemsScrollOffset = 0;
  scene._itemsFullWarning = false;
  scene._movesObjs        = [];
  scene._itemsObjs        = [];
  scene._collObjs         = [];
  scene._refreshItems     = () => {};
  scene._updateFooter     = () => {};
  scene.footerText        = textStub();
  scene.time              = { delayedCall: () => {} };
  scene.scene             = { stop: () => {} };

  scene._toggleCurrentItem();
  assert.equal(scene.activeItems.includes(ITEM_A), false, 'spent item should not be added to the loadout');
});

test('KioskScene: _toggleCurrentItem() does not add a 5th item when loadout is full', () => {
  const scene = makeScene({
    consumableIds: [ITEM_A, ITEM_B, ITEM_C, ITEM_D, ITEM_E],
    itemActiveIds: [ITEM_A, ITEM_B, ITEM_C, ITEM_D],
  });
  scene.itemsCursor = 4;
  scene._toggleCurrentItem();
  assert.equal(scene.activeItems.length, 4, 'activeItems should still have 4 entries');
  assert.equal(scene.activeItems.includes(ITEM_E), false, 'ITEM_E should not be added');
});

test('KioskScene: _toggleCurrentItem() allows removing an item when loadout is full', () => {
  const scene = makeScene({
    consumableIds: [ITEM_A, ITEM_B, ITEM_C, ITEM_D, ITEM_E],
    itemActiveIds: [ITEM_A, ITEM_B, ITEM_C, ITEM_D],
  });
  scene.itemsCursor = 0;
  scene._toggleCurrentItem();
  assert.equal(scene.activeItems.length, 3, 'one item should be removed');
  assert.equal(scene.activeItems.includes(ITEM_A), false, 'ITEM_A should be removed');
});

// ─── KioskScene: _confirmAndExit() ───────────────────────────────────────────

test('KioskScene: _confirmAndExit() saves activeMoves to engine state', () => {
  engine.init();
  const scene = makeScene({ learnedIds: [MOVE_A, MOVE_B, MOVE_C] });
  scene.activeMoves = [MOVE_B, MOVE_C];
  scene._confirmAndExit();
  assert.equal(engine.getState().activeMoves.length, 2, 'engine should have 2 active moves');
  assert.equal(engine.getState().activeMoves[0], MOVE_B, 'first active move should be MOVE_B');
  assert.equal(engine.getState().activeMoves[1], MOVE_C, 'second active move should be MOVE_C');
});

test('KioskScene: _confirmAndExit() saves activeItems to engine state', () => {
  engine.init();
  const scene = makeScene({ consumableIds: [ITEM_A, ITEM_B, ITEM_C] });
  scene.activeItems = [ITEM_B, ITEM_C];
  scene._confirmAndExit();
  assert.equal(engine.getActiveItems().length, 2, 'engine should have 2 active items');
  assert.equal(engine.getActiveItems()[0], ITEM_B, 'first engine activeItem should be ITEM_B');
  assert.equal(engine.getActiveItems()[1], ITEM_C, 'second engine activeItem should be ITEM_C');
});

test('KioskScene: _confirmAndExit() calls onClose callback', () => {
  let closeCalled = false;
  const scene = makeScene({ onClose: () => { closeCalled = true; } });
  scene._confirmAndExit();
  assert.ok(closeCalled, 'onClose should be called on exit');
});

// ─── KioskScene: COLLECTION cursor navigation ─────────────────────────────────

test('KioskScene: _onRight() advances collCursor by 1', () => {
  const scene = makeScene({});
  scene.activeTab = 'collection';
  scene.collCursor = 2;
  scene._onRight();
  assert.equal(scene.collCursor, 3, 'collCursor should advance by 1');
});

test('KioskScene: _onLeft() decrements collCursor by 1', () => {
  const scene = makeScene({});
  scene.activeTab = 'collection';
  scene.collCursor = 3;
  scene._onLeft();
  assert.equal(scene.collCursor, 2, 'collCursor should decrement by 1');
});

test('KioskScene: _onDown() in collection advances collCursor by 5', () => {
  const scene = makeScene({});
  scene.activeTab = 'collection';
  scene.collCursor = 1;
  scene._onDown();
  assert.equal(scene.collCursor, 6, 'collCursor should advance by 5 (one row)');
});

test('KioskScene: _onUp() in collection decrements collCursor by 5', () => {
  const scene = makeScene({});
  scene.activeTab = 'collection';
  scene.collCursor = 7;
  scene._onUp();
  assert.equal(scene.collCursor, 2, 'collCursor should decrement by 5 (one row)');
});

test('KioskScene: collCursor does not go below 0', () => {
  const scene = makeScene({});
  scene.activeTab = 'collection';
  scene.collCursor = 0;
  scene._onLeft();
  assert.equal(scene.collCursor, 0, 'collCursor should not go below 0');
});

test('KioskScene: collCursor does not exceed last collectible index (10 collectibles, max index 9)', () => {
  const scene = makeScene({});
  scene.activeTab  = 'collection';
  scene.collCursor = 9;
  scene._onRight();
  assert.equal(scene.collCursor, 9, 'collCursor should not exceed 9');
});

// ─── KioskScene: MOVES scroll — _moveMovesCursor ──────────────────────────────

test('KioskScene: movesScrollOffset stays 0 when all moves fit within VISIBLE_ROWS', () => {
  const scene = makeSceneWithMoves(4);
  scene._moveMovesCursor(1);
  scene._moveMovesCursor(1);
  scene._moveMovesCursor(1); // cursor at 3 — still in window
  assert.equal(scene.movesScrollOffset, 0, 'movesScrollOffset should remain 0');
});

test('KioskScene: _moveMovesCursor(1) advances scroll when cursor exits bottom of window', () => {
  const scene = makeSceneWithMoves(12);
  scene.movesCursor = 7; // last visible row (VISIBLE_ROWS - 1 = 7)
  scene._moveMovesCursor(1); // cursor → 8
  assert.equal(scene.movesCursor,       8, 'cursor should be 8');
  assert.equal(scene.movesScrollOffset, 1, 'movesScrollOffset should advance to 1');
});

test('KioskScene: _moveMovesCursor wraps from last to 0 and resets scroll', () => {
  const scene = makeSceneWithMoves(10);
  scene.movesCursor       = 9;
  scene.movesScrollOffset = 2;
  scene._moveMovesCursor(1); // wraps to 0
  assert.equal(scene.movesCursor,       0, 'cursor should wrap to 0');
  assert.equal(scene.movesScrollOffset, 0, 'movesScrollOffset should reset to 0');
});

// ─── KioskScene: ITEMS scroll — _moveItemsCursor ──────────────────────────────

test('KioskScene: itemsScrollOffset stays 0 when all items fit within VISIBLE_ROWS', () => {
  const scene = makeSceneWithItems(5);
  scene._moveItemsCursor(1);
  scene._moveItemsCursor(1);
  assert.equal(scene.itemsScrollOffset, 0, 'itemsScrollOffset should remain 0');
});

test('KioskScene: _moveItemsCursor(1) advances scroll when cursor exits bottom of window', () => {
  const scene = makeSceneWithItems(15);
  scene.itemsCursor = 10; // last visible row (VISIBLE_ROWS - 1 = 10)
  scene._moveItemsCursor(1); // cursor → 11
  assert.equal(scene.itemsCursor,       11, 'cursor should be 11');
  assert.equal(scene.itemsScrollOffset,  1, 'itemsScrollOffset should advance to 1');
});

test('KioskScene: _moveItemsCursor wraps from last to 0 and resets scroll', () => {
  const scene = makeSceneWithItems(15);
  scene.itemsCursor       = 14;
  scene.itemsScrollOffset = 4;
  scene._moveItemsCursor(1); // wraps to 0
  assert.equal(scene.itemsCursor,       0, 'cursor should wrap to 0');
  assert.equal(scene.itemsScrollOffset, 0, 'itemsScrollOffset should reset to 0');
});
