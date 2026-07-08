import { MenuScene } from './scenes/MenuScene.js';
import { SkyScene } from './scenes/SkyScene.js';
import { MemoryScene } from './scenes/MemoryScene.js';
import { PhoneChatScene } from './scenes/PhoneChatScene.js';
import { ConcertScene } from './scenes/ConcertScene.js';
import { MeyhaneScene } from './scenes/MeyhaneScene.js';
import { OpenAirConcertScene } from './scenes/OpenAirConcertScene.js';
import { FinaleScene } from './scenes/FinaleScene.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 450,
  parent: 'game',
  pixelArt: true,
  backgroundColor: '#0b0e2a',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 } },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 450,
  },
  input: {
    activePointers: 3,
  },
  audio: {
    disableWebAudio: false,
  },
  scene: [
    MenuScene,
    SkyScene,
    MemoryScene,
    PhoneChatScene,
    ConcertScene,
    MeyhaneScene,
    OpenAirConcertScene,
    FinaleScene,
  ],
};

new Phaser.Game(config);
