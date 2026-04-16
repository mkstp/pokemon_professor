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
//             data/students.js, data/playerMoves.js

import * as engine from '../engine.js';
import { professors, professorMoves } from '../data/professors.js';
import { studentNPCs, npcMoves }      from '../data/students.js';
import { playerMoves }                from '../data/playerMoves.js';

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

// Lookup maps: move id → move object. Built once at module load.
const PROF_MOVE_MAP = Object.fromEntries(professorMoves.map(m => [m.id, m]));
const NPC_MOVE_MAP  = Object.fromEntries(npcMoves.map(m => [m.id, m]));

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
    // Professor battle effects:
    //   professorSkipped    — set by player 'skip' effect; opponent skips next turn
    //   professorHalved     — set by player 'halve_next'; opponent's next move halved
    //   deferredDamage      — set by professor 'deferred'; applied next opponent turn
    //   lastProfessorDamage — opponent's last damage dealt (for player 'counter' check)
    //
    // Student NPC / npcMove effects:
    //   playerSkipped       — set by NPC 'skip_opponent'; player skips next action
    //   npcSkippedTurns     — turns NPC skips due to its own exhaustion (skip_self, skip_self_2)
    //   npcHalvedNext       — NPC's next move deals half damage (halve_self_next)
    //   npcDoubledNext      — NPC's next move deals double damage (double_next)
    //   npcBoostNext10      — NPC's next move +10 damage (chance_boost_next_10)
    //   npcBoostedTurns     — remaining turns NPC's moves get +20 (boost_next_2)
    //   npcVulnTurns        — turns NPC takes +5 extra incoming damage (self_vuln_next / self_vuln_2)
    //   npcIncomingHalved   — NPC's next incoming damage halved (heal_and_shield)
    //   playerReducedNext10 — flat reduction on player's next move damage (reduce_next_10, heal_and_reduce_next)
    //   lastPlayerDamage    — player's last damage dealt (for NPC 'conditional_damage' check)
    this.battleState = {
      professor:            prof,
      professorHP:          prof.hp,
      playerMoves:          activeMoves,
      selectedMoveIndex:    0,
      menuLevel:            'action', // 'action' | 'moves'
      selectedActionIndex:  0,
      phase:                'select', // 'select' | 'resolve' | 'animating' | 'end' | 'done'
      outcome:              null,     // null | 'win' | 'loss' | 'fled'
      disrupted:            false,
      professorSkipped:     false,
      professorHalved:      false,
      deferredDamage:       0,
      lastProfessorDamage:  0,
      playerSkipped:        false,
      npcSkippedTurns:      0,
      npcHalvedNext:        false,
      npcDoubledNext:       false,
      npcBoostNext10:       false,
      npcBoostedTurns:      0,
      npcVulnTurns:         0,
      npcIncomingHalved:    false,
      playerReducedNext10:  0,
      lastPlayerDamage:     0,
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

    const ctx = { bs, seq, text, animP, animPl };

    // 1. Apply any deferred professor damage from the previous turn.
    if (this._applyDeferredDamage(ctx)) return this._endSeq(seq, 'loss');

    // 2-5. Apply player move and check for win/loss.
    const playerResult = this._applyPlayerMove(ctx);
    if (playerResult) return this._endSeq(seq, playerResult);

    // 6. Apply opponent's turn and check for win/loss.
    const profResult = this._applyOpponentTurn(ctx);
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
  // Returns 'win' if the opponent is defeated, 'loss' if recoil kills the player,
  // or null if the turn continues.
  _applyPlayerMove({ bs, text, animP, animPl }) {
    // If the NPC disrupted the player this turn, skip the player's action.
    if (bs.playerSkipped) {
      bs.playerSkipped = false;
      text('You are disrupted and skip your action!');
      return null;
    }

    const move = bs.playerMoves[bs.selectedMoveIndex];

    // 'counter': deals 40 damage if the opponent's last move dealt ≥ 30.
    let playerDamage = (move.effect === 'counter' && bs.lastProfessorDamage >= 30)
      ? 40
      : move.damage;

    // Flat damage bonus from player level-ups.
    playerDamage += engine.getState().damageBuff;

    // Flat damage reduction from NPC 'reduce_next_10' or 'heal_and_reduce_next'.
    if (bs.playerReducedNext10 > 0) {
      playerDamage = Math.max(0, playerDamage - bs.playerReducedNext10);
      bs.playerReducedNext10 = 0;
    }

    // 'disrupted': player's damage is halved this turn; flag resets after use.
    if (bs.disrupted) {
      playerDamage = Math.floor(playerDamage / 2);
      bs.disrupted = false;
    }

    // Track last player damage for NPC 'conditional_damage' check next turn.
    bs.lastPlayerDamage = playerDamage;

    // NPC vulnerability bonus: NPC took a high-cost move and is exposed.
    if (bs.npcVulnTurns > 0) {
      playerDamage += 5;
      bs.npcVulnTurns--;
    }

    // NPC shield: NPC used heal_and_shield; next incoming damage is halved.
    if (bs.npcIncomingHalved) {
      playerDamage = Math.floor(playerDamage / 2);
      bs.npcIncomingHalved = false;
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

    // Check win condition (opponent HP depleted).
    if (bs.professorHP <= 0) {
      if (this.opponentType === 'professor') engine.defeatProfessor(this.opponentId);
      text(`${bs.professor.name} is defeated!`);
      return 'win';
    }

    return null;
  }

  // Applies the opponent's turn: picks a random move and resolves its effect.
  // Works for both professors (using PROF_MOVE_MAP) and student NPCs (NPC_MOVE_MAP).
  // Pushes text and HP animation steps to ctx.seq.
  // Returns 'loss' if the player faints, 'win' if the opponent faints from a
  // recoil or mutual effect, or null if the turn continues normally.
  _applyOpponentTurn({ bs, text, animP, animPl }) {
    // NPC's own exhaustion skip (from skip_self / skip_self_2 effects).
    if (bs.npcSkippedTurns > 0) {
      bs.npcSkippedTurns--;
      text(`${bs.professor.name} is exhausted and does nothing.`);
      return null;
    }

    // Player-applied skip (from player move 'skip' effect, or NPC skip_opponent on prior turn).
    if (bs.professorSkipped) {
      bs.professorSkipped = false;
      text(`${bs.professor.name} is stunned and does nothing.`);
      return null;
    }

    // Select a move from the opponent's pool at random.
    const moveMap   = this.opponentType === 'student' ? NPC_MOVE_MAP : PROF_MOVE_MAP;
    const moveIds   = bs.professor.moves;
    const oppMoveId = moveIds[Math.floor(Math.random() * moveIds.length)];
    const oppMove   = moveMap[oppMoveId];

    // Professor-only: deferred effect stores damage for next turn.
    if (oppMove.effect === 'deferred') {
      bs.deferredDamage      = oppMove.damage;
      bs.lastProfessorDamage = 0;
      text(`${bs.professor.name} uses ${oppMove.name}. The effect is delayed...`);
      return null;
    }

    // Base damage for this move.
    let profDamage = oppMove.damage;

    // Player-applied halve (from player 'halve_next' effect).
    if (bs.professorHalved) {
      profDamage         = Math.floor(profDamage / 2);
      bs.professorHalved = false;
      text(`${bs.professor.name}'s move is weakened!`);
    }

    // NPC self-applied damage modifiers.
    if (bs.npcDoubledNext) {
      profDamage      *= 2;
      bs.npcDoubledNext = false;
    }
    if (bs.npcHalvedNext) {
      profDamage    = Math.floor(profDamage / 2);
      bs.npcHalvedNext = false;
    }
    if (bs.npcBoostNext10) {
      profDamage   += 10;
      bs.npcBoostNext10 = false;
    }
    if (bs.npcBoostedTurns > 0) {
      profDamage += 20;
      bs.npcBoostedTurns--;
    }

    // mutual_damage_20: both sides take 20. Override profDamage so the main damage
    // block handles the player's 20 HP; the switch case handles the NPC's 20 HP.
    if (oppMove.effect === 'mutual_damage_20') profDamage = 20;

    // Pre-damage rolls: chance_fail and chance_bonus_10 modify profDamage before it lands.
    if (oppMove.effect === 'chance_fail' && Math.random() < 0.2) {
      profDamage = 0;
    }
    if (oppMove.effect === 'chance_bonus_10' && Math.random() < 0.3) {
      profDamage += 10;
    }
    // conditional_damage: deal 40 if the player's last move dealt ≥ 30.
    if (oppMove.effect === 'conditional_damage' && bs.lastPlayerDamage >= 30) {
      profDamage = 40;
    }

    // Flat damage reduction from player level-ups (minimum 0 net damage).
    profDamage = Math.max(0, profDamage - engine.getState().defenseStat);

    // Deal damage to player.
    const fromPHP = engine.getState().playerHP;
    const toPHP   = fromPHP - profDamage;
    engine.setPlayerHP(toPHP);
    bs.lastProfessorDamage = profDamage;
    if (profDamage > 0) {
      text(`${bs.professor.name} uses ${oppMove.name}! Deals ${profDamage} damage.`);
    } else {
      text(`${bs.professor.name} uses ${oppMove.name}!`);
    }
    animPl(fromPHP, Math.max(0, toPHP));

    // Apply the move's effect.
    switch (oppMove.effect) {

      // ── Professor-only effects ────────────────────────────────────────────────
      case 'disrupt':
        bs.disrupted = true;
        text('Your next move will deal half damage!');
        break;

      case 'self_damage': {
        // Professor: 25% recoil. Student NPC: flat 10 self-damage.
        const recoil   = this.opponentType === 'student' ? 10 : Math.floor(oppMove.damage * 0.25);
        const fromPH   = bs.professorHP;
        bs.professorHP = Math.max(0, bs.professorHP - recoil);
        text(`${bs.professor.name} takes ${recoil} recoil damage.`);
        animP(fromPH, bs.professorHP);
        if (bs.professorHP <= 0) {
          if (this.opponentType === 'professor') engine.defeatProfessor(this.opponentId);
          text(`${bs.professor.name} faints from recoil!`);
          return 'win';
        }
        break;
      }

      // ── Student NPC effects ───────────────────────────────────────────────────
      case 'skip_opponent':
        bs.playerSkipped = true;
        text("You are disrupted — you'll skip your next action!");
        break;

      case 'chance_skip_opponent':
        if (Math.random() < 0.5) {
          bs.playerSkipped = true;
          text("You are disrupted — you'll skip your next action!");
        } else {
          text('The disruption attempt failed.');
        }
        break;

      case 'halve_next':
        // From NPC's perspective: opponent (player) next move halved.
        bs.disrupted = true;
        text('Your next move will deal half damage!');
        break;

      case 'chance_halve_opponent':
        if (Math.random() < 0.25) {
          bs.disrupted = true;
          text('Your next move will deal half damage!');
        }
        break;

      case 'conditional_damage':
        // Damage modification handled pre-damage above; no additional state needed.
        break;

      case 'clear_debuff':
        bs.npcHalvedNext  = false;
        bs.npcDoubledNext = false;
        text(`${bs.professor.name} clears their debuffs.`);
        break;

      case 'heal': {
        const healAmt    = oppMove.healAmount ?? 0;
        const oldHP      = bs.professorHP;
        bs.professorHP   = Math.min(bs.professor.hp, bs.professorHP + healAmt);
        const gained     = bs.professorHP - oldHP;
        text(`${bs.professor.name} recovers ${gained} HP.`);
        animP(oldHP, bs.professorHP);
        break;
      }

      case 'heal_and_reduce_next': {
        const healAmt    = oppMove.healAmount ?? 0;
        const oldHP      = bs.professorHP;
        bs.professorHP   = Math.min(bs.professor.hp, bs.professorHP + healAmt);
        const gained     = bs.professorHP - oldHP;
        bs.playerReducedNext10 += 10;
        text(`${bs.professor.name} recovers ${gained} HP. Your next move is weakened.`);
        animP(oldHP, bs.professorHP);
        break;
      }

      case 'heal_and_shield': {
        const healAmt    = oppMove.healAmount ?? 0;
        const oldHP      = bs.professorHP;
        bs.professorHP   = Math.min(bs.professor.hp, bs.professorHP + healAmt);
        const gained     = bs.professorHP - oldHP;
        bs.npcIncomingHalved = true;
        text(`${bs.professor.name} recovers ${gained} HP and braces for impact.`);
        animP(oldHP, bs.professorHP);
        break;
      }

      case 'reduce_next_10':
        bs.playerReducedNext10 += 10;
        text('Your next move is weakened.');
        break;

      case 'self_vuln_next':
        bs.npcVulnTurns = Math.max(bs.npcVulnTurns, 1);
        break; // self-debuff; no player-facing text

      case 'self_vuln_2':
        bs.npcVulnTurns = Math.max(bs.npcVulnTurns, 2);
        break;

      case 'double_next':
        bs.npcDoubledNext = true;
        text(`${bs.professor.name} charges up for a powerful next move!`);
        break;

      case 'skip_self':
        bs.npcSkippedTurns = Math.max(bs.npcSkippedTurns, 1);
        break; // exhaustion; NPC-internal state

      case 'skip_self_2':
        bs.npcSkippedTurns = Math.max(bs.npcSkippedTurns, 2);
        break;

      case 'halve_self_next':
        bs.npcHalvedNext = true;
        break;

      case 'clear_buffs':
        bs.disrupted           = false;
        bs.playerReducedNext10 = 0;
        text('Your buffs are stripped away.');
        break;

      case 'nullify_last_buff':
        bs.disrupted = false;
        text('Your last buff is nullified!');
        break;

      case 'chance_boost_next_10':
        if (Math.random() < 0.5) bs.npcBoostNext10 = true;
        break;

      case 'boost_next_2':
        bs.npcBoostedTurns = 2;
        text(`${bs.professor.name} enters a flow state!`);
        break;

      case 'chance_fail':
        // Roll handled pre-damage above; no post-damage state needed.
        break;

      case 'chance_bonus_10':
        // Roll handled pre-damage above; no post-damage state needed.
        break;

      case 'mutual_damage_20': {
        const fromPH2  = bs.professorHP;
        bs.professorHP = Math.max(0, bs.professorHP - 20);
        text(`${bs.professor.name} also takes 20 damage!`);
        animP(fromPH2, bs.professorHP);
        if (bs.professorHP <= 0) {
          if (this.opponentType === 'professor') engine.defeatProfessor(this.opponentId);
          text(`${bs.professor.name} faints!`);
          return 'win';
        }
        break;
      }

      case 'chain_hit_3': {
        // First hit already applied above. Each additional hit has 50% chance (max 2 more).
        let extraHits = 0;
        while (extraHits < 2 && Math.random() < 0.5) {
          const fromPH3 = engine.getState().playerHP;
          const toPH3   = fromPH3 - oppMove.damage;
          engine.setPlayerHP(toPH3);
          bs.lastProfessorDamage += oppMove.damage;
          animPl(fromPH3, Math.max(0, toPH3));
          extraHits++;
          if (toPH3 <= 0) {
            text(`Hit ${extraHits + 1} — you fainted!`);
            return 'loss';
          }
        }
        if (extraHits > 0) text(`Hit ${extraHits + 1} times!`);
        break;
      }

      // ── Stubbed effects (full implementation tracked in separate issues) ──────
      case 'swap_effect':
        // stub — test_project-umf: Fully implement swap_effect
        text(`${bs.professor.name} attempts to redirect — nothing happens.`);
        break;

      case 'priority':
        // stub — test_project-u5n: Fully implement priority
        break;

      case 'reveal_next':
        // stub — test_project-aqz: Fully implement reveal_next
        text(`${bs.professor.name} studies your moves carefully.`);
        break;
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
    this._drawProfHPBar(this.battleState.professorHP);
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
    const ratio = Math.max(0, hp / 100);
    this.playerHPBar.clear();
    this.playerHPBar.fillStyle(0xcccccc);
    this.playerHPBar.fillRect(PLAYER_HP_BAR_X, PLAYER_HP_BAR_Y, HP_BAR_W, HP_BAR_H);
    this.playerHPBar.fillStyle(this._hpColour(ratio));
    this.playerHPBar.fillRect(PLAYER_HP_BAR_X, PLAYER_HP_BAR_Y, Math.floor(HP_BAR_W * ratio), HP_BAR_H);
    this.playerHPText.setText(`${Math.max(0, Math.round(hp))}/100`);
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
