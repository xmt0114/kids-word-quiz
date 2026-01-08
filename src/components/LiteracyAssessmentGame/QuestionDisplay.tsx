/**
 * QuestionDisplay Component
 * 题目展示组件 - 显示汉字选择题并处理用户答案
 */

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Check, X } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import type { QuestionDisplayProps } from './types';

// 背景装饰组件
const BackgroundDecorations: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 大型S形水印 - 品牌感 */}
      <div
        className="absolute -right-20 -bottom-20 text-[400px] font-bold text-purple-500/[0.03] select-none"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        S
      </div>

      {/* 左上角云朵 */}
      <div className="absolute -left-10 -top-10 text-8xl text-purple-300/10 animate-float-slow">
        ☁
      </div>

      {/* 右上角云朵 */}
      <div className="absolute right-10 top-20 text-6xl text-pink-300/10 animate-float-slow" style={{ animationDelay: '1s' }}>
        ☁
      </div>

      {/* 左下角云朵 */}
      <div className="absolute left-20 bottom-10 text-7xl text-blue-300/10 animate-float-slow" style={{ animationDelay: '2s' }}>
        ☁
      </div>

      {/* 装饰性汉字 */}
      <div className="absolute left-5 top-1/3 text-4xl text-purple-400/5 rotate-12">字</div>
      <div className="absolute right-8 bottom-1/3 text-5xl text-pink-400/5 -rotate-12">读</div>

      {/* 小星星装饰 */}
      <div className="absolute left-1/4 top-10 text-2xl text-yellow-400/10 animate-twinkle">✨</div>
      <div className="absolute right-1/4 bottom-20 text-3xl text-yellow-400/10 animate-twinkle" style={{ animationDelay: '0.5s' }}>✨</div>
    </div>
  );
};

// 波纹效果组件
const RippleEffect: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <>
      <span className="absolute inset-0 rounded-full bg-white/30 animate-ripple-1"></span>
      <span className="absolute inset-0 rounded-full bg-white/20 animate-ripple-2"></span>
      <span className="absolute inset-0 rounded-full bg-white/10 animate-ripple-3"></span>
    </>
  );
};

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  options,
  onAnswer,
  showFeedback,
  isCorrect,
  disabled,
}) => {
  const { playSound } = useAppStore();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [displayOptions, setDisplayOptions] = useState<string[]>([]);
  const [showRipple, setShowRipple] = useState(true);
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    setDisplayOptions(options);
    setSelectedOption(null);
    hasPlayedRef.current = false;
    setShowRipple(true);
  }, [question.id]);

  useEffect(() => {
    if (question && !hasPlayedRef.current) {
      playTTS();
      hasPlayedRef.current = true;
    }
  }, [question]);

  useEffect(() => {
    if (showFeedback) {
      const timer = setTimeout(() => { }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showFeedback]);

  const playTTS = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(true);
      setShowRipple(false);

      const utterance = new SpeechSynthesisUtterance(question.audio_prompt_text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => {
        setIsPlaying(false);
        setTimeout(() => setShowRipple(true), 500);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        setTimeout(() => setShowRipple(true), 500);
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleOptionClick = (option: string) => {
    if (disabled || showFeedback) return;
    setSelectedOption(option);
    onAnswer(option);
    playSound('click');
  };

  const getOptionStyle = (option: string) => {
    const isSelected = selectedOption === option;

    if (showFeedback && isSelected) {
      if (isCorrect) {
        return 'bg-gradient-to-br from-green-400 to-green-600 text-white border-green-500 shadow-[0_8px_20px_rgba(34,197,94,0.4)] scale-105';
      } else {
        return 'bg-gradient-to-br from-red-400 to-red-600 text-white border-red-500 shadow-[0_8px_20px_rgba(239,68,68,0.4)] scale-105';
      }
    }

    if (showFeedback && option === question.character) {
      return 'bg-gradient-to-br from-green-400 to-green-600 text-white border-green-500 shadow-[0_8px_20px_rgba(34,197,94,0.4)]';
    }

    if (isSelected) {
      return 'bg-blue-50 border-blue-400 shadow-[0_8px_25px_rgba(59,130,246,0.3)] scale-105';
    }

    return 'bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.12)] hover:border-purple-300 hover:scale-[1.03]';
  };

  const getOptionIcon = (option: string) => {
    if (!showFeedback) return null;
    const isSelected = selectedOption === option;
    const isCorrectAnswer = option === question.character;

    if (isSelected && isCorrect) {
      return <Check className="w-8 h-8 text-white drop-shadow-md" />;
    }
    if (isSelected && !isCorrect) {
      return <X className="w-8 h-8 text-white drop-shadow-md" />;
    }
    if (isCorrectAnswer && !isSelected) {
      return <Check className="w-8 h-8 text-white drop-shadow-md" />;
    }
    return null;
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto p-6 min-h-[500px]">
      {/* 背景装饰 */}
      <BackgroundDecorations />

      {/* 题目提示区域 - 大型喇叭按钮 */}
      <div className="relative z-10 mb-10 text-center">
        <div className="inline-flex items-center justify-center">
          <button
            onClick={playTTS}
            disabled={isPlaying}
            title="点击喇叭听声音"
            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 transform ${isPlaying
                ? 'bg-gradient-to-br from-purple-500 to-purple-700 scale-95'
                : 'bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 hover:scale-110 active:scale-95'
              } shadow-[0_8px_30px_rgba(139,92,246,0.5)] border-4 border-white/50`}
          >
            {/* 波纹扩散效果 */}
            <RippleEffect isActive={showRipple && !isPlaying} />

            {/* 喇叭图标 */}
            <Volume2 className={`relative z-10 w-12 h-12 text-white drop-shadow-lg ${isPlaying ? 'animate-pulse' : ''}`} />
          </button>
        </div>

        {/* 提示文字 */}
        <p className="mt-3 text-sm text-purple-400/70 font-medium animate-pulse">
          👆 点击听声音
        </p>
      </div>

      {/* 选项网格 - 增强卡片样式 */}
      <div className="relative z-10 grid grid-cols-2 gap-12 max-w-md mx-auto">
        {displayOptions.map((option, index) => {
          const icon = getOptionIcon(option);

          return (
            <button
              key={`${option}-${index}`}
              onClick={() => handleOptionClick(option)}
              disabled={disabled || showFeedback}
              className={`
                relative aspect-square flex items-center justify-center rounded-2xl border-2 transition-all duration-300 transform
                ${getOptionStyle(option)}
                ${disabled || showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}
                focus:outline-none focus:ring-4 focus:ring-purple-300/50
              `}
            >
              {/* 田字格 - 内部红色细线 */}
              <div className="absolute inset-2 pointer-events-none">
                <div className="absolute inset-0 border border-red-300/25 rounded-sm"></div>
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-red-300/25"></div>
                <div className="absolute top-1/2 left-0 right-0 h-px bg-red-300/25"></div>
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <line x1="0" y1="0" x2="100%" y2="100%" stroke="rgb(252 165 165 / 0.15)" strokeWidth="1" />
                  <line x1="100%" y1="0" x2="0" y2="100%" stroke="rgb(252 165 165 / 0.15)" strokeWidth="1" />
                </svg>
              </div>

              {/* 汉字 */}
              <div
                className="text-8xl font-bold relative z-10 text-gray-800"
                style={{ fontFamily: 'KaiTi, STKaiti, "楷体", serif' }}
              >
                {option}
              </div>

              {/* 反馈图标 */}
              {icon && (
                <div className="absolute top-3 right-3 z-20 bg-white/20 rounded-full p-1">
                  {icon}
                </div>
              )}

              {/* 卡片光泽效果 */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
            </button>
          );
        })}
      </div>

      {/* CSS动画定义 */}
      <style>{`
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-15px) rotate(3deg);
          }
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: 0.1;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(1.2);
          }
        }

        @keyframes ripple-1 {
          0% {
            transform: scale(1);
            opacity: 0.4;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }

        @keyframes ripple-2 {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }

        @keyframes ripple-3 {
          0% {
            transform: scale(1);
            opacity: 0.2;
          }
          100% {
            transform: scale(2.6);
            opacity: 0;
          }
        }

        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }

        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }

        .animate-ripple-1 {
          animation: ripple-1 2s ease-out infinite;
        }

        .animate-ripple-2 {
          animation: ripple-2 2s ease-out infinite;
          animation-delay: 0.3s;
        }

        .animate-ripple-3 {
          animation: ripple-3 2s ease-out infinite;
          animation-delay: 0.6s;
        }
      `}</style>
    </div>
  );
};
