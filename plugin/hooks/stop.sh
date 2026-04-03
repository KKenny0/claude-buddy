#!/bin/bash
# Claude Buddy — stop hook
# Fires when a Claude Code session ends. The pet goes to sleep.
# Uses additionalContext to show a goodbye message to Claude (and user).

set -euo pipefail

BUDDY_HOME="$HOME/.claude-buddy"
PLUGIN_DIR="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"

PET_JSON="$BUDDY_HOME/pet.json"
[ ! -f "$PET_JSON" ] && exit 0

# Find buddy-core
BUDDY_CORE=""
if command -v buddy-core &>/dev/null; then
  BUDDY_CORE="buddy-core"
elif [ -f "$PLUGIN_DIR/src/bin/buddy-core.js" ]; then
  BUDDY_CORE="node $PLUGIN_DIR/src/bin/buddy-core.js"
fi

if [ -n "$BUDDY_CORE" ]; then
  $BUDDY_CORE session-stop 2>/dev/null || true
fi

# Generate goodbye as additionalContext
NAME=$(node -e "const p=JSON.parse(require('fs').readFileSync('$PET_JSON','utf8'));console.log(p.name||'Buddy')" 2>/dev/null || echo "Buddy")
SPECIES=$(node -e "const p=JSON.parse(require('fs').readFileSync('$PET_JSON','utf8'));console.log(p.speciesEmoji||'🐱')" 2>/dev/null || echo "🐱")
MOOD=$(node -e "const p=JSON.parse(require('fs').readFileSync('$PET_JSON','utf8'));console.log(p.mood||'happy')" 2>/dev/null || echo "happy")
STREAK=$(node -e "const p=JSON.parse(require('fs').readFileSync('$PET_JSON','utf8'));console.log(p.streak||0)" 2>/dev/null || echo "0")

GOODBYE="${SPECIES} ${NAME} 打了个哈欠...今天辛苦了！明天见 🌙 连续编码: ${STREAK}天"

# Output as structured JSON for Claude Code
echo "{\"additionalContext\":\"$GOODBYE\"}"

# Reset reaction counter for next session
rm -f "$BUDDY_HOME/.react-counter" 2>/dev/null || true
