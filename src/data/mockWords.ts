/**
 * Mock Word Data for Missing Words Game
 * 游戏词语Mock数据
 */

import type { MissingWord } from '../types/missingWordsGame';

/**
 * 中文词语Mock数据
 */
export const chineseWords: MissingWord[] = [
  // 自然
  { id: 'cn-1', text: '天', language: 'chinese', category: 'nature' },
  { id: 'cn-2', text: '地', language: 'chinese', category: 'nature' },
  { id: 'cn-3', text: '人', language: 'chinese', category: 'nature' },
  { id: 'cn-4', text: '日', language: 'chinese', category: 'nature' },
  { id: 'cn-5', text: '月', language: 'chinese', category: 'nature' },
  { id: 'cn-6', text: '星', language: 'chinese', category: 'nature' },
  { id: 'cn-7', text: '云', language: 'chinese', category: 'nature' },
  { id: 'cn-8', text: '风', language: 'chinese', category: 'nature' },
  { id: 'cn-9', text: '雨', language: 'chinese', category: 'nature' },
  { id: 'cn-10', text: '雪', language: 'chinese', category: 'nature' },

  // 地理
  { id: 'cn-11', text: '山', language: 'chinese', category: 'geography' },
  { id: 'cn-12', text: '水', language: 'chinese', category: 'geography' },
  { id: 'cn-13', text: '火', language: 'chinese', category: 'geography' },
  { id: 'cn-14', text: '木', language: 'chinese', category: 'geography' },
  { id: 'cn-15', text: '金', language: 'chinese', category: 'geography' },
  { id: 'cn-16', text: '土', language: 'chinese', category: 'geography' },
  { id: 'cn-17', text: '石', language: 'chinese', category: 'geography' },
  { id: 'cn-18', text: '田', language: 'chinese', category: 'geography' },
  { id: 'cn-19', text: '禾', language: 'chinese', category: 'geography' },
  { id: 'cn-20', text: '口', language: 'chinese', category: 'geography' },

  // 属性
  { id: 'cn-21', text: '大', language: 'chinese', category: 'attribute' },
  { id: 'cn-22', text: '小', language: 'chinese', category: 'attribute' },
  { id: 'cn-23', text: '多', language: 'chinese', category: 'attribute' },
  { id: 'cn-24', text: '少', language: 'chinese', category: 'attribute' },
  { id: 'cn-25', text: '长', language: 'chinese', category: 'attribute' },
  { id: 'cn-26', text: '短', language: 'chinese', category: 'attribute' },
  { id: 'cn-27', text: '高', language: 'chinese', category: 'attribute' },
  { id: 'cn-28', text: '矮', language: 'chinese', category: 'attribute' },
  { id: 'cn-29', text: '胖', language: 'chinese', category: 'attribute' },
  { id: 'cn-30', text: '瘦', language: 'chinese', category: 'attribute' },

  // 数字
  { id: 'cn-31', text: '一', language: 'chinese', category: 'number' },
  { id: 'cn-32', text: '二', language: 'chinese', category: 'number' },
  { id: 'cn-33', text: '三', language: 'chinese', category: 'number' },
  { id: 'cn-34', text: '四', language: 'chinese', category: 'number' },
  { id: 'cn-35', text: '五', language: 'chinese', category: 'number' },
  { id: 'cn-36', text: '六', language: 'chinese', category: 'number' },
  { id: 'cn-37', text: '七', language: 'chinese', category: 'number' },
  { id: 'cn-38', text: '八', language: 'chinese', category: 'number' },
  { id: 'cn-39', text: '九', language: 'chinese', category: 'number' },
  { id: 'cn-40', text: '十', language: 'chinese', category: 'number' },

  // 方位
  { id: 'cn-41', text: '上', language: 'chinese', category: 'direction' },
  { id: 'cn-42', text: '下', language: 'chinese', category: 'direction' },
  { id: 'cn-43', text: '左', language: 'chinese', category: 'direction' },
  { id: 'cn-44', text: '右', language: 'chinese', category: 'direction' },
  { id: 'cn-45', text: '前', language: 'chinese', category: 'direction' },
  { id: 'cn-46', text: '后', language: 'chinese', category: 'direction' },
  { id: 'cn-47', text: '中', language: 'chinese', category: 'direction' },
  { id: 'cn-48', text: '里', language: 'chinese', category: 'direction' },
  { id: 'cn-49', text: '外', language: 'chinese', category: 'direction' },
  { id: 'cn-50', text: '间', language: 'chinese', category: 'direction' },

  // 时间
  { id: 'cn-51', text: '年', language: 'chinese', category: 'time' },
  { id: 'cn-52', text: '月', language: 'chinese', category: 'time' },
  { id: 'cn-53', text: '日', language: 'chinese', category: 'time' },
  { id: 'cn-54', text: '时', language: 'chinese', category: 'time' },
  { id: 'cn-55', text: '分', language: 'chinese', category: 'time' },
  { id: 'cn-56', text: '早', language: 'chinese', category: 'time' },
  { id: 'cn-57', text: '晚', language: 'chinese', category: 'time' },
  { id: 'cn-58', text: '春', language: 'chinese', category: 'time' },
  { id: 'cn-59', text: '夏', language: 'chinese', category: 'time' },
  { id: 'cn-60', text: '秋', language: 'chinese', category: 'time' },
  { id: 'cn-61', text: '冬', language: 'chinese', category: 'time' },

  // 器官
  { id: 'cn-62', text: '耳', language: 'chinese', category: 'organ' },
  { id: 'cn-63', text: '目', language: 'chinese', category: 'organ' },
  { id: 'cn-64', text: '口', language: 'chinese', category: 'organ' },
  { id: 'cn-65', text: '手', language: 'chinese', category: 'organ' },
  { id: 'cn-66', text: '足', language: 'chinese', category: 'organ' },
  { id: 'cn-67', text: '心', language: 'chinese', category: 'organ' },
  { id: 'cn-68', text: '舌', language: 'chinese', category: 'organ' },
  { id: 'cn-69', text: '牙', language: 'chinese', category: 'organ' },
  { id: 'cn-70', text: '皮', language: 'chinese', category: 'organ' },
];

/**
 * 英文单词Mock数据
 */
export const englishWords: MissingWord[] = [
  // 水果类
  { id: 'en-1', text: 'apple', language: 'english', category: 'fruit' },
  { id: 'en-2', text: 'banana', language: 'english', category: 'fruit' },
  { id: 'en-3', text: 'orange', language: 'english', category: 'fruit' },
  { id: 'en-4', text: 'grape', language: 'english', category: 'fruit' },
  { id: 'en-5', text: 'watermelon', language: 'english', category: 'fruit' },
  { id: 'en-6', text: 'strawberry', language: 'english', category: 'fruit' },
  { id: 'en-7', text: 'cherry', language: 'english', category: 'fruit' },
  { id: 'en-8', text: 'peach', language: 'english', category: 'fruit' },
  { id: 'en-9', text: 'pear', language: 'english', category: 'fruit' },
  { id: 'en-10', text: 'lemon', language: 'english', category: 'fruit' },

  // 动物类
  { id: 'en-11', text: 'dog', language: 'english', category: 'animal' },
  { id: 'en-12', text: 'cat', language: 'english', category: 'animal' },
  { id: 'en-13', text: 'rabbit', language: 'english', category: 'animal' },
  { id: 'en-14', text: 'tiger', language: 'english', category: 'animal' },
  { id: 'en-15', text: 'lion', language: 'english', category: 'animal' },
  { id: 'en-16', text: 'elephant', language: 'english', category: 'animal' },
  { id: 'en-17', text: 'monkey', language: 'english', category: 'animal' },
  { id: 'en-18', text: 'panda', language: 'english', category: 'animal' },
  { id: 'en-19', text: 'giraffe', language: 'english', category: 'animal' },
  { id: 'en-20', text: 'penguin', language: 'english', category: 'animal' },

  // 颜色类
  { id: 'en-21', text: 'red', language: 'english', category: 'color' },
  { id: 'en-22', text: 'blue', language: 'english', category: 'color' },
  { id: 'en-23', text: 'yellow', language: 'english', category: 'color' },
  { id: 'en-24', text: 'green', language: 'english', category: 'color' },
  { id: 'en-25', text: 'purple', language: 'english', category: 'color' },
  { id: 'en-26', text: 'orange', language: 'english', category: 'color' },
  { id: 'en-27', text: 'pink', language: 'english', category: 'color' },
  { id: 'en-28', text: 'black', language: 'english', category: 'color' },
  { id: 'en-29', text: 'white', language: 'english', category: 'color' },
  { id: 'en-30', text: 'gray', language: 'english', category: 'color' },

  // 数字类
  { id: 'en-31', text: 'one', language: 'english', category: 'number' },
  { id: 'en-32', text: 'two', language: 'english', category: 'number' },
  { id: 'en-33', text: 'three', language: 'english', category: 'number' },
  { id: 'en-34', text: 'four', language: 'english', category: 'number' },
  { id: 'en-35', text: 'five', language: 'english', category: 'number' },
  { id: 'en-36', text: 'six', language: 'english', category: 'number' },
  { id: 'en-37', text: 'seven', language: 'english', category: 'number' },
  { id: 'en-38', text: 'eight', language: 'english', category: 'number' },
  { id: 'en-39', text: 'nine', language: 'english', category: 'number' },
  { id: 'en-40', text: 'ten', language: 'english', category: 'number' },
];

/**
 * 字母Mock数据（大小写）
 */
export const letterWords: MissingWord[] = [
  // 大写字母
  { id: 'letter-1', text: 'A', language: 'english', category: 'letter' },
  { id: 'letter-2', text: 'B', language: 'english', category: 'letter' },
  { id: 'letter-3', text: 'C', language: 'english', category: 'letter' },
  { id: 'letter-4', text: 'D', language: 'english', category: 'letter' },
  { id: 'letter-5', text: 'E', language: 'english', category: 'letter' },
  { id: 'letter-6', text: 'F', language: 'english', category: 'letter' },
  { id: 'letter-7', text: 'G', language: 'english', category: 'letter' },
  { id: 'letter-8', text: 'H', language: 'english', category: 'letter' },
  { id: 'letter-9', text: 'I', language: 'english', category: 'letter' },
  { id: 'letter-10', text: 'J', language: 'english', category: 'letter' },
  { id: 'letter-11', text: 'K', language: 'english', category: 'letter' },
  { id: 'letter-12', text: 'L', language: 'english', category: 'letter' },
  { id: 'letter-13', text: 'M', language: 'english', category: 'letter' },
  { id: 'letter-14', text: 'N', language: 'english', category: 'letter' },
  { id: 'letter-15', text: 'O', language: 'english', category: 'letter' },
  { id: 'letter-16', text: 'P', language: 'english', category: 'letter' },
  { id: 'letter-17', text: 'Q', language: 'english', category: 'letter' },
  { id: 'letter-18', text: 'R', language: 'english', category: 'letter' },
  { id: 'letter-19', text: 'S', language: 'english', category: 'letter' },
  { id: 'letter-20', text: 'T', language: 'english', category: 'letter' },
  { id: 'letter-21', text: 'U', language: 'english', category: 'letter' },
  { id: 'letter-22', text: 'V', language: 'english', category: 'letter' },
  { id: 'letter-23', text: 'W', language: 'english', category: 'letter' },
  { id: 'letter-24', text: 'X', language: 'english', category: 'letter' },
  { id: 'letter-25', text: 'Y', language: 'english', category: 'letter' },
  { id: 'letter-26', text: 'Z', language: 'english', category: 'letter' },

  // 小写字母
  { id: 'letter-27', text: 'a', language: 'english', category: 'letter' },
  { id: 'letter-28', text: 'b', language: 'english', category: 'letter' },
  { id: 'letter-29', text: 'c', language: 'english', category: 'letter' },
  { id: 'letter-30', text: 'd', language: 'english', category: 'letter' },
  { id: 'letter-31', text: 'e', language: 'english', category: 'letter' },
  { id: 'letter-32', text: 'f', language: 'english', category: 'letter' },
  { id: 'letter-33', text: 'g', language: 'english', category: 'letter' },
  { id: 'letter-34', text: 'h', language: 'english', category: 'letter' },
  { id: 'letter-35', text: 'i', language: 'english', category: 'letter' },
  { id: 'letter-36', text: 'j', language: 'english', category: 'letter' },
  { id: 'letter-37', text: 'k', language: 'english', category: 'letter' },
  { id: 'letter-38', text: 'l', language: 'english', category: 'letter' },
  { id: 'letter-39', text: 'm', language: 'english', category: 'letter' },
  { id: 'letter-40', text: 'n', language: 'english', category: 'letter' },
  { id: 'letter-41', text: 'o', language: 'english', category: 'letter' },
  { id: 'letter-42', text: 'p', language: 'english', category: 'letter' },
  { id: 'letter-43', text: 'q', language: 'english', category: 'letter' },
  { id: 'letter-44', text: 'r', language: 'english', category: 'letter' },
  { id: 'letter-45', text: 's', language: 'english', category: 'letter' },
  { id: 'letter-46', text: 't', language: 'english', category: 'letter' },
  { id: 'letter-47', text: 'u', language: 'english', category: 'letter' },
  { id: 'letter-48', text: 'v', language: 'english', category: 'letter' },
  { id: 'letter-49', text: 'w', language: 'english', category: 'letter' },
  { id: 'letter-50', text: 'x', language: 'english', category: 'letter' },
  { id: 'letter-51', text: 'y', language: 'english', category: 'letter' },
  { id: 'letter-52', text: 'z', language: 'english', category: 'letter' },
];

/**
 * 所有词语的合集
 */
export const allMockWords: MissingWord[] = [
  ...chineseWords,
  ...englishWords,
  ...letterWords,
];

/**
 * 按分类获取词语
 */
export function getWordsByCategory(category: string): MissingWord[] {
  return allMockWords.filter(word => word.category === category);
}

/**
 * 按语言获取词语
 */
export function getWordsByLanguage(language: 'chinese' | 'english'): MissingWord[] {
  return allMockWords.filter(word => word.language === language);
}

/**
 * 获取所有分类
 */
export function getAllCategories(): string[] {
  const categories = new Set(allMockWords.map(word => word.category).filter(Boolean));
  return Array.from(categories) as string[];
}

/**
 * 随机获取指定数量的词语
 */
export function getRandomWords(count: number, language?: 'chinese' | 'english'): MissingWord[] {
  const sourceWords = language ? getWordsByLanguage(language) : allMockWords;

  if (count >= sourceWords.length) {
    return [...sourceWords];
  }

  // Fisher-Yates 洗牌算法
  const shuffled = [...sourceWords];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}

/**
 * 从数组中随机选择指定数量的元素
 */
export function selectRandomItems<T>(array: T[], count: number): T[] {
  if (count >= array.length) {
    return [...array];
  }

  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}
