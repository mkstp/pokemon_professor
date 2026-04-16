// engine.js — game state module
//
// Owns the single gameState object. All other modules read and write game
// state by calling functions exported from this module. No module modifies
// gameState directly.
//
// Depends on: data/regions.js (entry positions), data/professors.js (defeat check)

import { regions }    from './data/regions.js';
import { professors } from './data/professors.js';

// The five professors who must be defeated to unlock the castle.
// Excludes both the final boss (prof_vec_tor) and the secret boss (prof_parsemore),
// which are the last two entries in the professors array.
const PRE_CASTLE_PROFESSOR_IDS = professors.slice(0, -2).map(p => p.id);

// Starting values used by both init() and resetGame().
const STARTING_REGION = 'outdoor_campus';
const STARTING_HP     = 100;
const STARTING_LEVEL  = 1;
const STARTING_XP     = 0;
const XP_PER_LEVEL    = 100; // XP required to reach each successive level

// The 4 moves the player starts with and uses as their default battle loadout.
// Matches the hardcoded ACTIVE_MOVE_IDS in BattleScene.js until that constant
// is replaced by engine state (issue test_project-z28).
const STARTING_MOVE_IDS = ['non_sequitur', 'all_nighter', 'counterexample', 'correction'];

// Per-level stat gains applied when awardXP() triggers a level-up.
const DAMAGE_BUFF_PER_LEVEL  = 2; // flat bonus added to all player move damage
const DEFENSE_BUFF_PER_LEVEL = 2; // flat reduction applied to all incoming damage

// Module-level state object. Private — never exported directly.
let gameState = {};

// Sets gameState to its starting values. Called once at game boot.
export function init() {
  gameState = {
    activeScene:        'overworld',
    playerHP:           STARTING_HP,
    playerPosition:     { ...regions[STARTING_REGION].entryPosition },
    currentRegion:      STARTING_REGION,
    defeatedProfessors: [],
    pendingEncounter:   null,
    // XP and levelling (bk6)
    xp:             STARTING_XP,
    level:          STARTING_LEVEL,
    xpToNextLevel:  XP_PER_LEVEL,
    damageBuff:     0,  // flat bonus added to all player move damage on level-up
    defenseStat:    0,  // flat reduction applied to all incoming damage on level-up
    // Move loadout (3v1)
    learnedMoves:   [...STARTING_MOVE_IDS],       // all move IDs the player has unlocked
    activeMoves:    [...STARTING_MOVE_IDS],        // ordered 4-move battle loadout
  };
}

// Returns the current game state. Callers should treat it as read-only.
export function getState() {
  return gameState;
}

// Updates the player's current HP. Clamped to [0, 100].
// If hp reaches zero, calls resetGame() — triggers the faint handler.
export function setPlayerHP(hp) {
  const clamped = Math.max(0, Math.min(100, hp));
  gameState.playerHP = clamped;
  if (clamped <= 0) {
    resetGame();
  }
}

// Updates the player's tile position within the current region.
export function setPlayerPosition(x, y) {
  gameState.playerPosition = { x, y };
}

// Moves the player to a new map region and sets position to that region's
// entry point (read from data.js).
export function setRegion(regionId) {
  gameState.currentRegion = regionId;
  gameState.playerPosition = { ...regions[regionId].entryPosition };
}

// Sets the active scene. Expected values: 'overworld' or 'battle'.
export function setScene(scene) {
  gameState.activeScene = scene;
}

// Flags a pending professor encounter. Called by the map when the player
// steps onto a trigger tile. Pass null to clear.
export function setPendingEncounter(professorId) {
  gameState.pendingEncounter = professorId;
}

// Records a professor as defeated. Appends only if not already present,
// so calling this twice for the same professor is safe.
export function defeatProfessor(professorId) {
  if (!gameState.defeatedProfessors.includes(professorId)) {
    gameState.defeatedProfessors.push(professorId);
  }
}

// Returns true if the given professor has been defeated.
export function isDefeated(professorId) {
  return gameState.defeatedProfessors.includes(professorId);
}

// Returns true if all five pre-castle professors have been defeated.
// The final boss (prof_vec_tor) is excluded — this check gates the castle
// entrance, not the final battle itself.
export function allProfessorsDefeated() {
  return PRE_CASTLE_PROFESSOR_IDS.every(id =>
    gameState.defeatedProfessors.includes(id)
  );
}

// Awards XP to the player. If xp reaches or exceeds xpToNextLevel, triggers a
// level-up: increments level, carries over the remainder, and bumps damageBuff
// and defenseStat. Returns true if a level-up occurred, false otherwise.
export function awardXP(amount) {
  gameState.xp += amount;
  if (gameState.xp >= gameState.xpToNextLevel) {
    gameState.xp          -= gameState.xpToNextLevel;
    gameState.level       += 1;
    gameState.damageBuff  += DAMAGE_BUFF_PER_LEVEL;
    gameState.defenseStat += DEFENSE_BUFF_PER_LEVEL;
    return true;
  }
  return false;
}

// Adds a move ID to the player's learned move pool.
// Idempotent — calling it twice for the same ID has no effect.
export function addLearnedMove(moveId) {
  if (!gameState.learnedMoves.includes(moveId)) {
    gameState.learnedMoves.push(moveId);
  }
}

// Updates the player's active battle loadout to the given ordered array of 4 move IDs.
export function setActiveMoves(moveIds) {
  gameState.activeMoves = [...moveIds];
}

// Resets HP, position, region, and scene to starting values.
// Does NOT clear defeatedProfessors, xp, level, damageBuff, defenseStat,
// learnedMoves, or activeMoves — all progression persists across faints.
// Called automatically by setPlayerHP() when HP hits zero.
export function resetGame() {
  gameState.activeScene = 'overworld';
  gameState.playerHP = STARTING_HP;
  gameState.playerPosition = { ...regions[STARTING_REGION].entryPosition };
  gameState.currentRegion = STARTING_REGION;
  gameState.pendingEncounter = null;
}
