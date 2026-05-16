// OverworldScene.js — prototype: courtyard map + player movement + NPC
//
// Prototype scope: renders the courtyard TMJ, places player (NPC 02) and a
// guide NPC (NPC 03) from the Objects layer, handles tile-by-tile movement,
// and runs the tutorial dialogue when the player first approaches the NPC.
// No tile collision yet — needs collides:true set on World tiles in Tiled first.

import * as engine from '../engine.js';

const TILE_SIZE    = 16;
const TILESET_NAME = 'PC _ Computer - Stardew Valley - Tilesets - Outdoors (Spring)';
const IDLE_FRAMES  = { down: 0, left: 4, right: 8, up: 12 };

// Pixel distance below which the "Space: talk" prompt appears and interaction fires.
const NPC_INTERACT_RANGE = 32;

export default class OverworldScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OverworldScene' });
  }

  preload() {
    this.load.image('tileset', 'assets/tilesets/stardew-outdoors-spring.png');
    this.load.tilemapTiledJSON('courtyard', 'assets/maps/courtyard.tmj');
    this.load.spritesheet('player', 'assets/sprites/character_overworld_sprites/NPC 02.png', {
      frameWidth: 64, frameHeight: 64,
    });
    this.load.spritesheet('npc', 'assets/sprites/character_overworld_sprites/NPC 03.png', {
      frameWidth: 64, frameHeight: 64,
    });
  }

  create() {
    engine.init();

    const map     = this.make.tilemap({ key: 'courtyard' });
    const tileset = map.addTilesetImage(TILESET_NAME, 'tileset');

    map.createLayer('Ground', tileset);
    map.createLayer('World', tileset);

    const objects = map.getObjectLayer('Objects').objects;
    const spawn   = objects.find(o => o.type === 'spawn');
    const npcObj  = objects.find(o => o.type === 'npc');

    this.player = this.physics.add.sprite(spawn.x, spawn.y, 'player').setScale(0.5);
    this.player.setDepth(1);

    if (npcObj) {
      this.add.sprite(npcObj.x, npcObj.y, 'npc').setScale(0.5).setFrame(1).setDepth(1);
    }

    map.createLayer('Above', tileset).setDepth(2);

    [
      { key: 'walk-down',  start: 0  },
      { key: 'walk-left',  start: 4  },
      { key: 'walk-right', start: 8  },
      { key: 'walk-up',    start: 12 },
    ].forEach(({ key, start }) => {
      if (!this.anims.exists(key)) {
        this.anims.create({
          key,
          frames:    this.anims.generateFrameNumbers('player', { start, end: start + 2 }),
          frameRate: 8,
          repeat:    -1,
        });
      }
    });

    this.cameras.main.startFollow(this.player);

    this.cursors  = this.input.keyboard.createCursorKeys();
    this._space   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this._enter   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.isMoving = false;
    this.facing   = 'down';

    // NPC interaction state
    this._npcPos     = npcObj ? { x: npcObj.x, y: npcObj.y } : null;
    this._inDialogue = false;

    // Talk prompt — world-space, scrolls with camera, shown when in range
    if (this._npcPos) {
      this._talkPrompt = this.add.text(
        this._npcPos.x, this._npcPos.y - 20, 'Space: talk', {
          fontSize: '9px', color: '#ccccff', fontFamily: 'monospace',
          backgroundColor: '#00000099',
          padding: { x: 3, y: 2 },
        }
      ).setOrigin(0.5).setDepth(10).setVisible(false);
    }

    // Controls hint — screen-space, fades after 3 seconds
    this._buildControlsHint();

    this.add.text(200, 390, 'I: menu', {
      fontSize: '9px', color: '#444466', fontFamily: 'monospace',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10);

    this.input.keyboard.on('keydown-I', () => {
      this.input.keyboard.enabled = false;
      this.scene.launch('KioskScene', {
        mode:    'overworld',
        onClose: () => { this.input.keyboard.enabled = true; },
      });
    });

    this.scene.get('AudioScene').switchTo('overworld');
  }

  wake() {
    this._inDialogue = false;
    this.input.keyboard.enabled = true;
    const audio = this.scene.get('AudioScene');
    if (audio) audio.switchTo('overworld');
  }

  _buildControlsHint() {
    const hint = this.add.text(200, 22, '↑ ↓ ← →  move   I  menu', {
      fontSize: '9px', color: '#aaaacc', fontFamily: 'monospace',
      backgroundColor: '#00000099',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(15);

    this.time.delayedCall(3500, () => {
      this.tweens.add({
        targets:  hint,
        alpha:    0,
        duration: 1200,
        onComplete: () => hint.destroy(),
      });
    });
  }

  _startGuideDialogue() {
    this._inDialogue = true;
    if (this._talkPrompt) this._talkPrompt.setVisible(false);
    this.input.keyboard.enabled = false;
    this.scene.launch('DialogueScene', {
      sequenceKey: 'npc_courtyard_guide',
      onComplete:  () => {
        this._inDialogue = false;
        this.input.keyboard.enabled = true;
      },
    });
  }

  update() {
    // NPC proximity check
    if (this._npcPos && !this._inDialogue) {
      const dx   = this.player.x - this._npcPos.x;
      const dy   = this.player.y - this._npcPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const inRange = dist < NPC_INTERACT_RANGE;

      if (this._talkPrompt) {
        this._talkPrompt.setVisible(inRange);
      }

      if (inRange &&
          (Phaser.Input.Keyboard.JustDown(this._space) ||
           Phaser.Input.Keyboard.JustDown(this._enter))) {
        this._startGuideDialogue();
        return;
      }
    }

    // Player movement
    if (this.isMoving) return;

    let dx = 0, dy = 0, animKey = null;

    if      (this.cursors.left.isDown)  { dx = -TILE_SIZE; animKey = 'walk-left';  this.facing = 'left';  }
    else if (this.cursors.right.isDown) { dx =  TILE_SIZE; animKey = 'walk-right'; this.facing = 'right'; }
    else if (this.cursors.up.isDown)    { dy = -TILE_SIZE; animKey = 'walk-up';    this.facing = 'up';    }
    else if (this.cursors.down.isDown)  { dy =  TILE_SIZE; animKey = 'walk-down';  this.facing = 'down';  }

    if (!animKey) {
      if (this.player.anims.isPlaying) {
        this.player.anims.stop();
        this.player.setFrame(IDLE_FRAMES[this.facing]);
      }
      return;
    }

    this.isMoving = true;
    this.player.anims.play(animKey, true);

    this.tweens.add({
      targets:  this.player,
      x:        this.player.x + dx,
      y:        this.player.y + dy,
      duration: 150,
      onComplete: () => {
        this.isMoving = false;
        engine.setPlayerPosition(
          Math.round(this.player.x / TILE_SIZE),
          Math.round(this.player.y / TILE_SIZE),
        );
      },
    });
  }
}
