#!/usr/bin/env node
/**
 * buddy-statusline — Claude Code statusline segment.
 * Shows pet state, rhythm coach signals, and level-gated features.
 * All output is purely visual — nothing is injected into conversation context.
 */

const { getOrCreatePet, xpProgress, effectiveLevel } = require('../core');
const { ensureSetup, readSession, readConfig } = require('../storage');
const { EVOLUTION_PATHS } = require('../data/species');

const ESC = '\x1b[';
const c = {
  reset: `${ESC}0m`,
  dim: `${ESC}2m`,
  cyan: `${ESC}36m`,
  green: `${ESC}32m`,
  yellow: `${ESC}33m`,
  red: `${ESC}31m`,
  blue: `${ESC}34m`,
  magenta: `${ESC}35m`,
  brightYellow: `${ESC}93m`,
};

// --- Level-gated unlock system ---
const UNLOCKS = {
  testStatus: 3,
  fileFocus: 5,
  sessionDuration: 7,
  summary: 10,
  errorPatterns: 13,
  evolution: 15,
  prestige: 20,
};

function unlocked(level, feature) {
  return level >= (UNLOCKS[feature] || 0);
}

// --- Rhythm coach signals ---

function sessionDurationMin(session) {
  if (!session.lastActivityAt) return 0;
  const first = session.recentTools?.[0]?.timestamp;
  if (!first) return 0;
  return (Date.now() - Date.parse(first)) / 60000;
}

function grindingFile(session) {
  if (!session.recentTools) return null;
  const counts = {};
  for (const t of session.recentTools) {
    if (t.file && ['edit', 'multiedit', 'write'].includes(String(t.tool).toLowerCase())) {
      counts[t.file] = (counts[t.file] || 0) + 1;
    }
  }
  for (const [file, count] of Object.entries(counts)) {
    if (count >= 5) return file.split('/').pop();
  }
  return null;
}

function formatDuration(min) {
  if (min < 60) return `${Math.round(min)}m`;
  return `${Math.floor(min / 60)}h${Math.round(min % 60)}m`;
}

// --- Statusline rendering ---

function readStdinJson() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => {
      if (!data.trim()) { resolve({}); return; }
      try { resolve(JSON.parse(data)); } catch { resolve({}); }
    });
    setTimeout(() => resolve({}), 40);
  });
}

function colorForMood(mood) {
  if (mood === 'happy' || mood === 'excited') return c.green;
  if (mood === 'worried' || mood === 'hungry') return c.red;
  if (mood === 'sleepy') return c.yellow;
  return c.cyan;
}

function buildSegments(pet, session, mode) {
  const segs = [];
  const progress = xpProgress(pet);
  const eLv = effectiveLevel(pet);
  const prestige = pet.prestige || 0;

  // Core: always shown
  segs.push(`${c.cyan}buddy:${c.reset} ${c.yellow}${mode}${c.reset}`);

  // Evolved name or base name
  const displayName = pet.evolvedForm || pet.name;
  segs.push(`${pet.speciesEmoji} ${displayName} ${colorForMood(pet.mood)}${pet.mood}${c.reset}`);
  segs.push(`${c.dim}Lv.${eLv}${c.reset} ${progress}%`);
  segs.push(`${c.dim}streak${c.reset} ${pet.streak || 0}d`);

  // Prestige indicator
  if (prestige > 0) {
    const stars = '\u2726'.repeat(Math.min(prestige, 5));
    segs.push(`${c.brightYellow}${stars}${c.reset}`);
  }

  // Evolution path indicator (Lv.15+)
  if (unlocked(pet.level, 'evolution') && pet.evolutionPath) {
    const path = Object.values(EVOLUTION_PATHS).find(p => p.id === pet.evolutionPath);
    if (path) {
      segs.push(`${c.magenta}${path.label}${c.reset}`);
    }
  }

  // Level 3+: test status
  if (unlocked(pet.level, 'testStatus')) {
    const status = session.lastTestStatus || 'unknown';
    if (status === 'green') segs.push(`${c.dim}tests${c.reset} ${c.green}green${c.reset}`);
    else if (status === 'red') segs.push(`${c.dim}tests${c.reset} ${c.red}red${c.reset}`);
    else segs.push(`${c.dim}tests${c.reset} ${c.dim}idle${c.reset}`);
  }

  // Coach: error avalanche (always shown — critical signal)
  if ((session.consecutiveErrors || 0) >= 3) {
    segs.push(`${c.red}\u00d7${session.consecutiveErrors}${c.reset}`);
  }

  // Level 5+: file focus grinding
  if (unlocked(pet.level, 'fileFocus')) {
    const grinding = grindingFile(session);
    if (grinding) {
      segs.push(`${c.yellow}\u21bb ${grinding}${c.reset}`);
    }
  }

  // Level 7+: session duration / fatigue
  if (unlocked(pet.level, 'sessionDuration')) {
    const dur = sessionDurationMin(session);
    if (dur >= 120) {
      segs.push(`${c.red}\u23f0 ${formatDuration(dur)}${c.reset}`);
    } else if (dur >= 60) {
      segs.push(`${c.yellow}${formatDuration(dur)}${c.reset}`);
    }
  }

  return segs;
}

async function main() {
  ensureSetup();
  await readStdinJson();

  const config = readConfig();
  const session = readSession();
  const mode = session.mode || config.liveMode || 'focus';
  const pet = getOrCreatePet(process.env.USER || 'anonymous');

  const line = buildSegments(pet, session, mode).join(` ${c.dim}|${c.reset} `);
  process.stdout.write(line);
}

main().catch(() => {
  process.stdout.write('buddy: unavailable');
});
