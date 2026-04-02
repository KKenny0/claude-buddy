# Claude Buddy 🐾

> A virtual pet companion for Claude Code — Tamagotchi for developers.

Your coding buddy watches you code, reacts to your actions, and grows with you. Deterministically generated from your username, with 12 species, 5 rarity tiers, shiny variants, and real-time tmux sidebar animations.

## Features

- 🥚 **Deterministic Generation** — SHA-256 based species, rarity, and stats. Same username = same pet.
- 🐉 **12 Species** across 5 rarity tiers (Common → Legendary) with 1% shiny chance
- 📊 **5-Dimension Stats** — Debug, Patience, Chaos, Wisdom, Snark
- 📈 **XP & Leveling** — 20 levels with 7 XP sources (coding, commits, streaks...)
- 🎭 **Dynamic Reactions** — Pet reacts to your coding activities via hooks
- 🖥️ **tmux Sidebar** — Real-time ASCII art with blink, tail-wag, and shiny animations
- 💾 **Persistent State** — Global `~/.claude-buddy/` storage, survives sessions

## Installation

### One-line install (recommended)

In Claude Code, run:

```
/plugin marketplace add KKenny0/claude-buddy
/plugin install claude-buddy@claude-buddy
```

That's it. Restart Claude Code and the plugin is active globally.

### Manual setup

```bash
git clone https://github.com/KKenny0/claude-buddy.git
claude --plugin-dir ./claude-buddy/plugin
```

### npm global

```bash
git clone https://github.com/KKenny0/claude-buddy.git
cd claude-buddy/plugin
npm link
```

## Usage

### In Claude Code

After installation, these commands are available:

| Command | Description |
|---------|-------------|
| `/buddy hatch` | Hatch your first pet (based on your username) |
| `/buddy` | Show pet status (level, XP, mood, stats) |
| `/buddy feed` | Feed your pet (restores hunger) |
| `/buddy play` | Play with your pet (boosts energy + mood) |
| `/buddy pet` | Pet your buddy (+2 XP, daily cap 20) |
| `/buddy stats` | Show detailed 5-dimension stats |
| `/buddy rename <name>` | Give your pet a name |

### Hooks (automatic)

No setup needed. Once installed, the plugin hooks fire automatically:

- **Session start** — Pet wakes up and greets you
- **After each tool use** — Pet reacts (curious, focused, tense, relaxed...)
- **Session end** — Pet says goodbye

### tmux Sidebar — Real-time Pet 🖥️

The sidebar shows your pet as live ASCII art that reacts to your coding in real-time.

**Start from Claude Code:**
```
/buddy sidebar start
```

Claude will automatically open a tmux pane with the sidebar. No manual setup needed.

**Or start manually in tmux:**
```bash
tmux split-window -h -l 28 "node ${CLAUDE_PLUGIN_ROOT}/src/bin/buddy-sidebar.js"
```

The sidebar features:
- Species-specific ASCII art (4 mood states per species)
- Rarity-colored UI
- Blink and tail-wag animations
- Shiny sparkle effects ✨
- Mood/hunger/energy decay over time
- Real-time event reactions (coding, errors, idle...)

## Species

| Species | Min Rarity | Emoji |
|---------|-----------|-------|
| Cat | Common | 🐱 |
| Duck | Common | 🦆 |
| Ghost | Common | 👻 |
| Robot | Common | 🤖 |
| Slime | Common | 🟢 |
| Dragon | Uncommon | 🐉 |
| Owl | Uncommon | 🦉 |
| Penguin | Uncommon | 🐧 |
| Fox | Rare | 🦊 |
| Axolotl | Rare | 🦎 |
| Phoenix | Epic | 🔥 |
| Capybara | Legendary | 🫎 |

## Rarity System

| Rarity | Chance | Stat Floor | Hat | Special |
|--------|--------|------------|-----|---------|
| Common | 60% | 5 | ❌ | — |
| Uncommon | 25% | 15 | ✅ | Unique color |
| Rare | 10% | 25 | ✅ | Personality trait |
| Epic | 4% | 35 | ✅ | Special ability |
| Legendary | 1% | 50 | ✅ | Unique evolution |

Plus a **1% chance of being Shiny** ✨

## Stats

Each pet has 5 dimensions (1–100), with one peak stat and one dump stat:

- **Debug** — Quality of coding tips
- **Patience** — Encouragement frequency
- **Chaos** — Chaotic quip probability
- **Wisdom** — Deep insight quality
- **Snark** — Sarcasm level

## XP Sources

| Source | Amount | Cap |
|--------|--------|-----|
| Session start (daily) | +10 | 1x/day |
| Petting | +2 | 20/day |
| Stats check | +1 | 5/day |
| Git commit | +5 | uncapped |
| Every 10 tool uses | +1 | uncapped |
| Streak bonus | +5 × streak | resets on miss |
| Error recovery | +3 | uncapped |

## Data

All data stored in `~/.claude-buddy/`:

| File | Purpose |
|------|---------|
| `pet.json` | Current pet state |
| `events.log` | Event stream (append-only) |
| `config.json` | User preferences |
| `history.json` | Level milestones & streak history |

## How It Works

```
┌─────────────────────────────────────┐
│           Claude Code               │
│                                     │
│  Hooks ──▶ events.log ──▶ Sidebar  │
│  (auto)    (append)       (watch)   │
│                                     │
│  /buddy ──▶ buddy-core ──▶ pet.json │
│  (slash)   (cli tool)    (state)   │
└─────────────────────────────────────┘
```

- **Hooks** detect Claude Code events and append to `events.log`
- **buddy-core** manages pet state (hatch, feed, level up...)
- **buddy-sidebar** watches events.log and renders ASCII art in tmux

## Troubleshooting

**Plugin won't install?**
```bash
# Clear cache and retry
rm -rf ~/.claude/plugins/cache/claude-buddy
/plugin marketplace remove claude-buddy
/plugin marketplace add KKenny0/claude-buddy
/plugin install claude-buddy@claude-buddy
```

**`/buddy` says "Unknown skill"?**
Plugin not installed. Run the installation commands above.

**Sidebar not showing?**
Run `/buddy sidebar start` in Claude Code — it will open a tmux pane automatically.

## License

MIT
