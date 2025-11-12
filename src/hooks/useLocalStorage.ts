import { useState, useEffect } from 'react';
import { QuizSettings } from '../types';
import { useAppContext } from './useAppContext';
import { useAuth } from './useAuth';

// 创建内部hook来获取配置（避免在useLocalStorage中直接使用Context）
function useAppDefaults() {
  const { getConfig, loading } = useAppContext();
  return { getConfig, loading };
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  // 获取初始值
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
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
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // 监听其他标签页的变化
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error parsing localStorage key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue] as const;
}

// 专门用于保存答题设置的hook
// 优先级：用户偏好（profile.preferred_textbook_id）> 服务器配置 > 内置默认值 > 硬编码值
export function useQuizSettings() {
  const { getConfig, loading } = useAppDefaults();
  const { profile } = useAuth();

  // 获取默认值，优先级顺序
  const getDefaultSettings = () => {
    const guessWordSettings = getConfig('guess_word_settings') || {};
    const ttsDefaults = getConfig('tts_defaults') || {};
    const defaultCollectionId = getConfig('default_collection_id') || '11111111-1111-1111-1111-111111111111';

    // 优先级：用户个人偏好 > 服务器配置中的默认值 > 硬编码默认值
    const finalCollectionId =
      profile?.settings?.preferred_textbook_id || // 1️⃣ 用户个人偏好（最高优先级）
      defaultCollectionId ||                      // 2️⃣ 服务器配置
      '11111111-1111-1111-1111-111111111111';     // 3️⃣ 硬编码默认值（最低优先级）

    return {
      questionType: guessWordSettings.questionType || 'text',
      answerType: guessWordSettings.answerType || 'choice',
      selectionStrategy: guessWordSettings.learningStrategy || 'sequential',
      collectionId: finalCollectionId,
      tts: {
        lang: ttsDefaults.lang || 'en-US',
        rate: ttsDefaults.rate || 0.8,
        pitch: ttsDefaults.pitch || 1.0,
        volume: ttsDefaults.volume || 1.0,
        voiceId: ttsDefaults.voiceId || 'default',
      },
    };
  };

  // 在配置加载完成后再获取默认值
  const defaultSettings = !loading ? getDefaultSettings() : {
    questionType: 'text',
    answerType: 'choice',
    selectionStrategy: 'sequential',
    collectionId: profile?.preferred_textbook_id || '11111111-1111-1111-1111-111111111111',
    tts: {
      lang: 'en-US',
      rate: 0.8,
      pitch: 1.0,
      volume: 1.0,
      voiceId: 'default',
    },
  };

  const [settings, setSettings] = useLocalStorage<Partial<QuizSettings>>('quiz-settings', defaultSettings);

  return { settings, setSettings };
}

// 专门用于保存答题统计的hook
// 优先使用服务器配置，内置默认值为保底
export function useQuizStats() {
  const { getConfig, loading } = useAppDefaults();

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

  const [stats, setStats] = useLocalStorage('quiz-stats', defaultStats);

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