/**
 * Missing Words Game Page
 * "哪个词语不见了？"游戏主页面
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, Home, Volume2, VolumeX, Settings2 } from 'lucide-react';
import { useMissingWordsGame } from '../../hooks/useMissingWordsGame';
import { GameStage } from './GameStage';
import { GameConfigModal } from './GameConfigModal';
import { Button } from '../Button';
import { cn } from '../../lib/utils';
import { useAppStore } from '../../stores/appStore';
import type { GameConfig } from '../../types/missingWordsGame';

export const MissingWordsGamePage: React.FC = () => {
  const navigate = useNavigate();
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingConfig, setPendingConfig] = useState<GameConfig | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  
  // 获取音效状态
  const { isMuted, toggleMute, playSound } = useAppStore();
  
  const {
    gamePhase,
    gameMode,
    config,
    currentWords,
    hiddenWords,
    answerOptions,
    wordPositions,
    observationTimeLeft,
    selectedAnswers,
    startGame,
    handleObservationComplete,
    handleCurtainComplete,
    handleAnswerSelect,
    handleSubmitAnswer,
    handleShowAnswer,
    updateConfig,
    resetGame,
  } = useMissingWordsGame();

  // 处理返回首页
  const handleBack = () => {
    playSound('click');
    navigate('/');
  };

  // 处理音效切换
  const handleSoundToggle = () => {
    toggleMute();
    if (isMuted) {
      playSound('toggle');
    }
  };

  // 打开设置模态框
  const handleOpenSettings = () => {
    playSound('click');
    setIsPaused(true); // 暂停游戏
    setShowConfigModal(true);
  };

  // 关闭设置模态框
  const handleCloseSettings = () => {
    setShowConfigModal(false);
    setIsPaused(false); // 恢复游戏
  };

  // 处理配置保存
  const handleConfigSave = (newConfig: GameConfig) => {
    // 如果游戏正在进行中（非idle和result阶段），显示确认对话框
    if (gamePhase !== 'idle' && gamePhase !== 'result') {
      setPendingConfig(newConfig);
      setShowConfirmDialog(true);
      setShowConfigModal(false);
    } else {
      // 游戏未开始或已结束，直接更新配置并关闭模态框
      updateConfig(newConfig);
      setShowConfigModal(false);
      setIsPaused(false);
    }
  };

  // 确认配置变更并重启游戏
  const handleConfirmConfigChange = () => {
    if (pendingConfig) {
      // 更新配置
      updateConfig(pendingConfig);
      // 重置游戏状态
      resetGame();
      setPendingConfig(null);
    }
    setShowConfirmDialog(false);
    setIsPaused(false);
    
    // 自动开始新游戏
    setTimeout(() => {
      startGame();
    }, 100);
  };

  // 取消配置变更
  const handleCancelConfigChange = () => {
    setPendingConfig(null);
    setShowConfirmDialog(false);
    setIsPaused(false); // 恢复游戏
  };

  // 渲染游戏阶段内容
  const renderGameContent = () => {
    return (
      <div className="w-full h-full flex items-center justify-center p-3">
        {/* 统一的游戏容器 - 整体边框包裹上下两部分 */}
        <div className="w-full max-w-[1400px] h-full flex flex-col bg-white rounded-3xl border-4 border-purple-200 shadow-2xl overflow-hidden">
          {/* 上部分：游戏舞台 - 紫色背景区域（无按钮遮挡） */}
          <div className="relative flex-1 bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 overflow-hidden">
            {/* 游戏舞台内容 */}
            <div className="w-full h-full flex items-center justify-center p-4">
              {gamePhase === 'idle' ? (
                <div className="text-center space-y-4">
                  <h1 className="text-5xl font-bold text-primary-500 drop-shadow-lg">
                    哪个词语不见了？
                  </h1>
                  <p className="text-lg text-gray-600 max-w-md mx-auto">
                    观察舞台上的词语，记住它们的位置<br />
                    幕布拉开后，找出消失的词语！
                  </p>
                </div>
              ) : gamePhase === 'result' ? (
                <GameStage
                  words={[...currentWords, ...hiddenWords]}
                  wordPositions={wordPositions}
                  gamePhase="observation"
                  gameMode={gameMode}
                  observationTimeLeft={observationTimeLeft}
                  observationTotalTime={config.observationTime}
                  onCurtainComplete={handleCurtainComplete}
                  className="w-full h-full"
                />
              ) : (
                <GameStage
                  words={currentWords}
                  wordPositions={wordPositions}
                  gamePhase={gamePhase}
                  gameMode={gameMode}
                  observationTimeLeft={observationTimeLeft}
                  observationTotalTime={config.observationTime}
                  onCurtainComplete={handleCurtainComplete}
                  className="w-full h-full"
                />
              )}
            </div>
          </div>

          {/* 分隔线 */}
          <div className="h-px bg-purple-200"></div>

          {/* 下部分：控制栏 - 白色背景区域 */}
          <div className="relative bg-white px-6 py-3">
            {/* 悬浮按钮组 - 绝对定位在控制区域上方 */}
            <div className="absolute -top-6 left-0 right-0 px-6 flex justify-between items-start pointer-events-none">
              {/* 左侧：返回按钮 */}
              <button
                onClick={handleBack}
                className="pointer-events-auto group relative w-14 h-14 rounded-2xl bg-gradient-to-br from-white via-gray-50 to-gray-100 
                          shadow-[0_8px_16px_rgba(0,0,0,0.15),0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(0,0,0,0.05)]
                          hover:shadow-[0_12px_24px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(0,0,0,0.08)]
                          active:shadow-[0_4px_8px_rgba(0,0,0,0.15),0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(0,0,0,0.1)]
                          border border-gray-200/50
                          transition-all duration-200 hover:scale-105 active:scale-95 hover:-translate-y-0.5"
                title="返回首页"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-transparent via-transparent to-black/5"></div>
                <Home 
                  size={28} 
                  className="absolute inset-0 m-auto text-gray-700 group-hover:text-primary-600 transition-colors duration-200"
                  strokeWidth={2}
                  style={{
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
                  }}
                />
              </button>

              {/* 右侧：音效和设置按钮 */}
              <div className="flex gap-3">
                {/* 音效按钮 */}
                <button
                  onClick={handleSoundToggle}
                  className="pointer-events-auto group relative w-14 h-14 rounded-2xl bg-gradient-to-br from-white via-gray-50 to-gray-100 
                            shadow-[0_8px_16px_rgba(0,0,0,0.15),0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(0,0,0,0.05)]
                            hover:shadow-[0_12px_24px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(0,0,0,0.08)]
                            active:shadow-[0_4px_8px_rgba(0,0,0,0.15),0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(0,0,0,0.1)]
                            border border-gray-200/50
                            transition-all duration-200 hover:scale-105 active:scale-95 hover:-translate-y-0.5"
                  title={isMuted ? "开启音效" : "静音"}
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-transparent via-transparent to-black/5"></div>
                  {isMuted ? (
                    <VolumeX 
                      size={28} 
                      className="absolute inset-0 m-auto text-gray-400 transition-colors duration-200"
                      strokeWidth={2}
                      style={{
                        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
                      }}
                    />
                  ) : (
                    <Volume2 
                      size={28} 
                      className="absolute inset-0 m-auto text-primary-500 group-hover:text-primary-600 transition-colors duration-200"
                      strokeWidth={2}
                      style={{
                        filter: 'drop-shadow(0 1px 1px rgba(59,130,246,0.3)) drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                      }}
                    />
                  )}
                </button>

                {/* 设置按钮 */}
                <button
                  onClick={handleOpenSettings}
                  className="pointer-events-auto group relative w-14 h-14 rounded-2xl bg-gradient-to-br from-white via-gray-50 to-gray-100 
                            shadow-[0_8px_16px_rgba(0,0,0,0.15),0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(0,0,0,0.05)]
                            hover:shadow-[0_12px_24px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(0,0,0,0.08)]
                            active:shadow-[0_4px_8px_rgba(0,0,0,0.15),0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(0,0,0,0.1)]
                            border border-gray-200/50
                            transition-all duration-200 hover:scale-105 active:scale-95 hover:-translate-y-0.5"
                  title="游戏设置"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-transparent via-transparent to-black/5"></div>
                  <Settings2 
                    size={28} 
                    className="absolute inset-0 m-auto text-gray-700 group-hover:text-primary-600 group-hover:rotate-90 transition-all duration-300"
                    strokeWidth={2}
                    style={{
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
                    }}
                  />
                </button>
              </div>
            </div>

            {/* 游戏控制内容区域 */}
            <div className="h-[120px] flex items-center justify-center">
            {/* idle 阶段 - 开始游戏按钮 */}
            {gamePhase === 'idle' && (
              <Button
                onClick={startGame}
                variant="primary"
                size="large"
                className="text-xl px-12 py-4 shadow-lg"
              >
                开始游戏
              </Button>
            )}

            {/* observation 阶段 - 观察控制 */}
            {gamePhase === 'observation' && (
              <div className="flex justify-center">
                {gameMode === 'casual' ? (
                  <Button
                    onClick={handleObservationComplete}
                    variant="primary"
                    size="large"
                    className="text-lg px-10 py-3 shadow-lg"
                  >
                    观察好了
                  </Button>
                ) : (
                  <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full px-10 py-4 shadow-xl">
                    <span className="text-3xl font-black">
                      {observationTimeLeft}秒
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* answer 阶段 - 答题选项 */}
            {gamePhase === 'answer' && (
              <div className="w-full">
                {gameMode === 'casual' ? (
                  // 休闲模式 - 显示答案按钮
                  <div className="flex justify-center">
                    <Button
                      onClick={handleShowAnswer}
                      variant="primary"
                      size="large"
                      className="text-lg px-10 py-3 shadow-lg"
                    >
                      显示答案
                    </Button>
                  </div>
                ) : (
                  // 挑战模式 - 选项和提交按钮在一排
                  <div className="space-y-2">
                    <p className="text-center text-sm text-gray-600 font-medium">
                      {config.hiddenCount === 1 ? '选择消失的词语' : `选择${config.hiddenCount}个消失的词语`}
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      {answerOptions.map((word) => {
                        const isSelected = selectedAnswers.includes(word.id);
                        return (
                          <button
                            key={word.id}
                            onClick={() => handleAnswerSelect(word.id)}
                            className={cn(
                              'inline-flex items-center justify-center',
                              'min-w-[100px] h-[60px]',
                              'px-6 py-3',
                              'border-3',
                              'rounded-xl',
                              'font-bold text-lg',
                              'transition-all duration-200',
                              'focus:outline-none',
                              'active:scale-95',
                              'shadow-md hover:shadow-lg',
                              word.language === 'chinese' ? 'font-kaiti' : 'font-fredoka',
                              isSelected
                                ? 'bg-gradient-to-br from-orange-400 to-red-400 text-white border-orange-500 scale-105'
                                : 'bg-white text-gray-800 border-gray-200 hover:border-orange-400 hover:scale-105 hover:bg-orange-50'
                            )}
                          >
                            {word.text}
                          </button>
                        );
                      })}
                      
                      <div className="h-12 w-px bg-gray-300 mx-2"></div>
                      
                      <Button
                        onClick={handleSubmitAnswer}
                        variant="primary"
                        size="large"
                        disabled={selectedAnswers.length !== config.hiddenCount}
                        className="text-lg px-8 py-3 shadow-lg h-[60px]"
                      >
                        提交答案
                        {config.hiddenCount > 1 && (
                          <span className="ml-2 text-sm opacity-90">
                            ({selectedAnswers.length}/{config.hiddenCount})
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* result 阶段 - 结果显示 */}
            {gamePhase === 'result' && (
              <div className="w-full">
                {gameMode === 'casual' ? (
                  // 休闲模式 - 显示答案（绿色标记）+ "再玩一次"按钮
                  <div className="flex items-center justify-center gap-3">
                    {hiddenWords.map((word) => (
                      <button
                        key={word.id}
                        disabled
                        className={cn(
                          'inline-flex items-center justify-center gap-2',
                          'min-w-[100px] h-[60px]',
                          'px-6 py-3',
                          'border-4',
                          'rounded-xl',
                          'font-bold text-lg',
                          'cursor-default',
                          'transition-all duration-300',
                          'shadow-xl',
                          word.language === 'chinese' ? 'font-kaiti' : 'font-fredoka',
                          'bg-gradient-to-br from-green-400 to-green-600 text-white border-green-500 animate-bounce-in'
                        )}
                      >
                        <span
                          className="flex items-center gap-2 drop-shadow-sm"
                          style={{
                            textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                          }}
                        >
                          {word.text}
                          <CheckCircle size={24} className="animate-bounce" />
                        </span>
                      </button>
                    ))}
                    
                    <div className="h-12 w-px bg-gray-300 mx-2"></div>
                    
                    <Button
                      onClick={resetGame}
                      variant="primary"
                      size="large"
                      className="text-xl px-12 py-4 shadow-lg"
                    >
                      再玩一次
                    </Button>
                  </div>
                ) : (
                  // 挑战模式 - 显示带颜色标记和动效的选项 + "再玩一次"按钮
                  <div className="flex items-center justify-center gap-3">
                    {answerOptions.map((word) => {
                      const isSelected = selectedAnswers.includes(word.id);
                      const isCorrectAnswer = hiddenWords.some(hw => hw.id === word.id);
                      
                      let stateClasses = '';
                      let icon = null;
                      
                      if (isCorrectAnswer && isSelected) {
                        stateClasses = 'bg-gradient-to-br from-green-400 to-green-600 text-white border-green-500 animate-bounce-in shadow-xl';
                        icon = <CheckCircle size={24} className="animate-bounce" />;
                      } else if (isCorrectAnswer && !isSelected) {
                        stateClasses = 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white border-yellow-500 animate-pulse shadow-xl';
                        icon = <AlertCircle size={24} className="animate-bounce" />;
                      } else if (!isCorrectAnswer && isSelected) {
                        stateClasses = 'bg-gradient-to-br from-red-400 to-red-600 text-white border-red-500 animate-shake shadow-xl';
                        icon = <XCircle size={24} className="animate-pulse" />;
                      } else {
                        stateClasses = 'bg-gray-100 border-gray-300 text-gray-600 opacity-50';
                      }
                      
                      return (
                        <button
                          key={word.id}
                          disabled
                          className={cn(
                            'inline-flex items-center justify-center gap-2',
                            'min-w-[100px] h-[60px]',
                            'px-6 py-3',
                            'border-4',
                            'rounded-xl',
                            'font-bold text-lg',
                            'cursor-default',
                            'transition-all duration-300',
                            word.language === 'chinese' ? 'font-kaiti' : 'font-fredoka',
                            stateClasses
                          )}
                        >
                          <span
                            className={cn(
                              "flex items-center gap-2",
                              (isCorrectAnswer || isSelected) && "drop-shadow-sm"
                            )}
                            style={(isCorrectAnswer || isSelected) ? {
                              textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                            } : {}}
                          >
                            {word.text}
                            {icon}
                          </span>
                        </button>
                      );
                    })}
                    
                    <div className="h-12 w-px bg-gray-300 mx-2"></div>
                    
                    <Button
                      onClick={resetGame}
                      variant="secondary"
                      size="large"
                      className="text-lg px-8 py-3 shadow-lg h-[60px]"
                    >
                      再玩一次
                    </Button>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 全屏游戏容器 - 强制覆盖 Header */}
      <div className="fixed inset-0 z-[100] bg-cream-50 flex flex-col">
        {/* 配置弹窗 */}
        <GameConfigModal
          isOpen={showConfigModal}
          currentConfig={config}
          onClose={handleCloseSettings}
          onSave={handleConfigSave}
        />

        {/* 配置变更确认对话框 */}
        {showConfirmDialog && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={handleCancelConfigChange}
            data-testid="confirm-dialog-overlay"
          >
            <div 
              className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full mx-4 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
              data-testid="confirm-dialog"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-4">确认修改配置</h2>
              <p className="text-body text-gray-600 mb-6">
                修改配置将重新开始游戏，当前进度将丢失。确定要继续吗？
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleCancelConfigChange}
                  variant="secondary"
                  className="flex-1"
                >
                  取消
                </Button>
                <Button
                  onClick={handleConfirmConfigChange}
                  variant="primary"
                  className="flex-1"
                >
                  确定
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 游戏内容区域 */}
        {renderGameContent()}
      </div>
    </>
  );
};

MissingWordsGamePage.displayName = 'MissingWordsGamePage';
