/**
 * useLiteracyAssessmentGame Hook
 * 儿童识字量测试游戏核心状态管理Hook
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type {
  GameState,
  AssessmentSession,
  AssessmentQuestion,
  LevelPacket,
  AssessmentReport,
  SubmitPacketResponse,
  PacketResult,
  AgeValidationResult,
  UseLiteracyAssessmentGameReturn,
} from './types';
import { wordAPI } from '../../utils/api';
import {
  validateStartAssessmentResponse,
  validateSubmitPacketResponse,
} from './apiValidation';
import { useAppStore } from '../../stores/appStore';

// ==================== Constants ====================

const STORAGE_KEY = 'literacy-assessment-birth-date';
const MIN_AGE = 3;
const MAX_AGE = 10;

// ==================== Helper Functions ====================

/**
 * 计算年龄
 */
function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * 验证年龄
 */
function validateAge(birthDate: string): AgeValidationResult {
  if (!birthDate) {
    return {
      isValid: false,
      error: '请选择出生日期',
    };
  }

  const age = calculateAge(birthDate);

  if (age < MIN_AGE) {
    return {
      isValid: false,
      age,
      error: `年龄不能小于${MIN_AGE} 岁，当前年龄为${age} 岁`,
    };
  }

  if (age > MAX_AGE) {
    return {
      isValid: false,
      age,
      error: `年龄不能大于${MAX_AGE} 岁，当前年龄为${age} 岁`,
    };
  }

  return {
    isValid: true,
    age,
  };
}

/**
 * 保存出生日期到本地存储
 */
function saveBirthDate(birthDate: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, birthDate);
  } catch (error) {
    console.error('Failed to save birth date:', error);
  }
}

/**
 * 从本地存储读取出生日期
 */
export function loadSavedBirthDate(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to load birth date:', error);
    return null;
  }
}

/**
 * 随机打乱数组
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 随机生成题目选项（包含正确答案和混淆选项，随机排序）
 */
function generateOptions(question: AssessmentQuestion): string[] {
  const options = [question.character, ...question.confusion_options];
  return shuffleArray(options).slice(0, 4); // 确保最多4个选项
}

/**
 * 计算正确率
 */
function calculateAccuracy(answers: boolean[]): number {
  if (answers.length === 0) return 0;
  const correct = answers.filter(a => a).length;
  return correct / answers.length;
}

/**
 * 评估基础题集
 */
function evaluateBaseSet(
  answers: boolean[],
  config: { pass_threshold: number; drop_threshold: number }
): { status: 'pass' | 'fail' | 'rescue'; accuracy: number } {
  const accuracy = calculateAccuracy(answers);

  if (accuracy >= config.pass_threshold) {
    return { status: 'pass', accuracy };
  }

  if (accuracy <= config.drop_threshold) {
    return { status: 'fail', accuracy };
  }

  return { status: 'rescue', accuracy };
}

/**
 * 评估总正确率（基础题 + 急救题）
 */
function evaluateTotalAccuracy(
  baseAnswers: boolean[],
  rescueAnswers: boolean[],
  passThreshold: number
): { passed: boolean; accuracy: number } {
  const allAnswers = [...baseAnswers, ...rescueAnswers];
  const accuracy = calculateAccuracy(allAnswers);

  return {
    passed: accuracy >= passThreshold,
    accuracy,
  };
}

// ==================== Hook Implementation ====================

export function useLiteracyAssessmentGame(): UseLiteracyAssessmentGameReturn {
  // ===== State =====

  const [gameState, setGameState] = useState<GameState>({
    phase: 'age-selection',
    session: null,
    currentQuestion: null,
    currentQuestionIndex: 0,
    currentSetType: 'base',
    currentSetAnswers: [],
    showFeedback: false,
    isCorrect: null,
    report: null,
    nextLevelData: null,
    isLoading: false,
    error: null,
  });

  // 使用 ref 追踪最新状态，解决回调函数中的闭包问题
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // ===== Methods =====

  /**
   * 开始测试
   */
  const startAssessment = useCallback(async (birthDate: string) => {
    // 验证年龄
    const validation = validateAge(birthDate);
    if (!validation.isValid) {
      setGameState(prev => ({
        ...prev,
        error: validation.error || '年龄验证失败',
      }));
      return;
    }

    // 保存出生日期
    saveBirthDate(birthDate);

    // 设置加载状态
    setGameState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      // 调用 API 获取题包
      if (!wordAPI.startAssessmentV6) {
        throw new Error('API方法未实现：startAssessmentV6');
      }

      const response = await wordAPI.startAssessmentV6(birthDate);

      if (!response.success || !response.data) {
        throw new Error(response.error || '获取题包失败');
      }

      // 验证和转换响应数据
      const validation = validateStartAssessmentResponse(response.data);

      if (!validation.isValid || !validation.sessionId || !validation.packets) {
        throw new Error(validation.error || '响应数据验证失败');
      }

      // 创建会话
      const session: AssessmentSession = {
        sessionId: validation.sessionId,
        birthDate,
        currentPacketIndex: 0,
        packets: validation.packets,
        allResults: [],
      };

      // 获取第一个题包的第一题
      const firstPacket = validation.packets[0];
      const firstQuestion = firstPacket.base_set[0];

      setGameState(prev => ({
        ...prev,
        phase: 'assessment',
        session,
        currentQuestion: firstQuestion,
        currentQuestionIndex: 0,
        currentSetType: 'base',
        currentSetAnswers: [],
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error('Failed to start assessment:', error);

      const errorMessage = error instanceof Error ? error.message : '开始测试失败';
      const isAuthError = errorMessage.includes('Not authenticated') || errorMessage.includes('P0001');

      if (isAuthError) {
        // 如果是未登录错误，打开登录弹窗
        useAppStore.getState().openLoginModal('登录以开始识字量测试');
        setGameState(prev => ({
          ...prev,
          isLoading: false,
          error: null, // 不设置 inline 错误，因为已经弹窗了
        }));
      } else {
        setGameState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
      }
    }
  }, []);

  /**
   * 提交答案
   */
  const submitAnswer = useCallback((answer: string) => {
    setGameState(prev => {
      if (!prev.currentQuestion) return prev;

      // 检查答案是否正确
      const isCorrect = answer === prev.currentQuestion.character;

      // 更新当前题集的答案记录
      const updatedAnswers = [...prev.currentSetAnswers, isCorrect];

      return {
        ...prev,
        currentSetAnswers: updatedAnswers,
        showFeedback: true,
        isCorrect,
      };
    });
  }, []);

  /**
   * 内部方法：执行提交题包结果并处理响应
   */
  const performSubmission = useCallback(async (session: AssessmentSession) => {
    try {
      if (!wordAPI.submitPacketV6) {
        throw new Error('API方法未实现：submitPacketV6');
      }

      const response = await wordAPI.submitPacketV6(
        session.sessionId,
        session.allResults
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || '提交结果失败');
      }

      const validation = validateSubmitPacketResponse(response.data);
      if (!validation.isValid) {
        throw new Error(validation.error || '响应数据验证失败');
      }

      if (validation.status === 'completed' && validation.report) {
        const nextData: SubmitPacketResponse = { status: 'completed', report: validation.report };
        setGameState(prev => {
          // 如果当前处于等级过渡阶段，且结果已出，则准备进入最终过渡
          if (prev.phase === 'level-transition') {
            return {
              ...prev,
              nextLevelData: nextData,
              isLoading: false
            };
          }
          // 正常流程：进入最终过渡界面
          return {
            ...prev,
            phase: 'final-transition',
            report: validation.report!,
            isLoading: false,
            nextLevelData: null,
          };
        });
      } else if (validation.status === 'active' && validation.packets) {
        const newPackets = validation.packets;
        const nextData: SubmitPacketResponse = { status: 'active', packets: newPackets };
        setGameState(prev => {
          // 如果当前处于等级过渡阶段，只存储数据不跳转
          if (prev.phase === 'level-transition') {
            return {
              ...prev,
              nextLevelData: nextData,
              isLoading: false
            };
          }

          // 否则（正常提交失败后重试的情况），直接跳转
          const firstNewPacket = newPackets[0];
          return {
            ...prev,
            phase: 'assessment',
            session: prev.session ? {
              ...prev.session,
              packets: [...prev.session.packets, ...newPackets],
              currentPacketIndex: prev.session.packets.length,
            } : null,
            currentSetType: 'base',
            currentQuestionIndex: 0,
            currentQuestion: firstNewPacket.base_set[0] || null,
            currentSetAnswers: [],
            showFeedback: false,
            isCorrect: null,
            isLoading: false,
            nextLevelData: null,
          };
        });
      } else {
        throw new Error('意外的响应状态');
      }
    } catch (error) {
      console.error('Failed to submit assessment:', error);

      const errorMessage = error instanceof Error ? error.message : '提交测试进度失败';
      const isAuthError = errorMessage.includes('Not authenticated') || errorMessage.includes('P0001');

      if (isAuthError) {
        useAppStore.getState().openLoginModal('会话已过期，请重新登录');
        setGameState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
        }));
      } else {
        setGameState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
      }
    }
  }, []);

  /**
   * 下一题
   */
  const nextQuestion = useCallback(async () => {
    const prevState = gameStateRef.current;
    if (!prevState.session) return;

    const currentPacket = prevState.session.packets[prevState.session.currentPacketIndex];
    if (!currentPacket) return;

    const currentSet = prevState.currentSetType === 'base'
      ? currentPacket.base_set
      : currentPacket.rescue_set;

    const nextIndex = prevState.currentQuestionIndex + 1;
    let finalSessionToSubmit: AssessmentSession | null = null;
    let nextState: Partial<GameState> | null = null;

    // --- 早期熔断检查 (Circuit Breaker) ---
    // 仅在基础题集阶段执行，且至少完成 4 题以保证基数
    if (prevState.currentSetType === 'base' && nextIndex < currentSet.length && nextIndex >= 4) {
      const correctCount = prevState.currentSetAnswers.filter(a => a).length;
      const totalExpected = currentSet.length;
      const remainingQuestions = totalExpected - nextIndex;

      // 即使后面全对，能达到的最高正确率
      const maxPotentialAccuracy = (correctCount + remainingQuestions) / totalExpected;

      if (maxPotentialAccuracy <= currentPacket.config.drop_threshold) {
        // 触发熔断：后面全对也无法挽回，直接宣告本级失败
        const result: PacketResult = {
          level: currentPacket.level,
          passed: false,
          correct: correctCount,
          total: nextIndex, // 记录实际完成的题数
        };

        const updatedSession = {
          ...prevState.session,
          allResults: [...prevState.session.allResults, result],
        };

        finalSessionToSubmit = updatedSession;
        nextState = {
          phase: 'final-transition',
          session: updatedSession,
          isLoading: false,
        };
      }
    }

    // 如果没有触发熔断，继续正常的流程逻辑
    if (!nextState) {
      // 检查当前题集是否完成
      if (nextIndex >= currentSet.length) {
        if (prevState.currentSetType === 'base') {
          const evaluation = evaluateBaseSet(
            prevState.currentSetAnswers,
            currentPacket.config
          );

          if (evaluation.status === 'rescue') {
            // 触发急救题集
            nextState = {
              currentSetType: 'rescue',
              currentQuestionIndex: 0,
              currentQuestion: currentPacket.rescue_set[0] || null,
              showFeedback: false,
              isCorrect: null,
            };
          } else {
            // 直接通过或失败
            const result: PacketResult = {
              level: currentPacket.level,
              passed: evaluation.status === 'pass',
              correct: prevState.currentSetAnswers.filter(a => a).length,
              total: prevState.currentSetAnswers.length,
            };

            const updatedSession = {
              ...prevState.session,
              allResults: [...prevState.session.allResults, result],
            };

            if (result.passed) {
              finalSessionToSubmit = updatedSession;
              nextState = {
                phase: 'level-transition',
                session: updatedSession,
                nextLevelData: null,
              };
            } else {
              finalSessionToSubmit = updatedSession;
              nextState = {
                phase: 'final-transition',
                session: updatedSession,
                isLoading: false,
              };
            }
          }
        } else {
          // 急救题集完成
          const baseSetLength = currentPacket.base_set.length;
          const baseAnswers = prevState.currentSetAnswers.slice(0, baseSetLength);
          const rescueAnswers = prevState.currentSetAnswers.slice(baseSetLength);

          const evaluation = evaluateTotalAccuracy(
            baseAnswers,
            rescueAnswers,
            currentPacket.config.pass_threshold
          );

          const result: PacketResult = {
            level: currentPacket.level,
            passed: evaluation.passed,
            correct: prevState.currentSetAnswers.filter(a => a).length,
            total: prevState.currentSetAnswers.length,
          };

          const updatedSession = {
            ...prevState.session,
            allResults: [...prevState.session.allResults, result],
          };

          if (result.passed) {
            finalSessionToSubmit = updatedSession;
            nextState = {
              phase: 'level-transition',
              session: updatedSession,
              nextLevelData: null,
            };
          } else {
            finalSessionToSubmit = updatedSession;
            nextState = {
              phase: 'final-transition',
              session: updatedSession,
              isLoading: false,
            };
          }
        }
      } else {
        // 继续当前题集
        nextState = {
          currentQuestionIndex: nextIndex,
          currentQuestion: currentSet[nextIndex] || null,
          showFeedback: false,
          isCorrect: null,
        };
      }
    }

    if (nextState) {
      setGameState(prev => ({ ...prev, ...nextState }));
    }

    if (finalSessionToSubmit) {
      await performSubmission(finalSessionToSubmit);
    }
  }, [performSubmission]);

  /**
   * 完成等级过渡
   */
  const completeLevelTransition = useCallback(async () => {
    setGameState(prev => {
      if (!prev.session) return prev;

      // 如果数据已经预取完成，直接应用
      if (prev.nextLevelData) {
        const validation = prev.nextLevelData;
        if (validation.status === 'completed' && validation.report) {
          return {
            ...prev,
            phase: 'final-transition',
            report: validation.report!,
            isLoading: false,
            nextLevelData: null,
          };
        } else if (validation.status === 'active' && validation.packets) {
          const newPackets = validation.packets;
          const firstNewPacket = newPackets[0];
          return {
            ...prev,
            phase: 'assessment',
            session: {
              ...prev.session,
              packets: [...prev.session.packets, ...newPackets],
              currentPacketIndex: prev.session.packets.length,
            },
            currentSetType: 'base',
            currentQuestionIndex: 0,
            currentQuestion: firstNewPacket.base_set[0] || null,
            currentSetAnswers: [],
            showFeedback: false,
            isCorrect: null,
            isLoading: false,
            nextLevelData: null,
          };
        }
      }

      // 如果数据还没回来，设置为加载状态
      // 背景中的 performSubmission 会在完成后更新状态
      return { ...prev, isLoading: true };
    });
  }, []);

  /**
   * 完成最终过渡，显示结果页
   */
  const completeFinalTransition = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      phase: 'result',
    }));
  }, []);

  /**
   * 重新开始测试
   */
  const restartAssessment = useCallback(() => {
    setGameState({
      phase: 'age-selection',
      session: null,
      currentQuestion: null,
      currentQuestionIndex: 0,
      currentSetType: 'base',
      currentSetAnswers: [],
      showFeedback: false,
      isCorrect: null,
      report: null,
      nextLevelData: null,
      isLoading: false,
      error: null,
    });
  }, []);

  /**
   * 获取当前题目的选项
   */
  const getCurrentOptions = useCallback((): string[] => {
    if (!gameState.currentQuestion) return [];
    return generateOptions(gameState.currentQuestion);
  }, [gameState.currentQuestion]);

  // ===== Return =====

  return {
    gameState,
    startAssessment,
    submitAnswer,
    nextQuestion,
    completeLevelTransition,
    restartAssessment,
    completeFinalTransition,
    validateAge,
    getCurrentOptions,
  };
}
