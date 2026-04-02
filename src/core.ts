/**
 * Pet generation and management logic.
 * Handles species generation, stats, XP/leveling, and state updates.
 */

import * as crypto from 'crypto';
import { SPECIES, NAME_SUGGESTIONS, HATS } from './data/species';
import type { Pet, PetStats, Rarity, Mood, EventLogEntry } from './types';
import { ensureSetup, readPet, writePet, logEvent, appendHistory } from './storage';

/** XP required for each level (index = level, value = total XP needed) */
const LEVEL_XP: Record<number, number> = {
  1: 0, 2: 20, 3: 50, 4: 80, 5: 100,
  6: 140, 7: 180, 8: 220, 9: 260, 10: 300,
  11: 350, 12: 400, 13: 460, 14: 520, 15: 600,
  16: 680, 17: 760, 18: 850, 19: 950, 20: 1000,
};

/** Get total XP needed for a level */
function xpForLevel(level: number): number {
  return LEVEL_XP[Math.min(level, 20)] ?? 1000;
}

/** Get XP needed from current level to next */
function xpToNextLevel(level: number): number {
  if (level >= 20) return 0;
  return xpForLevel(level + 1) - xpForLevel(level);
}

/** Determine rarity from hash */
function determineRarity(hash: string): Rarity {
  const roll = parseInt(hash.slice(0, 2), 16) % 100;
  if (roll < 60) return 'common';
  if (roll < 85) return 'uncommon';
  if (roll < 95) return 'rare';
  if (roll < 99) return 'epic';
  return 'legendary' as Rarity;
}

/** Stat floor based on rarity */
function statFloor(rarity: Rarity): number {
  switch (rarity) {
    case 'common': return 5;
    case 'uncommon': return 15;
    case 'rare': return 25;
    case 'epic': return 35;
    case 'legendary': return 50;
  }
}

/** Generate random stats with a peak and dump stat */
function generateStats(rarity: Rarity, hash: string): PetStats {
  const floor = statFloor(rarity);
  const statKeys: (keyof PetStats)[] = ['debug', 'patience', 'chaos', 'wisdom', 'snark'];
  const peakIndex = parseInt(hash.slice(0, 2), 16) % statKeys.length;
  const dumpIndex = (peakIndex + 1 + parseInt(hash.slice(2, 4), 16) % (statKeys.length - 1)) % statKeys.length;

  const stats: Partial<PetStats> = {};
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

  return stats as PetStats;
}

/** Suggest a name for the species */
function suggestName(speciesId: string, hash: string): string {
  const names = NAME_SUGGESTIONS[speciesId] ?? ['Buddy', '小伴'];
  const index = parseInt(hash.slice(0, 2), 16) % names.length;
  return names[index];
}

/**
 * Generate a new pet based on username.
 * Uses SHA-256 hash for deterministic generation.
 */
export function generatePet(username: string): Pet {
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
  let hat: string | undefined;
  if (rarity !== 'common') {
    const hats = HATS[rarity];
    hat = hats[parseInt(hash.slice(5, 7), 16) % hats.length];
  }

  const name = suggestName(species.id, hash.slice(7));
  const stats = generateStats(rarity, hash.slice(10));

  const pet: Pet = {
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
export function getOrCreatePet(username?: string): Pet {
  ensureSetup();
  let pet = readPet();
  if (!pet) {
    pet = generatePet(username ?? 'anonymous');
  }
  return pet;
}

/** Add XP and handle level ups */
export function addXp(pet: Pet, amount: number, reason: string): Pet {
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
export function setMood(pet: Pet, mood: Mood): Pet {
  pet.mood = mood;
  pet.lastActive = new Date().toISOString();
  writePet(pet);
  return pet;
}

/** Feed the pet */
export function feedPet(pet: Pet): Pet {
  pet.hunger = Math.max(0, pet.hunger - 30);
  pet.mood = 'happy';
  pet.lastActive = new Date().toISOString();
  writePet(pet);
  logEvent({ type: 'interaction', command: 'feed', message: `${pet.name} was fed!`, timestamp: new Date().toISOString() });
  return pet;
}

/** Play with the pet */
export function playWithPet(pet: Pet): Pet {
  pet.energy = Math.min(100, pet.energy + 20);
  pet.hunger = Math.min(100, pet.hunger + 10);
  pet.mood = 'excited';
  pet.lastActive = new Date().toISOString();
  writePet(pet);
  logEvent({ type: 'interaction', command: 'play', message: `Played with ${pet.name}!`, timestamp: new Date().toISOString() });
  return pet;
}

/** Pet the pet (gain XP) */
export function petPet(pet: Pet): Pet {
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
export function renamePet(pet: Pet, newName: string): Pet {
  const oldName = pet.name;
  pet.name = newName;
  pet.lastActive = new Date().toISOString();
  writePet(pet);
  logEvent({ type: 'interaction', command: 'rename', message: `${oldName} renamed to ${newName}`, timestamp: new Date().toISOString() });
  return pet;
}

/** Handle session start */
export function onSessionStart(pet: Pet): Pet {
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
export function onToolUse(pet: Pet, tool: string, file?: string): Pet {
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
export function onError(pet: Pet, tool: string): Pet {
  pet.mood = 'worried';
  addXp(pet, 3, 'error_recovery');
  pet.lastActive = new Date().toISOString();
  writePet(pet);
  logEvent({ type: 'error', tool, exitCode: 1, timestamp: new Date().toISOString() });
  return pet;
}

/** Handle session stop */
export function onSessionStop(pet: Pet): Pet {
  pet.mood = 'sleepy';
  pet.energy = Math.max(0, pet.energy - 10);
  pet.lastActive = new Date().toISOString();
  writePet(pet);
  logEvent({ type: 'session_stop', message: `${pet.name} went to sleep`, timestamp: new Date().toISOString() });
  return pet;
}

/** Apply decay (hunger increase, energy decrease, mood change) */
export function applyDecay(pet: Pet): Pet {
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
export function xpProgress(pet: Pet): number {
  if (pet.level >= 20) return 100;
  const currentLevelBase = xpForLevel(pet.level);
  const nextLevelBase = xpForLevel(pet.level + 1);
  return Math.round(((pet.xp - currentLevelBase) / (nextLevelBase - currentLevelBase)) * 100);
}

/** Format pet status as text */
export function formatStatus(pet: Pet): string {
  const rarityColors: Record<Rarity, string> = {
    common: '⬜',
    uncommon: '🟩',
    rare: '🟦',
    epic: '🟪',
    legendary: '🟨',
  };

  const moodEmojis: Record<string, string> = {
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
