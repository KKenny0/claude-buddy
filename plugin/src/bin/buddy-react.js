#!/usr/bin/env node
/**
 * buddy-react — compatibility entry point for reaction text.
 * The core state machine now owns reaction generation.
 */

const { readPet } = require('../storage');
const { getLiveMode, reactionForTool } = require('../core');

const tool = process.argv[2] || '';
const file = process.argv[3] || '';
const command = process.argv[4] || '';

const pet = readPet();
if (!pet) process.exit(0);

const reaction = pet.lastReaction || reactionForTool(pet, tool, file, command, false, false, getLiveMode());
if (reaction?.text) {
  console.log(reaction.text);
}
