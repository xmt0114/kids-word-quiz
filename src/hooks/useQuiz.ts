import { useState, useCallback } from 'react';
import { Word, QuizSettings, QuizState, QuizResult, QuizAnswerResult } from '../types';
import { supabase } from '../lib/supabase';

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

      setQuizState({
        settings,
        currentQuestionIndex: 0,
        questions: validWords,
        answers: new Array(validWords.length).fill(null),
        results: new Array(validWords.length).fill(null),
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
  }, []);

  // 提交答题结果到后端
  const submitResults = useCallback(async (results: QuizAnswerResult[] | null | undefined) => {
    try {
      if (!results || results.length === 0) {
        console.warn('没有答题结果需要提交');
        return { success: false, error: '没有答题结果' };
      }

      const resultsArray = results
        .filter(result => result !== null)
        .map(result => ({
          word_id: result.wordId,
          is_correct: result.isCorrect
        }));

      console.log('[useQuiz] 提交答题结果到后端:', resultsArray.length);

      const { error } = await supabase.rpc('record_session_results', {
        p_session_results: resultsArray
      });

      if (error) {
        console.error('提交答题结果失败:', error);
        return { success: false, error: error.message };
      }

      console.log('[useQuiz] 答题结果提交成功');
      return { success: true };
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

      // 创建或更新答题结果记录
      const newResults = [...(prev.results || [])];
      newResults[prev.currentQuestionIndex] = {
        wordId: currentWord.id,
        answer: answer,
        isCorrect: isCorrect
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
    submitResults,
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