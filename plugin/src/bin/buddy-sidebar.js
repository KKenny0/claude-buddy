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
const { readPet, getBuddyHome, ensureSetup, readSession, readConfig } = require('../storage');
const { xpProgress: coreXpProgress } = require('../core');

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
let session = null;
let config = null;
let currentReaction = '';
let reactionTimer = null;
let blinkState = false;
let frame = 0;
let tailWag = 0;
let running = true;
let idleNotifiedAt = 0;

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

function getShowcaseArt(p) {
  const moodFace = {
    happy: '•‿•',
    focused: '•_•',
    sleepy: '-_-',
    hungry: 'o_o',
    worried: 'o_o',
    excited: '★_★',
  }[p.mood] || '•_•';

  switch (p.species) {
    case 'cat':
      return ['   /\\___/\\   ', `  (  ${moodFace}  )  `, '  /   >   \\  ', ' /___x_____\\ '];
    case 'dragon':
      return ['     /^\\     ', ` <  ${moodFace}  >→`, ' (   ~   )  ', '  `-zzzz-´  '];
    case 'ghost':
      return ['   .-"""-.   ', `  / ${moodFace} \\  `, '  \\  ~  /   ', '   `---´    '];
    case 'robot':
      return ['   [ || ]   ', `  { ${moodFace} }  `, '  [====]   ', '  /|__|\\   '];
    case 'slime':
      return ['    ____    ', '  /      \\  ', ` |  ${moodFace}  | `, '  \\______/  '];
    case 'penguin':
      return ['    (•)     ', `  <(${moodFace})> `, '    /|\\    ', '    / \\    '];
    default:
      return getPetArt(p);
  }
}

/** Render the full sidebar */
function render() {
  if (!pet) {
    renderEmptyState();
    return;
  }

  const lines = [];
  session = session || readSession();
  config = config || readConfig();
  const rc = rarityColors[pet.rarity] ?? colors.white;
  const shinyTag = pet.shiny ? ` ${colors.brightYellow}✨SHINY${colors.reset}` : '';
  const mode = session.mode || config.liveMode || 'focus';

  lines.push(panelLine(`${colors.brightCyan}${colors.bold}Claude Buddy${colors.reset}`));
  lines.push(rule());
  lines.push(panelLine(`${pet.speciesEmoji} ${colors.bold}${pet.name}${colors.reset}${shinyTag}`));
  lines.push(panelLine(`${rc}Lv.${pet.level} ${pet.rarity.toUpperCase()}${colors.reset}  ${colors.cyan}${mode}${colors.reset}`));

  // XP bar
  const progress = xpProgress(pet);
  lines.push(panelLine(`XP ${progress}%`));
  lines.push(panelLine(bar(progress, width - 4, colors.brightGreen)));
  lines.push('');

  // ASCII art
  const art = getShowcaseArt(pet);
  for (const line of art) {
    lines.push(panelLine(center(line, width - 2)));
  }

  lines.push('');

  // Mood & stats
  const me = moodEmojis[pet.mood] ?? '❓';
  lines.push(panelLine(`${me} Mood: ${moodColor(pet.mood)}${pet.mood}${colors.reset}  streak ${String(pet.streak)}d`));

  // Mini stats
  const statLine = `DBG ${pet.stats.debug}  WIS ${pet.stats.wisdom}`;
  lines.push(panelLine(`${colors.cyan}${statLine}${colors.reset}`));

  // Hunger & energy bars
  lines.push(panelLine(`Energy ⚡ ${String(pet.energy).padStart(3)} / 100`));
  lines.push(panelLine(bar(pet.energy, width - 4, colors.brightYellow)));
  lines.push(panelLine(`Hunger 🍲 ${String(pet.hunger).padStart(3)} / 100`));
  lines.push(panelLine(bar(pet.hunger, width - 4, colors.red)));

  // Reaction area
  if (currentReaction) {
    lines.push(rule());
    const reactionLines = wrapText(currentReaction, width - 4);
    for (const rl of reactionLines.slice(0, 3)) {
      lines.push(panelLine(`${colors.yellow}${rl}${colors.reset}`));
    }
  }

  const recent = Array.isArray(session.recentEvents) ? session.recentEvents.slice(-4) : [];
  if (recent.length > 0) {
    lines.push(rule());
    lines.push(panelLine(`${colors.brightBlue}Recent Events${colors.reset}`));
    for (const event of recent) {
      const time = event.timestamp ? event.timestamp.slice(11, 16) : '--:--';
      const label = friendlyEventLabel(event);
      lines.push(panelLine(`${eventDot(event)} ${colors.gray}${time}${colors.reset}  ${label}`));
    }
  }

  lines.push(rule());
  lines.push(panelLine(`${colors.cyan}buddy:${colors.reset} ${mode} ${colors.dim}|${colors.reset} events ${recent.length}`));

  // Clear and draw
  const rendered = lines.slice(0, Math.max(1, height));
  const output = CLEAR + rendered.join('\n');
  process.stdout.write(output);
}

function renderEmptyState() {
  const lines = [];
  lines.push(panelLine(`${colors.brightCyan}${colors.bold}Claude Buddy${colors.reset}`));
  lines.push(rule());
  lines.push('');
  lines.push(panelLine(center('🥚', width - 2)));
  lines.push(panelLine(center('Buddy is warming up', width - 2)));
  lines.push('');

  for (const line of wrapText('Run /claude-buddy:buddy hatch or wait for session start.', width - 2)) {
    lines.push(panelLine(line));
  }

  lines.push(rule());
  lines.push(panelLine(`${colors.cyan}buddy:${colors.reset} focus ${colors.dim}|${colors.reset} ready`));
  process.stdout.write(CLEAR + lines.join('\n'));
}

/** Calculate XP progress within current level (matches core.js logic) */
function xpProgress(pet) {
  return coreXpProgress(pet);
}

function stripAnsi(text) {
  return String(text).replace(/\x1b\[[0-9;]*m/g, '');
}

function visibleLength(text) {
  return stripAnsi(text).length;
}

function frameLine(content, frameWidth) {
  const plain = stripAnsi(content);
  const clippedPlain = plain.length > frameWidth - 4 ? plain.slice(0, frameWidth - 5) + '…' : null;
  const value = clippedPlain ?? content;
  const pad = Math.max(0, frameWidth - 4 - visibleLength(value));
  return `${colors.dim}│${colors.reset} ${value}${' '.repeat(pad)} ${colors.dim}│${colors.reset}`;
}

function panelLine(content = '') {
  const plain = stripAnsi(content);
  const clippedPlain = plain.length > width - 2 ? plain.slice(0, width - 3) + '…' : null;
  return clippedPlain ?? content;
}

function rule() {
  return `${colors.dim}${'─'.repeat(Math.max(4, width - 1))}${colors.reset}`;
}

function center(text, size) {
  const len = visibleLength(text);
  const left = Math.max(0, Math.floor((size - len) / 2));
  return `${' '.repeat(left)}${text}`;
}

function moodColor(mood) {
  if (mood === 'happy' || mood === 'excited') return colors.brightGreen;
  if (mood === 'worried' || mood === 'hungry') return colors.red;
  if (mood === 'sleepy') return colors.yellow;
  return colors.brightGreen;
}

function bar(value, size, color) {
  const cells = Math.max(8, Math.min(22, Math.floor(size)));
  const filled = Math.max(0, Math.min(cells, Math.round((value / 100) * cells)));
  return `${color}${'█'.repeat(filled)}${colors.gray}${'░'.repeat(cells - filled)}${colors.reset}`;
}

function eventDot(event) {
  if (event.priority === 'critical' || event.type === 'error') return `${colors.red}●${colors.reset}`;
  if (event.priority === 'important' || event.text?.includes('测试')) return `${colors.green}●${colors.reset}`;
  return `${colors.blue}●${colors.reset}`;
}

function friendlyEventLabel(event) {
  if (event.text?.includes('测试通过')) return 'Tests passed';
  if (event.type === 'error') return 'Command failed';
  if (event.tool === 'Write') return 'Wrote file';
  if (event.tool === 'Edit' || event.tool === 'MultiEdit') return 'Edited file';
  if (event.tool === 'Read') return 'Code analyzed';
  if (event.type === 'session_start') return 'Session started';
  if (event.type === 'session_stop') return 'Session stopped';
  return event.tool || event.type || 'Activity';
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

  if (event.reaction?.text) {
    setReaction(event.reaction.text, event.reaction.ttlMs || 8000);
    return;
  }

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
      setReaction(`${emoji} ${name} 升级了！Lv.${pet.level}!`);
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
    session = readSession();
    config = readConfig();
    frame++;
    // Blink every 20 frames
    if (frame % 20 === 0) blinkState = !blinkState;
    // Tail wag
    if (pet?.mood === 'excited' || pet?.mood === 'happy') {
      tailWag = (tailWag + 1) % 4;
    }
    const lastActivity = session?.lastActivityAt ? Date.parse(session.lastActivityAt) : 0;
    if (pet && lastActivity && Date.now() - lastActivity > 10 * 60 * 1000 && Date.now() - idleNotifiedAt > 10 * 60 * 1000) {
      idleNotifiedAt = Date.now();
      setReaction(`${pet.speciesEmoji} ${pet.name} 看你停了一会儿，开始打瞌睡。`);
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
