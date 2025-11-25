import Phaser from 'phaser';
import Fiend from '../entities/Fiend';

const SPAWN_INTERVAL = 2200;
const MAX_FIENDS = 10;

export default class FiendSpawner {
  constructor(scene, player, stats, gemGroup) {
    this.scene = scene;
    this.player = player;
    this.stats = stats;
    this.gemGroup = gemGroup;

    this.fiends = [];
    this.spawnTimer = 0;
  }

  update(time, delta) {
    this.spawnTimer += delta;

    if (this.spawnTimer >= SPAWN_INTERVAL) {
      this.spawnTimer = 0;
      this.spawnFiend();
    }

    this.fiends = this.fiends.filter((fiend) => fiend.active);
    for (const fiend of this.fiends) {
      fiend.update(time, delta);
    }
  }

  spawnFiend() {
    if (!this.player?.body) return;
    if (this.fiends.length >= MAX_FIENDS) return;

    const bounds = this.scene.physics.world.bounds;
    const x = Phaser.Math.Between(bounds.x + 32, bounds.right - 32);
    const y = Phaser.Math.Between(bounds.y + 32, bounds.bottom - 32);

    const fiend = new Fiend(this.scene, x, y, this.player, this.stats, this.gemGroup);
    this.fiends.push(fiend);
  }
}
