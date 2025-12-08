import { useState, useCallback } from 'react';
import { Word, QuizSettings, QuizState, QuizResult, QuizAnswerResult } from '../types';
import { useAppStore } from '../stores/appStore';
import { shuffleArray } from '../utils/dataUtils';

const TOTAL_QUESTIONS = 10;

export function useQuiz() {
  const [quizState, setQuizState] = useState<QuizState>({
    settings: {
      questionType: 'text',
      answerType: 'choice',
    },
    currentQuestionIndex: 0,
    questions: [],
    answers: [],
    isCompleted: false,
    score: 0,
    startTime: undefined,
    currentQuestionStartTime: undefined,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // 初始化题目
  const initializeQuiz = useCallback(async (
    settings: QuizSettings,
    _collectionId?: string,
    _offset: number = 0,
    questions?: Word[] // 可选的预加载题目
  ) => {
    setIsLoading(true);
    setError(null);
    setRetryCount(0);

    try {
      // 验证预加载题目数据
      if (!questions || questions.length === 0) {
        throw new Error('没有提供题目数据');
      }

      const questionsToUse = questions.slice(0, TOTAL_QUESTIONS);

      // 验证题目数据完整性
      const validWords = questionsToUse.filter((word: Word) => {
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

      // 随机打乱每个题目的选项顺序
      // 注意：这里不会影响答案的判定，因为判定是基于 answer 字段的字符串值，而不是索引
      const shuffledQuestions = validWords.map(word => ({
        ...word,
        options: shuffleArray([...word.options]) // 创建副本并打乱
      }));

      const now = Date.now();
      setQuizState({
        settings,
        currentQuestionIndex: 0,
        questions: shuffledQuestions,
        answers: new Array(shuffledQuestions.length).fill(null),
        results: new Array(shuffledQuestions.length).fill(null),
        isCompleted: false,
        score: 0,
        startTime: now,
        currentQuestionStartTime: now,
      });

      setRetryCount(0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '初始化题目失败';
      setError(errorMessage);
      console.error('初始化题目失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 提交答题结果到后端（使用 Zustand 管理）
  const submitResults = useCallback(async (results: QuizAnswerResult[] | null | undefined) => {
    try {
      if (!results || results.length === 0) {
        console.warn('没有答题结果需要提交');
        return { success: false, error: '没有答题结果' };
      }

      const resultsArray = results
        .filter(result => result !== null)
        .map(result => ({
          word_id: String(result.wordId), // 转换为字符串
          is_correct: result.isCorrect
        }));

      console.log('[useQuiz] 提交答题结果到后端:', resultsArray.length);

      // 使用 Zustand 的 submitSessionResults 方法
      const { submitSessionResults } = useAppStore.getState();
      const result = await submitSessionResults(resultsArray);

      return result;
    } catch (err) {
      console.error('提交答题结果时发生错误:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : '未知错误'
      };
    }
  }, []);

  // 提交答案（仅保存答案，不自动跳转）
  const submitAnswer = useCallback((answer: string) => {
    setQuizState(prev => {
      const newAnswers = [...prev.answers];
      newAnswers[prev.currentQuestionIndex] = answer;

      // 计算当前得分
      const currentWord = prev.questions[prev.currentQuestionIndex];
      const isCorrect = answer.toLowerCase().trim() === currentWord.answer.toLowerCase().trim();

      // 计算单题用时
      const now = Date.now();
      const timeSpent = prev.currentQuestionStartTime
        ? (now - prev.currentQuestionStartTime) / 1000
        : undefined;

      // 创建或更新答题结果记录
      const newResults = [...(prev.results || [])];
      newResults[prev.currentQuestionIndex] = {
        wordId: currentWord.id,
        answer: answer,
        isCorrect: isCorrect,
        timeSpent: timeSpent
      };

      let newScore = prev.score;
      if (isCorrect && !prev.answers[prev.currentQuestionIndex]) {
        newScore += 1;
      }

      return {
        ...prev,
        answers: newAnswers,
        results: newResults,
        score: newScore,
      };
    });
  }, []);

  // 重置指定题目的状态
  const resetQuestion = useCallback((index: number) => {
    setQuizState(prev => {
      const newAnswers = [...prev.answers];
      const newResults = prev.results ? [...prev.results] : [];
      let newScore = prev.score;

      // 如果之前该题答对了，需要减去分数
      // 注意：这里的逻辑假设我们只在当前题重置，且只影响 score
      // 如果之前的答案是正确的，我们应该从总分中减去
      if (newResults[index]?.isCorrect) {
        newScore = Math.max(0, newScore - 1);
      }

      // 清除该题的答案和结果
      newAnswers[index] = null;
      newResults[index] = null as any; // 或者undefined，取决于类型定义，这里用null占位

      return {
        ...prev,
        answers: newAnswers,
        results: newResults,
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
        currentQuestionStartTime: isCompleted ? prev.currentQuestionStartTime : Date.now(),
      };
    });
  }, []);

  // 获取上一题
  const previousQuestion = useCallback(() => {
    setQuizState(prev => ({
      ...prev,
      currentQuestionIndex: Math.max(prev.currentQuestionIndex - 1, 0),
      currentQuestionStartTime: Date.now(), // 重新开始计时
    }));
  }, []);

  // 重新开始
  const restartQuiz = useCallback(() => {
    const now = Date.now();
    setQuizState(prev => ({
      ...prev,
      currentQuestionIndex: 0,
      answers: new Array(prev.questions.length).fill(null),
      results: new Array(prev.questions.length).fill(null),
      isCompleted: false,
      score: 0,
      startTime: now,
      currentQuestionStartTime: now,
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

  // 获取总用时（秒）
  const getTotalTime = useCallback((): number => {
    if (!quizState.startTime) return 0;
    return (Date.now() - quizState.startTime) / 1000;
  }, [quizState.startTime]);

  // 获取当前题目用时（秒）
  const getCurrentQuestionTime = useCallback((): number => {
    if (!quizState.currentQuestionStartTime) return 0;
    return (Date.now() - quizState.currentQuestionStartTime) / 1000;
  }, [quizState.currentQuestionStartTime]);

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
    submitResults,
    nextQuestion,
    previousQuestion,
    restartQuiz,
    resetQuestion, // Export resetQuestion
    clearError,
    setError, // Export setError

    // 计算属性
    getCurrentQuestion,
    getResult,
    getProgress,
    checkAnswer,
    getTotalTime,
    getCurrentQuestionTime,

    // 常量
    totalQuestions: TOTAL_QUESTIONS,
  };
}