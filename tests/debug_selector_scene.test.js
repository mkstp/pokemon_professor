// tests/debug_selector_scene.test.js — unit tests for DebugSelectorScene pagination
//
// Tests the _studPage instance property, page slicing logic, and nav button
// rendering conditions. Uses Object.create(DebugSelectorScene.prototype) to
// bypass Phaser scene initialisation.
//
// phaser-stub.js MUST be imported first — it sets globalThis.Phaser before
// DebugSelectorScene.js is evaluated.

import './phaser-stub.js';
import { test, assert } from './runner.js';
import DebugSelectorScene from '../js/scenes/DebugSelectorScene.js';

// ─── Test helpers ─────────────────────────────────────────────────────────────

// Creates a DebugSelectorScene instance without running Phaser's constructor.
function makeScene() {
  const scene = Object.create(DebugSelectorScene.prototype);

  // Track calls to _makeButton and _makeNavButton.
  scene._buttonCalls    = [];
  scene._navButtonCalls = [];

  // Minimal Phaser display list stubs.
  scene.children = { removeAll: () => {} };

  scene.add = {
    rectangle: () => ({ setInteractive: () => ({ on: () => {} }), on: () => {} }),
    text:      () => ({ setOrigin: () => ({}) }),
  };

  scene.scene = {
    launch: () => {},
    sleep:  () => {},
  };

  // Override _makeButton to record calls rather than create Phaser objects.
  scene._makeButton = function(x, y, w, h, title, subtitle, indexLabel, _onClick) {
    this._buttonCalls.push({ x, y, title, subtitle, indexLabel });
  };

  // Override _makeNavButton (to be added) to record calls.
  scene._makeNavButton = function(x, y, label, _onClick) {
    this._navButtonCalls.push({ x, y, label });
  };

  return scene;
}

// ─── _studPage initial state ──────────────────────────────────────────────────

test('DebugSelectorScene: wake() resets _studPage to 0 even when it was non-zero', () => {
  const scene = makeScene();
  scene._studPage = 1; // simulate having navigated to page 1
  // Stub out engine.init and _buildUI so wake() doesn't need a full environment.
  let buildUICalled = false;
  scene._buildUI = () => { buildUICalled = true; };
  // engine is a module import; we can test wake() sets _studPage before _buildUI.
  // Inject a fake engine.init by monkey-patching the call order indirectly:
  // wake() sets _studPage = 0, then calls engine.init(), then _buildUI().
  // We verify _studPage is 0 by the time _buildUI runs.
  let studPageAtBuildTime = null;
  scene._buildUI = () => { studPageAtBuildTime = scene._studPage; buildUICalled = true; };
  // We cannot easily stub the engine import, so call the method on the prototype
  // manually after patching _buildUI. engine.init() is safe to call (it just resets state).
  DebugSelectorScene.prototype.wake.call(scene);

  assert.equal(studPageAtBuildTime, 0, 'wake() should reset _studPage to 0 before _buildUI');
  assert.ok(buildUICalled, 'wake() should call _buildUI');
});

// ─── _buildUI pagination slicing ─────────────────────────────────────────────

test('DebugSelectorScene: page 0 renders exactly 8 student buttons', () => {
  const scene = makeScene();
  scene._studPage = 0;
  scene._buildUI();

  // _buttonCalls includes professor buttons too; filter to right column (STUD_COL_X = 300).
  const studButtons = scene._buttonCalls.filter(c => c.x === 300);
  assert.equal(studButtons.length, 8, 'page 0 should render exactly 8 student buttons');
});

test('DebugSelectorScene: page 1 renders the remaining 7 student buttons', () => {
  const scene = makeScene();
  scene._studPage = 1;
  scene._buildUI();

  const studButtons = scene._buttonCalls.filter(c => c.x === 300);
  assert.equal(studButtons.length, 7, 'page 1 should render 7 student buttons (15 - 8)');
});

test('DebugSelectorScene: student buttons on page 0 start at index #1', () => {
  const scene = makeScene();
  scene._studPage = 0;
  scene._buildUI();

  const studButtons = scene._buttonCalls.filter(c => c.x === 300);
  assert.equal(studButtons[0].indexLabel, '#1', 'first student button on page 0 should be #1');
  assert.equal(studButtons[7].indexLabel, '#8', 'last student button on page 0 should be #8');
});

test('DebugSelectorScene: student buttons on page 1 start at index #9', () => {
  const scene = makeScene();
  scene._studPage = 1;
  scene._buildUI();

  const studButtons = scene._buttonCalls.filter(c => c.x === 300);
  assert.equal(studButtons[0].indexLabel, '#9',  'first student button on page 1 should be #9');
  assert.equal(studButtons[6].indexLabel, '#15', 'last student button on page 1 should be #15');
});

test('DebugSelectorScene: professor column always shows all professors regardless of page', () => {
  const scene0 = makeScene();
  scene0._studPage = 0;
  scene0._buildUI();

  const scene1 = makeScene();
  scene1._studPage = 1;
  scene1._buildUI();

  const profButtons0 = scene0._buttonCalls.filter(c => c.x === 100);
  const profButtons1 = scene1._buttonCalls.filter(c => c.x === 100);

  assert.equal(profButtons0.length, profButtons1.length, 'professor count should be the same on both pages');
  assert.ok(profButtons0.length > 0, 'professor column should not be empty');
});

// ─── Nav button rendering conditions ─────────────────────────────────────────

test('DebugSelectorScene: Prev button is NOT rendered on page 0', () => {
  const scene = makeScene();
  scene._studPage = 0;
  scene._buildUI();

  const prevButtons = scene._navButtonCalls.filter(c => c.label === 'Prev');
  assert.equal(prevButtons.length, 0, 'Prev button should not appear on page 0');
});

test('DebugSelectorScene: Next button IS rendered on page 0', () => {
  const scene = makeScene();
  scene._studPage = 0;
  scene._buildUI();

  const nextButtons = scene._navButtonCalls.filter(c => c.label === 'Next');
  assert.equal(nextButtons.length, 1, 'Next button should appear on page 0');
});

test('DebugSelectorScene: Prev button IS rendered on page 1', () => {
  const scene = makeScene();
  scene._studPage = 1;
  scene._buildUI();

  const prevButtons = scene._navButtonCalls.filter(c => c.label === 'Prev');
  assert.equal(prevButtons.length, 1, 'Prev button should appear on page 1');
});

test('DebugSelectorScene: Next button is NOT rendered on last page', () => {
  const scene = makeScene();
  scene._studPage = 1; // last page (15 students, 8 per page => 2 pages)
  scene._buildUI();

  const nextButtons = scene._navButtonCalls.filter(c => c.label === 'Next');
  assert.equal(nextButtons.length, 0, 'Next button should not appear on last page');
});

// ─── Page navigation callbacks ────────────────────────────────────────────────

test('DebugSelectorScene: clicking Next increments _studPage and rebuilds UI', () => {
  const scene = makeScene();
  scene._studPage = 0;

  // Capture the Next button's onClick to invoke it directly.
  let nextClick = null;
  const origMakeNavButton = scene._makeNavButton.bind(scene);
  scene._makeNavButton = function(x, y, label, onClick) {
    origMakeNavButton(x, y, label, onClick);
    if (label === 'Next') nextClick = onClick;
  };

  scene._buildUI();
  assert.ok(nextClick !== null, 'Next button onClick should be captured');

  // Track _buildUI calls after clicking.
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

test('DebugSelectorScene: clicking Prev decrements _studPage and rebuilds UI', () => {
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
