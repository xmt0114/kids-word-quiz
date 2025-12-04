/**
 * **Feature: game-result-page-enhancement, Property 4: 交互反馈一致性**
 * **Validates: Requirements 4.4, 5.3, 6.3**
 */

import { describe, it, expect } from '@jest/globals';
import fc from 'fast-check';
import { 
  validateQuizResult,
  calculateGrade,
  calculateDetailedStats,
  shouldShowCelebration,
  getEncouragementMessage
} from '../utils/resultCalculations';
import { 
  EnhancedQuizResult,
  QuestionResult,
  QuizResult,
  GradeInfo
} from '../types/index';

// 生成器：创建有效的游戏结果
const validQuizResultArb = fc.record({
  totalQuestions: fc.integer({ min: 1, max: 100 }),
  correctAnswers: fc.integer({ min: 0, max: 100 }),
  score: fc.integer({ min: 0, max: 100 }),
  accuracy: fc.float({ min: Math.fround(0), max: Math.fround(100) }).filter(n => isFinite(n) && !isNaN(n))
}).filter(result => result.correctAnswers <= result.totalQuestions);

// 生成器：创建题目结果
const questionResultArb = fc.record({
  questionIndex: fc.integer({ min: 0, max: 99 }),
  question: fc.record({
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
  }),
  userAnswer: fc.string({ minLength: 0, maxLength: 50 }),
  isCorrect: fc.boolean(),
  timeSpent: fc.option(fc.float({ min: Math.fround(0.1), max: Math.fround(300) }).filter(n => isFinite(n) && !isNaN(n)), { nil: undefined })
});

describe('Result Page Integration Property Tests', () => {
  describe('Property 4: 交互反馈一致性', () => {
    it('结果页面数据处理流程应该保持一致性', () => {
      fc.assert(
        fc.property(
          validQuizResultArb,
          fc.option(fc.array(questionResultArb, { minLength: 1, maxLength: 50 }), { nil: undefined }),
          fc.option(fc.float({ min: Math.fround(1), max: Math.fround(3600) }).filter(n => isFinite(n) && !isNaN(n)), { nil: undefined }),
          (baseResult, questionResults, timeSpent) => {
            // 构建增强结果
            const enhancedResult: EnhancedQuizResult = {
              ...baseResult,
              questionResults: questionResults || [],
              timeSpent
            };

            // 验证数据验证流程
            const validation = validateQuizResult(baseResult);
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);

            // 验证等级计算
            const gradeInfo = calculateGrade(baseResult.accuracy);
            expect(gradeInfo).toBeDefined();
            expect(['S', 'A', 'B', 'C', 'D']).toContain(gradeInfo.grade);
            expect(gradeInfo.color).toBeDefined();
            expect(gradeInfo.description).toBeDefined();

            // 验证详细统计计算
            const detailedStats = calculateDetailedStats(enhancedResult);
            expect(detailedStats).toBeDefined();
            expect(detailedStats.accuracyDisplay).toMatch(/^\d+\.\d% \(\d+\/\d+\)$/);
            expect(detailedStats.longestStreak).toBeGreaterThanOrEqual(0);

            // 验证庆祝动画逻辑
            const showCelebration = shouldShowCelebration(gradeInfo, baseResult.accuracy);
            expect(typeof showCelebration).toBe('boolean');

            // 验证鼓励信息生成
            const encouragementMessage = getEncouragementMessage(baseResult.accuracy, baseResult.totalQuestions);
            expect(encouragementMessage).toBeDefined();
            expect(encouragementMessage.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('等级计算和庆祝动画应该保持逻辑一致性', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(100) }).filter(n => isFinite(n) && !isNaN(n)),
          (accuracy) => {
            const gradeInfo = calculateGrade(accuracy);
            const showCelebration = shouldShowCelebration(gradeInfo, accuracy);

            // S级或满分应该显示庆祝动画
            if (gradeInfo.grade === 'S' || accuracy === 100) {
              expect(showCelebration).toBe(true);
            }

            // 验证等级与庆祝级别的一致性
            if (gradeInfo.celebrationLevel === 'high') {
              expect(gradeInfo.grade).toBe('S');
            } else if (gradeInfo.celebrationLevel === 'medium') {
              expect(['A', 'B']).toContain(gradeInfo.grade);
            } else if (gradeInfo.celebrationLevel === 'low') {
              expect(['C', 'D']).toContain(gradeInfo.grade);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('统计数据计算应该与原始数据保持一致性', () => {
      fc.assert(
        fc.property(
          validQuizResultArb,
          fc.array(questionResultArb, { minLength: 1, maxLength: 50 }),
          (baseResult, questionResults) => {
            // 确保题目结果与基础结果一致
            const consistentQuestionResults = questionResults.map((qr, index) => ({
              ...qr,
              questionIndex: index,
              isCorrect: index < baseResult.correctAnswers
            }));

            const enhancedResult: EnhancedQuizResult = {
              ...baseResult,
              questionResults: consistentQuestionResults.slice(0, baseResult.totalQuestions)
            };

            const detailedStats = calculateDetailedStats(enhancedResult);

            // 验证准确率显示与原始数据一致
            const expectedAccuracy = (baseResult.correctAnswers / baseResult.totalQuestions) * 100;
            const expectedDisplay = `${expectedAccuracy.toFixed(1)}% (${baseResult.correctAnswers}/${baseResult.totalQuestions})`;
            expect(detailedStats.accuracyDisplay).toBe(expectedDisplay);

            // 验证最长连续正确不超过总题数
            expect(detailedStats.longestStreak).toBeLessThanOrEqual(baseResult.totalQuestions);
            expect(detailedStats.longestStreak).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('鼓励信息应该根据表现水平提供合适的反馈', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(100) }).filter(n => isFinite(n) && !isNaN(n)),
          fc.integer({ min: 1, max: 100 }),
          (accuracy, totalQuestions) => {
            const message = getEncouragementMessage(accuracy, totalQuestions);
            
            expect(message).toBeDefined();
            expect(message.length).toBeGreaterThan(0);

            // 验证特殊情况的消息
            if (accuracy === 100) {
              expect(message).toContain('完美');
            } else if (accuracy === 0) {
              expect(message).toContain('别灰心');
            } else if (accuracy >= 90) {
              expect(message).toContain('出色');
            }

            // 消息应该是积极正面的
            expect(message).not.toContain('失败');
            expect(message).not.toContain('糟糕');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('组件数据流应该处理边缘情况', () => {
      // 测试最小有效结果
      const minimalResult: QuizResult = {
        totalQuestions: 1,
        correctAnswers: 0,
        score: 0,
        accuracy: 0
      };

      const validation = validateQuizResult(minimalResult);
      expect(validation.isValid).toBe(true);

      const gradeInfo = calculateGrade(minimalResult.accuracy);
      expect(gradeInfo.grade).toBe('D');

      const enhancedMinimal: EnhancedQuizResult = {
        ...minimalResult,
        questionResults: []
      };

      const stats = calculateDetailedStats(enhancedMinimal);
      expect(stats.accuracyDisplay).toBe('0.0% (0/1)');
      expect(stats.longestStreak).toBe(0);

      // 测试满分结果
      const perfectResult: QuizResult = {
        totalQuestions: 10,
        correctAnswers: 10,
        score: 100,
        accuracy: 100
      };

      const perfectValidation = validateQuizResult(perfectResult);
      expect(perfectValidation.isValid).toBe(true);

      const perfectGrade = calculateGrade(perfectResult.accuracy);
      expect(perfectGrade.grade).toBe('S');

      const showPerfectCelebration = shouldShowCelebration(perfectGrade, perfectResult.accuracy);
      expect(showPerfectCelebration).toBe(true);
    });

    it('数据验证应该正确识别无效输入', () => {
      const invalidCases = [
        null,
        undefined,
        {},
        { totalQuestions: 0 },
        { totalQuestions: 10, correctAnswers: -1 },
        { totalQuestions: 10, correctAnswers: 15 },
        { totalQuestions: 10, correctAnswers: 5, accuracy: -10 },
        { totalQuestions: 10, correctAnswers: 5, accuracy: 150 }
      ];

      invalidCases.forEach(invalidCase => {
        const validation = validateQuizResult(invalidCase);
        expect(validation.isValid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
      });
    });

    it('时间相关统计应该正确处理', () => {
      fc.assert(
        fc.property(
          validQuizResultArb,
          fc.option(fc.float({ min: Math.fround(1), max: Math.fround(3600) }).filter(n => isFinite(n) && !isNaN(n)), { nil: undefined }),
          (baseResult, timeSpent) => {
            const enhancedResult: EnhancedQuizResult = {
              ...baseResult,
              timeSpent,
              questionResults: []
            };

            const stats = calculateDetailedStats(enhancedResult);

            if (timeSpent && baseResult.totalQuestions > 0) {
              expect(stats.averageTimePerQuestion).toBeDefined();
              expect(stats.averageTimePerQuestion).toBeCloseTo(timeSpent / baseResult.totalQuestions, 2);
              expect(stats.formattedTime).toBeDefined();
              expect(stats.formattedTime).toMatch(/^\d+:\d{2}(:\d{2})?$/);
            } else {
              expect(stats.averageTimePerQuestion).toBeUndefined();
              expect(stats.formattedTime).toBeUndefined();
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('组件集成应该保持类型安全', () => {
      fc.assert(
        fc.property(
          validQuizResultArb,
          (baseResult) => {
            // 验证所有计算函数都返回正确的类型
            const gradeInfo: GradeInfo = calculateGrade(baseResult.accuracy);
            expect(typeof gradeInfo.grade).toBe('string');
            expect(typeof gradeInfo.color).toBe('string');
            expect(typeof gradeInfo.description).toBe('string');
            expect(typeof gradeInfo.celebrationLevel).toBe('string');

            const enhancedResult: EnhancedQuizResult = {
              ...baseResult,
              questionResults: []
            };

            const stats = calculateDetailedStats(enhancedResult);
            expect(typeof stats.accuracyDisplay).toBe('string');
            expect(typeof stats.longestStreak).toBe('number');

            const showCelebration: boolean = shouldShowCelebration(gradeInfo, baseResult.accuracy);
            expect(typeof showCelebration).toBe('boolean');

            const message: string = getEncouragementMessage(baseResult.accuracy, baseResult.totalQuestions);
            expect(typeof message).toBe('string');
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});