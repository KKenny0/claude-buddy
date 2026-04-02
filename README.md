# Claude Buddy 🐾

A virtual pet companion for Claude Code coding sessions.

## Features

- 🥚 **Deterministic Pet Generation** — SHA-256 based species, rarity, and stats
- 🎲 **12 Species** across 5 rarity tiers with shiny variants
- 📊 **5-Dimension Stats** — Debug, Patience, Chaos, Wisdom, Snark
- 📈 **XP & Leveling** — 20 levels with multiple XP sources
- 🎭 **Dynamic Reactions** — Pet reacts to your coding activities
- 🖥️ **tmux Sidebar** — Real-time ASCII art with animations
- 💾 **Persistent State** — Global `~/.claude-buddy/` storage

## Installation

1. Clone this repo or install via npm:
   ```bash
   git clone https://github.com/KKenny0/claude-buddy.git
   cd claude-buddy
   npm install
   npm run build
   ```

2. Or install globally:
   ```bash
   npm install -g .
   ```

## Quick Start

```bash
# Hatch your first pet!
buddy-core hatch

# Check status
buddy-core status

# Start the tmux sidebar (optional)
buddy-sidebar --width 28 --height 24
```

## Commands

| Command | Description |
|---------|-------------|
| `buddy-core hatch` | Hatch a new pet |
| `buddy-core status` | Show pet status |
| `buddy-core feed` | Feed the pet |
| `buddy-core play` | Play with pet |
| `buddy-core pet` | Pet the pet (+2 XP) |
| `buddy-core stats` | Show detailed stats |
| `buddy-core rename <name>` | Rename pet |
| `buddy-sidebar` | Start tmux sidebar |

## Species

| Species | Rarity | Emoji |
|---------|--------|-------|
| Cat | Common+ | 🐱 |
| Duck | Common+ | 🦆 |
| Ghost | Common+ | 👻 |
| Robot | Common+ | 🤖 |
| Slime | Common+ | 🟢 |
| Dragon | Uncommon+ | 🐉 |
| Owl | Uncommon+ | 🦉 |
| Penguin | Uncommon+ | 🐧 |
| Fox | Rare+ | 🦊 |
| Axolotl | Rare+ | 🦎 |
| Phoenix | Epic+ | 🔥 |
| Capybara | Legendary | 🫎 |

## XP Sources

| Source | Amount |
|--------|--------|
| Session start (daily) | +10 |
| Petting (20/day) | +2 |
| Stats check (5/day) | +1 |
| Git commit | +5 |
| Every 10 tool uses | +1 |
| Streak bonus | +5 × streak |
| Error recovery | +3 |

## tmux Sidebar

```bash
# Split tmux window
tmux split-window -h -l 28 "buddy-sidebar"

# Or with custom size
buddy-sidebar --width 32 --height 30
```

The sidebar features:
- Real-time ASCII art pet rendering
- Blink and tail-wag animations
- Event-driven reactions
- Mood/hunger/energy decay
- Rarity-colored UI

## Data Location

All data stored in `~/.claude-buddy/`:
- `pet.json` — Current pet state
- `events.log` — Event stream
- `config.json` — User preferences
- `history.json` — Level milestones

## License

MIT
