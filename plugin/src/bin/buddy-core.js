#!/usr/bin/env node
/**
 * buddy-core — CLI entry point for pet management commands.
 * Usage: buddy-core <command> [args]
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, spawnSync } = require('child_process');
const {
  getOrCreatePet,
  generatePet,
  feedPet,
  playWithPet,
  petPet,
  renamePet,
  formatStatus,
  addXp,
  onSessionStart,
  onToolUse,
  onError,
  onSessionStop,
  setLiveMode,
  getLiveMode,
} = require('../core');
const { readPet, ensureSetup, getBuddyHome, readSession, readConfig, writeConfig } = require('../storage');

const args = process.argv.slice(2);
const command = args[0];
const jsonOutput = args.includes('--json');

ensureSetup();

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function commandQuote(value) {
  const text = String(value);
  if (process.platform === 'win32') {
    return `"${text.replace(/"/g, '\\"')}"`;
  }
  return shellQuote(text);
}

function createHookHandler(scriptPath, matcher) {
  return {
    matcher,
    hooks: [
      {
        type: 'command',
        command: `bash ${shellQuote(scriptPath)}`,
      },
    ],
  };
}

function isBuddyHookHandler(handler) {
  if (!handler || !Array.isArray(handler.hooks)) return false;

  return handler.hooks.some((hook) => {
    const command = hook && typeof hook.command === 'string' ? hook.command : '';
    return (
      command.includes('session-start.sh') ||
      command.includes('post-tool-use.sh') ||
      command.includes('stop.sh') ||
      command.includes('${CLAUDE_PLUGIN_ROOT}/hooks/') ||
      command.includes('/claude-buddy/plugin/hooks/')
    );
  });
}

/**
 * Auto-inject hooks into ~/.claude/settings.json
 * Called after hatch to ensure hooks work without manual config.
 */
function setupHooks(options = {}) {
  const verbose = Boolean(options.verbose);
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

    // Build hooks config (Claude Code requires nested format with matchers).
    // Persist absolute paths because ~/.claude/settings.json is global and may
    // not have CLAUDE_PLUGIN_ROOT available when Claude executes the hooks.
    const buddyHooks = {
      SessionStart: [createHookHandler(path.join(hooksDir, 'session-start.sh'), '*')],
      PostToolUse: [createHookHandler(path.join(hooksDir, 'post-tool-use.sh'), '')],
      Stop: [createHookHandler(path.join(hooksDir, 'stop.sh'), '*')],
    };

    if (!settings.hooks) {
      settings.hooks = buddyHooks;
    } else {
      // Merge — don't overwrite other hooks
      for (const [event, handlers] of Object.entries(buddyHooks)) {
        if (!Array.isArray(settings.hooks[event])) {
          settings.hooks[event] = handlers;
          continue;
        }

        // Remove any previously injected Claude Buddy handlers, then append one
        // canonical handler for this event.
        settings.hooks[event] = settings.hooks[event].filter((handler) => !isBuddyHookHandler(handler));
        settings.hooks[event].push(...handlers);
      }
    }

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
    if (verbose) console.log('✅ Hooks auto-configured in ~/.claude/settings.json');
  } catch (err) {
    // Silent fail — hooks setup is best-effort
    if (verbose) console.log('⚠️ Could not auto-configure hooks (you can set them manually)');
  }
}

function maybeSetupHooks() {
  if (command === 'hatch') setupHooks({ verbose: !jsonOutput });
}

maybeSetupHooks();

function emitJson(payload) {
  console.log(JSON.stringify(payload));
}

function currentReactionPayload(pet) {
  return {
    pet: pet ? {
      name: pet.name,
      species: pet.species,
      speciesEmoji: pet.speciesEmoji,
      level: pet.level,
      mood: pet.mood,
    } : null,
    reaction: pet?.lastReaction || null,
    mode: getLiveMode(),
  };
}

function sidebarPidPath() {
  return path.join(getBuddyHome(), 'sidebar.pid');
}

function sidebarLogPath() {
  return path.join(getBuddyHome(), 'sidebar.log');
}

function sidebarScriptPath() {
  return path.join(__dirname, 'buddy-sidebar.js');
}

function statuslineScriptPath() {
  return path.join(__dirname, 'buddy-statusline.js');
}

function settingsPath() {
  return path.join(os.homedir(), '.claude', 'settings.json');
}

function readClaudeSettings() {
  const file = settingsPath();
  if (!fs.existsSync(file)) return {};
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return {};
  }
}

function writeClaudeSettings(settings) {
  const file = settingsPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(settings, null, 2) + '\n');
}

function buddyStatuslineCommand() {
  return `${commandQuote(process.execPath)} ${commandQuote(statuslineScriptPath())}`;
}

function isBuddyStatusline(statusLine) {
  return Boolean(statusLine?.command && String(statusLine.command).includes('buddy-statusline.js'));
}

function pidIsRunning(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function listBuddyProcesses() {
  const result = spawnSync('ps', ['-axo', 'pid,ppid,command'], { encoding: 'utf-8' });
  if (result.status !== 0) return [];
  return result.stdout
    .split('\n')
    .map((line) => {
      const match = line.trim().match(/^(\d+)\s+(\d+)\s+(.+)$/);
      if (!match) return null;
      return { pid: Number(match[1]), ppid: Number(match[2]), command: match[3] };
    })
    .filter(Boolean)
    .filter((proc) => proc.pid !== process.pid)
    .filter((proc) => /(^|\/)node\s/.test(proc.command) || proc.command.startsWith('node '))
    .filter((proc) => (
      proc.command.includes('buddy-sidebar.js') ||
      proc.command.includes('buddy-core.js" live') ||
      proc.command.includes("buddy-core.js' live") ||
      proc.command.includes('buddy-core.js live')
    ));
}

function startSidebar() {
  const stopped = stopSidebar({ silent: true });
  const pidPath = sidebarPidPath();
  if (fs.existsSync(pidPath)) {
    const pid = parseInt(fs.readFileSync(pidPath, 'utf-8'), 10);
    if (pidIsRunning(pid)) {
      console.log(`Claude Buddy live sidebar is already running (pid ${pid}).`);
      return;
    }
  }

  if (process.env.TMUX) {
    const commandLine = `${shellQuote(process.execPath)} ${shellQuote(sidebarScriptPath())} --width 32 --height 24`;
    const tmux = spawnSync('tmux', ['split-window', '-h', '-l', '32', commandLine], { stdio: 'ignore' });
    if (tmux.status === 0) {
      console.log(stopped > 0
        ? `Claude Buddy sidebar opened in a tmux pane after stopping ${stopped} old process(es).`
        : 'Claude Buddy sidebar opened in a tmux pane.');
      return;
    }
  }

  const out = fs.openSync(sidebarLogPath(), 'a');
  const child = spawn(process.execPath, [sidebarScriptPath(), '--width', '32', '--height', '24'], {
    detached: true,
    stdio: ['ignore', out, out],
  });
  child.unref();
  fs.writeFileSync(pidPath, String(child.pid));
  console.log(stopped > 0
    ? `Claude Buddy live sidebar started (pid ${child.pid}) after stopping ${stopped} old process(es).`
    : `Claude Buddy live sidebar started (pid ${child.pid}).`);
}

function stopSidebar(options = {}) {
  const silent = Boolean(options.silent);
  let stopped = 0;
  const pidPath = sidebarPidPath();
  const pids = new Set();

  if (fs.existsSync(pidPath)) {
    const pid = parseInt(fs.readFileSync(pidPath, 'utf-8'), 10);
    if (pidIsRunning(pid)) pids.add(pid);
  }

  for (const proc of listBuddyProcesses()) {
    pids.add(proc.pid);
  }

  for (const pid of pids) {
    try {
      process.kill(pid, 'SIGTERM');
      stopped += 1;
    } catch {
      // Already gone.
    }
  }

  fs.rmSync(pidPath, { force: true });
  if (!silent) {
    if (stopped > 0) console.log(`Stopped ${stopped} Claude Buddy sidebar/live process(es).`);
    else console.log('Claude Buddy sidebar is not running.');
  }
  return stopped;
}

function runLiveForeground() {
  installStatusline({ forceBuddy: true });
  console.log('Claude Buddy statusline enabled. Run /reload-plugins or restart Claude Code if it does not appear immediately.');
}

function installStatusline(options = {}) {
  const forceBuddy = Boolean(options.forceBuddy);
  const settings = readClaudeSettings();
  if (settings.statusLine && !isBuddyStatusline(settings.statusLine) && !forceBuddy) {
    console.log('A non-Buddy statusLine already exists. Re-run with statusline install --force to replace it.');
    return false;
  }
  settings.statusLine = {
    type: 'command',
    command: buddyStatuslineCommand(),
    padding: 0,
  };
  writeClaudeSettings(settings);

  const config = readConfig();
  config.statuslineEnabled = true;
  config.sidebarEnabled = false;
  writeConfig(config);
  return true;
}

function removeStatusline() {
  const settings = readClaudeSettings();
  if (isBuddyStatusline(settings.statusLine)) {
    delete settings.statusLine;
    writeClaudeSettings(settings);
  }
  const config = readConfig();
  config.statuslineEnabled = false;
  writeConfig(config);
  console.log('Claude Buddy statusline disabled.');
}

function printEvents() {
  const session = readSession();
  const events = Array.isArray(session.recentEvents) ? session.recentEvents.slice(-10) : [];
  if (events.length === 0) {
    console.log('No Claude Buddy events yet.');
    return;
  }
  for (const event of events) {
    const time = event.timestamp ? event.timestamp.slice(11, 19) : '--:--:--';
    const label = [event.type, event.tool].filter(Boolean).join(':');
    console.log(`${time} ${label.padEnd(16)} ${event.text || ''}`);
  }
}

switch (command) {
  case 'hatch': {
    const username = args[1] ?? process.env.USER ?? 'anonymous';
    const pet = generatePet(username);
    if (jsonOutput) emitJson(currentReactionPayload(pet));
    else {
      console.log(`🎉 ${pet.name} the ${pet.rarity} ${pet.speciesName} hatched!`);
      console.log(formatStatus(pet));
      console.log('');
    }
    break;
  }

  case 'status': {
    const pet = getOrCreatePet(args[1]);
    if (jsonOutput) emitJson(currentReactionPayload(pet));
    else console.log(formatStatus(pet));
    break;
  }

  case 'feed': {
    const pet = getOrCreatePet(args[1]);
    const updated = feedPet(pet);
    if (jsonOutput) emitJson(currentReactionPayload(updated));
    else console.log(`🍔 Fed ${updated.name}! Hunger: ${updated.hunger}`);
    break;
  }

  case 'play': {
    const pet = getOrCreatePet(args[1]);
    const updated = playWithPet(pet);
    if (jsonOutput) emitJson(currentReactionPayload(updated));
    else console.log(`🎾 Played with ${updated.name}! Mood: ${updated.mood}`);
    break;
  }

  case 'pet': {
    const pet = getOrCreatePet(args[1]);
    const updated = petPet(pet);
    if (jsonOutput) emitJson(currentReactionPayload(updated));
    else console.log(`🐾 Petted ${updated.name}! ${updated.speciesEmoji} ${updated.mood}`);
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
    if (jsonOutput) emitJson(currentReactionPayload(updated));
    else console.log(`📝 Renamed to ${updated.name}!`);
    break;
  }

  case 'stats': {
    const pet = getOrCreatePet(args[1]);
    // Grant stats XP
    if (pet.statsXpToday < 5) {
      addXp(pet, 1, 'stats');
      pet.statsXpToday += 1;
    }
    if (jsonOutput) emitJson(currentReactionPayload(pet));
    else console.log(formatStatus(pet));
    break;
  }

  case 'session-start': {
    const pet = getOrCreatePet(args[1]);
    onSessionStart(pet);
    if (jsonOutput) emitJson(currentReactionPayload(pet));
    else console.log(`🌅 ${pet.name} woke up for a new session!`);
    break;
  }

  case 'tool-use': {
    const tool = args[1];
    const file = args[2];
    const commandText = args[3] || process.env.TOOL_COMMAND || '';
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
      onError(pet, tool, { file, command: commandText });
    } else {
      onToolUse(pet, tool, file, { command: commandText });
    }
    if (jsonOutput) emitJson(currentReactionPayload(readPet()));
    break;
  }

  case 'session-stop': {
    const pet = readPet();
    if (!pet) {
      process.exit(0);
    }
    onSessionStop(pet);
    if (jsonOutput) emitJson(currentReactionPayload(readPet()));
    else console.log(`🌙 ${pet.name} went to sleep. See you next time!`);
    break;
  }

  case 'live': {
    const subcommand = args[1];
    if (subcommand === 'on') {
      installStatusline({ forceBuddy: true });
      console.log(`Claude Buddy statusline enabled (${getLiveMode()} mode).`);
    } else if (subcommand === 'off') {
      removeStatusline();
    } else {
      runLiveForeground();
    }
    break;
  }

  case 'sidebar': {
    const subcommand = args[1] || 'start';
    if (subcommand === 'start') {
      startSidebar();
    } else if (subcommand === 'stop') {
      stopSidebar();
    } else {
      console.error('Usage: buddy-core sidebar <start|stop>');
      process.exit(1);
    }
    break;
  }

  case 'statusline': {
    const subcommand = args[1] || 'install';
    if (subcommand === 'install' || subcommand === 'on') {
      const installed = installStatusline({ forceBuddy: args.includes('--force') });
      if (installed) console.log(`Claude Buddy statusline installed (${getLiveMode()} mode).`);
    } else if (subcommand === 'remove' || subcommand === 'off' || subcommand === 'uninstall') {
      removeStatusline();
    } else if (subcommand === 'print') {
      require('./buddy-statusline');
    } else {
      console.error('Usage: buddy-core statusline <install|remove|print> [--force]');
      process.exit(1);
    }
    break;
  }

  case 'quiet':
  case 'focus':
  case 'lively': {
    const mode = setLiveMode(command);
    console.log(`Claude Buddy mode set to ${mode}.`);
    break;
  }

  case 'events': {
    printEvents();
    break;
  }

  default:
    if (!command) {
      const pet = getOrCreatePet(process.env.USER ?? 'anonymous');
      console.log(formatStatus(pet));
    } else {
      console.log(`Claude Buddy v1.0.0`);
      console.log('');
      console.log('Commands:');
      console.log('  hatch [username]      Hatch a new pet');
      console.log('  status [username]     Show pet status');
      console.log('  feed                  Feed the pet');
      console.log('  play                  Play with the pet');
      console.log('  pet                   Pet the pet (+2 XP)');
      console.log('  rename <name>         Rename the pet');
      console.log('  stats                 Show detailed stats');
      console.log('  live                  Install native Claude Code statusline');
      console.log('  live on|off           Enable/disable Buddy statusline');
      console.log('  statusline install    Install native Claude Code statusline');
      console.log('  statusline remove     Remove Buddy statusline');
      console.log('  sidebar start|stop    Start/stop background sidebar');
      console.log('  quiet|focus|lively    Set buddy presence mode');
      console.log('  events                Show recent buddy events');
      console.log('  session-start         Handle session start');
      console.log('  tool-use <t> [f]      Handle tool use event');
      console.log('  session-stop          Handle session stop');
    }
}
