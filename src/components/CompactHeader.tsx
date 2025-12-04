import React from 'react';
import { CompactHeaderProps } from '../types';
import { cn } from '../lib/utils';

/**
 * 紧凑标题组件
 * 用于游戏结果页面的标题区域，采用更小的字体和间距以节省空间
 */
const CompactHeader: React.FC<CompactHeaderProps> = ({ 
  title, 
  subtitle, 
  className 
}) => {
  return (
    <div className={cn(
      'text-center mb-sm animate-slide-in-right',
      className
    )}>
      <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-xs">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-gray-500">
          {subtitle}
        </p>
      )}
    </div>
  );
};

CompactHeader.displayName = 'CompactHeader';

export { CompactHeader };