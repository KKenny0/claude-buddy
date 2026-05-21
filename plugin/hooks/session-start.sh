#!/bin/bash
# BuddyBar — session-start hook
# Fires when a Claude Code session begins. The pet wakes up!

set -euo pipefail

BUDDY_HOME="$HOME/.claude-buddy"

# Use CLAUDE_PLUGIN_ROOT if available (set by Claude Code plugin system)
PLUGIN_DIR="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"

# Ensure setup
mkdir -p "$BUDDY_HOME"
touch "$BUDDY_HOME/events.log"

# Try to find buddy-core — prefer local plugin copy over global install
BUDDY_CORE=""
if [ -f "$PLUGIN_DIR/src/bin/buddy-core.js" ]; then
  BUDDY_CORE="node $PLUGIN_DIR/src/bin/buddy-core.js"
elif command -v buddy-core &>/dev/null; then
  BUDDY_CORE="buddy-core"
fi

if [ -n "$BUDDY_CORE" ]; then
  $BUDDY_CORE session-start "${USER:-anonymous}" --json >/dev/null 2>/dev/null || true
fi

# No stdout output — buddy state is shown on statusline/sidebar only.
# SessionStart hook stdout gets injected into conversation context,
# so we intentionally output nothing to avoid polluting the agent's context.
