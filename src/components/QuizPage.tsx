import React, { useState, useEffect, useRef } from 'react';
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

interface QuizPageProps {
  word: Word;
  questionType: 'text' | 'audio';
  answerType: 'choice' | 'fill';
  currentQuestion: number;
  totalQuestions: number;
  onSubmitAnswer: (answer: string) => void;
  onNextQuestion: () => void;
  onPreviousQuestion: () => void;
  onBackToHome: () => void;
  canGoPrevious: boolean;
  isLastQuestion: boolean;
  isCompleted?: boolean;
}

const QuizPage: React.FC<QuizPageProps> = ({
  word,
  questionType,
  answerType,
  currentQuestion,
  totalQuestions,
  onSubmitAnswer,
  onNextQuestion,
  onPreviousQuestion,
  onBackToHome,
  canGoPrevious,
  isLastQuestion,
  isCompleted = false,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [inputAnswer, setInputAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showStarExplosion, setShowStarExplosion] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const questionTextRef = useRef<HTMLParagraphElement>(null);

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
        cardPadding: 'p-sm',
        questionArea: 'mb-xs',
        buttonArea: 'pt-xs'
      };
    }
    // 大屏幕 (≥800px) 使用宽松布局 (已经是默认设置)
    
    return spacing;
  };

  const spacing = getDynamicSpacing();

  // 重置状态当题目改变时
  useEffect(() => {
    setSelectedAnswer('');
    setInputAnswer('');
    setShowResult(false);
    setIsCorrect(false);
    setShowStarExplosion(false);
  }, [word.id]);

  const handleOptionSelect = (option: string) => {
    if (showResult) return;
    setSelectedAnswer(option);
  };

  const handleInputChange = (value: string) => {
    if (showResult) return;
    setInputAnswer(value);
  };

  const handleInputSubmit = () => {
    if (inputAnswer.trim() && !showResult) {
      checkAnswer(inputAnswer.trim());
    }
  };

  const handleSubmitAnswer = () => {
    const answer = answerType === 'choice' ? selectedAnswer : inputAnswer.trim();
    if (answer) {
      checkAnswer(answer);
    }
  };

  const checkAnswer = (answer: string) => {
    const correct = answer.toLowerCase().trim() === word.answer.toLowerCase().trim();
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setShowStarExplosion(true);
      setTimeout(() => setShowStarExplosion(false), 600);
    }

    // 立即提交答案，不自动跳转
    onSubmitAnswer(answer);
  };

  const handleNextQuestion = () => {
    setShowResult(false);
    setSelectedAnswer('');
    setInputAnswer('');
    onNextQuestion();
  };

  const handlePreviousQuestion = () => {
    setShowResult(false);
    setSelectedAnswer('');
    setInputAnswer('');
    onPreviousQuestion();
  };

  const handleBackToHome = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    setShowExitConfirm(false);
    onBackToHome();
  };

  const cancelExit = () => {
    setShowExitConfirm(false);
  };

  const getQuestionText = () => {
    return questionType === 'text' ? word.definition : word.audioText;
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 ${spacing.container}`}>
      {/* 顶部导航栏 */}
      <div className={`max-w-4xl mx-auto ${spacing.navbar}`}>
        <div className="flex justify-between items-center gap-md">
          {/* 左侧：返回主页按钮 */}
          <Button
            variant="secondary"
            onClick={handleBackToHome}
            className="flex items-center gap-xs flex-shrink-0"
          >
            <Home size={20} />
            返回主页
          </Button>
          
          {/* 中间：进度条 */}
          <div className="flex-1 max-w-md">
            <ProgressBar current={currentQuestion} total={totalQuestions} />
          </div>
          
          {/* 右侧：题目计数 */}
          <div className="text-body text-text-secondary font-semibold flex-shrink-0">
            第 {currentQuestion} / {totalQuestions} 题
          </div>
        </div>
      </div>

      {/* 退出确认对话框 */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-lg">
          <Card className="max-w-md w-full">
            <div className="text-center mb-lg">
              <div className="text-5xl mb-md">🤔</div>
              <h3 className="text-h2 font-bold text-text-primary mb-sm">
                确定要退出吗？
              </h3>
              <p className="text-body text-text-secondary">
                当前的答题进度将会丢失
              </p>
            </div>
            <div className="flex gap-md">
              <Button
                variant="secondary"
                onClick={cancelExit}
                className="flex-1"
              >
                继续答题
              </Button>
              <Button
                onClick={confirmExit}
                className="flex-1"
              >
                确认退出
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 题目卡片 */}
      <div className={`max-w-4xl mx-auto ${spacing.content}`}>
        <Card className={`relative ${spacing.content} ${spacing.cardPadding}`}>
          <StarExplosion isVisible={showStarExplosion} />
          


          {/* 题目内容 */}
          <div className={`text-center ${spacing.questionArea}`}>
            {/* 题目文本或音频播放 */}
            <div className="bg-background-primary rounded-lg p-md mb-md">
              {questionType === 'text' ? (
                <div className="flex items-center justify-center gap-sm">
                  <p 
                    ref={questionTextRef}
                    className="text-question text-text-primary whitespace-nowrap overflow-hidden text-ellipsis flex-1"
                  >
                    {getQuestionText()}
                  </p>
                  <TextToSpeechButton
                    textRef={questionTextRef}
                    size="medium"
                    className="flex-shrink-0"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-lg">
                  <AudioButton
                    audioText={getQuestionText()}
                    isPlaying={audioPlaying}
                    onPlayStateChange={setAudioPlaying}
                    showTooltip={true}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 答案区域 */}
          <div className="space-y-lg">
            {answerType === 'choice' ? (
              // 选择题选项
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                {word.options.map((option, index) => (
                  <OptionButton
                    key={index}
                    option={option}
                    isSelected={selectedAnswer === option}
                    isCorrect={showResult && option === word.answer}
                    isWrong={showResult && selectedAnswer === option && option !== word.answer}
                    onClick={() => handleOptionSelect(option)}
                    disabled={showResult}
                  />
                ))}
              </div>
            ) : (
              // 填空题输入框
              <Input
                value={inputAnswer}
                onChange={handleInputChange}
                onSubmit={handleInputSubmit}
                hint={word.hint}
                placeholder="输入完整单词..."
                isCorrect={showResult && isCorrect}
                isWrong={showResult && !isCorrect}
                disabled={showResult}
              />
            )}

            {/* 答案反馈 */}
            {showResult && (
              <div className={cn(
                'flex items-center justify-center gap-sm p-md rounded-lg text-center',
                isCorrect ? 'bg-success bg-opacity-10' : 'bg-error bg-opacity-10'
              )}>
                {isCorrect ? (
                  <>
                    <CheckCircle className="text-success" size={24} />
                    <span className="text-h3 font-bold text-success">
                      太棒了！答对了！
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="text-error" size={24} />
                    <div className="text-center">
                      <span className="text-h3 font-bold text-error block">
                        再试一次吧！
                      </span>
                      <span className="text-body text-text-secondary">
                        正确答案是：<strong>{word.answer}</strong>
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 操作按钮 */}
            <div className={`space-y-md ${spacing.buttonArea}`}>
              {/* 提交答案按钮 - 仅对未提交时显示 */}
              {!showResult && (
                <div className="flex justify-center">
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={answerType === 'choice' ? !selectedAnswer : !inputAnswer.trim()}
                    size="large"
                  >
                    提交答案
                  </Button>
                </div>
              )}
              
              {/* 导航按钮 - 始终显示 */}
              <div className="flex flex-col sm:flex-row gap-md justify-center">
                <Button
                  variant="secondary"
                  onClick={handlePreviousQuestion}
                  disabled={!canGoPrevious}
                  className="flex items-center gap-sm justify-center"
                >
                  <ArrowLeft size={20} />
                  上一题
                </Button>
                
                <Button
                  onClick={handleNextQuestion}
                  size="large"
                  className={cn(
                    "flex items-center gap-sm justify-center",
                    !showResult && "animate-bounce-in"
                  )}
                >
                  {isLastQuestion ? (
                    <>
                      查看结果
                      <CheckCircle size={20} />
                    </>
                  ) : (
                    <>
                      下一题
                      <ArrowRight size={20} />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export { QuizPage };