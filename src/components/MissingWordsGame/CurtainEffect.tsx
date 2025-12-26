/**
 * CurtainEffect Component
 * 幕布效果组件 - 用于"哪个词语不见了？"游戏
 * 
 * 职责：
 * - 实现幕布合拢和拉开动画
 * - 完全遮挡舞台防止用户看到词语消失过程
 * - 在幕布完全遮挡期间触发词语移除逻辑
 */

import React, { useEffect, useState } from 'react';
import type { CurtainEffectProps } from '../../types/missingWordsGame';
import { cn } from '../../lib/utils';

export const CurtainEffect: React.FC<CurtainEffectProps> = ({
  isActive,
  onComplete,
  fullCoverage = true,
  className,
}) => {
  // 幕布状态：'closed' | 'closing' | 'opening' | 'open'
  const [curtainState, setCurtainState] = useState<'closed' | 'closing' | 'opening' | 'open'>('open');

  useEffect(() => {
    if (!isActive) {
      // 如果不激活，保持打开状态
      setCurtainState('open');
      return;
    }

    // 激活幕布效果的完整流程
    const runCurtainSequence = async () => {
      // 1. 开始合拢
      setCurtainState('closing');

      // 2. 等待合拢动画完成（1秒）
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. 幕布完全合拢
      setCurtainState('closed');

      // 4. 在幕布完全遮挡期间，触发回调（词语移除）
      // 等待一小段时间确保用户看不到变化
      await new Promise(resolve => setTimeout(resolve, 300));

      // 5. 触发完成回调（执行词语移除）
      onComplete();

      // 6. 等待一小段时间后开始拉开
      await new Promise(resolve => setTimeout(resolve, 200));

      // 7. 开始拉开
      setCurtainState('opening');

      // 8. 等待拉开动画完成（1秒）
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 9. 幕布完全打开
      setCurtainState('open');
    };

    runCurtainSequence();
  }, [isActive, onComplete]);

  // 如果幕布完全打开，不渲染任何内容
  if (curtainState === 'open') {
    return null;
  }

  // 左侧幕布样式
  const leftCurtainClasses = cn(
    // 基础样式
    'absolute top-0 bottom-0 left-0',
    'bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900',
    'border-r-4 border-purple-700',
    'shadow-2xl',
    'z-50',
    
    // 幕布宽度和动画
    curtainState === 'closing' && 'w-1/2 transition-all duration-1000 ease-in-out',
    curtainState === 'closed' && 'w-1/2',
    curtainState === 'opening' && 'w-0 transition-all duration-1000 ease-in-out',
    
    // 确保完全覆盖
    fullCoverage && 'min-h-full'
  );

  // 右侧幕布样式
  const rightCurtainClasses = cn(
    // 基础样式
    'absolute top-0 bottom-0 right-0',
    'bg-gradient-to-l from-purple-900 via-purple-800 to-purple-900',
    'border-l-4 border-purple-700',
    'shadow-2xl',
    'z-50',
    
    // 幕布宽度和动画
    curtainState === 'closing' && 'w-1/2 transition-all duration-1000 ease-in-out',
    curtainState === 'closed' && 'w-1/2',
    curtainState === 'opening' && 'w-0 transition-all duration-1000 ease-in-out',
    
    // 确保完全覆盖
    fullCoverage && 'min-h-full'
  );

  // 容器样式
  const containerClasses = cn(
    'absolute inset-0 pointer-events-none overflow-hidden',
    className
  );

  return (
    <div className={containerClasses} data-testid="curtain-effect" data-curtain-state={curtainState}>
      {/* 左侧幕布 */}
      <div className={leftCurtainClasses} data-testid="curtain-left">
        {/* 幕布装饰 - 褶皱效果 */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-purple-950"
              style={{ left: `${i * 10}%` }}
            />
          ))}
        </div>
        
        {/* 幕布装饰 - 顶部流苏 */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-yellow-600 to-yellow-700 opacity-80">
          <div className="flex justify-around h-full">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="w-1 bg-yellow-800 opacity-60" />
            ))}
          </div>
        </div>
      </div>

      {/* 右侧幕布 */}
      <div className={rightCurtainClasses} data-testid="curtain-right">
        {/* 幕布装饰 - 褶皱效果 */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-purple-950"
              style={{ left: `${i * 10}%` }}
            />
          ))}
        </div>
        
        {/* 幕布装饰 - 顶部流苏 */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-yellow-600 to-yellow-700 opacity-80">
          <div className="flex justify-around h-full">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="w-1 bg-yellow-800 opacity-60" />
            ))}
          </div>
        </div>
      </div>

      {/* 中央遮挡层 - 确保完全遮挡 */}
      {curtainState === 'closed' && (
        <div 
          className="absolute inset-0 bg-purple-900 z-40"
          data-testid="curtain-center-cover"
        />
      )}

      {/* 幕布状态指示器（仅用于调试） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[60] bg-black/50 text-white px-4 py-2 rounded text-sm">
          幕布状态: {curtainState}
        </div>
      )}
    </div>
  );
};

CurtainEffect.displayName = 'CurtainEffect';
