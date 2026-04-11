// BattleScene.js — turn-based battle scene
//
// Receives professorId from OverworldScene via scene init data. Builds all
// battle UI as Phaser GameObjects, handles keyboard input, and resolves
// move interactions each turn. Returns control to OverworldScene on battle end.
//
// Canvas: 480×320 px (defined in game config).
// Depends on: engine.js (state reads/writes), data.js (professor + move defs)

import * as engine from '../engine.js';
import { professors, professorMoves, playerMoves } from '../data.js';

// --- Layout constants (canvas pixels) ---

// Battle area occupies the top 195 px; UI panel fills the remaining 125 px.
const UI_PANEL_Y = 195;
const UI_PANEL_H = 125;

// Professor sprite: front-facing, upper-right.
const PROF_SPRITE_X     = 348;
const PROF_SPRITE_Y     =  80;
const PROF_SPRITE_SCALE = 0.5; // 192 px source → 96 px displayed

// Player sprite: back-facing, lower-left of the battle area.
const PLAYER_SPRITE_X     = 128;
const PLAYER_SPRITE_Y     = 148;
const PLAYER_SPRITE_SCALE = 0.5;

// Professor HP info box: top-left of battle area.
const PROF_HP_LABEL_X = 14;
const PROF_HP_LABEL_Y = 12;
const PROF_HP_BAR_X   = 14;
const PROF_HP_BAR_Y   = 30;

// Player HP info box: lower-right of battle area.
const PLAYER_HP_LABEL_X = 272;
const PLAYER_HP_LABEL_Y = 150;
const PLAYER_HP_BAR_X   = 272;
const PLAYER_HP_BAR_Y   = 168;
const PLAYER_HP_NUM_X   = 412; // x for the "85/100" numbers

// Shared HP bar dimensions.
const HP_BAR_W = 168;
const HP_BAR_H =   8;

// Move menu: stacked vertically in the left half of the UI panel.
const MOVE_X      =  16;
const MOVE_Y_BASE = UI_PANEL_Y + 12;
const MOVE_STEP   =  26; // pixels between each move row

// Battle log: same origin as the move menu; appears instead of it during resolve.
const LOG_X = 14;
const LOG_Y = UI_PANEL_Y + 10;

// Milliseconds to display a battle log line before advancing to the next step.
const LINE_DISPLAY_MS = 1200;
// Duration of an HP bar drain animation (ms).
const HP_ANIM_MS = 800;
// Brief pause after an HP animation completes before the next step begins (ms).
const HP_POST_PAUSE = 400;

// Lookup map: professor move id → move object.
// Built once at module load so resolveTurn() doesn't scan the array each call.
const PROF_MOVE_MAP = Object.fromEntries(professorMoves.map(m => [m.id, m]));

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

    // battleState is the authoritative source of truth for this scene.
    // Fields beyond the TDD spec handle the full set of move effects in data.js:
    //   professorSkipped  — set by player 'skip' effect
    //   professorHalved   — set by player 'halve_next' effect
    //   deferredDamage    — set by professor 'deferred' effect; applied next professor turn
    //   lastProfessorDamage — used by player 'counter' effect check
    this.battleState = {
      professor:           prof,
      professorHP:         prof.hp,
      playerMoves:         playerMoves,
      selectedMoveIndex:   0,
      phase:               'select', // 'select' | 'resolve' | 'animating' | 'end' | 'done'
      outcome:             null,     // null | 'win' | 'loss' | 'fled'
      disrupted:           false,    // true → player's next move deals half damage
      professorSkipped:    false,    // true → professor skips their next turn
      professorHalved:     false,    // true → professor's next move deals half damage
      deferredDamage:      0,        // HP to deal to player at start of next professor turn
      lastProfessorDamage: 0,        // last damage the professor dealt (for 'counter' check)
    };

    // --- Background ---
    this.add.rectangle(240, 160, 480, 320, 0xffffff);
    // UI panel
    this.add.rectangle(240, UI_PANEL_Y + UI_PANEL_H / 2, 480, UI_PANEL_H, 0xf0f0f0);
    // Panel border
    this.add.rectangle(240, UI_PANEL_Y, 480, 2, 0x888888);

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

    // --- Move menu: four Text objects, one per player move ---
    this.moveTexts = playerMoves.map((_, i) =>
      this.add.text(MOVE_X, MOVE_Y_BASE + i * MOVE_STEP, '', {
        fontSize: '13px', fill: '#222266', fontFamily: 'monospace',
      })
    );

    // --- Battle log: replaces the move menu during turn resolution ---
    this.battleLogText = this.add.text(LOG_X, LOG_Y, '', {
      fontSize: '13px', fill: '#443300', fontFamily: 'monospace',
      wordWrap: { width: 450 },
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
      const len = playerMoves.length;
      this.battleState.selectedMoveIndex =
        (this.battleState.selectedMoveIndex - 1 + len) % len;
      this.renderMoveMenu();
    });

    keys.down.on('down', () => {
      if (this.battleState.phase !== 'select') return;
      this.battleState.selectedMoveIndex =
        (this.battleState.selectedMoveIndex + 1) % playerMoves.length;
      this.renderMoveMenu();
    });

    const confirmMove = () => {
      if (this.battleState.phase !== 'select') return;
      this.selectMove(this.battleState.selectedMoveIndex);
    };
    keys.enter.on('down', confirmMove);
    keys.space.on('down', confirmMove);

    const fleeAction = () => {
      if (this.battleState.phase !== 'select') return;
      this.flee();
    };
    keys.esc.on('down', fleeAction);
    keys.r.on('down', fleeAction);

    // --- Initial render ---
    this.drawHPBars();
    this.renderMoveMenu();

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
    this.moveTexts.forEach(t => t.setVisible(false));
    this.battleLogText.setVisible(true);
  }

  // Applies the full turn: player move → professor move. Checks win/loss after
  // each step. Sets phase to 'animating' on entry to prevent re-entry from
  // update() while the scene waits to return to 'select'.
  //
  // Rather than resolving everything then printing a flat list, this builds a
  // seq[] of visual steps — text lines and HP bar animations — that are played
  // back in order by _runSequence(). HP values are captured before each change
  // so the tween knows the correct from/to range.
  //
  // Note: engine.setPlayerHP(n) resets to 100 when n ≤ 0 (faint/respawn).
  // Loss conditions are therefore checked against the raw pre-clamp value, not
  // the post-call engine state.
  resolveTurn() {
    this.battleState.phase = 'animating'; // prevent re-entry

    const bs   = this.battleState;
    const move = bs.playerMoves[bs.selectedMoveIndex];
    const seq  = []; // ordered visual steps: text lines and HP animations

    const text   = msg     => seq.push(next => this._showLine(msg, next));
    const animP  = (f, t)  => seq.push(next => this._animateProfHP(f, t, next));
    const animPl = (f, t)  => seq.push(next => this._animatePlayerHP(f, t, next));

    // 1. Apply any deferred professor damage from the previous turn.
    if (bs.deferredDamage > 0) {
      const dmg  = bs.deferredDamage;
      bs.deferredDamage = 0;
      const fromHP = engine.getState().playerHP;
      const toHP   = fromHP - dmg;
      engine.setPlayerHP(toHP);
      bs.lastProfessorDamage = dmg;
      text(`The deferred effect hits! You take ${dmg} damage.`);
      animPl(fromHP, Math.max(0, toHP));
      if (toHP <= 0) {
        return this._endSeq(seq, 'loss');
      }
    }

    // 2. Calculate player move damage.
    //    'counter': deals 40 damage if the professor's last move dealt ≥ 30.
    //    'disrupt': player's damage is halved this turn; flag resets after use.
    let playerDamage = (move.effect === 'counter' && bs.lastProfessorDamage >= 30)
      ? 40
      : move.damage;

    if (bs.disrupted) {
      playerDamage = Math.floor(playerDamage / 2);
      bs.disrupted = false;
    }

    // 3. Apply player damage to professor.
    const fromProfHP = bs.professorHP;
    bs.professorHP   = Math.max(0, bs.professorHP - playerDamage);
    text(`You use ${move.name}! Deals ${playerDamage} damage.`);
    animP(fromProfHP, bs.professorHP);

    // 4. Apply player move effects.
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
          return this._endSeq(seq, 'loss');
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

    // 5. Check win condition (professor HP depleted).
    if (bs.professorHP <= 0) {
      engine.defeatProfessor(this.professorId);
      text(`${bs.professor.name} is defeated! Class passed!`);
      return this._endSeq(seq, 'win');
    }

    // 6. Professor's turn.
    if (bs.professorSkipped) {
      bs.professorSkipped = false;
      text(`${bs.professor.name} is stunned and does nothing.`);
    } else {
      const moveIds    = bs.professor.moves;
      const profMoveId = moveIds[Math.floor(Math.random() * moveIds.length)];
      const profMove   = PROF_MOVE_MAP[profMoveId];

      if (profMove.effect === 'deferred') {
        // Store damage; it will be applied at the start of the next turn.
        bs.deferredDamage      = profMove.damage;
        bs.lastProfessorDamage = 0;
        text(`${bs.professor.name} uses ${profMove.name}. The effect is delayed...`);
      } else {
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
          const recoil       = Math.floor(profMove.damage * 0.25);
          const fromProfHP2  = bs.professorHP;
          bs.professorHP     = Math.max(0, bs.professorHP - recoil);
          text(`${bs.professor.name} takes ${recoil} recoil damage.`);
          animP(fromProfHP2, bs.professorHP);

          if (bs.professorHP <= 0) {
            engine.defeatProfessor(this.professorId);
            text(`${bs.professor.name} faints from recoil! Class passed!`);
            return this._endSeq(seq, 'win');
          }
        }

        if (toPHP <= 0) {
          text('You fainted!');
          return this._endSeq(seq, 'loss');
        }
      }
    }

    // 7. Turn complete — run the visual sequence, then return to move selection.
    this._runSequence(seq, () => {
      bs.phase = 'select';
      this.battleLogText.setVisible(false);
      this.moveTexts.forEach(t => t.setVisible(true));
      this.renderMoveMenu();
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

  // Updates the four move Text objects to reflect the current selection.
  renderMoveMenu() {
    this.battleState.playerMoves.forEach((move, i) => {
      const cursor = i === this.battleState.selectedMoveIndex ? '> ' : '  ';
      this.moveTexts[i].setText(`${cursor}${move.name}`);
    });
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

  // Visual step: display a single log line and wait LINE_DISPLAY_MS before next.
  _showLine(msg, next) {
    this.battleLogText.setText(msg);
    this.time.delayedCall(LINE_DISPLAY_MS, next);
  }

  // Visual step: tween the professor HP bar from `from` to `to` over HP_ANIM_MS,
  // then pause HP_POST_PAUSE before calling next.
  _animateProfHP(from, to, next) {
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
  _animatePlayerHP(from, to, next) {
    this.tweens.addCounter({
      from, to,
      duration:   HP_ANIM_MS,
      ease:       'Linear',
      onUpdate:   tween => this._drawPlayerHPBar(tween.getValue()),
      onComplete: () => this.time.delayedCall(HP_POST_PAUSE, next),
    });
  }

  // Finalises a turn with a win or loss outcome: sets bs.outcome, runs the
  // accumulated visual sequence, then sets phase to 'end' to trigger endBattle().
  _endSeq(seq, outcome) {
    const bs   = this.battleState;
    bs.outcome = outcome;
    this._runSequence(seq, () => { bs.phase = 'end'; });
  }
}
