/**
 * WordCard Component
 * 词语卡片组件 - 用于"哪个词语不见了？"游戏
 * 
 * 改进：
 * 1. 添加从角落飞入的动画效果
 * 2. 支持音效配合
 */

import React, { useState, useEffect } from 'react';
import type { WordCardProps } from '../../types/missingWordsGame';
import { cn } from '../../lib/utils';

export const WordCard: React.FC<WordCardProps> = ({
  word,
  isVisible,
  position,
  animationDelay,
  className,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  // 根据语言选择字体
  const fontClass = word.language === 'chinese' ? 'font-kaiti' : 'font-fredoka';

  // 当卡片变为可见时，触发飞入动画
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, animationDelay);
      
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [isVisible, animationDelay]);

  // 随机选择飞入的起始角落（左上、右上、左下、右下）
  const getStartPosition = () => {
    const corners = [
      { x: -200, y: -200 }, // 左上
      { x: 1000, y: -200 }, // 右上
      { x: -200, y: 600 },  // 左下
      { x: 1000, y: 600 },  // 右下
    ];
    // 使用 word.id 作为种子，确保同一个卡片总是从同一个角落飞入
    const index = parseInt(word.id.slice(-1), 36) % corners.length;
    return corners[index];
  };

  const startPos = getStartPosition();

  // 卡片样式
  const cardClasses = cn(
    // 基础样式
    'absolute',
    'bg-gradient-to-br from-yellow-100 via-white to-yellow-50',
    'rounded-2xl',
    'shadow-lg',
    'border-4 border-yellow-400',
    'flex items-center justify-center',
    'select-none',
    
    // 尺寸 - 增大卡片
    'w-40 h-32',
    'md:w-48 md:h-36',
    
    // 文字样式 - 增大字体
    'text-3xl md:text-4xl font-black',
    'text-gray-800',
    fontClass,
    
    // 自定义类名
    className
  );

  // 计算transform样式 - 添加飞入动画
  const transformStyle: React.CSSProperties = isAnimating ? {
    left: `${position.x}px`,
    top: `${position.y}px`,
    transform: `translate(-50%, -50%) rotate(${position.rotation || 0}deg)`,
    opacity: 1,
    transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)', // 弹性缓动
  } : {
    left: `${startPos.x}px`,
    top: `${startPos.y}px`,
    transform: `translate(-50%, -50%) rotate(${(position.rotation || 0) + 360}deg) scale(0.3)`,
    opacity: 0,
    transition: 'none',
  };

  return (
    <div
      className={cardClasses}
      style={transformStyle}
      data-word-id={word.id}
      data-language={word.language}
    >
      {/* 卡片内容 */}
      <div className="relative z-10 px-4 py-2">
        {word.text}
      </div>
      
      {/* 卡片装饰 - 顶部星星 */}
      <div className="absolute top-1 right-1 text-yellow-500 text-xs">
        ⭐
      </div>
      
      {/* 卡片装饰 - 底部阴影效果 */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-yellow-200/20 to-transparent pointer-events-none" />
    </div>
  );
};

WordCard.displayName = 'WordCard';
