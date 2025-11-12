// 默认设置提供器
// 整合 app_config 和内置默认值
import { useAppConfig } from './useAppConfig';

// QuizSettings 默认值
export function useDefaultQuizSettings() {
  const { config, loading } = useAppConfig();
  
  return {
    loading,
    defaults: {
      questionType: 'text',
      answerType: 'choice',
      selectionStrategy: 'sequential',
      collectionId: config.default_collection_id || '11111111-1111-1111-1111-111111111111',
      tts: config.tts_defaults || {
        lang: 'en-US',
        rate: 0.8,
        pitch: 1.0,
        volume: 1.0,
      },
    },
  };
}

// QuizStats 默认值
export function useDefaultQuizStats() {
  const { config, loading } = useAppConfig();
  
  return {
    loading,
    defaults: config.default_stats || {
      totalGames: 0,
      totalCorrect: 0,
      bestScore: 0,
      averageScore: 0,
      lastPlayed: null,
    },
  };
}
