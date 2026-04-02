#!/bin/bash
# Claude Buddy — post-tool-use hook
# Fires after Claude uses any tool. The pet reacts!

set -euo pipefail

BUDDY_HOME="$HOME/.claude-buddy"
PLUGIN_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Only proceed if pet exists
PET_JSON="$BUDDY_HOME/pet.json"
[ ! -f "$PET_JSON" ] && exit 0

# Read tool info from stdin (Claude Code passes tool info via stdin)
# Format: JSON with tool name, input, etc.
TOOL_NAME=""
TOOL_FILE=""

# Try to parse stdin for tool info
INPUT=""
if [ ! -t 0 ]; then
  INPUT=$(cat 2>/dev/null || echo "")
fi

# Extract tool name from input (simple JSON parsing without jq)
if [ -n "$INPUT" ]; then
  TOOL_NAME=$(echo "$INPUT" | grep -o '"tool"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*:.*"\([^"]*\)".*/\1/' 2>/dev/null || true)
  TOOL_FILE=$(echo "$INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*:.*"\([^"]*\)".*/\1/' 2>/dev/null || true)
  [ -z "$TOOL_FILE" ] && TOOL_FILE=$(echo "$INPUT" | grep -o '"file"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*:.*"\([^"]*\)".*/\1/' 2>/dev/null || true)
fi

# Find buddy-core
BUDDY_CORE=""
if command -v buddy-core &>/dev/null; then
  BUDDY_CORE="buddy-core"
elif [ -f "$PLUGIN_DIR/src/bin/buddy-core.js" ]; then
  BUDDY_CORE="node $PLUGIN_DIR/src/bin/buddy-core.js"
fi

if [ -n "$BUDDY_CORE" ] && [ -n "$TOOL_NAME" ]; then
  # Check exit code for error detection
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
    # Only show reaction occasionally (not every tool use) to avoid spam
    # Use a counter file
    COUNTER_FILE="$BUDDY_HOME/.react-counter"
    COUNT=0
    [ -f "$COUNTER_FILE" ] && COUNT=$(cat "$COUNTER_FILE" 2>/dev/null || echo "0")
    COUNT=$((COUNT + 1))
    echo "$COUNT" > "$COUNTER_FILE"
    
    # Show reaction every 5 tool uses
    if [ $((COUNT % 5)) -eq 0 ]; then
      echo ""
      echo "$REACTION"
      echo ""
    fi
  fi
fi
