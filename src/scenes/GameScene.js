import Phaser from 'phaser';
import FiendSpawner from '../systems/FiendSpawner';

const PLAYER_SPEED = 200;
const WORLD_MULTIPLIER = 2; // Expand world to show camera follow

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');

    this.player = null;
    this.fiendSpawner = null;
    this.controls = {
      wasd: null,
      cursors: null,
      attack: null,
    };
  }

  preload() {
    this.createPlayerTexture();
  }

  create() {
    const { width, height } = this.scale;
    const worldWidth = width * WORLD_MULTIPLIER;
    const worldHeight = height * WORLD_MULTIPLIER;

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    this.add
      .grid(0, 0, worldWidth, worldHeight, 64, 64, 0x111111, 1, 0x1c1c1c, 0.6)
      .setOrigin(0, 0);

    this.player = this.physics.add
      .sprite(worldWidth / 2, worldHeight / 2, 'player')
      .setCollideWorldBounds(true);
    this.player.body.setAllowGravity(false);

    this.fiendSpawner = new FiendSpawner(this, this.player);
    this.bindInputs();

    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(1.25);

    this.add
      .text(
        16,
        16,
        'King of Harlem — WASD/Arrows to move, Space to attack',
        {
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          color: '#ffffff',
        },
      )
      .setScrollFactor(0);
  }

  update(time, delta) {
    if (!this.player?.body) return;

    const velocity = this.readMovementInput();
    this.player.body.setVelocity(velocity.x, velocity.y);
    this.clampToWorld();

    if (Phaser.Input.Keyboard.JustDown(this.controls.attack)) {
      // Placeholder attack hook
      console.log('Attack input triggered');
    }

    this.fiendSpawner?.update(time, delta);
  }

  createPlayerTexture() {
    if (this.textures.exists('player')) return;

    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0xff0033, 1);
    gfx.fillRect(0, 0, 26, 32);
    gfx.generateTexture('player', 26, 32);
    gfx.destroy();
  }

  bindInputs() {
    this.controls.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    this.controls.cursors = this.input.keyboard.createCursorKeys();
    this.controls.attack = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    );

    this.input.keyboard.addCapture([
      'W',
      'A',
      'S',
      'D',
      'SPACE',
      'UP',
      'DOWN',
      'LEFT',
      'RIGHT',
    ]);
  }

  readMovementInput() {
    const v = new Phaser.Math.Vector2(0, 0);
    const { wasd, cursors } = this.controls;

    if (wasd?.left.isDown || cursors?.left.isDown) v.x -= 1;
    if (wasd?.right.isDown || cursors?.right.isDown) v.x += 1;
    if (wasd?.up.isDown || cursors?.up.isDown) v.y -= 1;
    if (wasd?.down.isDown || cursors?.down.isDown) v.y += 1;

    if (v.lengthSq() > 0) {
      v.normalize().scale(PLAYER_SPEED);
    }

    return v;
  }

  clampToWorld() {
    const bounds = this.physics.world.bounds;
    const clampedX = Phaser.Math.Clamp(this.player.x, bounds.x, bounds.right);
    const clampedY = Phaser.Math.Clamp(this.player.y, bounds.y, bounds.bottom);
    this.player.setPosition(clampedX, clampedY);
  }
}
