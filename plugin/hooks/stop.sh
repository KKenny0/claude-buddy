#!/bin/bash
# BuddyBar — stop hook
# Fires when a Claude Code session ends. The pet goes to sleep.
# Produces no stdout — all feedback goes to statusline/sidebar.

set -euo pipefail

BUDDY_HOME="$HOME/.claude-buddy"
PLUGIN_DIR="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"

PET_JSON="$BUDDY_HOME/pet.json"
[ ! -f "$PET_JSON" ] && exit 0

# Find buddy-core — prefer local plugin copy over global install
BUDDY_CORE=""
if [ -f "$PLUGIN_DIR/src/bin/buddy-core.js" ]; then
  BUDDY_CORE="node $PLUGIN_DIR/src/bin/buddy-core.js"
elif command -v buddy-core &>/dev/null; then
  BUDDY_CORE="buddy-core"
fi

if [ -n "$BUDDY_CORE" ]; then
  BUDDY_RESULT=$($BUDDY_CORE session-stop --json 2>/dev/null || true)
fi

# No stdout output — buddy state is shown on statusline/sidebar only.
# Stop hook stdout gets injected as additionalContext into the agent,
# so we intentionally output nothing to avoid polluting the agent's context.

# Reset reaction counter for next session
rm -f "$BUDDY_HOME/.react-counter" 2>/dev/null || true
