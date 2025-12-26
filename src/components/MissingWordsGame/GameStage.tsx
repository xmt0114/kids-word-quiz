/**
 * GameStage Component
 * 游戏舞台组件 - 用于"哪个词语不见了？"游戏
 * 
 * 职责：
 * - 渲染词语卡片的舞台区域
 * - 管理词语卡片的布局和动画
 * - 实现幕布效果
 */

import React, { useEffect } from 'react';
import type { GameStageProps } from '../../types/missingWordsGame';
import { WordCard } from './WordCard';
import { CurtainEffect } from './CurtainEffect';
import { useMissingWordsGameAudio } from '../../hooks/useMissingWordsGameAudio';
import { cn } from '../../lib/utils';

export const GameStage: React.FC<GameStageProps> = ({
  words,
  wordPositions,
  gamePhase,
  gameMode,
  observationTimeLeft,
  observationTotalTime,
  onCurtainComplete,
  className,
}) => {
  // 音效管理
  const audio = useMissingWordsGameAudio();
  
  // 使用 ref 追踪上一次的阶段，避免重复播放音效
  const prevPhaseRef = React.useRef<string>('');
  const hasPlayedSoundRef = React.useRef<boolean>(false);

  // 当卡片出现时播放飞入音效
  // 只在以下情况播放：
  // 1. 从 idle 进入 observation（初始发牌）- 只播放一次
  // 2. 从 curtain 进入 answer（卡片消失后重新出现）- 只播放一次
  useEffect(() => {
    const currentPhase = gamePhase;
    const prevPhase = prevPhaseRef.current;
    
    // 判断是否应该播放音效
    const shouldPlaySound = 
      // 情况1：初始发牌（idle -> observation）
      (prevPhase === 'idle' && currentPhase === 'observation') ||
      // 情况2：卡片重新出现（curtain -> answer）
      (prevPhase === 'curtain' && currentPhase === 'answer');
    
    if (shouldPlaySound && !hasPlayedSoundRef.current && words.length > 0) {
      // 标记已播放，避免重复
      hasPlayedSoundRef.current = true;
      
      // 为每张卡片设置音效播放定时器
      const timers: NodeJS.Timeout[] = [];
      
      words.forEach((_, index) => {
        const delay = index * 100; // 与卡片动画延迟一致
        const timer = setTimeout(() => {
          audio.playCardAppear();
        }, delay);
        timers.push(timer);
      });
      
      // 清理函数
      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    }
    
    // 更新 ref
    if (prevPhase !== currentPhase) {
      prevPhaseRef.current = currentPhase;
      // 重置播放标记（当阶段改变时）
      hasPlayedSoundRef.current = false;
    }
  }, [gamePhase, words.length, audio]);

  // 舞台样式
  const stageClasses = cn(
    // 基础样式
    'relative',
    'w-full',
    'h-full',
    
    // 舞台背景和边框
    'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50',
    'rounded-3xl',
    'border-4 border-purple-300',
    'shadow-2xl',
    
    // 舞台装饰
    'overflow-hidden',
    
    // 自定义类名
    className
  );

  // 确定卡片是否可见
  // 在观察阶段和答题阶段显示，在幕布阶段隐藏
  const cardsVisible = gamePhase === 'observation' || gamePhase === 'answer' || gamePhase === 'result';

  return (
    <div className={stageClasses} data-testid="game-stage">
      {/* 舞台装饰 - 顶部光晕 */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
      
      {/* 舞台装饰 - 底部阴影 */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-200/30 to-transparent pointer-events-none" />
      
      {/* 舞台装饰 - 星星点缀 */}
      <div className="absolute top-4 left-4 text-yellow-400 text-2xl animate-pulse">✨</div>
      <div className="absolute top-4 right-4 text-yellow-400 text-2xl animate-pulse" style={{ animationDelay: '0.5s' }}>✨</div>
      <div className="absolute bottom-4 left-4 text-yellow-400 text-2xl animate-pulse" style={{ animationDelay: '1s' }}>✨</div>
      <div className="absolute bottom-4 right-4 text-yellow-400 text-2xl animate-pulse" style={{ animationDelay: '1.5s' }}>✨</div>
      
      {/* 词语卡片容器 */}
      <div className="absolute inset-0" data-testid="word-cards-container">
        {words.map((word, index) => {
          // 找到对应的位置信息
          const position = wordPositions.find(pos => pos.wordId === word.id);
          
          if (!position) {
            console.warn(`Position not found for word: ${word.id}`);
            return null;
          }

          // 计算动画延迟 - 卡片依次出现
          const animationDelay = index * 100; // 每个卡片延迟100ms

          return (
            <WordCard
              key={word.id}
              word={word}
              isVisible={cardsVisible}
              position={position}
              animationDelay={animationDelay}
            />
          );
        })}
      </div>
      
      {/* 幕布效果 */}
      <CurtainEffect
        isActive={gamePhase === 'curtain'}
        onComplete={onCurtainComplete}
        fullCoverage={true}
      />
    </div>
  );
};

GameStage.displayName = 'GameStage';
