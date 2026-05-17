// CourtyardScene.js — courtyard map, player movement, professor encounters, region transitions

import * as engine from '../engine.js';
import { regions } from '../data/regions.js';
import { professors } from '../data/professors.js';

const TILE_SIZE    = 16;
const TILESET_NAME  = 'stardew_spring';
const FURNITURE_NAME = 'furniture';
const IDLE_FRAMES  = { down: 0, left: 4, right: 8, up: 12 };

// Pixel distance below which the "Space: talk" prompt appears and interaction fires.
const NPC_INTERACT_RANGE = 32;

export default class CourtyardScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CourtyardScene' });
  }

  // Receives spawn override from a region transition: { spawnTileX, spawnTileY }.
  // On first load (from MainMenuScene) data is empty and _spawnOverride is null.
  init(data) {
    this._spawnOverride = (data && data.spawnTileX !== undefined)
      ? { x: data.spawnTileX * TILE_SIZE, y: data.spawnTileY * TILE_SIZE }
      : null;
  }

  preload() {
    const region = regions[engine.getState().currentRegion];

    this.load.image('tileset',   'assets/tilesets/stardew-outdoors-spring.png');
    this.load.image('furniture', 'assets/tilesets/stardew_furniture.png');
    this.load.tilemapTiledJSON(region.id, region.mapFile);
    this.load.spritesheet('player', 'assets/sprites/character_overworld_sprites/NPC 02.png', {
      frameWidth: 64, frameHeight: 64,
    });
    // Load overworld sprites for professors whose encounter zone is in this region.
    // Uses prof.id as the Phaser texture key; falls back to 'npc' if overworldSprite is absent.
    this.load.spritesheet('npc', 'assets/sprites/character_overworld_sprites/NPC 03.png', {
      frameWidth: 64, frameHeight: 64,
    });
    professors
      .filter(p => p.location.region === region.id && p.overworldSprite)
      .forEach(p => {
        this.load.spritesheet(p.id, p.overworldSprite, { frameWidth: 64, frameHeight: 64 });
      });
  }

  create() {
    const region = regions[engine.getState().currentRegion];
    const map    = this.make.tilemap({ key: region.id });
    const tileset   = map.addTilesetImage(TILESET_NAME, 'tileset');
    const furniture = map.addTilesetImage(FURNITURE_NAME, 'furniture');
    const tilesets  = [tileset, furniture];

    map.createLayer('Ground', tilesets);
    this._worldLayer = map.createLayer('World', tilesets);
    this._worldLayer.setCollisionByProperty({ collision: true });

    const objects = map.getObjectLayer('Objects').objects;
    const spawn   = objects.find(o => o.name === 'spawn');

    this.transitionZones = objects
      .filter(o => o.name === 'transition')
      .map(o => {
        const props = {};
        (o.properties || []).forEach(p => { props[p.name] = p.value; });
        return {
          bounds:              new Phaser.Geom.Rectangle(o.x, o.y, o.width, o.height),
          targetRegion:        props.targetRegion,
          targetTileX:         props.targetTileX  ?? 0,
          targetTileY:         props.targetTileY  ?? 0,
          requiresAllDefeated: props.requiresAllDefeated ?? false,
          requiresItem:        props.requiresItem  ?? null,
        };
      });

    // Parse encounter objects (professor encounters defined in the map's Objects layer).
    this._encounterData = objects
      .filter(o => o.name === 'encounter')
      .map(o => {
        const props = {};
        (o.properties || []).forEach(p => { props[p.name] = p.value; });
        return { x: o.x, y: o.y, professorId: props.professorId };
      });

    const startX = this._spawnOverride ? this._spawnOverride.x : spawn.x;
    const startY = this._spawnOverride ? this._spawnOverride.y : spawn.y;
    this.player = this.physics.add.sprite(startX, startY, 'player').setScale(0.5);
    this.player.setDepth(1);

    // Spawn an overworld sprite for each professor encounter.
    // Uses the professor's own texture key if their overworldSprite was loaded; falls back to 'npc'.
    this._encounterSprites = this._encounterData.map(enc => {
      const prof      = professors.find(p => p.id === enc.professorId);
      const spriteKey = (prof?.overworldSprite && this.textures.exists(enc.professorId))
        ? enc.professorId
        : 'npc';
      const sprite = this.add.sprite(enc.x, enc.y, spriteKey)
        .setScale(0.5).setFrame(0).setDepth(1);
      if (engine.isDefeated(enc.professorId)) sprite.setVisible(false);
      return { sprite, professorId: enc.professorId };
    });

    map.createLayer('Above', tilesets).setDepth(2);

    [
      { key: 'walk-down',  start: 0  },
      { key: 'walk-left',  start: 4  },
      { key: 'walk-right', start: 8  },
      { key: 'walk-up',    start: 12 },
    ].forEach(({ key, start }) => {
      if (!this.anims.exists(key)) {
        this.anims.create({
          key,
          frames:    this.anims.generateFrameNumbers('player', { start, end: start + 3 }),
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

    // Encounter interaction state
    this._npcBlockers  = this._encounterData
      .filter(enc => !engine.isDefeated(enc.professorId))
      .map(enc => ({ x: enc.x, y: enc.y }));
    this._inEncounter  = false;

    // Talk prompt — world-space, scrolls with camera, shown when near an undefeated professor.
    // One prompt shared across all encounter positions (only one per region in practice).
    const firstEnc = this._encounterData[0];
    this._talkPrompt = firstEnc
      ? this.add.text(firstEnc.x, firstEnc.y - 20, 'Space: talk', {
          fontSize: '9px', color: '#ccccff', fontFamily: 'monospace',
          backgroundColor: '#00000099',
          padding: { x: 3, y: 2 },
        }).setOrigin(0.5).setDepth(10).setVisible(false)
      : null;

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

    this.scene.get('AudioScene').switchTo(region.music);

    this._transitioning = false;
    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.events.on('wake', this.wake, this);
  }

  wake() {
    this._inEncounter = false;
    this.input.keyboard.enabled = true;
    // Rebuild blockers and hide sprites for any newly defeated professors.
    this._npcBlockers = this._encounterData
      .filter(enc => !engine.isDefeated(enc.professorId))
      .map(enc => ({ x: enc.x, y: enc.y }));
    this._encounterSprites.forEach(({ sprite, professorId }) => {
      if (engine.isDefeated(professorId)) sprite.setVisible(false);
    });
    const region = regions[engine.getState().currentRegion];
    const audio = this.scene.get('AudioScene');
    if (audio) audio.switchTo(region.music);
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

  checkEncounterTrigger() {
    if (this._inEncounter) return;

    let anyInRange = false;
    for (const enc of this._encounterData) {
      if (engine.isDefeated(enc.professorId)) continue;

      const dx = this.player.x - enc.x;
      const dy = this.player.y - enc.y;
      const inRange = Math.sqrt(dx * dx + dy * dy) < NPC_INTERACT_RANGE;

      if (inRange) anyInRange = true;

      if (inRange &&
          (Phaser.Input.Keyboard.JustDown(this._space) ||
           Phaser.Input.Keyboard.JustDown(this._enter))) {
        this._startEncounterDialogue(enc.professorId);
        return;
      }
    }

    if (this._talkPrompt) this._talkPrompt.setVisible(anyInRange);
  }

  _startEncounterDialogue(professorId) {
    const prof = professors.find(p => p.id === professorId);
    this._inEncounter = true;
    if (this._talkPrompt) this._talkPrompt.setVisible(false);
    this.input.keyboard.enabled = false;

    // Parsemore only battles once every other professor is defeated.
    if (professorId === 'prof_parsemore' && !engine.allProfessorsDefeated()) {
      this.scene.launch('DialogueScene', {
        sequenceKey: 'npc_courtyard_guide',
        onComplete:  () => {
          this._inEncounter = false;
          this.input.keyboard.enabled = true;
        },
      });
      return;
    }

    engine.setPendingEncounter(professorId);
    this.scene.launch('DialogueScene', {
      sequenceKey: prof.dialogue.preBattle,
      onComplete:  () => {
        this.scene.launch('BattleScene', { opponentType: 'professor', professorId, returnScene: 'CourtyardScene' });
        this.scene.sleep('CourtyardScene');
      },
    });
  }

  checkRegionTransition() {
    for (const zone of this.transitionZones) {
      if (!Phaser.Geom.Rectangle.Contains(zone.bounds, this.player.x, this.player.y)) continue;
      if (zone.requiresAllDefeated && !engine.allProfessorsDefeated()) continue;
      if (zone.requiresItem && !engine.hasItem(zone.requiresItem)) continue;

      this._transitioning = true;
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        engine.setRegion(zone.targetRegion);
        engine.setPlayerPosition(zone.targetTileX, zone.targetTileY);
        this.scene.restart({ spawnTileX: zone.targetTileX, spawnTileY: zone.targetTileY });
      });
      return;
    }
  }

  // Foot box: ±7px wide, y+4 to y+14 below sprite centre.
  // Checks the two leading-edge corners in the direction of movement,
  // against both collision tiles and static NPC blockers.
  _willCollide(tx, ty, dx, dy) {
    const H = 7, FT = 4, FB = 14;
    if (dx > 0) return this._blocked(tx + H, ty + FT) || this._blocked(tx + H, ty + FB);
    if (dx < 0) return this._blocked(tx - H, ty + FT) || this._blocked(tx - H, ty + FB);
    if (dy > 0) return this._blocked(tx - H, ty + FB) || this._blocked(tx + H, ty + FB);
    if (dy < 0) return this._blocked(tx - H, ty + FT) || this._blocked(tx + H, ty + FT);
    return false;
  }

  _blocked(wx, wy) {
    const tile = this._worldLayer.getTileAtWorldXY(wx, wy);
    if (tile !== null && tile.properties && tile.properties.collision === true) return true;
    return this._npcBlockers.some(({ x, y }) =>
      wx >= x - 7 && wx <= x + 7 && wy >= y + 4 && wy <= y + 14
    );
  }

  update() {
    if (this._transitioning) return;

    this.checkEncounterTrigger();
    if (this._inEncounter) return;

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

    const targetX = this.player.x + dx;
    const targetY = this.player.y + dy;
    if (this._willCollide(targetX, targetY, dx, dy)) return;

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
        this.checkRegionTransition();
      },
    });
  }
}
