import { useState, useEffect } from 'react';
import { QuizSettings } from '../types';

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
export function useQuizSettings() {
  const [settings, setSettings] = useLocalStorage<Partial<QuizSettings>>('quiz-settings', {
    questionType: 'text',
    answerType: 'choice',
    selectionStrategy: 'sequential',
    collectionId: '11111111-1111-1111-1111-111111111111', // 默认教材ID
  });

  return { settings, setSettings };
}

// 专门用于保存答题统计的hook
export function useQuizStats() {
  const [stats, setStats] = useLocalStorage('quiz-stats', {
    totalGames: 0,
    totalCorrect: 0,
    bestScore: 0,
    averageScore: 0,
    lastPlayed: null,
  });

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