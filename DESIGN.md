# Claude Buddy — Technical Design Document

## Overview

A Claude Code Plugin that adds a virtual pet companion to your coding sessions.
Works as a hybrid: **Plugin Hooks** for text reactions + **tmux sidebar** for real-time ASCII art.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Claude Code                     │
│                                                  │
│  ┌──────────┐    ┌──────────────┐               │
│  │  Hooks    │───▶│  State File  │               │
│  │ (events)  │    │ ~/.claude-   │               │
│  └──────────┘    │  buddy/      │               │
│                  │   pet.json   │               │
│  ┌──────────┐    │   events.log │               │
│  │  Skills   │◀──│   config.json│               │
│  │ (/buddy)  │    └──────┬───────┘               │
│  └──────────┘           │  file watch             │
│                         ▼                        │
│  ┌──────────────────────────────┐                │
│  │   tmux sidebar (optional)     │                │
│  │   ASCII art + animations      │                │
│  └──────────────────────────────┘                │
└─────────────────────────────────────────────────┘
```

### Three Layers

1. **Core** — Species generation, stats, leveling, state persistence
2. **Hook Layer** — Event detection, state updates, text reactions
3. **Render Layer** — tmux sidebar with ASCII art (optional fallback: text output)

---

## Plugin Structure

```
claude-buddy/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   └── buddy.md              # /buddy slash command
├── skills/
│   └── buddy/
│       └── SKILL.md          # Pet knowledge for Claude
├── hooks/
│   ├── hooks.json            # Hook registrations
│   ├── session-start.sh      # Pet wakes up
│   ├── post-tool-use.sh      # React to Claude's actions
│   ├── stop.sh               # Pet says goodbye
│   └── pre-commit.sh         # (optional) git hook
├── bin/
│   ├── buddy-core.ts         # State management, species generation
│   ├── buddy-react.ts        # Event → reaction logic
│   └── buddy-render.ts       # tmux sidebar renderer
├── data/
│   └── species.json          # Species definitions, ASCII art, rarity
├── package.json
├── tsconfig.json
└── README.md
```

---

## Species System

### Generation

Based on SHA-256 hash of username → deterministic species + rarity.

```typescript
function generatePet(username: string): Pet {
  const hash = sha256(username)
  const rarityRoll = hash[0] % 100
  
  const rarity = rarityRoll < 60 ? 'common'
    : rarityRoll < 85 ? 'uncommon'
    : rarityRoll < 95 ? 'rare'
    : rarityRoll < 99 ? 'epic'
    : 'legendary'
    
  const speciesPool = SPECIES_BY_RARITY[rarity]
  const speciesIndex = parseInt(hash.slice(1, 3), 16) % speciesPool.length
  const species = speciesPool[speciesIndex]
  
  // 1% shiny chance
  const shiny = parseInt(hash.slice(3, 5), 16) % 100 === 0
  
  return generateStats(species, rarity, shiny)
}
```

### Initial Species (12)

| Species | Common | ASCII Art |
|---------|--------|-----------|
| Cat 🐱 | ✅ | `/\_/\ (·ω·) (")_(")` |
| Duck 🦆 | ✅ | `__(·>__(._> `--´` |
| Ghost 👻 | ✅ | `.[||]. [ · · ] [ ==== ]` |
| Robot 🤖 | ✅ | `[||] {(·)} [====]` |
| Dragon 🐉 | Uncommon+ | `/^\ < · · > ( ~~ ) `-vvvv-´` |
| Owl 🦉 | Uncommon+ | `/\ /\ ((·)(·)) ( >< )` |
| Fox 🦊 | Rare+ | `/|  |\ | >·< | | \  / |` |
| Axolotl 🦎 | Rare+ | `}~(____)~{ }~(·..·)~{ (._.)` |
| Phoenix 🔥 | Epic+ | `.,,., ( @ ) /\ |\/|` |
| Capybara 🫎 | Legendary | `n______n ( · · ) ( oo ) `----´` |

### Rarity Effects

| Rarity | Chance | Stat Floor | Hat | Special |
|--------|--------|------------|-----|---------|
| Common | 60% | 5 | ❌ | — |
| Uncommon | 25% | 15 | ✅ | Unique color |
| Rare | 10% | 25 | ✅ | Personality trait |
| Epic | 4% | 35 | ✅ | Special ability |
| Legendary | 1% | 50 | ✅ | Unique evolution |

---

## Stats System

### 5 Dimensions (1-100)

| Stat | What it controls |
|------|-----------------|
| **Debug** | Quality of coding tips |
| **Patience** | Encouragement frequency |
| **Chaos** | Chaotic quip probability |
| **Wisdom** | Deep insight quality |
| **Snark** | Sarcasm level |

### Generation

Each pet has a **peak stat** and **dump stat**. Others are randomly distributed.

```typescript
interface Pet {
  species: string
  rarity: Rarity
  shiny: boolean
  hat?: string
  name: string
  level: number
  xp: number
  xpToNext: number
  stats: {
    debug: number
    patience: number
    chaos: number
    wisdom: number
    snark: number
  }
  mood: Mood           // happy, sleepy, hungry, excited, focused
  hunger: number       // 0-100 (0 = full)
  energy: number       // 0-100 (100 = full)
  streak: number       // consecutive coding days
  createdAt: string
  lastActive: string
}
```

---

## Event System

### Hook Events → Pet Reactions

| Claude Code Event | Pet Reaction |
|-------------------|-------------|
| `SessionStart` | Wakes up, greets user |
| `PostToolUse:Write` | Curious ("你在写什么？") |
| `PostToolUse:Edit` | Focused ("改了哪里？让我看看") |
| `PostToolUse:Bash` | Tense ("希望没炸...") |
| `PostToolUse:Read` | Relaxed ("嗯，读代码的时候很安静") |
| `Stop` (session end) | Goodbye + mood summary |
| Error in tool output | Worried ("出错了？没事，慢慢来") |
| Long idle (>10 min no events) | Falls asleep, Zzz... |
| Git commit detected | Excited, gains XP |
| 5+ consecutive errors | Encouraging speech |

### Reaction Output (tmux sidebar)

```typescript
interface Reaction {
  text: string           // What the pet says
  mood: Mood             // New mood
  animation?: string     // ASCII animation frame
  xpGain?: number        // Optional XP
  hungerDelta?: number   // Gets hungrier over time
}
```

---

## XP & Leveling

### XP Sources

| Source | Amount | Cap |
|--------|--------|-----|
| Session start (daily) | +10 | 1x/day |
| /buddy pet | +2 | 20/day |
| /buddy stats | +1 | 5/day |
| Git commit | +5 | uncapped |
| Every 10 tool uses | +1 | uncapped |
| Streak bonus | +5 × streak | resets on miss |
| Error recovery | +3 | uncapped |

### Level Progression

```
Level 1:  0 XP     (hatch)
Level 5:  100 XP   (learns to speak more)
Level 10: 300 XP   (gets a personality)
Level 15: 600 XP   (evolves appearance)
Level 20: 1000 XP  (max, legendary status)
```

---

## tmux Sidebar

### Layout

```
┌─────────────────────────────┬──────────────────┐
│                             │   ╭──────────╮   │
│   $ claude                   │   │ 🐉  Lv.5  │   │
│   > 帮我重构这个函数          │   │ ████░░ 65% │   │
│                             │   │ Debug: 42  │   │
│   Claude: 分析中...          │   │ Chaos: 78  │   │
│                             │   ╰──────────╯   │
│                             │                  │
│                             │   🐉 好奇地歪了   │
│                             │   歪头看你写代码   │
│                             │                  │
│                             │   Mood: 🤔 Focus  │
│                             │   Streak: 3 days  │
└─────────────────────────────┴──────────────────┘
```

### Implementation

```bash
# Start buddy sidebar
buddy-sidebar start --width 24 --height 20

# Or via tmux:
tmux split-window -h -l 24 "buddy-sidebar"
```

The sidebar process:
1. Reads `~/.claude-buddy/pet.json` for current state
2. Watches `~/.claude-buddy/events.log` for new events (tail -f)
3. Renders ASCII art + status + latest reaction
4. Updates every 2 seconds (mood decay, hunger increase)

### File Watcher Protocol

Events are written as JSON lines to `~/.claude-buddy/events.log`:

```json
{"type":"tool_use","tool":"Write","file":"src/index.ts","timestamp":"2026-04-02T14:30:00Z"}
{"type":"error","tool":"Bash","exitCode":1,"timestamp":"2026-04-02T14:30:05Z"}
{"type":"idle","duration":600,"timestamp":"2026-04-02T14:40:00Z"}
{"type":"interaction","command":"pet","timestamp":"2026-04-02T14:45:00Z"}
```

---

## State Persistence

### File Layout

```
~/.claude-buddy/
├── pet.json           # Current pet state (read/write by all components)
├── events.log         # Append-only event stream
├── config.json        # User preferences (sidebar enabled, etc.)
├── session.json       # Recent events, presence mode, error/recovery state
├── history.json       # Level milestones, streak history
└── achievements.json  # Unlocked achievements
```

### Concurrent Access

All writes go through a simple lock file mechanism:
- Hooks append to `events.log` (atomic, no lock needed)
- `pet.json` is updated by the sidebar process only
- Hooks never write `pet.json` directly

---

## Commands

| Command | Description |
|---------|-------------|
| `/buddy` | Show pet status |
| `/buddy hatch` | Hatch a new pet |
| `/buddy feed` | Feed the pet (restore hunger) |
| `/buddy play` | Play with pet (boost mood) |
| `/buddy stats` | Show detailed stats |
| `/buddy rename <name>` | Rename pet |
| `/buddy evolve` | Check evolution progress |
| `/buddy live` | Install native Claude Code statusline |
| `/buddy statusline remove` | Remove Buddy statusline |
| `/buddy sidebar start` | Start detached/tmux sidebar |
| `/buddy sidebar stop` | Stop detached/tmux sidebar |
| `/buddy quiet` | Minimal Buddy conversation presence |
| `/buddy focus` | Balanced presence (default) |
| `/buddy lively` | More active Buddy reactions |
| `/buddy events` | Show recent Buddy events |

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Plugin manifest | Claude Code `.claude-plugin/plugin.json` |
| Hooks | Bash scripts (POSIX compatible) |
| Core logic | TypeScript (Node.js) |
| tmux sidebar | TypeScript + blessed/ink (terminal UI) |
| State storage | JSON files |
| Hash | Node.js crypto (SHA-256) |

---

## Development Phases

### Phase 1: MVP (Day 1)
- Plugin structure + manifest
- Species generation (6 species, 3 rarities)
- Basic stats system
- `/buddy` command (text output only)
- `session-start` and `post-tool-use` hooks
- State persistence

### Phase 2: tmux Sidebar (Day 2)
- ASCII art renderer
- File watcher for events
- Real-time animation
- Mood/hunger decay over time

### Phase 3: Polish (Day 3)
- Full species roster (12+)
- XP/leveling system
- Achievements
- Streak tracking
- Shiny variants

### Phase 4: Distribution
- GitHub repo + README
- Plugin marketplace setup
- npm publish (optional)

---

## Open Questions

1. **Pet naming**: Auto-generate or user chooses? → Both: suggest a name, user can override
2. **Death mechanic**: Can the pet "die" from neglect? → No, just gets sad/sleepy. No permadeath.
3. **Multi-project**: Same pet across all projects? → Yes, global `~/.claude-buddy/`
4. **Sharing**: Can users share their pet? → Export/import pet.json as a future feature
