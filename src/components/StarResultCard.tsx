import React from 'react';
import { cn } from '../lib/utils';
import { StarExplosion } from './StarExplosion';

interface StarResultCardProps {
  accuracy: number;
  encouragementMessage: string;
  showCelebration?: boolean;
  className?: string;
}

/**
 * 星级结果卡片组件
 * 显示准确率、星级评价和鼓励信息的大型卡片
 */
const StarResultCard: React.FC<StarResultCardProps> = ({
  accuracy,
  encouragementMessage,
  showCelebration = false,
  className
}) => {
  // 根据准确率计算星星数量
  const getStarCount = (accuracy: number): number => {
    if (accuracy >= 90) return 3;
    if (accuracy >= 70) return 2;
    return 1;
  };

  const starCount = getStarCount(accuracy);

  // 生成星星数组
  const stars = Array.from({ length: 3 }, (_, index) => ({
    id: index,
    filled: index < starCount,
    delay: index * 200 // 每颗星延迟200ms出现
  }));

  return (
    <div className={cn(
      'relative bg-gradient-to-br from-white via-purple-50 to-pink-50',
      'border-2 border-purple-200 rounded-3xl p-6 text-center',
      'shadow-2xl overflow-hidden min-h-[320px]',
      className
    )}>
      {/* 庆祝动画 */}
      {showCelebration && (
        <div className="absolute inset-0">
          <StarExplosion isVisible={true} />
        </div>
      )}

      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 left-4 w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-xl"></div>
        <div className="absolute bottom-4 right-4 w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-yellow-300 to-orange-300 rounded-full blur-2xl opacity-30"></div>
      </div>

      {/* 主要内容 */}
      <div className="relative z-10">
        {/* 准确率显示 */}
        <div className="mb-2">
          <div className={cn(
            'text-9xl font-black mb-3',
            'bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 bg-clip-text text-transparent',
            'drop-shadow-2xl animate-bounce-in filter brightness-110',
            'transform-gpu'
          )}
          style={{
            fontFamily: 'Fredoka, sans-serif',
            textShadow: '0 4px 8px rgba(147, 51, 234, 0.4), 0 8px 16px rgba(147, 51, 234, 0.2)',
            filter: 'drop-shadow(0 6px 12px rgba(147, 51, 234, 0.3))'
          }}>
            {accuracy.toFixed(0)}%
          </div>
        </div>

        {/* 星星评级 - 拱形排列 */}
        <div className="flex justify-center items-end gap-6 mb-4 relative">
          {stars.map((star, index) => {
            // 计算拱形位置：增大弧度，中间的星星最高，两边的星星更低
            const archOffset = index === 1 ? -16 : index === 0 ? 8 : 8; // 中间星星向上偏移16px，两边向下偏移8px
            
            return (
              <div
                key={star.id}
                className={cn(
                  'relative transition-all duration-500',
                  star.filled ? 'animate-star-bounce' : 'opacity-30'
                )}
                style={{
                  animationDelay: `${star.delay}ms`,
                  transform: `translateY(${archOffset}px)`
                }}
              >
                {/* 星星发光效果 */}
                {star.filled && (
                  <div className="absolute inset-0 animate-pulse">
                    <div className="w-32 h-32 bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full blur-xl opacity-50"></div>
                  </div>
                )}
                
                {/* 星星本体 */}
                <div className={cn(
                  'relative w-32 h-32 flex items-center justify-center text-8xl',
                  'transform transition-all duration-300',
                  star.filled 
                    ? 'text-yellow-400 drop-shadow-2xl scale-110 filter brightness-110' 
                    : 'text-gray-300'
                )}
                style={{
                  textShadow: star.filled ? '0 0 25px rgba(255, 193, 7, 0.8), 0 0 50px rgba(255, 193, 7, 0.4)' : 'none'
                }}>
                  ⭐
                </div>
              </div>
            );
          })}
        </div>

        {/* 鼓励信息 */}
        <div className={cn(
          'text-5xl font-black leading-relaxed px-4',
          'bg-gradient-to-r from-red-500 via-purple-600 to-pink-500 bg-clip-text text-transparent',
          'animate-fade-in-up'
        )}
        style={{
          fontFamily: '"Microsoft YaHei UI", "YouYuan", "幼圆", "STYuanti", "华文圆体", cursive, "Noto Sans SC", sans-serif',
          fontSize: '36px',
          animationDelay: '600ms',
          letterSpacing: '0.02em',
          fontWeight: '600'
        }}>
          {encouragementMessage}
        </div>
      </div>

      {/* 底部装饰波浪 */}
      <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200 opacity-30 transform rotate-1 scale-110"></div>
      </div>
    </div>
  );
};

StarResultCard.displayName = 'StarResultCard';

export { StarResultCard };