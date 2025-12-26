/**
 * Word Game Logic Utilities
 * 词语游戏逻辑工具函数
 */

import type { MissingWord, WordPosition, GameConfig } from '../types/missingWordsGame';
import { getRandomWords, selectRandomItems } from '../data/mockWords';

/**
 * 计算挑战模式需要的总词数
 * 公式：n + (4 - k)
 * n: 观察词语数量
 * k: 消失词语数量
 * (4 - k): 干扰项数量
 */
export function calculateTotalWordsForChallenge(config: GameConfig): number {
  const { wordCount, hiddenCount } = config;
  const distractorCount = 4 - hiddenCount;
  return wordCount + distractorCount;
}

/**
 * 计算干扰项数量
 */
export function calculateDistractorCount(hiddenCount: number): number {
  return 4 - hiddenCount;
}

/**
 * 为游戏准备词语
 * 根据游戏模式和配置准备相应数量的词语
 */
export function prepareWordsForGame(
  config: GameConfig,
  language?: 'chinese' | 'english'
): {
  allWords: MissingWord[];
  displayWords: MissingWord[];
  distractors: MissingWord[];
} {
  const { gameMode, wordCount } = config;

  if (gameMode === 'casual') {
    // 休闲模式：只需要观察词语数量
    const words = getRandomWords(wordCount, language);
    return {
      allWords: words,
      displayWords: words,
      distractors: [],
    };
  } else {
    // 挑战模式：需要观察词语 + 干扰项
    const totalWords = calculateTotalWordsForChallenge(config);
    const allWords = getRandomWords(totalWords, language);
    const displayWords = allWords.slice(0, wordCount);
    const distractors = allWords.slice(wordCount);

    return {
      allWords,
      displayWords,
      distractors,
    };
  }
}

/**
 * 从词语列表中随机选择要隐藏的词语
 */
export function selectWordsToHide(
  words: MissingWord[],
  count: number
): MissingWord[] {
  return selectRandomItems(words, count);
}

/**
 * 生成答题选项（挑战模式）
 * 包含正确答案和干扰项，总共4个选项
 */
export function generateAnswerOptions(
  hiddenWords: MissingWord[],
  distractors: MissingWord[]
): MissingWord[] {
  // 合并正确答案和干扰项
  const options = [...hiddenWords, ...distractors];
  
  // 随机打乱顺序
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  
  return options;
}

/**
 * 生成词语卡片的随机位置
 * 确保卡片在舞台区域内均匀分布，不会重叠，且不会被边缘裁剪
 * 
 * 策略：使用改进的随机分布算法，确保卡片覆盖整个舞台区域
 */
export function generateWordPositions(
  wordCount: number,
  stageWidth: number = 800,
  stageHeight: number = 400
): WordPosition[] {
  const positions: WordPosition[] = [];
  
  // 卡片尺寸（需要与 WordCard 组件中的尺寸一致）
  const cardWidth = 192; // w-48 = 12rem = 192px
  const cardHeight = 144; // h-36 = 9rem = 144px
  
  // 边距：卡片宽度和高度的一半，确保卡片不会被裁剪
  const marginX = cardWidth / 2; // 96px
  const marginY = cardHeight / 2; // 72px
  
  // 可用区域（从边距到边距）
  const availableWidth = stageWidth - 2 * marginX;
  const availableHeight = stageHeight - 2 * marginY;
  
  // 使用改进的分布算法：
  // 1. 计算合适的行列数（基于可用区域的宽高比）
  const aspectRatio = availableWidth / availableHeight;
  const cols = Math.ceil(Math.sqrt(wordCount * aspectRatio));
  const rows = Math.ceil(wordCount / cols);
  
  // 2. 计算单元格尺寸
  const cellWidth = availableWidth / cols;
  const cellHeight = availableHeight / rows;
  
  // 3. 随机偏移范围（单元格尺寸的40%，确保不会超出单元格太多）
  const offsetRangeX = cellWidth * 0.4;
  const offsetRangeY = cellHeight * 0.4;
  
  // 为每个卡片生成位置
  for (let i = 0; i < wordCount; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    
    // 计算单元格中心位置（相对于整个舞台，包括边距）
    const centerX = marginX + col * cellWidth + cellWidth / 2;
    const centerY = marginY + row * cellHeight + cellHeight / 2;
    
    // 添加随机偏移
    const offsetX = (Math.random() - 0.5) * 2 * offsetRangeX;
    const offsetY = (Math.random() - 0.5) * 2 * offsetRangeY;
    
    // 最终位置
    const x = centerX + offsetX;
    const y = centerY + offsetY;
    
    // 随机旋转角度（-15度到15度）
    const rotation = (Math.random() - 0.5) * 30;
    
    positions.push({
      wordId: '', // 将在使用时设置
      x,
      y,
      rotation,
    });
  }
  
  return positions;
}

/**
 * 将词语ID分配给位置
 */
export function assignWordsToPositions(
  words: MissingWord[],
  positions: WordPosition[]
): WordPosition[] {
  return positions.map((pos, index) => ({
    ...pos,
    wordId: words[index]?.id || '',
  }));
}

/**
 * 验证用户答案
 */
export function validateAnswer(
  userAnswers: string[],
  correctAnswers: string[]
): {
  isCorrect: boolean;
  correctCount: number;
  wrongAnswers: string[];
  missedAnswers: string[];
} {
  const correctSet = new Set(correctAnswers);
  const userSet = new Set(userAnswers);

  // 计算正确的答案数量
  const correctCount = userAnswers.filter(id => correctSet.has(id)).length;

  // 找出错误的答案
  const wrongAnswers = userAnswers.filter(id => !correctSet.has(id));

  // 找出遗漏的答案
  const missedAnswers = correctAnswers.filter(id => !userSet.has(id));

  // 判断是否完全正确
  const isCorrect = 
    correctCount === correctAnswers.length &&
    wrongAnswers.length === 0;

  return {
    isCorrect,
    correctCount,
    wrongAnswers,
    missedAnswers,
  };
}

/**
 * 初始化游戏回合
 * 准备一个完整的游戏回合所需的所有数据
 */
export function initializeGameRound(
  config: GameConfig,
  language?: 'chinese' | 'english'
): {
  words: MissingWord[];
  allWords: MissingWord[];
  distractors: MissingWord[];
  positions: WordPosition[];
} {
  // 准备词语
  const { allWords, displayWords, distractors } = prepareWordsForGame(config, language);

  // 生成位置
  const positions = generateWordPositions(displayWords.length);
  const assignedPositions = assignWordsToPositions(displayWords, positions);

  return {
    words: displayWords,
    allWords,
    distractors,
    positions: assignedPositions,
  };
}

/**
 * 执行词语隐藏
 * 从显示的词语中选择要隐藏的词语，并生成答题选项
 */
export function executeWordHiding(
  words: MissingWord[],
  distractors: MissingWord[],
  config: GameConfig
): {
  hiddenWords: MissingWord[];
  remainingWords: MissingWord[];
  answerOptions: MissingWord[];
} {
  const { hiddenCount, gameMode } = config;

  // 选择要隐藏的词语
  const hiddenWords = selectWordsToHide(words, hiddenCount);
  const hiddenWordIds = new Set(hiddenWords.map(w => w.id));

  // 计算剩余的词语
  const remainingWords = words.filter(w => !hiddenWordIds.has(w.id));

  // 生成答题选项（仅挑战模式）
  const answerOptions = gameMode === 'challenge'
    ? generateAnswerOptions(hiddenWords, distractors)
    : [];

  return {
    hiddenWords,
    remainingWords,
    answerOptions,
  };
}
