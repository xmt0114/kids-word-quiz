// 应用配置管理
// 提供全局可用的配置值

// 游戏常量默认值
export const GAME_CONFIG = {
  TOTAL_QUESTIONS: 10, // 题目总数
  OPTION_COUNT: 3, // 选项数量
  SHUFFLE_WORDS: true, // 是否打乱单词
  DEFAULT_TIME_LIMIT: 300, // 默认时间限制（秒）
} as const;

// 默认教材ID
export const DEFAULT_COLLECTION_ID = '11111111-1111-1111-1111-111111111111';

// TTS默认配置
export const TTS_CONFIG = {
  lang: 'en-US',
  rate: 0.8,
  pitch: 1.0,
  volume: 1.0,
  voiceId: 'default',
} as const;

// 注意：这些是默认配置
// 实际运行时，应使用 useAppConfig hook 从数据库动态加载配置
// 这样可以实现热更新和配置管理
