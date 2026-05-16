// tests/scene_flow.test.js — scene navigation and audio integration tests
//
// Tests the routing logic of each scene's navigation methods in isolation.
// Phaser lifecycle (create/preload/update) is not exercised — only the
// method-level navigation and audio decisions are verified.
//
// Desired scene graph:
//   MainMenuScene
//     ├── [Full Game]   → sleep(MainMenuScene)  + launch(OverworldScene)
//     └── [Battle Mode] → sleep(MainMenuScene)  + launch(BattleModeScene)
//
//   OverworldScene (R key + confirm in KioskScene)
//     └── [return]      → stop(OverworldScene)  + wake(MainMenuScene)
//                         AudioScene is NOT stopped — MainMenuScene.wake() switches track
//
//   BattleModeScene
//     ├── [← Menu/ESC]  → sleep(BattleModeScene) + wake(MainMenuScene)
//     └── [select]      → launch(BattleScene, { returnScene: 'BattleModeScene' })
//                         + sleep(BattleModeScene)
//
//   BattleScene
//     ├── [professor win] → DialogueScene → audio.switchTo('overworld') + wake(returnScene)
//     └── [any other]     → audio.stop()                                + wake(returnScene)

import './phaser-stub.js';
import { test, assert } from './runner.js';
import MainMenuScene   from '../js/scenes/MainMenuScene.js';
import BattleModeScene from '../js/scenes/BattleModeScene.js';
import BattleScene     from '../js/scenes/BattleScene.js';
import KioskScene      from '../js/scenes/KioskScene.js';

// ── Shared stubs ──────────────────────────────────────────────────────────────

// Records all scene manager calls for assertion.
function makeSceneProxy({ activeKeys = ['OverworldScene'] } = {}) {
  const calls = [];
  return {
    _calls:   calls,
    sleep:    key        => calls.push({ method: 'sleep',  arg: key }),
    wake:     key        => calls.push({ method: 'wake',   arg: key }),
    launch:   (key, data)=> calls.push({ method: 'launch', arg: key, data }),
    stop:     key        => calls.push({ method: 'stop',   arg: key }),
    start:    key        => calls.push({ method: 'start',  arg: key }),
    isActive: key        => activeKeys.includes(key),
    get:      ()         => null,
  };
}

// Minimal AudioScene stub with call recording.
function makeAudioStub({ hasTracks = true } = {}) {
  const switched = [];
  const stopped  = [];
  const listeners = {};
  return {
    tracks:    hasTracks ? { intro_credits: {}, overworld: {}, battle: {} } : {},
    switchTo:  id  => switched.push(id),
    stop:      ()  => stopped.push(true),
    events:    { once: (evt, fn) => { listeners[evt] = fn; } },
    _switched: switched,
    _stopped:  stopped,
    _listeners: listeners,
  };
}

// ── MainMenuScene ─────────────────────────────────────────────────────────────

function makeMainMenu() {
  const scene    = Object.create(MainMenuScene.prototype);
  scene.scene    = makeSceneProxy();
  scene._cursor  = 0;
  scene._buildUI = () => {};
  return scene;
}

test('MainMenuScene: _enterFullGame sleeps MainMenuScene and launches OverworldScene', () => {
  const s = makeMainMenu();
  s._enterFullGame();
  assert.ok(s.scene._calls.some(c => c.method === 'sleep'  && c.arg === 'MainMenuScene'),  'should sleep MainMenuScene');
  assert.ok(s.scene._calls.some(c => c.method === 'launch' && c.arg === 'OverworldScene'), 'should launch OverworldScene');
});

test('MainMenuScene: _enterBattleMode sleeps MainMenuScene and launches BattleModeScene', () => {
  const s = makeMainMenu();
  s._enterBattleMode();
  assert.ok(s.scene._calls.some(c => c.method === 'sleep'  && c.arg === 'MainMenuScene'),   'should sleep MainMenuScene');
  assert.ok(s.scene._calls.some(c => c.method === 'launch' && c.arg === 'BattleModeScene'), 'should launch BattleModeScene');
});

test('MainMenuScene: wake() switches audio to intro_credits when AudioScene is ready', () => {
  const s     = makeMainMenu();
  const audio = makeAudioStub();
  s.scene.get = key => key === 'AudioScene' ? audio : null;
  s.wake();
  assert.ok(audio._switched.includes('intro_credits'), 'wake() should switchTo intro_credits');
});

test('MainMenuScene: wake() defers audio switch when AudioScene has no tracks yet', () => {
  const s     = makeMainMenu();
  const audio = makeAudioStub({ hasTracks: false });
  s.scene.get = key => key === 'AudioScene' ? audio : null;
  s.wake();
  assert.equal(audio._switched.length, 0, 'should not switchTo immediately');
  assert.ok(audio._listeners['create'], 'should register create listener');
  audio._listeners['create']();
  assert.ok(audio._switched.includes('intro_credits'), 'should switchTo after create fires');
});

// ── BattleModeScene ───────────────────────────────────────────────────────────

function makeBattleMode({ fromMainMenu = true } = {}) {
  const scene          = Object.create(BattleModeScene.prototype);
  scene.scene          = makeSceneProxy();
  scene._fromMainMenu  = fromMainMenu;
  scene._pendingUnlock = null;
  scene._buildUI       = () => {};
  return scene;
}

test('BattleModeScene: _goBack sleeps BattleModeScene and wakes MainMenuScene', () => {
  const s = makeBattleMode({ fromMainMenu: true });
  s._goBack();
  assert.ok(s.scene._calls.some(c => c.method === 'sleep' && c.arg === 'BattleModeScene'), 'should sleep BattleModeScene');
  assert.ok(s.scene._calls.some(c => c.method === 'wake'  && c.arg === 'MainMenuScene'),   'should wake MainMenuScene');
});

test('BattleModeScene: _goBack is a no-op when not launched from main menu', () => {
  const s = makeBattleMode({ fromMainMenu: false });
  s._goBack();
  assert.equal(s.scene._calls.length, 0, 'should make no scene calls');
});

test('BattleModeScene: _startBattle launches BattleScene and sleeps BattleModeScene', () => {
  const s = makeBattleMode();
  s._startBattle({ opponentType: 'student', studentId: 'npc_01' });
  assert.ok(s.scene._calls.some(c => c.method === 'launch' && c.arg === 'BattleScene'),      'should launch BattleScene');
  assert.ok(s.scene._calls.some(c => c.method === 'sleep'  && c.arg === 'BattleModeScene'), 'should sleep BattleModeScene');
});

test('BattleModeScene: _startBattle passes returnScene: BattleModeScene to BattleScene', () => {
  const s = makeBattleMode();
  s._startBattle({ opponentType: 'student', studentId: 'npc_01' });
  const launch = s.scene._calls.find(c => c.method === 'launch' && c.arg === 'BattleScene');
  assert.ok(launch, 'BattleScene should be launched');
  assert.equal(launch.data && launch.data.returnScene, 'BattleModeScene', 'launch data should include returnScene');
});

// ── BattleScene ───────────────────────────────────────────────────────────────

function makeBattleSceneFor({ opponentType = 'professor', returnScene = 'OverworldScene', outcome = 'win' } = {}) {
  const scene    = Object.create(BattleScene.prototype);
  const sceneCalls = [];
  const audio    = makeAudioStub();

  scene.opponentType = opponentType;
  scene.returnScene  = returnScene;
  scene.battleState  = {
    outcome,
    phase:     'end',
    professor: { dialogue: { postWin: 'test_postwin_seq' } },
  };

  scene.scene = {
    _calls: sceneCalls,
    stop:   key        => sceneCalls.push({ method: 'stop',   arg: key }),
    wake:   key        => sceneCalls.push({ method: 'wake',   arg: key }),
    launch: (key, data)=> sceneCalls.push({ method: 'launch', arg: key, data }),
    get:    ()         => audio,
  };
  scene._audio = audio;

  return scene;
}

test('BattleScene: non-professor battle end stops audio and wakes returnScene', () => {
  const s = makeBattleSceneFor({ opponentType: 'student', returnScene: 'BattleModeScene' });
  s.endBattle();
  assert.ok(s._audio._stopped.length > 0,
    'should stop audio for NPC battle end');
  assert.ok(s.scene._calls.some(c => c.method === 'wake' && c.arg === 'BattleModeScene'),
    'should wake BattleModeScene');
});

test('BattleScene: non-professor battle end does not wake OverworldScene', () => {
  const s = makeBattleSceneFor({ opponentType: 'student', returnScene: 'BattleModeScene' });
  s.endBattle();
  assert.equal(
    s.scene._calls.filter(c => c.method === 'wake' && c.arg === 'OverworldScene').length, 0,
    'should not wake OverworldScene when returnScene is BattleModeScene',
  );
});

test('BattleScene: professor win from overworld launches DialogueScene first, then wakes OverworldScene', () => {
  const s = makeBattleSceneFor({ opponentType: 'professor', returnScene: 'OverworldScene', outcome: 'win' });
  s.endBattle();
  assert.ok(s.scene._calls.some(c => c.method === 'launch' && c.arg === 'DialogueScene'),
    'should launch DialogueScene for post-win sequence');
  // Dialogue completes — simulate onComplete callback.
  const dl = s.scene._calls.find(c => c.method === 'launch' && c.arg === 'DialogueScene');
  dl.data.onComplete();
  assert.ok(s._audio._switched.includes('overworld'), 'should switch to overworld music after dialogue');
  assert.ok(s.scene._calls.some(c => c.method === 'wake' && c.arg === 'OverworldScene'),
    'should wake OverworldScene after dialogue');
});

test('BattleScene: professor win from BattleModeScene wakes BattleModeScene, not OverworldScene', () => {
  const s = makeBattleSceneFor({ opponentType: 'professor', returnScene: 'BattleModeScene', outcome: 'win' });
  s.endBattle();
  const dl = s.scene._calls.find(c => c.method === 'launch' && c.arg === 'DialogueScene');
  dl.data.onComplete();
  assert.ok(s.scene._calls.some(c => c.method === 'wake' && c.arg === 'BattleModeScene'),
    'should wake BattleModeScene');
  assert.equal(
    s.scene._calls.filter(c => c.method === 'wake' && c.arg === 'OverworldScene').length, 0,
    'should not wake OverworldScene',
  );
});

// ── KioskScene._executeReturnToTitle ─────────────────────────────────────────

function makeKioskForReturn() {
  const scene = Object.create(KioskScene.prototype);
  const calls = [];
  scene.scene = {
    _calls:   calls,
    stop:     key => calls.push({ method: 'stop',  arg: key }),
    wake:     key => calls.push({ method: 'wake',  arg: key }),
    start:    key => calls.push({ method: 'start', arg: key }),
    isActive: key => key === 'OverworldScene',
  };
  return scene;
}

test('KioskScene: _executeReturnToTitle stops OverworldScene', () => {
  const s = makeKioskForReturn();
  s._executeReturnToTitle();
  assert.ok(s.scene._calls.some(c => c.method === 'stop' && c.arg === 'OverworldScene'),
    'should stop OverworldScene');
});

test('KioskScene: _executeReturnToTitle wakes MainMenuScene (does not start)', () => {
  const s = makeKioskForReturn();
  s._executeReturnToTitle();
  assert.ok(s.scene._calls.some(c => c.method === 'wake' && c.arg === 'MainMenuScene'),
    'should wake MainMenuScene');
  assert.equal(
    s.scene._calls.filter(c => c.method === 'start' && c.arg === 'MainMenuScene').length, 0,
    'should not call start — that would bypass wake() and reset the scene',
  );
});

test('KioskScene: _executeReturnToTitle does not stop AudioScene', () => {
  const s = makeKioskForReturn();
  s._executeReturnToTitle();
  assert.equal(
    s.scene._calls.filter(c => c.method === 'stop' && c.arg === 'AudioScene').length, 0,
    'AudioScene must stay running so MainMenuScene.wake() can switch tracks',
  );
});
