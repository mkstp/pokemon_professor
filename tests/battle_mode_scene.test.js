// tests/battle_mode_scene.test.js — unit tests for BattleModeScene pagination
//
// Tests the _studPage instance property, page slicing logic, and nav button
// rendering conditions. Uses Object.create(BattleModeScene.prototype) to
// bypass Phaser scene initialisation.
//
// phaser-stub.js MUST be imported first — it sets globalThis.Phaser before
// BattleModeScene.js is evaluated.

import './phaser-stub.js';
import { test, assert } from './runner.js';
import BattleModeScene from '../js/scenes/BattleModeScene.js';
import { professors } from '../js/data/professors.js';
import { studentNPCs } from '../js/data/students.js';

const OPPS_PER_PAGE  = 8;
const TOTAL_OPPS     = professors.length + studentNPCs.length;
const LAST_PAGE      = Math.ceil(TOTAL_OPPS / OPPS_PER_PAGE) - 1;

// ─── Test helpers ─────────────────────────────────────────────────────────────

// Creates a BattleModeScene instance without running Phaser's constructor.
function makeScene() {
  const scene = Object.create(BattleModeScene.prototype);

  scene._studPage  = 0;
  scene._activeTab = 'opponents';

  // Track calls to _makeButton and _makeNavButton.
  scene._buttonCalls    = [];
  scene._navButtonCalls = [];

  // Minimal Phaser display list stubs.
  scene.children = { removeAll: () => {} };

  scene.add = {
    rectangle: () => ({ setInteractive: () => ({ on: () => {} }), on: () => {} }),
    text:      () => ({ setOrigin: () => ({}) }),
    graphics:  () => ({ clear: () => {}, fillStyle: () => {}, fillRect: () => {},
                        lineStyle: () => {}, strokeRect: () => {}, lineBetween: () => {} }),
  };

  scene.scene = {
    launch: () => {},
    sleep:  () => {},
    get:    () => null,
  };

  // Override _makeButton to record calls rather than create Phaser objects.
  scene._makeButton = function(x, y, w, h, title, subtitle, indexLabel, _onClick) {
    this._buttonCalls.push({ x, y, title, subtitle, indexLabel });
  };

  scene._makeNavButton = function(x, y, label, _onClick) {
    this._navButtonCalls.push({ x, y, label });
  };

  return scene;
}

// ─── _studPage initial state ──────────────────────────────────────────────────

test('BattleModeScene: wake() resets _studPage to 0 even when it was non-zero', () => {
  const scene = makeScene();
  scene._studPage = 1;
  let studPageAtBuildTime = null;
  scene._buildUI = () => { studPageAtBuildTime = scene._studPage; };
  BattleModeScene.prototype.wake.call(scene);

  assert.equal(studPageAtBuildTime, 0, 'wake() should reset _studPage to 0 before _buildUI');
});

// ─── _buildUI pagination slicing ─────────────────────────────────────────────

test('BattleModeScene: opponent buttons on page 0 start at index #1', () => {
  const scene = makeScene();
  scene._studPage = 0;
  scene._buildUI();

  const buttons = scene._buttonCalls;
  assert.equal(buttons[0].indexLabel, '#1', 'first button on page 0 should be #1');
  assert.equal(buttons[7].indexLabel, '#8', 'last button on page 0 should be #8');
});

test('BattleModeScene: opponent buttons on page 1 start at index #9', () => {
  const scene = makeScene();
  scene._studPage = 1;
  scene._buildUI();

  const buttons = scene._buttonCalls;
  assert.equal(buttons[0].indexLabel, '#9',  'first button on page 1 should be #9');
  assert.equal(buttons[7].indexLabel, '#16', 'last button on page 1 should be #16');
});

// ─── Nav button rendering conditions ─────────────────────────────────────────

test('BattleModeScene: page 0 shows Next but not Prev', () => {
  const scene = makeScene();
  scene._studPage = 0;
  scene._buildUI();

  assert.equal(scene._navButtonCalls.filter(c => c.label === 'Prev').length, 0, 'Prev should not appear on page 0');
  assert.equal(scene._navButtonCalls.filter(c => c.label === 'Next').length, 1, 'Next should appear on page 0');
});

test('BattleModeScene: last page shows Prev but not Next', () => {
  const scene = makeScene();
  scene._studPage = LAST_PAGE;
  scene._buildUI();

  assert.equal(scene._navButtonCalls.filter(c => c.label === 'Prev').length, 1, 'Prev should appear on last page');
  assert.equal(scene._navButtonCalls.filter(c => c.label === 'Next').length, 0, 'Next should not appear on last page');
});

// ─── Page navigation callbacks ────────────────────────────────────────────────

test('BattleModeScene: clicking Next increments _studPage and rebuilds UI', () => {
  const scene = makeScene();
  scene._studPage = 0;

  let nextClick = null;
  const origMakeNavButton = scene._makeNavButton.bind(scene);
  scene._makeNavButton = function(x, y, label, onClick) {
    origMakeNavButton(x, y, label, onClick);
    if (label === 'Next') nextClick = onClick;
  };

  scene._buildUI();
  assert.ok(nextClick !== null, 'Next button onClick should be captured');

  let buildUICalls = 0;
  const origBuildUI = scene._buildUI.bind(scene);
  scene._buildUI = function() {
    buildUICalls++;
    origBuildUI();
  };

  nextClick();
  assert.equal(scene._studPage, 1, 'clicking Next should increment _studPage to 1');
  assert.equal(buildUICalls, 1, 'clicking Next should call _buildUI once');
});

test('BattleModeScene: clicking Prev decrements _studPage and rebuilds UI', () => {
  const scene = makeScene();
  scene._studPage = 1;

  let prevClick = null;
  const origMakeNavButton = scene._makeNavButton.bind(scene);
  scene._makeNavButton = function(x, y, label, onClick) {
    origMakeNavButton(x, y, label, onClick);
    if (label === 'Prev') prevClick = onClick;
  };

  scene._buildUI();
  assert.ok(prevClick !== null, 'Prev button onClick should be captured');

  let buildUICalls = 0;
  const origBuildUI = scene._buildUI.bind(scene);
  scene._buildUI = function() {
    buildUICalls++;
    origBuildUI();
  };

  prevClick();
  assert.equal(scene._studPage, 0, 'clicking Prev should decrement _studPage to 0');
  assert.equal(buildUICalls, 1, 'clicking Prev should call _buildUI once');
});
