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
    'h-3',
    'overflow-hidden',
  ];

  const progressClasses = [
    'h-full',
    'bg-gradient-to-r from-primary-500 to-primary-600',
    'rounded-full',
    'transition-all duration-normal',
    'ease-out',
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
        />
      </div>
    </div>
  );
};

export { ProgressBar };