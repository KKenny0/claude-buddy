# Claude Buddy 🐾

> A silent coding companion for Claude Code — watches your rhythm, coaches your pace, grows with you.

Your buddy tracks your coding patterns via Claude Code hooks and surfaces insights on the statusline. It stays out of your conversation — no context pollution, no injected reactions. All feedback lives on the statusline, sidebar, or on-demand detail card.

**Statusline (always visible in Claude Code):**
```
my-project  main  ctx 23%  |  🐉 火火 · focused · focus  |  Lv.7 30%  |  tests idle  |  ↻ core.js
```

**On-demand detail card (`/buddy`):**
```
╭──────────────────────────────────────────────────────────────────╮
│ Claude Buddy                                                     │
├──────────────────────────────────────────────────────────────────┤
│ 🐉 火火  Lv.7 rare  focus                                        │
│ XP ████░░░░░░░░░░░░ 25%   🤔 focused   streak 1d                 │
│ Energy ████████████ 80/100   Hunger ████░░░░░░ 40/100            │
│                                                                   │
│        /^\       "🐉 火火 跟着你的改动移动视线。"                   │
│     <  •_•  >→                                                    │
│    (   ~   )                                                      │
│     `-zzzz-´                                                      │
│                                                                   │
│ Debug 33   Patience 28   Chaos 46   Wisdom 60   Snark 38        │
╰──────────────────────────────────────────────────────────────────╯
```

## Features

- 🥚 **Deterministic Generation** — SHA-256 based species, rarity, and stats. Same username = same pet.
- 🐉 **12 Species** across 5 rarity tiers (Common → Legendary) with 1% shiny chance
- 📊 **5-Dimension Stats** — Debug, Patience, Chaos, Wisdom, Snark
- 📈 **XP & Leveling** — 20 levels with level-gated feature unlocks
- 🔇 **Silent by Design** — Hooks produce zero stdout. No additionalContext, no conversation injection.
- 🏃 **Rhythm Coach** — Error avalanche alerts, file grinding detection, session fatigue warnings
- 📟 **Native Statusline** — Always-visible workspace context, mood, mode, level, and coach signals
- 🧾 **Terminal Detail Card** — `/buddy` shows pet status, art, stats, and recent activity
- 🖥️ **Optional tmux Panel/Sidebar** — Temporary popup or live watcher for terminal users
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

After installation, commands are prefixed with the plugin name:

| Command | Description |
|---------|-------------|
| `/claude-buddy:buddy hatch` | Hatch your first pet (based on your username) |
| `/claude-buddy:buddy` | Show pet detail card (level, XP, mood, stats, recent activity) |
| `/claude-buddy:buddy feed` | Feed your pet (restores hunger) |
| `/claude-buddy:buddy play` | Play with your pet (boosts energy + mood) |
| `/claude-buddy:buddy pet` | Pet your buddy (+2 XP, daily cap 20) |
| `/claude-buddy:buddy stats` | Show detailed 5-dimension stats |
| `/claude-buddy:buddy rename <name>` | Give your pet a name |
| `/claude-buddy:buddy live` | Install the native Claude Code Buddy statusline |
| `/claude-buddy:buddy statusline remove` | Remove Buddy from the statusline |
| `/claude-buddy:buddy panel` | Open temporary tmux popup, or print detail card outside tmux |
| `/claude-buddy:buddy sidebar start` | Start optional detached/tmux sidebar |
| `/claude-buddy:buddy quiet` | Minimal Buddy statusline presence |
| `/claude-buddy:buddy focus` | Balanced presence (default) |
| `/claude-buddy:buddy lively` | More active statusline updates |
| `/claude-buddy:buddy events` | Show recent Buddy activity |
| `/claude-buddy:buddy summary` | Show session summary (unlocks at Lv.10) |
| `/claude-buddy:buddy unlocks` | Show level unlock progress |
| `/claude-buddy:buddy evolve` | Trigger evolution (Lv.15+, auto on level up) |
| `/claude-buddy:buddy prestige` | Reset with permanent bonuses (Lv.20+) |

### Hooks (automatic, silent)

No setup needed. Once installed, hooks fire automatically:

- **Session start** — Pet wakes up, state updated
- **After each tool use** — Pet state updated, coach signals computed
- **Session end** — Pet goes to sleep

All hooks produce **zero stdout** — no text is injected into your conversation with Claude.

### Level-Gated Unlocks

Your buddy grows with you. Higher levels unlock more statusline features:

| Level | Unlocks |
|-------|---------|
| 1-2 | Basic status (name, mood, XP progress) |
| 3 | Test status indicator (green/red) |
| 5 | File grinding detection |
| 7 | Session duration / fatigue warning |
| 10 | `/buddy summary` — session stats |
| 13 | Error pattern recognition |
| 15 | **Evolution** — species transforms based on highest stat |
| 20 | **Prestige** — reset to Lv.1 with permanent bonuses |

### Evolution System (Lv.15)

When your buddy reaches Lv.15, it evolves based on its highest stat. Each stat maps to an evolution path:

| Highest Stat | Path | Label | Art Effect |
|-------------|------|-------|------------|
| Debug | Valor | 勇 | ⚔ Sword indicators |
| Patience | Zen | 禅 | ≋ Serene aura |
| Chaos | Storm | 雷 | ⚡ Electric sparks |
| Wisdom | Sage | 智 | ✧ Wisdom glow |
| Snark | Rogue | 影 | ◇ Shadow wisps |

Evolution changes your species name (e.g., Dragon → 智龙), applies visual art modifiers, and grants +10 to all stats. Evolution is automatic on reaching Lv.15 — triggered via `addXp()`.

### Prestige System (Lv.20)

At Lv.20 (max level), you can prestige:

```
/claude-buddy:buddy prestige
```

Prestige resets your level to 1 while keeping:
- Your evolved form (if you evolved at Lv.15)
- Your species and rarity
- Your stats (plus +5 permanent bonus per prestige cycle)

Your level display changes to `Lv.X+N` where N is your prestige count. The statusline shows ✦ for each prestige cycle. There is no cap on prestige cycles — you can keep going.

### Rhythm Coach Signals

These appear on the statusline based on your coding patterns:

| Signal | Meaning |
|--------|---------|
| `🔴 ×3` | 3+ consecutive errors — consider stepping back |
| `↻ filename` | Same file edited 5+ times — you're deep in a grind |
| `⏱ 2h+` | Session running long — take a break |
| `🟢 tests` / `🔴 tests` | Last test run status |

### Presence Surfaces

**Statusline (primary):**
```
/claude-buddy:buddy live
```
Compact always-visible line: workspace context, mood, level, XP%, coach signals.

**On-demand detail card:**
```
/claude-buddy:buddy status
```

**Optional tmux sidebar:**
```
/claude-buddy:buddy sidebar start
/claude-buddy:buddy sidebar stop
```

**Manual tmux sidebar (from shell):**
```bash
PLUGIN_ROOT="$(find ~/.claude/plugins -path '*/claude-buddy/plugin' -type d | head -n 1)"
tmux split-window -h -l 28 "node \"$PLUGIN_ROOT/src/bin/buddy-sidebar.js\""
```

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
| `session.json` | Recent events, presence mode, error/recovery state |

## Architecture

```
┌─────────────────────────────────────┐
│           Claude Code               │
│                                     │
│  Hooks ──▶ pet/session state files  │
│  (silent)     + events.log          │
│                                     │
│  /buddy ──▶ buddy-core ──▶ card     │
│  statusLine ────────────▶ one line  │
│  panel/sidebar ─────────▶ live view │
│                                     │
│  ✗ no stdout from hooks             │
│  ✗ no additionalContext injection   │
└─────────────────────────────────────┘
```

## Troubleshooting

**Plugin won't install?**
```bash
rm -rf ~/.claude/plugins/cache/claude-buddy
/plugin marketplace remove claude-buddy
/plugin marketplace add KKenny0/claude-buddy
/plugin install claude-buddy@claude-buddy
```

**`/claude-buddy:buddy` says "Unknown skill"?**
Plugin not installed. Run the installation commands above.

**Buddy seems quiet?**
That's intentional. All feedback lives on the statusline and on-demand card. Hooks don't inject text into conversation. Run `/claude-buddy:buddy live` to enable the statusline.

## License

MIT
