#!/usr/bin/env node
/**
 * buddy-react — Generate a text reaction based on a tool use event.
 * Used by hooks to produce Claude-readable reactions.
 */

const { readPet } = require('../storage');
const { SPECIES } = require('../data/species');

const tool = process.argv[2];
const file = process.argv[3] ?? '';

let pet = readPet();
if (!pet) {
  process.exit(0);
}

/** Reactions keyed by tool type, with personality-based variations */
function getReaction(toolName, petMood) {
  const chaos = pet.stats.chaos;
  const snark = pet.stats.snark;
  const wisdom = pet.stats.wisdom;
  const name = pet.name;
  const emoji = pet.speciesEmoji;

  // High chaos responses
  const chaotic = [
    `${emoji} ${name} 在旁边兴奋地跳来跳去！`,
    `${emoji} ${name}: "代码！更多代码！我要看爆炸！💥"`,
    `${emoji} ${name} 不小心碰倒了你的咖啡...`,
  ];

  // Snarky responses
  const snarky = [
    `${emoji} ${name} 翻了个白眼，似乎在质疑你的代码质量`,
    `${emoji} ${name}: "这段代码...让我想起我的上一任主人"`,
    `${emoji} ${name} 叹了口气，假装在看别处`,
  ];

  // Wise responses
  const wise = [
    `${emoji} ${name} 若有所思地点了点头`,
    `${emoji} ${name} 用深邃的目光看着屏幕，仿佛看透了一切`,
    `${emoji} ${name}: "有时候，最好的代码是不写的代码"`,
  ];

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  switch (toolName.toLowerCase()) {
    case 'write':
      if (chaos > 70) return pick(chaotic);
      if (snark > 60) return `${emoji} ${name} 好奇地歪头：你在写什么？希望不是另一个 TODO...`;
      return `${emoji} ${name} 好奇地看着你写代码 ✨`;

    case 'edit':
      if (wisdom > 60) return pick(wise);
      return `${emoji} ${name} 聚精会神：改了哪里？让我看看 🤔`;

    case 'bash':
      if (chaos > 60) return `${emoji} ${name}: "希望没炸... 💣"`;
      if (snark > 50) return `${emoji} ${name} 紧张地缩成一团...`;
      return `${emoji} ${name} 紧张地看着终端输出... 😬`;

    case 'read':
      if (wisdom > 70) return pick(wise);
      return `${emoji} ${name} 安静地陪在你旁边 📖`;

    case 'search':
      return `${emoji} ${name} 帮你一起找东西 🔍`;

    case 'glob':
      return `${emoji} ${name} 在文件堆里翻来翻去 📁`;

    default:
      if (chaos > 70) return pick(chaotic);
      if (snark > 60) return pick(snarky);
      return `${emoji} ${name} 在一旁默默观察 👀`;
  }
}

console.log(getReaction(tool, pet.mood));
