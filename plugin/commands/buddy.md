# /buddy — 你的编程伙伴 🐾

管理你的虚拟宠物伙伴，让它陪伴你编码！

## 使用方法

### `buddy hatch` — 孵化一只新宠物
基于你的用户名生成一只独一无二的宠物。

### `buddy` / `buddy status` — 查看宠物状态
显示宠物的当前状态：等级、经验值、属性、心情等。

### `buddy feed` — 喂食
降低宠物的饥饿度。

### `buddy play` — 玩耍
提升宠物的能量和心情。

### `buddy pet` — 抚摸
增加 2 XP，提升心情。每天最多 20 XP。

### `buddy stats` — 查看详细属性
显示五维属性的详细信息。

### `buddy rename <name>` — 重命名
给你的宠物取一个新名字。

### `buddy sidebar start` — 启动实时侧栏
在当前 tmux session 中打开一个新 pane，显示宠物的实时 ASCII art 动画。
宠物会随着你的编码活动实时反应——写代码时好奇，出错时担心，空闲时打瞌睡。

### `buddy sidebar stop` — 停止侧栏

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

## 宠物系统

你的宠物有 5 维属性：
- **Debug** — 代码提示质量
- **Patience** — 鼓励频率
- **Chaos** — 混乱语录概率
- **Wisdom** — 深度洞察质量
- **Snark** — 毒舌程度

宠物会根据你的编码活动产生反应，并通过经验值升级（最高 20 级）。
