/**
 * 应用全局配置常量
 * 集中管理所有默认值和内置配置
 */

// 1. 基础配置常量
export const GAME_CONFIG = {
  TOTAL_QUESTIONS: 10,
  OPTION_COUNT: 3,
  SHUFFLE_WORDS: true,
  DEFAULT_TIME_LIMIT: 300,
} as const;

export const DEFAULT_COLLECTION_ID = '11111111-1111-1111-1111-111111111111';

export const TTS_CONFIG = {
  lang: 'en-US',
  rate: 0.8,
  pitch: 1.0,
  volume: 1.0,
  voiceName: 'default',
} as const;

// 2. 内置默认值 (Fallback) - 集中在这里定义，避免多处重复
export const BUILTIN_DEFAULTS: Record<string, any> = {
  app_settings: {
    defaultLanguage: 'zh-CN',
    theme: 'light',
    enableSound: true,
    autoSave: true,
  },
  default_stats: {
    totalGames: 0,
    totalCorrect: 0,
    bestScore: 0,
    averageScore: 0,
    lastPlayed: null,
  },
  game_constants: {
    totalQuestions: GAME_CONFIG.TOTAL_QUESTIONS,
    optionCount: GAME_CONFIG.OPTION_COUNT,
    shuffleWords: GAME_CONFIG.SHUFFLE_WORDS,
    defaultTimeLimit: GAME_CONFIG.DEFAULT_TIME_LIMIT,
  },
  default_collection_id: DEFAULT_COLLECTION_ID,
  tts_defaults: {
    ...TTS_CONFIG,
  },
  supported_games: [
    {
      id: 'guess_word',
      name: '猜单词',
      description: '根据提示猜测单词',
      category: 'vocabulary',
      enabled: true,
    },
  ],
  guess_word_settings: {
    questionType: 'text',
    answerType: 'choice',
    selectionStrategy: 'sequential',
    hintsEnabled: true,
    showPhonetic: true,
    showDefinition: true,
    showPinyin: false,
    gameMode: 'practice',
  },
  difficulty_levels: [
    { id: 'easy', name: '简单', description: '适合初学者' },
    { id: 'medium', name: '中等', description: '适合有一定基础的学习者' },
    { id: 'hard', name: '困难', description: '适合高级学习者' },
  ],
  question_types: [
    { id: 'text', name: '文字题干', description: '在屏幕上显示题目描述' },
    { id: 'audio', name: '音频题干', description: '通过语音播放题目' },
  ],
  answer_types: [
    { id: 'choice', name: '选择题', description: '从选项中选择答案' },
    { id: 'fill', name: '填空题', description: '手动输入答案' },
  ],
  selection_strategies: [
    { id: 'sequential', name: '顺序学习', description: '按顺序学习内容' },
    { id: 'random', name: '随机学习', description: '随机选择内容' },
  ],
};
