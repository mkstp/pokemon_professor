// MainMenuScene.js — top-level main menu
//
// Entry point for index.html. Launches AudioScene (once), plays intro_credits,
// and presents three options: Full Game, Battle Mode, Run Tests.
//
// Battle Mode opens BattleModeScene (registered as 'OverworldScene') within
// the same Phaser instance so AudioScene — and music — remain uninterrupted.
// Full Game and Run Tests are separate pages, so music stops on navigation.

import * as engine from '../engine.js';

const BTN_W  = 340;
const BTN_H  =  50;
const BTN_X  = 200;         // horizontal centre
const BTN_Y0 = 210;         // y-centre of first button
const BTN_GAP = 70;

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    engine.init();
    this.scene.launch('AudioScene');

    const audio = this.scene.get('AudioScene');
    const playIntro = () => {
      if (this.sound.locked) {
        this.sound.once('unlocked', () => audio.switchTo('intro_credits'));
      } else {
        audio.switchTo('intro_credits');
      }
    };

    // AudioScene.create() populates tracks after its own preload completes.
    // If it's already created (e.g. scene restart), call directly.
    if (audio.tracks && Object.keys(audio.tracks).length > 0) {
      playIntro();
    } else {
      audio.events.once('create', playIntro);
    }

    this._buildUI();
  }

  // Called when returning from BattleModeScene — music is already playing.
  wake() {
    this._buildUI();
  }

  _buildUI() {
    this.children.removeAll(true);

    // Background
    this.add.rectangle(200, 240, 400, 480, 0x1a1a2e);

    // Title
    this.add.text(BTN_X, 110, 'POKEMON PROFESSOR', {
      fontSize: '18px', color: '#ccccff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(BTN_X, 135, 'an academic adventure', {
      fontSize: '11px', color: '#555577', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const options = [
      {
        label:  '▶  Full Game',
        desc:   'Start from the overworld — the complete game loop',
        action: () => { window.location.href = 'game.html'; },
      },
      {
        label:  '⚔  Battle Mode',
        desc:   'Select any opponent and jump straight into battle',
        action: () => this._enterBattleMode(),
      },
      {
        label:  '✓  Run Tests',
        desc:   'Unit tests for engine, data, and battle scene logic',
        action: () => { window.location.href = 'tests/index.html'; },
      },
    ];

    options.forEach((opt, i) => {
      const y  = BTN_Y0 + i * BTN_GAP;
      const x0 = BTN_X - BTN_W / 2 + 10; // left-aligned text origin

      const bg = this.add.rectangle(BTN_X, y, BTN_W, BTN_H, 0x2a2a4a)
        .setInteractive({ useHandCursor: true });

      this.add.text(x0, y - 9, opt.label, {
        fontSize: '14px', color: '#ccccff', fontFamily: 'monospace',
      }).setOrigin(0, 0.5);

      this.add.text(x0, y + 10, opt.desc, {
        fontSize: '10px', color: '#666688', fontFamily: 'monospace',
      }).setOrigin(0, 0.5);

      bg.on('pointerover',  () => bg.setFillStyle(0x3a3a6a));
      bg.on('pointerout',   () => bg.setFillStyle(0x2a2a4a));
      bg.on('pointerdown',  opt.action);
    });
  }

  _enterBattleMode() {
    // Sleep (not stop) so we can wake it when returning from battle mode.
    this.scene.sleep('MainMenuScene');
    this.scene.launch('OverworldScene', { fromMainMenu: true });
  }
}
