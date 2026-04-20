// BattleScene.js — turn-based battle scene
//
// Receives opponent data from OverworldScene via scene init data:
//   { opponentType: 'professor', professorId } — professor battle
//   { opponentType: 'student',   studentId   } — student NPC battle (debug mode)
// Builds all battle UI as Phaser GameObjects, handles keyboard input, and resolves
// move interactions each turn. Returns control to OverworldScene on battle end.
//
// Canvas: 400×400 px (defined in game.js config; debug.html uses 400×900).
// Depends on: engine.js (state reads/writes), data/professors.js,
//             data/students.js, data/moves.js

import * as engine from '../engine.js';

import { professors }                            from '../data/professors.js';
import { studentNPCs }                           from '../data/students.js';
import { playerMoves, professorMoves, npcMoves } from '../data/moves.js';
import { items }                                 from '../data/items.js';
import { applyDeferredDamage, applyPlayerMove, applyOpponentTurn } from './battle/resolver.js';

// --- Layout constants (canvas pixels) ---

// Battle area occupies the top 235 px; UI panel fills the remaining 165 px.
const UI_PANEL_Y = 235;
const UI_PANEL_H = 165;

// Professor sprite: front-facing, upper-right.
const PROF_SPRITE_X     = 290;
const PROF_SPRITE_Y     =  95;
const PROF_SPRITE_SCALE = 1; // 192 px source → displayed at native size

// Player sprite: back-facing, lower-left of the battle area.
const PLAYER_SPRITE_X     = 107;
const PLAYER_SPRITE_Y     = 178;
const PLAYER_SPRITE_SCALE = 0.55;

// Professor HP info box: top-left of battle area.
const PROF_HP_LABEL_X = 14;
const PROF_HP_LABEL_Y = 12;
const PROF_HP_BAR_X   = 14;
const PROF_HP_BAR_Y   = 30;

// Player HP info box: lower-right of battle area.
const PLAYER_HP_LABEL_X = 220;
const PLAYER_HP_LABEL_Y = 190;
const PLAYER_HP_BAR_X   = 220;
const PLAYER_HP_BAR_Y   = 208;
const PLAYER_HP_NUM_X   = 350; // x for the "85/100" numbers

// Shared HP bar dimensions.
const HP_BAR_W = 168;
const HP_BAR_H =   8;

// Player XP bar: sits beneath the HP bar (HP_BAR_Y + HP_BAR_H + 4px gap).
const PLAYER_XP_BAR_X = 220;
const PLAYER_XP_BAR_Y = 220; // 208 + 8 + 4
const XP_BAR_H        =   5;

// Move menu: stacked vertically in the left half of the UI panel.
const MOVE_X      =  16;
const MOVE_Y_BASE = UI_PANEL_Y + 14;
const MOVE_STEP   =  30; // pixels between each move row

// Battle log: same origin as the move menu; appears instead of it during resolve.
const LOG_X = 14;
const LOG_Y = UI_PANEL_Y + 12;

// Duration of an HP bar drain animation (ms).
const HP_ANIM_MS = 1200;
// Brief pause after an HP animation completes before the next step begins (ms).
const HP_POST_PAUSE = 500;

// Unified move lookup across all three tables. IDs are globally unique, so merging is safe.
// Used to resolve activeMoves IDs to move objects regardless of which table they originated from.
const ALL_MOVE_MAP = Object.fromEntries(
  [...professorMoves, ...npcMoves, ...playerMoves].map(m => [m.id, m])
);

// XP awarded to the player on battle victory, by opponent type.
const XP_PER_PROFESSOR = 50;
const XP_PER_STUDENT   = 20;

// Top-level action menu labels, in display order.
const ACTIONS = ['Fight', 'Run', 'Item'];

// ─── Scene ───────────────────────────────────────────────────────────────────

export default class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
  }

  // Receives opponent data from OverworldScene.
  // opponentType defaults to 'professor' for backward compatibility with OverworldScene.
  // opponentId resolves from either professorId or studentId, whichever is present.
  init(data) {
    this.opponentType = data.opponentType ?? 'professor';
    this.opponentId   = data.professorId  ?? data.studentId;
  }

  // Loads battle sprites. Skips the load if Phaser already cached the texture.
  // Professors with a sprites[] array get each level loaded under the key
  // '<opponentId>_l1', '<opponentId>_l2', etc. Student NPCs and single-image
  // professors use the opponentId key directly.
  preload() {
    const opponent = this.opponentType === 'student'
      ? studentNPCs.find(s => s.id === this.opponentId)
      : professors.find(p => p.id === this.opponentId);

    if (opponent.sprites) {
      // Multi-level sprite (professors only — students always have a single sprite).
      opponent.sprites.forEach((path, i) => {
        const key = `${this.opponentId}_l${i + 1}`;
        if (!this.textures.exists(key)) {
          this.load.image(key, path);
        }
      });
    } else {
      if (!this.textures.exists(this.opponentId)) {
        this.load.image(this.opponentId, opponent.sprite);
      }
    }
    if (!this.textures.exists('player_battle')) {
      this.load.image('player_battle', 'assets/sprites/battle/player.png');
    }
  }

  // Builds all battle UI GameObjects and initialises battleState.
  create() {
    const prof = this.opponentType === 'student'
      ? studentNPCs.find(s => s.id === this.opponentId)
      : professors.find(p => p.id === this.opponentId);

    // Holds the `next` callback for the current dialogue line awaiting player input.
    // Null when no line is waiting; set by _showLine(), cleared by the advance handler.
    this._advanceCallback = null;

    // Build the active move list from engine state — set by the move selection kiosk.
    const activeMoves = engine.getState().activeMoves.map(id => ALL_MOVE_MAP[id]);

    // battleState is the authoritative source of truth for this scene.
    // 'professor' stores the opponent object regardless of opponentType — the field
    // name is legacy from when only professors were opponents.
    //
    // Symmetric entity model: bs.player and bs.opponent expose the same interface.
    // resolver.js swaps self/target references on each turn so the unified effects
    // map works identically regardless of which side is acting.
    const { playerHP, playerMaxHP } = engine.getState();
    const makeEntity = ({ hp, maxHP, name }) => ({
      hp, maxHP, name,
      skippedTurns:    0,
      outgoingHalved:  false,
      outgoingDoubled: false,
      outgoingBonus:   0,
      boostedTurns:    0,
      boostedAmount:   0,
      vulnTurns:       0,
      vulnBonus:       5,
      incomingHalved:  false,
      reducedNext:     0,
      priority:        false,
      lastDamage:      0,
      lastEffect:      null,
      pendingSwapped:  null,
      deferredIncoming: 0,
      lockedMove:      null,
    });
    this.battleState = {
      professor:           prof,
      player:              makeEntity({ hp: playerHP, maxHP: playerMaxHP, name: 'You' }),
      opponent:            makeEntity({ hp: prof.hp,  maxHP: prof.hp,     name: prof.name }),
      playerMoves:         activeMoves,
      selectedMoveIndex:   0,
      menuLevel:           'action', // 'action' | 'moves' | 'items'
      selectedActionIndex: 0,
      selectedItemIndex:   0,
      itemScrollOffset:    0,
      phase:               'select', // 'select' | 'resolve' | 'animating' | 'end' | 'done'
      outcome:             null,     // null | 'win' | 'loss' | 'fled'
    };

    // --- Background ---
    this.add.rectangle(200, 200, 400, 400, 0xffffff);
    // UI panel
    this.add.rectangle(200, UI_PANEL_Y + UI_PANEL_H / 2, 400, UI_PANEL_H, 0xf0f0f0);
    // Panel border
    this.add.rectangle(200, UI_PANEL_Y, 400, 2, 0x888888);

    // --- Battle sprites ---
    // Initial texture: l1 (full-HP level) for multi-level professors, or the
    // single sprite key for student NPCs and single-image professors.
    const initialTexture = prof.sprites ? `${this.opponentId}_l1` : this.opponentId;
    this.professorSprite = this.add.image(PROF_SPRITE_X, PROF_SPRITE_Y, initialTexture)
      .setScale(PROF_SPRITE_SCALE)
      .setOrigin(0.5);

    this.add.image(PLAYER_SPRITE_X, PLAYER_SPRITE_Y, 'player_battle')
      .setScale(PLAYER_SPRITE_SCALE)
      .setOrigin(0.5);

    // --- HP bars (Graphics objects; redrawn whenever HP changes) ---
    this.profHPBar   = this.add.graphics();
    this.playerHPBar = this.add.graphics();
    this.playerXPBar = this.add.graphics();

    // --- Name / HP labels ---
    this.add.text(PROF_HP_LABEL_X, PROF_HP_LABEL_Y, prof.name, {
      fontSize: '11px', fill: '#222222', fontFamily: 'monospace',
    });

    this.add.text(PLAYER_HP_LABEL_X, PLAYER_HP_LABEL_Y, 'You', {
      fontSize: '11px', fill: '#222222', fontFamily: 'monospace',
    });

    // Numeric HP counter shown next to the player HP bar.
    this.playerHPText = this.add.text(PLAYER_HP_NUM_X, PLAYER_HP_BAR_Y - 2, '', {
      fontSize: '10px', fill: '#226622', fontFamily: 'monospace',
    });

    // Level indicator shown to the right of the "You" label row.
    this.playerLevelText = this.add.text(PLAYER_HP_NUM_X, PLAYER_HP_LABEL_Y, `Lv.${engine.getState().level}`, {
      fontSize: '10px', fill: '#226622', fontFamily: 'monospace',
    });

    // --- Action menu: three Text objects for Fight / Run / Item ---
    // Shown at the start of each turn. Selecting Fight reveals the move submenu.
    this.actionTexts = ACTIONS.map((_, i) =>
      this.add.text(MOVE_X, MOVE_Y_BASE + i * MOVE_STEP, '', {
        fontSize: '13px', fill: '#222266', fontFamily: 'monospace',
      })
    );

    // --- Move menu: four Text objects, one per active player move ---
    // Hidden until the player selects Fight from the action menu.
    this.moveTexts = activeMoves.map((_, i) =>
      this.add.text(MOVE_X, MOVE_Y_BASE + i * MOVE_STEP, '', {
        fontSize: '13px', fill: '#222266', fontFamily: 'monospace',
      })
    );
    this.moveTexts.forEach(t => t.setVisible(false));

    // --- Move description: shown in the right half of the UI panel when the
    // move submenu is open. Updates dynamically as the cursor moves.
    this.moveDescText = this.add.text(205, MOVE_Y_BASE, '', {
      fontSize: '11px', fill: '#443300', fontFamily: 'monospace',
      wordWrap: { width: 170 },
    }).setVisible(false);

    // --- Item menu: four Text objects (same positions as moveTexts), hidden until player
    // selects Item from the action menu. Shows consumable items in inventory.
    this.itemTexts = [0, 1, 2, 3].map(i =>
      this.add.text(MOVE_X, MOVE_Y_BASE + i * MOVE_STEP, '', {
        fontSize: '13px', fill: '#222266', fontFamily: 'monospace',
      }).setVisible(false)
    );

    // --- Item description: shown in the right panel when the item submenu is open.
    this.itemDescText = this.add.text(205, MOVE_Y_BASE, '', {
      fontSize: '11px', fill: '#443300', fontFamily: 'monospace',
      wordWrap: { width: 170 },
    }).setVisible(false);

    // --- Battle log: replaces the move menu during turn resolution ---
    this.battleLogText = this.add.text(LOG_X, LOG_Y, '', {
      fontSize: '13px', fill: '#443300', fontFamily: 'monospace',
      wordWrap: { width: 370 },
    }).setVisible(false);

    // Prompt indicator shown while waiting for the player to advance a log line.
    this.advancePrompt = this.add.text(366, 388, '▼', {
      fontSize: '12px', fill: '#443300', fontFamily: 'monospace',
    }).setVisible(false);

    // --- Keyboard input ---
    const keys = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.UP,
      down:  Phaser.Input.Keyboard.KeyCodes.DOWN,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      esc:   Phaser.Input.Keyboard.KeyCodes.ESC,
      r:     Phaser.Input.Keyboard.KeyCodes.R,
    });

    keys.up.on('down', () => {
      if (this.battleState.phase !== 'select') return;
      if (this.battleState.menuLevel === 'action') {
        this.battleState.selectedActionIndex =
          (this.battleState.selectedActionIndex - 1 + ACTIONS.length) % ACTIONS.length;
        this.renderActionMenu();
      } else if (this.battleState.menuLevel === 'items') {
        if (this.battleState.selectedItemIndex > 0) {
          this.battleState.selectedItemIndex--;
          if (this.battleState.selectedItemIndex < this.battleState.itemScrollOffset) {
            this.battleState.itemScrollOffset--;
          }
          this.renderItemMenu();
        }
      } else {
        const len = this.battleState.playerMoves.length;
        this.battleState.selectedMoveIndex =
          (this.battleState.selectedMoveIndex - 1 + len) % len;
        this.renderMoveMenu();
      }
    });

    keys.down.on('down', () => {
      if (this.battleState.phase !== 'select') return;
      if (this.battleState.menuLevel === 'action') {
        this.battleState.selectedActionIndex =
          (this.battleState.selectedActionIndex + 1) % ACTIONS.length;
        this.renderActionMenu();
      } else if (this.battleState.menuLevel === 'items') {
        const activeItems = engine.getActiveItems();
        if (this.battleState.selectedItemIndex < activeItems.length - 1) {
          this.battleState.selectedItemIndex++;
          if (this.battleState.selectedItemIndex >= this.battleState.itemScrollOffset + 4) {
            this.battleState.itemScrollOffset++;
          }
          this.renderItemMenu();
        }
      } else {
        const len = this.battleState.playerMoves.length;
        this.battleState.selectedMoveIndex =
          (this.battleState.selectedMoveIndex + 1) % len;
        this.renderMoveMenu();
      }
    });

    const confirmMove = () => {
      if (this._advanceCallback) {
        // A battle log line is waiting for player input — advance it.
        const cb = this._advanceCallback;
        this._advanceCallback = null;
        this.advancePrompt.setVisible(false);
        this.scene.get('AudioScene').play('sfx_dialogue_adv');
        cb();
        return;
      }
      if (this.battleState.phase !== 'select') return;
      if (this.battleState.menuLevel === 'action') {
        const action = this.battleState.selectedActionIndex;
        if (action === 0) {
          // Fight — open the move submenu.
          this.battleState.menuLevel = 'moves';
          this._setUIMode('moves');
          this.renderMoveMenu();
        } else if (action === 1) {
          // Run.
          this.flee();
        } else {
          // Item — open item submenu.
          this._openItemMenu();
        }
      } else if (this.battleState.menuLevel === 'moves') {
        this.selectMove(this.battleState.selectedMoveIndex);
      } else if (this.battleState.menuLevel === 'items') {
        this._confirmItemUse();
      }
    };
    keys.enter.on('down', confirmMove);
    keys.space.on('down', confirmMove);

    const backOrFlee = () => {
      if (this.battleState.phase !== 'select') return;
      if (this.battleState.menuLevel === 'moves') {
        // ESC from move submenu → back to action menu.
        this.battleState.menuLevel = 'action';
        this._setUIMode('action');
        this.renderActionMenu();
      } else if (this.battleState.menuLevel === 'items') {
        // ESC from item submenu → back to action menu.
        this.battleState.menuLevel = 'action';
        this._setUIMode('action');
        this.renderActionMenu();
      } else {
        this.flee();
      }
    };
    keys.esc.on('down', backOrFlee);
    keys.r.on('down', backOrFlee);

    // --- Initial render ---
    this.drawHPBars();
    this.renderActionMenu();

    // --- Start battle music ---
    // Browsers block audio until a user gesture has occurred (autoplay policy).
    // AudioScene is also loaded in parallel and may not have finished populating
    // this.tracks yet. Deferring until the 'unlocked' event solves both: by the
    // time the player presses any key, the audio context is open and AudioScene
    // is guaranteed to be ready.
    // Student NPCs don't have a dedicated battleMusic field; fall back to 'battle_default'.
    const trackId = prof.battleMusic ?? 'battle_default';
    if (this.sound.locked) {
      this.sound.once('unlocked', () => {
        this.scene.get('AudioScene').switchTo(trackId);
      });
    } else {
      this.scene.get('AudioScene').switchTo(trackId);
    }
  }

  // Called every frame by Phaser. Only acts on phase transitions.
  update() {
    if (this.battleState.phase === 'resolve') {
      this.resolveTurn();
    } else if (this.battleState.phase === 'end') {
      this.endBattle();
    }
  }

  // ─── Battle logic ─────────────────────────────────────────────────────────

  // Locks in the player's chosen move and sets phase to 'resolve'.
  // Switches the UI from the move menu to the battle log.
  selectMove(moveIndex) {
    this.battleState.selectedMoveIndex = moveIndex;
    this.battleState.phase = 'resolve';
    this._setUIMode('log');
  }

  // Orchestrates the full turn: deferred damage → player move → professor move.
  // Builds a seq[] of visual steps played back by _runSequence() after all logic
  // resolves. Sets phase to 'animating' on entry to prevent re-entry from update().
  //
  // ctx bundles the seq array and its three push-helpers (text, animP, animPl) into
  // a single object passed to each sub-function so they can contribute steps without
  // needing direct access to the outer seq variable.
  //
  // Note: engine.setPlayerHP(n) resets to 100 when n ≤ 0 (faint/respawn).
  // Loss conditions are therefore checked against the raw pre-clamp value.
  resolveTurn() {
    this.battleState.phase = 'animating'; // prevent re-entry

    const bs  = this.battleState;
    const seq = []; // ordered visual steps: text lines and HP animations

    const text   = msg    => seq.push(next => this._showLine(msg, next));
    const animP  = (f, t) => seq.push(next => this._animateProfHP(f, t, next));
    const animPl = (f, t) => seq.push(next => this._animatePlayerHP(f, t, next));

    const ctx = { bs, seq, text, animP, animPl, opponentType: this.opponentType, opponentId: this.opponentId };

    // Deferred damage always applies first, regardless of priority.
    if (applyDeferredDamage(ctx)) return this._endSeq(seq, 'loss');

    // Priority: NPC goes first only if opponent.priority is set and player.priority is not.
    const npcGoesFirst = bs.opponent.priority && !bs.player.priority;
    bs.opponent.priority = false;
    bs.player.priority   = false;

    if (npcGoesFirst) {
      const profResult = applyOpponentTurn(ctx);
      if (profResult) return this._endSeq(seq, profResult);
      const playerResult = applyPlayerMove(ctx);
      if (playerResult) return this._endSeq(seq, playerResult);
    } else {
      const playerResult = applyPlayerMove(ctx);
      if (playerResult) return this._endSeq(seq, playerResult);
      const profResult = applyOpponentTurn(ctx);
      if (profResult) return this._endSeq(seq, profResult);
    }

    // Turn complete — run the visual sequence, then return to the action menu.
    this._runSequence(seq, () => {
      bs.phase = 'select';
      bs.menuLevel = 'action';
      bs.selectedActionIndex = 0;
      this._setUIMode('action');
      this.renderActionMenu();
    });
  }

  // Exits the battle without resolution. The professor is not defeated.
  flee() {
    this.battleState.outcome = 'fled';
    this.battleState.phase   = 'end';
  }

  // Stops the battle scene and returns control to OverworldScene.
  // For a win, launches DialogueScene with the post-battle sequence first.
  endBattle() {
    this.battleState.phase = 'done'; // prevent re-entry from update()

    const audio = this.scene.get('AudioScene');

    if (this.battleState.outcome === 'win' && this.opponentType === 'professor') {
      // Professor win: play post-battle dialogue before returning to the overworld.
      const sequenceKey = this.battleState.professor.dialogue.postWin;
      this.scene.launch('DialogueScene', {
        sequenceKey,
        onComplete: () => {
          audio.switchTo('overworld');
          this.scene.stop('BattleScene');
          this.scene.wake('OverworldScene');
        },
      });
    } else {
      // Student NPC battle end: stop battle music and return to the battle mode selector.
      // BattleModeScene.wake() is responsible for starting intro_credits.
      // Do not call switchTo('overworld') here — the battle mode selector is not the overworld.
      audio.stop();
      this.scene.stop('BattleScene');
      this.scene.wake('OverworldScene');
    }
  }

  // ─── Render helpers ───────────────────────────────────────────────────────

  // Redraws both HP bars at the current engine/battleState values.
  // Called once on scene creation; individual bars are updated via the
  // _drawProfHPBar / _drawPlayerHPBar helpers during animations.
  drawHPBars() {
    this._drawProfHPBar(this.battleState.opponent.hp);
    this._drawPlayerHPBar(engine.getState().playerHP);
    const { xp, xpToNextLevel } = engine.getState();
    this._drawPlayerXPBar(xp, xpToNextLevel);
  }

  // Redraws the professor HP bar at the given hp value and updates the sprite.
  _drawProfHPBar(hp) {
    const profMaxHP = this.battleState.professor.hp;
    const ratio     = Math.max(0, hp / profMaxHP);
    this.profHPBar.clear();
    this.profHPBar.fillStyle(0xcccccc);
    this.profHPBar.fillRect(PROF_HP_BAR_X, PROF_HP_BAR_Y, HP_BAR_W, HP_BAR_H);
    this.profHPBar.fillStyle(this._hpColour(ratio));
    this.profHPBar.fillRect(PROF_HP_BAR_X, PROF_HP_BAR_Y, Math.floor(HP_BAR_W * ratio), HP_BAR_H);
    this._updateProfSprite(ratio);
  }

  // Redraws the player HP bar and numeric counter at the given hp value.
  _drawPlayerHPBar(hp) {
    const maxHP = engine.getState().playerMaxHP;
    const ratio = Math.max(0, hp / maxHP);
    this.playerHPBar.clear();
    this.playerHPBar.fillStyle(0xcccccc);
    this.playerHPBar.fillRect(PLAYER_HP_BAR_X, PLAYER_HP_BAR_Y, HP_BAR_W, HP_BAR_H);
    this.playerHPBar.fillStyle(this._hpColour(ratio));
    this.playerHPBar.fillRect(PLAYER_HP_BAR_X, PLAYER_HP_BAR_Y, Math.floor(HP_BAR_W * ratio), HP_BAR_H);
    this.playerHPText.setText(`${Math.max(0, Math.round(hp))}/${maxHP}`);
  }

  // Redraws the player XP bar beneath the HP bar at the given xp / xpToNextLevel values.
  _drawPlayerXPBar(xp, xpToNextLevel) {
    const ratio = xpToNextLevel > 0 ? Math.min(1, xp / xpToNextLevel) : 0;
    this.playerXPBar.clear();
    this.playerXPBar.fillStyle(0xcccccc);
    this.playerXPBar.fillRect(PLAYER_XP_BAR_X, PLAYER_XP_BAR_Y, HP_BAR_W, XP_BAR_H);
    this.playerXPBar.fillStyle(0x4488ff);
    this.playerXPBar.fillRect(PLAYER_XP_BAR_X, PLAYER_XP_BAR_Y, Math.floor(HP_BAR_W * ratio), XP_BAR_H);
  }

  // Updates the three action Text objects (Fight / Run / Item) to reflect selection.
  renderActionMenu() {
    ACTIONS.forEach((label, i) => {
      const cursor = i === this.battleState.selectedActionIndex ? '> ' : '  ';
      this.actionTexts[i].setText(`${cursor}${label}`);
    });
  }

  // Updates the four move Text objects to reflect the current selection,
  // and refreshes the move description shown in the right panel column.
  renderMoveMenu() {
    this.battleState.playerMoves.forEach((move, i) => {
      const cursor = i === this.battleState.selectedMoveIndex ? '> ' : '  ';
      this.moveTexts[i].setText(`${cursor}${move.name}`);
    });
    this._updateMoveDesc();
  }

  // Sets moveDescText to the description of the currently highlighted move.
  _updateMoveDesc() {
    const move = this.battleState.playerMoves[this.battleState.selectedMoveIndex];
    this.moveDescText.setText(move.description);
  }

  // ─── UI mode ──────────────────────────────────────────────────────────────

  // Sets the visibility of all UI panel elements to match the given mode.
  // Centralises visibility management so callers don't scatter setVisible calls.
  //   'action' — Fight / Run / Item menu (start of each turn)
  //   'moves'  — move submenu + description panel (after selecting Fight)
  //   'log'    — battle log text (during turn resolution)
  _setUIMode(mode) {
    const showAction = mode === 'action';
    const showMoves  = mode === 'moves';
    const showLog    = mode === 'log';
    const showItems  = mode === 'items';
    this.actionTexts.forEach(t => t.setVisible(showAction));
    this.moveTexts.forEach(t => t.setVisible(showMoves));
    this.moveDescText.setVisible(showMoves);
    this.battleLogText.setVisible(showLog);
    this.itemTexts.forEach(t => t.setVisible(showItems));
    this.itemDescText.setVisible(showItems);
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  // Swaps the professor sprite texture based on remaining HP ratio.
  // Only acts on professors that have a sprites[] array in data.js.
  //   ratio > 0.66 → level 1 (calm)
  //   ratio > 0.33 → level 2
  //   ratio ≤ 0.33 → level 3 (most energised)
  _updateProfSprite(ratio) {
    const prof = this.battleState.professor;
    if (!prof.sprites) return;

    const level = ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3;
    const key   = `${this.opponentId}_l${level}`;
    if (this.professorSprite.texture.key !== key) {
      this.professorSprite.setTexture(key);
    }
  }

  // Returns a colour integer for an HP bar based on the HP ratio.
  //   > 50 % → green, > 25 % → yellow, ≤ 25 % → red
  _hpColour(ratio) {
    if (ratio > 0.5) return 0x44ff44;
    if (ratio > 0.25) return 0xffff00;
    return 0xff4444;
  }

  // Runs an array of step functions in order. Each step receives a `next`
  // callback it must call when it is done (e.g. after a delay or tween).
  _runSequence(steps, onDone) {
    let i = 0;
    const next = () => {
      if (i >= steps.length) { onDone(); return; }
      steps[i++](next);
    };
    next();
  }

  // Visual step: display a single log line and wait for the player to press Space/Enter.
  // The advance handler in create() calls next() and clears _advanceCallback.
  _showLine(msg, next) {
    this.battleLogText.setText(msg);
    this._advanceCallback = next;
    this.advancePrompt.setVisible(true);
  }

  // Visual step: tween the professor HP bar from `from` to `to` over HP_ANIM_MS,
  // then pause HP_POST_PAUSE before calling next.
  // When damage is dealt (from > to), triggers a sprite flash and hit SFX concurrently.
  _animateProfHP(from, to, next) {
    if (from > to) {
      this._flashProfSprite();
      this._playHitSfx(from - to, this.battleState.professor.hp);
    }
    this.tweens.addCounter({
      from, to,
      duration:   HP_ANIM_MS,
      ease:       'Linear',
      onUpdate:   tween => this._drawProfHPBar(tween.getValue()),
      onComplete: () => this.time.delayedCall(HP_POST_PAUSE, next),
    });
  }

  // Visual step: tween the player HP bar from `from` to `to` over HP_ANIM_MS,
  // then pause HP_POST_PAUSE before calling next.
  // When damage is dealt (from > to), triggers a camera shake and hit SFX concurrently.
  _animatePlayerHP(from, to, next) {
    if (from > to) {
      this.cameras.main.shake(300, 0.008);
      this._playHitSfx(from - to, engine.getState().playerMaxHP);
    }
    this.tweens.addCounter({
      from, to,
      duration:   HP_ANIM_MS,
      ease:       'Linear',
      onUpdate:   tween => this._drawPlayerHPBar(tween.getValue()),
      onComplete: () => this.time.delayedCall(HP_POST_PAUSE, next),
    });
  }

  // Briefly displays "You have no items!" in the log area, then returns to the
  // action menu. Used when the player selects Item with no consumables available.
  _showNoItems() {
    this._setUIMode('log');
    this.battleLogText.setText('You have no items!');
    this.time.delayedCall(1200, () => {
      this._setUIMode('action');
      this.renderActionMenu();
    });
  }

  // Opens the item submenu. If no consumables in inventory, shows the no-items
  // message and returns immediately. Otherwise switches to the items UI.
  _openItemMenu() {
    const activeItems = engine.getActiveItems();
    if (activeItems.length === 0) {
      this._showNoItems();
      return;
    }
    this.battleState.menuLevel        = 'items';
    this.battleState.selectedItemIndex = 0;
    this.battleState.itemScrollOffset  = 0;
    this._setUIMode('items');
    this.renderItemMenu();
  }

  // Renders up to 4 item entries with cursor, respecting the current scroll offset.
  // The right panel shows the flavourText of the highlighted item (or its name if none).
  renderItemMenu() {
    const activeItems = engine.getActiveItems();
    const offset   = this.battleState.itemScrollOffset;
    const selected = this.battleState.selectedItemIndex;

    for (let i = 0; i < 4; i++) {
      const globalIdx = offset + i;
      if (globalIdx < activeItems.length) {
        const itemDef = items.find(it => it.id === activeItems[globalIdx]);
        const cursor  = globalIdx === selected ? '> ' : '  ';
        this.itemTexts[i].setText(`${cursor}${itemDef.name}`);
      } else {
        this.itemTexts[i].setText('');
      }
    }

    const itemDef = items.find(it => it.id === activeItems[selected]);
    this.itemDescText.setText(itemDef.flavourText ?? itemDef.name);
  }

  // Called when the player confirms item selection in the items submenu.
  // Looks up the selected item definition and delegates to _useItemInBattle.
  _confirmItemUse() {
    const activeItems = engine.getActiveItems();
    if (activeItems.length === 0) return;
    const item = items.find(it => it.id === activeItems[this.battleState.selectedItemIndex]);
    this._setUIMode('log');
    this._useItemInBattle(item);
  }

  // Returns a human-readable description of an item's effect for the battle log.
  _itemEffectMessage(item) {
    const { action, value } = item.effect;
    switch (action) {
      case 'restore_hp':  return value === null ? 'Fully restored HP!' : `Restored ${value} HP!`;
      case 'boost_attack':  return `Attack boosted by ${value}!`;
      case 'boost_defense': return `Defense boosted by ${value}!`;
      case 'boost_exp':     return 'EXP gain boosted!';
      default:              return 'Used!';
    }
  }

  // Resolves an item-use turn: applies the item's effect, shows a log message,
  // animates the HP bar if HP changed, then hands off to the opponent's turn.
  // Mirrors the structure of resolveTurn() but replaces the player move with item use.
  _useItemInBattle(item) {
    this.battleState.phase = 'animating';
    const bs  = this.battleState;
    const seq = [];
    const text   = msg    => seq.push(next => this._showLine(msg, next));
    const animP  = (f, t) => seq.push(next => this._animateProfHP(f, t, next));
    const animPl = (f, t) => seq.push(next => this._animatePlayerHP(f, t, next));
    const ctx = { bs, seq, text, animP, animPl, opponentType: this.opponentType, opponentId: this.opponentId };

    // Apply any deferred professor damage from the previous turn.
    if (applyDeferredDamage(ctx)) return this._endSeq(seq, 'loss');

    // Apply item effect and queue the log message.
    const fromHP = engine.getState().playerHP;
    engine.useActiveItem(item.id);
    const toHP = engine.getState().playerHP;
    text(`You used ${item.name}! ${this._itemEffectMessage(item)}`);
    if (item.effect.action === 'restore_hp' && toHP !== fromHP) {
      animPl(fromHP, toHP);
    }

    // Opponent takes their turn.
    const profResult = applyOpponentTurn(ctx);
    if (profResult) return this._endSeq(seq, profResult);

    // Run the visual sequence, then return to the action menu.
    this._runSequence(seq, () => {
      bs.phase = 'select';
      bs.menuLevel = 'action';
      bs.selectedActionIndex = 0;
      this._setUIMode('action');
      this.renderActionMenu();
    });
  }

  // Flashes the professor sprite: 3 rapid alpha pulses over ~400ms.
  // Fire-and-forget — runs concurrently with the HP bar drain tween.
  _flashProfSprite() {
    this.tweens.add({
      targets:    this.professorSprite,
      alpha:      0.2,
      duration:   60,
      yoyo:       true,
      repeat:     2,
      ease:       'Linear',
      onComplete: () => this.professorSprite.setAlpha(1),
    });
  }

  // Plays a hit SFX scaled to damage intensity.
  // Silently no-ops if the SFX file has not been loaded yet.
  _playHitSfx(damage, maxHP) {
    if (damage <= 0) return;
    const id = (damage / maxHP) >= 0.2 ? 'sfx_hit_heavy' : 'sfx_hit_light';
    this.scene.get('AudioScene').play(id);
  }

  // Awards XP for the current battle victory.
  // Returns { levelled, amount }: levelled is true if a level-up occurred; amount
  // is the XP awarded (used by _endSeq to display the "You earned N XP!" message).
  _awardBattleXP() {
    const amount   = this.opponentType === 'professor' ? XP_PER_PROFESSOR : XP_PER_STUDENT;
    const levelled = engine.awardXP(amount);
    return { levelled, amount };
  }

  // Visual step: tween the player XP bar from `fromXP` to `toXP` over HP_ANIM_MS,
  // then pause HP_POST_PAUSE before calling next. xpToNextLevel is held constant
  // as the denominator for the bar ratio throughout the animation.
  _animatePlayerXP(fromXP, toXP, xpToNextLevel, next) {
    this.tweens.addCounter({
      from:       fromXP,
      to:         toXP,
      duration:   HP_ANIM_MS,
      ease:       'Linear',
      onUpdate:   tween => this._drawPlayerXPBar(tween.getValue(), xpToNextLevel),
      onComplete: () => this.time.delayedCall(HP_POST_PAUSE, next),
    });
  }

  _endSeq(seq, outcome) {
    const bs   = this.battleState;
    bs.outcome = outcome;
    if (outcome === 'win') {
      // Award all enemy moves to the player's learnedMoves pool.
      this.battleState.professor.moves.forEach(id => engine.addLearnedMove(id));
      const { xp: xpBefore, xpToNextLevel: xpMaxBefore } = engine.getState();
      const { levelled, amount } = this._awardBattleXP();
      const { xp: xpAfter, xpToNextLevel: xpMaxAfter, level } = engine.getState();
      if (levelled) {
        // Animate bar filling to 100%, show XP and level-up messages, then reset bar.
        seq.push(next => this._animatePlayerXP(xpBefore, xpMaxBefore, xpMaxBefore, next));
        seq.push(next => this._showLine(`You earned ${amount} XP!`, next));
        seq.push(next => this._showLine(`Level up! You reached level ${level}.`, next));
        seq.push(next => {
          const { playerHP, playerMaxHP } = engine.getState();
          this._drawPlayerHPBar(playerHP);
          this._showLine(`HP restored to ${playerMaxHP}!`, next);
        });
        seq.push(next => {
          this._drawPlayerXPBar(xpAfter, xpMaxAfter);
          this.playerLevelText.setText(`Lv.${level}`);
          next();
        });
      } else {
        seq.push(next => this._animatePlayerXP(xpBefore, xpAfter, xpMaxBefore, next));
        seq.push(next => this._showLine(`You earned ${amount} XP!`, next));
      }
    }
    this._runSequence(seq, () => { bs.phase = 'end'; });
  }
}
