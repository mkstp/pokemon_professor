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

// Milliseconds to display the battle log before returning to move selection.
const LOG_DISPLAY_MS = 1800;

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
  preload() {
    const prof = professors.find(p => p.id === this.professorId);
    if (!this.textures.exists(this.professorId)) {
      this.load.image(this.professorId, prof.sprite);
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
      lastActionText:      '',
      outcome:             null,     // null | 'win' | 'loss' | 'fled'
      disrupted:           false,    // true → player's next move deals half damage
      professorSkipped:    false,    // true → professor skips their next turn
      professorHalved:     false,    // true → professor's next move deals half damage
      deferredDamage:      0,        // HP to deal to player at start of next professor turn
      lastProfessorDamage: 0,        // last damage the professor dealt (for 'counter' check)
    };

    // --- Background ---
    this.add.rectangle(240, 160, 480, 320, 0x1e1e2e);
    // UI panel
    this.add.rectangle(240, UI_PANEL_Y + UI_PANEL_H / 2, 480, UI_PANEL_H, 0x2a2a4a);
    // Panel border
    this.add.rectangle(240, UI_PANEL_Y, 480, 2, 0x5555aa);

    // --- Battle sprites ---
    this.add.image(PROF_SPRITE_X, PROF_SPRITE_Y, this.professorId)
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
      fontSize: '11px', fill: '#ffffff', fontFamily: 'monospace',
    });

    this.add.text(PLAYER_HP_LABEL_X, PLAYER_HP_LABEL_Y, 'You', {
      fontSize: '11px', fill: '#ffffff', fontFamily: 'monospace',
    });

    // Numeric HP counter shown next to the player HP bar.
    this.playerHPText = this.add.text(PLAYER_HP_NUM_X, PLAYER_HP_BAR_Y - 2, '', {
      fontSize: '10px', fill: '#aaffaa', fontFamily: 'monospace',
    });

    // --- Move menu: four Text objects, one per player move ---
    this.moveTexts = playerMoves.map((_, i) =>
      this.add.text(MOVE_X, MOVE_Y_BASE + i * MOVE_STEP, '', {
        fontSize: '13px', fill: '#ddddff', fontFamily: 'monospace',
      })
    );

    // --- Battle log: replaces the move menu during turn resolution ---
    this.battleLogText = this.add.text(LOG_X, LOG_Y, '', {
      fontSize: '13px', fill: '#ffffcc', fontFamily: 'monospace',
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
    this.scene.get('AudioScene').switchTo('battle_' + this.professorId);
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
  resolveTurn() {
    this.battleState.phase = 'animating'; // prevent re-entry

    const bs    = this.battleState;
    const move  = bs.playerMoves[bs.selectedMoveIndex];
    const lines = []; // log lines accumulated during this turn

    // 1. Apply any deferred professor damage from the previous turn.
    if (bs.deferredDamage > 0) {
      const deferred = bs.deferredDamage;
      bs.deferredDamage = 0;
      engine.setPlayerHP(engine.getState().playerHP - deferred);
      bs.lastProfessorDamage = deferred;
      lines.push(`The deferred effect hits! You take ${deferred} damage.`);

      if (engine.getState().playerHP <= 0) {
        return this._endTurn(lines, 'loss');
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
    bs.professorHP = Math.max(0, bs.professorHP - playerDamage);
    lines.push(`You use ${move.name}! Deals ${playerDamage} damage.`);

    // 4. Apply player move effects.
    switch (move.effect) {
      case 'skip':
        bs.professorSkipped = true;
        lines.push(`${bs.professor.name} is stunned — skips their next turn.`);
        break;
      case 'player_recoil':
        engine.setPlayerHP(engine.getState().playerHP - 10);
        lines.push('You take 10 recoil damage.');
        break;
      case 'clear_debuff':
        bs.disrupted = false;
        lines.push('Disruption effect cleared!');
        break;
      case 'halve_next':
        bs.professorHalved = true;
        lines.push(`${bs.professor.name}'s next move will deal half damage.`);
        break;
      // 'counter' and null require no additional action here.
    }

    // 5. Check win condition (professor HP depleted).
    if (bs.professorHP <= 0) {
      engine.defeatProfessor(this.professorId);
      lines.push(`${bs.professor.name} is defeated! Class passed!`);
      return this._endTurn(lines, 'win');
    }

    // 6. Check if player recoil knocked player out.
    if (engine.getState().playerHP <= 0) {
      lines.push('You fainted from recoil!');
      return this._endTurn(lines, 'loss');
    }

    // 7. Professor's turn.
    if (bs.professorSkipped) {
      bs.professorSkipped = false;
      lines.push(`${bs.professor.name} is stunned and does nothing.`);
    } else {
      const moveIds    = bs.professor.moves;
      const profMoveId = moveIds[Math.floor(Math.random() * moveIds.length)];
      const profMove   = PROF_MOVE_MAP[profMoveId];

      if (profMove.effect === 'deferred') {
        // Store damage; it will be applied at the start of the next professor turn.
        bs.deferredDamage    = profMove.damage;
        bs.lastProfessorDamage = 0;
        lines.push(`${bs.professor.name} uses ${profMove.name}. The effect is delayed...`);
      } else {
        let profDamage = profMove.damage;

        // 'halve_next': this professor move deals half damage; flag resets.
        if (bs.professorHalved) {
          profDamage = Math.floor(profDamage / 2);
          bs.professorHalved = false;
          lines.push(`${bs.professor.name}'s move is weakened!`);
        }

        engine.setPlayerHP(engine.getState().playerHP - profDamage);
        bs.lastProfessorDamage = profDamage;
        lines.push(`${bs.professor.name} uses ${profMove.name}! Deals ${profDamage} damage.`);

        // Apply professor move effects.
        if (profMove.effect === 'disrupt') {
          bs.disrupted = true;
          lines.push('Your next move will deal half damage!');
        } else if (profMove.effect === 'self_damage') {
          const recoil = Math.floor(profMove.damage * 0.25);
          bs.professorHP = Math.max(0, bs.professorHP - recoil);
          lines.push(`${bs.professor.name} takes ${recoil} recoil damage.`);

          // Check if self-damage knocked the professor out.
          if (bs.professorHP <= 0) {
            engine.defeatProfessor(this.professorId);
            lines.push(`${bs.professor.name} faints from recoil! Class passed!`);
            return this._endTurn(lines, 'win');
          }
        }

        // Check if professor's move knocked player out.
        if (engine.getState().playerHP <= 0) {
          lines.push('You fainted!');
          return this._endTurn(lines, 'loss');
        }
      }
    }

    // 8. Turn complete — display log, then return to move selection.
    bs.lastActionText = lines.join('\n');
    this.drawHPBars();
    this.battleLogText.setText(bs.lastActionText);

    this.time.delayedCall(LOG_DISPLAY_MS, () => {
      if (bs.outcome !== null) return; // battle ended during display delay
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

  // Redraws both HP bars and the player HP number using current state.
  drawHPBars() {
    const playerHP  = engine.getState().playerHP;
    const profMaxHP = this.battleState.professor.hp;
    const profHP    = this.battleState.professorHP;

    // Professor HP bar
    this.profHPBar.clear();
    this.profHPBar.fillStyle(0x333355);
    this.profHPBar.fillRect(PROF_HP_BAR_X, PROF_HP_BAR_Y, HP_BAR_W, HP_BAR_H);
    const profRatio = Math.max(0, profHP / profMaxHP);
    this.profHPBar.fillStyle(this._hpColour(profRatio));
    this.profHPBar.fillRect(PROF_HP_BAR_X, PROF_HP_BAR_Y, Math.floor(HP_BAR_W * profRatio), HP_BAR_H);

    // Player HP bar
    this.playerHPBar.clear();
    this.playerHPBar.fillStyle(0x333355);
    this.playerHPBar.fillRect(PLAYER_HP_BAR_X, PLAYER_HP_BAR_Y, HP_BAR_W, HP_BAR_H);
    const playerRatio = Math.max(0, playerHP / 100);
    this.playerHPBar.fillStyle(this._hpColour(playerRatio));
    this.playerHPBar.fillRect(PLAYER_HP_BAR_X, PLAYER_HP_BAR_Y, Math.floor(HP_BAR_W * playerRatio), HP_BAR_H);

    this.playerHPText.setText(`${playerHP}/100`);
  }

  // Updates the four move Text objects to reflect the current selection.
  renderMoveMenu() {
    this.battleState.playerMoves.forEach((move, i) => {
      const cursor = i === this.battleState.selectedMoveIndex ? '> ' : '  ';
      this.moveTexts[i].setText(`${cursor}${move.name}`);
    });
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  // Returns a colour integer for an HP bar based on the HP ratio.
  //   > 50 % → green, > 25 % → yellow, ≤ 25 % → red
  _hpColour(ratio) {
    if (ratio > 0.5) return 0x44ff44;
    if (ratio > 0.25) return 0xffff00;
    return 0xff4444;
  }

  // Finalises a turn with a win, loss, or (implicitly) other outcome.
  // Updates the log, redraws HP bars, then queues endBattle().
  _endTurn(lines, outcome) {
    const bs = this.battleState;
    bs.outcome        = outcome;
    bs.lastActionText = lines.join('\n');
    this.drawHPBars();
    this.battleLogText.setText(bs.lastActionText);
    // Delay briefly so the player can read the final log line before exit.
    this.time.delayedCall(LOG_DISPLAY_MS, () => {
      bs.phase = 'end';
    });
  }
}
