import { GAME_CONFIG } from '../lib/config'
// 数据验证工具
export interface Word {
  id: number;
  word: string;
  definition: string;
  audioText: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: string[];
  answer: string;
  hint: string;
}

export interface QuestionType {
  id: string;
  name: string;
  description: string;
}

export interface AnswerType {
  id: string;
  name: string;
  description: string;
}

export interface DifficultyLevel {
  id: string;
  name: string;
  color: string;
}

export interface WordData {
  words: Word[];
  questionTypes: QuestionType[];
  answerTypes: AnswerType[];
  difficultyLevels: DifficultyLevel[];
}

// 数据验证函数
export function validateWord(word: any): string[] {
  const errors: string[] = [];
  
  if (!word.id || typeof word.id !== 'number') {
    errors.push('ID必须是数字');
  }
  
  if (!word.word || typeof word.word !== 'string') {
    errors.push('单词必须是字符串');
  }
  
  if (!word.definition || typeof word.definition !== 'string') {
    errors.push('定义必须是字符串');
  }
  
  if (!word.audioText || typeof word.audioText !== 'string') {
    errors.push('音频文本必须是字符串');
  }
  
  if (!['easy', 'medium', 'hard'].includes(word.difficulty)) {
    errors.push('难度必须是 easy、medium 或 hard');
  }
  
  if (!Array.isArray(word.options) || word.options.length < 3) {
    errors.push('选项必须是至少包含3个元素的数组');
  }
  
  if (!word.answer || typeof word.answer !== 'string') {
    errors.push('答案必须是字符串');
  }
  
  if (!word.hint || typeof word.hint !== 'string') {
    errors.push('提示必须是字符串');
  }
  
  // 验证答案是否在选项中
  if (word.options && !word.options.includes(word.answer)) {
    errors.push('答案必须在选项列表中');
  }
  
  return errors;
}

export function validateWordData(data: any): string[] {
  const errors: string[] = [];
  
  if (!data.words || !Array.isArray(data.words)) {
    errors.push('words字段必须是数组');
    return errors;
  }
  
  data.words.forEach((word: any, index: number) => {
    const wordErrors = validateWord(word);
    if (wordErrors.length > 0) {
      errors.push(`第${index + 1}个单词错误: ${wordErrors.join(', ')}`);
    }
  });
  
  return errors;
}

// 数据工具函数
// shuffle参数：是否随机打乱顺序，默认true（随机选取），false则保持原顺序（顺序选取）
export function getRandomWords(words: Word[], count: number, difficulty?: string, shuffle: boolean = true): Word[] {
  let filteredWords = words;
  
  if (difficulty) {
    filteredWords = words.filter(word => word.difficulty === difficulty);
  }
  
  // 根据shuffle参数决定是否随机打乱
  const processedWords = shuffle 
    ? [...filteredWords].sort(() => 0.5 - Math.random())
    : [...filteredWords];
  
  return processedWords.slice(0, count);
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateOptions(correctAnswer: string, allWords: Word[], count: number = GAME_CONFIG.OPTION_COUNT): string[] {
  const wrongAnswers = allWords
    .filter(word => word.word !== correctAnswer)
    .map(word => word.word);
  
  const shuffledWrong = shuffleArray(wrongAnswers);
  const selectedWrong = shuffledWrong.slice(0, count - 1);
  
  return shuffleArray([correctAnswer, ...selectedWrong]);
}