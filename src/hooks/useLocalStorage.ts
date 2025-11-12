import { useState, useEffect } from 'react';
import { QuizSettings } from '../types';
import { useAppContext } from './useAppContext';
import { useAuth } from './useAuth';

// 创建内部hook来获取配置（避免在useLocalStorage中直接使用Context）
function useAppDefaults() {
  const { getConfig, loading } = useAppContext();
  return { getConfig, loading };
}

// 生成localStorage key，包含用户ID或匿名标识
function getStorageKey(baseKey: string, userId?: string): string {
  // 如果未登录用户，使用匿名前缀
  const prefix = userId ? `user_${userId}` : `anonymous_${getDeviceId()}`;
  return `${baseKey}_${prefix}`;
}

// 获取设备唯一ID（基于浏览器指纹）
function getDeviceId(): string {
  const KEY = 'device_id';
  let deviceId = localStorage.getItem(KEY);

  if (!deviceId) {
    // 生成设备ID：时间戳 + 随机数
    deviceId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(KEY, deviceId);
  }

  return deviceId;
}

export function useLocalStorage<T>(key: string, initialValue: T, userId?: string) {
  // 获取完整的storage key
  const storageKey = getStorageKey(key, userId);

  // 获取初始值
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(storageKey);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${storageKey}":`, error);
      return initialValue;
    }
  });

  // 设置值
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // 允许值是一个函数，这样我们就有了与useState相同的API
      const valueToStore = value instanceof Function ? value(storedValue) : value;

      // 保存状态
      setStoredValue(valueToStore);

      // 保存到localStorage
      window.localStorage.setItem(storageKey, JSON.stringify(valueToStore));
      console.log(`💾 [useLocalStorage] 保存到localStorage:`, { key: storageKey, value: valueToStore });
    } catch (error) {
      console.error(`Error setting localStorage key "${storageKey}":`, error);
    }
  };

  // 监听其他标签页的变化
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error parsing localStorage key "${storageKey}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey]);

  return [storedValue, setValue] as const;
}

// 专门用于保存答题设置的hook
// 优先级：用户设置（profile.settings.quiz-settings）> 服务器配置 > 内置默认值 > 硬编码值
export function useQuizSettings() {
  const { getConfig, loading } = useAppDefaults();
  const { profile, updateUserSettings, user } = useAuth();
  const userId = user?.id;

  // 获取默认值，优先级顺序
  const getDefaultSettings = () => {
    const guessWordSettings = getConfig('guess_word_settings') || {};
    const ttsDefaults = getConfig('tts_defaults') || {};
    const defaultCollectionId = getConfig('default_collection_id') || '11111111-1111-1111-1111-111111111111';

    // 获取用户设置
    const userQuizSettings = profile?.settings?.quiz_settings || {};

    // 优先级：用户设置 > 服务器配置 > 硬编码默认值
    const finalSettings = {
      questionType: userQuizSettings.questionType || guessWordSettings.questionType || 'text',
      answerType: userQuizSettings.answerType || guessWordSettings.answerType || 'choice',
      selectionStrategy: userQuizSettings.selectionStrategy || guessWordSettings.learningStrategy || 'sequential',
      collectionId: userQuizSettings.collectionId || profile?.settings?.preferred_textbook_id || defaultCollectionId || '11111111-1111-1111-1111-111111111111',
      tts: {
        lang: userQuizSettings.tts?.lang || ttsDefaults.lang || 'en-US',
        rate: userQuizSettings.tts?.rate || ttsDefaults.rate || 0.8,
        pitch: userQuizSettings.tts?.pitch || ttsDefaults.pitch || 1.0,
        volume: userQuizSettings.tts?.volume || ttsDefaults.volume || 1.0,
        voiceId: userQuizSettings.tts?.voiceId || ttsDefaults.voiceId || 'default',
      },
    };

    console.log('🔍 [useQuizSettings] 获取默认设置:', {
      isLoggedIn: !!userId,
      from: userQuizSettings.questionType ? '用户设置' : guessWordSettings.questionType ? '服务器配置' : '硬编码默认值',
      finalSettings
    });

    return finalSettings;
  };

  // 在配置加载完成后再获取默认值
  const defaultSettings = !loading ? getDefaultSettings() : {
    questionType: 'text',
    answerType: 'choice',
    selectionStrategy: 'sequential',
    collectionId: profile?.settings?.quiz_settings?.collectionId || profile?.settings?.preferred_textbook_id || '11111111-1111-1111-1111-111111111111',
    tts: {
      lang: 'en-US',
      rate: 0.8,
      pitch: 1.0,
      volume: 1.0,
      voiceId: 'default',
    },
  };

  const [settings, setSettings] = useLocalStorage<Partial<QuizSettings>>('quiz-settings', defaultSettings, userId);

  // 同步到后端的函数
  const syncToServer = async (newSettings: Partial<QuizSettings>) => {
    if (!profile) {
      console.log('⚠️ [useQuizSettings] 用户未登录，跳过同步到后端');
      return { success: false, error: '未登录' };
    }

    try {
      // 获取当前的 user settings
      const currentUserSettings = profile.settings || {};
      const currentQuizSettings = currentUserSettings.quiz_settings || {};

      // 深度合并
      const mergedSettings = {
        ...currentUserSettings,
        quiz_settings: {
          ...currentQuizSettings,
          ...newSettings,
        }
      };

      // 同步到后端
      const result = await updateUserSettings({ quiz_settings: mergedSettings.quiz_settings });

      if (result.success) {
        console.log('✅ [useQuizSettings] 设置已同步到后端');
      } else {
        console.warn('⚠️ [useQuizSettings] 同步到后端失败:', result.error);
      }

      return result;
    } catch (error) {
      console.error('❌ [useQuizSettings] 同步到后端失败:', error);
      return { success: false, error: '同步失败' };
    }
  };

  // 重写 setSettings，自动同步到后端
  const setSettingsWithSync = (value: Partial<QuizSettings> | ((prev: Partial<QuizSettings>) => Partial<QuizSettings>)) => {
    const newSettings = value instanceof Function ? value(settings) : value;
    setSettings(newSettings);

    // 异步同步到后端（不阻塞 UI）
    syncToServer(newSettings);
  };

  return { settings, setSettings: setSettingsWithSync };
}

// 专门用于保存答题统计的hook
// 优先使用服务器配置，内置默认值为保底
export function useQuizStats() {
  const { getConfig, loading } = useAppDefaults();
  const { user } = useAuth();
  const userId = user?.id;

  // 从配置中获取默认值，优先级：服务器配置 > 内置默认值
  const getDefaultStats = () => {
    const defaultStats = getConfig('default_stats') || {};
    return {
      totalGames: defaultStats.totalGames || 0,
      totalCorrect: defaultStats.totalCorrect || 0,
      bestScore: defaultStats.bestScore || 0,
      averageScore: defaultStats.averageScore || 0,
      lastPlayed: defaultStats.lastPlayed || null,
    };
  };

  // 在配置加载完成后再获取默认值
  const defaultStats = !loading ? getDefaultStats() : {
    totalGames: 0,
    totalCorrect: 0,
    bestScore: 0,
    averageScore: 0,
    lastPlayed: null,
  };

  const [stats, setStats] = useLocalStorage('quiz-stats', defaultStats, userId);

  const updateStats = (correctAnswers: number, totalQuestions: number) => {
    const newTotalGames = stats.totalGames + 1;
    const newTotalCorrect = stats.totalCorrect + correctAnswers;
    const newBestScore = Math.max(stats.bestScore, correctAnswers);
    const newAverageScore = Math.round((newTotalCorrect / (newTotalGames * totalQuestions)) * 100);

    setStats({
      totalGames: newTotalGames,
      totalCorrect: newTotalCorrect,
      bestScore: newBestScore,
      averageScore: newAverageScore,
      lastPlayed: new Date().toISOString(),
    });
  };

  return { stats, updateStats };
}