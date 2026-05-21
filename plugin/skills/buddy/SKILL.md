# Claude Buddy — Command Reference

Do not mention the pet, react to the pet, or reference the pet in conversation unless the user explicitly asks about it.

If the user invoked `/claude-buddy:buddy` or `/buddy`, run the command below and show the output. Do not add commentary.

## Running Buddy Commands

```bash
node "${CLAUDE_PLUGIN_ROOT}/src/bin/buddy-core.js" <command>
```

Where `<command>` is one of:

- **`hatch`** — Hatch a new pet (first run)
- **`status`** *(or no args)* — Show pet detail card
- **`rename <name>`** — Give your pet a name
- **`statusline on|off`** — Enable/disable the statusline
- **`mode <quiet|focus|lively>`** — Set presence mode
- **`evolve`** — Trigger evolution (Lv.15+, auto-triggers on level up)
- **`prestige`** — Reset with permanent bonuses (Lv.20+)

> Always use `node "${CLAUDE_PLUGIN_ROOT}/src/bin/buddy-core.js"`. Do NOT try `buddy-core` as a global command.
