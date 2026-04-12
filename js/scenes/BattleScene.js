// BattleScene.js — turn-based battle scene
//
// Receives professorId from OverworldScene via scene init data. Builds all
// battle UI as Phaser GameObjects, handles keyboard input, and resolves
// move interactions each turn. Returns control to OverworldScene on battle end.
//
// Canvas: 400×400 px (defined in game config).
// Depends on: engine.js (state reads/writes), data.js (professor + move defs)

import * as engine from '../engine.js';
import { professors, professorMoves, playerMoves } from '../data.js';

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
const PLAYER_SPRITE_SCALE = 0.5;

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

// Lookup map: professor move id → move object.
// Built once at module load so resolveTurn() doesn't scan the array each call.
const PROF_MOVE_MAP = Object.fromEntries(professorMoves.map(m => [m.id, m]));

// The four moves available to the player in battle, in display order.
// data.js defines more moves; this list selects and orders the active subset.
const ACTIVE_MOVE_IDS = ['non_sequitur', 'all_nighter', 'counterexample', 'correction'];

// Top-level action menu labels, in display order.
const ACTIONS = ['Fight', 'Run', 'Item'];

// ─── Scene ───────────────────────────────────────────────────────────────────

export default class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
  }

  // Receives { professorId } from OverworldScene via this.scene.start('BattleScene', data).
  // Runs before preload(), so this.professorId is available there.
  init(data) {
    this.professorId = data.professorId;
  }

  // Loads battle sprites. Skips the load if Phaser already cached the texture.
  // Professors with a sprites[] array get each level loaded under the key
  // '<professorId>_l1', '<professorId>_l2', etc. Single-image professors use
  // the professorId key directly.
  preload() {
    const prof = professors.find(p => p.id === this.professorId);
    if (prof.sprites) {
      prof.sprites.forEach((path, i) => {
        const key = `${this.professorId}_l${i + 1}`;
        if (!this.textures.exists(key)) {
          this.load.image(key, path);
        }
      });
    } else {
      if (!this.textures.exists(this.professorId)) {
        this.load.image(this.professorId, prof.sprite);
      }
    }
    if (!this.textures.exists('player_battle')) {
      this.load.image('player_battle', 'assets/sprites/battle/player.png');
    }
  }

  // Builds all battle UI GameObjects and initialises battleState.
  create() {
    const prof = professors.find(p => p.id === this.professorId);

    // Holds the `next` callback for the current dialogue line awaiting player input.
    // Null when no line is waiting; set by _showLine(), cleared by the advance handler.
    this._advanceCallback = null;

    // Build the active move list from the ordered subset defined by ACTIVE_MOVE_IDS.
    const activeMoves = ACTIVE_MOVE_IDS.map(id => playerMoves.find(m => m.id === id));

    // battleState is the authoritative source of truth for this scene.
    // Fields beyond the TDD spec handle the full set of move effects in data.js:
    //   professorSkipped  — set by player 'skip' effect
    //   professorHalved   — set by player 'halve_next' effect
    //   deferredDamage    — set by professor 'deferred' effect; applied next professor turn
    //   lastProfessorDamage — used by player 'counter' effect check
    //   menuLevel         — 'action' (Fight/Run/Item) | 'moves' (move submenu)
    //   selectedActionIndex — cursor position in the action menu
    this.battleState = {
      professor:            prof,
      professorHP:          prof.hp,
      playerMoves:          activeMoves,
      selectedMoveIndex:    0,
      menuLevel:            'action', // 'action' | 'moves'
      selectedActionIndex:  0,
      phase:                'select', // 'select' | 'resolve' | 'animating' | 'end' | 'done'
      outcome:              null,     // null | 'win' | 'loss' | 'fled'
      disrupted:            false,    // true → player's next move deals half damage
      professorSkipped:     false,    // true → professor skips their next turn
      professorHalved:      false,    // true → professor's next move deals half damage
      deferredDamage:       0,        // HP to deal to player at start of next professor turn
      lastProfessorDamage:  0,        // last damage the professor dealt (for 'counter' check)
    };

    // --- Background ---
    this.add.rectangle(200, 200, 400, 400, 0xffffff);
    // UI panel
    this.add.rectangle(200, UI_PANEL_Y + UI_PANEL_H / 2, 400, UI_PANEL_H, 0xf0f0f0);
    // Panel border
    this.add.rectangle(200, UI_PANEL_Y, 400, 2, 0x888888);

    // --- Battle sprites ---
    // Initial texture: l1 (full-HP level) for multi-level professors, or the
    // single sprite key for professors without a sprites[] array.
    const initialTexture = prof.sprites ? `${this.professorId}_l1` : this.professorId;
    this.professorSprite = this.add.image(PROF_SPRITE_X, PROF_SPRITE_Y, initialTexture)
      .setScale(PROF_SPRITE_SCALE)
      .setOrigin(0.5);

    this.add.image(PLAYER_SPRITE_X, PLAYER_SPRITE_Y, 'player_battle')
      .setScale(PLAYER_SPRITE_SCALE)
      .setOrigin(0.5);

    // --- HP bars (Graphics objects; redrawn whenever HP changes) ---
    this.profHPBar   = this.add.graphics();
    this.playerHPBar = this.add.graphics();

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
          // Item — not yet implemented.
          this._showNoItems();
        }
      } else {
        this.selectMove(this.battleState.selectedMoveIndex);
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
    const trackId = 'battle_' + this.professorId;
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

    const ctx = { bs, seq, text, animP, animPl };

    // 1. Apply any deferred professor damage from the previous turn.
    if (this._applyDeferredDamage(ctx)) return this._endSeq(seq, 'loss');

    // 2-5. Apply player move and check for win/loss.
    const playerResult = this._applyPlayerMove(ctx);
    if (playerResult) return this._endSeq(seq, playerResult);

    // 6. Apply professor's turn and check for win/loss.
    const profResult = this._applyProfessorTurn(ctx);
    if (profResult) return this._endSeq(seq, profResult);

    // 7. Turn complete — run the visual sequence, then return to the action menu.
    this._runSequence(seq, () => {
      bs.phase = 'select';
      bs.menuLevel = 'action';
      bs.selectedActionIndex = 0;
      this._setUIMode('action');
      this.renderActionMenu();
    });
  }

  // Applies any damage deferred from the previous professor turn (deferred effect).
  // Pushes a text line and player HP animation to ctx.seq.
  // Returns true if the player faints (loss condition); false otherwise.
  _applyDeferredDamage({ bs, text, animPl }) {
    if (bs.deferredDamage <= 0) return false;

    const dmg  = bs.deferredDamage;
    bs.deferredDamage = 0;
    const fromHP = engine.getState().playerHP;
    const toHP   = fromHP - dmg;
    engine.setPlayerHP(toHP);
    bs.lastProfessorDamage = dmg;
    text(`The deferred effect hits! You take ${dmg} damage.`);
    animPl(fromHP, Math.max(0, toHP));

    return toHP <= 0;
  }

  // Applies the player's selected move: calculates damage, mutates professorHP,
  // and handles all player move effects via the effect switch.
  // Pushes text and HP animation steps to ctx.seq.
  // Returns 'win' if the professor is defeated, 'loss' if recoil kills the player,
  // or null if the turn continues.
  _applyPlayerMove({ bs, text, animP, animPl }) {
    const move = bs.playerMoves[bs.selectedMoveIndex];

    // 'counter': deals 40 damage if the professor's last move dealt ≥ 30.
    // 'disrupted': player's damage is halved this turn; flag resets after use.
    let playerDamage = (move.effect === 'counter' && bs.lastProfessorDamage >= 30)
      ? 40
      : move.damage;

    if (bs.disrupted) {
      playerDamage = Math.floor(playerDamage / 2);
      bs.disrupted = false;
    }

    const fromProfHP = bs.professorHP;
    bs.professorHP   = Math.max(0, bs.professorHP - playerDamage);
    text(`You use ${move.name}! Deals ${playerDamage} damage.`);
    animP(fromProfHP, bs.professorHP);

    // Apply any additional effect from the player move.
    switch (move.effect) {
      case 'skip':
        bs.professorSkipped = true;
        text(`${bs.professor.name} is stunned — skips their next turn.`);
        break;
      case 'player_recoil': {
        const from  = engine.getState().playerHP;
        const newHP = from - 10;
        engine.setPlayerHP(newHP);
        text('You take 10 recoil damage.');
        animPl(from, Math.max(0, newHP));
        if (newHP <= 0) {
          text('You fainted from recoil!');
          return 'loss';
        }
        break;
      }
      case 'clear_debuff':
        bs.disrupted = false;
        text('Disruption effect cleared!');
        break;
      case 'halve_next':
        bs.professorHalved = true;
        text(`${bs.professor.name}'s next move will deal half damage.`);
        break;
      // 'counter' and null require no additional action here.
    }

    // Check win condition (professor HP depleted).
    if (bs.professorHP <= 0) {
      engine.defeatProfessor(this.professorId);
      text(`${bs.professor.name} is defeated! Class passed!`);
      return 'win';
    }

    return null;
  }

  // Applies the professor's turn: picks a random move and resolves its effect.
  // Pushes text and HP animation steps to ctx.seq.
  // Returns 'loss' if the player faints, 'win' if the professor faints from
  // self_damage recoil, or null if the turn continues normally.
  _applyProfessorTurn({ bs, text, animP, animPl }) {
    if (bs.professorSkipped) {
      bs.professorSkipped = false;
      text(`${bs.professor.name} is stunned and does nothing.`);
      return null;
    }

    const moveIds    = bs.professor.moves;
    const profMoveId = moveIds[Math.floor(Math.random() * moveIds.length)];
    const profMove   = PROF_MOVE_MAP[profMoveId];

    if (profMove.effect === 'deferred') {
      // Store damage; it will be applied at the start of the next turn.
      bs.deferredDamage      = profMove.damage;
      bs.lastProfessorDamage = 0;
      text(`${bs.professor.name} uses ${profMove.name}. The effect is delayed...`);
      return null;
    }

    let profDamage = profMove.damage;

    // 'halve_next': this professor move deals half damage; flag resets.
    if (bs.professorHalved) {
      profDamage         = Math.floor(profDamage / 2);
      bs.professorHalved = false;
      text(`${bs.professor.name}'s move is weakened!`);
    }

    text(`${bs.professor.name} uses ${profMove.name}! Deals ${profDamage} damage.`);

    // Apply player damage and animate the player HP bar.
    const fromPHP = engine.getState().playerHP;
    const toPHP   = fromPHP - profDamage;
    engine.setPlayerHP(toPHP);
    bs.lastProfessorDamage = profDamage;
    animPl(fromPHP, Math.max(0, toPHP));

    if (profMove.effect === 'disrupt') {
      bs.disrupted = true;
      text('Your next move will deal half damage!');
    } else if (profMove.effect === 'self_damage') {
      // Professor also takes 25 % recoil.
      const recoil      = Math.floor(profMove.damage * 0.25);
      const fromProfHP2 = bs.professorHP;
      bs.professorHP    = Math.max(0, bs.professorHP - recoil);
      text(`${bs.professor.name} takes ${recoil} recoil damage.`);
      animP(fromProfHP2, bs.professorHP);

      if (bs.professorHP <= 0) {
        engine.defeatProfessor(this.professorId);
        text(`${bs.professor.name} faints from recoil! Class passed!`);
        return 'win';
      }
    }

    if (toPHP <= 0) {
      text('You fainted!');
      return 'loss';
    }

    return null;
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

    if (this.battleState.outcome === 'win') {
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
      // loss or fled: return to overworld immediately
      audio.switchTo('overworld');
      this.scene.stop('BattleScene');
      this.scene.wake('OverworldScene');
    }
  }

  // ─── Render helpers ───────────────────────────────────────────────────────

  // Redraws both HP bars at the current engine/battleState values.
  // Called once on scene creation; individual bars are updated via the
  // _drawProfHPBar / _drawPlayerHPBar helpers during animations.
  drawHPBars() {
    this._drawProfHPBar(this.battleState.professorHP);
    this._drawPlayerHPBar(engine.getState().playerHP);
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
    const ratio = Math.max(0, hp / 100);
    this.playerHPBar.clear();
    this.playerHPBar.fillStyle(0xcccccc);
    this.playerHPBar.fillRect(PLAYER_HP_BAR_X, PLAYER_HP_BAR_Y, HP_BAR_W, HP_BAR_H);
    this.playerHPBar.fillStyle(this._hpColour(ratio));
    this.playerHPBar.fillRect(PLAYER_HP_BAR_X, PLAYER_HP_BAR_Y, Math.floor(HP_BAR_W * ratio), HP_BAR_H);
    this.playerHPText.setText(`${Math.max(0, Math.round(hp))}/100`);
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
    this.actionTexts.forEach(t => t.setVisible(showAction));
    this.moveTexts.forEach(t => t.setVisible(showMoves));
    this.moveDescText.setVisible(showMoves);
    this.battleLogText.setVisible(showLog);
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
    const key   = `${this.professorId}_l${level}`;
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
      this._playHitSfx(from - to, 100);
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
  // action menu. Used when the player selects Item with no items available.
  _showNoItems() {
    this._setUIMode('log');
    this.battleLogText.setText('You have no items!');
    this.time.delayedCall(1200, () => {
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

  // Finalises a turn with a win or loss outcome: sets bs.outcome, runs the
  // accumulated visual sequence, then sets phase to 'end' to trigger endBattle().
  _endSeq(seq, outcome) {
    const bs   = this.battleState;
    bs.outcome = outcome;
    this._runSequence(seq, () => { bs.phase = 'end'; });
  }
}
