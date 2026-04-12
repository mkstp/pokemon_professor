// engine.js — game state module
//
// Owns the single gameState object. All other modules read and write game
// state by calling functions exported from this module. No module modifies
// gameState directly.
//
// Depends on: data.js (regions for entry positions, professors for the
//             allProfessorsDefeated check)

import { regions, professors } from './data.js';

// The five professors who must be defeated to unlock the castle.
// Excludes both the final boss (prof_vec_tor) and the secret boss (prof_parsemore),
// which are the last two entries in the professors array.
const PRE_CASTLE_PROFESSOR_IDS = professors.slice(0, -2).map(p => p.id);

// Starting values used by both init() and resetGame().
const STARTING_REGION = 'outdoor_campus';
const STARTING_HP = 100;

// Module-level state object. Private — never exported directly.
let gameState = {};

// Sets gameState to its starting values. Called once at game boot.
export function init() {
  gameState = {
    activeScene: 'overworld',
    playerHP: STARTING_HP,
    playerPosition: { ...regions[STARTING_REGION].entryPosition },
    currentRegion: STARTING_REGION,
    defeatedProfessors: [],
    pendingEncounter: null,
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

// Resets HP, position, region, and scene to starting values.
// Does NOT clear defeatedProfessors — progress persists across faints.
// Called automatically by setPlayerHP() when HP hits zero.
export function resetGame() {
  gameState.activeScene = 'overworld';
  gameState.playerHP = STARTING_HP;
  gameState.playerPosition = { ...regions[STARTING_REGION].entryPosition };
  gameState.currentRegion = STARTING_REGION;
  gameState.pendingEncounter = null;
}
