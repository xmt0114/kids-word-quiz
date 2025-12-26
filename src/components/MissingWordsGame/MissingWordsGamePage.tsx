/**
 * Missing Words Game Page
 * "哪个词语不见了？"游戏主页面
 */

import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Home,
  Volume2,
  VolumeX,
  Settings2,
  AlarmClock,
  Zap,
  ChevronDown
} from 'lucide-react';
import { useMissingWordsGame } from '../../hooks/useMissingWordsGame';
import { useMissingWordsGameAudio } from '../../hooks/useMissingWordsGameAudio';
import { GameStage } from './GameStage';
import { GameConfigModal } from './GameConfigModal';
import { Button } from '../Button';
import { cn } from '../../lib/utils';
import { useAppStore } from '../../stores/appStore';
import type { GameConfig, CategoryOption } from '../../types/missingWordsGame';
import { ConfirmDialog } from '../ConfirmDialog';

export const MissingWordsGamePage: React.FC = () => {
  const navigate = useNavigate();
  const stageRef = useRef<HTMLDivElement>(null);

  const { isMuted, toggleMute, playSound } = useAppStore();
  const audio = useMissingWordsGameAudio();

  const {
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
    gamePhase,
    gameMode,
    config,
    currentWords,
    hiddenWords,
    wordPositions,
    answerOptions,
    selectedCategoryId,
    setSelectedCategoryId,
    availableCategories,
    setAvailableCategories,
    loadError,
    isLoadingWords,
  } = useMissingWordsGame();

  const { games, session, openLoginModal, playSound: appPlaySound } = useAppStore();
  const [showMembershipAlert, setShowMembershipAlert] = useState(false);
  const [showLoginAlert, setShowLoginAlert] = useState(false);

  const [showConfigModal, setShowConfigModal] = useState(false);

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
    setShowConfigModal(true);
  };

  // 关闭设置模态框
  const handleCloseSettings = () => {
    setShowConfigModal(false);
  };

  // 处理配置保存
  const handleConfigSave = (newConfig: GameConfig) => {
    updateConfig(newConfig);
    setShowConfigModal(false);
  };

  // 初始化分类
  React.useEffect(() => {
    const game = games.find(g => g.type === 'observe') as any;
    if (game?.default_config?.game_info) {
      const apiCategories = game.default_config.game_info.map((info: any) => ({
        id: `api_${info.type}`,
        name: info.type,
        collections: info.collections,
        requireMembership: true // 默认非本地汉字都需要会员
      }));
      setAvailableCategories([
        { id: 'local_chinese', name: '汉字', requireMembership: false },
        ...apiCategories
      ]);
    }
  }, [games, setAvailableCategories]);

  // 处理错误提示
  React.useEffect(() => {
    if (loadError === 'MEMBERSHIP_EXPIRED') {
      setShowMembershipAlert(true);
    } else if (loadError === 'Unauthorized' || loadError?.includes('JWT') || loadError === 'UNAUTHORIZED' || loadError === 'FETCH_FAILED') {
      setShowLoginAlert(true);
    }
  }, [loadError]);

  // 处理倒计时音效和特效
  React.useEffect(() => {
    if (gamePhase === 'observation' && gameMode === 'challenge' && observationTimeLeft <= 3 && observationTimeLeft > 0) {
      audio.playCountdown();
    }
  }, [observationTimeLeft, gamePhase, gameMode, audio]);

  // 开始游戏并传递舞台尺寸
  const handleStartGame = () => {
    // 权限检查：如果选择的是非本地汉字分类（即API分类），且用户未登录
    if (selectedCategoryId !== 'local_chinese' && !session) {
      playSound('wrong');
      setShowLoginAlert(true);
      return;
    }

    let dimensions = undefined;
    if (stageRef.current) {
      dimensions = {
        width: stageRef.current.clientWidth,
        height: stageRef.current.clientHeight,
      };
    }
    startGame(dimensions);
  };

  // 渲染游戏主舞台区域
  const renderGameStage = () => {
    switch (gamePhase) {
      case 'idle':
        return (
          <div className="text-center space-y-12 max-w-4xl mx-auto p-4 md:p-10">
            <div className="space-y-4">
              <h1 className="text-5xl font-black bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent animate-fade-in pb-2 font-kuaile">
                哪个词语不见了？
              </h1>
              <p className="text-xl text-gray-400 font-medium">
                考验眼力和记忆力的小游戏
              </p>
            </div>

            {/* 模式选择区域 - Grid 布局 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl mx-auto">
              <button
                onClick={() => {
                  updateConfig({ gameMode: 'casual' });
                  playSound('click');
                }}
                className={cn(
                  'group relative flex flex-col items-center justify-center p-8 rounded-[2.5rem] border-4 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl overflow-hidden font-kuaile',
                  config.gameMode === 'casual'
                    ? 'bg-blue-100 border-blue-400 shadow-xl scale-105'
                    : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-300 shadow-sm'
                )}
              >
                <span className="text-7xl mb-6 transform group-hover:scale-110 transition-transform duration-500">☁️</span>
                <span className={cn(
                  "text-3xl font-black mb-2 transition-colors",
                  config.gameMode === 'casual' ? "text-blue-900" : "text-blue-700"
                )}>休闲模式</span>
                <span className="text-sm opacity-80 font-medium italic">不限时间 · 适合练习</span>
              </button>

              <button
                onClick={() => {
                  updateConfig({ gameMode: 'challenge' });
                  playSound('click');
                }}
                className={cn(
                  'group relative flex flex-col items-center justify-center p-8 rounded-[2.5rem] border-4 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl overflow-hidden font-kuaile',
                  config.gameMode === 'challenge'
                    ? 'bg-orange-100 border-orange-400 shadow-xl scale-105'
                    : 'bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100 hover:border-orange-300 shadow-sm'
                )}
              >
                <span className="text-7xl mb-6 transform group-hover:scale-110 transition-transform duration-500">⚡️</span>
                <span className={cn(
                  "text-3xl font-black mb-2 transition-colors",
                  config.gameMode === 'challenge' ? "text-orange-900" : "text-orange-700"
                )}>挑战模式</span>
                <span className="text-sm opacity-80 font-medium italic">限时观察 · 自动消失</span>
              </button>
            </div>

            <div className="space-y-8 w-full max-w-md mx-auto pt-4">
              {/* 选择题库 */}
              <div className="relative group">
                <div className="w-full bg-white border-4 border-gray-100 rounded-[1.5rem] py-5 px-8 text-2xl font-black text-gray-700 
                             shadow-sm flex items-center justify-center gap-3 font-kuaile group-hover:border-gray-200 transition-all duration-300">
                  <ChevronDown size={32} className="text-gray-400 group-hover:text-primary-500 transition-colors" />
                  <span>{availableCategories.find(c => c.id === selectedCategoryId)?.name || '选择题库'}</span>
                </div>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => {
                    setSelectedCategoryId(e.target.value);
                    playSound('click');
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none z-10 font-kuaile text-2xl"
                >
                  {availableCategories.map(cat => (
                    <option key={cat.id} value={cat.id} className="text-center py-2 font-kuaile font-black text-2xl">
                      {cat.name} {cat.requireMembership ? '💎' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 详细设置按钮 - 移到下方并使用中性风格 */}
              <div className="flex flex-col gap-4">
                <Button
                  onClick={handleOpenSettings}
                  variant="secondary"
                  size="large"
                  className="w-full text-2xl font-black py-7 rounded-[1.5rem] shadow-md border-4 border-gray-100 text-gray-500 hover:bg-white hover:text-gray-800 hover:border-primary-200 transition-all bg-white font-kuaile"
                >
                  <Settings2 className="mr-3" />
                  详细设置
                </Button>

                {selectedCategoryId !== 'local_chinese' && (
                  <p className="text-base text-primary-500 font-bold flex items-center justify-center gap-2 animate-pulse font-kuaile">
                    <Zap size={18} className="fill-current" />
                    需活跃会员即可解锁全部分类
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 'result':
        return (
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
        );

      default:
        return (
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
        );
    }
  };

  // 渲染底部控制栏
  const renderControls = () => {
    switch (gamePhase) {
      case 'idle':
        return (
          <Button
            onClick={handleStartGame}
            variant="primary"
            size="large"
            className="text-2xl px-16 py-5 rounded-2xl shadow-xl hover:scale-105 transition-all duration-200 relative overflow-hidden group"
            disabled={isLoadingWords}
          >
            <span className={cn("flex items-center gap-3", isLoadingWords && "opacity-0")}>
              {isLoadingWords ? '加载中...' : '开始游戏'}
            </span>
            {isLoadingWords && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
            )}
          </Button>
        );

      case 'observation':
        return (
          <div className="flex justify-center">
            {gameMode === 'casual' ? (
              <Button
                onClick={handleObservationComplete}
                variant="primary"
                size="large"
                className="text-2xl px-16 py-5 rounded-2xl shadow-xl hover:scale-105 transition-all duration-200"
              >
                观察好了
              </Button>
            ) : (
              <div className={cn(
                "bg-gradient-to-r text-white rounded-full px-10 py-4 shadow-xl flex items-center gap-4 transition-all duration-300 relative",
                observationTimeLeft <= 3
                  ? "from-red-500 to-orange-500 scale-110 animate-shake shadow-red-200/50"
                  : "from-primary-500 to-secondary-500"
              )}>
                <style>{`
                  @keyframes shake {
                    0%, 100% { transform: translate(0, 0); }
                    25% { transform: translate(-2px, 1px) rotate(-1deg); }
                    75% { transform: translate(2px, -1px) rotate(1deg); }
                  }
                  .animate-shake {
                    animation: shake 0.1s infinite;
                  }
                `}</style>
                <AlarmClock className={cn(
                  "w-8 h-8",
                  observationTimeLeft <= 3 && "animate-bounce"
                )} />
                <span className={cn(
                  "text-3xl font-black tabular-nums",
                  observationTimeLeft <= 3 && "text-4xl animate-bounce"
                )}>
                  {observationTimeLeft}秒
                </span>
              </div>
            )}
          </div>
        );

      case 'answer':
        return (
          <div className="w-full">
            {gameMode === 'casual' ? (
              <div className="flex justify-center">
                <Button
                  onClick={handleShowAnswer}
                  variant="primary"
                  size="large"
                  className="text-2xl px-16 py-5 rounded-2xl shadow-xl hover:scale-105 transition-all duration-200"
                >
                  显示答案
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                {answerOptions.map((word) => (
                  <button
                    key={word.id}
                    onClick={() => handleAnswerSelect(word.id)}
                    className={cn(
                      'inline-flex items-center justify-center min-w-[120px] h-[64px] px-8 py-3 border-2 rounded-2xl font-bold text-xl transition-all duration-200 active:scale-95 shadow-xl',
                      word.language === 'chinese' ? 'font-kaiti' : 'font-fredoka',
                      selectedAnswers.includes(word.id)
                        ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white border-orange-100 scale-105 shadow-orange-200/50'
                        : 'bg-white text-gray-800 border-gray-100 hover:border-orange-300 hover:scale-105 hover:bg-orange-50'
                    )}
                  >
                    {word.text}
                  </button>
                ))}

                <div className="h-12 w-px bg-gray-300 mx-2"></div>

                <Button
                  onClick={handleSubmitAnswer}
                  variant="primary"
                  size="large"
                  disabled={selectedAnswers.length !== config.hiddenCount}
                  className="text-2xl px-16 py-5 rounded-2xl shadow-xl hover:scale-105 transition-all duration-200"
                >
                  提交答案
                  {config.hiddenCount > 1 && (
                    <span className="ml-2 text-sm opacity-90">({selectedAnswers.length}/{config.hiddenCount})</span>
                  )}
                </Button>
              </div>
            )}
          </div>
        );

      case 'result':
        return (
          <div className="flex items-center justify-center gap-3">
            {gameMode === 'casual' ? (
              hiddenWords.map(word => (
                <div key={word.id} className={cn(
                  'inline-flex items-center justify-center gap-2 min-w-[120px] h-[64px] px-8 py-3 border-2 rounded-2xl font-bold text-xl transition-all duration-300 shadow-xl bg-gradient-to-br from-green-400 to-green-600 text-white border-green-100 animate-bounce-in',
                  word.language === 'chinese' ? 'font-kaiti' : 'font-fredoka'
                )}>
                  <span className="flex items-center gap-2 drop-shadow-sm" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                    {word.text} <CheckCircle size={24} className="animate-bounce" />
                  </span>
                </div>
              ))
            ) : (
              answerOptions.map(word => {
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
                  <div key={word.id} className={cn(
                    'inline-flex items-center justify-center gap-2 min-w-[120px] h-[64px] px-8 py-3 border-2 rounded-2xl font-bold text-xl transition-all duration-300',
                    word.language === 'chinese' ? 'font-kaiti' : 'font-fredoka',
                    stateClasses
                  )}>
                    <span className={cn("flex items-center gap-2", (isCorrectAnswer || isSelected) && "drop-shadow-sm")}
                      style={(isCorrectAnswer || isSelected) ? { textShadow: '1px 1px 2px rgba(0,0,0,0.3)' } : {}}>
                      {word.text} {icon}
                    </span>
                  </div>
                );
              })
            )}

            <div className="h-12 w-px bg-gray-300 mx-2"></div>

            <Button
              onClick={resetGame}
              variant="primary"
              size="large"
              className="text-2xl px-16 py-5 rounded-2xl shadow-xl hover:scale-105 transition-all duration-200"
            >
              再玩一次
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-cream-50 flex flex-col">
      <div className="w-full h-full flex items-center justify-center p-3">
        {/* 统一的游戏容器 */}
        <div className="w-full max-w-[1400px] h-full flex flex-col bg-white rounded-[2.5rem] border-4 border-purple-200 shadow-2xl overflow-hidden">
          {/* 上部分：游戏舞台 */}
          <div className="relative flex-1 bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 overflow-hidden">
            <div ref={stageRef} className="w-full h-full flex items-center justify-center p-4">
              {renderGameStage()}
            </div>
          </div>

          {/* 分隔线 */}
          <div className="h-px bg-purple-200"></div>

          {/* 下部分：控制栏 */}
          <div className="relative bg-white px-6 py-6 pb-8">
            {/* 顶层功能按钮 */}
            <div className="absolute -top-7 left-0 right-0 px-8 flex justify-between items-start pointer-events-none">
              <button
                onClick={handleBack}
                className="pointer-events-auto group w-14 h-14 rounded-2xl bg-white shadow-lg border border-gray-100 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                title="返回首页"
              >
                <Home size={28} className="text-gray-700 group-hover:text-primary-600 transition-colors" />
              </button>

              <button
                onClick={handleSoundToggle}
                className="pointer-events-auto group w-14 h-14 rounded-2xl bg-white shadow-lg border border-gray-100 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                title={isMuted ? "开启音效" : "静音"}
              >
                {isMuted ? (
                  <VolumeX size={28} className="text-gray-400" />
                ) : (
                  <Volume2 size={28} className="text-primary-500 group-hover:text-primary-600" />
                )}
              </button>
            </div>

            {/* 状态控制区域 */}
            <div className="h-[100px] flex items-center justify-center">
              {renderControls()}
            </div>
          </div>
        </div>
      </div>

      <GameConfigModal
        isOpen={showConfigModal}
        currentConfig={config}
        onClose={handleCloseSettings}
        onSave={handleConfigSave}
      />

      {/* 会员到期提醒 */}
      <ConfirmDialog
        isOpen={showMembershipAlert}
        title="会员权益已到期"
        message="您选择的是会员专属分类。您的会员权益已到期，请续费后继续畅玩所有精选词库内容。"
        confirmText="去续费"
        cancelText="先玩汉字模式"
        variant="warning"
        onConfirm={() => {
          setShowMembershipAlert(false);
          playSound('click');
          navigate('/');
        }}
        onCancel={() => {
          setShowMembershipAlert(false);
          setSelectedCategoryId('local_chinese');
        }}
      />

      {/* 登录提醒 */}
      <ConfirmDialog
        isOpen={showLoginAlert}
        title="请先登录"
        message="您选择的是进阶分类，需要登录账号并拥有活跃会员身份才能访问。现在登录即可同步学习进度！"
        confirmText="立即登录"
        cancelText="先玩汉字模式"
        variant="info"
        onConfirm={() => {
          setShowLoginAlert(false);
          playSound('click');
          // 先跳转回首页，确保全局登录框不会被当前固定定位的游戏页面覆盖
          navigate('/');
          // 等待微小延迟或直接触发，因为 navigate 是异步生效的
          setTimeout(() => {
            openLoginModal('选择词库');
          }, 100);
        }}
        onCancel={() => {
          setShowLoginAlert(false);
          setSelectedCategoryId('local_chinese');
        }}
      />
    </div>
  );
};

MissingWordsGamePage.displayName = 'MissingWordsGamePage';
