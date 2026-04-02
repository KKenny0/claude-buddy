/**
 * Core types for Claude Buddy pet system.
 */

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type Mood = 'happy' | 'sleepy' | 'hungry' | 'excited' | 'focused' | 'worried';

export interface PetStats {
  debug: number;
  patience: number;
  chaos: number;
  wisdom: number;
  snark: number;
}

export interface Pet {
  /** Unique species identifier */
  species: string;
  /** Species display name */
  speciesName: string;
  /** Species emoji */
  speciesEmoji: string;
  /** Rarity tier */
  rarity: Rarity;
  /** Whether this is a shiny variant */
  shiny: boolean;
  /** Equipped hat emoji */
  hat?: string;
  /** Pet name */
  name: string;
  /** Current level (1-20) */
  level: number;
  /** Current XP */
  xp: number;
  /** XP needed for next level */
  xpToNext: number;
  /** Five-dimensional stats (1-100) */
  stats: PetStats;
  /** Current mood */
  mood: Mood;
  /** Hunger level (0 = full, 100 = starving) */
  hunger: number;
  /** Energy level (0 = exhausted, 100 = full) */
  energy: number;
  /** Consecutive coding days */
  streak: number;
  /** Tool use counter (for XP) */
  toolUseCount: number;
  /** Total XP earned today from petting */
  petXpToday: number;
  /** Total XP earned today from stats check */
  statsXpToday: number;
  /** Whether session-start XP was given today */
  sessionStartXpToday: boolean;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last activity */
  lastActive: string;
}

export interface EventLogEntry {
  type: 'tool_use' | 'error' | 'idle' | 'interaction' | 'session_start' | 'session_stop' | 'decay' | 'level_up';
  tool?: string;
  file?: string;
  command?: string;
  exitCode?: number;
  duration?: number;
  message?: string;
  timestamp: string;
}

export interface Reaction {
  text: string;
  mood: Mood;
  xpGain?: number;
  hungerDelta?: number;
}

export interface HistoryEntry {
  level: number;
  timestamp: string;
  event: string;
}
