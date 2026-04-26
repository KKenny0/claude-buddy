---
description: Manage Claude Buddy pet status, statusline, sidebar, and presence mode
argument-hint: "[status|hatch|feed|play|pet|stats|rename NAME|live|statusline install|statusline remove|sidebar start|sidebar stop|quiet|focus|lively|events]"
allowed-tools: ["Bash(node:*)"]
---

# /claude-buddy:buddy — 你的编程伙伴 🐾

管理你的虚拟宠物伙伴，让它陪伴你编码！

## 执行

```!
node "${CLAUDE_PLUGIN_ROOT}/src/bin/buddy-core.js" $ARGUMENTS
```

## 使用方法

### `claude-buddy:buddy hatch` — 孵化一只新宠物
基于你的用户名生成一只独一无二的宠物。

### `claude-buddy:buddy` / `claude-buddy:buddy status` — 查看宠物状态
显示宠物的当前状态：等级、经验值、属性、心情等。

### `claude-buddy:buddy feed` — 喂食
降低宠物的饥饿度。

### `claude-buddy:buddy play` — 玩耍
提升宠物的能量和心情。

### `claude-buddy:buddy pet` — 抚摸
增加 2 XP，提升心情。每天最多 20 XP。

### `claude-buddy:buddy stats` — 查看详细属性
显示五维属性的详细信息。

### `claude-buddy:buddy rename <name>` — 重命名
给你的宠物取一个新名字。

### `claude-buddy:buddy sidebar start` — 启动实时侧栏
启动后台实时侧栏；如果在 tmux 中会优先打开右侧 pane。

### `claude-buddy:buddy live` — 启用原生 statusline
把 Buddy 装到 Claude Code 底部状态栏，常驻显示模式、心情、等级、streak 和测试状态。

### `claude-buddy:buddy statusline install|remove` — 管理 statusline
显式安装或移除 Buddy statusline。

### `claude-buddy:buddy quiet|focus|lively` — 调整存在感
`focus` 是默认模式；`quiet` 只在重要事件出现，`lively` 会更积极地回应。

### `claude-buddy:buddy events` — 查看最近动态
显示最近的工具、错误、恢复和互动事件。

## 实现方式

使用 Bash 工具执行以下命令：

```bash
node "${CLAUDE_PLUGIN_ROOT}/src/bin/buddy-core.js" <command>
```

例如：
```bash
node "${CLAUDE_PLUGIN_ROOT}/src/bin/buddy-core.js" hatch
node "${CLAUDE_PLUGIN_ROOT}/src/bin/buddy-core.js" status
node "${CLAUDE_PLUGIN_ROOT}/src/bin/buddy-core.js" feed
```

启动侧栏：
```bash
node "${CLAUDE_PLUGIN_ROOT}/src/bin/buddy-core.js" live
node "${CLAUDE_PLUGIN_ROOT}/src/bin/buddy-core.js" statusline install
node "${CLAUDE_PLUGIN_ROOT}/src/bin/buddy-core.js" sidebar start
```

## 宠物系统

你的宠物有 5 维属性：
- **Debug** — 代码提示质量
- **Patience** — 鼓励频率
- **Chaos** — 混乱语录概率
- **Wisdom** — 深度洞察质量
- **Snark** — 毒舌程度

宠物会根据你的编码活动产生反应，并通过经验值升级（最高 20 级）。
