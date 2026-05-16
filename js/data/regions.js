// data/regions.js — region metadata
//
// Spatial data (spawn points, encounter zones, transition zones, NPC positions)
// lives in each region's TMJ file (assets/maps/<id>.tmj) via the Objects layer.
// This file covers only the metadata OverworldScene needs before a map loads.
'use strict';

export const regions = {

  outdoor_campus: {
    id: 'outdoor_campus',
    displayName: 'Outdoor Campus',
    mapFile: 'assets/maps/outdoor_campus.tmj',
    weatherEffect: 'rain',
    music: 'overworld',
  },

  main_building: {
    id: 'main_building',
    displayName: 'Main Building',
    mapFile: 'assets/maps/main_building.tmj',
    weatherEffect: null,
    music: 'indoor',
  },

  cafeteria: {
    id: 'cafeteria',
    displayName: 'Cafeteria',
    mapFile: 'assets/maps/cafeteria.tmj',
    weatherEffect: null,
    music: 'cafeteria',
  },

  graduate_lounge: {
    id: 'graduate_lounge',
    displayName: 'Graduate Lounge',
    mapFile: 'assets/maps/graduate_lounge.tmj',
    weatherEffect: null,
    music: 'indoor',
  },

  basement: {
    id: 'basement',
    displayName: 'PhD Dungeon',
    mapFile: 'assets/maps/basement.tmj',
    weatherEffect: 'monitor_glow',
    music: 'dungeon',
  },

  lab_wing: {
    id: 'lab_wing',
    displayName: 'Lab Wing',
    mapFile: 'assets/maps/lab_wing.tmj',
    weatherEffect: 'monitor_glow',
    music: 'indoor',
  },

  courtyard: {
    id: 'courtyard',
    displayName: 'The Courtyard',
    mapFile: 'assets/maps/courtyard.tmj',
    weatherEffect: 'mist',
    music: 'indoor',
  },

  castle: {
    id: 'castle',
    displayName: 'The Castle',
    mapFile: 'assets/maps/castle.tmj',
    weatherEffect: 'candlelight',
    music: 'castle',
  },

};
