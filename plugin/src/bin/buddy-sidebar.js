#!/usr/bin/env node
/**
 * buddy-sidebar — live terminal renderer for optional sidebar/panel surfaces.
 * Usage: buddy-sidebar [--width W] [--height H] [--panel] [--once]
 */

process.on('uncaughtException', (err) => {
  process.stderr.write(`[buddy-sidebar] ERROR: ${err.message}\n`);
});
process.on('unhandledRejection', (reason) => {
  process.stderr.write(`[buddy-sidebar] UNHANDLED: ${reason}\n`);
});

const fs = require('fs');
const path = require('path');
const { readPet, getBuddyHome, ensureSetup, readSession, readConfig } = require('../storage');
const { CLEAR, renderSidebarFrame, renderEmptyState } = require('../render');

const args = process.argv.slice(2);
let width = 28;
let height = 24;
let panelMode = false;
let onceMode = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--width' && args[i + 1]) width = parseInt(args[i + 1], 10);
  if (args[i] === '--height' && args[i + 1]) height = parseInt(args[i + 1], 10);
  if (args[i] === '--panel') panelMode = true;
  if (args[i] === '--once') onceMode = true;
}

let pet = null;
let session = null;
let config = null;
let currentReaction = '';
let reactionTimer = null;
let frame = 0;
let blinkState = false;
let running = true;
let idleNotifiedAt = 0;
let eventWatcher = null;
let interval = null;

function loadState() {
  pet = readPet();
  session = readSession();
  config = readConfig();
}

function currentFrame() {
  const options = {
    pet,
    session,
    config,
    width,
    height,
    reaction: currentReaction,
    panel: panelMode,
    animation: {
      frame,
      blink: blinkState,
    },
  };
  return pet ? renderSidebarFrame(options) : renderEmptyState(options);
}

function render(options = {}) {
  const prefix = options.clear === false ? '' : CLEAR;
  process.stdout.write(prefix + currentFrame());
}

function setReaction(text, durationMs = 8000) {
  currentReaction = text || '';
  if (reactionTimer) clearTimeout(reactionTimer);
  if (!currentReaction) {
    render();
    return;
  }
  reactionTimer = setTimeout(() => {
    currentReaction = '';
    render();
  }, durationMs);
}

function fallbackReactionForEvent(event) {
  if (!pet) return '';
  const name = pet.name;
  const emoji = pet.speciesEmoji;

  switch (event.type) {
    case 'session_start':
      return `${emoji} ${name} 伸了个懒腰，开始新的一天！`;
    case 'tool_use':
      switch (event.tool?.toLowerCase()) {
        case 'write':
          return `${emoji} ${name} 好奇地歪头看你写代码`;
        case 'edit':
        case 'multiedit':
          return `${emoji} ${name} 聚精会神地盯着你的改动`;
        case 'bash':
          return `${emoji} ${name} 紧张地看着终端...希望没炸`;
        case 'read':
          return `${emoji} ${name} 安静地陪在旁边看书`;
        default:
          return `${emoji} ${name} 在一旁默默观察`;
      }
    case 'error':
      return `${emoji} ${name} 担忧地看着你："出错了？没事，慢慢来"`;
    case 'interaction':
      if (event.command === 'feed') return `${emoji} ${name} 开心地吃东西！`;
      if (event.command === 'play') return `${emoji} ${name} 玩得很开心！`;
      if (event.command === 'pet') return `${emoji} ${name} 舒服地眯起了眼睛`;
      return `${emoji} ${name} 注意到一次互动。`;
    case 'level_up':
      return `${emoji} ${name} 升级了！Lv.${pet.level}!`;
    case 'session_stop':
      return `${emoji} ${name} 打了个哈欠...晚安`;
    default:
      return '';
  }
}

function handleEvent(event) {
  loadState();
  if (!pet) return;

  if (event.reaction?.text) {
    setReaction(event.reaction.text, event.reaction.ttlMs || 8000);
    return;
  }

  const reaction = fallbackReactionForEvent(event);
  if (reaction) setReaction(reaction);
}

function watchEvents() {
  const eventLog = path.join(getBuddyHome(), 'events.log');
  if (!fs.existsSync(eventLog)) return null;

  let pos = 0;
  try {
    pos = fs.statSync(eventLog).size;
  } catch {
    return null;
  }

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
          handleEvent(JSON.parse(line));
        } catch {
          // Ignore malformed event lines.
        }
      }
    } catch {
      // Ignore transient read errors.
    }
  });

  watcher.on('error', () => {});
  return watcher;
}

function maybeSetPanelInput() {
  if (!panelMode || !process.stdin.isTTY) return;
  process.stdin.setEncoding('utf8');
  if (process.stdin.setRawMode) process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', (chunk) => {
    if (chunk === 'q' || chunk === 'Q' || chunk === '\u001b' || chunk === '\u0003') {
      shutdown(0);
    }
  });
}

function shutdown(code = 0) {
  running = false;
  if (interval) clearInterval(interval);
  if (eventWatcher) eventWatcher.close();
  if (reactionTimer) clearTimeout(reactionTimer);
  if (process.stdin.isTTY && process.stdin.setRawMode) {
    try {
      process.stdin.setRawMode(false);
    } catch {
      // Ignore terminal cleanup errors.
    }
  }
  process.stdout.write(CLEAR);
  process.exit(code);
}

function main() {
  ensureSetup();
  loadState();

  if (onceMode) {
    process.stdout.write(currentFrame() + '\n');
    return;
  }

  render();
  eventWatcher = watchEvents();
  maybeSetPanelInput();

  interval = setInterval(() => {
    if (!running) return;
    loadState();
    frame++;
    if (frame % 20 === 0) blinkState = !blinkState;

    const lastActivity = session?.lastActivityAt ? Date.parse(session.lastActivityAt) : 0;
    if (pet && lastActivity && Date.now() - lastActivity > 10 * 60 * 1000 && Date.now() - idleNotifiedAt > 10 * 60 * 1000) {
      idleNotifiedAt = Date.now();
      setReaction(`${pet.speciesEmoji} ${pet.name} 看你停了一会儿，开始打瞌睡。`);
      return;
    }

    render();
  }, 2000);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

main();
