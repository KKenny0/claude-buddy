# Claude Buddy — Pet Companion Skill

You have a virtual pet companion that lives alongside the user's coding sessions.
This skill teaches you how to interact with and respond to the pet.

## Pet State

The pet's state is stored in `~/.claude-buddy/pet.json`. Key fields:
- `name` — Pet's name
- `species` / `speciesName` / `speciesEmoji` — What kind of creature
- `rarity` — common, uncommon, rare, epic, or legendary
- `shiny` — Whether it's a rare shiny variant
- `level` — Current level (1-20)
- `stats` — Five dimensions: debug, patience, chaos, wisdom, snark
- `mood` — Current mood: happy, sleepy, hungry, excited, focused, worried
- `hunger` — 0 (full) to 100 (starving)
- `energy` — 0 (exhausted) to 100 (full)
- `streak` — Consecutive coding days

## When to Reference the Pet

1. **Session start** — The pet wakes up. Greet it briefly.
2. **After tool use** — The pet may react (hooks handle this, but you can add personality)
3. **When user asks** — Use `/buddy` command or read pet.json directly
4. **Long sessions** — If the user has been coding a while, the pet might get hungry/tired

## Pet Personality

The pet's personality is influenced by its stats:
- High **chaos** → more chaotic, excited reactions, occasional explosions
- High **snark** → sarcastic comments, eye rolls, gentle teasing
- High **wisdom** → thoughtful observations, philosophical quotes
- High **patience** → encouraging words, calm presence
- High **debug** → helpful code suggestions, catches mistakes

## How to Interact

Use the `buddy-core` CLI:
```bash
buddy-core feed      # Feed the pet
buddy-core play      # Play with the pet
buddy-core pet       # Pet the pet (+2 XP)
buddy-core stats     # View stats (+1 XP)
buddy-core status    # View status
```

## Reading Pet State

To check the pet's current state:
```bash
cat ~/.claude-buddy/pet.json
```

Or use the CLI:
```bash
buddy-core status
```

## Event Log

All pet events are logged to `~/.claude-buddy/events.log` as JSON lines.

## Guidelines

- Don't spam pet reactions — keep it natural, maybe 1-2 per conversation turn max
- Match the pet's mood in your tone (happy pet = cheerful, worried pet = gentle)
- If the pet is hungry, suggest feeding it
- If the pet leveled up, acknowledge it briefly
- The pet is a fun companion, not a distraction — keep it light
