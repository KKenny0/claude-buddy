# Claude Buddy 🐾

A virtual pet companion for Claude Code coding sessions.

## Features

- 🥚 **Deterministic Pet Generation** — SHA-256 based species, rarity, and stats
- 🎲 **12 Species** across 5 rarity tiers with shiny variants
- 📊 **5-Dimension Stats** — Debug, Patience, Chaos, Wisdom, Snark
- 📈 **XP & Leveling** — 20 levels with multiple XP sources
- 🎭 **Dynamic Reactions** — Pet reacts to your coding activities
- 📟 **Native Statusline** — Always-visible Buddy status in Claude Code
- 🖥️ **tmux Sidebar** — Real-time ASCII art with animations
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
/buddy status         # 查看状态
/buddy feed           # 喂食
/buddy pet            # 摸摸 (+2 XP)
```

在终端中（可选）：

```bash
# 启动 tmux 侧栏（需要先 build）
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
| `buddy-core live` | Install native Claude Code Buddy statusline |
| `buddy-core statusline remove` | Remove Buddy statusline |
| `buddy-core sidebar start` | Start detached/tmux sidebar |
| `buddy-core sidebar stop` | Stop detached sidebar |
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

## Statusline and Sidebar

```bash
# Native Claude Code statusline
buddy-core live
buddy-core statusline remove

# Detached/tmux sidebar
buddy-core sidebar start
buddy-core sidebar stop

# Direct renderer with custom size
buddy-sidebar --width 32 --height 30
```

The sidebar features:
- Real-time ASCII art pet rendering
- Blink and tail-wag animations
- Event-driven reactions
- Mood/hunger/energy decay
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
