import Phaser from 'phaser';
import Gem from './Gem';
import { takeDamage } from '../systems/PlayerStats';

const STATE = {
  WANDER: 'wander',
  CHASE: 'chase',
};

const WANDER_SPEED = 60;
const CHASE_SPEED = 140;
const DETECTION_RADIUS = 220;
const WANDER_TIME_RANGE = { min: 700, max: 1600 };
const CONTACT_COOLDOWN = 700;
const CONTACT_DAMAGE = 6;

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

export default class Fiend extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, player, stats, gemGroup, onDeath) {
    ensureFiendTexture(scene);

    super(scene, x, y, 'fiend');

    this.player = player;
    this.playerStats = stats;
    this.gemGroup = gemGroup;
    this.onDeath = onDeath;
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
    if (!this.playerStats) return;
    takeDamage(CONTACT_DAMAGE);
  }

  die() {
    if (!this.active) return;
    this.dropGem();
    if (this.onDeath) this.onDeath(this);
    this.destroy();
  }

  dropGem() {
    if (!this.gemGroup) return;
    const gem = new Gem(this.scene, this.x, this.y);
    this.gemGroup.add(gem);
  }
}
