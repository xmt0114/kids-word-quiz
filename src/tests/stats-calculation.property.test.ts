/**
 * **Feature: game-result-page-enhancement, Property 2: 统计数据计算正确性**
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 */

import { describe, it, expect } from '@jest/globals';
import fc from 'fast-check';
import { 
  calculateDetailedStats,
  formatTime,
  createTooltipContent,
  calculateGameDuration
} from '../utils/resultCalculations';
import { 
  EnhancedQuizResult, 
  QuestionResult, 
  Word,
  TimeFormatOptions
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
  timeSpent: fc.option(fc.float({ min: Math.fround(0.1), max: Math.fround(300) }), { nil: undefined })
});

// 生成器：创建增强的游戏结果
const enhancedQuizResultArb = fc.record({
  totalQuestions: fc.integer({ min: 1, max: 100 }),
  correctAnswers: fc.integer({ min: 0, max: 100 }),
  score: fc.integer({ min: 0, max: 100 }),
  accuracy: fc.float({ min: Math.fround(0), max: Math.fround(100) }),
  timeSpent: fc.option(fc.float({ min: Math.fround(1), max: Math.fround(3600) }), { nil: undefined }),
  questionResults: fc.option(fc.array(questionResultArb, { minLength: 1, maxLength: 100 }), { nil: undefined }),
  startTime: fc.option(fc.integer({ min: 1600000000000, max: 2000000000000 }), { nil: undefined }),
  endTime: fc.option(fc.integer({ min: 1600000000000, max: 2000000000000 }), { nil: undefined })
}).filter(result => result.correctAnswers <= result.totalQuestions);

describe('Statistics Calculation Property Tests', () => {
  describe('Property 2: 统计数据计算正确性', () => {
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
            const expectedAccuracy = result.totalQuestions > 0 
              ? (result.correctAnswers / result.totalQuestions) * 100 
              : 0;
            const expectedFormat = `${expectedAccuracy.toFixed(1)}% (${result.correctAnswers}/${result.totalQuestions})`;
            
            expect(stats.accuracyDisplay).toBe(expectedFormat);
            expect(stats.accuracyDisplay).toMatch(/^\d+\.\d% \(\d+\/\d+\)$/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('对于任何时间值，时间格式化应该返回正确的格式', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(3599) }).filter(n => isFinite(n) && !isNaN(n)), // 0到59分59秒，避免小时格式
          (timeInSeconds) => {
            const formattedTime = formatTime(timeInSeconds);
            
            // 验证默认mm:ss格式
            expect(formattedTime).toMatch(/^\d+:\d{2}$/);
            
            // 验证数值正确性
            const [minutes, seconds] = formattedTime.split(':').map(Number);
            const totalSeconds = minutes * 60 + seconds;
            expect(totalSeconds).toBeCloseTo(Math.floor(timeInSeconds), 0);
            
            // 秒数应该在0-59范围内
            expect(seconds).toBeGreaterThanOrEqual(0);
            expect(seconds).toBeLessThan(60);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('时间格式化应该正确处理不同的格式选项', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(7200) }).filter(n => isFinite(n) && !isNaN(n)),
          fc.record({
            showHours: fc.option(fc.boolean(), { nil: undefined }),
            showMilliseconds: fc.option(fc.boolean(), { nil: undefined }),
            format: fc.option(fc.oneof(
              fc.constant('mm:ss' as const),
              fc.constant('h:mm:ss' as const),
              fc.constant('compact' as const)
            ), { nil: undefined })
          }),
          (timeInSeconds, options) => {
            const formattedTime = formatTime(timeInSeconds, options);
            
            expect(formattedTime).toBeDefined();
            expect(formattedTime.length).toBeGreaterThan(0);
            
            if (options.format === 'compact') {
              expect(formattedTime).toMatch(/(秒|分钟|小时)/);
            } else if (options.showHours) {
              expect(formattedTime).toMatch(/^\d+:\d{2}:\d{2}/);
            } else {
              expect(formattedTime).toMatch(/^\d+:\d{2}/);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('悬浮提示内容创建应该包含所有必需信息', () => {
      fc.assert(
        fc.property(
          wordArb,
          fc.string({ minLength: 0, maxLength: 50 }),
          fc.option(fc.float({ min: Math.fround(0.1), max: Math.fround(300) }), { nil: undefined }),
          (question, userAnswer, timeSpent) => {
            const tooltip = createTooltipContent(question, userAnswer, timeSpent);
            
            expect(tooltip.question).toBe(question.word);
            expect(tooltip.correctAnswer).toBe(question.answer);
            expect(tooltip.userAnswer).toBe(userAnswer || '未作答');
            expect(typeof tooltip.isCorrect).toBe('boolean');
            
            if (timeSpent) {
              expect(tooltip.timeSpent).toBeDefined();
              expect(tooltip.timeSpent).toMatch(/^\d+:\d{2}$/);
            } else {
              expect(tooltip.timeSpent).toBeUndefined();
            }
            
            // 验证正确性判断
            const expectedCorrect = userAnswer.toLowerCase().trim() === question.answer.toLowerCase().trim();
            expect(tooltip.isCorrect).toBe(expectedCorrect);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('游戏时长计算应该正确处理时间戳', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1600000000000, max: 2000000000000 }),
          fc.integer({ min: 1, max: 7200 }), // 1秒到2小时的差值
          (startTime, durationMs) => {
            const endTime = startTime + (durationMs * 1000);
            const calculatedDuration = calculateGameDuration(startTime, endTime);
            
            expect(calculatedDuration).toBeDefined();
            expect(calculatedDuration).toBeCloseTo(durationMs, 0);
            expect(calculatedDuration).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('游戏时长计算应该处理无效输入', () => {
      const invalidCases = [
        [undefined, undefined],
        [1000, undefined],
        [undefined, 2000],
        [2000, 1000], // 结束时间早于开始时间
        [1000, 1000]  // 相同时间
      ];

      invalidCases.forEach(([startTime, endTime]) => {
        const duration = calculateGameDuration(startTime, endTime);
        expect(duration).toBeUndefined();
      });
    });

    it('统计计算应该处理边缘情况', () => {
      // 空题目结果
      const emptyResult: EnhancedQuizResult = {
        totalQuestions: 5,
        correctAnswers: 3,
        score: 60,
        accuracy: 60,
        questionResults: []
      };
      
      const emptyStats = calculateDetailedStats(emptyResult);
      expect(emptyStats.longestStreak).toBe(0);
      expect(emptyStats.accuracyDisplay).toBe('60.0% (3/5)');

      // 全部正确
      const allCorrectResults: QuestionResult[] = Array.from({ length: 5 }, (_, i) => ({
        questionIndex: i,
        question: {
          id: i + 1,
          word: `word${i}`,
          definition: `def${i}`,
          audioText: `audio${i}`,
          difficulty: 'easy' as const,
          options: ['a', 'b'],
          answer: 'correct',
          hint: `hint${i}`
        },
        userAnswer: 'correct',
        isCorrect: true
      }));

      const allCorrectResult: EnhancedQuizResult = {
        totalQuestions: 5,
        correctAnswers: 5,
        score: 100,
        accuracy: 100,
        questionResults: allCorrectResults
      };

      const allCorrectStats = calculateDetailedStats(allCorrectResult);
      expect(allCorrectStats.longestStreak).toBe(5);
      expect(allCorrectStats.accuracyDisplay).toBe('100.0% (5/5)');

      // 全部错误
      const allWrongResults: QuestionResult[] = Array.from({ length: 5 }, (_, i) => ({
        questionIndex: i,
        question: {
          id: i + 1,
          word: `word${i}`,
          definition: `def${i}`,
          audioText: `audio${i}`,
          difficulty: 'easy' as const,
          options: ['a', 'b'],
          answer: 'correct',
          hint: `hint${i}`
        },
        userAnswer: 'wrong',
        isCorrect: false
      }));

      const allWrongResult: EnhancedQuizResult = {
        totalQuestions: 5,
        correctAnswers: 0,
        score: 0,
        accuracy: 0,
        questionResults: allWrongResults
      };

      const allWrongStats = calculateDetailedStats(allWrongResult);
      expect(allWrongStats.longestStreak).toBe(0);
      expect(allWrongStats.accuracyDisplay).toBe('0.0% (0/5)');
    });

    it('时间格式化应该处理负数和零值', () => {
      expect(formatTime(-10)).toBe('0:00');
      expect(formatTime(0)).toBe('0:00');
      expect(formatTime(59)).toBe('0:59');
      expect(formatTime(60)).toBe('1:00');
      expect(formatTime(3661)).toBe('1:01:01'); // 超过1小时会显示小时格式
    });

    it('时间格式化应该处理无效输入', () => {
      expect(formatTime(NaN)).toBe('0:00');
      expect(formatTime(Infinity)).toBe('0:00');
      expect(formatTime(-Infinity)).toBe('0:00');
    });

    it('连续正确计算应该处理交替模式', () => {
      // 创建交替正确/错误的模式
      const alternatingResults: QuestionResult[] = Array.from({ length: 10 }, (_, i) => ({
        questionIndex: i,
        question: {
          id: i + 1,
          word: `word${i}`,
          definition: `def${i}`,
          audioText: `audio${i}`,
          difficulty: 'easy' as const,
          options: ['a', 'b'],
          answer: 'correct',
          hint: `hint${i}`
        },
        userAnswer: i % 2 === 0 ? 'correct' : 'wrong',
        isCorrect: i % 2 === 0
      }));

      const result: EnhancedQuizResult = {
        totalQuestions: 10,
        correctAnswers: 5,
        score: 50,
        accuracy: 50,
        questionResults: alternatingResults
      };

      const stats = calculateDetailedStats(result);
      expect(stats.longestStreak).toBe(1); // 交替模式下最长连续为1
    });
  });
});