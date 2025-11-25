import Phaser from 'phaser';
import { getXpToNextLevel } from '../systems/PlayerStats';

const BAR_WIDTH = 220;
const BAR_HEIGHT = 14;

export default class HUD {
  constructor(scene, stats) {
    this.scene = scene;
    this.stats = stats;

    this.container = scene.add.container(16, 16).setScrollFactor(0).setDepth(10);

    const panelBg = scene.add.rectangle(0, 0, BAR_WIDTH + 24, 72, 0x0c0c0c, 0.85);
    panelBg.setOrigin(0, 0);
    panelBg.setStrokeStyle(1, 0x262626, 1);

    this.healthBg = scene.add.rectangle(12, 12, BAR_WIDTH, BAR_HEIGHT, 0x1d1d1d);
    this.healthBg.setOrigin(0, 0);
    this.healthBar = scene.add.rectangle(12, 12, BAR_WIDTH, BAR_HEIGHT, 0xff476f);
    this.healthBar.setOrigin(0, 0);
    this.healthText = scene.add.text(14, 11, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#ffffff',
    });

    this.xpBg = scene.add.rectangle(12, 34, BAR_WIDTH, BAR_HEIGHT, 0x1d1d1d);
    this.xpBg.setOrigin(0, 0);
    this.xpBar = scene.add.rectangle(12, 34, BAR_WIDTH, BAR_HEIGHT, 0x66e6ff);
    this.xpBar.setOrigin(0, 0);
    this.xpText = scene.add.text(14, 33, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#ffffff',
    });

    this.levelText = scene.add.text(12, 54, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#c4c4c4',
    });

    this.killsText = scene.add.text(120, 54, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#c4c4c4',
    });

    this.container.add([
      panelBg,
      this.healthBg,
      this.healthBar,
      this.healthText,
      this.xpBg,
      this.xpBar,
      this.xpText,
      this.levelText,
      this.killsText,
    ]);

    this.update();
  }

  update() {
    const healthRatio = Phaser.Math.Clamp(
      this.stats.health / this.stats.maxHealth,
      0,
      1,
    );
    this.healthBar.width = BAR_WIDTH * healthRatio;
    this.healthText.setText(
      `HP ${Math.round(this.stats.health)}/${this.stats.maxHealth}`,
    );

    const xpNeeded = getXpToNextLevel();
    const xpRatio = Phaser.Math.Clamp(xpNeeded ? this.stats.xp / xpNeeded : 0, 0, 1);
    this.xpBar.width = BAR_WIDTH * xpRatio;
    this.xpText.setText(`XP ${Math.round(this.stats.xp)} / ${xpNeeded}`);

    this.levelText.setText(`Lvl ${this.stats.level}`);
    this.killsText.setText(`Fiends: ${this.stats.fiendsKilled}`);
  }
}
