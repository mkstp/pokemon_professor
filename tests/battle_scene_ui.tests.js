// tests/battle_scene_ui.test.js — consolidated version

import './phaser-stub.js';
import { test, assert } from './runner.js';
import BattleScene from '../js/scenes/BattleScene.js';
import * as engine from '../js/engine.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeScene(opponentId = 'prof_schwaartz', opponentType = 'professor') {
  const scene = Object.create(BattleScene.prototype);
  scene.opponentType = opponentType;
  scene.opponentId   = opponentId;
  return scene;
}

function mockText() {
  const t = { _visible: true };
  t.setVisible = v => { t._visible = v; return t; };
  return t;
}

function attachUI(scene) {
  scene.actionTexts   = [mockText(), mockText(), mockText()];
  scene.moveTexts     = [mockText(), mockText(), mockText(), mockText()];
  scene.moveBackText  = mockText();
  scene.moveDescText  = mockText();
  scene.battleLogText = mockText();
  scene.itemTexts     = [mockText(), mockText(), mockText(), mockText()];
  scene.itemBackText  = mockText();
  scene.itemDescText  = mockText();
}

function setupScene() {
  engine.init();
  const scene = makeScene();
  attachUI(scene);
  return scene;
}

// ─── _awardBattleXP ─────────────────────────────────────────────────────────

test('_awardBattleXP: professor gives more XP than student', () => {
  engine.init();
  makeScene('prof_schwaartz', 'professor')._awardBattleXP();
  const profXP = engine.getState().xp;

  engine.init();
  makeScene('student_rohan', 'student')._awardBattleXP();
  const studXP = engine.getState().xp;

  assert.ok(profXP > studXP);
});

// ─── drawHPBars ─────────────────────────────────────────────────────────────

test('drawHPBars: passes xp + xpToNextLevel to _drawPlayerXPBar', () => {
  engine.init();
  const scene = makeScene();
  scene.battleState = { professor: { hp: 80 }, opponent: { hp: 80 } };
  scene._drawProfHPBar = () => {};
  scene._drawPlayerHPBar = () => {};
  const calls = [];
  scene._drawPlayerXPBar = (xp, max) => calls.push({ xp, max });

  scene.drawHPBars();

  const { xp, xpToNextLevel } = engine.getState();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].xp, xp);
  assert.equal(calls[0].max, xpToNextLevel);
});

// ─── _drawPlayerXPBar (table-driven) ─────────────────────────────────────────

function makeXPScene() {
  const scene = makeScene();
  const calls = [];
  scene.playerXPBar = {
    clear: () => {},
    fillStyle: () => {},
    fillRect: (x, y, w, h) => calls.push(w),
  };
  scene._calls = calls;
  return scene;
}

[
  { xp: 0,   max: 100, expect: (c) => assert.equal(c[1], 0) },
  { xp: 50,  max: 0,   expect: (c) => assert.equal(c[1], 0) },
  { xp: 150, max: 100, expect: (c) => assert.equal(c[0], c[1]) },
].forEach(({ xp, max, expect }) => {
  test(`_drawPlayerXPBar: xp=${xp}, max=${max}`, () => {
    const scene = makeXPScene();
    scene._drawPlayerXPBar(xp, max);
    assert.equal(scene._calls.length, 2);
    expect(scene._calls);
  });
});

// ─── _endSeq helpers ────────────────────────────────────────────────────────

function makeEndScene({ levelled = false, amount = 20 } = {}) {
  const scene = makeScene();
  scene.battleState = { professor: { moves: [] } };
  scene._awardBattleXP = () => ({ levelled, amount });
  scene._runSequence = () => {};

  scene._xpAnimCalls = [];
  scene._logLines    = [];
  scene._xpBarCalls  = [];
  scene._levelTexts  = [];

  scene._animatePlayerXP = (f, t, m, next) => { scene._xpAnimCalls.push({ f, t, m }); next(); };
  scene._drawPlayerXPBar = (xp, max) => scene._xpBarCalls.push({ xp, max });
  scene._drawPlayerHPBar = () => {};
  scene._showLine        = (msg, next) => { scene._logLines.push(msg); next(); };
  scene.playerLevelText  = { setText: t => scene._levelTexts.push(t) };

  return scene;
}

// ─── _endSeq core cases ─────────────────────────────────────────────────────

test('_endSeq: loss does nothing', () => {
  engine.init();
  const scene = makeEndScene();
  const seq = [];
  scene._endSeq(seq, 'loss');
  assert.equal(seq.length, 0);
});

test('_endSeq: win (no level)', () => {
  engine.init();
  const scene = makeEndScene({ levelled: false });
  const seq = [];
  scene._endSeq(seq, 'win');
  seq.forEach(s => s(() => {}));

  assert.equal(scene._xpAnimCalls.length, 1);
  assert.equal(scene._logLines.length, 1);
});

test('_endSeq: win (level up)', () => {
  engine.init();
  const scene = makeEndScene({ levelled: true, amount: 50 });
  const seq = [];
  scene._endSeq(seq, 'win');
  seq.forEach(s => s(() => {}));

  assert.equal(scene._logLines.length, 3);
  assert.ok(scene._logLines[1].includes('Level'));
  assert.equal(scene._levelTexts.length, 1);
});

// ─── learnedMoves ───────────────────────────────────────────────────────────

test('_endSeq: awards moves on win only', () => {
  engine.init();
  const scene = makeEndScene();
  scene.battleState.professor.moves = ['a', 'b'];

  scene._endSeq([], 'win');
  assert.ok(engine.getState().learnedMoves.includes('a'));

  engine.init();
  scene._endSeq([], 'loss');
  assert.ok(!engine.getState().learnedMoves.includes('a'));
});

// ─── _openItemMenu ──────────────────────────────────────────────────────────

test('_openItemMenu: no items → _showNoItems', () => {
  engine.init();
  const scene = makeScene();
  let called = false;
  scene._showNoItems = () => { called = true; };
  scene._openItemMenu();
  assert.ok(called);
});

test('_openItemMenu: items present → switches mode', () => {
  const scene = setupScene();                // calls engine.init() internally
  engine.addItem('triscuit');
  engine.equipItem('triscuit');
  scene.battleState = { menuLevel: 'action', selectedItemIndex: 0, itemScrollOffset: 0 };
  scene.renderItemMenu = () => {};

  scene._openItemMenu();
  assert.equal(scene.battleState.menuLevel, 'items');
});

