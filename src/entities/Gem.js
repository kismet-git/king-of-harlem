import Phaser from 'phaser';

function ensureGemTexture(scene) {
  if (scene.textures.exists('gem')) return;

  const gfx = scene.make.graphics({ x: 0, y: 0, add: false });
  gfx.fillStyle(0x7effa5, 1);
  gfx.beginPath();
  gfx.moveTo(8, 0);
  gfx.lineTo(16, 10);
  gfx.lineTo(8, 20);
  gfx.lineTo(0, 10);
  gfx.closePath();
  gfx.fillPath();
  gfx.lineStyle(2, 0x295538, 1);
  gfx.strokePath();
  gfx.generateTexture('gem', 16, 20);
  gfx.destroy();
}

export default class Gem extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    ensureGemTexture(scene);
    super(scene, x, y, 'gem');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.5);
    this.body.setAllowGravity(false);
    this.setDepth(0.5);

    scene.tweens.add({
      targets: this,
      y: this.y - 6,
      yoyo: true,
      repeat: -1,
      duration: 650,
      ease: 'sine.inOut',
    });
  }
}
