#!/usr/bin/env node
/**
 * buddy-statusline — minimal Claude Code statusline segment.
 * Reads optional Claude Code session JSON from stdin and prints one line.
 */

const { getOrCreatePet, xpProgress } = require('../core');
const { ensureSetup, readSession, readConfig } = require('../storage');

const ESC = '\x1b[';
const colors = {
  reset: `${ESC}0m`,
  dim: `${ESC}2m`,
  cyan: `${ESC}36m`,
  green: `${ESC}32m`,
  yellow: `${ESC}33m`,
  red: `${ESC}31m`,
  blue: `${ESC}34m`,
  magenta: `${ESC}35m`,
};

function readStdinJson() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => {
      if (!data.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
    setTimeout(() => resolve({}), 40);
  });
}

function colorForMood(mood) {
  if (mood === 'happy' || mood === 'excited') return colors.green;
  if (mood === 'worried' || mood === 'hungry') return colors.red;
  if (mood === 'sleepy') return colors.yellow;
  return colors.cyan;
}

function testSegment(session) {
  const status = session.lastTestStatus || 'unknown';
  if (status === 'green') return `${colors.dim}tests${colors.reset} ${colors.green}green${colors.reset}`;
  if (status === 'red') return `${colors.dim}tests${colors.reset} ${colors.red}red${colors.reset}`;
  return `${colors.dim}tests${colors.reset} ${colors.dim}idle${colors.reset}`;
}

async function main() {
  ensureSetup();
  await readStdinJson();

  const config = readConfig();
  const session = readSession();
  const mode = session.mode || config.liveMode || 'focus';
  const pet = getOrCreatePet(process.env.USER || 'anonymous');
  const moodColor = colorForMood(pet.mood);
  const progress = xpProgress(pet);

  const line = [
    `${colors.cyan}buddy:${colors.reset} ${colors.yellow}${mode}${colors.reset}`,
    `${pet.speciesEmoji} ${pet.name} ${moodColor}${pet.mood}${colors.reset}`,
    `${colors.dim}Lv.${pet.level}${colors.reset} ${progress}%`,
    `${colors.dim}streak${colors.reset} ${pet.streak || 0}d`,
    testSegment(session),
  ].join(` ${colors.dim}|${colors.reset} `);

  process.stdout.write(line);
}

main().catch(() => {
  process.stdout.write('buddy: unavailable');
});
