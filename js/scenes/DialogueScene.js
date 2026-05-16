// DialogueScene.js — dialogue box overlay
//
// Launched on top of the calling scene (overworld, battle post-win, etc.).
// Displays a sequence of { speaker, line } pairs one at a time.
// Text reveals one character at a time (typewriter effect).
// Space / Enter skips the reveal if in progress, or advances to the next line.
// On the last line calls onComplete() and stops itself.
//
// Launch params: { sequenceKey: string, onComplete?: () => void }
//   sequenceKey — key into dialogueSequences in data/dialogue.js
//   onComplete  — called after the last line is dismissed (optional)

import { dialogueSequences } from '../data/dialogue.js';

// Dialogue box occupies the bottom of the 400×400 canvas.
const BOX_Y      = 262;
const BOX_H      = 130;
const BOX_CENTER = BOX_Y + BOX_H / 2;

const CHAR_DELAY = 30; // ms per character

export default class DialogueScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DialogueScene' });
  }

  init(data) {
    this._sequence    = dialogueSequences[data.sequenceKey] ?? [];
    this._index       = 0;
    this._onComplete  = data.onComplete ?? null;
    this._revealing   = false;
    this._revealTimer = null;
    this._fullLine    = '';
  }

  create() {
    this.add.rectangle(200, BOX_CENTER, 400, BOX_H, 0x1a1a2e, 0.93);
    this.add.rectangle(200, BOX_Y, 400, 2, 0x555588);

    this._speakerText = this.add.text(14, BOX_Y + 8, '', {
      fontSize: '11px', fill: '#8888cc', fontFamily: 'monospace', fontStyle: 'bold',
    });

    this._lineText = this.add.text(14, BOX_Y + 27, '', {
      fontSize: '12px', fill: '#e8e8e8', fontFamily: 'monospace',
      wordWrap: { width: 372 },
    });

    this._prompt = this.add.text(384, BOX_Y + 112, '▼', {
      fontSize: '11px', fill: '#555588', fontFamily: 'monospace',
    }).setOrigin(1, 0).setVisible(false);

    this._showLine();

    const advance = () => this._advance();
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE).on('down', advance);
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER).on('down', advance);
  }

  _showLine() {
    if (!this._sequence.length) { this._finish(); return; }
    const { speaker, line } = this._sequence[this._index];
    this._speakerText.setText(speaker);
    this._prompt.setVisible(false);
    this._startReveal(line);
  }

  _startReveal(text) {
    this._fullLine  = text;
    this._revealing = true;
    this._lineText.setText('');

    if (!text.length) {
      this._revealing = false;
      this._prompt.setVisible(true);
      return;
    }

    let i = 0;
    this._revealTimer = this.time.addEvent({
      delay:    CHAR_DELAY,
      repeat:   text.length - 1,
      callback: () => {
        i++;
        this._lineText.setText(text.slice(0, i));
        if (i >= text.length) {
          this._revealing = false;
          this._prompt.setVisible(true);
        }
      },
    });
  }

  _skipReveal() {
    if (this._revealTimer) {
      this._revealTimer.destroy();
      this._revealTimer = null;
    }
    this._lineText.setText(this._fullLine);
    this._revealing = false;
    this._prompt.setVisible(true);
  }

  _advance() {
    if (this._revealing) {
      this._skipReveal();
      return;
    }
    this._index++;
    if (this._index >= this._sequence.length) {
      this._finish();
    } else {
      this._showLine();
    }
  }

  _finish() {
    if (this._revealTimer) {
      this._revealTimer.destroy();
      this._revealTimer = null;
    }
    if (this._onComplete) this._onComplete();
    this.scene.stop('DialogueScene');
  }
}
