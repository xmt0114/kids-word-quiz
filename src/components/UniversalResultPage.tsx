import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Card } from './Card';
import { Button } from './Button';
import { StarExplosion } from './StarExplosion';
import { Trophy, RotateCcw, Home, BookOpen, Target, Award } from 'lucide-react';
import { cn } from '../lib/utils';


interface QuizResult {
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
  timeSpent?: number;
  score?: number;
}

interface UniversalResultPageProps {
  // 如果没有通过路由状态传递结果，可以作为props传入
  result?: QuizResult;
}

const UniversalResultPage: React.FC<UniversalResultPageProps> = ({ result: propResult }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameId } = useParams<{ gameId: string }>();


  // 从路由状态获取结果和设置
  const { result: routeResult, settings, collectionId, questions } = location.state || {};
  const result = propResult || routeResult;

  // 如果没有结果数据，显示错误信息
  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 flex items-center justify-center p-lg">
        <Card className="text-center p-xl max-w-md">
          <div className="text-6xl mb-md">😕</div>
          <h2 className="text-h2 font-bold text-text-primary mb-md">
            无法显示结果
          </h2>
          <p className="text-body text-text-secondary mb-lg">
            没有找到游戏结果数据
          </p>
          <Button onClick={() => navigate('/')}>
            返回首页
          </Button>
        </Card>
      </div>
    );
  }

  const { correctAnswers, totalQuestions, accuracy } = result;

  // 计算评级
  const getGrade = () => {
    if (accuracy >= 90) return { grade: 'S', color: 'text-yellow-500', bg: 'bg-yellow-100', desc: '完美表现！' };
    if (accuracy >= 80) return { grade: 'A', color: 'text-green-500', bg: 'bg-green-100', desc: '非常出色！' };
    if (accuracy >= 70) return { grade: 'B', color: 'text-blue-500', bg: 'bg-blue-100', desc: '表现良好！' };
    if (accuracy >= 60) return { grade: 'C', color: 'text-orange-500', bg: 'bg-orange-100', desc: '还需努力！' };
    return { grade: 'D', color: 'text-red-500', bg: 'bg-red-100', desc: '继续加油！' };
  };

  const gradeInfo = getGrade();

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
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 p-sm md:p-lg">
      <div className="max-w-4xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-xl">
          <div className="relative">
            <StarExplosion isVisible={true} />
            <h1 className="text-hero font-bold text-text-primary mb-md animate-slide-in-right">
              游戏完成！
            </h1>
            <p className="text-h2 text-text-secondary font-semibold">
              看看你的表现如何
            </p>
          </div>
        </div>

        {/* 主要结果卡片 */}
        <Card className="p-xl mb-lg text-center">
          {/* 评级徽章 */}
          <div className="mb-lg">
            <div className={cn(
              'w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl font-bold mb-md',
              gradeInfo.bg,
              gradeInfo.color
            )}>
              {gradeInfo.grade}
            </div>
            <h2 className={cn('text-h2 font-bold mb-sm', gradeInfo.color)}>
              {gradeInfo.desc}
            </h2>
            <p className="text-body text-text-secondary">
              准确率 {accuracy.toFixed(1)}%
            </p>
          </div>

          {/* 分数统计 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-lg">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-sm">
                <Target size={32} className="text-green-500" />
              </div>
              <h3 className="text-h3 font-bold text-text-primary">{correctAnswers}</h3>
              <p className="text-small text-text-secondary">正确题数</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-sm">
                <BookOpen size={32} className="text-blue-500" />
              </div>
              <h3 className="text-h3 font-bold text-text-primary">{totalQuestions}</h3>
              <p className="text-small text-text-secondary">总题数</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-sm">
                <Award size={32} className="text-purple-500" />
              </div>
              <h3 className="text-h3 font-bold text-text-primary">{accuracy.toFixed(1)}%</h3>
              <p className="text-small text-text-secondary">准确率</p>
            </div>
          </div>

          {/* 详细统计 */}
          <div className="bg-gray-50 rounded-lg p-md">
            <div className="flex justify-between items-center">
              <span className="text-body text-text-secondary">错误题数</span>
              <span className="text-h3 font-bold text-red-500">
                {totalQuestions - correctAnswers}
              </span>
            </div>
          </div>
        </Card>

        {/* 操作按钮 */}
        <div className="flex flex-col md:flex-row gap-md justify-center">
          <Button
            size="large"
            onClick={handleRestart}
            className="flex items-center gap-sm"
          >
            <RotateCcw size={24} />
            重来一局
          </Button>

          <Button
            variant="secondary"
            size="large"
            onClick={handleBackToHome}
            className="flex items-center gap-sm"
          >
            <Home size={20} />
            返回首页
          </Button>

          <Button
            size="large"
            variant="primary" // Highlight "Continue Game"
            onClick={handleContinueGame}
            className="flex items-center gap-sm bg-green-600 hover:bg-green-700"
          >
            <Target size={24} />
            继续游戏
          </Button>


        </div>

        {/* 鼓励信息 */}
        <div className="text-center mt-xl">
          <Card className="p-lg bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
            <div className="flex items-center justify-center gap-sm mb-sm">
              <Trophy size={24} className="text-yellow-500" />
              <h3 className="text-h3 font-bold text-text-primary">继续努力！</h3>
            </div>
            <p className="text-body text-text-secondary">
              {accuracy >= 80
                ? '你的表现非常出色！继续保持这个水平。'
                : accuracy >= 60
                  ? '不错的开始！多练习会有更好的成绩。'
                  : '不要气馁，多练习就会进步的！'
              }
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export { UniversalResultPage };