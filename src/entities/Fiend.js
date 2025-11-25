import Phaser from 'phaser';

const STATE = {
  WANDER: 'wander',
  CHASE: 'chase',
};

const WANDER_SPEED = 60;
const CHASE_SPEED = 140;
const DETECTION_RADIUS = 220;
const WANDER_TIME_RANGE = { min: 700, max: 1600 };
const CONTACT_COOLDOWN = 700;

function ensureFiendTexture(scene) {
  if (scene.textures.exists('fiend')) return;

  const gfx = scene.make.graphics({ x: 0, y: 0, add: false });
  gfx.fillStyle(0x4c9cff, 1);
  gfx.fillRoundedRect(0, 0, 24, 26, 6);
  gfx.lineStyle(2, 0x1b3763, 1);
  gfx.strokeRoundedRect(0, 0, 24, 26, 6);
  gfx.fillStyle(0xffffff, 1);
  gfx.fillCircle(9, 10, 3);
  gfx.fillCircle(15, 10, 3);
  gfx.fillStyle(0x1b3763, 1);
  gfx.fillRect(7, 16, 10, 3);
  gfx.generateTexture('fiend', 24, 26);
  gfx.destroy();
}

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

export default class Fiend extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, player) {
    ensureFiendTexture(scene);
    ensureGemTexture(scene);

    super(scene, x, y, 'fiend');

    this.player = player;
    this.state = STATE.WANDER;
    this.wanderVector = new Phaser.Math.Vector2();
    this.wanderTimer = 0;
    this.contactTimer = 0;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.5);
    this.setCollideWorldBounds(true);
    this.body.setAllowGravity(false);
    this.body.setCircle(10, 2, 3);
    this.setDepth(1);

    scene.physics.add.overlap(
      this,
      player,
      this.handlePlayerContact,
      null,
      this,
    );
  }

  update(time, delta) {
    if (!this.active || !this.body) return;

    this.contactTimer = Math.max(0, this.contactTimer - delta);

    const target = this.player;
    if (!target?.body) {
      this.body.setVelocity(0, 0);
      return;
    }

    const distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
    this.state = distance <= DETECTION_RADIUS ? STATE.CHASE : STATE.WANDER;

    if (this.state === STATE.CHASE) {
      this.chase(target);
    } else {
      this.wander(delta);
    }
  }

  chase(target) {
    const direction = new Phaser.Math.Vector2(
      target.x - this.x,
      target.y - this.y,
    );

    if (direction.lengthSq() === 0) {
      this.body.setVelocity(0, 0);
      return;
    }

    direction.normalize().scale(CHASE_SPEED);
    this.body.setVelocity(direction.x, direction.y);
  }

  wander(delta) {
    this.wanderTimer -= delta;
    if (this.wanderTimer <= 0 || this.wanderVector.lengthSq() === 0) {
      this.wanderTimer = Phaser.Math.Between(
        WANDER_TIME_RANGE.min,
        WANDER_TIME_RANGE.max,
      );
      this.wanderVector.setToPolar(Phaser.Math.Angle.Random(), 1);
    }

    const velocity = this.wanderVector.clone().scale(WANDER_SPEED);
    this.body.setVelocity(velocity.x, velocity.y);
  }

  handlePlayerContact() {
    if (this.contactTimer > 0) return;

    this.contactTimer = CONTACT_COOLDOWN;
    console.log('Player takes contact damage from Fiend');
  }

  die() {
    if (!this.active) return;
    this.dropGem();
    this.destroy();
  }

  dropGem() {
    const gem = this.scene.physics.add.sprite(this.x, this.y, 'gem');
    gem.body.setAllowGravity(false);
    gem.setDepth(0.5);

    this.scene.tweens.add({
      targets: gem,
      y: gem.y - 6,
      yoyo: true,
      repeat: -1,
      duration: 650,
      ease: 'sine.inOut',
    });
  }
}
