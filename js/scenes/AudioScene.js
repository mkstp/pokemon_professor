// AudioScene.js — persistent background music manager
//
// Runs as a permanent, non-rendering Phaser scene so that music continues
// uninterrupted across overworld/battle scene transitions. Other scenes
// access it via this.scene.get('AudioScene').
//
// Depends on: data.js (audioTracks array for ids, file paths, and loop settings)

import { audioTracks } from '../data.js';

export default class AudioScene extends Phaser.Scene {
  constructor() {
    super({ key: 'AudioScene' });
    // tracks: maps track id → Phaser BaseSound instance, populated in create().
    this.tracks        = {};
    this.currentTrackId = null;
  }

  // Queues all audio files for loading.
  preload() {
    for (const track of audioTracks) {
      this.load.audio(track.id, track.src);
    }
  }

  // Adds all loaded audio as sound instances and marks this scene as persistent.
  create() {
    for (const track of audioTracks) {
      this.tracks[track.id] = this.sound.add(track.id, { loop: track.loop });
    }

    // Keep this scene alive and running without rendering anything.
    this.scene.setActive(true).setVisible(false);
  }

  // Stops the current track and starts the specified one.
  // No-ops if the requested track is already playing.
  switchTo(trackId) {
    if (this.currentTrackId === trackId) return;

    if (this.currentTrackId && this.tracks[this.currentTrackId]) {
      this.tracks[this.currentTrackId].stop();
    }

    if (this.tracks[trackId]) {
      this.tracks[trackId].play();
      this.currentTrackId = trackId;
    }
  }

  // Plays a track from the beginning without stopping the current background track.
  // Used for one-shot sounds (victory, defeat jingles) that overlay music.
  play(trackId) {
    if (this.tracks[trackId]) {
      this.tracks[trackId].play();
    }
  }

  // Stops the currently playing background track and clears currentTrackId.
  stop() {
    if (this.currentTrackId && this.tracks[this.currentTrackId]) {
      this.tracks[this.currentTrackId].stop();
    }
    this.currentTrackId = null;
  }
}
