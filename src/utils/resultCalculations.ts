/**
 * 游戏结果页面计算工具函数
 * 包含等级计算、统计数据计算、时间格式化等功能
 */

import { 
  GradeInfo, 
  EnhancedQuizResult, 
  DetailedStats, 
  TimeFormatOptions,
  TooltipContent,
  Word,
  QuestionResult
} from '../types/index';

/**
 * 根据准确率计算等级信息
 * @param accuracy 准确率 (0-100)
 * @returns 等级信息对象
 */
export const calculateGrade = (accuracy: number): GradeInfo => {
  // 确保准确率在有效范围内
  const normalizedAccuracy = Math.max(0, Math.min(100, accuracy));
  
  if (normalizedAccuracy >= 95) {
    return {
      grade: 'S',
      color: 'text-yellow-500',
      bgColor: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
      description: '完美表现！',
      celebrationLevel: 'high'
    };
  }
  
  if (normalizedAccuracy >= 85) {
    return {
      grade: 'A',
      color: 'text-green-500',
      bgColor: 'bg-gradient-to-br from-green-400 to-green-600',
      description: '优秀！',
      celebrationLevel: 'medium'
    };
  }
  
  if (normalizedAccuracy >= 70) {
    return {
      grade: 'B',
      color: 'text-blue-500',
      bgColor: 'bg-gradient-to-br from-blue-400 to-blue-600',
      description: '良好！',
      celebrationLevel: 'medium'
    };
  }
  
  if (normalizedAccuracy >= 60) {
    return {
      grade: 'C',
      color: 'text-orange-500',
      bgColor: 'bg-gradient-to-br from-orange-400 to-orange-600',
      description: '还需努力！',
      celebrationLevel: 'low'
    };
  }
  
  return {
    grade: 'D',
    color: 'text-red-500',
    bgColor: 'bg-gradient-to-br from-red-400 to-red-600',
    description: '继续加油！',
    celebrationLevel: 'low'
  };
};

/**
 * 计算详细统计信息
 * @param result 增强的游戏结果数据
 * @returns 详细统计信息
 */
export const calculateDetailedStats = (result: EnhancedQuizResult): DetailedStats => {
  const { questionResults = [], timeSpent, correctAnswers, totalQuestions } = result;
  
  // 计算平均每题用时
  const averageTimePerQuestion = timeSpent && totalQuestions > 0 
    ? timeSpent / totalQuestions 
    : undefined;
  
  // 计算最长连续正确记录
  let longestStreak = 0;
  let currentStreak = 0;
  
  questionResults.forEach(qr => {
    if (qr.isCorrect) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });
  
  // 格式化准确率显示
  const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  const accuracyDisplay = `${accuracy.toFixed(1)}% (${correctAnswers}/${totalQuestions})`;
  
  return {
    averageTimePerQuestion,
    longestStreak,
    formattedTime: timeSpent ? formatTime(timeSpent) : undefined,
    accuracyDisplay
  };
};

/**
 * 格式化时间显示
 * @param seconds 秒数
 * @param options 格式化选项
 * @returns 格式化的时间字符串
 */
export const formatTime = (seconds: number, options: TimeFormatOptions = {}): string => {
  const {
    showHours = false,
    showMilliseconds = false,
    format = 'mm:ss'
  } = options;
  
  // 处理无效输入
  if (!isFinite(seconds) || isNaN(seconds)) {
    return '0:00';
  }
  
  // 确保秒数为非负数
  const totalSeconds = Math.max(0, seconds);
  
  if (format === 'compact') {
    if (totalSeconds < 60) {
      return `${Math.floor(totalSeconds)}秒`;
    } else if (totalSeconds < 3600) {
      const minutes = Math.floor(totalSeconds / 60);
      return `${minutes}分钟`;
    } else {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${hours}小时${minutes}分钟`;
    }
  }
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  const milliseconds = Math.floor((totalSeconds % 1) * 1000);
  
  if (showHours || hours > 0) {
    let result = `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    if (showMilliseconds) {
      result += `.${milliseconds.toString().padStart(3, '0')}`;
    }
    return result;
  }
  
  let result = `${minutes}:${secs.toString().padStart(2, '0')}`;
  if (showMilliseconds) {
    result += `.${milliseconds.toString().padStart(3, '0')}`;
  }
  
  return result;
};

/**
 * 创建悬浮提示内容
 * @param question 题目对象
 * @param userAnswer 用户答案
 * @param timeSpent 用时（可选）
 * @returns 悬浮提示内容对象
 */
export const createTooltipContent = (
  question: Word, 
  userAnswer: string, 
  timeSpent?: number
): TooltipContent => {
  const isCorrect = userAnswer.toLowerCase().trim() === question.answer.toLowerCase().trim();
  
  // 处理用户答案显示：只有当userAnswer为undefined、null或空字符串时才显示"未作答"
  let displayUserAnswer = '未作答';
  if (userAnswer !== undefined && userAnswer !== null && userAnswer !== '') {
    displayUserAnswer = userAnswer;
  }
  
  return {
    question: question.word,
    userAnswer: displayUserAnswer,
    correctAnswer: question.answer,
    isCorrect,
    timeSpent: timeSpent ? formatTime(timeSpent) : undefined
  };
};

/**
 * 检查是否应该显示庆祝动画
 * @param gradeInfo 等级信息
 * @param accuracy 准确率
 * @returns 是否显示庆祝动画
 */
export const shouldShowCelebration = (gradeInfo: GradeInfo, accuracy: number): boolean => {
  // S级或者满分时显示庆祝动画
  return gradeInfo.grade === 'S' || accuracy === 100;
};

/**
 * 获取鼓励信息
 * @param accuracy 准确率
 * @param totalQuestions 总题数
 * @returns 鼓励信息文本
 */
export const getEncouragementMessage = (accuracy: number, totalQuestions: number): string => {
  if (accuracy === 100) {
    return '完美表现！太棒了！';
  } else if (accuracy >= 90) {
    return '表现出色！继续保持！';
  } else if (accuracy >= 80) {
    return '很好的成绩！';
  } else if (accuracy >= 60) {
    return '不错的开始！';
  } else if (accuracy === 0) {
    return '别灰心！继续努力！';
  } else {
    return '不要气馁！多练习就会进步！';
  }
};

/**
 * 计算游戏用时（如果有开始和结束时间）
 * @param startTime 开始时间戳
 * @param endTime 结束时间戳
 * @returns 游戏用时（秒）
 */
export const calculateGameDuration = (startTime?: number, endTime?: number): number | undefined => {
  if (!startTime || !endTime || endTime <= startTime) {
    return undefined;
  }
  
  return (endTime - startTime) / 1000; // 转换为秒
};

/**
 * 验证游戏结果数据的完整性
 * @param result 游戏结果数据
 * @returns 验证结果和错误信息
 */
export const validateQuizResult = (result: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!result) {
    errors.push('游戏结果数据不存在');
    return { isValid: false, errors };
  }
  
  if (typeof result.totalQuestions !== 'number' || result.totalQuestions <= 0) {
    errors.push('总题数必须是正数');
  }
  
  if (typeof result.correctAnswers !== 'number' || result.correctAnswers < 0) {
    errors.push('正确答案数必须是非负数');
  }
  
  if (result.correctAnswers > result.totalQuestions) {
    errors.push('正确答案数不能超过总题数');
  }
  
  if (typeof result.accuracy !== 'number' || result.accuracy < 0 || result.accuracy > 100) {
    errors.push('准确率必须在0-100之间');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 处理缺失或无效的题目结果数据
 * @param questionResults 原始题目结果数据
 * @param totalQuestions 总题数
 * @param correctAnswers 正确答案数
 * @returns 处理后的题目结果数组
 */
export const sanitizeQuestionResults = (
  questionResults: any[] | undefined | null,
  totalQuestions: number,
  correctAnswers: number
): QuestionResult[] => {
  // 如果没有题目结果数据，创建占位符数据
  if (!questionResults || !Array.isArray(questionResults) || questionResults.length === 0) {
    return Array.from({ length: totalQuestions }, (_, index) => ({
      questionIndex: index,
      question: {
        id: index,
        word: `题目 ${index + 1}`,
        definition: '题目内容不可用',
        answer: '答案不可用',
        options: ['选项不可用'],
        audioText: '',
        hint: '',
        difficulty: 'medium' as const
      },
      userAnswer: index < correctAnswers ? '正确答案' : '错误答案',
      isCorrect: index < correctAnswers,
      timeSpent: undefined
    }));
  }

  // 验证和清理现有数据，如果数组长度不足，用占位符补充
  const processedResults: QuestionResult[] = [];
  
  for (let index = 0; index < totalQuestions; index++) {
    const result = questionResults[index];
    if (!result || typeof result !== 'object') {
      processedResults.push({
        questionIndex: index,
        question: {
          id: index,
          word: `题目 ${index + 1}`,
          definition: '无效的题目数据',
          answer: '答案不可用',
          options: ['选项不可用'],
          audioText: '',
          hint: '',
          difficulty: 'medium' as const
        },
        userAnswer: '数据无效',
        isCorrect: false,
        timeSpent: undefined
      });
    } else {
      // 确保必要字段存在
      processedResults.push({
        questionIndex: typeof result.questionIndex === 'number' ? result.questionIndex : index,
        question: result.question || {
          id: index,
          word: `题目 ${index + 1}`,
          definition: '题目数据缺失',
          answer: '答案不可用',
          options: ['选项不可用'],
          audioText: '',
          hint: '',
          difficulty: 'medium' as const
        },
        userAnswer: typeof result.userAnswer === 'string' ? result.userAnswer : '答案缺失',
        isCorrect: typeof result.isCorrect === 'boolean' ? result.isCorrect : false,
        timeSpent: typeof result.timeSpent === 'number' ? result.timeSpent : undefined
      });
    }
  }
  
  return processedResults;
};

/**
 * 获取特殊成就信息（完美分数、首次完成等）
 * @param accuracy 准确率
 * @param totalQuestions 总题数
 * @param longestStreak 最长连续正确
 * @returns 成就信息
 */
export const getAchievementInfo = (
  accuracy: number, 
  totalQuestions: number, 
  longestStreak: number
): { hasAchievement: boolean; title: string; description: string; icon: string } => {
  // 完美分数
  if (accuracy === 100) {
    return {
      hasAchievement: true,
      title: '完美表现！',
      description: '全部答对，太厉害了！',
      icon: '🏆'
    };
  }

  // 高分成就
  if (accuracy >= 95) {
    return {
      hasAchievement: true,
      title: '近乎完美！',
      description: '只差一点点就完美了！',
      icon: '⭐'
    };
  }

  // 连击成就
  if (longestStreak >= Math.min(totalQuestions, 5)) {
    return {
      hasAchievement: true,
      title: '连击高手！',
      description: `连续答对${longestStreak}题！`,
      icon: '🔥'
    };
  }

  // 坚持成就（低分但完成了）
  if (accuracy < 30 && totalQuestions >= 5) {
    return {
      hasAchievement: true,
      title: '坚持不懈！',
      description: '虽然困难，但你坚持完成了！',
      icon: '💪'
    };
  }

  return {
    hasAchievement: false,
    title: '',
    description: '',
    icon: ''
  };
};

/**
 * 处理极值情况的统计数据
 * @param stats 原始统计数据
 * @returns 处理后的统计数据
 */
export const sanitizeDetailedStats = (stats: DetailedStats): DetailedStats => {
  return {
    averageTimePerQuestion: stats.averageTimePerQuestion && isFinite(stats.averageTimePerQuestion) 
      ? Math.max(0, stats.averageTimePerQuestion) 
      : undefined,
    longestStreak: Math.max(0, stats.longestStreak || 0),
    formattedTime: stats.formattedTime || undefined,
    accuracyDisplay: stats.accuracyDisplay || '0.0% (0/0)'
  };
};