import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { QuizSettings } from '../types';
import { useMemo } from 'react';
import { useAuthState } from '../hooks/useAuth';
import { wordAPI } from '../utils/api';
import { createGameTextsSlice, GameTextsSlice } from './gameTextsSlice';
import { getDefaultTextConfig } from '../utils/gameTextConfig';
// 导入新的slice
import { createConfigSlice, ConfigSlice } from './slices/configSlice';
import { createUISlice, UISlice } from './slices/uiSlice';
import { createAuthSlice, AuthSlice } from './slices/authSlice';
import { createSoundSlice, SoundSlice } from './slices/soundSlice';
import { BUILTIN_DEFAULTS } from '../lib/config';

// ==================== 类型定义 ====================

// 用户进度类型（来自 RPC）
interface UserProgress {
  total_words: number;
  mastered_words: number;
  remaining_words: number;
  learning_words: number; // 正在学习的单词数
}

// 游客配置类型（来自 AppConfig）
interface GuestConfig {
  [key: string]: any;
}

// 用户资料类型
export interface UserProfile {
  id: string
  role: 'admin' | 'teacher' | 'parent' | 'student'
  display_name: string
  avatar_url?: string
  settings?: any // JSONB 格式，可存储用户偏好
  has_password_set?: boolean // 是否已设置密码
  membership_expires_at?: string | null // 会员到期时间戳
}

// 应用状态接口 - 集成所有slice
interface AppState extends GameTextsSlice, ConfigSlice, UISlice, AuthSlice, SoundSlice {
  // ==================== Data 状态（保留现有数据管理） ====================
  dataLoading: boolean; // 数据加载状态（默认为 false）
  userSettings: any | null;
  userProgress: UserProgress | null;

  // ==================== Actions - 异步（处理数据加载） ====================
  // 【关键】异步的 Data Actions
  loadUserData: (session: Session) => Promise<void>; // 只设置 dataLoading: true, userSettings, userProgress...
  loadGuestData: () => Promise<void>; // 只设置 dataLoading: true, appConfig...
  clearAllData: () => Promise<void>; // 只设置 session: null, userSettings: null...

  // Actions - 服务器优先的缓存更新
  updateSettings: (settings: any) => Promise<void>;
  updateProgress: (progress: UserProgress) => void;

  // Actions - 学习进度管理
  getProgress: (collectionId: string) => Promise<UserProgress | null>;
  refreshProgress: (collectionId: string) => Promise<UserProgress | null>;
  submitSessionResults: (results: Array<{ word_id: string; is_correct: boolean }>) => Promise<{ success: boolean; error?: string }>;

  // Actions - 首页数据管理
  loadHomepageData: () => Promise<void>;

  // UI状态和认证状态现在由slice管理，无需重复定义
}

// ==================== Store 实现 ====================

/**
 * 中央 Zustand Store - 统一管理所有应用状态
 *
 * 核心特性：
 * - 分离 Auth（认证）和 Data（数据）状态
 * - 同步的 Auth Actions（只设置状态）
 * - 异步的 Data Actions（处理数据加载）
 * - 服务器优先的缓存更新策略
 */
export const useAppStore = create<AppState>((set, get) => ({
  // ==================== 集成所有 Slice ====================
  ...createGameTextsSlice(set, get),
  ...createConfigSlice(set, get),
  ...createUISlice(set, get),
  ...createAuthSlice(set, get),
  ...createSoundSlice(set, get),

  // ==================== 保留的数据状态 ====================
  // Data 状态初始值
  dataLoading: false, // 数据加载默认 false
  userSettings: null,
  userProgress: null,

  // 认证相关Actions现在由AuthSlice提供

  // ==================== Actions - 异步（数据加载） ====================

  /**
   * 【关键】异步的 Data Action - 加载游客配置
   * 现在委托给ConfigSlice处理
   */
  loadGuestData: async () => {
    console.log('📦 [AppStore] 开始加载游客配置...');
    try {
      set({ dataLoading: true });

      // 委托给ConfigSlice处理
      await get().loadGuestConfig();

      // 初始化音效系统 (无论游客还是用户都初始化)
      get().initSounds();

      set({ dataLoading: false });
    } catch (error) {
      console.error('❌ [AppStore] 游客配置加载失败:', error);
      set({ dataLoading: false });
    }
  },

  /**
   * 【关键】异步的 Data Action - 加载用户数据
   * 现在委托给AuthSlice和ConfigSlice处理
   */
  loadUserData: async (session: Session) => {
    console.log('👤 [AppStore] 开始加载用户数据...');
    try {
      set({ dataLoading: true });

      // 调用 Gatekeeper 中的 fetchUserData
      const { fetchUserData } = await import('../components/Gatekeeper');
      const userData = await fetchUserData();

      console.log('✅ [AppStore] 用户数据加载完成:', userData);

      // 委托给AuthSlice设置用户资料
      get().setAuthProfile(userData.profile);

      // 委托给ConfigSlice设置用户配置
      get().setUserConfig(userData.settings);

      // 设置用户设置（保留现有逻辑）
      set({ userSettings: userData.settings, dataLoading: false });

      // 初始化音效系统
      get().initSounds();
    } catch (error) {
      console.error('❌ [AppStore] 用户数据加载失败:', error);
      set({ dataLoading: false });
    }
  },

  /**
   * 【关键】异步的 Data Action - 清理所有数据（登出时调用）
   * 现在委托给各个slice处理
   */
  clearAllData: async () => {
    console.log('🧹 [AppStore] 清除所有用户数据...');

    // 委托给AuthSlice清理认证数据
    get().clearAuthData();

    // 委托给ConfigSlice清理用户配置
    get().setUserConfig(null);

    // 清理剩余的数据状态
    set({
      userSettings: null,
      userProgress: null,
      dataLoading: false,
    });
    console.log('✅ [AppStore] 用户数据清理完成');
  },

  // ==================== Actions - 服务器优先更新 ====================

  /**
   * 更新用户设置（服务器优先策略）
   */
  updateSettings: async (newSettings: any) => {
    console.log('💾 [AppStore.updateSettings] 收到更新请求:', newSettings);
    console.log('💾 [AppStore.updateSettings] 当前 userSettings:', get().userSettings);

    const currentSettings = get().userSettings || {};
    const mergedSettings = {
      ...currentSettings,
      ...newSettings,
    };

    console.log('💾 [AppStore.updateSettings] 合并后的设置:', mergedSettings);
    set({ userSettings: mergedSettings });
    console.log('✅ [AppStore.updateSettings] 本地缓存已更新');
  },

  /**
   * 更新用户进度（服务器优先策略）
   */
  updateProgress: (progress: UserProgress) => {
    console.log('📊 [AppStore] 更新用户进度:', progress);
    set({ userProgress: progress });
  },

  // ==================== Actions - 学习进度管理 ====================

  /**
   * 获取学习进度（从服务器获取并缓存）
   */
  getProgress: async (collectionId: string) => {
    console.log('📊 [AppStore] 获取学习进度:', collectionId);

    try {
      // 动态导入 supabase
      const resp = await wordAPI.getCollectionProgress?.(collectionId);
      if (!resp || !resp.success) {
        return null;
      }
      const data = resp.data as any;
      if (data) {
        set({ userProgress: data });
        return data;
      }

      return null;
    } catch (error) {
      console.error('❌ [AppStore] 获取学习进度异常:', error);
      return null;
    }
  },

  /**
   * 刷新学习进度（强制从服务器重新获取）
   */
  refreshProgress: async (collectionId: string) => {
    console.log('🔄 [AppStore] 刷新学习进度:', collectionId);
    return get().getProgress(collectionId);
  },

  /**
   * 提交学习会话结果（服务器优先策略）
   * 先提交到服务器，成功后更新本地缓存
   */
  submitSessionResults: async (results: Array<{ word_id: string; is_correct: boolean }>) => {
    console.log('💾 [AppStore] 提交学习会话结果:', results.length, '条记录');

    try {
      // 动态导入 supabase
      const resp = await wordAPI.recordSessionResults?.(results);
      if (!resp || !resp.success) {
        return { success: false, error: resp?.error };
      }

      // 步骤2: 刷新本地进度缓存
      // 获取当前用户设置中的 collection_id
      const { userSettings } = get();
      const collectionId = userSettings?.collectionId;

      if (collectionId) {
        console.log('🔄 [AppStore] 刷新本地进度缓存...');
        await get().getProgress(collectionId);
      }

      return { success: true };
    } catch (error) {
      console.error('❌ [AppStore] 提交学习结果异常:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  },

  // ==================== Actions - 首页数据管理 ====================

  /**
   * 加载首页数据（包含游戏信息、当前教材和学习进度）
   */
  loadHomepageData: async () => {
    console.log('🏠 [AppStore] 开始加载首页数据...');
    try {
      set({ gamesLoading: true });

      const resp = await wordAPI.getHomepageData?.();
      if (!resp || !resp.success) {
        console.error('❌ [AppStore] 首页数据加载失败:', resp?.error);
        set({ gamesLoading: false });
        return;
      }

      // data now returns HomepageGameGroup[], we need to flatten it for 'games' state 
      // but keep structure for 'homepageGroups' state if we want to use it in UI
      const groups = resp.data || [];
      console.log('✅ [AppStore] 首页数据加载完成:', groups.length, '个分组');

      // Flatten for legacy compatibility
      const allGames: any[] = [];
      groups.forEach((group: any) => {
        if (group.games && Array.isArray(group.games)) {
          allGames.push(...group.games);
        }
      });

      // 更新games状态
      set({
        games: allGames,
        homepageGroups: groups,
        gamesLoading: false
      });
    } catch (error) {
      console.error('❌ [AppStore] 首页数据加载异常:', error);
      set({ gamesLoading: false });
    }
  },

  // UI Actions现在由UISlice提供
}));

// ==================== 选择器辅助函数 ====================

/**
 * 便捷的选择器函数，避免重复计算
 * 现在使用新的slice状态
 */
export const appStoreSelectors = {
  // 获取完整的设置（合并游客和用户设置）
  getFullSettings: () => {
    const state = useAppStore.getState();

    if (state.userConfig) {
      return {
        ...state.guestConfig,
        ...state.userConfig,
      };
    }

    return state.guestConfig;
  },

  // 检查是否已加载数据
  isDataLoaded: () => {
    const state = useAppStore.getState();
    return !state.configLoading && state.guestConfig !== null;
  },

  // 检查是否为登录用户
  isLoggedIn: () => {
    const state = useAppStore.getState();
    return state.userConfig !== null;
  },

  // === 与原 useAppConfig 兼容的方法 ===

  /**
   * 获取特定配置项（兼容 useAppConfig.getConfig）
   * 现在委托给ConfigSlice处理
   */
  getConfig: (key: string) => {
    const state = useAppStore.getState();
    return state.getConfig(key);

  },

  /**
   * 获取配置项的类别（兼容 useAppConfig.getConfigCategory）
   */
  getConfigCategory: (key: string) => {
    const state = useAppStore.getState();
    return state.getConfigCategory(key);
  },

  /**
   * 检查数据源（兼容 useAppConfig.dataSource）
   */
  getDataSource: () => {
    const state = useAppStore.getState();
    if (state.configLoading) return null;
    return state.userConfig ? 'user' : 'guest';
  },

  /**
   * 检查是否正在加载（兼容 useAppConfig.loading）
   */
  isLoading: () => {
    const state = useAppStore.getState();
    return state.configLoading;
  },

  /**
   * 获取错误信息（兼容 useAppConfig.error）
   */
  getError: () => {
    const state = useAppStore.getState();
    return state.configError;
  },
};

// ==================== 导出默认 Hook ====================

// 主要的 Hook，使用默认的 zustand store
export const useAppData = useAppStore;

// 为了向后兼容，也可以使用命名导出
export { useAppStore as default };

// ==================== 答题设置 Hook ====================

/**
 * 专门用于答题设置的 Hook
 * 从 Zustand Store 读取设置，优先级：userSettings > guestConfig > 默认值
 */
/**
 * 核心逻辑：合并获取完整设置
 * 这是一个纯函数，确保在任何地方（设置页、首页开始游戏）逻辑完全一致
 */
export const getMergedQuizSettings = (
  gameId: string,
  userSettings: any,
  guestConfig: any,
  defaultConfig?: Partial<QuizSettings>
): QuizSettings => {
  // 1. 确定保底的基础默认值 (BUILTIN_DEFAULTS.guess_word_settings)
  // 注意：我们将 BUILTIN_DEFAULTS 中的 learningStrategy 统一为 selectionStrategy
  const globalBaseDefaults = {
    ...(BUILTIN_DEFAULTS.guess_word_settings || {}),
    selectionStrategy: BUILTIN_DEFAULTS.guess_word_settings?.selectionStrategy ||
      BUILTIN_DEFAULTS.guess_word_settings?.learningStrategy || 'sequential',
    collectionId: BUILTIN_DEFAULTS.default_collection_id || '',
    tts: { ...BUILTIN_DEFAULTS.tts_defaults },
    showPinyin: false,
    gameMode: 'practice'
  };

  // 2. 确定该游戏的特定默认配置 (来自数据库 games 表的 default_config 或传入的 defaultConfig)
  const gameDefaultConfig = defaultConfig || guestConfig?.games?.[gameId]?.default_config || {};

  // 3. 确定用户针对该游戏的特定设置
  let savedSettings = {};
  if (userSettings && userSettings[gameId]) {
    savedSettings = userSettings[gameId];
  } else if (userSettings && gameId === 'guess_word' && (userSettings as any).questionType) {
    // 兼容旧版扁平化存储
    savedSettings = userSettings;
  }

  // 4. 执行多层级合并：全局默认 < 游戏默认 < 用户设置
  const merged = {
    ...globalBaseDefaults,
    ...gameDefaultConfig,
    ...savedSettings,
  } as any;

  // 5. 确保 TTS 和字段命名的最终补全（深度补全）
  // 处理 selectionStrategy vs learningStrategy 的历史遗留问题
  const finalSelectionStrategy = merged.selectionStrategy || merged.learningStrategy || 'sequential';

  // 确保 TTS 结构完整
  const finalTts = {
    ...globalBaseDefaults.tts,
    ...(gameDefaultConfig.tts || {}),
    ...(merged.tts || {})
  };

  const finalSettings: QuizSettings = {
    ...merged,
    selectionStrategy: finalSelectionStrategy,
    tts: finalTts,
    // 强制校验枚举值防止脏数据
    gameMode: (merged.gameMode === 'exam' ? 'exam' : 'practice'),
    questionType: (merged.questionType === 'audio' ? 'audio' : 'text'),
    answerType: (merged.answerType === 'fill' ? 'fill' : 'choice'),
  };

  return finalSettings;
};

// ==================== 答题设置 Hook ====================

/**
 * 专门用于答题设置的 Hook
 * 从 Zustand Store 读取设置，优先级：userSettings > guestConfig > 默认值
 */
export const useQuizSettings = (gameId: string, defaultConfig?: Partial<QuizSettings>) => {
  // 直接使用 Zustand store 和 useAuthState
  const { session, profile: storeProfile } = useAppStore();
  const user = session?.user ?? null;
  const profile = storeProfile;
  const { updateUserSettings } = useAuthState();

  // 从 Zustand Store 订阅设置（服务器优先缓存）
  const userSettings = useAppStore(state => state.userSettings);
  const guestConfig = useAppStore(state => state.guestConfig);

  // 合并获取完整设置
  const settings = useMemo(() => {
    console.log(`🔍 [useQuizSettings] 开始读取设置 [${gameId}]`);
    const finalSettings = getMergedQuizSettings(gameId, userSettings, guestConfig, defaultConfig);
    console.log(`📖 [useQuizSettings] 最终合并设置 [${gameId}]:`, finalSettings);
    return finalSettings;
  }, [userSettings, guestConfig, gameId, defaultConfig]);

  // 【服务器优先】更新设置的函数
  const setSettings = async (newSettings: Partial<QuizSettings> | ((prev: Partial<QuizSettings>) => Partial<QuizSettings>)) => {
    // 计算新设置
    const safeSettings = {
      ...settings,
      gameMode: (settings.gameMode === 'exam' ? 'exam' : 'practice') as 'practice' | 'exam'
    };

    const computedSettings = newSettings instanceof Function
      ? newSettings(safeSettings)
      : { ...safeSettings, ...newSettings };

    console.log(`🔄 [useQuizSettings] 准备更新设置 [${gameId}] (服务器优先):`, computedSettings);

    // 如果用户已登录，先同步到服务器
    if (user && profile) {
      try {
        // 构造更新对象：{ [gameId]: computedSettings }
        const updates = { [gameId]: computedSettings };

        // 步骤1: 更新服务器
        console.log('📡 [useQuizSettings] 步骤1: 更新服务器...');
        // updateUserSettings 会执行深度合并
        const result = await updateUserSettings(updates);

        if (!result.success) {
          console.error('❌ [useQuizSettings] 服务器更新失败:', result.error);
          alert(`设置保存失败: ${result.error}`);
          return { success: false, error: result.error };
        }

        console.log('✅ [useQuizSettings] 步骤1完成: 服务器更新成功');

        // 步骤2: 更新本地缓存
        console.log('💾 [useQuizSettings] 步骤2: 更新本地缓存...');
        useAppStore.getState().updateSettings(updates);
        console.log('✅ [useQuizSettings] 步骤2完成: 本地缓存已更新');

        return { success: true };
      } catch (error) {
        console.error('❌ [useQuizSettings] 更新失败:', error);
        alert('设置保存失败，请稍后重试');
        return { success: false, error: '网络错误' };
      }
    } else {
      // 游客模式：只更新本地缓存（不支持持久化）
      // 注意：游客模式下我们也模拟这种结构，或者只更新当前游戏的临时配置
      // 为了简单起见，我们更新本地 store 的 userSettings（虽然它叫 userSettings，但在游客模式下也可以用作临时存储）
      console.log('⚠️ [useQuizSettings] 游客模式，仅更新本地缓存（不持久化）');
      const updates = { [gameId]: computedSettings };
      useAppStore.getState().updateSettings(updates);
      return { success: true };
    }
  };

  return { settings, setSettings };
};

// ==================== 游戏文本配置 Hook ====================

/**
 * Hook: 获取游戏文本配置
 * 
 * @param gameId 游戏ID
 * @returns 游戏的文本配置
 * 
 * @example
 * const texts = useGameTexts('guess_word');
 * console.log(texts.itemName); // "单词"
 */
export const useGameTexts = (gameId: string) => {
  // 直接从 store 获取 games 数组
  const games = useAppStore(state => state.games);

  // 使用 useMemo 缓存结果,只有当 games 或 gameId 变化时才重新计算
  return useMemo(() => {
    if (!gameId) return getDefaultTextConfig();
    const game = games?.find(g => g.id === gameId);
    return game?.text_config || getDefaultTextConfig();
  }, [games, gameId]);
};

/**
 * 导出格式化消息的工具函数
 * 方便在组件中使用
 */
export { formatMessage } from '../utils/gameTextConfig';
