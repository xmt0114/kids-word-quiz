/**
 * Timer Component
 * 计时器组件 - 用于"哪个词语不见了？"游戏的挑战模式
 * 
 * 职责：
 * - 显示倒计时
 * - 提供视觉反馈（颜色变化）
 * - 时间紧迫时的警告效果
 */

import React from 'react';
import type { TimerProps } from '../../types/missingWordsGame';
import { cn } from '../../lib/utils';

export const Timer: React.FC<TimerProps> = ({
  timeLeft,
  totalTime,
  className,
}) => {
  // 计算剩余时间百分比
  const percentage = (timeLeft / totalTime) * 100;

  // 根据剩余时间确定颜色
  const getTimerColor = () => {
    if (percentage > 50) {
      return 'text-green-600 border-green-500 bg-green-50';
    } else if (percentage > 20) {
      return 'text-yellow-600 border-yellow-500 bg-yellow-50';
    } else {
      return 'text-red-600 border-red-500 bg-red-50 animate-pulse';
    }
  };

  // 计时器容器样式
  const timerClasses = cn(
    'inline-flex items-center justify-center',
    'rounded-full',
    'border-4',
    'px-6 py-3',
    'shadow-lg',
    'transition-all duration-300',
    'min-w-[120px]',
    getTimerColor(),
    className
  );

  // 时间文本样式
  const timeTextClasses = cn(
    'text-3xl font-bold tabular-nums',
    timeLeft <= 3 && 'animate-bounce'
  );

  return (
    <div 
      className={timerClasses}
      data-testid="timer"
      data-time-left={timeLeft}
      data-percentage={percentage.toFixed(0)}
    >
      <div className="flex items-center space-x-2">
        {/* 时钟图标 */}
        <span className="text-2xl">⏱️</span>
        
        {/* 时间显示 */}
        <span className={timeTextClasses}>
          {timeLeft}
        </span>
        
        {/* 单位 */}
        <span className="text-lg font-semibold">秒</span>
      </div>
    </div>
  );
};

Timer.displayName = 'Timer';
