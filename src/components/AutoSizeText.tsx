import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';

interface AutoSizeTextProps {
  text: string;
  maxLines?: number;
  minFontSize?: number;
  maxFontSize?: number;
  className?: string;
  style?: React.CSSProperties;
  language?: 'zh' | 'en';
}

export const AutoSizeText: React.FC<AutoSizeTextProps> = ({
  text,
  maxLines = 2,
  minFontSize = 16,
  maxFontSize = 36,
  className = '',
  style = {},
  language
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);
  const [isCalculating, setIsCalculating] = useState(true);

  useEffect(() => {
    const calculateOptimalFontSize = () => {
      if (!containerRef.current || !textRef.current) return;

      setIsCalculating(true);
      
      const container = containerRef.current;
      const textElement = textRef.current;
      
      // 获取容器的可用宽度
      const containerWidth = container.clientWidth - 32; // 减去padding
      
      // 二分查找最适合的字体大小
      let low = minFontSize;
      let high = maxFontSize;
      let bestFontSize = minFontSize;
      let attempts = 0;
      const maxAttempts = 15;

      while (low <= high && attempts < maxAttempts) {
        const currentFontSize = Math.floor((low + high) / 2);
        
        // 应用当前字体大小
        textElement.style.fontSize = `${currentFontSize}px`;
        textElement.style.lineHeight = '1.2';
        
        // 强制重新计算布局
        textElement.offsetHeight;
        
        // 创建临时元素来测量文本尺寸
        const tempElement = document.createElement('div');
        tempElement.style.position = 'absolute';
        tempElement.style.visibility = 'hidden';
        tempElement.style.whiteSpace = 'nowrap';
        tempElement.style.fontSize = `${currentFontSize}px`;
        tempElement.style.fontFamily = textElement.style.fontFamily;
        tempElement.style.fontWeight = textElement.style.fontWeight;
        tempElement.textContent = text;
        
        document.body.appendChild(tempElement);
        const singleLineWidth = tempElement.offsetWidth;
        document.body.removeChild(tempElement);
        
        // 计算需要的行数
        const estimatedLines = Math.ceil(singleLineWidth / containerWidth);
        
        if (estimatedLines <= maxLines) {
          bestFontSize = currentFontSize;
          low = currentFontSize + 1;
        } else {
          high = currentFontSize - 1;
        }
        
        attempts++;
      }

      setFontSize(bestFontSize);
      setIsCalculating(false);
    };

    // 延迟执行以确保DOM已渲染
    const timer = setTimeout(calculateOptimalFontSize, 150);
    
    // 监听窗口大小变化
    const handleResize = () => {
      const resizeTimer = setTimeout(calculateOptimalFontSize, 300);
      return () => clearTimeout(resizeTimer);
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [text, maxLines, minFontSize, maxFontSize]);

  // 根据语言选择字体
  const getFontFamily = () => {
    if (language === 'zh') {
      return '"KaiTi", "STKaiti", "SimSun", "Songti SC", serif';
    } else if (language === 'en') {
      return 'Nunito, sans-serif';
    }
    return undefined;
  };

  const combinedStyle = {
    fontSize: `${fontSize}px`,
    lineHeight: '1.2',
    fontFamily: getFontFamily(),
    ...style,
    opacity: isCalculating ? 0 : 1,
    transition: 'opacity 0.2s ease-in-out'
  };

  return (
    <div 
      ref={containerRef}
      className={cn("relative w-full", className)}
      style={{ minHeight: '5.5rem' }}
    >
      <div
        ref={textRef}
        className="text-center"
        style={combinedStyle}
      >
        {text}
      </div>
      
      {/* 加载状态 */}
      {isCalculating && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-400 text-lg">调整中...</div>
        </div>
      )}
    </div>
  );
};