const baseStats = {
  maxHealth: 100,
  health: 100,
  armor: 1,
  damage: 15,
  speed: 200,
  level: 1,
  xp: 0,
  fiendsKilled: 0,
};

export const playerStats = { ...baseStats };

const STAT_UPGRADES = [
  { key: 'maxHealth', amount: 12 },
  { key: 'armor', amount: 1 },
  { key: 'damage', amount: 3 },
  { key: 'speed', amount: 18 },
];

function xpToNextLevel(level = playerStats.level) {
  // Gentle XP curve: grows linearly so early levels are quick and later levels take longer.
  return 40 + (level - 1) * 25;
}

export function resetPlayerStats() {
  Object.assign(playerStats, baseStats);
}

export function takeDamage(amount) {
  const mitigated = Math.max(1, Math.round(amount - playerStats.armor * 0.6));
  playerStats.health = Math.max(0, playerStats.health - mitigated);
  return playerStats.health <= 0;
}

export function heal(amount) {
  playerStats.health = Math.min(playerStats.maxHealth, playerStats.health + amount);
  return playerStats.health;
}

export function addXP(amount) {
  playerStats.xp += amount;

  let leveledUp = false;
  let xpNeeded = xpToNextLevel();

  while (playerStats.xp >= xpNeeded) {
    playerStats.xp -= xpNeeded;
    levelUp();
    leveledUp = true;
    xpNeeded = xpToNextLevel();
  }

  return leveledUp;
}

export function levelUp() {
  playerStats.level += 1;
  const upgrade = STAT_UPGRADES[(playerStats.level - 2) % STAT_UPGRADES.length];
  playerStats[upgrade.key] += upgrade.amount;
  playerStats.health = playerStats.maxHealth;
}

export function getXpToNextLevel() {
  return xpToNextLevel();
}
