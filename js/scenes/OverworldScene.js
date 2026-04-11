// OverworldScene.js — STUB for battle milestone
//
// Full implementation is tracked in the Beads backlog. This stub exists solely
// to satisfy the scene registry and provide a wake target for BattleScene.
//
// For the milestone: launches AudioScene and BattleScene (Schwaartz), then
// sleeps itself so BattleScene can wake it on exit.

export default class OverworldScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OverworldScene' });
  }

  create() {
    // Start the persistent audio manager alongside this scene.
    this.scene.launch('AudioScene');

    // Launch the battle directly for milestone testing.
    this.scene.launch('BattleScene', { professorId: 'prof_schwaartz' });

    // Sleep so BattleScene has a valid scene to wake when it ends.
    this.scene.sleep('OverworldScene');
  }
}
