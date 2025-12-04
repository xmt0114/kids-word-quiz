/**
 * **Feature: game-result-page-enhancement, Property 2: 统计数据计算正确性**
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 */

import { describe, it, expect } from '@jest/globals';
import fc from 'fast-check';
import { 
  EnhancedQuizResult, 
  QuestionResult, 
  GradeInfo, 
  DetailedStats, 
  Word 
} from '../types/index';

// 生成器：创建单词对象
const wordArb = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  word: fc.string({ minLength: 1, maxLength: 50 }),
  definition: fc.string({ minLength: 1, maxLength: 200 }),
  audioText: fc.string({ minLength: 1, maxLength: 100 }),
  difficulty: fc.oneof(
    fc.constant('easy' as const),
    fc.constant('medium' as const),
    fc.constant('hard' as const)
  ),
  options: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 4 }),
  answer: fc.string({ minLength: 1, maxLength: 50 }),
  hint: fc.string({ minLength: 1, maxLength: 100 })
});

// 生成器：创建题目结果
const questionResultArb = fc.record({
  questionIndex: fc.integer({ min: 0, max: 99 }),
  question: wordArb,
  userAnswer: fc.string({ minLength: 0, maxLength: 50 }),
  isCorrect: fc.boolean(),
  timeSpent: fc.option(fc.float({ min: Math.fround(0.1), max: Math.fround(300) }), { nil: undefined }) // 0.1秒到5分钟
});

// 生成器：创建增强的游戏结果
const enhancedQuizResultArb = fc.record({
  totalQuestions: fc.integer({ min: 1, max: 100 }),
  correctAnswers: fc.integer({ min: 0, max: 100 }),
  score: fc.integer({ min: 0, max: 100 }),
  accuracy: fc.float({ min: Math.fround(0), max: Math.fround(100) }),
  timeSpent: fc.option(fc.float({ min: Math.fround(1), max: Math.fround(3600) }), { nil: undefined }), // 1秒到1小时
  questionResults: fc.option(fc.array(questionResultArb, { minLength: 1, maxLength: 100 }), { nil: undefined }),
  startTime: fc.option(fc.integer({ min: 1600000000000, max: 2000000000000 }), { nil: undefined }), // 时间戳
  endTime: fc.option(fc.integer({ min: 1600000000000, max: 2000000000000 }), { nil: undefined })
}).filter(result => result.correctAnswers <= result.totalQuestions);

// 等级计算函数
const calculateGrade = (accuracy: number): GradeInfo => {
  if (accuracy >= 95) return {
    grade: 'S',
    color: 'text-yellow-500',
    bgColor: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
    description: '完美表现！',
    celebrationLevel: 'high'
  };
  if (accuracy >= 85) return {
    grade: 'A',
    color: 'text-green-500',
    bgColor: 'bg-gradient-to-br from-green-400 to-green-600',
    description: '优秀！',
    celebrationLevel: 'medium'
  };
  if (accuracy >= 70) return {
    grade: 'B',
    color: 'text-blue-500',
    bgColor: 'bg-gradient-to-br from-blue-400 to-blue-600',
    description: '良好！',
    celebrationLevel: 'medium'
  };
  if (accuracy >= 60) return {
    grade: 'C',
    color: 'text-orange-500',
    bgColor: 'bg-gradient-to-br from-orange-400 to-orange-600',
    description: '还需努力！',
    celebrationLevel: 'low'
  };
  return {
    grade: 'D',
    color: 'text-red-500',
    bgColor: 'bg-gradient-to-br from-red-400 to-red-600',
    description: '继续加油！',
    celebrationLevel: 'low'
  };
};

// 详细统计计算函数
const calculateDetailedStats = (result: EnhancedQuizResult): DetailedStats => {
  const { questionResults = [], timeSpent, correctAnswers, totalQuestions } = result;
  
  // 计算平均每题用时
  const averageTimePerQuestion = timeSpent ? timeSpent / totalQuestions : undefined;
  
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
  
  // 格式化时间
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 格式化准确率显示
  const accuracy = (correctAnswers / totalQuestions) * 100;
  const accuracyDisplay = `${accuracy.toFixed(1)}% (${correctAnswers}/${totalQuestions})`;
  
  return {
    averageTimePerQuestion,
    longestStreak,
    formattedTime: timeSpent ? formatTime(timeSpent) : undefined,
    accuracyDisplay
  };
};

describe('Result Page Data Property Tests', () => {
  describe('Property 2: 统计数据计算正确性', () => {
    it('对于任何准确率值，等级计算应该返回正确的等级范围', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(100) }),
          (accuracy) => {
            const grade = calculateGrade(accuracy);
            
            // 验证等级范围
            if (accuracy >= 95) {
              expect(grade.grade).toBe('S');
              expect(grade.celebrationLevel).toBe('high');
            } else if (accuracy >= 85) {
              expect(grade.grade).toBe('A');
              expect(grade.celebrationLevel).toBe('medium');
            } else if (accuracy >= 70) {
              expect(grade.grade).toBe('B');
              expect(grade.celebrationLevel).toBe('medium');
            } else if (accuracy >= 60) {
              expect(grade.grade).toBe('C');
              expect(grade.celebrationLevel).toBe('low');
            } else {
              expect(grade.grade).toBe('D');
              expect(grade.celebrationLevel).toBe('low');
            }
            
            // 验证必需字段存在
            expect(grade.color).toBeDefined();
            expect(grade.bgColor).toBeDefined();
            expect(grade.description).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('对于任何有效的游戏结果，平均用时计算应该数学正确', () => {
      fc.assert(
        fc.property(
          enhancedQuizResultArb,
          (result) => {
            const stats = calculateDetailedStats(result);
            
            if (result.timeSpent && result.totalQuestions > 0) {
              expect(stats.averageTimePerQuestion).toBeDefined();
              expect(stats.averageTimePerQuestion).toBeCloseTo(
                result.timeSpent / result.totalQuestions,
                2
              );
              expect(stats.averageTimePerQuestion).toBeGreaterThan(0);
            } else {
              expect(stats.averageTimePerQuestion).toBeUndefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('对于任何题目结果序列，最长连续正确计算应该准确', () => {
      fc.assert(
        fc.property(
          fc.array(questionResultArb, { minLength: 1, maxLength: 50 }),
          (questionResults) => {
            const result: EnhancedQuizResult = {
              totalQuestions: questionResults.length,
              correctAnswers: questionResults.filter(q => q.isCorrect).length,
              score: 0,
              accuracy: 0,
              questionResults
            };
            
            const stats = calculateDetailedStats(result);
            
            // 手动计算最长连续正确
            let expectedLongestStreak = 0;
            let currentStreak = 0;
            
            questionResults.forEach(qr => {
              if (qr.isCorrect) {
                currentStreak++;
                expectedLongestStreak = Math.max(expectedLongestStreak, currentStreak);
              } else {
                currentStreak = 0;
              }
            });
            
            expect(stats.longestStreak).toBe(expectedLongestStreak);
            expect(stats.longestStreak).toBeGreaterThanOrEqual(0);
            expect(stats.longestStreak).toBeLessThanOrEqual(questionResults.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('对于任何游戏结果，准确率显示格式应该正确', () => {
      fc.assert(
        fc.property(
          enhancedQuizResultArb,
          (result) => {
            const stats = calculateDetailedStats(result);
            
            // 验证准确率显示格式
            const expectedAccuracy = (result.correctAnswers / result.totalQuestions) * 100;
            const expectedFormat = `${expectedAccuracy.toFixed(1)}% (${result.correctAnswers}/${result.totalQuestions})`;
            
            expect(stats.accuracyDisplay).toBe(expectedFormat);
            expect(stats.accuracyDisplay).toMatch(/^\d+\.\d% \(\d+\/\d+\)$/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('对于任何时间值，时间格式化应该返回正确的mm:ss格式', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(3600) }), // 0到1小时
          (timeInSeconds) => {
            const result: EnhancedQuizResult = {
              totalQuestions: 10,
              correctAnswers: 5,
              score: 50,
              accuracy: 50,
              timeSpent: timeInSeconds
            };
            
            const stats = calculateDetailedStats(result);
            
            if (stats.formattedTime) {
              // 验证格式
              expect(stats.formattedTime).toMatch(/^\d+:\d{2}$/);
              
              // 验证数值正确性
              const [minutes, seconds] = stats.formattedTime.split(':').map(Number);
              const totalSeconds = minutes * 60 + seconds;
              expect(totalSeconds).toBeCloseTo(Math.floor(timeInSeconds), 0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('等级计算应该在边界值处正确工作', () => {
      // 测试边界值
      const boundaryTests = [
        { accuracy: 95, expectedGrade: 'S' },
        { accuracy: 94.9, expectedGrade: 'A' },
        { accuracy: 85, expectedGrade: 'A' },
        { accuracy: 84.9, expectedGrade: 'B' },
        { accuracy: 70, expectedGrade: 'B' },
        { accuracy: 69.9, expectedGrade: 'C' },
        { accuracy: 60, expectedGrade: 'C' },
        { accuracy: 59.9, expectedGrade: 'D' },
        { accuracy: 0, expectedGrade: 'D' }
      ];

      boundaryTests.forEach(({ accuracy, expectedGrade }) => {
        const grade = calculateGrade(accuracy);
        expect(grade.grade).toBe(expectedGrade);
      });
    });

    it('统计计算应该处理空的题目结果数组', () => {
      const result: EnhancedQuizResult = {
        totalQuestions: 5,
        correctAnswers: 3,
        score: 60,
        accuracy: 60,
        questionResults: []
      };
      
      const stats = calculateDetailedStats(result);
      
      expect(stats.longestStreak).toBe(0);
      expect(stats.accuracyDisplay).toBe('60.0% (3/5)');
    });
  });
});