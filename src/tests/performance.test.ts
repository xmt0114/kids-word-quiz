/**
 * 性能测试
 * 验证大量题目时的渲染性能和内存使用
 */

import { describe, it, expect } from '@jest/globals';
import {
  sanitizeQuestionResults,
  calculateDetailedStats,
  calculateGrade,
  getAchievementInfo
} from '../utils/resultCalculations';
import { QuestionResult, EnhancedQuizResult } from '../types/index';

describe('性能测试', () => {
  // 生成大量测试数据
  const generateLargeQuestionResults = (count: number): QuestionResult[] => {
    return Array.from({ length: count }, (_, index) => ({
      questionIndex: index,
      question: {
        id: index,
        word: `word${index}`,
        definition: `definition${index}`,
        answer: `answer${index}`,
        options: [`option1${index}`, `option2${index}`, `option3${index}`, `option4${index}`],
        audioText: `audio${index}`,
        hint: `hint${index}`,
        difficulty: 'medium' as const
      },
      userAnswer: index % 3 === 0 ? `answer${index}` : `wrong${index}`,
      isCorrect: index % 3 === 0,
      timeSpent: Math.random() * 30 + 5 // 5-35秒
    }));
  };

  it('应该能够处理100+题目而不出现性能问题', () => {
    const startTime = performance.now();
    
    // 生成150道题目
    const questionResults = generateLargeQuestionResults(150);
    
    // 测试数据清理性能
    const sanitized = sanitizeQuestionResults(questionResults, 150, 50);
    expect(sanitized).toHaveLength(150);
    
    // 测试统计计算性能
    const enhancedResult: EnhancedQuizResult = {
      totalQuestions: 150,
      correctAnswers: 50,
      accuracy: (50 / 150) * 100,
      score: 50,
      questionResults: sanitized
    };
    
    const stats = calculateDetailedStats(enhancedResult);
    expect(stats).toHaveProperty('longestStreak');
    expect(stats.longestStreak).toBeGreaterThanOrEqual(0);
    
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    // 性能断言：处理150道题目应该在100ms内完成
    expect(executionTime).toBeLessThan(100);
  });

  it('sanitizeQuestionResults 应该在大数据量下保持高性能', () => {
    const testSizes = [50, 100, 200, 500];
    
    testSizes.forEach(size => {
      const startTime = performance.now();
      
      // 测试空数据的处理性能
      const result = sanitizeQuestionResults(null, size, Math.floor(size * 0.7));
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(result).toHaveLength(size);
      // 每个题目的处理时间应该小于0.1ms
      expect(executionTime / size).toBeLessThan(0.1);
    });
  });

  it('calculateDetailedStats 应该在大数据量下保持高性能', () => {
    const sizes = [100, 200, 500, 1000];
    
    sizes.forEach(size => {
      const questionResults = generateLargeQuestionResults(size);
      const correctAnswers = questionResults.filter(q => q.isCorrect).length;
      
      const enhancedResult: EnhancedQuizResult = {
        totalQuestions: size,
        correctAnswers,
        accuracy: (correctAnswers / size) * 100,
        score: correctAnswers,
        questionResults,
        timeSpent: size * 10 // 模拟总用时
      };
      
      const startTime = performance.now();
      const stats = calculateDetailedStats(enhancedResult);
      const endTime = performance.now();
      
      const executionTime = endTime - startTime;
      
      expect(stats).toHaveProperty('longestStreak');
      expect(stats).toHaveProperty('averageTimePerQuestion');
      
      // 统计计算应该在合理时间内完成
      expect(executionTime).toBeLessThan(50);
    });
  });

  it('等级计算应该保持一致的性能', () => {
    const testCases = Array.from({ length: 1000 }, () => Math.random() * 100);
    
    const startTime = performance.now();
    
    testCases.forEach(accuracy => {
      const gradeInfo = calculateGrade(accuracy);
      expect(gradeInfo).toHaveProperty('grade');
      expect(gradeInfo).toHaveProperty('color');
      expect(gradeInfo).toHaveProperty('bgColor');
    });
    
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    // 1000次等级计算应该在500ms内完成
    expect(executionTime).toBeLessThan(500);
  });

  it('成就计算应该保持高性能', () => {
    const testCases = Array.from({ length: 500 }, () => ({
      accuracy: Math.random() * 100,
      totalQuestions: Math.floor(Math.random() * 100) + 1,
      longestStreak: Math.floor(Math.random() * 50)
    }));
    
    const startTime = performance.now();
    
    testCases.forEach(({ accuracy, totalQuestions, longestStreak }) => {
      const achievement = getAchievementInfo(accuracy, totalQuestions, longestStreak);
      expect(achievement).toHaveProperty('hasAchievement');
      expect(achievement).toHaveProperty('title');
      expect(achievement).toHaveProperty('description');
    });
    
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    // 500次成就计算应该在200ms内完成
    expect(executionTime).toBeLessThan(200);
  });

  it('内存使用应该保持在合理范围内', () => {
    // 测试内存泄漏
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    // 创建和销毁大量数据
    for (let i = 0; i < 10; i++) {
      const questionResults = generateLargeQuestionResults(100);
      const sanitized = sanitizeQuestionResults(questionResults, 100, 70);
      
      const enhancedResult: EnhancedQuizResult = {
        totalQuestions: 100,
        correctAnswers: 70,
        accuracy: 70,
        score: 70,
        questionResults: sanitized
      };
      
      calculateDetailedStats(enhancedResult);
    }
    
    // 强制垃圾回收（如果可用）
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    // 如果浏览器支持内存监控，检查内存增长
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = finalMemory - initialMemory;
      // 内存增长应该小于10MB
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    }
  });

  it('边界情况应该保持性能稳定', () => {
    const edgeCases = [
      { size: 0, correct: 0 },
      { size: 1, correct: 1 },
      { size: 1000, correct: 0 },
      { size: 1000, correct: 1000 },
      { size: 500, correct: 250 }
    ];
    
    edgeCases.forEach(({ size, correct }) => {
      const startTime = performance.now();
      
      const result = sanitizeQuestionResults(null, size, correct);
      if (size > 0) {
        const enhancedResult: EnhancedQuizResult = {
          totalQuestions: size,
          correctAnswers: correct,
          accuracy: size > 0 ? (correct / size) * 100 : 0,
          score: correct,
          questionResults: result
        };
        
        calculateDetailedStats(enhancedResult);
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // 即使在边界情况下，执行时间也应该合理
      expect(executionTime).toBeLessThan(100);
    });
  });
});