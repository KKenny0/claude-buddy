#!/bin/bash
# Claude Buddy — stop hook
# Fires when a Claude Code session ends. The pet goes to sleep.

set -euo pipefail

BUDDY_HOME="$HOME/.claude-buddy"
PLUGIN_DIR="$(cd "$(dirname "$0")/.." && pwd)"

PET_JSON="$BUDDY_HOME/pet.json"
[ ! -f "$PET_JSON" ] && exit 0

# Find buddy-core
BUDDY_CORE=""
if [ -f "$PLUGIN_DIR/dist/bin/buddy-core.js" ]; then
  BUDDY_CORE="node $PLUGIN_DIR/dist/bin/buddy-core.js"
elif command -v buddy-core &>/dev/null; then
  BUDDY_CORE="buddy-core"
elif [ -f "$PLUGIN_DIR/src/bin/buddy-core.ts" ] && command -v tsx &>/dev/null; then
  BUDDY_CORE="tsx $PLUGIN_DIR/src/bin/buddy-core.ts"
fi

if [ -n "$BUDDY_CORE" ]; then
  $BUDDY_CORE session-stop 2>/dev/null || true
fi

# Output goodbye
NAME=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1])).get('name','Buddy'))" "$PET_JSON" 2>/dev/null || echo "Buddy")
SPECIES=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1])).get('speciesEmoji','🐱'))" "$PET_JSON" 2>/dev/null || echo "🐱")
MOOD=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1])).get('mood','happy'))" "$PET_JSON" 2>/dev/null || echo "happy")

echo ""
echo "${SPECIES} **${NAME}** 打了个哈欠...今天辛苦了！明天见 🌙"
echo "当前心情: ${MOOD}"
echo ""

# Reset reaction counter for next session
COUNTER_FILE="$BUDDY_HOME/.react-counter"
rm -f "$COUNTER_FILE" 2>/dev/null || true
