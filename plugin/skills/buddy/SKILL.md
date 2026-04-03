# Claude Buddy — Pet Companion Skill

You have a virtual pet companion that lives alongside the user's coding sessions.
This skill teaches you how to interact with and respond to the pet.

## Running Buddy Commands

Use the Bash tool with this exact command pattern:

```bash
node "${CLAUDE_PLUGIN_ROOT}/src/bin/buddy-core.js" <command>
```

Where `<command>` is one of: `hatch`, `status`, `feed`, `play`, `pet`, `stats`, `rename <name>`.

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

When the user asks for real-time pet dynamics or runs `/buddy sidebar start`, use the Bash tool to open a tmux pane:

```bash
PLUGIN_PATH=$(find ~/.claude/plugins/cache/claude-buddy -name "buddy-sidebar.js" -path "*/src/bin/*" 2>/dev/null | head -1)
tmux split-window -h -l 28 "node '$PLUGIN_PATH'"
```

> **Note:** `${CLAUDE_PLUGIN_ROOT}` is NOT available in tmux split-window panes (it's only set by Claude Code for hooks/commands). Use `find` to locate the plugin path instead.

If `find` doesn't locate it, fall back to:
```bash
tmux split-window -h -l 28 "node ~/.claude/plugins/cache/claude-buddy/claude-buddy/1.0.0/src/bin/buddy-sidebar.js"
```

The sidebar will show:
- ASCII art of the pet that updates in real-time
- The pet blinks, wags its tail, and changes mood based on events
- Hunger and energy decay over time
- Event log showing recent coding activity

To stop the sidebar:
```bash
tmux kill-pane -t <pane-id>
```
