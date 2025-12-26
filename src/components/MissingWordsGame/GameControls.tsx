/**
 * GameControls Component
 * 游戏控制组件 - 用于"哪个词语不见了？"游戏
 * 
 * 职责：
 * - 渲染游戏控制按钮
 * - 显示答题选项
 * - 管理计时器显示
 */

import React from 'react';
import type { GameControlsProps } from '../../types/missingWordsGame';
import { Button } from '../Button';
import { cn } from '../../lib/utils';

export const GameControls: React.FC<GameControlsProps> = ({
  gamePhase,
  gameMode,
  timeLeft,
  answerOptions,
  selectedAnswers,
  hiddenCount,
  onObservationComplete,
  onAnswerSelect,
  onSubmitAnswer,
  onShowAnswer,
  onStartGame,
  className,
}) => {
  // 根据游戏阶段渲染不同的控制内容
  const renderControls = () => {
    switch (gamePhase) {
      case 'idle':
        // 空闲状态 - 显示开始游戏按钮
        return (
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-gray-800">
                哪个词语不见了？
              </h2>
              <p className="text-lg text-gray-600 max-w-md">
                观察舞台上的词语，记住它们的位置。<br />
                当幕布拉开后，找出消失的词语！
              </p>
            </div>
            <Button
              onClick={onStartGame}
              variant="primary"
              size="large"
              className="min-w-[200px] text-xl py-4"
            >
              开始游戏
            </Button>
          </div>
        );

      case 'observation':
        // 观察阶段 - 显示"观察好了"按钮或倒计时
        return (
          <div className="flex justify-center">
            {gameMode === 'casual' ? (
              <Button
                onClick={onObservationComplete}
                variant="primary"
                size="large"
                className="min-w-[200px] text-xl py-4"
              >
                观察好了
              </Button>
            ) : (
              // 挑战模式显示倒计时（在计时器组件中实现）
              null
            )}
          </div>
        );

      case 'curtain':
        // 幕布阶段 - 不显示任何控制
        return null;

      case 'answer':
        // 答题阶段 - 显示答题选项或"显示答案"按钮
        return (
          <div className="space-y-6">
            {gameMode === 'casual' ? (
              // 休闲模式 - 显示答案按钮
              <div className="flex justify-center">
                <Button
                  onClick={onShowAnswer}
                  variant="primary"
                  size="large"
                  className="min-w-[200px] text-xl py-4"
                >
                  显示答案
                </Button>
              </div>
            ) : (
              // 挑战模式 - 显示答题选项
              <div className="space-y-4">
                <p className="text-center text-lg font-semibold text-gray-700">
                  {hiddenCount === 1 
                    ? '选择消失的词语：' 
                    : `选择消失的${hiddenCount}个词语：`}
                </p>
                
                {/* 答题选项网格 */}
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  {answerOptions.map((word) => {
                    const isSelected = selectedAnswers.includes(word.id);
                    return (
                      <button
                        key={word.id}
                        onClick={() => onAnswerSelect(word.id)}
                        className={cn(
                          'p-4 rounded-xl border-4 text-xl font-bold transition-all',
                          'hover:scale-105 active:scale-95',
                          word.language === 'chinese' ? 'font-kaiti' : 'font-fredoka',
                          isSelected
                            ? 'bg-primary-500 text-white border-primary-600 shadow-lg'
                            : 'bg-white text-gray-800 border-gray-300 hover:border-primary-400 shadow-md'
                        )}
                        data-testid={`answer-option-${word.id}`}
                        data-selected={isSelected}
                      >
                        {word.text}
                      </button>
                    );
                  })}
                </div>

                {/* 提交按钮 */}
                <div className="flex justify-center">
                  <Button
                    onClick={onSubmitAnswer}
                    variant="primary"
                    size="large"
                    disabled={selectedAnswers.length !== hiddenCount}
                    className="min-w-[200px] text-xl py-4"
                  >
                    提交答案
                  </Button>
                </div>

                {/* 选择提示 */}
                {hiddenCount > 1 && (
                  <p className="text-center text-sm text-gray-500">
                    已选择 {selectedAnswers.length} / {hiddenCount} 个
                  </p>
                )}
              </div>
            )}
          </div>
        );

      case 'result':
        // 结果阶段 - 不在这里显示控制（由主页面处理）
        return null;

      default:
        return null;
    }
  };

  // 容器样式
  const containerClasses = cn(
    'w-full',
    className
  );

  return (
    <div className={containerClasses} data-testid="game-controls" data-game-phase={gamePhase}>
      {renderControls()}
    </div>
  );
};

GameControls.displayName = 'GameControls';
