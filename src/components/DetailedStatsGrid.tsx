import React from 'react';
import { DetailedStatsGridProps } from '../types';
import { formatTime } from '../utils/resultCalculations';
import { cn } from '../lib/utils';
import { 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Clock
} from 'lucide-react';

/**
 * 详细统计网格组件
 * 显示游戏的详细统计信息，包括用时、平均用时、连续正确等
 */
const DetailedStatsGrid: React.FC<DetailedStatsGridProps> = ({
  correctAnswers,
  totalQuestions,
  accuracy,
  timeSpent,
  averageTimePerQuestion,
  longestStreak,
  className
}) => {
  const wrongAnswers = totalQuestions - correctAnswers;

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {/* 正确 */}
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
              <div className={cn(
                'text-3xl font-black',
                'bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent'
              )}
              style={{ fontFamily: 'Fredoka, sans-serif' }}>
                {correctAnswers}
              </div>
            </div>
            <div className={cn(
              'text-lg font-semibold',
              'bg-gradient-to-r from-gray-600 to-gray-700 bg-clip-text text-transparent'
            )}
            style={{ fontFamily: 'Fredoka, "Noto Sans SC", sans-serif' }}>
              正确
            </div>
          </div>
          
          {/* 错误 */}
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center mb-2">
              <XCircle className="w-6 h-6 text-red-600 mr-2" />
              <div className={cn(
                'text-3xl font-black',
                'bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent'
              )}
              style={{ fontFamily: 'Fredoka, sans-serif' }}>
                {wrongAnswers}
              </div>
            </div>
            <div className={cn(
              'text-lg font-semibold',
              'bg-gradient-to-r from-gray-600 to-gray-700 bg-clip-text text-transparent'
            )}
            style={{ fontFamily: 'Fredoka, "Noto Sans SC", sans-serif' }}>
              错误
            </div>
          </div>

          {/* 连续正确 */}
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-6 h-6 text-blue-600 mr-2" />
              <div className={cn(
                'text-3xl font-black',
                'bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent'
              )}
              style={{ fontFamily: 'Fredoka, sans-serif' }}>
                {longestStreak}
              </div>
            </div>
            <div className={cn(
              'text-lg font-semibold',
              'bg-gradient-to-r from-gray-600 to-gray-700 bg-clip-text text-transparent'
            )}
            style={{ fontFamily: 'Fredoka, "Noto Sans SC", sans-serif' }}>
              连续正确
            </div>
          </div>

          {/* 用时信息 */}
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-6 h-6 text-purple-600 mr-2" />
              <div className={cn(
                'text-3xl font-black',
                'bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent'
              )}
              style={{ fontFamily: 'Fredoka, sans-serif' }}>
                {timeSpent ? formatTime(timeSpent) : 
                 averageTimePerQuestion ? formatTime(averageTimePerQuestion) : '--'}
              </div>
            </div>
            <div className={cn(
              'text-lg font-semibold',
              'bg-gradient-to-r from-gray-600 to-gray-700 bg-clip-text text-transparent'
            )}
            style={{ fontFamily: 'Fredoka, "Noto Sans SC", sans-serif' }}>
              用时
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

DetailedStatsGrid.displayName = 'DetailedStatsGrid';

export { DetailedStatsGrid };