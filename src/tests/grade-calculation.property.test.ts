/**
 * **Feature: game-result-page-enhancement, Property 1: 等级计算和显示一致性**
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
 */

import { describe, it, expect } from '@jest/globals';
import fc from 'fast-check';
import { 
  calculateGrade,
  shouldShowCelebration,
  getEncouragementMessage,
  validateQuizResult
} from '../utils/resultCalculations';
import { GradeInfo } from '../types/index';

describe('Grade Calculation Property Tests', () => {
  describe('Property 1: 等级计算和显示一致性', () => {
    it('对于任何准确率值，等级计算应该返回正确的等级并包含所有必需字段', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(100) }),
          (accuracy) => {
            const grade = calculateGrade(accuracy);
            
            // 验证等级范围正确性
            if (accuracy >= 95) {
              expect(grade.grade).toBe('S');
              expect(grade.celebrationLevel).toBe('high');
              expect(grade.description).toBe('完美表现！');
            } else if (accuracy >= 85) {
              expect(grade.grade).toBe('A');
              expect(grade.celebrationLevel).toBe('medium');
              expect(grade.description).toBe('优秀！');
            } else if (accuracy >= 70) {
              expect(grade.grade).toBe('B');
              expect(grade.celebrationLevel).toBe('medium');
              expect(grade.description).toBe('良好！');
            } else if (accuracy >= 60) {
              expect(grade.grade).toBe('C');
              expect(grade.celebrationLevel).toBe('low');
              expect(grade.description).toBe('还需努力！');
            } else {
              expect(grade.grade).toBe('D');
              expect(grade.celebrationLevel).toBe('low');
              expect(grade.description).toBe('继续加油！');
            }
            
            // 验证所有必需字段存在且格式正确
            expect(grade.color).toBeDefined();
            expect(grade.color).toMatch(/^text-\w+-\d+$/);
            expect(grade.bgColor).toBeDefined();
            expect(grade.bgColor).toMatch(/^bg-gradient-to-br from-\w+-\d+ to-\w+-\d+$/);
            expect(grade.description).toBeDefined();
            expect(grade.description.length).toBeGreaterThan(0);
            expect(['high', 'medium', 'low']).toContain(grade.celebrationLevel);
            expect(['S', 'A', 'B', 'C', 'D']).toContain(grade.grade);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('等级计算应该在边界值处保持一致性', () => {
      const boundaryTests = [
        { accuracy: 100, expectedGrade: 'S' },
        { accuracy: 95, expectedGrade: 'S' },
        { accuracy: 94.99, expectedGrade: 'A' },
        { accuracy: 85, expectedGrade: 'A' },
        { accuracy: 84.99, expectedGrade: 'B' },
        { accuracy: 70, expectedGrade: 'B' },
        { accuracy: 69.99, expectedGrade: 'C' },
        { accuracy: 60, expectedGrade: 'C' },
        { accuracy: 59.99, expectedGrade: 'D' },
        { accuracy: 0, expectedGrade: 'D' }
      ];

      boundaryTests.forEach(({ accuracy, expectedGrade }) => {
        const grade = calculateGrade(accuracy);
        expect(grade.grade).toBe(expectedGrade);
      });
    });

    it('对于任何准确率值，相同输入应该产生相同输出（幂等性）', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(100) }),
          (accuracy) => {
            const grade1 = calculateGrade(accuracy);
            const grade2 = calculateGrade(accuracy);
            
            expect(grade1).toEqual(grade2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('等级计算应该处理边界外的值（健壮性）', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.float({ min: Math.fround(-1000), max: Math.fround(-0.1) }), // 负数
            fc.float({ min: Math.fround(100.1), max: Math.fround(1000) })  // 超过100
          ),
          (invalidAccuracy) => {
            const grade = calculateGrade(invalidAccuracy);
            
            // 应该优雅处理无效值
            expect(['S', 'A', 'B', 'C', 'D']).toContain(grade.grade);
            expect(grade.color).toBeDefined();
            expect(grade.bgColor).toBeDefined();
            expect(grade.description).toBeDefined();
            expect(['high', 'medium', 'low']).toContain(grade.celebrationLevel);
            
            // 负数应该被当作0处理
            if (invalidAccuracy < 0) {
              expect(grade.grade).toBe('D');
            }
            // 超过100的应该被当作100处理
            if (invalidAccuracy > 100) {
              expect(grade.grade).toBe('S');
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('庆祝动画显示逻辑应该正确', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(100) }),
          (accuracy) => {
            const grade = calculateGrade(accuracy);
            const shouldCelebrate = shouldShowCelebration(grade, accuracy);
            
            // S级或满分应该显示庆祝动画
            if (grade.grade === 'S' || accuracy === 100) {
              expect(shouldCelebrate).toBe(true);
            } else {
              expect(shouldCelebrate).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('鼓励信息应该根据准确率返回合适的内容', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(100) }),
          fc.integer({ min: 1, max: 100 }),
          (accuracy, totalQuestions) => {
            const message = getEncouragementMessage(accuracy, totalQuestions);
            
            expect(message).toBeDefined();
            expect(message.length).toBeGreaterThan(0);
            expect(typeof message).toBe('string');
            
            // 验证特殊情况的消息
            if (accuracy === 100) {
              expect(message).toContain('完美');
            } else if (accuracy === 0) {
              expect(message).toContain('别灰心');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('游戏结果验证应该正确识别有效和无效数据', () => {
      // 测试有效数据
      fc.assert(
        fc.property(
          fc.record({
            totalQuestions: fc.integer({ min: 1, max: 100 }),
            correctAnswers: fc.integer({ min: 0, max: 100 }),
            accuracy: fc.float({ min: Math.fround(0), max: Math.fround(100) }),
            score: fc.integer({ min: 0, max: 100 })
          }).filter(result => result.correctAnswers <= result.totalQuestions),
          (validResult) => {
            const validation = validateQuizResult(validResult);
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
          }
        ),
        { numRuns: 50 }
      );

      // 测试无效数据
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

      invalidCases.forEach(invalidResult => {
        const validation = validateQuizResult(invalidResult);
        expect(validation.isValid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
      });
    });

    it('等级颜色主题应该与等级匹配', () => {
      const gradeColorMap = {
        'S': 'yellow',
        'A': 'green', 
        'B': 'blue',
        'C': 'orange',
        'D': 'red'
      };

      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(100) }),
          (accuracy) => {
            const grade = calculateGrade(accuracy);
            const expectedColor = gradeColorMap[grade.grade as keyof typeof gradeColorMap];
            
            expect(grade.color).toContain(expectedColor);
            expect(grade.bgColor).toContain(expectedColor);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('庆祝级别应该与等级对应', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(100) }),
          (accuracy) => {
            const grade = calculateGrade(accuracy);
            
            if (grade.grade === 'S') {
              expect(grade.celebrationLevel).toBe('high');
            } else if (grade.grade === 'A' || grade.grade === 'B') {
              expect(grade.celebrationLevel).toBe('medium');
            } else if (grade.grade === 'C' || grade.grade === 'D') {
              expect(grade.celebrationLevel).toBe('low');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});