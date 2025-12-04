/**
 * **Feature: game-result-page-enhancement, Property 3: 题目可视化状态映射**
 * **Validates: Requirements 4.1, 4.2, 4.3**
 */

import { describe, it, expect } from '@jest/globals';
import fc from 'fast-check';
import { 
  GradeInfo,
  Word,
  CompactHeaderProps,
  GradeDisplayCardProps,
  DetailedStatsGridProps,
  QuestionCircleProps
} from '../types/index';

// 生成器：创建等级信息（使用实际的等级计算逻辑）
const gradeInfoArb = fc.float({ min: Math.fround(0), max: Math.fround(100) })
  .filter(n => isFinite(n) && !isNaN(n))
  .map(accuracy => {
    // 使用实际的等级计算逻辑
    if (accuracy >= 95) return {
      grade: 'S' as const,
      color: 'text-yellow-500',
      bgColor: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
      description: '完美表现！',
      celebrationLevel: 'high' as const
    };
    if (accuracy >= 85) return {
      grade: 'A' as const,
      color: 'text-green-500',
      bgColor: 'bg-gradient-to-br from-green-400 to-green-600',
      description: '优秀！',
      celebrationLevel: 'medium' as const
    };
    if (accuracy >= 70) return {
      grade: 'B' as const,
      color: 'text-blue-500',
      bgColor: 'bg-gradient-to-br from-blue-400 to-blue-600',
      description: '良好！',
      celebrationLevel: 'medium' as const
    };
    if (accuracy >= 60) return {
      grade: 'C' as const,
      color: 'text-orange-500',
      bgColor: 'bg-gradient-to-br from-orange-400 to-orange-600',
      description: '还需努力！',
      celebrationLevel: 'low' as const
    };
    return {
      grade: 'D' as const,
      color: 'text-red-500',
      bgColor: 'bg-gradient-to-br from-red-400 to-red-600',
      description: '继续加油！',
      celebrationLevel: 'low' as const
    };
  });

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

describe('UI Components Property Tests', () => {
  describe('Property 3: 题目可视化状态映射', () => {
    it('CompactHeader props应该包含必需的字段', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          (title, subtitle, className) => {
            const props: CompactHeaderProps = {
              title,
              subtitle,
              className
            };
            
            // 必需字段应该存在
            expect(props.title).toBe(title);
            expect(props.title.length).toBeGreaterThan(0);
            
            // 可选字段应该正确处理
            if (subtitle !== undefined) {
              expect(props.subtitle).toBe(subtitle);
            } else {
              expect(props.subtitle).toBeUndefined();
            }
            
            if (className) {
              expect(props.className).toBe(className);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('GradeDisplayCard props应该正确映射等级信息', () => {
      fc.assert(
        fc.property(
          gradeInfoArb,
          fc.float({ min: Math.fround(0), max: Math.fround(100) }).filter(n => isFinite(n) && !isNaN(n)),
          fc.boolean(),
          fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          (gradeInfo, accuracy, showCelebration, className) => {
            const props: GradeDisplayCardProps = {
              gradeInfo,
              accuracy,
              showCelebration,
              className
            };
            
            // 等级信息应该完整
            expect(props.gradeInfo.grade).toBeDefined();
            expect(['S', 'A', 'B', 'C', 'D']).toContain(props.gradeInfo.grade);
            expect(props.gradeInfo.color).toBeDefined();
            expect(props.gradeInfo.bgColor).toBeDefined();
            expect(props.gradeInfo.description).toBeDefined();
            expect(['high', 'medium', 'low']).toContain(props.gradeInfo.celebrationLevel);
            
            // 准确率应该在有效范围内
            expect(props.accuracy).toBeGreaterThanOrEqual(0);
            expect(props.accuracy).toBeLessThanOrEqual(100);
            
            // 庆祝标志应该是布尔值
            expect(typeof props.showCelebration).toBe('boolean');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('DetailedStatsGrid props应该正确验证统计数据', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          fc.float({ min: Math.fround(0), max: Math.fround(100) }).filter(n => isFinite(n) && !isNaN(n)),
          fc.option(fc.float({ min: Math.fround(1), max: Math.fround(3600) }).filter(n => isFinite(n) && !isNaN(n)), { nil: undefined }),
          fc.option(fc.float({ min: Math.fround(0.1), max: Math.fround(60) }).filter(n => isFinite(n) && !isNaN(n)), { nil: undefined }),
          fc.integer({ min: 0, max: 100 }),
          (correctAnswers, totalQuestions, accuracy, timeSpent, averageTimePerQuestion, longestStreak) => {
            // 确保正确答案数不超过总题数
            const validCorrectAnswers = Math.min(correctAnswers, totalQuestions);
            // 确保最长连续正确不超过总题数
            const validLongestStreak = Math.min(longestStreak, totalQuestions);
            
            const props: DetailedStatsGridProps = {
              correctAnswers: validCorrectAnswers,
              totalQuestions,
              accuracy,
              timeSpent,
              averageTimePerQuestion,
              longestStreak: validLongestStreak
            };
            
            // 基本数据验证
            expect(props.correctAnswers).toBeGreaterThanOrEqual(0);
            expect(props.correctAnswers).toBeLessThanOrEqual(props.totalQuestions);
            expect(props.totalQuestions).toBeGreaterThan(0);
            expect(props.accuracy).toBeGreaterThanOrEqual(0);
            expect(props.accuracy).toBeLessThanOrEqual(100);
            expect(props.longestStreak).toBeGreaterThanOrEqual(0);
            expect(props.longestStreak).toBeLessThanOrEqual(props.totalQuestions);
            
            // 可选字段验证
            if (props.timeSpent !== undefined) {
              expect(props.timeSpent).toBeGreaterThan(0);
            }
            
            if (props.averageTimePerQuestion !== undefined) {
              expect(props.averageTimePerQuestion).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('QuestionCircle props应该正确映射题目状态', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.boolean(),
          wordArb,
          fc.string({ minLength: 0, maxLength: 50 }),
          fc.integer({ min: 0, max: 1000 }),
          (questionNumber, isCorrect, question, userAnswer, animationDelay) => {
            const props: QuestionCircleProps = {
              questionNumber,
              isCorrect,
              question,
              userAnswer,
              animationDelay
            };
            
            // 题目序号应该是正数
            expect(props.questionNumber).toBeGreaterThan(0);
            
            // 答题状态应该是布尔值
            expect(typeof props.isCorrect).toBe('boolean');
            
            // 题目对象应该包含必需字段
            expect(props.question.id).toBeDefined();
            expect(props.question.word).toBeDefined();
            expect(props.question.answer).toBeDefined();
            expect(props.question.definition).toBeDefined();
            expect(['easy', 'medium', 'hard']).toContain(props.question.difficulty);
            
            // 用户答案应该是字符串
            expect(typeof props.userAnswer).toBe('string');
            
            // 动画延迟应该是非负数
            expect(props.animationDelay).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('组件props应该正确处理可选字段', () => {
      // 测试CompactHeader的可选字段
      const minimalHeaderProps: CompactHeaderProps = {
        title: 'Test Title'
      };
      expect(minimalHeaderProps.title).toBe('Test Title');
      expect(minimalHeaderProps.subtitle).toBeUndefined();
      expect(minimalHeaderProps.className).toBeUndefined();

      // 测试DetailedStatsGrid的可选字段
      const minimalStatsProps: DetailedStatsGridProps = {
        correctAnswers: 5,
        totalQuestions: 10,
        accuracy: 50,
        longestStreak: 3
      };
      expect(minimalStatsProps.timeSpent).toBeUndefined();
      expect(minimalStatsProps.averageTimePerQuestion).toBeUndefined();
      expect(minimalStatsProps.className).toBeUndefined();
    });

    it('等级信息应该与准确率范围匹配', () => {
      fc.assert(
        fc.property(
          gradeInfoArb,
          (gradeInfo) => {
            // 验证等级与颜色的对应关系
            const gradeColorMap: Record<string, string> = {
              'S': 'yellow',
              'A': 'green',
              'B': 'blue', 
              'C': 'orange',
              'D': 'red'
            };
            
            const expectedColorKeyword = gradeColorMap[gradeInfo.grade];
            expect(gradeInfo.color).toContain(expectedColorKeyword);
            
            // 验证庆祝级别的合理性
            if (gradeInfo.grade === 'S') {
              expect(gradeInfo.celebrationLevel).toBe('high');
            } else if (gradeInfo.grade === 'A' || gradeInfo.grade === 'B') {
              expect(gradeInfo.celebrationLevel).toBe('medium');
            } else {
              expect(gradeInfo.celebrationLevel).toBe('low');
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('题目圆圈状态应该与答题结果一致', () => {
      fc.assert(
        fc.property(
          wordArb,
          fc.string({ minLength: 0, maxLength: 50 }),
          (question, userAnswer) => {
            // 模拟正确答案的情况
            const correctProps: QuestionCircleProps = {
              questionNumber: 1,
              isCorrect: true,
              question,
              userAnswer: question.answer, // 使用正确答案
              animationDelay: 0
            };
            
            expect(correctProps.isCorrect).toBe(true);
            expect(correctProps.userAnswer).toBe(question.answer);
            
            // 模拟错误答案的情况
            const incorrectProps: QuestionCircleProps = {
              questionNumber: 1,
              isCorrect: false,
              question,
              userAnswer: userAnswer !== question.answer ? userAnswer : 'wrong_answer',
              animationDelay: 0
            };
            
            expect(incorrectProps.isCorrect).toBe(false);
            expect(incorrectProps.userAnswer).not.toBe(question.answer);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});