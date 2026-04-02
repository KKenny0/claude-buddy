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

### Step 1: Clone & Build

```bash
git clone https://github.com/KKenny0/claude-buddy.git
cd claude-buddy
npm install
npm run build
```

### Step 2: Install as Claude Code Plugin

**Option A: Local plugin (推荐，最简单)**

在任意项目目录下启动 Claude Code 时加载插件：

```bash
claude --plugin-dir ~/path/to/claude-buddy
```

> 💡 把 `~/path/to/claude-buddy` 替换成你实际的仓库路径。如果你 clone 到了 home 目录，那就是 `claude --plugin-dir ~/claude-buddy`。

**Option B: Global install via npm**

```bash
cd claude-buddy
npm install -g .
```

安装后在任意位置启动 `claude` 即可使用 `/buddy` 命令。

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
