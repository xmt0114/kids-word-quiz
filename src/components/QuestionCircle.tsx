import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QuestionCircleProps } from '../types';
import { createTooltipContent } from '../utils/resultCalculations';
import { cn } from '../lib/utils';
import { Check, X } from 'lucide-react';

/**
 * 题目圆圈组件
 * 显示题目序号和答题状态，支持悬浮提示
 */
const QuestionCircle: React.FC<QuestionCircleProps> = ({
  questionNumber,
  isCorrect,
  question,
  userAnswer,
  animationDelay,
  className,
  onHover
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const circleRef = useRef<HTMLDivElement>(null);
  const tooltipContent = createTooltipContent(question, userAnswer);

  const updateTooltipPosition = () => {
    if (circleRef.current) {
      const rect = circleRef.current.getBoundingClientRect();
      const tooltipWidth = 300; // 估算的悬浮提示宽度
      const tooltipHeight = 120; // 估算的悬浮提示高度

      let left = rect.left + rect.width / 2 - tooltipWidth / 2;
      let top = rect.top - tooltipHeight - 8; // 8px 间距

      // 确保悬浮提示不会超出视口边界
      const padding = 16;
      if (left < padding) {
        left = padding;
      } else if (left + tooltipWidth > window.innerWidth - padding) {
        left = window.innerWidth - tooltipWidth - padding;
      }

      if (top < padding) {
        // 如果上方空间不够，显示在下方
        top = rect.bottom + 8;
      }

      setTooltipPosition({ top, left });
    }
  };

  const handleMouseEnter = () => {
    updateTooltipPosition();
    setShowTooltip(true);
    onHover?.(question, userAnswer);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  useEffect(() => {
    if (showTooltip) {
      updateTooltipPosition();
      // 监听窗口大小变化
      window.addEventListener('resize', updateTooltipPosition);
      window.addEventListener('scroll', updateTooltipPosition);

      return () => {
        window.removeEventListener('resize', updateTooltipPosition);
        window.removeEventListener('scroll', updateTooltipPosition);
      };
    }
  }, [showTooltip]);

  return (
    <>
      <div
        ref={circleRef}
        className={cn(
          'relative w-12 h-12 rounded-full flex items-center justify-center',
          'text-lg font-black cursor-pointer transition-all duration-300 hover:scale-110 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)]',
          'transform transition-all duration-300 hover:scale-110 hover:-translate-y-1',
          'shadow-2xl border-3',
          isCorrect
            ? 'bg-gradient-to-br from-green-100 via-green-200 to-green-300 text-green-800 border-green-400 shadow-green-200'
            : 'bg-gradient-to-br from-red-100 via-red-200 to-red-300 text-red-800 border-red-400 shadow-red-200',
          className
        )}
        style={{
          animationDelay: `${animationDelay}ms`,
          fontFamily: 'Fredoka, sans-serif',
          textShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* 内部高光效果 */}
        <div className={cn(
          'absolute inset-1 rounded-full',
          isCorrect
            ? 'bg-gradient-to-br from-white/40 to-transparent'
            : 'bg-gradient-to-br from-white/40 to-transparent'
        )} />

        {/* 题目序号 */}
        <span className="relative z-10 drop-shadow-sm">
          {questionNumber}
        </span>

        {/* 状态图标 - 更立体 */}
        <div className={cn(
          'absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center',
          'shadow-lg border-2 border-white transform transition-all duration-300',
          isCorrect
            ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-green-300'
            : 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-300'
        )}>
          {isCorrect ? (
            <Check size={12} className="text-white drop-shadow-sm" />
          ) : (
            <X size={12} className="text-white drop-shadow-sm" />
          )}
        </div>

        {/* 渐入动画 */}
        <div className="absolute inset-0 rounded-full animate-bounce-in" />
      </div>

      {/* 悬浮提示 - 使用 Portal 渲染到 body */}
      {showTooltip && createPortal(
        <div
          className="fixed pointer-events-none animate-fade-in"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            zIndex: 99999
          }}
        >
          <div className={cn(
            'bg-gray-900 text-white text-sm rounded-lg p-3 shadow-2xl border border-gray-700',
            'max-w-xs whitespace-nowrap backdrop-blur-sm'
          )}>
            {/* 提示内容 */}
            <div className="space-y-2">
              <div>
                <span className="font-semibold text-blue-300">题目 {questionNumber}：</span>
                <span className="text-white ml-1">{tooltipContent.question}</span>
              </div>

              <div>
                <span className="font-semibold text-gray-300">你的答案：</span>
                <span className={cn(
                  'ml-1 font-medium',
                  tooltipContent.isCorrect ? 'text-green-300' : 'text-red-300'
                )}>
                  {tooltipContent.userAnswer}
                </span>
              </div>

              {!tooltipContent.isCorrect && (
                <div>
                  <span className="font-semibold text-gray-300">正确答案：</span>
                  <span className="text-green-300 ml-1 font-medium">{tooltipContent.correctAnswer}</span>
                </div>
              )}

              {tooltipContent.timeSpent && (
                <div>
                  <span className="font-semibold text-gray-300">用时：</span>
                  <span className="text-yellow-300 ml-1">{tooltipContent.timeSpent}</span>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

QuestionCircle.displayName = 'QuestionCircle';

export { QuestionCircle };