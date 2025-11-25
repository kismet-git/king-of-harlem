import Phaser from 'phaser';
import FiendSpawner from '../systems/FiendSpawner';
import Gem from '../entities/Gem';
import HUD from '../ui/HUD';
import {
  playerStats,
  resetPlayerStats,
  addXP,
} from '../systems/PlayerStats';
import WorldMap from '../systems/WorldMap';

const ATTACK_RANGE = 52;
const ATTACK_ARC = Phaser.Math.DegToRad(80);
const GEM_XP_VALUE = 20;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');

    this.player = null;
    this.fiendSpawner = null;
    this.playerStats = playerStats;
    this.gems = null;
    this.hud = null;
    this.controls = {
      wasd: null,
      cursors: null,
      attack: null,
    };
    this.facing = new Phaser.Math.Vector2(1, 0);
  }

  preload() {
    this.createPlayerTexture();
  }

  create() {
    resetPlayerStats();

    // Build Harlem block layout and collision bodies.
    this.worldMap = new WorldMap(this);
    this.worldMap.build();

    const spawnPoint = this.worldMap.getSpawnPoint();
    this.player = this.physics.add
      .sprite(spawnPoint.x, spawnPoint.y, 'player')
      .setCollideWorldBounds(true);
    this.player.body.setAllowGravity(false);

    this.gems = this.physics.add.group({ classType: Gem, runChildUpdate: false });
    this.fiendSpawner = new FiendSpawner(
      this,
      this.player,
      this.playerStats,
      this.gems,
      this.worldMap,
      this.handleFiendDeath.bind(this),
    );
    this.hud = new HUD(this, this.playerStats);
    this.bindInputs();

    this.physics.add.overlap(
      this.player,
      this.gems,
      this.handleGemPickup,
      null,
      this,
    );

    this.physics.add.collider(this.player, this.worldMap.collisionLayerBodies);

    this.cameras.main.setBounds(0, 0, this.worldMap.pixelWidth, this.worldMap.pixelHeight);
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
    if (velocity.lengthSq() > 0) {
      this.facing.copy(velocity).normalize();
    }
    this.player.body.setVelocity(velocity.x, velocity.y);
    this.clampToWorld();

    if (Phaser.Input.Keyboard.JustDown(this.controls.attack)) {
      this.handleAttack();
    }

    this.fiendSpawner?.update(time, delta);
    if (this.playerStats.health <= 0) {
      this.handlePlayerDeath();
    }
    this.hud?.update();
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
      v.normalize().scale(this.playerStats.speed);
    }

    return v;
  }

  clampToWorld() {
    const bounds = this.physics.world.bounds;
    const clampedX = Phaser.Math.Clamp(this.player.x, bounds.x, bounds.right);
    const clampedY = Phaser.Math.Clamp(this.player.y, bounds.y, bounds.bottom);
    this.player.setPosition(clampedX, clampedY);
  }

  handleAttack() {
    const fiends = this.fiendSpawner?.fiends || [];
    let killsThisSwing = 0;

    for (const fiend of fiends) {
      if (!fiend.active || !fiend.body) continue;
      const toFiend = new Phaser.Math.Vector2(
        fiend.x - this.player.x,
        fiend.y - this.player.y,
      );
      const distance = toFiend.length();
      if (distance > ATTACK_RANGE) continue;

      const angleToFiend = Phaser.Math.Angle.Between(
        this.player.x,
        this.player.y,
        fiend.x,
        fiend.y,
      );
      const facingAngle = this.facing.angle();
      const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angleToFiend - facingAngle));

      if (angleDiff <= ATTACK_ARC / 2) {
        fiend.die();
        killsThisSwing += 1;
      }
    }

    if (killsThisSwing > 0) {
      this.cameras.main.flash(80, 255, 255, 255, false);
    }
  }

  handleGemPickup(_, gem) {
    if (!gem.active) return;
    gem.destroy();
    addXP(GEM_XP_VALUE);
  }

  handleFiendDeath() {
    this.playerStats.fiendsKilled += 1;
  }

  handlePlayerDeath() {
    this.playerStats.health = this.playerStats.maxHealth;
    this.player.body.setVelocity(0, 0);

    const bounds = this.physics.world.bounds;
    const safeX = (bounds.x + bounds.right) / 2;
    const safeY = (bounds.y + bounds.bottom) / 2;
    this.player.setPosition(safeX, safeY);

    this.cameras.main.flash(150, 255, 255, 255);
  }
}
