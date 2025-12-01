import React from 'react';
import { ProgressBarProps } from '../types';
import { cn } from '../lib/utils';

const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  className,
}) => {
  const percentage = Math.round((current / total) * 100);

  const baseClasses = [
    'w-full',
  ];

  const containerClasses = [
    'bg-gray-200',
    'rounded-full',
    'h-2',
    'overflow-hidden',
    'shadow-inner',
  ];

  const progressClasses = [
    'h-full',
    'bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500',
    'rounded-full',
    'transition-all duration-500',
    'ease-out',
    'shadow-sm',
    'relative',
  ];

  return (
    <div className={cn(baseClasses, className)}>
      <div className={cn(containerClasses)}>
        <div
          className={cn(progressClasses)}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={`答题进度: ${current} / ${total}`}
        >
          {/* 添加光泽效果 */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export { ProgressBar };