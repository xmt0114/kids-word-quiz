import { supabase } from '../../lib/supabase';
import { BUILTIN_DEFAULTS } from '../../lib/config';

// 应用配置接口
export interface AppConfig {
  [key: string]: any;
}

// 内置默认值已移动到 src/lib/config.ts

/**
 * 配置管理 Slice 接口
 * 
 * 职责：
 * - 管理应用配置数据（游客配置和用户配置）
 * - 处理配置加载状态和错误
 * - 提供配置获取和更新方法
 * - 替代当前的useAppConfig和AppContext
 */
export interface ConfigSlice {
  // 状态
  guestConfig: AppConfig | null;
  userConfig: AppConfig | null;
  configLoading: boolean;
  configError: string | null;
  dataSource: 'cloud' | 'builtin' | null;

  // Actions
  setGuestConfig: (config: AppConfig | null) => void;
  setUserConfig: (config: AppConfig | null) => void;
  setConfigLoading: (loading: boolean) => void;
  setConfigError: (error: string | null) => void;
  setDataSource: (source: 'cloud' | 'builtin' | null) => void;

  // 业务方法
  loadGuestConfig: () => Promise<void>;
  loadUserConfig: () => Promise<void>;
  getConfig: (key: string) => any;
  getConfigCategory: (key: string) => string;
  refreshConfig: () => Promise<void>;
}

/**
 * 创建配置管理 Slice
 * 
 * 实现配置优先级处理：用户配置 > 游客配置 > 默认配置
 */
export const createConfigSlice = (
  set: any,
  get: any
): ConfigSlice => ({
  // 初始状态
  guestConfig: null,
  userConfig: null,
  configLoading: true,
  configError: null,
  dataSource: null,

  // 基础 Actions
  setGuestConfig: (config: AppConfig | null) => {
    console.log('📦 [ConfigSlice] 设置游客配置:', config ? Object.keys(config) : 'null');
    set({ guestConfig: config });
  },

  setUserConfig: (config: AppConfig | null) => {
    console.log('👤 [ConfigSlice] 设置用户配置:', config ? Object.keys(config) : 'null');
    set({ userConfig: config });
  },

  setConfigLoading: (loading: boolean) => {
    set({ configLoading: loading });
  },

  setConfigError: (error: string | null) => {
    set({ configError: error });
  },

  setDataSource: (source: 'cloud' | 'builtin' | null) => {
    set({ dataSource: source });
  },

  // 业务方法

  /**
   * 加载游客配置（从数据库的 app_config 表）
   */
  loadGuestConfig: async () => {
    console.log('📦 [ConfigSlice] 开始加载游客配置...');

    try {
      set({ configLoading: true, configError: null });

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

        set({
          guestConfig: mergedConfig,
          dataSource: 'cloud',
          configLoading: false
        });

        console.log('✅ [ConfigSlice] 成功从数据库加载游客配置:', data.length, '项');
      } else {
        console.warn('⚠️ [ConfigSlice] 数据库无配置，使用内置默认值');
        set({
          guestConfig: BUILTIN_DEFAULTS,
          dataSource: 'builtin',
          configLoading: false
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error('❌ [ConfigSlice] 加载游客配置失败:', errorMessage);

      set({
        configError: errorMessage,
        guestConfig: BUILTIN_DEFAULTS,
        dataSource: 'builtin',
        configLoading: false
      });
    }
  },

  /**
   * 加载用户配置（从用户的 settings 字段）
   */
  loadUserConfig: async () => {
    console.log('👤 [ConfigSlice] 开始加载用户配置...');

    // 这个方法将在认证完成后被调用
    // 目前先设置为空，实际的用户配置会通过 setUserConfig 设置
    set({ userConfig: null });
  },

  /**
   * 获取特定配置项（实现配置优先级）
   * 优先级：用户配置 > 游客配置 > 内置默认值
   */
  getConfig: (key: string) => {
    const state = get();

    // 1. 优先从用户配置获取
    if (state.userConfig && state.userConfig[key] !== undefined) {
      return state.userConfig[key];
    }

    // 2. 其次从游客配置获取
    if (state.guestConfig && state.guestConfig[key] !== undefined) {
      return state.guestConfig[key];
    }

    // 3. 最后使用内置默认值
    return BUILTIN_DEFAULTS[key] ?? null;
  },

  /**
   * 获取配置项的类别
   */
  getConfigCategory: (key: string) => {
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
  },

  /**
   * 刷新配置（重新加载游客配置）
   */
  refreshConfig: async () => {
    console.log('🔄 [ConfigSlice] 刷新配置...');
    await get().loadGuestConfig();
  },
});