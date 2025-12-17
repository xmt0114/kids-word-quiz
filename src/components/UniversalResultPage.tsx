import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Card } from './Card';
import { Button } from './Button';
import { StarResultCard } from './StarResultCard';
import { DetailedStatsGrid } from './DetailedStatsGrid';
import { QuestionOverviewSection } from './QuestionOverviewSection';
import { Trophy, RotateCcw, Home, Target } from 'lucide-react';
import {
  calculateGrade,
  calculateDetailedStats,
  shouldShowCelebration,
  getEncouragementMessage,
  validateQuizResult,
  sanitizeQuestionResults,
  getAchievementInfo,
  sanitizeDetailedStats
} from '../utils/resultCalculations';
import {
  EnhancedQuizResult,
  QuestionResult,
  QuizResult
} from '../types/index';
import { useSound } from '../contexts/SoundContext';

interface UniversalResultPageProps {
  // 如果没有通过路由状态传递结果，可以作为props传入
  result?: QuizResult;
}

const UniversalResultPage: React.FC<UniversalResultPageProps> = ({ result: propResult }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameId } = useParams<{ gameId: string }>();
  const { playSound } = useSound();

  // 从路由状态获取结果和设置
  const {
    result: routeResult,
    settings,
    collectionId,
    questions,
    questionResults,
    startTime,
    endTime,
    timeSpent
  } = location.state || {};

  const result = propResult || routeResult;

  // 如果没有questionResults但有questions，创建模拟的questionResults
  const createMockQuestionResults = (): QuestionResult[] => {
    if (!questions || !Array.isArray(questions)) return [];

    // 创建一个随机分布的正确/错误答案模式，而不是简单的前N个正确
    const correctCount = result.correctAnswers;
    const totalCount = result.totalQuestions;

    // 创建一个包含正确答案索引的数组
    const correctIndices = new Set<number>();

    // 随机选择正确答案的位置
    while (correctIndices.size < correctCount && correctIndices.size < totalCount) {
      const randomIndex = Math.floor(Math.random() * totalCount);
      correctIndices.add(randomIndex);
    }

    return questions.slice(0, totalCount).map((question, index) => {
      const isCorrect = correctIndices.has(index);
      return {
        questionIndex: index,
        question,
        userAnswer: isCorrect ? question.answer : `错误答案${index + 1}`, // 为错误答案生成模拟的错误回答
        isCorrect,
        timeSpent: undefined
      };
    });
  };

  // 验证结果数据
  const validation = validateQuizResult(result);
  if (!validation.isValid) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 flex items-center justify-center p-lg">
        <Card className="text-center p-xl max-w-md">
          <div className="text-6xl mb-md">😕</div>
          <h2 className="text-h2 font-bold text-text-primary mb-md">
            无法显示结果
          </h2>
          <p className="text-body text-text-secondary mb-lg">
            {validation.errors.join(', ') || '没有找到游戏结果数据'}
          </p>
          <Button onClick={() => navigate('/')}>
            返回首页
          </Button>
        </Card>
      </div>
    );
  }

  // 处理和清理题目结果数据
  const sanitizedQuestionResults = sanitizeQuestionResults(
    questionResults,
    result.totalQuestions,
    result.correctAnswers
  );

  // 构建增强的结果数据
  const enhancedResult: EnhancedQuizResult = {
    ...result,
    questionResults: sanitizedQuestionResults,
    startTime,
    endTime,
    timeSpent
  };

  // 使用新的计算函数
  const gradeInfo = calculateGrade(result.accuracy);
  const rawDetailedStats = calculateDetailedStats(enhancedResult);
  const detailedStats = sanitizeDetailedStats(rawDetailedStats);
  const showCelebration = shouldShowCelebration(gradeInfo, result.accuracy);
  const encouragementMessage = getEncouragementMessage(result.accuracy, result.totalQuestions);
  const achievementInfo = getAchievementInfo(result.accuracy, result.totalQuestions, detailedStats.longestStreak || 0);

  // 重新开始游戏（使用相同单词，不更新进度）
  const handleRestart = () => {
    if (!gameId) return;

    // 直接跳转到游戏页面，传递相同的单词和设置
    navigate(`/games/${gameId}/play`, {
      state: {
        settings,
        collectionId,
        questions, // 传递相同的单词列表
        isReplay: true // 标识这是重新学习，不更新进度
      }
    });
  };

  // 继续游戏（获取新的单词）
  const handleContinueGame = () => {
    if (!gameId) return;

    // 继续游戏：跳转到游戏页面，传递设置和collectionId，但不传递questions（触发重新获取）
    navigate(`/games/${gameId}/play`, {
      state: {
        settings,
        collectionId,
        // 不传递 questions 和 isReplay，这样 UniversalGamePage 会重新获取新的单词
      }
    });
  };

  // 返回首页
  const handleBackToHome = () => {
    navigate('/');
  };



  return (
    <div className="min-h-screen result-page-gradient p-sm md:p-lg result-page-compact">
      <div className="max-w-4xl mx-auto space-y-sm">
        {/* 星级结果卡片 */}
        <StarResultCard
          accuracy={result.accuracy}
          encouragementMessage={encouragementMessage}
          showCelebration={showCelebration}
        />

        {/* 详细统计网格 */}
        <DetailedStatsGrid
          correctAnswers={result.correctAnswers}
          totalQuestions={result.totalQuestions}
          accuracy={result.accuracy}
          timeSpent={enhancedResult.timeSpent}
          averageTimePerQuestion={detailedStats.averageTimePerQuestion}
          longestStreak={detailedStats.longestStreak}
          className="stats-card-hover"
        />

        {/* 题目概览区域 */}
        {enhancedResult.questionResults && enhancedResult.questionResults.length > 0 && (
          <QuestionOverviewSection
            questionResults={enhancedResult.questionResults}
          />
        )}

        {/* 操作按钮 */}
        <div className="flex flex-col md:flex-row gap-sm justify-center pt-md">
          <Button
            size="default"
            onClick={() => {
              playSound('click');
              handleRestart();
            }}
            className="flex items-center gap-sm"
          >
            <RotateCcw size={16} />
            重来一局
          </Button>

          <Button
            variant="secondary"
            size="default"
            onClick={() => {
              playSound('click');
              handleBackToHome();
            }}
            className="flex items-center gap-sm"
          >
            <Home size={16} />
            返回首页
          </Button>

          <Button
            size="default"
            variant="primary"
            onClick={() => {
              playSound('click');
              handleContinueGame();
            }}
            className="flex items-center gap-sm bg-green-600 hover:bg-green-700"
          >
            <Target size={16} />
            继续游戏
          </Button>
        </div>

        {/* 成就信息（如果有特殊成就） */}
        {achievementInfo.hasAchievement && (
          <Card className="p-md bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 text-center achievement-pulse">
            <div className="flex items-center justify-center gap-sm">
              <span className="text-2xl animate-bounce-in">{achievementInfo.icon}</span>
              <div className="text-left">
                <div className="text-base font-bold text-amber-700">{achievementInfo.title}</div>
                <div className="text-sm text-amber-600">{achievementInfo.description}</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export { UniversalResultPage };