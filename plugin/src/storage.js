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
      liveMode: 'focus',
      statuslineEnabled: false,
    }, null, 2));
  } else {
    const config = readJsonFile(configPath, {});
    let changed = false;
    for (const [key, value] of Object.entries({
      sidebarEnabled: false,
      sidebarWidth: 28,
      sidebarHeight: 24,
      liveMode: 'focus',
      statuslineEnabled: false,
    })) {
      if (config[key] === undefined) {
        config[key] = value;
        changed = true;
      }
    }
    if (changed) fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }
  // Ensure history exists
  const historyPath = path.join(home, 'history.json');
  if (!fs.existsSync(historyPath)) {
    fs.writeFileSync(historyPath, JSON.stringify([], null, 2));
  }
  // Ensure session exists
  const sessionPath = path.join(home, 'session.json');
  if (!fs.existsSync(sessionPath)) {
    fs.writeFileSync(sessionPath, JSON.stringify(defaultSession(), null, 2));
  }
}

function readJsonFile(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return fallback;
  }
}

function defaultSession() {
  return {
    mode: 'focus',
    currentTask: '',
    consecutiveErrors: 0,
    lastFailureAt: null,
    lastRecoveryAt: null,
    lastConversationAt: null,
    lastActivityAt: null,
    recentTools: [],
    recentEvents: [],
  };
}

/** Read pet state from disk */
function readPet() {
  const petPath = path.join(getBuddyHome(), 'pet.json');
  return readJsonFile(petPath, null);
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
  return readJsonFile(configPath, {});
}

/** Write config */
function writeConfig(config) {
  const configPath = path.join(getBuddyHome(), 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/** Read history */
function readHistory() {
  const historyPath = path.join(getBuddyHome(), 'history.json');
  return readJsonFile(historyPath, []);
}

/** Append history entry */
function appendHistory(entry) {
  const history = readHistory();
  history.push(entry);
  const historyPath = path.join(getBuddyHome(), 'history.json');
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
}

/** Read session state */
function readSession() {
  const sessionPath = path.join(getBuddyHome(), 'session.json');
  const session = readJsonFile(sessionPath, defaultSession());
  return { ...defaultSession(), ...session };
}

/** Write session state */
function writeSession(session) {
  const sessionPath = path.join(getBuddyHome(), 'session.json');
  fs.writeFileSync(sessionPath, JSON.stringify({ ...defaultSession(), ...session }, null, 2));
}

/** Append a compact event to session history */
function rememberSessionEvent(session, event) {
  const next = { ...defaultSession(), ...session };
  next.recentEvents = Array.isArray(next.recentEvents) ? next.recentEvents : [];
  next.recentEvents.push(event);
  next.recentEvents = next.recentEvents.slice(-12);
  return next;
}

module.exports = {
  getBuddyHome,
  ensureSetup,
  defaultSession,
  readPet,
  writePet,
  logEvent,
  readConfig,
  writeConfig,
  readHistory,
  appendHistory,
  readSession,
  writeSession,
  rememberSessionEvent,
};
