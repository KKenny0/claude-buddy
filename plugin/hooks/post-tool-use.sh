#!/bin/bash
# Claude Buddy — post-tool-use hook
# Fires after Claude uses any tool. The pet reacts!
# Uses additionalContext to inject reaction into Claude's next turn.

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

# Extract tool name
TOOL_NAME=""
TOOL_FILE=""
TOOL_COMMAND=""
HOOK_EXIT_CODE=""
if [ -n "$INPUT" ]; then
  TOOL_NAME=$(echo "$INPUT" | node -e "
    let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
      try{const j=JSON.parse(d);console.log(j.tool_name||j.tool||'')}catch(e){console.log('')}
    })" 2>/dev/null || true)
  TOOL_FILE=$(echo "$INPUT" | node -e "
    let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
      try{const j=JSON.parse(d);const i=j.tool_input||j.input||{};console.log(j.file_path||j.file||j.path||i.file_path||i.file||i.path||'')}catch(e){console.log('')}
    })" 2>/dev/null || true)
  TOOL_COMMAND=$(echo "$INPUT" | node -e "
    let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
      try{const j=JSON.parse(d);const i=j.tool_input||j.input||{};console.log(i.command||j.command||'')}catch(e){console.log('')}
    })" 2>/dev/null || true)
  HOOK_EXIT_CODE=$(echo "$INPUT" | node -e "
    let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
      try{const j=JSON.parse(d);const r=j.tool_response||j.response||{};console.log(j.exit_code??r.exit_code??'')}catch(e){console.log('')}
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
  TOOL_EXIT_CODE="${TOOL_EXIT_CODE:-${HOOK_EXIT_CODE:-0}}"
  export TOOL_EXIT_CODE
  BUDDY_RESULT=$($BUDDY_CORE tool-use "$TOOL_NAME" "$TOOL_FILE" "$TOOL_COMMAND" --json 2>/dev/null || true)
fi

if [ -n "${BUDDY_RESULT:-}" ]; then
  printf '%s' "$BUDDY_RESULT" | node -e "
    let d='';
    process.stdin.on('data',c=>d+=c);
    process.stdin.on('end',()=>{
      try {
        const payload = JSON.parse(d);
        const reaction = payload.reaction;
        if (reaction && Array.isArray(reaction.surface) && reaction.surface.includes('conversation') && reaction.text) {
          console.log(JSON.stringify({ additionalContext: reaction.text }));
        }
      } catch {}
    });
  " 2>/dev/null || true
fi
