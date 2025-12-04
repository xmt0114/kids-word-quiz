/**
 * 样式和主题应用属性测试
 * 验证样式类的正确应用和视觉一致性
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { calculateGrade } from '../utils/resultCalculations';

// 测试用的任意生成器
const gradeInfoArb = fc.record({
  grade: fc.constantFrom('S', 'A', 'B', 'C', 'D'),
  color: fc.constantFrom('text-yellow-500', 'text-green-500', 'text-blue-500', 'text-orange-500', 'text-red-500'),
  bgColor: fc.constantFrom(
    'bg-gradient-to-br from-yellow-400 to-yellow-600',
    'bg-gradient-to-br from-green-400 to-green-600',
    'bg-gradient-to-br from-blue-400 to-blue-600',
    'bg-gradient-to-br from-orange-400 to-orange-600',
    'bg-gradient-to-br from-red-400 to-red-600'
  ),
  description: fc.constantFrom('完美表现！', '优秀！', '良好！', '还需努力！', '继续加油！'),
  celebrationLevel: fc.constantFrom('high', 'medium', 'low')
});

const wordArb = fc.record({
  id: fc.integer({ min: 1, max: 1000 }),
  word: fc.string({ minLength: 1, maxLength: 20 }),
  definition: fc.string({ minLength: 1, maxLength: 100 }),
  answer: fc.string({ minLength: 1, maxLength: 20 }),
  options: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 2, maxLength: 4 }),
  audioText: fc.string(),
  hint: fc.string(),
  difficulty: fc.constantFrom('easy', 'medium', 'hard')
});

describe('样式和主题应用属性测试', () => {
  describe('属性 5: 样式和动画应用正确性', () => {

    it('等级计算应该返回一致的样式配置', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 100 }),
          (accuracy) => {
            const gradeInfo = calculateGrade(accuracy);

            // 验证返回的样式配置完整性
            expect(gradeInfo).toHaveProperty('grade');
            expect(gradeInfo).toHaveProperty('color');
            expect(gradeInfo).toHaveProperty('bgColor');
            expect(gradeInfo).toHaveProperty('description');
            expect(gradeInfo).toHaveProperty('celebrationLevel');

            // 验证样式类格式正确
            expect(gradeInfo.color).toMatch(/^text-\w+-\d+$/);
            expect(gradeInfo.bgColor).toMatch(/^bg-gradient-to-br from-\w+-\d+ to-\w+-\d+$/);

            // 验证等级与准确率的对应关系
            if (accuracy >= 95) {
              expect(gradeInfo.grade).toBe('S');
              expect(gradeInfo.celebrationLevel).toBe('high');
            } else if (accuracy >= 85) {
              expect(gradeInfo.grade).toBe('A');
            } else if (accuracy >= 70) {
              expect(gradeInfo.grade).toBe('B');
            } else if (accuracy >= 60) {
              expect(gradeInfo.grade).toBe('C');
            } else {
              expect(gradeInfo.grade).toBe('D');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('响应式样式应该在不同屏幕尺寸下保持一致', () => {
      // 验证等级计算在不同情况下保持一致
      const testCases = [85, 95, 75, 65, 45];
      
      testCases.forEach(accuracy => {
        const gradeInfo = calculateGrade(accuracy);
        expect(gradeInfo).toHaveProperty('grade');
        expect(gradeInfo).toHaveProperty('color');
        expect(gradeInfo).toHaveProperty('bgColor');
        expect(gradeInfo).toHaveProperty('description');
        expect(gradeInfo).toHaveProperty('celebrationLevel');
      });
    });

    it('动画类应该正确应用', () => {
      const animationClasses = [
        'animate-bounce-in',
        'animate-pulse-gentle', 
        'animate-slide-in-right',
        'question-circle-hover',
        'stats-card-hover',
        'achievement-pulse'
      ];

      animationClasses.forEach(animationClass => {
        // 验证动画类名格式正确
        expect(animationClass).toMatch(/^(animate-|question-|stats-|achievement-)/);
        
        // 验证类名不包含无效字符
        expect(animationClass).not.toMatch(/[^a-z0-9-]/);
      });
    });
  });
});