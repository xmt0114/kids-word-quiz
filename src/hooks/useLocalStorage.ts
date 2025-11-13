import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useAppStore } from '../stores/appStore';

// 创建内部hook来获取配置（避免在useLocalStorage中直接使用Context）
function useAppDefaults() {
  // 从 Zustand Store 获取配置数据（兼容旧 useQuizSettings）
  const { guestConfig, dataLoading } = useAppStore();

  const getConfig = (key: string) => {
    // 从游客配置中获取
    return guestConfig?.[key] || null;
  };

  return { getConfig, loading: dataLoading };
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

// 【注意】useQuizSettings 已迁移到 appStore.ts

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