import Phaser from 'phaser';
import GameScene from './scenes/GameScene';

// Bootstrap Phaser and mount to <div id="app">.
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'app',
  backgroundColor: '#0f0f0f',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [GameScene],
};

new Phaser.Game(config);
