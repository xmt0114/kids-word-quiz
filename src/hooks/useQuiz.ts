import { useState, useCallback, useEffect } from 'react';
import { Word, QuizSettings, QuizState, QuizResult } from '../types';
import { getRandomWords } from '../utils/dataUtils';
import { wordAPI } from '../utils/api';

const TOTAL_QUESTIONS = 10;
const INITIALIZE_TIMEOUT = 10000; // 10秒超时
const MAX_RETRIES = 3;

export function useQuiz() {
  const [quizState, setQuizState] = useState<QuizState>({
    settings: {
      questionType: 'text',
      answerType: 'choice',
      difficulty: 'easy',
    },
    currentQuestionIndex: 0,
    questions: [],
    answers: [],
    isCompleted: false,
    score: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // 带超时和重试的数据获取
  const fetchWordsWithRetry = useCallback(async (
    settings: QuizSettings,
    collectionId?: string,
    offset: number = 0,
    retries: number = MAX_RETRIES
  ): Promise<Word[]> => {
    try {
      // 创建超时Promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('请求超时')), INITIALIZE_TIMEOUT);
      });

      // 创建请求Promise
      const requestPromise = wordAPI.getWords({
        difficulty: settings.difficulty,
        limit: TOTAL_QUESTIONS,
        offset: offset, // 传递偏移量
        collectionId: collectionId, // 传递教材ID
        selectionStrategy: settings.selectionStrategy, // 传递选取策略
      });

      // 竞态处理：超时或请求完成
      const response = await Promise.race([requestPromise, timeoutPromise]);

      if (!response.success || !response.data) {
        throw new Error(response.error || '获取题目失败');
      }

      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      
      // 如果还有重试次数，则重试
      if (retries > 0) {
        console.warn(`获取题目失败，剩余重试次数: ${retries - 1}, 错误: ${errorMessage}`);
        setRetryCount(MAX_RETRIES - retries + 1);

        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * (MAX_RETRIES - retries + 1)));
        return fetchWordsWithRetry(settings, collectionId, offset, retries - 1);
      }
      
      throw new Error(`获取题目失败: ${errorMessage}`);
    }
  }, []);

  // 初始化题目
  const initializeQuiz = useCallback(async (
    settings: QuizSettings,
    collectionId?: string,
    offset: number = 0,
    totalWords?: number
  ) => {
    setIsLoading(true);
    setError(null);
    setRetryCount(0);

    try {
      // 获取单词数据（带重试机制）
      const wordsData = await fetchWordsWithRetry(settings, collectionId, offset);

      // 验证数据完整性
      if (!Array.isArray(wordsData) || wordsData.length === 0) {
        throw new Error('没有可用的题目数据');
      }

      // 根据选取策略选择题目
      // 顺序选取：保持API返回的顺序（已按word字母排序）
      // 随机选取：随机打乱
      const shouldShuffle = settings.selectionStrategy !== 'sequential';
      const selectedWords = getRandomWords(wordsData, TOTAL_QUESTIONS, undefined, shouldShuffle);

      // 验证选择的题目数据完整性
      const validWords = selectedWords.filter(word => {
        if (!word) return false;

        // 基本字段验证
        if (!word.id) return false;
        if (!word.word) return false;
        if (!word.definition) return false;
        if (!Array.isArray(word.options)) return false;
        if (word.options.length < 3) return false;
        if (!word.answer) return false;

        return true;
      });

      if (validWords.length === 0) {
        throw new Error('没有有效的题目数据');
      }

      // 如果有效题目不足TOTAL_QUESTIONS，使用所有有效题目
      const questionsToUse = validWords.length >= TOTAL_QUESTIONS
        ? validWords.slice(0, TOTAL_QUESTIONS)
        : validWords;

      setQuizState({
        settings,
        currentQuestionIndex: 0,
        questions: questionsToUse,
        answers: new Array(questionsToUse.length).fill(null),
        isCompleted: false,
        score: 0,
      });

      setRetryCount(0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '初始化题目失败';
      setError(errorMessage);
      console.error('初始化题目失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWordsWithRetry]);

  // 提交答案（仅保存答案，不自动跳转）
  const submitAnswer = useCallback((answer: string) => {
    setQuizState(prev => {
      const newAnswers = [...prev.answers];
      newAnswers[prev.currentQuestionIndex] = answer;

      // 计算当前得分
      const currentWord = prev.questions[prev.currentQuestionIndex];
      const isCorrect = answer.toLowerCase().trim() === currentWord.answer.toLowerCase().trim();
      
      let newScore = prev.score;
      if (isCorrect && !prev.answers[prev.currentQuestionIndex]) {
        newScore += 1;
      }

      return {
        ...prev,
        answers: newAnswers,
        score: newScore,
      };
    });
  }, []);

  // 获取下一题
  const nextQuestion = useCallback(() => {
    setQuizState(prev => {
      const newIndex = prev.currentQuestionIndex + 1;
      const isCompleted = newIndex >= prev.questions.length;
      
      return {
        ...prev,
        currentQuestionIndex: newIndex,
        isCompleted,
      };
    });
  }, []);

  // 获取上一题
  const previousQuestion = useCallback(() => {
    setQuizState(prev => ({
      ...prev,
      currentQuestionIndex: Math.max(prev.currentQuestionIndex - 1, 0),
    }));
  }, []);

  // 重新开始
  const restartQuiz = useCallback(() => {
    setQuizState(prev => ({
      ...prev,
      currentQuestionIndex: 0,
      answers: new Array(prev.questions.length).fill(null),
      isCompleted: false,
      score: 0,
    }));
    setError(null);
  }, []);

  // 获取当前题目
  const getCurrentQuestion = useCallback((): Word | null => {
    if (quizState.currentQuestionIndex >= quizState.questions.length) {
      return null;
    }
    return quizState.questions[quizState.currentQuestionIndex];
  }, [quizState.currentQuestionIndex, quizState.questions]);

  // 获取结果
  const getResult = useCallback((): QuizResult => {
    const wrongAnswers = quizState.questions.filter((word, index) => {
      const userAnswer = quizState.answers[index];
      return !userAnswer || userAnswer.toLowerCase().trim() !== word.answer.toLowerCase().trim();
    });

    const accuracy = quizState.questions.length > 0 
      ? Math.round((quizState.score / quizState.questions.length) * 100) 
      : 0;

    return {
      totalQuestions: quizState.questions.length,
      correctAnswers: quizState.score,
      accuracy,
      score: quizState.score,
    };
  }, [quizState.questions, quizState.answers, quizState.score]);

  // 检查答案是否正确
  const checkAnswer = useCallback((answer: string, word: Word): boolean => {
    return answer.toLowerCase().trim() === word.answer.toLowerCase().trim();
  }, []);

  // 获取进度百分比
  const getProgress = useCallback((): number => {
    if (quizState.questions.length === 0) return 0;
    return Math.round((quizState.currentQuestionIndex / quizState.questions.length) * 100);
  }, [quizState.currentQuestionIndex, quizState.questions.length]);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  return {
    // 状态
    quizState,
    isLoading,
    error,
    retryCount,
    
    // 方法
    initializeQuiz,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    restartQuiz,
    clearError,
    
    // 计算属性
    getCurrentQuestion,
    getResult,
    getProgress,
    checkAnswer,
    
    // 常量
    totalQuestions: TOTAL_QUESTIONS,
  };
}