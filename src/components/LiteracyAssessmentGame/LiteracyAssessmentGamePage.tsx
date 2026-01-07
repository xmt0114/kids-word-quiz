/**
 * LiteracyAssessmentGamePage Component
 * 儿童识字量测试游戏主页面
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { useLiteracyAssessmentGame } from './useLiteracyAssessmentGame';
import { AgeSelector } from './AgeSelector';
import { QuestionDisplay } from './QuestionDisplay';
import { LevelTransition } from './LevelTransition';
import { ResultDisplay } from './ResultDisplay';

export const LiteracyAssessmentGamePage: React.FC = () => {
  const navigate = useNavigate();
  const { isMuted, toggleMute, playSound } = useAppStore();

  const {
    gameState,
    startAssessment,
    submitAnswer,
    nextQuestion,
    completeLevelTransition,
    restartAssessment,
    getCurrentOptions,
  } = useLiteracyAssessmentGame();

  // 播放音效
  useEffect(() => {
    if (gameState.showFeedback && gameState.isCorrect !== null) {
      playSound(gameState.isCorrect ? 'correct' : 'wrong');
    }
  }, [gameState.showFeedback, gameState.isCorrect, playSound]);

  // 自动进入下一题（显示反馈后1.5秒）
  useEffect(() => {
    if (gameState.showFeedback) {
      const timer = setTimeout(() => {
        nextQuestion();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [gameState.showFeedback, nextQuestion]);

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

  // 处理答案提交
  const handleAnswer = (answer: string) => {
    submitAnswer(answer);
  };

  // 处理下一题
  const handleNextQuestion = () => {
    playSound('click');
    nextQuestion();
  };

  // 渲染顶部导航栏
  const renderNavBar = () => {
    // 不显示导航栏
    return null;
  };

  // 渲染加载状态
  const renderLoading = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-2xl font-bold text-white">加载中...</p>
      </div>
    </div>
  );

  // 渲染错误状态
  const renderError = () => (
    <div className="min-h-screen bg-gradient-to-br from-red-400 via-orange-400 to-yellow-400 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          出错了
        </h2>
        <p className="text-gray-600 mb-6">
          {gameState.error}
        </p>
        <div className="flex gap-4">
          <button
            onClick={restartAssessment}
            className="flex-1 px-6 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all"
          >
            重新开始
          </button>
          <button
            onClick={handleBack}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all"
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );

  // 渲染主内容
  const renderContent = () => {
    // 加载状态
    if (gameState.isLoading && gameState.phase !== 'age-selection') {
      return renderLoading();
    }

    // 错误状态
    if (gameState.error && gameState.phase !== 'age-selection') {
      return renderError();
    }

    // 根据游戏阶段渲染不同组件
    switch (gameState.phase) {
      case 'age-selection':
        return (
          <AgeSelector
            onStartAssessment={startAssessment}
            isLoading={gameState.isLoading}
            error={gameState.error}
          />
        );

      case 'assessment':
        if (!gameState.currentQuestion) {
          return renderLoading();
        }

        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 py-8 px-4">
            <div className="max-w-5xl mx-auto">
              {/* 题目展示 */}
              <QuestionDisplay
                question={gameState.currentQuestion}
                options={getCurrentOptions()}
                onAnswer={handleAnswer}
                showFeedback={gameState.showFeedback}
                isCorrect={gameState.isCorrect ?? undefined}
                disabled={gameState.showFeedback}
              />
            </div>
          </div>
        );

      case 'level-transition':
        if (!gameState.session) {
          return renderLoading();
        }

        const currentPacket = gameState.session.packets[gameState.session.currentPacketIndex];
        if (!currentPacket) {
          return renderLoading();
        }

        return (
          <LevelTransition
            levelInfo={currentPacket.level_info}
            onComplete={completeLevelTransition}
          />
        );

      case 'result':
        if (!gameState.report) {
          return renderLoading();
        }

        return (
          <ResultDisplay
            report={gameState.report}
            onRestart={restartAssessment}
          />
        );

      default:
        return renderLoading();
    }
  };

  return (
    <>
      {renderNavBar()}
      {renderContent()}
    </>
  );
};
