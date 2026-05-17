# Claude Buddy — Command Reference

Do not mention the pet, react to the pet, or reference the pet in conversation unless the user explicitly asks about it.

If the user invoked `/claude-buddy:buddy` or `/buddy`, run the command below and show the output. Do not add commentary.

## Running Buddy Commands

```bash
node "${CLAUDE_PLUGIN_ROOT}/src/bin/buddy-core.js" <command>
```

Where `<command>` is one of: `hatch`, `status`, `feed`, `play`, `pet`, `stats`, `rename <name>`, `live`, `statusline install`, `statusline remove`, `panel`, `sidebar start`, `sidebar stop`, `quiet`, `focus`, `lively`, `events`, `summary`, `unlocks`.

> Always use `node "${CLAUDE_PLUGIN_ROOT}/src/bin/buddy-core.js"`. Do NOT try `buddy-core` as a global command.
