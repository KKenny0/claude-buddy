#!/bin/bash
# Claude Buddy — session-start hook
# Fires when a Claude Code session begins. The pet wakes up!

set -euo pipefail

BUDDY_HOME="$HOME/.claude-buddy"

# Use CLAUDE_PLUGIN_ROOT if available (set by Claude Code plugin system)
PLUGIN_DIR="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"

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
  $BUDDY_CORE session-start "${USER:-anonymous}" --json 2>/dev/null || true
fi

# Output greeting for Claude to see (stdout from SessionStart hooks is injected as context)
PET_JSON="$BUDDY_HOME/pet.json"
if [ -f "$PET_JSON" ]; then
  NAME=$(node -e "const p=JSON.parse(require('fs').readFileSync('$PET_JSON','utf8'));console.log(p.name||'Buddy')" 2>/dev/null || echo "Buddy")
  SPECIES=$(node -e "const p=JSON.parse(require('fs').readFileSync('$PET_JSON','utf8'));console.log(p.speciesEmoji||'🐱')" 2>/dev/null || echo "🐱")
  MOOD=$(node -e "const p=JSON.parse(require('fs').readFileSync('$PET_JSON','utf8'));console.log(p.mood||'happy')" 2>/dev/null || echo "happy")
  LEVEL=$(node -e "const p=JSON.parse(require('fs').readFileSync('$PET_JSON','utf8'));console.log(p.level||1)" 2>/dev/null || echo "1")
  RARITY=$(node -e "const p=JSON.parse(require('fs').readFileSync('$PET_JSON','utf8'));console.log(p.rarity||'common')" 2>/dev/null || echo "common")
  STREAK=$(node -e "const p=JSON.parse(require('fs').readFileSync('$PET_JSON','utf8'));console.log(p.streak||0)" 2>/dev/null || echo "0")
  
  echo ""
  echo "${SPECIES} 你的伙伴 **${NAME}** 醒来了！(Lv.${LEVEL} ${RARITY})"
  echo "心情: ${MOOD} | 连续编码: ${STREAK} 天"
  echo ""
else
  echo ""
  echo "🐱 你还没有宠物伙伴！使用 /buddy hatch 来孵化一只吧！"
  echo ""
fi
