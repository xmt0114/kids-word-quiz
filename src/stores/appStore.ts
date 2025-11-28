import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { QuizSettings } from '../types';
import { useMemo } from 'react';
import { useAuth, useAuthState } from '../hooks/useAuth';
import { wordAPI } from '../utils/api';

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
}

// 应用状态接口
interface AppState {
  // ==================== Auth 状态（只管认证） ====================
  authLoading: boolean; // 认证加载状态（默认为 true）
  session: Session | null; // 认证会话
  authProfile: UserProfile | null; // 用户资料

  // ==================== Data 状态（只管数据） ====================
  dataLoading: boolean; // 数据加载状态（默认为 false）
  guestConfig: GuestConfig | null;
  userSettings: any | null;
  userProgress: UserProgress | null;

  // ==================== Actions - 同步（只设置状态） ====================
  // 【关键】同步的 Auth Action
  setAuth: (session: Session | null) => void; // 只设置 session 和 authLoading: false
  setAuthProfile: (profile: UserProfile | null) => void;

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

  // ==================== UI 状态 ====================
  loginModal: {
    isOpen: boolean;
    action: string; // 例如 "开始游戏"、"登录" 等提示文案
  };
  openLoginModal: (action?: string) => void;
  closeLoginModal: () => void;
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
  // ==================== 初始状态 ====================
  // Auth 状态初始值
  authLoading: true, // 认证加载默认 true
  session: null,
  authProfile: null,

  // Data 状态初始值
  dataLoading: false, // 数据加载默认 false
  guestConfig: null,
  userSettings: null,
  userProgress: null,

  // ==================== Actions - 同步（认证相关） ====================

  /**
   * 【关键】同步的 Auth Action
   * 只设置 session 和 authLoading: false
   */
  setAuth: (session: Session | null) => {
    console.log('🔑 [AppStore] 设置认证状态:', session?.user?.id);
    set({ session, authLoading: false });
  },

  setAuthProfile: (profile: UserProfile | null) => {
    console.log('👤 [AppStore] 设置用户资料:', profile?.id);
    set({ authProfile: profile });
  },

  // ==================== Actions - 异步（数据加载） ====================

  /**
   * 【关键】异步的 Data Action - 加载游客配置
   * 只负责加载配置，不清理用户数据（清理在登出时完成）
   */
  loadGuestData: async () => {
    console.log('📦 [AppStore] 开始加载游客配置...');
    try {
      set({ dataLoading: true });

      // 调用 Gatekeeper 中的 fetchGuestConfig
      const { fetchGuestConfig } = await import('../components/Gatekeeper');
      const guestConfig = await fetchGuestConfig();

      console.log('✅ [AppStore] 游客配置加载完成:', guestConfig);
      set({ guestConfig, dataLoading: false });
    } catch (error) {
      console.error('❌ [AppStore] 游客配置加载失败:', error);
      set({ dataLoading: false });
    }
  },

  /**
   * 【关键】异步的 Data Action - 加载用户数据
   */
  loadUserData: async (session: Session) => {
    console.log('👤 [AppStore] 开始加载用户数据...');
    try {
      set({ dataLoading: true });

      // 调用 Gatekeeper 中的 fetchUserData
      const { fetchUserData } = await import('../components/Gatekeeper');
      const userData = await fetchUserData();

      console.log('✅ [AppStore] 用户数据加载完成:', userData);

      // 设置用户资料（触发登录页面跳转）
      set({ authProfile: userData.profile });

      // 设置用户设置
      set({ userSettings: userData.settings, dataLoading: false });
    } catch (error) {
      console.error('❌ [AppStore] 用户数据加载失败:', error);
      set({ dataLoading: false });
    }
  },

  /**
   * 【关键】异步的 Data Action - 清理所有数据（登出时调用）
   * 清理所有用户相关数据，确保完全切换到游客模式
   */
  clearAllData: async () => {
    console.log('🧹 [AppStore] 清除所有用户数据...');
    set({
      session: null,
      authProfile: null, // 清理用户资料（重要！）
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

  // ==================== UI Actions ====================
  loginModal: {
    isOpen: false,
    action: '登录',
  },

  openLoginModal: (action = '登录') => {
    console.log('UI [AppStore] 打开登录弹框:', action);
    set({ loginModal: { isOpen: true, action } });
  },

  closeLoginModal: () => {
    console.log('UI [AppStore] 关闭登录弹框');
    set({ loginModal: { isOpen: false, action: '登录' } });
  },
}));

// ==================== 选择器辅助函数 ====================

/**
 * 便捷的选择器函数，避免重复计算
 */
export const appStoreSelectors = {
  // 获取完整的设置（合并游客和用户设置）
  getFullSettings: () => {
    const { guestConfig, userSettings } = useAppStore.getState();

    if (userSettings) {
      return {
        ...guestConfig,
        ...userSettings,
        // 确保优先级正确
        ...userSettings,
      };
    }

    return guestConfig;
  },

  // 检查是否已加载数据
  isDataLoaded: () => {
    const { dataLoading, guestConfig } = useAppStore.getState();
    return !dataLoading && guestConfig !== null;
  },

  // 检查是否为登录用户
  isLoggedIn: () => {
    const { userSettings } = useAppStore.getState();
    return userSettings !== null;
  },

  // === 与原 useAppConfig 兼容的方法 ===

  /**
   * 获取特定配置项（兼容 useAppConfig.getConfig）
   */
  getConfig: (key: string) => {
    const { guestConfig, userSettings } = useAppStore.getState();

    // 优先从用户设置获取
    if (userSettings && userSettings[key as keyof typeof userSettings]) {
      return userSettings[key as keyof typeof userSettings];
    }

    // 其次从游客配置获取
    if (guestConfig && guestConfig[key]) {
      return guestConfig[key];
    }

    // 返回内置默认值
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
      default_collection_id: '',
      tts_defaults: {
        lang: 'en-US',
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        voiceName: 'default',
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

    return BUILTIN_DEFAULTS[key] ?? null;
  },

  /**
   * 获取配置项的类别（兼容 useAppConfig.getConfigCategory）
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
   * 检查数据源（兼容 useAppConfig.dataSource）
   */
  getDataSource: () => {
    const { userSettings, dataLoading } = useAppStore.getState();
    if (dataLoading) return null;
    return userSettings ? 'user' : 'guest';
  },

  /**
   * 检查是否正在加载（兼容 useAppConfig.loading）
   */
  isLoading: () => {
    const { dataLoading } = useAppStore.getState();
    return dataLoading;
  },

  /**
   * 获取错误信息（兼容 useAppConfig.error）
   */
  getError: () => {
    // Store 当前不存储错误，但可以为未来扩展预留
    return null;
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
export const useQuizSettings = (gameId: string = 'guess_word', defaultConfig?: Partial<QuizSettings>) => {
  const { user } = useAuth();
  const { profile, updateUserSettings } = useAuthState();

  // 从 Zustand Store 订阅设置（服务器优先缓存）
  const userSettings = useAppStore(state => state.userSettings);
  const guestConfig = useAppStore(state => state.guestConfig);

  // 合并获取完整设置
  const settings = useMemo(() => {
    console.log(`🔍 [useQuizSettings] 开始读取设置 [${gameId}]`, {
      hasUserSettings: !!userSettings,
      userSettingsKeys: userSettings ? Object.keys(userSettings) : [],
      hasGuestConfig: !!guestConfig,
      hasDefaultConfig: !!defaultConfig
    });

    // 1. 尝试获取特定游戏的设置
    if (userSettings && userSettings[gameId]) {
      console.log(`📖 [useQuizSettings] 从用户设置读取 [${gameId}]:`, userSettings[gameId]);
      return userSettings[gameId] as QuizSettings;
    }

    // 2. 兼容旧数据（如果 userSettings 是扁平结构且 gameId 为 guess_word）
    if (gameId === 'guess_word' && userSettings && userSettings.questionType) {
      console.log('📖 [useQuizSettings] 从旧版用户设置读取:', userSettings);
      return userSettings as QuizSettings;
    }

    // 3. 否则使用游客配置或默认值
    if (guestConfig) {
      // 尝试从 guestConfig 获取特定游戏的默认配置
      // 假设 guestConfig 中有 games 配置，或者使用 guess_word_settings 作为默认
      // 优先使用传入的 defaultConfig (来自 GameSettingsPage 的 gameInfo)
      const gameConfig = defaultConfig || guestConfig.games?.[gameId]?.default_config || guestConfig.guess_word_settings || {};
      const ttsDefaults = guestConfig.tts_defaults || {};
      const defaultCollectionId = guestConfig.default_collection_id || '';

      // 根据游戏语言设置默认语速：中文1.0（正常），英文0.8（稍慢）
      const gameLang = gameConfig.language || 'en';
      const defaultRate = gameLang === 'zh' ? 1.0 : 0.8;

      const mergedSettings = {
        questionType: gameConfig.questionType || 'text',
        answerType: gameConfig.answerType || 'choice',
        selectionStrategy: gameConfig.learningStrategy || 'sequential',
        collectionId: defaultCollectionId,
        tts: {
          lang: ttsDefaults.lang || 'en-US',
          rate: ttsDefaults.rate !== undefined ? ttsDefaults.rate : defaultRate,
          pitch: ttsDefaults.pitch || 1.0,
          volume: ttsDefaults.volume || 1.0,
          voiceName: ttsDefaults.voiceName || 'default',
        },
        showPinyin: gameConfig.showPinyin || false,
      };

      console.log(`📖 [useQuizSettings] 从游客配置/默认配置读取 [${gameId}]:`, mergedSettings);
      return mergedSettings as QuizSettings;
    }

    // 4. 兜底：内置默认值
    console.log('📖 [useQuizSettings] 使用内置默认值');
    // 如果有传入 defaultConfig，优先使用
    if (defaultConfig) {
      return {
        questionType: defaultConfig.questionType || 'text',
        answerType: defaultConfig.answerType || 'choice',
        selectionStrategy: defaultConfig.selectionStrategy || 'sequential',
        collectionId: defaultConfig.collectionId || '',
        tts: {
          lang: 'en-US',
          rate: 0.8,
          pitch: 1.0,
          volume: 1.0,
          voiceName: 'default',
          ...defaultConfig.tts
        },
        showPinyin: defaultConfig.showPinyin || false,
      } as QuizSettings;
    }

    return {
      questionType: 'text' as const,
      answerType: 'choice' as const,
      selectionStrategy: 'sequential' as const,
      collectionId: '',
      tts: {
        lang: 'en-US',
        rate: 0.8,
        pitch: 1.0,
        volume: 1.0,
        voiceName: 'default',
      },
      showPinyin: false,
    };
  }, [userSettings, guestConfig, gameId, defaultConfig]);

  // 【服务器优先】更新设置的函数
  const setSettings = async (newSettings: Partial<QuizSettings> | ((prev: Partial<QuizSettings>) => Partial<QuizSettings>)) => {
    // 计算新设置
    const computedSettings = newSettings instanceof Function
      ? newSettings(settings)
      : { ...settings, ...newSettings };

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
