#!/bin/bash
# Claude Buddy — stop hook
# Fires when a Claude Code session ends. The pet goes to sleep.

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

# Output goodbye
NAME=$(node -e "const p=JSON.parse(require('fs').readFileSync('$PET_JSON','utf8'));console.log(p.name||'Buddy')" 2>/dev/null || echo "Buddy")
SPECIES=$(node -e "const p=JSON.parse(require('fs').readFileSync('$PET_JSON','utf8'));console.log(p.speciesEmoji||'🐱')" 2>/dev/null || echo "🐱")
MOOD=$(node -e "const p=JSON.parse(require('fs').readFileSync('$PET_JSON','utf8'));console.log(p.mood||'happy')" 2>/dev/null || echo "happy")

echo ""
echo "${SPECIES} **${NAME}** 打了个哈欠...今天辛苦了！明天见 🌙"
echo "当前心情: ${MOOD}"
echo ""

# Reset reaction counter for next session
COUNTER_FILE="$BUDDY_HOME/.react-counter"
rm -f "$COUNTER_FILE" 2>/dev/null || true
