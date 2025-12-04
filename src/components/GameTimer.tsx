import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { formatTime } from '../utils/resultCalculations';

interface GameTimerProps {
  startTime?: number;
  className?: string;
  showIcon?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * 游戏计时器组件
 * 显示从游戏开始到现在的总用时
 */
const GameTimer: React.FC<GameTimerProps> = ({
  startTime,
  className,
  showIcon = true,
  size = 'medium'
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!startTime) return;

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000; // 转换为秒
      setElapsedTime(elapsed);
    };

    // 立即更新一次
    updateTimer();

    // 每秒更新一次
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  if (!startTime) {
    return null;
  }

  const sizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  const iconSizes = {
    small: 16,
    medium: 18,
    large: 20
  };

  return (
    <div className={cn(
      'flex items-center gap-1',
      sizeClasses[size],
      className
    )}>
      {showIcon && (
        <Clock 
          size={iconSizes[size]} 
          className="text-gray-500" 
        />
      )}
      <span className="font-mono text-gray-700 font-medium">
        {formatTime(elapsedTime)}
      </span>
    </div>
  );
};

GameTimer.displayName = 'GameTimer';

export { GameTimer };