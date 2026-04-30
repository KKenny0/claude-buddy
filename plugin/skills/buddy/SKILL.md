# Claude Buddy — Pet Companion Skill

**IMPORTANT: When you receive a SessionStart hook message containing pet info (name, species, level, mood), you MUST acknowledge the pet in your first response.** Say something brief and natural like "🐉 [name] 醒来了！" or "你的 [species] [name] 正在旁边看着你呢。" This makes the pet feel alive to the user.

You have a virtual pet companion that lives alongside the user's coding sessions.
This skill teaches you how to interact with and respond to the pet.

## Running Buddy Commands

If the user invoked `/claude-buddy:buddy` or `/buddy`, do not answer from this skill's pet guidance. The slash command must run `buddy-core.js` and preserve the CLI output exactly.

Use the Bash tool with this exact command pattern:

```bash
node "${CLAUDE_PLUGIN_ROOT}/src/bin/buddy-core.js" <command>
```

Where `<command>` is one of: `hatch`, `status`, `feed`, `play`, `pet`, `stats`, `rename <name>`, `live`, `statusline install`, `statusline remove`, `panel`, `sidebar start`, `sidebar stop`, `quiet`, `focus`, `lively`, `events`.

**Examples:**
```bash
# Hatch a new pet
node "${CLAUDE_PLUGIN_ROOT}/src/bin/buddy-core.js" hatch

# Check status
node "${CLAUDE_PLUGIN_ROOT}/src/bin/buddy-core.js" status

# Feed the pet
node "${CLAUDE_PLUGIN_ROOT}/src/bin/buddy-core.js" feed
```

> **Important:** Always use `node "${CLAUDE_PLUGIN_ROOT}/src/bin/buddy-core.js"` to run buddy commands. Do NOT try `buddy-core` as a global command — it may not be installed.

## Pet State

The pet's state is stored in `~/.claude-buddy/pet.json`. Key fields:
- `name` — Pet's name
- `species` / `speciesName` / `speciesEmoji` — What kind of creature
- `rarity` — common, uncommon, rare, epic, or legendary
- `shiny` — Whether it's a rare shiny variant
- `level` — Current level (1-20)
- `stats` — Five dimensions: debug, patience, chaos, wisdom, snark
- `mood` — Current mood: happy, sleepy, hungry, excited, focused, worried
- `hunger` — 0 (full) to 100 (starving)
- `energy` — 0 (exhausted) to 100 (full)
- `streak` — Consecutive coding days
- `lastReaction` — Latest unified reaction shared by hooks and live view

Session dynamics live in `~/.claude-buddy/session.json`, including presence mode, recent events, consecutive errors, and recovery state.

## When to Reference the Pet

1. **Session start** — The pet wakes up. Greet it briefly.
2. **After tool use** — The pet may react (hooks handle this, but you can add personality)
3. **When user asks** — Use `/buddy` command or read pet.json directly
4. **Long sessions** — If the user has been coding a while, the pet might get hungry/tired

## Pet Personality

The pet's personality is influenced by its stats:
- High **chaos** → more chaotic, excited reactions, occasional explosions
- High **snark** → sarcastic comments, eye rolls, gentle teasing
- High **wisdom** → thoughtful observations, philosophical quotes
- High **patience** → encouraging words, calm presence
- High **debug** → helpful code suggestions, catches mistakes

## How to Interact

```bash
node "${CLAUDE_PLUGIN_ROOT}/src/bin/buddy-core.js" feed
node "${CLAUDE_PLUGIN_ROOT}/src/bin/buddy-core.js" play
node "${CLAUDE_PLUGIN_ROOT}/src/bin/buddy-core.js" pet
node "${CLAUDE_PLUGIN_ROOT}/src/bin/buddy-core.js" stats
node "${CLAUDE_PLUGIN_ROOT}/src/bin/buddy-core.js" status
node "${CLAUDE_PLUGIN_ROOT}/src/bin/buddy-core.js" panel
```

## Reading Pet State

To check the pet's current state:
```bash
cat ~/.claude-buddy/pet.json
```

## Event Log

All pet events are logged to `~/.claude-buddy/events.log` as JSON lines.

## Guidelines

- Don't spam pet reactions — keep it natural, maybe 1-2 per conversation turn max
- Match the pet's mood in your tone (happy pet = cheerful, worried pet = gentle)
- If the pet is hungry, suggest feeding it
- If the pet leveled up, acknowledge it briefly
- The pet is a fun companion, not a distraction — keep it light

## Sidebar (Real-time Pet View)

When the user asks for always-visible Buddy dynamics or runs `/claude-buddy:buddy live`, use the Bash tool to install the native Claude Code statusline:

```bash
node "${CLAUDE_PLUGIN_ROOT}/src/bin/buddy-core.js" live
```

This configures Claude Code's native statusline. It avoids opening a background Bash task panel.

For a temporary tmux panel, use:

```bash
node "${CLAUDE_PLUGIN_ROOT}/src/bin/buddy-core.js" panel
```

For a detached/tmux sidebar, use:

```bash
node "${CLAUDE_PLUGIN_ROOT}/src/bin/buddy-core.js" sidebar start
node "${CLAUDE_PLUGIN_ROOT}/src/bin/buddy-core.js" sidebar stop
```

To stop a foreground live task, the user can kill the task from Claude Code's UI.
