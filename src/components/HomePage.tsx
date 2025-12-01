import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from './Card';
import { Button } from './Button';
import * as LucideIcons from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppStore } from '../stores/appStore';
import { useAuth } from '../hooks/useAuth';
import { QuizSettings, Game } from '../types';
import { wordAPI } from '../utils/api';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { openLoginModal } = useAppStore();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);

  // 加载游戏列表
  useEffect(() => {
    const loadGames = async () => {
      setLoadingGames(true);
      try {
        if (wordAPI.getGames) {
          const response = await wordAPI.getGames();
          if (response.success && response.data) {
            setGames(response.data);
          }
        } else {
          // Fallback for local dev if API not ready
          setGames([
            {
              id: 'guess-word',
              title: '猜单词',
              description: '根据提示猜测单词，支持看图、听音等多种模式',
              icon: 'Brain',
              type: 'guess_word',
              language: 'en',
              default_config: { questionType: 'text', answerType: 'choice' } as any,
              is_active: true
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to load games:', error);
      } finally {
        setLoadingGames(false);
      }
    };

    loadGames();
  }, []);

  // 监听用户状态变化，登录后自动执行pendingAction
  useEffect(() => {
    if (user && profile && pendingAction) {
      // 找到对应的游戏
      const game = games.find(g => g.id === pendingAction);
      if (game) {
        handleStartGame(game);
      }
      setPendingAction(null);
    }
  }, [user, profile, pendingAction, games]);

  // 开始游戏函数 - 检查登录状态
  const handleStartGame = async (game: Game) => {
    if (!user || !profile) {
      // 用户未登录，弹出登录弹框
      setPendingAction(game.id);
      openLoginModal('开始游戏');
      return;
    }

    // 获取用户设置
    const store = useAppStore.getState();
    let userSettings = store.userSettings?.[game.id];

    // 兼容旧版扁平化设置 (针对猜单词游戏)
    if (!userSettings && (game.id === 'guess-word' || game.id === 'guess_word') && store.userSettings?.questionType) {
      console.log('Using legacy flat settings for game:', game.id);
      userSettings = store.userSettings;
    }

    // 合并默认设置
    const finalSettings: QuizSettings = {
      ...game.default_config,
      ...(userSettings || {})
    };

    // 确保有 collectionId
    if (!finalSettings.collectionId) {
      // 尝试自动获取该游戏的教材列表
      try {
        // 显示加载状态（可选，这里为了流畅体验暂时不做全屏loading）
        const response = await wordAPI.getCollections?.(game.id);
        if (response?.success && response.data && response.data.length > 0) {
          // 智能选择：默认使用第一个教材
          const defaultCollection = response.data[0];
          console.log('Smart Start: Auto-selecting collection', defaultCollection.name);

          finalSettings.collectionId = defaultCollection.id;

          // 跳转到通用游戏页面
          navigate(`/games/${game.id}/play`, {
            state: {
              settings: finalSettings,
              collectionId: finalSettings.collectionId
            }
          });
          return;
        }
      } catch (err) {
        console.error('Smart Start failed:', err);
      }

      // 如果没有选择教材且自动获取失败，跳转到设置页面
      navigate(`/games/${game.id}/settings`);
      return;
    }

    // 跳转到通用游戏页面
    navigate(`/games/${game.id}/play`, {
      state: {
        settings: finalSettings,
        collectionId: finalSettings.collectionId
      }
    });
  };

  // 辅助函数：获取图标组件
  const getIconComponent = (iconName: string) => {
    // @ts-ignore
    return LucideIcons[iconName] || LucideIcons.Gamepad2;
  };

  // 辅助函数：获取颜色样式
  const getGameStyles = (gameId: string) => {
    // 预定义一组配色方案
    const colorSchemes = [
      {
        color: 'from-blue-400 to-blue-600',
        bgColor: 'from-blue-50 to-blue-100',
        borderColor: 'border-blue-200',
        iconBg: 'bg-blue-100 text-blue-600'
      },
      {
        color: 'from-green-400 to-green-600',
        bgColor: 'from-green-50 to-green-100',
        borderColor: 'border-green-200',
        iconBg: 'bg-green-100 text-green-600'
      },
      {
        color: 'from-purple-400 to-purple-600',
        bgColor: 'from-purple-50 to-purple-100',
        borderColor: 'border-purple-200',
        iconBg: 'bg-purple-100 text-purple-600'
      },
      {
        color: 'from-orange-400 to-orange-600',
        bgColor: 'from-orange-50 to-orange-100',
        borderColor: 'border-orange-200',
        iconBg: 'bg-orange-100 text-orange-600'
      },
      {
        color: 'from-pink-400 to-pink-600',
        bgColor: 'from-pink-50 to-pink-100',
        borderColor: 'border-pink-200',
        iconBg: 'bg-pink-100 text-pink-600'
      },
      {
        color: 'from-teal-400 to-teal-600',
        bgColor: 'from-teal-50 to-teal-100',
        borderColor: 'border-teal-200',
        iconBg: 'bg-teal-100 text-teal-600'
      }
    ];

    // 根据 gameId 的哈希值选择配色
    let hash = 0;
    for (let i = 0; i < gameId.length; i++) {
      hash = gameId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colorSchemes.length;

    return colorSchemes[index];
  };

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
        {loadingGames ? (
          <div className="flex justify-center py-2xl">
            <LucideIcons.Loader size={48} className="text-primary-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {games.map((game) => {
              const Icon = getIconComponent(game.icon);
              const styles = getGameStyles(game.id);

              return (
                <Card
                  key={game.id}
                  className={cn(
                    'relative overflow-hidden transition-all duration-normal hover:scale-105 hover:shadow-xl group',
                    styles.borderColor
                  )}
                >
                  {/* 背景渐变 */}
                  <div className={cn(
                    'absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20',
                    styles.bgColor
                  )} />

                  <div className="relative p-lg">
                    {/* 游戏图标 */}
                    <div className="text-center mb-md">
                      <div className={cn(
                        'w-20 h-20 mx-auto mb-md rounded-full bg-gradient-to-r flex items-center justify-center shadow-md transform transition-transform group-hover:scale-110',
                        styles.color
                      )}>
                        <Icon size={40} className="text-white" />
                      </div>
                      <h3 className="text-h3 font-bold text-text-primary mb-sm">
                        {game.title}
                      </h3>
                      <p className="text-body text-text-secondary line-clamp-2 h-12">
                        {game.description}
                      </p>
                    </div>

                    {/* 游戏信息 */}
                    <div className="flex justify-between items-center mb-md text-small text-text-tertiary">
                      <div className="flex items-center gap-xs">
                        <LucideIcons.BarChart3 size={16} />
                        <span>初级到高级</span>
                      </div>
                      <div className="flex items-center gap-xs">
                        <LucideIcons.Clock size={16} />
                        <span>5-15分钟</span>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-sm">
                        <Button
                          size="default"
                          className={cn("flex items-center gap-xs shadow-md hover:shadow-lg", styles.color)}
                          onClick={() => handleStartGame(game)}
                        >
                          <LucideIcons.Gamepad2 size={16} />
                          开始游戏
                        </Button>
                        <Link to={`/games/${game.id}/settings`}>
                          <Button
                            variant="secondary"
                            size="default"
                            className="flex items-center justify-center !w-12 !h-12 p-0 rounded-full hover:bg-gray-100"
                            title="游戏设置"
                          >
                            <LucideIcons.Settings size={24} className="text-gray-600" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* 底部信息 */}
        <div className="text-center mt-xl">
          <Card className="p-lg bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
            <div className="flex items-center justify-center gap-sm mb-sm">
              <LucideIcons.Trophy size={24} className="text-yellow-500" />
              <h3 className="text-h3 font-bold text-text-primary">学习成就系统</h3>
            </div>
            <p className="text-body text-text-secondary">
              完成游戏获得积分，解锁成就徽章，追踪你的学习进度
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export { HomePage };