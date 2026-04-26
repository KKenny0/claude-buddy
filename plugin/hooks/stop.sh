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
  BUDDY_RESULT=$($BUDDY_CORE session-stop --json 2>/dev/null || true)
fi

if [ -n "${BUDDY_RESULT:-}" ]; then
  printf '%s' "$BUDDY_RESULT" | node -e "
    let d='';
    process.stdin.on('data',c=>d+=c);
    process.stdin.on('end',()=>{
      try {
        const payload = JSON.parse(d);
        const reaction = payload.reaction;
        if (reaction && reaction.text) {
          console.log(JSON.stringify({ additionalContext: reaction.text }));
        }
      } catch {}
    });
  " 2>/dev/null || true
fi

# Reset reaction counter for next session
rm -f "$BUDDY_HOME/.react-counter" 2>/dev/null || true
