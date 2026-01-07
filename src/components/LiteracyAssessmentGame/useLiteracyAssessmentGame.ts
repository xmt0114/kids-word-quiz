/**
 * useLiteracyAssessmentGame Hook
 * 儿童识字量测试游戏核心状态管理Hook
 */

import { useState, useCallback } from 'react';
import type {
  GameState,
  AssessmentSession,
  AssessmentQuestion,
  LevelPacket,
  PacketResult,
  AgeValidationResult,
  UseLiteracyAssessmentGameReturn,
} from './types';
import { wordAPI } from '../../utils/api';
import {
  validateStartAssessmentResponse,
  validateSubmitPacketResponse,
} from './apiValidation';

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
      error: `年龄不能小于${MIN_AGE}岁，当前年龄为${age}岁`,
    };
  }
  
  if (age > MAX_AGE) {
    return {
      isValid: false,
      age,
      error: `年龄不能大于${MAX_AGE}岁，当前年龄为${age}岁`,
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
 * 生成题目选项（包含正确答案和混淆选项，随机排序）
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
    isLoading: false,
    error: null,
  });
  
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
      setGameState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '开始测试失败',
      }));
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
   * 下一题
   */
  const nextQuestion = useCallback(async () => {
    // 首先同步更新状态
    let shouldSubmitFailure = false;
    let sessionToSubmit: AssessmentSession | null = null;
    
    setGameState(prev => {
      if (!prev.session) return prev;
      
      const currentPacket = prev.session.packets[prev.session.currentPacketIndex];
      if (!currentPacket) return prev;
      
      const currentSet = prev.currentSetType === 'base' 
        ? currentPacket.base_set 
        : currentPacket.rescue_set;
      
      const nextIndex = prev.currentQuestionIndex + 1;
      
      // 检查当前题集是否完成
      if (nextIndex >= currentSet.length) {
        // 当前题集完成，需要评估
        if (prev.currentSetType === 'base') {
          // 评估基础题集
          const evaluation = evaluateBaseSet(
            prev.currentSetAnswers,
            currentPacket.config
          );
          
          if (evaluation.status === 'rescue') {
            // 触发急救题集
            return {
              ...prev,
              currentSetType: 'rescue',
              currentQuestionIndex: 0,
              currentQuestion: currentPacket.rescue_set[0] || null,
              currentSetAnswers: [],
              showFeedback: false,
              isCorrect: null,
            };
          } else {
            // 直接通过或失败，准备提交结果
            const result: PacketResult = {
              level: currentPacket.level,
              passed: evaluation.status === 'pass',
              correct: prev.currentSetAnswers.filter(a => a).length,
              total: prev.currentSetAnswers.length,
            };
            
            const updatedSession = {
              ...prev.session,
              allResults: [...prev.session.allResults, result],
            };
            
            // 如果通过，显示等级过渡
            if (result.passed) {
              return {
                ...prev,
                phase: 'level-transition',
                session: updatedSession,
              };
            } else {
              // 失败，需要提交结果
              shouldSubmitFailure = true;
              sessionToSubmit = updatedSession;
              
              return {
                ...prev,
                session: updatedSession,
                isLoading: true,
              };
            }
          }
        } else {
          // 急救题集完成，评估总正确率
          const baseSetLength = currentPacket.base_set.length;
          const baseAnswers = prev.currentSetAnswers.slice(0, baseSetLength);
          const rescueAnswers = prev.currentSetAnswers.slice(baseSetLength);
          
          const evaluation = evaluateTotalAccuracy(
            baseAnswers,
            rescueAnswers,
            currentPacket.config.pass_threshold
          );
          
          const result: PacketResult = {
            level: currentPacket.level,
            passed: evaluation.passed,
            correct: [...baseAnswers, ...rescueAnswers].filter(a => a).length,
            total: baseAnswers.length + rescueAnswers.length,
          };
          
          const updatedSession = {
            ...prev.session,
            allResults: [...prev.session.allResults, result],
          };
          
          if (result.passed) {
            return {
              ...prev,
              phase: 'level-transition',
              session: updatedSession,
            };
          } else {
            // 失败，需要提交结果
            shouldSubmitFailure = true;
            sessionToSubmit = updatedSession;
            
            return {
              ...prev,
              session: updatedSession,
              isLoading: true,
            };
          }
        }
      }
      
      // 继续当前题集的下一题
      return {
        ...prev,
        currentQuestionIndex: nextIndex,
        currentQuestion: currentSet[nextIndex] || null,
        showFeedback: false,
        isCorrect: null,
      };
    });
    
    // 如果需要提交失败结果，执行异步操作
    if (shouldSubmitFailure && sessionToSubmit) {
      try {
        if (!wordAPI.submitPacketV6) {
          throw new Error('API方法未实现：submitPacketV6');
        }
        
        const response = await wordAPI.submitPacketV6(
          sessionToSubmit.sessionId,
          sessionToSubmit.allResults
        );
        
        if (!response.success || !response.data) {
          throw new Error(response.error || '提交结果失败');
        }
        
        // 验证响应数据
        const validation = validateSubmitPacketResponse(response.data);
        
        if (!validation.isValid) {
          throw new Error(validation.error || '响应数据验证失败');
        }
        
        // 根据状态更新游戏状态
        if (validation.status === 'completed' && validation.report) {
          setGameState(prev => ({
            ...prev,
            phase: 'result',
            report: validation.report!,
            isLoading: false,
          }));
        } else {
          throw new Error('意外的响应状态');
        }
      } catch (error) {
        console.error('Failed to submit packet:', error);
        setGameState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : '提交结果失败',
        }));
      }
    }
  }, []);
  
  /**
   * 完成等级过渡
   */
  const completeLevelTransition = useCallback(async () => {
    let shouldSubmitResults = false;
    let sessionToSubmit: AssessmentSession | null = null;
    
    setGameState(prev => {
      if (!prev.session) return prev;
      
      const nextPacketIndex = prev.session.currentPacketIndex + 1;
      
      // 检查是否还有更多题包
      if (nextPacketIndex < prev.session.packets.length) {
        const nextPacket = prev.session.packets[nextPacketIndex];
        
        return {
          ...prev,
          phase: 'assessment',
          session: {
            ...prev.session,
            currentPacketIndex: nextPacketIndex,
          },
          currentSetType: 'base',
          currentQuestionIndex: 0,
          currentQuestion: nextPacket.base_set[0] || null,
          currentSetAnswers: [],
          showFeedback: false,
          isCorrect: null,
        };
      } else {
        // 所有题包完成，需要提交结果获取最终报告
        shouldSubmitResults = true;
        sessionToSubmit = prev.session;
        
        return {
          ...prev,
          isLoading: true,
        };
      }
    });
    
    // 如果需要提交结果，执行异步操作
    if (shouldSubmitResults && sessionToSubmit) {
      try {
        if (!wordAPI.submitPacketV6) {
          throw new Error('API方法未实现：submitPacketV6');
        }
        
        const response = await wordAPI.submitPacketV6(
          sessionToSubmit.sessionId,
          sessionToSubmit.allResults
        );
        
        if (!response.success || !response.data) {
          throw new Error(response.error || '提交结果失败');
        }
        
        // 验证响应数据
        const validation = validateSubmitPacketResponse(response.data);
        
        if (!validation.isValid) {
          throw new Error(validation.error || '响应数据验证失败');
        }
        
        // 根据状态更新游戏状态
        if (validation.status === 'completed' && validation.report) {
          setGameState(prev => ({
            ...prev,
            phase: 'result',
            report: validation.report!,
            isLoading: false,
          }));
        } else if (validation.status === 'active' && validation.packets) {
          // 收到新的题包，继续测试
          const newPackets = validation.packets;
          const firstNewPacket = newPackets[0];
          
          setGameState(prev => ({
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
          }));
        } else {
          throw new Error('意外的响应状态');
        }
      } catch (error) {
        console.error('Failed to submit packet:', error);
        setGameState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : '提交结果失败',
        }));
      }
    }
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
    validateAge,
    getCurrentOptions,
  };
}
