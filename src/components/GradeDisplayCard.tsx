import React from 'react';
import { GradeDisplayCardProps } from '../types';
import { Card } from './Card';
import { StarExplosion } from './StarExplosion';
import { cn } from '../lib/utils';

/**
 * 等级展示卡片组件
 * 显示游戏等级、评价和庆祝效果
 */
const GradeDisplayCard: React.FC<GradeDisplayCardProps> = ({
  gradeInfo,
  accuracy,
  showCelebration,
  className
}) => {
  return (
    <Card className={cn('p-md mb-sm', className)}>
      {/* 庆祝动画 */}
      {showCelebration && (
        <div className="relative">
          <StarExplosion isVisible={true} />
        </div>
      )}

      {/* 水平布局：等级徽章 + 信息 */}
      <div className="flex items-center gap-md">
        {/* 等级徽章 - 更小更紧凑 */}
        <div className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold',
          'shadow-lg transition-all duration-normal relative flex-shrink-0',
          showCelebration && 'animate-bounce-in relative before:content-[\'\'] before:absolute before:inset-[-2px] before:rounded-inherit before:p-[2px] before:bg-[linear-gradient(45deg,transparent,rgba(255,255,255,0.3),transparent)] before:mask-[linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] before:mask-composite-[exclude] before:animate-[rotate-glow_3s_linear_infinite]'
        )}>
          {/* 背景渐变 */}
          <div className={cn(
            'absolute inset-0 rounded-full',
            gradeInfo.bgColor
          )} />

          {/* 等级文字 */}
          <span className={cn(
            'relative z-10 text-white font-bold text-2xl',
            'drop-shadow-lg'
          )}>
            {gradeInfo.grade}
          </span>
        </div>

        {/* 等级信息 */}
        <div className="flex-1 text-left">
          <h2 className={cn(
            'text-xl font-bold mb-xs',
            gradeInfo.color
          )}>
            {gradeInfo.description}
          </h2>
          <p className="text-lg font-semibold text-gray-600">
            准确率 {accuracy.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* 发光效果 */}
      {gradeInfo.celebrationLevel === 'high' && (
        <div className={cn(
          'absolute inset-0 rounded-lg opacity-20 animate-pulse-gentle',
          gradeInfo.bgColor
        )} />
      )}
    </Card>
  );
};

GradeDisplayCard.displayName = 'GradeDisplayCard';

export { GradeDisplayCard };