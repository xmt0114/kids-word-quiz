import { useLocalStorage } from './useLocalStorage';
import { useAuth } from './useAuth';

// 学习进度接口
export interface LearningProgress {
  collectionId: string;
  lastPosition: number; // 最后学习的位置（单词索引）
  totalWords: number; // 教材总单词数
  lastUpdated: string; // 最后更新时间
}

// 学习进度存储键
const LEARNING_PROGRESS_KEY = 'learning-progress';

// 本地进度映射：collectionId -> LearningProgress
type ProgressMap = Record<string, LearningProgress>;

// 学习进度Hook
export function useLearningProgress() {
  const { user } = useAuth();
  const userId = user?.id;

  const [progressMap, setProgressMap] = useLocalStorage<ProgressMap>(LEARNING_PROGRESS_KEY, {}, userId);

  console.log('📊 [useLearningProgress] 初始化:', {
    isLoggedIn: !!userId,
    userId,
    progressKeys: Object.keys(progressMap)
  });

  // 获取指定教材的学习进度
  const getProgress = (collectionId: string): LearningProgress | null => {
    return progressMap[collectionId] || null;
  };

  // 获取指定教材的偏移量（从哪个位置开始学习）
  const getOffset = (collectionId: string): number => {
    const progress = getProgress(collectionId);
    if (!progress) return 0;

    // 如果已经学完，返回0重新开始（或可根据需求设置为随机位置）
    if (progress.lastPosition >= progress.totalWords) {
      return 0;
    }

    // 修复：每次取10个单词，第一次 offset=0, 第二次应该是 offset=9（而不是 offset=10）
    // 避免跳过单词：如果 lastPosition=10, 则从索引9开始取10个（索引9-18）
    // 如果 lastPosition=20, 则从索引19开始取10个（索引19-28）
    return Math.max(progress.lastPosition - 1, 0);
  };

  // 更新学习进度
  const updateProgress = (
    collectionId: string,
    lastPosition: number,
    totalWords: number
  ) => {
    setProgressMap(prev => ({
      ...prev,
      [collectionId]: {
        collectionId,
        lastPosition,
        totalWords,
        lastUpdated: new Date().toISOString()
      }
    }));
  };

  // 完成一轮学习后推进进度
  const advanceProgress = (
    collectionId: string,
    completedQuestions: number,
    totalWords: number
  ) => {
    const currentProgress = getProgress(collectionId);
    const currentOffset = currentProgress?.lastPosition || 0;
    const newPosition = Math.min(currentOffset + completedQuestions, totalWords);

    updateProgress(collectionId, newPosition, totalWords);

    return {
      oldPosition: currentOffset,
      newPosition,
      isCompleted: newPosition >= totalWords
    };
  };

  // 重置指定教材的进度
  const resetProgress = (collectionId: string) => {
    setProgressMap(prev => {
      const newMap = { ...prev };
      delete newMap[collectionId];
      return newMap;
    });
  };

  // 重置所有进度
  const resetAllProgress = () => {
    setProgressMap({});
  };

  // 获取进度百分比
  const getProgressPercentage = (collectionId: string): number => {
    const progress = getProgress(collectionId);
    if (!progress || progress.totalWords === 0) return 0;

    return Math.round((progress.lastPosition / progress.totalWords) * 100);
  };

  // 获取剩余单词数
  const getRemainingWords = (collectionId: string): number => {
    const progress = getProgress(collectionId);
    if (!progress) return 0;

    return Math.max(progress.totalWords - progress.lastPosition, 0);
  };

  // 检查是否学完
  const isCompleted = (collectionId: string): boolean => {
    const progress = getProgress(collectionId);
    if (!progress) return false;

    return progress.lastPosition >= progress.totalWords;
  };

  // 格式化最后更新时间
  const formatLastUpdated = (collectionId: string): string => {
    const progress = getProgress(collectionId);
    if (!progress) return '未开始学习';

    const date = new Date(progress.lastUpdated);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚更新';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;

    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return {
    // 状态
    progressMap,

    // 方法
    getProgress,
    getOffset,
    updateProgress,
    advanceProgress,
    resetProgress,
    resetAllProgress,

    // 计算属性
    getProgressPercentage,
    getRemainingWords,
    isCompleted,
    formatLastUpdated,
  };
}
