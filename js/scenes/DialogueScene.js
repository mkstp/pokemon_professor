// DialogueScene.js — STUB for battle milestone
//
// Full implementation is tracked in the Beads backlog. This stub exists to
// satisfy BattleScene's post-win dialogue launch. It calls onComplete()
// immediately so the battle exit flow continues without blocking.

export default class DialogueScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DialogueScene' });
  }

  init(data) {
    // Store the callback so create() can invoke it.
    this.onComplete = data.onComplete || null;
  }

  create() {
    if (this.onComplete) {
      this.onComplete();
    }
    this.scene.stop('DialogueScene');
  }
}
