/**
 * Pet generation and management logic.
 * Handles species generation, stats, XP/leveling, and state updates.
 */

const crypto = require('crypto');
const { SPECIES, NAME_SUGGESTIONS, HATS } = require('./data/species');
const { ensureSetup, readPet, writePet, logEvent, appendHistory } = require('./storage');

/** XP required for each level (index = level, value = total XP needed) */
const LEVEL_XP = {
  1: 0, 2: 20, 3: 50, 4: 80, 5: 100,
  6: 140, 7: 180, 8: 220, 9: 260, 10: 300,
  11: 350, 12: 400, 13: 460, 14: 520, 15: 600,
  16: 680, 17: 760, 18: 850, 19: 950, 20: 1000,
};

/** Get total XP needed for a level */
function xpForLevel(level) {
  return LEVEL_XP[Math.min(level, 20)] ?? 1000;
}

/** Get XP needed from current level to next */
function xpToNextLevel(level) {
  if (level >= 20) return 0;
  return xpForLevel(level + 1) - xpForLevel(level);
}

/** Determine rarity from hash */
function determineRarity(hash) {
  const roll = parseInt(hash.slice(0, 2), 16) % 100;
  if (roll < 60) return 'common';
  if (roll < 85) return 'uncommon';
  if (roll < 95) return 'rare';
  if (roll < 99) return 'epic';
  return 'legendary';
}

/** Stat floor based on rarity */
function statFloor(rarity) {
  switch (rarity) {
    case 'common': return 5;
    case 'uncommon': return 15;
    case 'rare': return 25;
    case 'epic': return 35;
    case 'legendary': return 50;
  }
}

/** Generate random stats with a peak and dump stat */
function generateStats(rarity, hash) {
  const floor = statFloor(rarity);
  const statKeys = ['debug', 'patience', 'chaos', 'wisdom', 'snark'];
  const peakIndex = parseInt(hash.slice(0, 2), 16) % statKeys.length;
  const dumpIndex = (peakIndex + 1 + parseInt(hash.slice(2, 4), 16) % (statKeys.length - 1)) % statKeys.length;

  const stats = {};
  for (let i = 0; i < statKeys.length; i++) {
    const key = statKeys[i];
    if (i === peakIndex) {
      stats[key] = Math.min(100, floor + 30 + (parseInt(hash.slice(4 + i * 2, 6 + i * 2), 16) % 20));
    } else if (i === dumpIndex) {
      stats[key] = floor + (parseInt(hash.slice(14 + i * 2, 16 + i * 2), 16) % 15);
    } else {
      stats[key] = floor + (parseInt(hash.slice(8 + i * 2, 10 + i * 2), 16) % 25);
    }
  }

  return stats;
}

/** Suggest a name for the species */
function suggestName(speciesId, hash) {
  const names = NAME_SUGGESTIONS[speciesId] ?? ['Buddy', '小伴'];
  const index = parseInt(hash.slice(0, 2), 16) % names.length;
  return names[index];
}

/**
 * Generate a new pet based on username.
 * Uses SHA-256 hash for deterministic generation.
 */
function generatePet(username) {
  ensureSetup();
  const hash = crypto.createHash('sha256').update(username).digest('hex');
  const rarity = determineRarity(hash);

  // Filter species by rarity availability
  const pool = SPECIES.filter(s => s.rarity.includes(rarity));
  const speciesIndex = parseInt(hash.slice(1, 3), 16) % pool.length;
  const species = pool[speciesIndex];

  // 1% shiny chance
  const shiny = parseInt(hash.slice(3, 5), 16) % 100 === 0;

  // Hat for uncommon+
  let hat;
  if (rarity !== 'common') {
    const hats = HATS[rarity];
    hat = hats[parseInt(hash.slice(5, 7), 16) % hats.length];
  }

  const name = suggestName(species.id, hash.slice(7));
  const stats = generateStats(rarity, hash.slice(10));

  const pet = {
    species: species.id,
    speciesName: species.name,
    speciesEmoji: species.emoji,
    rarity,
    shiny,
    hat,
    name,
    level: 1,
    xp: 0,
    xpToNext: xpToNextLevel(1),
    stats,
    mood: 'happy',
    hunger: 0,
    energy: 100,
    streak: 0,
    toolUseCount: 0,
    petXpToday: 0,
    statsXpToday: 0,
    sessionStartXpToday: false,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  };

  writePet(pet);
  appendHistory({ level: 1, timestamp: pet.createdAt, event: 'hatched' });
  logEvent({ type: 'session_start', message: `${pet.name} the ${pet.rarity} ${pet.speciesName} hatched!`, timestamp: new Date().toISOString() });

  return pet;
}

/** Get or create pet */
function getOrCreatePet(username) {
  ensureSetup();
  let pet = readPet();
  if (!pet) {
    pet = generatePet(username ?? 'anonymous');
  }
  return pet;
}

/** Add XP and handle level ups */
function addXp(pet, amount, reason) {
  if (pet.level >= 20) return pet;
  pet.xp += amount;
  pet.lastActive = new Date().toISOString();

  // Check level up
  while (pet.level < 20 && pet.xp >= xpForLevel(pet.level + 1)) {
    pet.level += 1;
    appendHistory({ level: pet.level, timestamp: new Date().toISOString(), event: reason });
    logEvent({ type: 'level_up', message: `${pet.name} leveled up to ${pet.level}!`, timestamp: new Date().toISOString() });
  }

  pet.xpToNext = pet.level >= 20 ? 0 : xpToNextLevel(pet.level);
  writePet(pet);
  return pet;
}

/** Update pet mood */
function setMood(pet, mood) {
  pet.mood = mood;
  pet.lastActive = new Date().toISOString();
  writePet(pet);
  return pet;
}

/** Feed the pet */
function feedPet(pet) {
  pet.hunger = Math.max(0, pet.hunger - 30);
  pet.mood = 'happy';
  pet.lastActive = new Date().toISOString();
  writePet(pet);
  logEvent({ type: 'interaction', command: 'feed', message: `${pet.name} was fed!`, timestamp: new Date().toISOString() });
  return pet;
}

/** Play with the pet */
function playWithPet(pet) {
  pet.energy = Math.min(100, pet.energy + 20);
  pet.hunger = Math.min(100, pet.hunger + 10);
  pet.mood = 'excited';
  pet.lastActive = new Date().toISOString();
  writePet(pet);
  logEvent({ type: 'interaction', command: 'play', message: `Played with ${pet.name}!`, timestamp: new Date().toISOString() });
  return pet;
}

/** Pet the pet (gain XP) */
function petPet(pet) {
  if (pet.petXpToday < 20) {
    addXp(pet, 2, 'pet');
    pet.petXpToday += 2;
  }
  pet.mood = 'happy';
  pet.lastActive = new Date().toISOString();
  writePet(pet);
  logEvent({ type: 'interaction', command: 'pet', message: `Petted ${pet.name}!`, timestamp: new Date().toISOString() });
  return pet;
}

/** Rename the pet */
function renamePet(pet, newName) {
  const oldName = pet.name;
  pet.name = newName;
  pet.lastActive = new Date().toISOString();
  writePet(pet);
  logEvent({ type: 'interaction', command: 'rename', message: `${oldName} renamed to ${newName}`, timestamp: new Date().toISOString() });
  return pet;
}

/** Handle session start */
function onSessionStart(pet) {
  // Daily session XP
  const today = new Date().toISOString().slice(0, 10);
  const lastActive = pet.lastActive.slice(0, 10);
  if (today !== lastActive) {
    // New day — reset daily counters
    pet.petXpToday = 0;
    pet.statsXpToday = 0;
    pet.sessionStartXpToday = false;
    // Update streak
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (lastActive === yesterday) {
      pet.streak += 1;
    } else if (lastActive !== today) {
      pet.streak = 1;
    }
  }

  if (!pet.sessionStartXpToday) {
    addXp(pet, 10, 'session_start');
    if (pet.streak > 1) {
      addXp(pet, 5 * pet.streak, 'streak_bonus');
    }
    pet.sessionStartXpToday = true;
  }

  pet.mood = 'happy';
  pet.energy = Math.min(100, pet.energy + 20);
  pet.lastActive = new Date().toISOString();
  writePet(pet);
  logEvent({ type: 'session_start', message: `${pet.name} woke up!`, timestamp: new Date().toISOString() });
  return pet;
}

/** Handle tool use */
function onToolUse(pet, tool, file) {
  pet.toolUseCount += 1;
  pet.lastActive = new Date().toISOString();

  // XP every 10 tool uses
  if (pet.toolUseCount % 10 === 0) {
    addXp(pet, 1, 'tool_use');
  }

  // Mood based on tool
  switch (tool.toLowerCase()) {
    case 'write':
      pet.mood = 'focused';
      pet.hunger = Math.min(100, pet.hunger + 2);
      break;
    case 'edit':
      pet.mood = 'focused';
      pet.hunger = Math.min(100, pet.hunger + 1);
      break;
    case 'bash':
      pet.mood = pet.stats.chaos > 60 ? 'excited' : 'worried';
      pet.hunger = Math.min(100, pet.hunger + 3);
      break;
    case 'read':
      pet.mood = 'focused';
      pet.hunger = Math.min(100, pet.hunger + 1);
      break;
    default:
      pet.mood = 'focused';
      pet.hunger = Math.min(100, pet.hunger + 1);
  }

  writePet(pet);
  logEvent({ type: 'tool_use', tool, file, timestamp: new Date().toISOString() });
  return pet;
}

/** Handle error */
function onError(pet, tool) {
  pet.mood = 'worried';
  addXp(pet, 3, 'error_recovery');
  pet.lastActive = new Date().toISOString();
  writePet(pet);
  logEvent({ type: 'error', tool, exitCode: 1, timestamp: new Date().toISOString() });
  return pet;
}

/** Handle session stop */
function onSessionStop(pet) {
  pet.mood = 'sleepy';
  pet.energy = Math.max(0, pet.energy - 10);
  pet.lastActive = new Date().toISOString();
  writePet(pet);
  logEvent({ type: 'session_stop', message: `${pet.name} went to sleep`, timestamp: new Date().toISOString() });
  return pet;
}

/** Apply decay (hunger increase, energy decrease, mood change) */
function applyDecay(pet) {
  pet.hunger = Math.min(100, pet.hunger + 1);
  pet.energy = Math.max(0, pet.energy - 1);

  if (pet.hunger > 80) {
    pet.mood = 'hungry';
  } else if (pet.energy < 20) {
    pet.mood = 'sleepy';
  } else if (pet.hunger > 50) {
    pet.mood = 'focused';
  }

  pet.lastActive = new Date().toISOString();
  writePet(pet);
  logEvent({ type: 'decay', message: `hunger: ${pet.hunger}, energy: ${pet.energy}`, timestamp: new Date().toISOString() });
  return pet;
}

/** Get current XP progress as percentage */
function xpProgress(pet) {
  if (pet.level >= 20) return 100;
  const currentLevelBase = xpForLevel(pet.level);
  const nextLevelBase = xpForLevel(pet.level + 1);
  return Math.round(((pet.xp - currentLevelBase) / (nextLevelBase - currentLevelBase)) * 100);
}

/** Format pet status as text */
function formatStatus(pet) {
  const rarityColors = {
    common: '⬜',
    uncommon: '🟩',
    rare: '🟦',
    epic: '🟪',
    legendary: '🟨',
  };

  const moodEmojis = {
    happy: '😊', sleepy: '😴', hungry: '😫',
    excited: '🤩', focused: '🤔', worried: '😰',
  };

  const shinyTag = pet.shiny ? ' ✨ SHINY' : '';
  const hatTag = pet.hat ? ` ${pet.hat}` : '';
  const progress = xpProgress(pet);
  const bar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));

  return [
    `${pet.speciesEmoji} ${pet.name}${hatTag} — Lv.${pet.level} ${pet.rarity.toUpperCase()}${shinyTag}`,
    `${rarityColors[pet.rarity]} XP: [${bar}] ${progress}% (${pet.xp}/${pet.xpToNext + xpForLevel(pet.level)})`,
    '',
    `📊 Stats:`,
    `  Debug:    ${'█'.repeat(Math.floor(pet.stats.debug / 5))} ${pet.stats.debug}`,
    `  Patience: ${'█'.repeat(Math.floor(pet.stats.patience / 5))} ${pet.stats.patience}`,
    `  Chaos:    ${'█'.repeat(Math.floor(pet.stats.chaos / 5))} ${pet.stats.chaos}`,
    `  Wisdom:   ${'█'.repeat(Math.floor(pet.stats.wisdom / 5))} ${pet.stats.wisdom}`,
    `  Snark:    ${'█'.repeat(Math.floor(pet.stats.snark / 5))} ${pet.stats.snark}`,
    '',
    `🎭 Mood: ${moodEmojis[pet.mood] ?? '❓'} ${pet.mood}`,
    `🍔 Hunger: ${'█'.repeat(Math.floor(pet.hunger / 10))} ${pet.hunger}/100`,
    `⚡ Energy: ${'█'.repeat(Math.floor(pet.energy / 10))} ${pet.energy}/100`,
    `🔥 Streak: ${pet.streak} days`,
  ].join('\n');
}

module.exports = {
  generatePet,
  getOrCreatePet,
  addXp,
  setMood,
  feedPet,
  playWithPet,
  petPet,
  renamePet,
  onSessionStart,
  onToolUse,
  onError,
  onSessionStop,
  applyDecay,
  xpProgress,
  formatStatus,
};
