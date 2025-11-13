import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from './Card';
import { Button } from './Button';
import { Brain, Gamepad2, Trophy, Zap, Target, Headphones, Clock, BarChart3, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import { useQuizSettings } from '../stores/appStore';
import { useAuth } from '../hooks/useAuth';
import { QuizSettings } from '../types';
import { LoginModal } from './auth/LoginModal';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useQuizSettings();
  const { user, profile } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // 监听用户状态变化，登录后自动执行pendingAction
  useEffect(() => {
    if (user && profile && pendingAction) {
      if (pendingAction === 'guess-word') {
        const finalSettings: QuizSettings = {
          questionType: settings.questionType || 'text',
          answerType: settings.answerType || 'choice',
          selectionStrategy: settings.selectionStrategy || 'sequential',
          collectionId: settings.collectionId || '11111111-1111-1111-1111-111111111111'
        };

        navigate('/guess-word/game', {
          state: {
            settings: finalSettings,
            collectionId: finalSettings.collectionId
          }
        });
      }
      setPendingAction(null);
    }
  }, [user, profile, pendingAction, settings, navigate]);

  // 开始游戏函数 - 检查登录状态
  const handleStartGame = (gameId: string) => {
    if (!user || !profile) {
      // 用户未登录，弹出登录弹框
      setPendingAction(gameId);
      setIsLoginModalOpen(true);
      return;
    }

    // 用户已登录，正常开始游戏
    if (gameId === 'guess-word') {
      const finalSettings: QuizSettings = {
        questionType: settings.questionType || 'text',
        answerType: settings.answerType || 'choice',
        selectionStrategy: settings.selectionStrategy || 'sequential',
        collectionId: settings.collectionId || '11111111-1111-1111-1111-111111111111'
      };

      navigate('/guess-word/game', {
        state: {
          settings: finalSettings,
          collectionId: finalSettings.collectionId
        }
      });
    }
  };

  // 登录弹框关闭回调
  const handleLoginModalClose = () => {
    setIsLoginModalOpen(false);
    setPendingAction(null);
  };

  // 游戏列表数据
  const games = [
    {
      id: 'guess-word',
      name: '猜单词',
      description: '通过定义猜测单词，提升词汇量',
      icon: Brain,
      color: 'from-blue-400 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      features: ['选择题', '填空题', '音频答题', '多种难度'],
      settingsLink: '/guess-word/settings',
      gameLink: '/guess-word/game',
      difficulty: '初级到高级',
      estimatedTime: '5-15分钟'
    },
    {
      id: 'word-match',
      name: '单词配对',
      description: '将单词与定义进行匹配训练',
      icon: Target,
      color: 'from-green-400 to-green-600',
      bgColor: 'from-green-50 to-green-100',
      borderColor: 'border-green-200',
      features: ['快速配对', '记忆训练', '时间挑战'],
      link: '#',
      difficulty: '中级',
      estimatedTime: '3-10分钟',
      comingSoon: true
    },
    {
      id: 'audio-quiz',
      name: '听力挑战',
      description: '通过听力识别和拼写单词',
      icon: Headphones,
      color: 'from-purple-400 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
      features: ['听力识别', '拼写练习', '发音对比'],
      link: '#',
      difficulty: '中级到高级',
      estimatedTime: '5-20分钟',
      comingSoon: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 p-sm md:p-lg">
      {/* 页面标题 */}
      <div className="text-center mb-xl">
        <div className="relative">
          <h1 className="text-hero font-bold text-text-primary mb-md animate-slide-in-right">
            英语学习游戏中心
          </h1>
          <p className="text-h2 text-text-secondary font-semibold">
            选择你喜欢的游戏开始学习
          </p>
          
          {/* 装饰元素 */}
          <div className="relative mt-lg">
            <div className="absolute -top-4 -left-8 w-16 h-16 bg-accent-500 rounded-full opacity-20 animate-float" />
            <div className="absolute -top-2 -right-12 w-12 h-12 bg-secondary-500 rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }} />
            <div className="absolute top-4 left-1/2 w-8 h-8 bg-primary-500 rounded-full opacity-20 animate-float" style={{ animationDelay: '2s' }} />
          </div>
        </div>
      </div>

      {/* 游戏列表 */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {games.map((game) => {
            const Icon = game.icon;
            const isComingSoon = game.comingSoon;
            
            return (
              <Card
                key={game.id}
                className={cn(
                  'relative overflow-hidden transition-all duration-normal hover:scale-105',
                  game.borderColor,
                  isComingSoon ? 'opacity-75' : 'hover:shadow-xl'
                )}
              >
                {/* 背景渐变 */}
                <div className={cn(
                  'absolute inset-0 opacity-10',
                  game.bgColor
                )} />
                
                {/* 即将推出标签 */}
                {isComingSoon && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full">
                      即将推出
                    </span>
                  </div>
                )}

                <div className="relative p-lg">
                  {/* 游戏图标 */}
                  <div className="text-center mb-md">
                    <div className={cn(
                      'w-20 h-20 mx-auto mb-md rounded-full bg-gradient-to-r flex items-center justify-center',
                      game.color
                    )}>
                      <Icon size={40} className="text-white" />
                    </div>
                    <h3 className="text-h3 font-bold text-text-primary mb-sm">
                      {game.name}
                    </h3>
                    <p className="text-body text-text-secondary">
                      {game.description}
                    </p>
                  </div>

                  {/* 游戏特性 */}
                  <div className="mb-md">
                    <div className="flex flex-wrap gap-xs justify-center">
                      {game.features.map((feature, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 游戏信息 */}
                  <div className="flex justify-between items-center mb-md text-small text-text-tertiary">
                    <div className="flex items-center gap-xs">
                      <BarChart3 size={16} />
                      <span>{game.difficulty}</span>
                    </div>
                    <div className="flex items-center gap-xs">
                      <Clock size={16} />
                      <span>{game.estimatedTime}</span>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="text-center">
                    {isComingSoon ? (
                      <Button
                        variant="secondary"
                        disabled
                        className="w-full"
                      >
                        <Zap size={16} className="mr-xs" />
                        敬请期待
                      </Button>
                    ) : (
                      <div className="flex items-center justify-center gap-sm">
                        <Button
                          size="default"
                          className="flex items-center gap-xs"
                          onClick={() => handleStartGame(game.id)}
                        >
                          <Gamepad2 size={16} />
                          开始游戏
                        </Button>
                        <Link to={game.settingsLink}>
                          <Button
                            variant="secondary"
                            size="default"
                            className="flex items-center justify-center !w-16 !h-12 p-0"
                          >
                            <Settings size={40} style={{ width: '40px', height: '40px' }} />
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* 底部信息 */}
        <div className="text-center mt-xl">
          <Card className="p-lg bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
            <div className="flex items-center justify-center gap-sm mb-sm">
              <Trophy size={24} className="text-yellow-500" />
              <h3 className="text-h3 font-bold text-text-primary">学习成就系统</h3>
            </div>
            <p className="text-body text-text-secondary">
              完成游戏获得积分，解锁成就徽章，追踪你的学习进度
            </p>
          </Card>
        </div>
      </div>

      {/* 登录弹框 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={handleLoginModalClose}
        action="开始游戏"
      />
    </div>
  );
};

export { HomePage };