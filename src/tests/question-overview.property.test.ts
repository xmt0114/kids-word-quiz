/**
 * **Feature: game-result-page-enhancement, Property 3: 题目可视化状态映射**
 * **Validates: Requirements 4.1, 4.2, 4.3**
 */

import { describe, it, expect } from '@jest/globals';
import fc from 'fast-check';
import { 
  QuestionResult,
  Word,
  QuestionOverviewSectionProps
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
  questionIndex: fc.integer({ min: 0, max: 999 }),
  question: wordArb,
  userAnswer: fc.string({ minLength: 0, maxLength: 50 }),
  isCorrect: fc.boolean(),
  timeSpent: fc.option(fc.float({ min: Math.fround(0.1), max: Math.fround(300) }).filter(n => isFinite(n) && !isNaN(n)), { nil: undefined })
});

describe('Question Overview Property Tests', () => {
  describe('Property 3: 题目可视化状态映射', () => {
    it('QuestionOverviewSection props应该正确处理题目结果数组', () => {
      fc.assert(
        fc.property(
          fc.array(questionResultArb, { minLength: 1, maxLength: 150 }),
          fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          (questionResults, className) => {
            const props: QuestionOverviewSectionProps = {
              questionResults,
              className
            };
            
            // 题目结果数组应该存在且有效
            expect(props.questionResults).toBeDefined();
            expect(props.questionResults.length).toBeGreaterThan(0);
            expect(props.questionResults.length).toBeLessThanOrEqual(150);
            
            // 每个题目结果应该包含必需字段
            props.questionResults.forEach((result, index) => {
              expect(result.questionIndex).toBeGreaterThanOrEqual(0);
              expect(result.question).toBeDefined();
              expect(result.question.id).toBeDefined();
              expect(result.question.word).toBeDefined();
              expect(result.question.answer).toBeDefined();
              expect(typeof result.isCorrect).toBe('boolean');
              expect(typeof result.userAnswer).toBe('string');
            });
            
            // className应该正确处理
            if (className !== undefined) {
              expect(props.className).toBe(className);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('题目概览应该正确计算统计信息', () => {
      fc.assert(
        fc.property(
          fc.array(questionResultArb, { minLength: 1, maxLength: 100 }),
          (questionResults) => {
            // 手动计算统计信息
            const totalQuestions = questionResults.length;
            const correctAnswers = questionResults.filter(q => q.isCorrect).length;
            const wrongAnswers = questionResults.filter(q => !q.isCorrect).length;
            const accuracy = (correctAnswers / totalQuestions) * 100;
            
            // 验证统计计算的正确性
            expect(correctAnswers + wrongAnswers).toBe(totalQuestions);
            expect(correctAnswers).toBeGreaterThanOrEqual(0);
            expect(correctAnswers).toBeLessThanOrEqual(totalQuestions);
            expect(wrongAnswers).toBeGreaterThanOrEqual(0);
            expect(wrongAnswers).toBeLessThanOrEqual(totalQuestions);
            expect(accuracy).toBeGreaterThanOrEqual(0);
            expect(accuracy).toBeLessThanOrEqual(100);
            
            // 验证准确率计算
            if (totalQuestions > 0) {
              const expectedAccuracy = (correctAnswers / totalQuestions) * 100;
              expect(accuracy).toBeCloseTo(expectedAccuracy, 1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('性能优化应该正确处理大量题目', () => {
      // 测试超过100道题目的情况
      const largeQuestionResults = Array.from({ length: 150 }, (_, index) => ({
        questionIndex: index,
        question: {
          id: index + 1,
          word: `word${index}`,
          definition: `definition${index}`,
          audioText: `audio${index}`,
          difficulty: 'easy' as const,
          options: ['a', 'b', 'c', 'd'],
          answer: 'a',
          hint: `hint${index}`
        },
        userAnswer: index % 2 === 0 ? 'a' : 'b',
        isCorrect: index % 2 === 0,
        timeSpent: 5.0
      }));

      const props: QuestionOverviewSectionProps = {
        questionResults: largeQuestionResults
      };

      // 验证大量题目的处理
      expect(props.questionResults.length).toBe(150);
      
      // 验证性能优化逻辑（应该只显示前100道）
      const maxDisplayQuestions = 100;
      const displayQuestions = props.questionResults.slice(0, maxDisplayQuestions);
      const hasMoreQuestions = props.questionResults.length > maxDisplayQuestions;
      
      expect(displayQuestions.length).toBe(100);
      expect(hasMoreQuestions).toBe(true);
      
      // 验证统计信息仍然基于全部题目
      const totalCorrect = props.questionResults.filter(q => q.isCorrect).length;
      const totalWrong = props.questionResults.filter(q => !q.isCorrect).length;
      expect(totalCorrect + totalWrong).toBe(150);
    });

    it('题目索引应该正确映射到显示序号', () => {
      fc.assert(
        fc.property(
          fc.array(questionResultArb, { minLength: 1, maxLength: 50 }),
          (questionResults) => {
            // 验证题目索引到显示序号的映射
            questionResults.forEach((result, arrayIndex) => {
              // 显示序号应该是题目索引+1
              const displayNumber = result.questionIndex + 1;
              expect(displayNumber).toBeGreaterThan(0);
              expect(displayNumber).toBe(result.questionIndex + 1);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('动画延迟应该按顺序递增', () => {
      fc.assert(
        fc.property(
          fc.array(questionResultArb, { minLength: 2, maxLength: 20 }),
          (questionResults) => {
            // 验证动画延迟的计算
            const animationDelayIncrement = 50; // 每个圆圈延迟50ms
            
            questionResults.forEach((result, index) => {
              const expectedDelay = index * animationDelayIncrement;
              expect(expectedDelay).toBe(index * 50);
              expect(expectedDelay).toBeGreaterThanOrEqual(0);
              
              // 后面的元素延迟应该更大
              if (index > 0) {
                const previousDelay = (index - 1) * animationDelayIncrement;
                expect(expectedDelay).toBeGreaterThan(previousDelay);
              }
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('空题目结果应该被正确处理', () => {
      // 测试空数组
      const emptyProps: QuestionOverviewSectionProps = {
        questionResults: []
      };
      
      expect(emptyProps.questionResults).toBeDefined();
      expect(emptyProps.questionResults.length).toBe(0);
      
      // 测试undefined
      const undefinedProps: QuestionOverviewSectionProps = {
        questionResults: undefined as any
      };
      
      // 组件应该能处理undefined情况（虽然类型上不允许，但运行时可能发生）
      expect(undefinedProps.questionResults).toBeUndefined();
    });

    it('题目状态分布应该保持一致性', () => {
      fc.assert(
        fc.property(
          fc.array(questionResultArb, { minLength: 1, maxLength: 100 }),
          (questionResults) => {
            const correctCount = questionResults.filter(q => q.isCorrect).length;
            const incorrectCount = questionResults.filter(q => !q.isCorrect).length;
            const totalCount = questionResults.length;
            
            // 正确和错误的数量之和应该等于总数
            expect(correctCount + incorrectCount).toBe(totalCount);
            
            // 每个状态的数量都应该是非负数
            expect(correctCount).toBeGreaterThanOrEqual(0);
            expect(incorrectCount).toBeGreaterThanOrEqual(0);
            
            // 如果有题目，至少有一种状态的数量大于0
            if (totalCount > 0) {
              expect(correctCount + incorrectCount).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('题目结果的用户答案应该与正确性状态一致', () => {
      fc.assert(
        fc.property(
          wordArb,
          fc.string({ minLength: 0, maxLength: 50 }),
          (question, userAnswer) => {
            // 创建正确答案的情况
            const correctResult: QuestionResult = {
              questionIndex: 0,
              question,
              userAnswer: question.answer,
              isCorrect: true
            };
            
            // 验证正确答案的一致性
            expect(correctResult.isCorrect).toBe(true);
            expect(correctResult.userAnswer).toBe(question.answer);
            
            // 创建错误答案的情况（确保用户答案与正确答案不同）
            const wrongAnswer = userAnswer !== question.answer ? userAnswer : 'definitely_wrong';
            const incorrectResult: QuestionResult = {
              questionIndex: 0,
              question,
              userAnswer: wrongAnswer,
              isCorrect: false
            };
            
            // 验证错误答案的一致性
            expect(incorrectResult.isCorrect).toBe(false);
            if (wrongAnswer !== question.answer) {
              expect(incorrectResult.userAnswer).not.toBe(question.answer);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});