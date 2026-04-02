#!/bin/bash
# Claude Buddy — post-tool-use hook
# Fires after Claude uses any tool. The pet reacts!

set -euo pipefail

BUDDY_HOME="$HOME/.claude-buddy"
PLUGIN_DIR="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"

# Only proceed if pet exists
PET_JSON="$BUDDY_HOME/pet.json"
[ ! -f "$PET_JSON" ] && exit 0

# Read tool info from stdin (Claude Code passes tool info via stdin JSON)
INPUT=""
if [ ! -t 0 ]; then
  INPUT=$(cat 2>/dev/null || echo "")
fi

# Extract tool name (use node since we know it's available)
TOOL_NAME=""
TOOL_FILE=""
if [ -n "$INPUT" ]; then
  TOOL_NAME=$(echo "$INPUT" | node -e "
    let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
      try{const j=JSON.parse(d);console.log(j.tool_name||j.tool||'')}catch(e){console.log('')}
    })" 2>/dev/null || true)
  TOOL_FILE=$(echo "$INPUT" | node -e "
    let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
      try{const j=JSON.parse(d);console.log(j.file_path||j.file||j.path||'')}catch(e){console.log('')}
    })" 2>/dev/null || true)
fi

# Find buddy-core
BUDDY_CORE=""
if command -v buddy-core &>/dev/null; then
  BUDDY_CORE="buddy-core"
elif [ -f "$PLUGIN_DIR/src/bin/buddy-core.js" ]; then
  BUDDY_CORE="node $PLUGIN_DIR/src/bin/buddy-core.js"
fi

if [ -n "$BUDDY_CORE" ] && [ -n "$TOOL_NAME" ]; then
  TOOL_EXIT_CODE="${TOOL_EXIT_CODE:-0}"
  export TOOL_EXIT_CODE
  $BUDDY_CORE tool-use "$TOOL_NAME" "$TOOL_FILE" 2>/dev/null || true
fi

# Generate a reaction for Claude to see
BUDDY_REACT=""
if command -v buddy-react &>/dev/null; then
  BUDDY_REACT="buddy-react"
elif [ -f "$PLUGIN_DIR/src/bin/buddy-react.js" ]; then
  BUDDY_REACT="node $PLUGIN_DIR/src/bin/buddy-react.js"
fi

if [ -n "$BUDDY_REACT" ] && [ -n "$TOOL_NAME" ]; then
  REACTION=$($BUDDY_REACT "$TOOL_NAME" "$TOOL_FILE" 2>/dev/null || true)
  if [ -n "$REACTION" ]; then
    # Only show reaction occasionally to avoid spam
    COUNTER_FILE="$BUDDY_HOME/.react-counter"
    COUNT=0
    [ -f "$COUNTER_FILE" ] && COUNT=$(cat "$COUNTER_FILE" 2>/dev/null || echo "0")
    COUNT=$((COUNT + 1))
    echo "$COUNT" > "$COUNTER_FILE"
    
    if [ $((COUNT % 5)) -eq 0 ]; then
      echo ""
      echo "$REACTION"
      echo ""
    fi
  fi
fi
