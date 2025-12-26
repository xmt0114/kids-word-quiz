/**
 * CurtainEffect Component
 * 幕布效果组件 - 修复动画失效并提升视觉质感
 */

import React, { useEffect, useState, useRef } from 'react';
import type { CurtainEffectProps } from '../../types/missingWordsGame';
import { useMissingWordsGameAudio } from '../../hooks/useMissingWordsGameAudio';
import { cn } from '../../lib/utils';

// 定义幕布面板子组件 - 放在外部防止重绘导致的动画中断
const CurtainPanel = React.memo(({
  side,
  curtainState,
  transition
}: {
  side: 'left' | 'right';
  curtainState: 'closed' | 'closing' | 'opening' | 'open';
  transition: string;
}) => {
  const isClosingOrClosed = curtainState === 'closing' || curtainState === 'closed';

  const panelStyle: React.CSSProperties = {
    transition,
    transform: isClosingOrClosed
      ? 'translateX(0) scaleX(1)'
      : (side === 'left' ? 'translateX(-115%) scaleX(1.1)' : 'translateX(115%) scaleX(1.1)'),
    transformOrigin: side === 'left' ? 'left' : 'right',
    visibility: (curtainState === 'open' && !isClosingOrClosed) ? 'hidden' : 'visible',
    opacity: (curtainState === 'open' && !isClosingOrClosed) ? 0 : 1,
  };

  return (
    <div
      className={cn(
        "absolute top-0 bottom-0 w-1/2 overflow-hidden z-20",
        side === 'left' ? "left-0 bg-purple-900 border-r-2 border-purple-700/50" : "right-0 bg-purple-900 border-l-2 border-purple-700/50"
      )}
      style={panelStyle}
    >
      {/* 垂直褶皱与光泽 - 使用多重渐变模拟厚重丝绸 */}
      <div className="absolute inset-0 flex" style={{ opacity: 0.9 }}>
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="h-full flex-1"
            style={{
              background: i % 2 === 0
                ? 'linear-gradient(to right, #4c1d95, #5b21b6, #4c1d95)'
                : 'linear-gradient(to right, #4c1d95, #3b0764, #4c1d95)',
              boxShadow: side === 'left' ? 'inset -2px 0 5px rgba(0,0,0,0.3)' : 'inset 2px 0 5px rgba(0,0,0,0.3)'
            }}
          />
        ))}
      </div>

      {/* 复杂的装饰挂穗 */}
      <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-yellow-500 to-yellow-800 border-b-2 border-yellow-400 shadow-xl overflow-hidden">
        <div className="flex justify-around items-end h-full pb-2 px-1">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-4 bg-yellow-600 rounded-full"
              style={{
                animation: `curtain-tassel 2s ease-in-out infinite ${i * 0.1}s`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
            />
          ))}
        </div>
      </div>

      {/* 底部重量感阴影 */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-black/40 to-transparent" />
      <div className="absolute bottom-6 left-0 right-0 h-px bg-yellow-500/30" />

      {/* 丝绸的光敏效果 */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-black/20 pointer-events-none" />
    </div>
  );
});

CurtainPanel.displayName = 'CurtainPanel';

export const CurtainEffect: React.FC<CurtainEffectProps> = ({
  isActive,
  onComplete,
  onStateChange,
  fullCoverage = true,
  className,
}) => {
  const [curtainState, setCurtainState] = useState<'closed' | 'closing' | 'opening' | 'open'>('open');
  const audio = useMissingWordsGameAudio();

  const isRunningRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  // 统一的状态更新方法
  const updateState = (newState: 'closed' | 'closing' | 'opening' | 'open') => {
    setCurtainState(newState);
    onStateChangeRef.current?.(newState);
  };

  useEffect(() => {
    // 处理激活逻辑
    if (isActive && !isRunningRef.current) {
      isRunningRef.current = true;

      const runSequence = async () => {
        // 1. 开始合拢 (慢速大气)
        audio.playCurtain();
        updateState('closing');

        // 等待动画时间 (1500ms)
        await new Promise(r => setTimeout(r, 1500));

        // 2. 闭合完成
        updateState('closed');

        // 在闭合状态停留，给予神秘感
        await new Promise(r => setTimeout(r, 600));

        // 3. 触发核心逻辑 (隐藏牌)
        onCompleteRef.current();

        // 等待逻辑处理完成 (确保状态同步)
        await new Promise(r => setTimeout(r, 800));

        // 4. 开始拉开
        audio.playCurtain();
        updateState('opening');

        // 等待拉开动画 (1500ms)
        await new Promise(r => setTimeout(r, 1500));

        // 5. 回归开启状态
        updateState('open');
        isRunningRef.current = false;
      };

      runSequence();
    }
  }, [isActive]);

  // 监听 isActive 为 false 的情况同步状态（如果需要强制重置）
  useEffect(() => {
    if (!isActive && !isRunningRef.current) {
      if (curtainState !== 'open') {
        updateState('open');
      }
    }
  }, [isActive, curtainState]);

  const panelTransition = 'transform 1.5s cubic-bezier(0.45, 0.05, 0.55, 0.95)';

  return (
    <div className={cn("absolute inset-0 pointer-events-none overflow-hidden z-50", className)}>
      <CurtainPanel side="left" curtainState={curtainState} transition={panelTransition} />
      <CurtainPanel side="right" curtainState={curtainState} transition={panelTransition} />

      {/* 幕布中心合拢时的纯色背景，防止缝隙 */}
      <div
        className={cn(
          "absolute inset-0 bg-purple-950 transition-opacity duration-300 z-10",
          curtainState === 'closed' ? "opacity-100" : "opacity-0"
        )}
      />

      <style>{`
        @keyframes curtain-tassel {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.3); filter: brightness(1.2); }
        }
      `}</style>
    </div>
  );
};

CurtainEffect.displayName = 'CurtainEffect';
