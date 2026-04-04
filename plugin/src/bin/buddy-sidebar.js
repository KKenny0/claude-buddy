#!/usr/bin/env node
/**
 * buddy-sidebar — tmux sidebar renderer with ASCII art and animations.
 * Usage: buddy-sidebar [--width W] [--height H]
 *
 * Watches pet.json and events.log for real-time updates.
 * Renders ASCII art pet + status in a compact sidebar.
 */

// Global error handler — prevent silent crashes
process.on('uncaughtException', (err) => {
  process.stderr.write(`[buddy-sidebar] ERROR: ${err.message}\n`);
  // Keep running — don't crash on transient errors
});
process.on('unhandledRejection', (reason) => {
  process.stderr.write(`[buddy-sidebar] UNHANDLED: ${reason}\n`);
});

const fs = require('fs');
const path = require('path');
const { SPECIES } = require('../data/species');
const { readPet, getBuddyHome, ensureSetup } = require('../storage');

// ANSI escape codes
const ESC = '\x1b[';
const RESET = `${ESC}0m`;
const BOLD = `${ESC}1m`;
const DIM = `${ESC}2m`;
const CLEAR = `${ESC}2J${ESC}H`;

// Colors
const colors = {
  reset: RESET,
  bold: BOLD,
  dim: DIM,
  red: `${ESC}31m`,
  green: `${ESC}32m`,
  yellow: `${ESC}33m`,
  blue: `${ESC}34m`,
  magenta: `${ESC}35m`,
  cyan: `${ESC}36m`,
  white: `${ESC}37m`,
  gray: `${ESC}90m`,
  brightGreen: `${ESC}92m`,
  brightYellow: `${ESC}93m`,
  brightBlue: `${ESC}94m`,
  brightMagenta: `${ESC}95m`,
  brightCyan: `${ESC}96m`,
};

// Parse args
const args = process.argv.slice(2);
let width = 28;
let height = 24;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--width' && args[i + 1]) width = parseInt(args[i + 1], 10);
  if (args[i] === '--height' && args[i + 1]) height = parseInt(args[i + 1], 10);
}

// State
let pet = null;
let currentReaction = '';
let reactionTimer = null;
let blinkState = false;
let frame = 0;
let tailWag = 0;
let running = true;

// Mood emoji map
const moodEmojis = {
  happy: '😊', sleepy: '😴', hungry: '😫',
  excited: '🤩', focused: '🤔', worried: '😰',
};

// Rarity color map
const rarityColors = {
  common: colors.white,
  uncommon: colors.brightGreen,
  rare: colors.brightBlue,
  epic: colors.brightMagenta,
  legendary: colors.brightYellow,
};

/** Get ASCII art for current pet state */
function getPetArt(p) {
  const species = SPECIES.find(s => s.id === p.species);
  if (!species) return ['???'];

  let art;
  switch (p.mood) {
    case 'happy': art = [...species.art.happy]; break;
    case 'excited': art = [...species.art.excited]; break;
    case 'sleepy': art = [...species.art.sleepy]; break;
    default: art = [...species.art.normal]; break;
  }

  // Blink animation (replace · with - every few frames)
  if (blinkState) {
    art = art.map(line => line.replace(/·/g, '-'));
  }

  // Shiny sparkle effect
  if (p.shiny && frame % 4 < 2) {
    art[0] = '✨' + art[0];
  }

  // Hat on top
  if (p.hat) {
    art.unshift(`  ${p.hat}  `);
  }

  return art;
}

/** Render the full sidebar */
function render() {
  if (!pet) {
    renderEmptyState();
    return;
  }

  const lines = [];
  const rc = rarityColors[pet.rarity] ?? colors.white;
  const shinyTag = pet.shiny ? ` ${colors.brightYellow}✨SHINY${colors.reset}` : '';

  // Header
  lines.push(`${colors.dim}┌${'─'.repeat(width - 2)}┐${colors.reset}`);
  lines.push(`${colors.dim}│${colors.reset} ${colors.bold}${pet.speciesEmoji} ${pet.name}${colors.reset}${shinyTag}${' '.repeat(Math.max(0, width - 10 - pet.name.length - (pet.shiny ? 7 : 0)))}${colors.dim}│${colors.reset}`);
  lines.push(`${colors.dim}│${colors.reset} ${rc}Lv.${pet.level} ${pet.rarity.toUpperCase()}${colors.reset}${' '.repeat(Math.max(0, width - 12 - pet.rarity.length))}${colors.dim}│${colors.reset}`);

  // XP bar
  const progress = xpProgress(pet);
  const filled = Math.floor(progress / 5);
  const bar = `${colors.brightGreen}${'█'.repeat(filled)}${colors.dim}${'░'.repeat(20 - filled)}${colors.reset}`;
  lines.push(`${colors.dim}│${colors.reset} ${bar} ${colors.dim}│${colors.reset}`);
  lines.push(`${colors.dim}├${'─'.repeat(width - 2)}┤${colors.reset}`);

  // ASCII art
  const art = getPetArt(pet);
  for (const line of art) {
    const padded = line.padEnd(width - 4);
    lines.push(`${colors.dim}│${colors.reset} ${padded} ${colors.dim}│${colors.reset}`);
  }

  lines.push(`${colors.dim}├${'─'.repeat(width - 2)}┤${colors.reset}`);

  // Mood & stats
  const me = moodEmojis[pet.mood] ?? '❓';
  lines.push(`${colors.dim}│${colors.reset} ${me} ${pet.mood.padEnd(8)} 🔥${String(pet.streak).padStart(2)}d${' '.repeat(Math.max(0, width - 22))}${colors.dim}│${colors.reset}`);

  // Mini stats
  const statLine = `DBG:${pet.stats.debug} PAT:${pet.stats.patience}`;
  lines.push(`${colors.dim}│${colors.reset} ${colors.cyan}${statLine}${colors.reset}${' '.repeat(Math.max(0, width - 4 - statLine.length - 1))}${colors.dim}│${colors.reset}`);
  const statLine2 = `CHA:${pet.stats.chaos} WIS:${pet.stats.wisdom} SNK:${pet.stats.snark}`;
  lines.push(`${colors.dim}│${colors.reset} ${colors.magenta}${statLine2}${colors.reset}${' '.repeat(Math.max(0, width - 4 - statLine2.length - 1))}${colors.dim}│${colors.reset}`);

  // Hunger & energy bars
  const hungerBar = `${colors.red}█${colors.reset}`.repeat(Math.floor(pet.hunger / 20)) + `${colors.gray}░${colors.reset}`.repeat(5 - Math.floor(pet.hunger / 20));
  const energyBar = `${colors.brightGreen}█${colors.reset}`.repeat(Math.floor(pet.energy / 20)) + `${colors.gray}░${colors.reset}`.repeat(5 - Math.floor(pet.energy / 20));
  lines.push(`${colors.dim}│${colors.reset} 🍔${hungerBar} ⚡${energyBar}${colors.reset}${' '.repeat(Math.max(0, width - 18))}${colors.dim}│${colors.reset}`);

  // Reaction area
  if (currentReaction) {
    lines.push(`${colors.dim}├${'─'.repeat(width - 2)}┤${colors.reset}`);
    const reactionLines = wrapText(currentReaction, width - 4);
    for (const rl of reactionLines.slice(0, 3)) {
      const padded = rl.padEnd(width - 4);
      lines.push(`${colors.dim}│${colors.reset} ${colors.yellow}${padded}${colors.reset} ${colors.dim}│${colors.reset}`);
    }
  }

  // Footer
  lines.push(`${colors.dim}└${'─'.repeat(width - 2)}┘${colors.reset}`);

  // Clear and draw
  const output = CLEAR + lines.join('\n');
  process.stdout.write(output);
}

function renderEmptyState() {
  const lines = [];
  lines.push(`${colors.dim}┌${'─'.repeat(width - 2)}┐${colors.reset}`);
  lines.push(`${colors.dim}│${colors.reset} ${colors.bold}🐣 Claude Buddy${colors.reset}${' '.repeat(Math.max(0, width - 18))}${colors.dim}│${colors.reset}`);
  lines.push(`${colors.dim}├${'─'.repeat(width - 2)}┤${colors.reset}`);

  for (const line of wrapText('还没有宠物。先运行 hatch，侧栏会自动继续刷新。', width - 4)) {
    lines.push(`${colors.dim}│${colors.reset} ${line.padEnd(width - 4)} ${colors.dim}│${colors.reset}`);
  }

  lines.push(`${colors.dim}│${colors.reset} ${' '.repeat(width - 4)} ${colors.dim}│${colors.reset}`);
  for (const line of wrapText('建议在 Claude Code 里运行 /claude-buddy:buddy hatch', width - 4)) {
    lines.push(`${colors.dim}│${colors.reset} ${colors.yellow}${line.padEnd(width - 4)}${colors.reset} ${colors.dim}│${colors.reset}`);
  }

  lines.push(`${colors.dim}└${'─'.repeat(width - 2)}┘${colors.reset}`);
  process.stdout.write(CLEAR + lines.join('\n'));
}

/** Calculate XP progress within current level (matches core.js logic) */
function xpProgress(pet) {
  if (pet.level >= 20) return 100;
  // LEVEL_XP table (must match core.js)
  const LEVEL_XP = [0, 20, 50, 90, 140, 200, 280, 380, 500, 650, 830, 1050, 1320, 1650, 2050, 2530, 3100, 3780, 4580, 5510, 6600];
  const currentLevelBase = LEVEL_XP[pet.level] ?? 0;
  const nextLevelBase = LEVEL_XP[pet.level + 1] ?? 6600;
  const range = nextLevelBase - currentLevelBase;
  if (range <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round(((pet.xp - currentLevelBase) / range) * 100)));
}
function wrapText(text, maxLen) {
  if (text.length <= maxLen) return [text];
  const lines = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      lines.push(remaining);
      break;
    }
    // Find a good break point
    let breakAt = maxLen;
    for (let i = maxLen; i > maxLen - 5 && i > 0; i--) {
      if (remaining[i] === ' ' || remaining[i] === '，' || remaining[i] === '。') {
        breakAt = i + 1;
        break;
      }
    }
    lines.push(remaining.slice(0, breakAt));
    remaining = remaining.slice(breakAt);
  }
  return lines;
}

/** Set a temporary reaction message */
function setReaction(text, durationMs = 8000) {
  currentReaction = text;
  if (reactionTimer) clearTimeout(reactionTimer);
  reactionTimer = setTimeout(() => {
    currentReaction = '';
    render();
  }, durationMs);
}

/** Watch events.log for new entries */
function watchEvents() {
  const eventLog = path.join(getBuddyHome(), 'events.log');
  if (!fs.existsSync(eventLog)) return;

  // Read from current position
  let pos = 0;
  try {
    const stat = fs.statSync(eventLog);
    pos = stat.size;
  } catch { /* ignore */ }

  const watcher = fs.watch(eventLog, (eventType) => {
    if (eventType !== 'change') return;
    try {
      const stat = fs.statSync(eventLog);
      if (stat.size <= pos) return;
      const fd = fs.openSync(eventLog, 'r');
      const buf = Buffer.alloc(stat.size - pos);
      fs.readSync(fd, buf, 0, buf.length, pos);
      fs.closeSync(fd);
      pos = stat.size;

      const newLines = buf.toString('utf-8').trim().split('\n').filter(Boolean);
      for (const line of newLines) {
        try {
          const event = JSON.parse(line);
          handleEvent(event);
        } catch { /* ignore malformed lines */ }
      }
    } catch { /* ignore read errors */ }
  });

  watcher.on('error', () => { /* ignore */ });
}

/** Handle an event and produce a reaction */
function handleEvent(event) {
  if (!pet) return;

  const name = pet.name;
  const emoji = pet.speciesEmoji;

  switch (event.type) {
    case 'session_start':
      setReaction(`${emoji} ${name} 伸了个懒腰，开始新的一天！`);
      break;
    case 'tool_use':
      switch (event.tool?.toLowerCase()) {
        case 'write':
          setReaction(`${emoji} ${name} 好奇地歪头看你写代码`);
          break;
        case 'edit':
          setReaction(`${emoji} ${name} 聚精会神地盯着你的改动`);
          break;
        case 'bash':
          setReaction(`${emoji} ${name} 紧张地看着终端...希望没炸`);
          break;
        case 'read':
          setReaction(`${emoji} ${name} 安静地陪在旁边看书`);
          break;
        default:
          setReaction(`${emoji} ${name} 在一旁默默观察`);
      }
      break;
    case 'error':
      setReaction(`${emoji} ${name} 担忧地看着你："出错了？没事，慢慢来"`);
      break;
    case 'interaction':
      if (event.command === 'feed') setReaction(`${emoji} ${name} 开心地吃东西！`);
      else if (event.command === 'play') setReaction(`${emoji} ${name} 玩得很开心！`);
      else if (event.command === 'pet') setReaction(`${emoji} ${name} 舒服地眯起了眼睛 💕`);
      break;
    case 'level_up':
      setReaction(`${emoji} ${name} 升级了！🎉 Lv.${pet.level}!`);
      break;
    case 'session_stop':
      setReaction(`${emoji} ${name} 打了个哈欠...晚安 🌙`);
      break;
  }
}

/** Main loop */
function main() {
  ensureSetup();
  process.stdout.write(CLEAR);

  // Initial load
  pet = readPet();
  render();

  // Watch for events
  watchEvents();

  // Periodic: re-read pet state + render (for animations + decay)
  const interval = setInterval(() => {
    if (!running) {
      clearInterval(interval);
      return;
    }
    pet = readPet();
    frame++;
    // Blink every 20 frames
    if (frame % 20 === 0) blinkState = !blinkState;
    // Tail wag
    if (pet?.mood === 'excited' || pet?.mood === 'happy') {
      tailWag = (tailWag + 1) % 4;
    }
    render();
  }, 2000);

  // Exit handling
  process.on('SIGINT', () => {
    running = false;
    process.stdout.write(CLEAR);
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    running = false;
    process.stdout.write(CLEAR);
    process.exit(0);
  });
}

main();
