# /buddy — 你的编程伙伴 🐾

管理你的虚拟宠物伙伴，让它陪伴你编码！

## 使用方法

### `buddy hatch` — 孵化一只新宠物
基于你的用户名生成一只独一无二的宠物。物种、稀有度和属性都是确定的（基于哈希）。

### `buddy` / `buddy status` — 查看宠物状态
显示宠物的当前状态：等级、经验值、属性、心情等。

### `buddy feed` — 喂食
降低宠物的饥饿度。饥饿的宠物会变得不开心。

### `buddy play` — 玩耍
提升宠物的能量和心情。

### `buddy pet` — 抚摸
增加 2 XP，提升心情。每天最多 20 XP。

### `buddy stats` — 查看详细属性
显示五维属性的详细信息。

### `buddy rename <name>` — 重命名
给你的宠物取一个新名字。

### `buddy sidebar start` — 启动侧栏
在 tmux 中启动实时侧栏渲染器，显示 ASCII art 宠物动画。

### `buddy sidebar stop` — 停止侧栏

## 宠物系统

你的宠物有 5 维属性：
- **Debug** — 代码提示质量
- **Patience** — 鼓励频率
- **Chaos** — 混乱语录概率
- **Wisdom** — 深度洞察质量
- **Snark** — 毒舌程度

宠物会根据你的编码活动产生反应，并通过经验值升级（最高 20 级）。

## 运行命令

`buddy-core` 可能没有全局安装。通过 Bash 工具运行时，按优先级尝试：

1. 全局命令：`buddy-core status`
2. 直接运行 JS：`node <plugin-dir>/src/bin/buddy-core.js status`
3. npx：`npx buddy-core status`

```bash
# 查看所有命令
buddy-core

# 示例：孵化新宠物
buddy-core hatch

# 启动侧栏
buddy-sidebar --width 28 --height 24
```
