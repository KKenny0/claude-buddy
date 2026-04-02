/**
 * File system utilities for Claude Buddy.
 * Handles config directory creation, pet.json read/write, and event logging.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

/** Get the buddy home directory */
function getBuddyHome() {
  return path.join(os.homedir(), '.claude-buddy');
}

/** Ensure the buddy home directory and all files exist */
function ensureSetup() {
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
function readPet() {
  const petPath = path.join(getBuddyHome(), 'pet.json');
  if (!fs.existsSync(petPath)) return null;
  try {
    const data = fs.readFileSync(petPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/** Write pet state to disk */
function writePet(pet) {
  const petPath = path.join(getBuddyHome(), 'pet.json');
  fs.writeFileSync(petPath, JSON.stringify(pet, null, 2));
}

/** Append an event to the event log */
function logEvent(entry) {
  ensureSetup();
  const eventLog = path.join(getBuddyHome(), 'events.log');
  const line = JSON.stringify(entry) + '\n';
  fs.appendFileSync(eventLog, line);
}

/** Read config */
function readConfig() {
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
function writeConfig(config) {
  const configPath = path.join(getBuddyHome(), 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/** Read history */
function readHistory() {
  const historyPath = path.join(getBuddyHome(), 'history.json');
  if (!fs.existsSync(historyPath)) return [];
  try {
    const data = fs.readFileSync(historyPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/** Append history entry */
function appendHistory(entry) {
  const history = readHistory();
  history.push(entry);
  const historyPath = path.join(getBuddyHome(), 'history.json');
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
}

module.exports = {
  getBuddyHome,
  ensureSetup,
  readPet,
  writePet,
  logEvent,
  readConfig,
  writeConfig,
  readHistory,
  appendHistory,
};
