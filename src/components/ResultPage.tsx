import React, { useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { QuizResult } from '../types';
import { Trophy, Star, RotateCcw, Home, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface ResultPageProps {
  result: QuizResult;
  onRestart: () => void;
  onBackToHome: () => void;
}

const ResultPage: React.FC<ResultPageProps> = ({
  result,
  onRestart,
  onBackToHome,
}) => {
  const { totalQuestions, correctAnswers, accuracy, wrongAnswers } = result;

  // 根据得分确定鼓励文案
  const getEncouragementMessage = () => {
    if (accuracy >= 90) {
      return {
        title: '太棒了！',
        message: '你是真正的单词小天才！',
        emoji: '🎉',
        color: 'text-success',
      };
    } else if (accuracy >= 70) {
      return {
        title: '很不错！',
        message: '继续努力，你会更棒！',
        emoji: '👏',
        color: 'text-primary-600',
      };
    } else if (accuracy >= 50) {
      return {
        title: '加油！',
        message: '多练习就会进步的！',
        emoji: '💪',
        color: 'text-warning',
      };
    } else {
      return {
        title: '不要灰心！',
        message: '学习需要时间，慢慢来！',
        emoji: '🌟',
        color: 'text-secondary-600',
      };
    }
  };

  const encouragement = getEncouragementMessage();

  // 生成星星评分
  const getStarRating = () => {
    if (accuracy >= 90) return 3;
    if (accuracy >= 70) return 2;
    if (accuracy >= 50) return 1;
    return 0;
  };

  const starRating = getStarRating();

  // 彩纸飘落动画
  useEffect(() => {
    if (accuracy >= 90) {
      // 为高分添加彩纸特效
      const createConfetti = () => {
        const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#51cf66'];
        const confetti = document.createElement('div');
        confetti.style.cssText = `
          position: fixed;
          top: -10px;
          left: ${Math.random() * 100}%;
          width: 10px;
          height: 16px;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          opacity: 0.8;
          z-index: 1000;
          transform: rotate(${Math.random() * 360}deg);
          animation: confetti-fall 3s linear forwards;
        `;
        document.body.appendChild(confetti);
        
        setTimeout(() => {
          document.body.removeChild(confetti);
        }, 3000);
      };

      // 创建多个彩纸片
      for (let i = 0; i < 15; i++) {
        setTimeout(createConfetti, i * 200);
      }
    }
  }, [accuracy]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 p-sm md:p-lg">
      <div className="max-w-4xl mx-auto">
        {/* 结果标题 */}
        <div className="text-center mb-xl">
          <div className="text-6xl mb-md animate-bounce-in">
            {encouragement.emoji}
          </div>
          <h1 className={cn('text-hero font-bold mb-md', encouragement.color)}>
            {encouragement.title}
          </h1>
          <p className="text-h2 text-text-secondary font-semibold">
            {encouragement.message}
          </p>
        </div>

        {/* 得分卡片 */}
        <Card className="mb-xl text-center relative overflow-hidden">
          {/* 背景装饰 */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500" />
          
          <div className="py-xl">
            {/* 星星评分 */}
            <div className="flex justify-center gap-sm mb-lg">
              {Array.from({ length: 3 }, (_, i) => (
                <Star
                  key={i}
                  size={48}
                  className={cn(
                    i < starRating 
                      ? 'text-accent-500 fill-current animate-pulse-gentle' 
                      : 'text-gray-300'
                  )}
                  style={{ 
                    animationDelay: `${i * 0.2}s` 
                  }}
                />
              ))}
            </div>

            {/* 得分显示 */}
            <div className="mb-lg">
              <div className="text-6xl font-bold text-primary-600 mb-sm">
                {correctAnswers}
                <span className="text-h2 text-text-secondary">/{totalQuestions}</span>
              </div>
              <div className="text-h1 font-bold text-text-primary">
                {accuracy}%
              </div>
            </div>

            {/* 统计信息 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-lg text-center">
              <div className="bg-success bg-opacity-10 rounded-lg p-md">
                <CheckCircle className="text-success mx-auto mb-sm" size={32} />
                <div className="text-h3 font-bold text-success">
                  答对 {correctAnswers} 题
                </div>
              </div>
              <div className="bg-error bg-opacity-10 rounded-lg p-md">
                <XCircle className="text-error mx-auto mb-sm" size={32} />
                <div className="text-h3 font-bold text-error">
                  答错 {totalQuestions - correctAnswers} 题
                </div>
              </div>
              <div className="bg-accent-500 bg-opacity-10 rounded-lg p-md">
                <Trophy className="text-accent-500 mx-auto mb-sm" size={32} />
                <div className="text-h3 font-bold text-accent-500">
                  正确率 {accuracy}%
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 错题回顾 */}
        {wrongAnswers && wrongAnswers.length > 0 && (
          <Card className="mb-xl">
            <h2 className="text-h2 font-bold text-text-primary mb-lg text-center">
              错题回顾
            </h2>
            <div className="space-y-md">
              {wrongAnswers.map((word, index) => (
                <div
                  key={word.id}
                  className="bg-background-primary rounded-lg p-md border-l-4 border-error"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-h3 font-bold text-text-primary mb-xs">
                        {word.word}
                      </h3>
                      <p className="text-body text-text-secondary">
                        {word.definition}
                      </p>
                    </div>
                    <XCircle className="text-error flex-shrink-0" size={24} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-lg justify-center">
          <Button
            size="large"
            onClick={onRestart}
            className="animate-bounce-in"
          >
            <div className="flex items-center gap-sm">
              <RotateCcw size={24} />
              再玩一次！
            </div>
          </Button>
          
          <Button
            variant="secondary"
            size="large"
            onClick={onBackToHome}
          >
            <div className="flex items-center gap-sm">
              <Home size={24} />
              选择新题型
            </div>
          </Button>
        </div>

        {/* 鼓励语句 */}
        <div className="text-center mt-xl">
          <p className="text-body text-text-secondary">
            {accuracy >= 90 
              ? '继续保持，你已经是单词小专家了！' 
              : '每一次练习都让你更接近成功！'
            }
          </p>
        </div>
      </div>

      {/* 彩纸动画样式通过CSS类定义 */}
    </div>
  );
};

export { ResultPage };