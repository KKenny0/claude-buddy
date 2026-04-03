#!/usr/bin/env node
/**
 * buddy-core — CLI entry point for pet management commands.
 * Usage: buddy-core <command> [args]
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { getOrCreatePet, generatePet, feedPet, playWithPet, petPet, renamePet, formatStatus, addXp, onSessionStart, onToolUse, onError, onSessionStop } = require('../core');
const { readPet, ensureSetup } = require('../storage');

const args = process.argv.slice(2);
const command = args[0];

ensureSetup();

/**
 * Auto-inject hooks into ~/.claude/settings.json
 * Called after hatch to ensure hooks work without manual config.
 */
function setupHooks() {
  const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
  if (!fs.existsSync(settingsPath)) return;

  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

    // Derive hooks directory from this script's location
    const pluginRoot = path.resolve(__dirname, '..', '..');
    const hooksDir = path.join(pluginRoot, 'hooks');

    if (!fs.existsSync(path.join(hooksDir, 'session-start.sh'))) {
      return; // hooks dir not found, skip
    }

    // Build hooks config (Claude Code requires nested format with matchers)
    const buddyHooks = {
      SessionStart: [{ hooks: [{ type: 'command', command: `bash ${hooksDir}/session-start.sh` }] }],
      PostToolUse: [{ matcher: '', hooks: [{ type: 'command', command: `bash ${hooksDir}/post-tool-use.sh` }] }],
      Stop: [{ hooks: [{ type: 'command', command: `bash ${hooksDir}/stop.sh` }] }],
    };

    if (!settings.hooks) {
      settings.hooks = buddyHooks;
    } else {
      // Merge — don't overwrite other hooks
      for (const [event, handlers] of Object.entries(buddyHooks)) {
        // Remove any existing buddy hooks for this event
        if (settings.hooks[event]) {
          settings.hooks[event] = settings.hooks[event].filter(h => {
            const cmdStr = JSON.stringify(h.command || '');
            return !cmdStr.includes('claude-buddy');
          });
          settings.hooks[event].push(...handlers);
        } else {
          settings.hooks[event] = handlers;
        }
      }
    }

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
    console.log('✅ Hooks auto-configured in ~/.claude/settings.json');
  } catch (err) {
    // Silent fail — hooks setup is best-effort
    console.log('⚠️ Could not auto-configure hooks (you can set them manually)');
  }
}

switch (command) {
  case 'hatch': {
    const username = args[1] ?? process.env.USER ?? 'anonymous';
    const pet = generatePet(username);
    console.log(`🎉 ${pet.name} the ${pet.rarity} ${pet.speciesName} hatched!`);
    console.log(formatStatus(pet));
    console.log('');
    setupHooks();
    break;
  }

  case 'status': {
    const pet = getOrCreatePet(args[1]);
    console.log(formatStatus(pet));
    break;
  }

  case 'feed': {
    const pet = getOrCreatePet(args[1]);
    const updated = feedPet(pet);
    console.log(`🍔 Fed ${updated.name}! Hunger: ${updated.hunger}`);
    break;
  }

  case 'play': {
    const pet = getOrCreatePet(args[1]);
    const updated = playWithPet(pet);
    console.log(`🎾 Played with ${updated.name}! Mood: ${updated.mood}`);
    break;
  }

  case 'pet': {
    const pet = getOrCreatePet(args[1]);
    const updated = petPet(pet);
    console.log(`🐾 Petted ${updated.name}! ${updated.speciesEmoji} ${updated.mood}`);
    break;
  }

  case 'rename': {
    const newName = args[1];
    if (!newName) {
      console.error('Usage: buddy-core rename <new-name>');
      process.exit(1);
    }
    const pet = readPet();
    if (!pet) {
      console.error('No pet found. Hatch one first with: buddy-core hatch');
      process.exit(1);
    }
    const updated = renamePet(pet, newName);
    console.log(`📝 Renamed to ${updated.name}!`);
    break;
  }

  case 'stats': {
    const pet = getOrCreatePet(args[1]);
    // Grant stats XP
    if (pet.statsXpToday < 5) {
      addXp(pet, 1, 'stats');
      pet.statsXpToday += 1;
    }
    console.log(formatStatus(pet));
    break;
  }

  case 'session-start': {
    const pet = getOrCreatePet(args[1]);
    onSessionStart(pet);
    console.log(`🌅 ${pet.name} woke up for a new session!`);
    break;
  }

  case 'tool-use': {
    const tool = args[1];
    const file = args[2];
    if (!tool) {
      console.error('Usage: buddy-core tool-use <tool> [file]');
      process.exit(1);
    }
    const pet = readPet();
    if (!pet) {
      process.exit(0); // No pet, silently exit
    }
    const exitCode = parseInt(process.env.TOOL_EXIT_CODE ?? '0', 10);
    if (exitCode !== 0) {
      onError(pet, tool);
    } else {
      onToolUse(pet, tool, file);
    }
    break;
  }

  case 'session-stop': {
    const pet = readPet();
    if (!pet) {
      process.exit(0);
    }
    onSessionStop(pet);
    console.log(`🌙 ${pet.name} went to sleep. See you next time!`);
    break;
  }

  default:
    console.log(`Claude Buddy v1.0.0`);
    console.log('');
    console.log('Commands:');
    console.log('  hatch [username]   Hatch a new pet');
    console.log('  status [username]  Show pet status');
    console.log('  feed               Feed the pet');
    console.log('  play               Play with the pet');
    console.log('  pet                Pet the pet (+2 XP)');
    console.log('  rename <name>      Rename the pet');
    console.log('  stats              Show detailed stats');
    console.log('  session-start      Handle session start');
    console.log('  tool-use <t> [f]   Handle tool use event');
    console.log('  session-stop       Handle session stop');
}
