/**
 * GameStage Component
 * 游戏舞台组件 - 用于"哪个词语不见了？"游戏
 * 
 * 职责：
 * - 渲染词语卡片的舞台区域
 * - 管理词语卡片的布局和动画
 * - 实现幕布效果
 */

import React, { useEffect, useState } from 'react';
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
  // 1. 音效管理
  const audio = useMissingWordsGameAudio();

  // 2. 状态管理
  const [curtainInternalState, setCurtainInternalState] = useState<'closed' | 'closing' | 'opening' | 'open'>('open');
  const [isOpeningDelayed, setIsOpeningDelayed] = useState(false); // 用于延时显示卡片

  const prevCardsVisibleRef = React.useRef<boolean>(false);
  const soundPlayedForRoundRef = React.useRef<string>('');

  // 3. 计算属性
  // 视觉修正：统一使用 border-2 更加精致
  const stageClasses = cn(
    'relative w-full h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-3xl border-2 border-purple-200 shadow-2xl overflow-hidden',
    className
  );

  // 延时显现逻辑：当幕布开始拉开时，等待 700ms 左右再让牌可见（此时幕布已拉开过半）
  useEffect(() => {
    if (curtainInternalState === 'opening') {
      const timer = setTimeout(() => {
        setIsOpeningDelayed(true);
      }, 700);
      return () => clearTimeout(timer);
    } else {
      setIsOpeningDelayed(false);
    }
  }, [curtainInternalState]);

  // 精确的时序控制：
  // - 观察阶段、结果阶段：必须可见
  // - 幕布合拢中 (closing)：可见（在幕布后方）
  // - 闭合 (closed)：隐藏
  // - 拉开中 (opening)：延时 700ms 后可见
  // - 完全拉开 (open)：可见
  const cardsVisible =
    gamePhase === 'observation' ||
    gamePhase === 'result' ||
    (curtainInternalState === 'closing') ||
    (curtainInternalState === 'opening' && isOpeningDelayed) ||
    (curtainInternalState === 'open');

  // 4. 副作用 (播放发牌音效)
  useEffect(() => {
    const justBecameVisible = cardsVisible && !prevCardsVisibleRef.current;
    const isKeyPhase = gamePhase === 'observation' || gamePhase === 'answer';
    const roundId = `${gamePhase}-${words.map(w => w.id).join(',')}`;

    if (justBecameVisible && isKeyPhase && words.length > 0 && soundPlayedForRoundRef.current !== roundId) {
      soundPlayedForRoundRef.current = roundId;

      const timers: NodeJS.Timeout[] = [];
      words.forEach((_, index) => {
        const delay = index * 100;
        const timer = setTimeout(() => {
          audio.playCardAppear();
        }, delay);
        timers.push(timer);
      });

      return () => timers.forEach(timer => clearTimeout(timer));
    }
    prevCardsVisibleRef.current = cardsVisible;
  }, [cardsVisible, gamePhase, words, audio]);

  // 5. 渲染
  return (
    <div className={stageClasses} data-testid="game-stage">
      {/* 舞台装饰 */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-200/20 to-transparent pointer-events-none" />
      <div className="absolute top-4 left-4 text-yellow-400 text-2xl animate-pulse">✨</div>
      <div className="absolute top-4 right-4 text-yellow-400 text-2xl animate-pulse" style={{ animationDelay: '0.5s' }}>✨</div>
      <div className="absolute bottom-4 left-4 text-yellow-400 text-2xl animate-pulse" style={{ animationDelay: '1s' }}>✨</div>
      <div className="absolute bottom-4 right-4 text-yellow-400 text-2xl animate-pulse" style={{ animationDelay: '1.5s' }}>✨</div>

      {/* 词语卡片容器 */}
      <div className="absolute inset-0" data-testid="word-cards-container">
        {words.map((word, index) => {
          const position = wordPositions.find(pos => pos.wordId === word.id);
          if (!position) return null;

          return (
            <WordCard
              key={word.id}
              word={word}
              isVisible={cardsVisible}
              position={position}
              animationDelay={index * 100}
            />
          );
        })}
      </div>

      {/* 幕布效果 */}
      <CurtainEffect
        isActive={gamePhase === 'curtain'}
        onComplete={onCurtainComplete}
        onStateChange={setCurtainInternalState}
        fullCoverage={true}
      />
    </div>
  );
};

GameStage.displayName = 'GameStage';
