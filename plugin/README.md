# Claude Buddy 🐾

A virtual pet companion for Claude Code coding sessions.

## Features

- 🥚 **Deterministic Pet Generation** — SHA-256 based species, rarity, and stats
- 🎲 **12 Species** across 5 rarity tiers with shiny variants
- 📊 **5-Dimension Stats** — Debug, Patience, Chaos, Wisdom, Snark
- 📈 **XP & Leveling** — 20 levels with multiple XP sources
- 🎭 **Dynamic Reactions** — Pet reacts to your coding activities
- 📟 **Native Statusline** — Always-visible Buddy status in Claude Code
- 🧾 **Terminal Detail Card** — `/buddy` shows a compact pet status card on demand
- 🖥️ **Optional tmux Panel/Sidebar** — Temporary popup or live watcher for terminal users
- 💾 **Persistent State** — Global `~/.claude-buddy/` storage

## Installation

### Step 1: Clone & Build

```bash
git clone https://github.com/KKenny0/claude-buddy.git
cd claude-buddy
npm install
npm run build
```

### Step 2: Install as Claude Code Plugin

**Option A: One-line install (推荐)**

在 Claude Code 中运行：

```
/plugin marketplace add KKenny0/claude-buddy
/plugin install claude-buddy@claude-buddy
```

两行搞定，全局生效，以后每次启动 Claude Code 自动加载。

**Option B: Local plugin (开发/调试)**

```bash
claude --plugin-dir ~/path/to/claude-buddy
```

**Option C: Global npm install**

```bash
cd claude-buddy
npm install -g .
```

### Step 3: Verify

启动 Claude Code 后输入：
```
/buddy hatch
```
看到宠物孵化信息就说明安装成功 🎉

## Quick Start

在 Claude Code 中：

```
/buddy hatch          # 孵化你的第一只宠物
/buddy status         # 查看详情卡
/buddy live           # 启用 Claude Code statusline
/buddy panel          # 临时 tmux popup（非 tmux 会显示详情卡）
/buddy feed           # 喂食
/buddy pet            # 摸摸 (+2 XP)
```

在终端中（可选）：

```bash
# 启动可选实时侧栏
buddy-core sidebar start
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
| `buddy-core live` | Install native Claude Code Buddy statusline |
| `buddy-core statusline remove` | Remove Buddy statusline |
| `buddy-core panel` | Open temporary tmux popup, or print status card outside tmux |
| `buddy-core sidebar start` | Start optional detached/tmux sidebar |
| `buddy-core sidebar stop` | Stop optional sidebar |
| `buddy-core quiet/focus/lively` | Set Buddy presence mode |
| `buddy-core events` | Show recent Buddy events |
| `buddy-sidebar` | Start renderer directly |

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

## Presence Surfaces

```bash
# Native Claude Code statusline
buddy-core live
buddy-core statusline remove

# On-demand detail card
buddy-core status

# Temporary tmux popup panel
buddy-core panel

# Optional detached/tmux sidebar
buddy-core sidebar start
buddy-core sidebar stop

# Direct renderer smoke test
buddy-sidebar --once --width 42 --height 24
```

The default experience is statusline-first. `/buddy status` prints the full pet card when you want detail. `buddy-core panel` opens a temporary tmux popup when available, and `sidebar start` remains available as a power-user live watcher.

The panel/sidebar features:
- Real-time ASCII art pet rendering
- Shared terminal renderer with the `/buddy` card
- Event-driven reactions
- Rarity-colored UI
- Recent event timeline
- Presence modes: quiet, focus, lively

## Data Location

All data stored in `~/.claude-buddy/`:
- `pet.json` — Current pet state
- `events.log` — Event stream
- `config.json` — User preferences
- `history.json` — Level milestones
- `session.json` — Recent events and current session dynamics

## License

MIT
