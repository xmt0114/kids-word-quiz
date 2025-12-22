import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { BUILTIN_DEFAULTS } from '../lib/config';

export interface AppConfig {
  [key: string]: any;
}

// 内置默认值已移动到 src/lib/config.ts

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
