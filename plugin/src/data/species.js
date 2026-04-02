/**
 * Species definitions for Claude Buddy pets.
 * Each species has ASCII art for normal, happy, sleepy, and excited states.
 */

const SPECIES = [
  {
    id: 'cat',
    name: 'Cat',
    emoji: '🐱',
    rarity: ['common', 'uncommon', 'rare'],
    art: {
      normal: ['  /\\_/\\ ', ' ( ·ω·)', ' (")_(")'],
      happy: ['  /\\_/\\ ', ' (≧ω≦)', ' (")_(")'],
      sleepy: ['  /\\_/\\ ', ' ( -ω-)', ' Z(")(")'],
      excited: ['  /\\_/\\ ', ' (★ω★)', ' ┗(>ω<)┛'],
    },
    personality: ['独立', '好奇', '偶尔傲娇'],
  },
  {
    id: 'duck',
    name: 'Duck',
    emoji: '🦆',
    rarity: ['common', 'uncommon'],
    art: {
      normal: [' __(·>', ' __(._>', '  `--´ '],
      happy: [' __(≧▽≦)>', ' __(·ω·)>', '  ♪♪♪ '],
      sleepy: [' __(·_·)>', ' __(._.)>', '  `zzz´ '],
      excited: [' __(★>★)>', ' __(·ω·)>', '  ~quack~ '],
    },
    personality: ['开朗', '话多', '爱跟着你'],
  },
  {
    id: 'ghost',
    name: 'Ghost',
    emoji: '👻',
    rarity: ['common', 'uncommon'],
    art: {
      normal: [' .[||]. ', ' [ · · ] ', ' [ ==== ] '],
      happy: [' .[||]. ', ' [ ≧▽≦] ', ' [ ==== ] '],
      sleepy: [' .[||]. ', ' [ - · -] ', ' [ ==== ] '],
      excited: [' .[||]. ', ' [ ★ · ★] ', ' [ ~~~~ ] '],
    },
    personality: ['安静', '神秘', '飘来飘去'],
  },
  {
    id: 'robot',
    name: 'Robot',
    emoji: '🤖',
    rarity: ['common', 'uncommon', 'rare'],
    art: {
      normal: ['  [||]  ', '  {(·)} ', ' [====] '],
      happy: ['  [||]  ', '  {(≧)} ', ' [====] '],
      sleepy: ['  [||]  ', '  {(-)} ', ' [====] '],
      excited: ['  [||]  ', '  {(★)} ', ' [≈≈≈≈] '],
    },
    personality: ['逻辑严密', '偶尔短路', '喜欢数字'],
  },
  {
    id: 'dragon',
    name: 'Dragon',
    emoji: '🐉',
    rarity: ['uncommon', 'rare', 'epic'],
    art: {
      normal: ['  /^\\  ', ' < · · >', ' ( ~~ )', ' `-vvvv-´'],
      happy: ['  /^\\  ', ' < ≧▽≦>', ' ( ~~ )', ' `-vvvv-´'],
      sleepy: ['  /^\\  ', ' < - · ->', ' ( ~~ )', ' `-zzzz-´'],
      excited: ['  /^\\  ', ' < ★▽★>', ' (🔥🔥) ', ' `-vvvv-´'],
    },
    personality: ['傲娇', '喜欢 hoard 代码', '偶尔喷火'],
  },
  {
    id: 'owl',
    name: 'Owl',
    emoji: '🦉',
    rarity: ['uncommon', 'rare'],
    art: {
      normal: ['  /\\ /\\  ', ' ((·)(·))', '  ( >< ) '],
      happy: ['  /\\ /\\  ', ' ((≧)(≦))', '  ( ∩∩ ) '],
      sleepy: ['  /\\ /\\  ', ' ((-)(-))', '  ( ·· ) '],
      excited: ['  /\\ /\\  ', ' ((★)(★))', '  ( ◉◉ ) '],
    },
    personality: ['博学', '夜晚活跃', '爱讲道理'],
  },
  {
    id: 'fox',
    name: 'Fox',
    emoji: '🦊',
    rarity: ['rare', 'epic'],
    art: {
      normal: ['  /|  |\\ ', '  | >·< |', '  | \\  / |'],
      happy: ['  /|  |\\ ', '  | ≧▽≦ |', '  | \\  / |'],
      sleepy: ['  /|  |\\ ', '  | -·- |', '  |    z |'],
      excited: ['  /|  |\\ ', '  | ★▽★ |', '  | /  \\ |'],
    },
    personality: ['狡猾', '聪明', '喜欢搞恶作剧'],
  },
  {
    id: 'axolotl',
    name: 'Axolotl',
    emoji: '🦎',
    rarity: ['rare', 'epic'],
    art: {
      normal: [' }~(____)~{ ', ' }~(·..·)~{ ', '   (._.)   '],
      happy: [' }~(____)~{ ', ' }~(≧▽≦)~{ ', '   (◕‿◕)   '],
      sleepy: [' }~(____)~{ ', ' }~(-·- )~{ ', '   (._.)zz '],
      excited: [' }~(____)~{ ', ' }~(★▽★)~{ ', '   (◉ω◉)   '],
    },
    personality: ['呆萌', '永远微笑', '水系大师'],
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    emoji: '🔥',
    rarity: ['epic', 'legendary'],
    art: {
      normal: ['  .,,.  ', '  ( @ ) ', '  /|\\  ', '  |\\/| '],
      happy: ['  .,,.  ', ' ( ≧▽≦) ', '  /|\\  ', '  ~✨~ '],
      sleepy: ['  .,,.  ', '  ( - ) ', '  /|\\  ', '  |  | '],
      excited: ['  ★,,★  ', ' ( ★▽★) ', '  /🔥\\ ', '  ~✨~ '],
    },
    personality: ['浴火重生', '充满希望', '永远乐观'],
  },
  {
    id: 'capybara',
    name: 'Capybara',
    emoji: '🫎',
    rarity: ['legendary'],
    art: {
      normal: [' n______n ', ' ( · · ) ', ' ( oo ) ', ' `----´ '],
      happy: [' n______n ', ' ( ≧▽≦) ', ' ( oo ) ', ' `----´ '],
      sleepy: [' n______n ', ' ( - · -) ', ' ( oo ) ', ' `----´ '],
      excited: [' n______n ', ' ( ★ω★) ', ' ( OO ) ', ' `----´ '],
    },
    personality: ['佛系', '情绪稳定', '万物之友'],
  },
  {
    id: 'slime',
    name: 'Slime',
    emoji: '🟢',
    rarity: ['common', 'uncommon'],
    art: {
      normal: ['  ___  ', ' /   \\ ', '| · · |', ' \\___/ '],
      happy: ['  ___  ', ' /   \\ ', '| ≧▽≦|', ' \\___/ '],
      sleepy: ['  ___  ', ' /   \\ ', '| - ·-|', ' \\___/ '],
      excited: ['  ___  ', ' /   \\ ', '| ★▽★|', ' \\~~~\\ '],
    },
    personality: ['柔软', '弹来弹去', '什么都能吃'],
  },
  {
    id: 'penguin',
    name: 'Penguin',
    emoji: '🐧',
    rarity: ['uncommon', 'rare'],
    art: {
      normal: ['  (·)  ', ' <( )> ', '  /|\\  ', '  / \\ '],
      happy: ['  (·)  ', ' <(≧)> ', '  /|\\  ', '  / \\ '],
      sleepy: ['  (-)  ', ' <( )> ', '  /|\\  ', '  z z '],
      excited: ['  (★)  ', ' <(★)> ', '  /|\\  ', '  ♪♪♪ '],
    },
    personality: ['憨厚', '喜欢冰', '走路摇摆'],
  },
];

/** Suggested names by species */
const NAME_SUGGESTIONS = {
  cat: ['小橘', '喵酱', 'Code Cat', 'Neko'],
  duck: ['鸭鸭', 'Quack', '小黄', 'Ducky'],
  ghost: ['幽灵', 'Casper', '小透明', 'Phantom'],
  robot: ['小机', 'Bot', 'T-800', 'R2'],
  dragon: ['小龙', 'Draco', '火火', 'Smaug'],
  owl: ['猫头鹰', 'Hoot', '智者', 'Owlbert'],
  fox: ['小狐', 'Firefox', '狡狐', 'Kitsune'],
  axolotl: ['六角恐龙', 'Axo', '呆呆', 'Mexican'],
  phoenix: ['凤凰', 'Fawkes', '不死鸟', 'Blaze'],
  capybara: ['卡皮巴拉', 'Capy', '佛系', 'Chill'],
  slime: ['史莱姆', 'Blob', '果冻', 'Gooey'],
  penguin: ['企鹅', 'Pingu', '冰宝', 'Waddle'],
};

/** Hats by rarity */
const HATS = {
  common: [],
  uncommon: ['🎩', '🎀', '⚽'],
  rare: ['👑', '🎓', '🧢', '🎩'],
  epic: ['⭐', '🌈', '💎', '🔮'],
  legendary: ['🏆', '🔱', '✨', '🌟'],
};

module.exports = { SPECIES, NAME_SUGGESTIONS, HATS };
