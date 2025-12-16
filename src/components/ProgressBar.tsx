import React from 'react';
import { cn } from '../lib/utils';
import { ProgressBarProps } from '../types';

// 学习进度条组件（用于首页游戏卡片）
export interface LearningProgressBarProps {
  mastered: number;
  learning: number;
  remaining: number;
  total: number;
  className?: string;
}

const LearningProgressBar: React.FC<LearningProgressBarProps> = ({
  mastered,
  learning,
  remaining,
  total,
  className
}) => {
  // 计算百分比
  const masteredPercent = total > 0 ? (mastered / total) * 100 : 0;
  const learningPercent = total > 0 ? (learning / total) * 100 : 0;
  const remainingPercent = total > 0 ? (remaining / total) * 100 : 0;

  // 确保百分比总和不超过100%
  const totalPercent = masteredPercent + learningPercent + remainingPercent;
  const adjustedMastered = totalPercent > 100 ? (masteredPercent / totalPercent) * 100 : masteredPercent;
  const adjustedLearning = totalPercent > 100 ? (learningPercent / totalPercent) * 100 : learningPercent;
  const adjustedRemaining = totalPercent > 100 ? (remainingPercent / totalPercent) * 100 : remainingPercent;

  return (
    <div className={cn("w-full h-2 bg-gray-200 rounded-full overflow-hidden", className)}>
      <div className="flex h-full">
        {/* 已掌握部分 - 深绿色 */}
        {adjustedMastered > 0 && (
          <div
            className="bg-green-600 transition-all duration-300 ease-in-out"
            style={{ width: `${adjustedMastered}%` }}
          />
        )}
        
        {/* 正在学习部分 - 浅绿色 */}
        {adjustedLearning > 0 && (
          <div
            className="bg-green-300 transition-all duration-300 ease-in-out"
            style={{ width: `${adjustedLearning}%` }}
          />
        )}
        
        {/* 剩余部分 - 灰色 */}
        {adjustedRemaining > 0 && (
          <div
            className="bg-gray-300 transition-all duration-300 ease-in-out"
            style={{ width: `${adjustedRemaining}%` }}
          />
        )}
      </div>
    </div>
  );
};

// 原有的进度条组件（用于游戏页面）
const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  className
}) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className={cn("w-full h-2 bg-gray-200 rounded-full overflow-hidden", className)}>
      <div
        className="h-full bg-primary-500 transition-all duration-300 ease-in-out rounded-full"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export { LearningProgressBar, ProgressBar };