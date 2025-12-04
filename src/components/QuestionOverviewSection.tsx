import React from 'react';
import { QuestionOverviewSectionProps } from '../types';
import { QuestionCircle } from './QuestionCircle';
import { Card } from './Card';
import { cn } from '../lib/utils';

/**
 * 题目概览区域组件
 * 管理题目圆圈的网格布局，支持波浪式渐入动画和性能优化
 */
const QuestionOverviewSection: React.FC<QuestionOverviewSectionProps> = ({
  questionResults,
  className
}) => {
  // 如果没有题目结果，不渲染
  if (!questionResults || questionResults.length === 0) {
    return null;
  }

  // 性能优化：对于大量题目，限制显示数量并添加提示
  const maxDisplayQuestions = 50; // 减少到50个以提高性能
  const displayQuestions = questionResults.slice(0, maxDisplayQuestions);
  const hasMoreQuestions = questionResults.length > maxDisplayQuestions;

  return (
    <div className={cn(
      'relative bg-gradient-to-br from-white via-purple-50 to-pink-50',
      'border-2 border-purple-200 rounded-3xl p-6',
      'shadow-2xl overflow-hidden',
      className
    )}>
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 left-4 w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-xl"></div>
        <div className="absolute bottom-4 right-4 w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-xl"></div>
      </div>

      {/* 主要内容 */}
      <div className="relative z-10">
        {/* 题目圆圈网格 */}
        <div className={cn(
          'grid gap-4',
          // 响应式网格：手机4列，平板6列，桌面10列
          'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10'
        )}>
          {displayQuestions.map((questionResult, index) => (
            <div
              key={`question-${questionResult.questionIndex}`}
              className="relative flex justify-center animate-bounce-in"
              style={{
                // 波浪式动画延迟：每个圆圈延迟30ms（减少延迟以提高性能）
                animationDelay: `${index * 30}ms`,
                zIndex: 1000 // 确保容器有足够高的z-index
              }}
            >
              <QuestionCircle
                questionNumber={questionResult.questionIndex + 1}
                isCorrect={questionResult.isCorrect}
                question={questionResult.question}
                userAnswer={questionResult.userAnswer}
                animationDelay={index * 30}
              />
            </div>
          ))}
        </div>

        {/* 大量题目时的性能提示 */}
        {hasMoreQuestions && (
          <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
            <p className="text-sm text-blue-700">
              为了保持页面性能，仅显示前 {maxDisplayQuestions} 道题目。
              总共 {questionResults.length} 道题目中，
              正确 {questionResults.filter(q => q.isCorrect).length} 道，
              错误 {questionResults.filter(q => !q.isCorrect).length} 道。
            </p>
          </div>
        )}

        {/* 图例 */}
        <div className="mt-6 pt-6 border-t border-purple-200">
          <div className="flex items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-300 rounded-full flex items-center justify-center shadow-lg">
                <div className="w-3 h-3 bg-gradient-to-br from-green-500 to-green-600 rounded-full shadow-inner"></div>
              </div>
              <span className={cn(
                'text-lg font-semibold',
                'bg-gradient-to-r from-gray-600 to-gray-700 bg-clip-text text-transparent'
              )}
              style={{ fontFamily: 'Fredoka, "Noto Sans SC", sans-serif' }}>
                正确
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-red-100 to-red-200 border-2 border-red-300 rounded-full flex items-center justify-center shadow-lg">
                <div className="w-3 h-3 bg-gradient-to-br from-red-500 to-red-600 rounded-full shadow-inner"></div>
              </div>
              <span className={cn(
                'text-lg font-semibold',
                'bg-gradient-to-r from-gray-600 to-gray-700 bg-clip-text text-transparent'
              )}
              style={{ fontFamily: 'Fredoka, "Noto Sans SC", sans-serif' }}>
                错误
              </span>
            </div>
            
            <div className={cn(
              'text-lg font-semibold',
              'bg-gradient-to-r from-gray-600 to-gray-700 bg-clip-text text-transparent'
            )}
            style={{ fontFamily: 'Fredoka, "Noto Sans SC", sans-serif' }}>
              悬停查看详情
            </div>
          </div>
        </div>
      </div>

      {/* 底部装饰波浪 */}
      <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200 opacity-30 transform rotate-1 scale-110"></div>
      </div>
    </div>
  );
};

QuestionOverviewSection.displayName = 'QuestionOverviewSection';

export { QuestionOverviewSection };