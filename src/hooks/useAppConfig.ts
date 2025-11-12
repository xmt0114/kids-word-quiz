import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface AppConfig {
  [key: string]: any;
}

// 内置默认值（fallback）- 保持与数据库配置一致
const BUILTIN_DEFAULTS: Record<string, any> = {
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
    totalQuestions: 10,
    optionCount: 3,
    shuffleWords: true,
    defaultTimeLimit: 300,
  },
  default_collection_id: '11111111-1111-1111-1111-111111111111',
  tts_defaults: {
    lang: 'en-US',
    rate: 0.8,
    pitch: 1.0,
    volume: 1.0,
    voiceId: 'default',
  },
  supported_games: [
    {
      id: 'guess_word',
      name: '猜单词',
      description: '根据提示猜测单词',
      category: 'vocabulary',
      enabled: true,
    },
    {
      id: 'spelling_bee',
      name: '拼写蜜蜂',
      description: '听音拼词游戏',
      category: 'spelling',
      enabled: false,
    },
    {
      id: 'word_match',
      name: '单词匹配',
      description: '单词与释义匹配',
      category: 'comprehension',
      enabled: false,
    },
  ],
  guess_word_settings: {
    questionType: 'text',
    answerType: 'choice',
    learningStrategy: 'sequential',
    hintsEnabled: true,
    showPhonetic: true,
    showDefinition: true,
  },
  difficulty_levels: [
    { id: 'easy', name: '简单', description: '适合初学者' },
    { id: 'medium', name: '中等', description: '适合有一定基础的学习者' },
    { id: 'hard', name: '困难', description: '适合高级学习者' },
  ],
  question_types: [
    { id: 'text', name: '文字题干', description: '在屏幕上显示题目描述' },
    { id: 'image', name: '图片题干', description: '通过图片显示题目' },
    { id: 'audio', name: '音频题干', description: '通过语音播放题目' },
  ],
  answer_types: [
    { id: 'choice', name: '选择题', description: '从选项中选择答案' },
    { id: 'input', name: '填空题', description: '手动输入答案' },
    { id: 'audio', name: '语音答题', description: '通过语音回答' },
  ],
  learning_strategies: [
    { id: 'sequential', name: '顺序学习', description: '按顺序学习内容' },
    { id: 'random', name: '随机学习', description: '随机选择内容' },
    { id: 'spaced_repetition', name: '间隔重复', description: '根据记忆曲线重复学习' },
    { id: 'adaptive', name: '自适应学习', description: '根据表现调整难度' },
  ],
};

export function useAppConfig() {
  console.log('🔄 [useAppConfig] Hook 被调用');
  const [config, setConfig] = useState<AppConfig>(BUILTIN_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'cloud' | 'builtin' | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [useAppConfig] 正在从数据库加载配置...');

      const { data, error: fetchError } = await supabase
        .from('app_config')
        .select('key, value');

      if (fetchError) {
        throw fetchError;
      }

      if (data && data.length > 0) {
        // 转换数据格式
        const configMap = data.reduce((acc, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {} as AppConfig);

        // 合并内置默认值（确保所有必需的配置项都存在）
        const mergedConfig = { ...BUILTIN_DEFAULTS, ...configMap };

        setConfig(mergedConfig);
        setDataSource('cloud');
        console.log('✅ [useAppConfig] 成功从数据库加载配置:', data.length, '项');
        console.log('📊 [useAppConfig] 配置项:', Object.keys(mergedConfig));
      } else {
        console.warn('⚠️ [useAppConfig] 数据库无配置，使用内置默认值');
        setConfig(BUILTIN_DEFAULTS);
        setDataSource('builtin');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      console.error('❌ [useAppConfig] 加载配置失败:', errorMessage);
      setError(errorMessage);
      setConfig(BUILTIN_DEFAULTS);
      setDataSource('builtin');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // 获取特定配置项
  const getConfig = useCallback((key: string) => {
    return config[key] ?? BUILTIN_DEFAULTS[key] ?? null;
  }, [config]);

  // 获取配置项的类别
  const getConfigCategory = useCallback((key: string) => {
    // 这些信息需要从数据库实时查询，这里仅作示例
    if (['app_settings', 'default_stats', 'game_constants', 'default_collection_id', 'tts_defaults'].includes(key)) {
      return 'app';
    }
    if (['supported_games', 'guess_word_settings'].includes(key)) {
      return 'games';
    }
    if (['difficulty_levels', 'question_types', 'answer_types', 'learning_strategies'].includes(key)) {
      return 'universal';
    }
    return 'unknown';
  }, []);

  // 刷新配置
  const refreshConfig = useCallback(() => {
    loadConfig();
  }, [loadConfig]);

  return {
    config,
    loading,
    error,
    dataSource,
    getConfig,
    getConfigCategory,
    refreshConfig,
  };
}
