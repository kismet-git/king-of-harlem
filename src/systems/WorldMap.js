import Phaser from 'phaser';

const TILE_SIZE = 32;
const MAP_WIDTH = 80;
const MAP_HEIGHT = 60;
const ROAD_ROWS = [20, 40];
const SIDEWALK_THICKNESS = 2;
const ALLEY_COLUMNS = [10, 24, 40, 56, 70];
const ALLEY_WIDTH = 2;

const TILE_KEYS = {
  ROAD: 'tile-road',
  SIDEWALK: 'tile-sidewalk',
  BUILDING: 'tile-building',
};

const TILE_TYPE = {
  ROAD: 'road',
  SIDEWALK: 'sidewalk',
  BUILDING: 'building',
};

export default class WorldMap {
  constructor(scene) {
    this.scene = scene;
    this.tileSize = TILE_SIZE;
    this.width = MAP_WIDTH;
    this.height = MAP_HEIGHT;
    this.pixelWidth = MAP_WIDTH * TILE_SIZE;
    this.pixelHeight = MAP_HEIGHT * TILE_SIZE;
    this.collisionLayerBodies = null;
    this.layout = null;
    this.spawnZones = [];
    this.spawnPoint = new Phaser.Math.Vector2(
      (Math.floor(MAP_WIDTH / 2) + 0.5) * TILE_SIZE,
      22.5 * TILE_SIZE,
    );
  }

  build() {
    this.ensureTileTextures();

    this.layout = this.createLayout();
    this.spawnZones = this.createSpawnZones();
    this.collisionLayerBodies = this.scene.physics.add.staticGroup();

    // Paint the map tiles and add static building bodies for collision.
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const tile = this.layout[y][x];
        const posX = x * this.tileSize + this.tileSize / 2;
        const posY = y * this.tileSize + this.tileSize / 2;

        if (tile === TILE_TYPE.BUILDING) {
          const block = this.collisionLayerBodies
            .create(posX, posY, TILE_KEYS.BUILDING)
            .setOrigin(0.5, 0.5);
          block.refreshBody();
        } else {
          this.scene.add
            .image(posX, posY, tile === TILE_TYPE.ROAD ? TILE_KEYS.ROAD : TILE_KEYS.SIDEWALK)
            .setOrigin(0.5, 0.5);
        }
      }
    }

    this.scene.physics.world.setBounds(0, 0, this.pixelWidth, this.pixelHeight);
  }

  ensureTileTextures() {
    if (!this.scene.textures.exists(TILE_KEYS.ROAD)) {
      const gfx = this.scene.make.graphics({ x: 0, y: 0, add: false });
      gfx.fillStyle(0x2a2a2a, 1);
      gfx.fillRect(0, 0, this.tileSize, this.tileSize);
      gfx.lineStyle(1, 0x1b1b1b, 1);
      gfx.strokeRect(0.5, 0.5, this.tileSize - 1, this.tileSize - 1);
      gfx.generateTexture(TILE_KEYS.ROAD, this.tileSize, this.tileSize);
      gfx.destroy();
    }

    if (!this.scene.textures.exists(TILE_KEYS.SIDEWALK)) {
      const gfx = this.scene.make.graphics({ x: 0, y: 0, add: false });
      gfx.fillStyle(0x5c5c5c, 1);
      gfx.fillRect(0, 0, this.tileSize, this.tileSize);
      gfx.lineStyle(1, 0x707070, 0.8);
      gfx.strokeRect(0.5, 0.5, this.tileSize - 1, this.tileSize - 1);
      gfx.generateTexture(TILE_KEYS.SIDEWALK, this.tileSize, this.tileSize);
      gfx.destroy();
    }

    if (!this.scene.textures.exists(TILE_KEYS.BUILDING)) {
      const gfx = this.scene.make.graphics({ x: 0, y: 0, add: false });
      gfx.fillStyle(0x2f2114, 1);
      gfx.fillRect(0, 0, this.tileSize, this.tileSize);
      gfx.fillStyle(0x3e2d1c, 1);
      gfx.fillRect(4, 4, this.tileSize - 8, this.tileSize - 8);
      gfx.lineStyle(1, 0x1c140c, 1);
      gfx.strokeRect(0.5, 0.5, this.tileSize - 1, this.tileSize - 1);
      gfx.generateTexture(TILE_KEYS.BUILDING, this.tileSize, this.tileSize);
      gfx.destroy();
    }
  }

  createLayout() {
    const grid = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => TILE_TYPE.BUILDING),
    );

    // Carve horizontal roads and surrounding sidewalks.
    for (const row of ROAD_ROWS) {
      for (let x = 0; x < this.width; x += 1) {
        grid[row][x] = TILE_TYPE.ROAD;
      }

      for (let offset = 1; offset <= SIDEWALK_THICKNESS; offset += 1) {
        const above = row - offset;
        const below = row + offset;
        if (above >= 0) {
          grid[above] = grid[above].map(() => TILE_TYPE.SIDEWALK);
        }
        if (below < this.height) {
          grid[below] = grid[below].map(() => TILE_TYPE.SIDEWALK);
        }
      }
    }

    // Create vertical alleys/intersections that cut through building blocks.
    for (const column of ALLEY_COLUMNS) {
      for (let dx = 0; dx < ALLEY_WIDTH; dx += 1) {
        const colIndex = column + dx;
        if (colIndex >= this.width) continue;

        for (let y = 0; y < this.height; y += 1) {
          const tileAt = grid[y][colIndex];
          const isRoadRow = ROAD_ROWS.includes(y);
          grid[y][colIndex] = isRoadRow ? TILE_TYPE.ROAD : TILE_TYPE.SIDEWALK;

          // Preserve sidewalks carved for roads so alleys meet them cleanly.
          if (tileAt === TILE_TYPE.SIDEWALK && !isRoadRow) {
            grid[y][colIndex] = TILE_TYPE.SIDEWALK;
          }
        }
      }
    }

    // Add a small courtyard near the center so the player starts on open ground.
    const courtyard = {
      x: Math.floor(this.width / 2) - 2,
      y: ROAD_ROWS[0] + 1,
      w: 5,
      h: 3,
    };
    for (let y = courtyard.y; y < courtyard.y + courtyard.h; y += 1) {
      for (let x = courtyard.x; x < courtyard.x + courtyard.w; x += 1) {
        if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
          grid[y][x] = TILE_TYPE.SIDEWALK;
        }
      }
    }

    // Update spawn point to a sidewalk patch near the center road.
    this.spawnPoint.set(
      (courtyard.x + courtyard.w / 2 + 0.5) * this.tileSize,
      (courtyard.y + courtyard.h / 2 + 0.5) * this.tileSize,
    );

    return grid;
  }

  getSpawnPoint() {
    return this.spawnPoint.clone();
  }

  createSpawnZones() {
    const zones = [];

    // Horizontal strips covering each road + its sidewalks.
    for (const row of ROAD_ROWS) {
      const startRow = Math.max(0, row - SIDEWALK_THICKNESS);
      const endRow = Math.min(this.height - 1, row + SIDEWALK_THICKNESS);
      zones.push({
        x: 0,
        y: startRow * this.tileSize,
        width: this.pixelWidth,
        height: (endRow - startRow + 1) * this.tileSize,
      });
    }

    // Vertical strips along alleys to diversify spawn positions.
    for (const column of ALLEY_COLUMNS) {
      const startCol = column;
      const endCol = Math.min(this.width - 1, column + ALLEY_WIDTH - 1);
      zones.push({
        x: startCol * this.tileSize,
        y: 0,
        width: (endCol - startCol + 1) * this.tileSize,
        height: this.pixelHeight,
      });
    }

    return zones;
  }

  getTileTypeAtWorld(x, y) {
    const tileX = Math.floor(x / this.tileSize);
    const tileY = Math.floor(y / this.tileSize);
    if (
      tileX < 0 ||
      tileY < 0 ||
      tileX >= this.width ||
      tileY >= this.height ||
      !this.layout
    ) {
      return null;
    }
    return this.layout[tileY][tileX];
  }

  isWalkableAt(x, y) {
    const tile = this.getTileTypeAtWorld(x, y);
    return tile === TILE_TYPE.ROAD || tile === TILE_TYPE.SIDEWALK;
  }
}
