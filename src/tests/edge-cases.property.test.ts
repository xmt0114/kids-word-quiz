/**
 * 边缘情况处理属性测试
 * 验证系统在各种边缘情况下的行为
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import {
  validateQuizResult,
  sanitizeQuestionResults,
  getAchievementInfo,
  sanitizeDetailedStats,
  calculateGrade,
  calculateDetailedStats
} from '../utils/resultCalculations';
import { QuestionResult, DetailedStats } from '../types/index';

describe('边缘情况处理属性测试', () => {
  describe('属性 6: 边缘情况优雅处理', () => {
    it('validateQuizResult 应该正确验证各种输入', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.record({
              totalQuestions: fc.oneof(fc.integer(), fc.float(), fc.string(), fc.constant(null)),
              correctAnswers: fc.oneof(fc.integer(), fc.float(), fc.string(), fc.constant(null)),
              accuracy: fc.oneof(fc.float(), fc.integer(), fc.string(), fc.constant(null))
            })
          ),
          (input) => {
            const result = validateQuizResult(input);
            
            // 验证返回结构
            expect(result).toHaveProperty('isValid');
            expect(result).toHaveProperty('errors');
            expect(typeof result.isValid).toBe('boolean');
            expect(Array.isArray(result.errors)).toBe(true);
            
            // 如果输入为null或undefined，应该无效
            if (!input) {
              expect(result.isValid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('sanitizeQuestionResults 应该处理各种无效输入', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.array(fc.anything()) as fc.Arbitrary<any[]>,
            fc.constant([]) as fc.Arbitrary<any[]>
          ),
          fc.integer({ min: 1, max: 20 }),
          fc.integer({ min: 0, max: 20 }),
          (questionResults, totalQuestions, correctAnswers) => {
            const result = sanitizeQuestionResults(questionResults, totalQuestions, correctAnswers);
            
            // 结果应该是数组
            expect(Array.isArray(result)).toBe(true);
            
            // 长度应该等于totalQuestions
            expect(result.length).toBe(totalQuestions);
            
            // 每个元素都应该有必要的字段
            result.forEach((item, index) => {
              expect(item).toHaveProperty('questionIndex');
              expect(item).toHaveProperty('question');
              expect(item).toHaveProperty('userAnswer');
              expect(item).toHaveProperty('isCorrect');
              expect(item).toHaveProperty('timeSpent');
              
              expect(typeof item.questionIndex).toBe('number');
              expect(typeof item.question).toBe('object');
              expect(typeof item.userAnswer).toBe('string');
              expect(typeof item.isCorrect).toBe('boolean');
              
              // 题目对象应该有必要字段
              expect(item.question).toHaveProperty('id');
              expect(item.question).toHaveProperty('word');
              expect(item.question).toHaveProperty('definition');
              expect(item.question).toHaveProperty('answer');
              expect(item.question).toHaveProperty('options');
              expect(item.question).toHaveProperty('difficulty');
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('getAchievementInfo 应该为各种分数返回合适的成就', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 100 }),
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 0, max: 50 }),
          (accuracy, totalQuestions, longestStreak) => {
            const result = getAchievementInfo(accuracy, totalQuestions, longestStreak);
            
            // 验证返回结构
            expect(result).toHaveProperty('hasAchievement');
            expect(result).toHaveProperty('title');
            expect(result).toHaveProperty('description');
            expect(result).toHaveProperty('icon');
            
            expect(typeof result.hasAchievement).toBe('boolean');
            expect(typeof result.title).toBe('string');
            expect(typeof result.description).toBe('string');
            expect(typeof result.icon).toBe('string');
            
            // 完美分数应该有成就
            if (accuracy === 100) {
              expect(result.hasAchievement).toBe(true);
              expect(result.title).toContain('完美');
            }
            
            // 高分应该有成就
            if (accuracy >= 95) {
              expect(result.hasAchievement).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('sanitizeDetailedStats 应该处理无效的统计数据', () => {
      fc.assert(
        fc.property(
          fc.record({
            averageTimePerQuestion: fc.oneof(
              fc.float(),
              fc.constant(Infinity),
              fc.constant(-Infinity),
              fc.constant(NaN),
              fc.constant(undefined),
              fc.constant(null)
            ),
            longestStreak: fc.oneof(
              fc.integer(),
              fc.constant(undefined),
              fc.constant(null),
              fc.constant(-5)
            ),
            formattedTime: fc.oneof(fc.string(), fc.constant(undefined), fc.constant(null)),
            accuracyDisplay: fc.oneof(fc.string(), fc.constant(undefined), fc.constant(null))
          }),
          (stats) => {
            const result = sanitizeDetailedStats(stats as DetailedStats);
            
            // 验证返回结构
            expect(result).toHaveProperty('averageTimePerQuestion');
            expect(result).toHaveProperty('longestStreak');
            expect(result).toHaveProperty('formattedTime');
            expect(result).toHaveProperty('accuracyDisplay');
            
            // longestStreak应该是非负数
            expect(result.longestStreak).toBeGreaterThanOrEqual(0);
            
            // averageTimePerQuestion如果存在，应该是有限的正数
            if (result.averageTimePerQuestion !== undefined) {
              expect(isFinite(result.averageTimePerQuestion)).toBe(true);
              expect(result.averageTimePerQuestion).toBeGreaterThanOrEqual(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('系统应该在极值情况下保持稳定', () => {
      fc.assert(
        fc.property(
          fc.record({
            totalQuestions: fc.integer({ min: 0, max: 1000 }),
            correctAnswers: fc.integer({ min: 0, max: 1000 }),
            accuracy: fc.float({ min: 0, max: 100 }),
            score: fc.integer({ min: 0, max: 1000 })
          }),
          (result) => {
            // 确保数据一致性
            const consistentResult = {
              ...result,
              correctAnswers: Math.min(result.correctAnswers, result.totalQuestions),
              accuracy: result.totalQuestions > 0 
                ? (Math.min(result.correctAnswers, result.totalQuestions) / result.totalQuestions) * 100
                : 0
            };
            
            // 验证不会抛出异常
            expect(() => {
              const gradeInfo = calculateGrade(consistentResult.accuracy);
              expect(gradeInfo).toHaveProperty('grade');
              expect(gradeInfo).toHaveProperty('color');
              expect(gradeInfo).toHaveProperty('description');
            }).not.toThrow();
            
            // 验证数据验证
            const validation = validateQuizResult(consistentResult);
            if (consistentResult.totalQuestions > 0) {
              expect(validation.isValid).toBe(true);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('空数据和缺失数据应该被优雅处理', () => {
      // 测试完全空的数据
      const emptyResult = sanitizeQuestionResults([], 5, 2);
      expect(emptyResult).toHaveLength(5);
      expect(emptyResult.filter(r => r.isCorrect)).toHaveLength(2);
      
      // 测试null数据
      const nullResult = sanitizeQuestionResults(null, 3, 1);
      expect(nullResult).toHaveLength(3);
      expect(nullResult.filter(r => r.isCorrect)).toHaveLength(1);
      
      // 测试undefined数据
      const undefinedResult = sanitizeQuestionResults(undefined, 4, 0);
      expect(undefinedResult).toHaveLength(4);
      expect(undefinedResult.filter(r => r.isCorrect)).toHaveLength(0);
    });

    it('成就系统应该处理边缘分数', () => {
      // 测试0分
      const zeroScore = getAchievementInfo(0, 10, 0);
      expect(zeroScore.hasAchievement).toBe(true); // 坚持成就
      expect(zeroScore.title).toContain('坚持');
      
      // 测试100分
      const perfectScore = getAchievementInfo(100, 5, 5);
      expect(perfectScore.hasAchievement).toBe(true);
      expect(perfectScore.title).toContain('完美');
      
      // 测试高连击
      const highStreak = getAchievementInfo(80, 10, 8);
      expect(highStreak.hasAchievement).toBe(true);
      expect(highStreak.title).toContain('连击');
    });
  });
});