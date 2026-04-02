/**
 * File system utilities for Claude Buddy.
 * Handles config directory creation, pet.json read/write, and event logging.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { Pet, EventLogEntry, HistoryEntry } from './types';

/** Get the buddy home directory */
export function getBuddyHome(): string {
  return path.join(os.homedir(), '.claude-buddy');
}

/** Ensure the buddy home directory and all files exist */
export function ensureSetup(): void {
  const home = getBuddyHome();
  if (!fs.existsSync(home)) {
    fs.mkdirSync(home, { recursive: true });
  }
  // Ensure event log exists
  const eventLog = path.join(home, 'events.log');
  if (!fs.existsSync(eventLog)) {
    fs.writeFileSync(eventLog, '');
  }
  // Ensure config exists
  const configPath = path.join(home, 'config.json');
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({
      sidebarEnabled: false,
      sidebarWidth: 28,
      sidebarHeight: 24,
    }, null, 2));
  }
  // Ensure history exists
  const historyPath = path.join(home, 'history.json');
  if (!fs.existsSync(historyPath)) {
    fs.writeFileSync(historyPath, JSON.stringify([], null, 2));
  }
}

/** Read pet state from disk */
export function readPet(): Pet | null {
  const petPath = path.join(getBuddyHome(), 'pet.json');
  if (!fs.existsSync(petPath)) return null;
  try {
    const data = fs.readFileSync(petPath, 'utf-8');
    return JSON.parse(data) as Pet;
  } catch {
    return null;
  }
}

/** Write pet state to disk */
export function writePet(pet: Pet): void {
  const petPath = path.join(getBuddyHome(), 'pet.json');
  fs.writeFileSync(petPath, JSON.stringify(pet, null, 2));
}

/** Append an event to the event log */
export function logEvent(entry: EventLogEntry): void {
  ensureSetup();
  const eventLog = path.join(getBuddyHome(), 'events.log');
  const line = JSON.stringify(entry) + '\n';
  fs.appendFileSync(eventLog, line);
}

/** Read config */
export function readConfig(): Record<string, unknown> {
  const configPath = path.join(getBuddyHome(), 'config.json');
  if (!fs.existsSync(configPath)) return {};
  try {
    const data = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

/** Write config */
export function writeConfig(config: Record<string, unknown>): void {
  const configPath = path.join(getBuddyHome(), 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/** Read history */
export function readHistory(): HistoryEntry[] {
  const historyPath = path.join(getBuddyHome(), 'history.json');
  if (!fs.existsSync(historyPath)) return [];
  try {
    const data = fs.readFileSync(historyPath, 'utf-8');
    return JSON.parse(data) as HistoryEntry[];
  } catch {
    return [];
  }
}

/** Append history entry */
export function appendHistory(entry: HistoryEntry): void {
  const history = readHistory();
  history.push(entry);
  const historyPath = path.join(getBuddyHome(), 'history.json');
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
}
