import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from './Card';
import { Button } from './Button';
import { AudioButton } from './AudioButton';
import { OptionButton } from './OptionButton';
import { Input } from './Input';
import { ProgressBar } from './ProgressBar';
import { StarExplosion } from './StarExplosion';
import { Word, QuizSettings } from '../types';
import { CheckCircle, XCircle, ArrowRight, ArrowLeft, Home } from 'lucide-react';
import { TextToSpeechButton } from './TextToSpeechButton';
import { cn } from '../lib/utils';
import { useQuiz } from '../hooks/useQuiz';
import { useQuizStats } from '../hooks/useLocalStorage';

const GuessWordGamePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { stats, updateStats } = useQuizStats();
  
  // 从路由状态获取设置
  const { settings, collectionId } = location.state || {};
  
  const {
    quizState,
    isLoading,
    error,
    retryCount,
    initializeQuiz,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    getCurrentQuestion,
    getResult,
    clearError,
    totalQuestions,
    restartQuiz,
  } = useQuiz();

  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [inputAnswer, setInputAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showStarExplosion, setShowStarExplosion] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const questionTextRef = useRef<HTMLParagraphElement>(null);

  // 初始化游戏
  useEffect(() => {
    // 如果有传递设置和教材ID，使用传递的配置
    if (settings && collectionId) {
      const finalSettings: QuizSettings = {
        ...settings,
        collectionId
      };
      
      initializeQuiz(finalSettings, collectionId).catch(err => {
        console.error('Failed to initialize quiz:', err);
      });
    } 
    // 如果没有传递设置，使用默认配置直接开始游戏
    else {
      const defaultSettings: QuizSettings = {
        questionType: 'text',
        answerType: 'choice',
        difficulty: 'easy',
        selectionStrategy: 'sequential'
      };
      
      initializeQuiz(defaultSettings).catch(err => {
        console.error('Failed to initialize quiz with default settings:', err);
      });
    }
  }, [settings, collectionId, initializeQuiz]);

  // 检测屏幕高度并动态调整布局
  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
    };

    // 初始检测
    updateViewportHeight();

    // 监听窗口大小变化
    window.addEventListener('resize', updateViewportHeight);
    
    return () => {
      window.removeEventListener('resize', updateViewportHeight);
    };
  }, []);

  // 根据屏幕高度计算动态间距
  const getDynamicSpacing = () => {
    // 默认大屏幕布局
    let spacing = {
      container: 'p-sm md:p-lg',
      navbar: 'mb-lg',
      content: 'mb-lg',
      cardPadding: 'p-xl md:p-2xl',
      questionArea: 'mb-lg',
      buttonArea: 'pt-lg'
    };
    
    let deviceType = '大屏幕 (≥800px)';
    
    // 小屏幕 (< 600px) 使用紧凑布局
    if (viewportHeight > 0 && viewportHeight < 600) {
      deviceType = '小屏幕 (<600px)';
      spacing = {
        container: 'p-xs',
        navbar: 'mb-xs',
        content: 'mb-xs',
        cardPadding: 'p-sm',
        questionArea: 'mb-xs',
        buttonArea: 'pt-xs'
      };
    }
    // 中等屏幕 (600px - 799px) 使用中等布局
    else if (viewportHeight >= 600 && viewportHeight < 800) {
      deviceType = '中等屏幕 (600px-799px)';
      spacing = {
        container: 'p-xs',
        navbar: 'mb-xs',
        content: 'mb-xs',
        cardPadding: 'p-md',
        questionArea: 'mb-xs',
        buttonArea: 'pt-xs'
      };
    }
    
    return { spacing, deviceType };
  };

  const { spacing, deviceType } = getDynamicSpacing();

  const currentWord = getCurrentQuestion();

  // 处理提交答案
  const handleSubmitAnswer = (answer: string) => {
    submitAnswer(answer);
    setShowResult(true);
    
    // 检查答案是否正确
    const correct = answer.toLowerCase().trim() === currentWord.answer.toLowerCase().trim();
    setIsCorrect(correct);
    
    if (correct) {
      setShowStarExplosion(true);
      setTimeout(() => setShowStarExplosion(false), 2000);
    }
  };

  // 处理下一题
  const handleNextQuestion = () => {
    if (quizState.currentQuestionIndex >= quizState.questions.length - 1) {
      // 所有题目完成，显示结果
      const result = getResult();
      updateStats(result.correctAnswers, result.totalQuestions);
      navigate('/guess-word/result', { 
        state: { result, settings, collectionId } 
      });
    } else {
      nextQuestion();
      setShowResult(false);
      setSelectedAnswer('');
      setInputAnswer('');
    }
  };

  // 处理上一题
  const handlePreviousQuestion = () => {
    previousQuestion();
    setShowResult(false);
    setSelectedAnswer('');
    setInputAnswer('');
  };

  // 处理返回首页
  const handleBackToHome = () => {
    navigate('/');
  };

  // 错误处理界面
  if (error) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center p-lg">
        <div className="bg-white rounded-lg p-xl shadow-card text-center max-w-md">
          <div className="text-6xl mb-md">😔</div>
          <h2 className="text-h2 font-bold text-error mb-md">
            哎呀，出现问题了
          </h2>
          <p className="text-body text-text-secondary mb-lg">
            {error}
          </p>
          
          {retryCount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-md mb-lg">
              <p className="text-small text-yellow-700">
                正在重试... (第 {retryCount} 次尝试)
              </p>
            </div>
          )}
          
          <div className="space-y-md">
            <button 
              className="w-full bg-primary-500 text-white px-lg py-md rounded-full font-bold hover:bg-primary-600 transition-colors"
              onClick={() => restartQuiz()}
            >
              重新开始
            </button>
            
            <button 
              className="w-full bg-gray-200 text-gray-700 px-lg py-md rounded-full font-bold hover:bg-gray-300 transition-colors"
              onClick={handleBackToHome}
            >
              返回首页
            </button>
          </div>
          
          <div className="mt-lg text-small text-text-tertiary">
            如果问题持续出现，请尝试刷新页面
          </div>
        </div>
      </div>
    );
  }

  // 加载状态
  if (!currentWord || isLoading) {
    return (
      <div className={`min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 ${spacing.container}`}>
        <div className="max-w-4xl mx-auto">
          {/* 导航栏 */}
          <div className={`flex items-center justify-between ${spacing.navbar}`}>
            <Button
              variant="secondary"
              onClick={handleBackToHome}
              className="flex items-center gap-sm"
            >
              <Home size={20} />
              返回首页
            </Button>
            <div className="text-center">
              <h1 className="text-h2 font-bold text-text-primary">猜单词</h1>
            </div>
            <div></div>
          </div>

          <div className="text-center py-2xl">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-md" />
            <p className="text-body text-text-secondary">
              {isLoading ? '正在加载题目...' : '准备中...'}
            </p>
            {retryCount > 0 && (
              <p className="text-small text-text-tertiary mt-sm">
                正在重试连接... (第 {retryCount} 次)
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleAnswerSubmit = () => {
    const answer = quizState.settings.answerType === 'choice' ? selectedAnswer : inputAnswer;
    if (answer.trim()) {
      handleSubmitAnswer(answer);
    }
  };

  const canGoPrevious = quizState.currentQuestionIndex > 0;
  const isLastQuestion = quizState.currentQuestionIndex >= quizState.questions.length - 1;

  return (
    <div className={`min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 ${spacing.container}`}>
      {/* 星空爆炸效果 */}
      {showStarExplosion && <StarExplosion isVisible={showStarExplosion} />}
      
      <div className="max-w-4xl mx-auto">
        {/* 导航栏 */}
        <div className={`flex items-center justify-between ${spacing.navbar}`}>
          <Button
            variant="secondary"
            onClick={handleBackToHome}
            className="flex items-center gap-sm"
          >
            <Home size={20} />
            返回首页
          </Button>
          <div className="text-center">
            <h1 className="text-h2 font-bold text-text-primary">猜单词</h1>
            <div className="flex items-center justify-center gap-md">
              <p className="text-small text-text-secondary">
                第 {quizState.currentQuestionIndex + 1} 题 / 共 {quizState.questions.length} 题
              </p>
              <ProgressBar 
                current={quizState.currentQuestionIndex + 1} 
                total={quizState.questions.length}
                className="w-24"
              />
            </div>
          </div>
          <div></div>
        </div>

        {/* 题目卡片 */}
        <Card className={`${spacing.cardPadding} mb-lg`}>
          {/* 题目区域 */}
          <div className={`${spacing.questionArea}`}>
            <div className="text-center mb-lg">
              {quizState.settings.questionType === 'audio' ? (
                <div className="bg-yellow-50 border-2 border-gray-200 rounded-lg p-lg mb-md">
                  <TextToSpeechButton 
                    text={currentWord.audioText}
                    size="large"
                  />
                </div>
              ) : (
                <div className="bg-yellow-50 border-2 border-gray-200 rounded-lg p-lg mb-md relative">
                  <p 
                    ref={questionTextRef}
                    className="text-h3 text-text-primary leading-relaxed pr-12"
                  >
                    {currentWord.definition}
                  </p>
                  <div className="absolute top-4 right-4">
                    <TextToSpeechButton 
                      textRef={questionTextRef}
                      size="small"
                    />
                  </div>
                </div>
              )}
              
              {currentWord.hint && quizState.settings.answerType === 'fill' && (
                <p className="text-h1 text-text-tertiary mt-sm italic">
                  {currentWord.hint}
                </p>
              )}
            </div>

            {/* 答题区域 */}
            <div className="space-y-lg">
              {quizState.settings.answerType === 'choice' ? (
                // 选择题
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  {currentWord.options.map((option, index) => (
                    <OptionButton
                      key={index}
                      option={option}
                      isSelected={selectedAnswer === option}
                      isCorrect={showResult && option === currentWord.answer}
                      isWrong={showResult && selectedAnswer === option && option !== currentWord.answer}
                      disabled={showResult}
                      onClick={() => !showResult && setSelectedAnswer(option)}
                    />
                  ))}
                </div>
              ) : (
                // 填空题
                <div className="space-y-md">
                  <Input
                    value={inputAnswer}
                    onChange={(value) => setInputAnswer(value)}
                    placeholder="请输入你的答案..."
                    disabled={showResult}
                    onSubmit={() => {
                      if (!showResult) {
                        handleAnswerSubmit();
                      }
                    }}
                  />

                </div>
              )}

              {/* 答题结果 */}
              {showResult && (
                <div className={cn(
                  'flex items-center justify-center gap-sm p-md rounded-lg',
                  isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
                )}>
                  {isCorrect ? (
                    <>
                      <CheckCircle size={24} className="text-green-500" />
                      <span className="text-h3 font-bold text-green-600">回答正确</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={24} className="text-red-500" />
                      <span className="text-h3 font-bold text-red-600">再试一次吧</span>
                    </>
                  )}
                  
                  {/* 只有填空题才显示答案 */}
                  {quizState.settings.answerType === 'fill' && (
                    <span className={cn(
                      'text-h3 font-bold',
                      isCorrect ? 'text-green-600' : 'text-red-600'
                    )}>
                      正确答案：{currentWord.answer}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 操作按钮区域 */}
          <div className={`flex items-center justify-between ${spacing.buttonArea} border-t border-gray-200`}>
            <Button
              variant="secondary"
              onClick={handlePreviousQuestion}
              disabled={!canGoPrevious}
              className="flex items-center gap-sm"
            >
              <ArrowLeft size={20} />
              上一题
            </Button>

            <div className="flex gap-md">
              <Button
                onClick={handleAnswerSubmit}
                disabled={
                  (quizState.settings.answerType === 'choice' && !selectedAnswer) ||
                  (quizState.settings.answerType === 'fill' && !inputAnswer.trim())
                }
                className="flex items-center gap-sm"
              >
                <CheckCircle size={20} />
                提交答案
              </Button>
              
              <Button
                onClick={handleNextQuestion}
                className="flex items-center gap-sm"
              >
                {isLastQuestion ? '查看结果' : '下一题'}
                <ArrowRight size={20} />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export { GuessWordGamePage };