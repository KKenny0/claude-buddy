#!/bin/bash
# Claude Buddy — session-start hook
# Fires when a Claude Code session begins. The pet wakes up!

set -euo pipefail

BUDDY_HOME="$HOME/.claude-buddy"
PLUGIN_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Ensure setup
mkdir -p "$BUDDY_HOME"
touch "$BUDDY_HOME/events.log"

# Try to find buddy-core
BUDDY_CORE=""
if command -v buddy-core &>/dev/null; then
  BUDDY_CORE="buddy-core"
elif [ -f "$PLUGIN_DIR/src/bin/buddy-core.js" ]; then
  BUDDY_CORE="node $PLUGIN_DIR/src/bin/buddy-core.js"
fi

if [ -n "$BUDDY_CORE" ]; then
  $BUDDY_CORE session-start "${USER:-anonymous}" 2>/dev/null || true
fi

# Output greeting for Claude to see
PET_JSON="$BUDDY_HOME/pet.json"
if [ -f "$PET_JSON" ]; then
  NAME=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1])).get('name','Buddy'))" "$PET_JSON" 2>/dev/null || echo "Buddy")
  SPECIES=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1])).get('speciesEmoji','🐱'))" "$PET_JSON" 2>/dev/null || echo "🐱")
  MOOD=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1])).get('mood','happy'))" "$PET_JSON" 2>/dev/null || echo "happy")
  LEVEL=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1])).get('level',1))" "$PET_JSON" 2>/dev/null || echo "1")
  RARITY=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1])).get('rarity','common'))" "$PET_JSON" 2>/dev/null || echo "common")
  STREAK=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1])).get('streak',0))" "$PET_JSON" 2>/dev/null || echo "0")
  
  echo ""
  echo "${SPECIES} 你的伙伴 **${NAME}** 醒来了！(Lv.${LEVEL} ${RARITY})"
  echo "心情: ${MOOD} | 连续编码: ${STREAK} 天"
  echo ""
else
  echo ""
  echo "🐱 你还没有宠物伙伴！使用 /buddy hatch 来孵化一只吧！"
  echo ""
fi
