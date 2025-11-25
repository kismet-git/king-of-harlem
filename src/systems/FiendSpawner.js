import Phaser from 'phaser';
import Fiend from '../entities/Fiend';

const SPAWN_INTERVAL = 2200;
const MAX_FIENDS = 10;
const MAX_SPAWN_ATTEMPTS = 6;

export default class FiendSpawner {
  constructor(scene, player, stats, gemGroup, worldMap, onFiendDeath) {
    this.scene = scene;
    this.player = player;
    this.stats = stats;
    this.gemGroup = gemGroup;
    this.worldMap = worldMap;
    this.onFiendDeath = onFiendDeath;

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
    if (!this.worldMap?.spawnZones?.length) return;

    const zone = Phaser.Utils.Array.GetRandom(this.worldMap.spawnZones);
    let spawnPosition = null;

    // Try a few times to find an open spot on a walkable tile.
    for (let attempt = 0; attempt < MAX_SPAWN_ATTEMPTS; attempt += 1) {
      const padding = 4;
      const x = Phaser.Math.Between(
        zone.x + padding,
        zone.x + Math.max(padding, zone.width - padding),
      );
      const y = Phaser.Math.Between(
        zone.y + padding,
        zone.y + Math.max(padding, zone.height - padding),
      );

      if (!this.isAreaWalkable(x, y, 12)) continue;

      spawnPosition = { x, y };
      break;
    }

    if (!spawnPosition) return;

    const fiend = new Fiend(
      this.scene,
      spawnPosition.x,
      spawnPosition.y,
      this.player,
      this.stats,
      this.gemGroup,
      this.onFiendDeath,
    );

    if (this.scene.worldMap?.collisionLayerBodies) {
      this.scene.physics.add.collider(
        fiend,
        this.scene.worldMap.collisionLayerBodies,
      );
    }

    this.fiends.push(fiend);
  }

  isAreaWalkable(x, y, halfSize) {
    const samples = [
      { x, y },
      { x: x - halfSize, y },
      { x: x + halfSize, y },
      { x, y: y - halfSize },
      { x, y: y + halfSize },
    ];

    return samples.every((p) => this.worldMap.isWalkableAt(p.x, p.y));
  }
}
