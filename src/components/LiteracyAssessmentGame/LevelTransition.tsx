/**
 * LevelTransition Component
 * 等级过渡组件 - 显示通关庆祝动画和等级信息
 */

import React, { useEffect, useState } from 'react';
import { Trophy, Star, Sparkles } from 'lucide-react';
import { StarExplosion } from '../StarExplosion';
import { useAppStore } from '../../stores/appStore';
import type { LevelTransitionProps } from './types';

export const LevelTransition: React.FC<LevelTransitionProps> = ({
  levelInfo,
  onComplete,
}) => {
  const { playSound } = useAppStore();
  const [showExplosion, setShowExplosion] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 播放成功音效
    playSound('success');

    // 显示星星爆炸动画
    setShowExplosion(true);
    setTimeout(() => setShowExplosion(false), 1000);

    // 进度条动画
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    // 自动过渡到下一阶段（3秒后）
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [levelInfo, onComplete, playSound]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500 flex items-center justify-center p-4 relative overflow-hidden">
      {/* 星星爆炸动画 */}
      <StarExplosion isVisible={showExplosion} />

      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 浮动的星星 */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            <Star
              className="text-white/30"
              size={12 + Math.random() * 12}
              fill="currentColor"
            />
          </div>
        ))}
      </div>

      {/* 主内容卡片 */}
      <div className="relative z-10 max-w-2xl w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center animate-scale-in">
          {/* 奖杯图标 */}
          <div className="mb-6 animate-bounce-slow">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg">
              <Trophy className="w-14 h-14 text-white" />
            </div>
          </div>

          {/* 恭喜标题 */}
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600 mb-4">
            🎉 恭喜通关！
          </h1>

          {/* 等级标题 */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
              <span className="text-2xl font-bold text-white">
                {levelInfo.title}
              </span>
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* 通关消息 */}
          <p className="text-xl md:text-2xl text-gray-700 font-semibold mb-6">
            {levelInfo.pass_message}
          </p>

          {/* 词汇量里程碑 */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 px-8 py-4 bg-blue-50 rounded-2xl border-2 border-blue-200">
              <Star className="w-8 h-8 text-yellow-500" fill="currentColor" />
              <div className="text-left">
                <p className="text-sm text-gray-600">识字量达到</p>
                <p className="text-3xl font-bold text-blue-600">
                  {levelInfo.vocab_milestone} 字
                </p>
              </div>
            </div>
          </div>

          {/* 进度条 */}
          <div className="mb-6">
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              准备下一关中...
            </p>
          </div>
        </div>
      </div>

      {/* CSS动画定义 */}
      <style>{`
        @keyframes scale-in {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.6;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
