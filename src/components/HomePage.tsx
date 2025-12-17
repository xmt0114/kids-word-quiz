import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from './Card';
import { Button } from './Button';
import { LearningProgressBar } from './ProgressBar';
import { TextbookSelector } from './TextbookSelector';
import * as LucideIcons from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppStore } from '../stores/appStore';
import { useAuthState } from '../hooks/useAuth';
import { QuizSettings, Game, HomepageGameData } from '../types';
import { wordAPI } from '../utils/api';
import { useSound } from '../contexts/SoundContext';


const HomePage: React.FC = () => {
  const navigate = useNavigate();
  // 直接使用 Zustand store
  const { session, profile, games, gamesLoading, openLoginModal, loadHomepageData, updateSettings } = useAppStore();
  // 使用useAuthState获取updateUserSettings方法
  const { updateUserSettings } = useAuthState();
  const { playSound } = useSound();
  const user = session?.user ?? null;
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [switchingTextbook, setSwitchingTextbook] = useState<string | null>(null);

  // 加载首页数据
  useEffect(() => {
    loadHomepageData();
  }, [loadHomepageData]);

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

  // 处理教材切换
  const handleTextbookChange = async (gameId: string, collectionId: string) => {
    console.log('HomePage: 开始切换教材', { gameId, collectionId, user: !!user, profile: !!profile });

    if (!user || !profile) {
      console.log('HomePage: 用户未登录，弹出登录框');
      openLoginModal('切换教材');
      return;
    }

    setSwitchingTextbook(gameId);
    try {
      // 使用updateUserSettings方法更新设置到服务器（参考设置页面的做法）
      const updates = { [gameId]: { collectionId } };
      console.log('HomePage: 更新设置', updates);
      const result = await updateUserSettings(updates);

      if (!result.success) {
        console.error('HomePage: 设置更新失败:', result.error);
        return;
      }
      console.log('HomePage: 设置更新成功');

      // 获取新教材的名称，用于更新本地显示
      const response = await wordAPI.getCollections?.(gameId);
      let newTextbookName = collectionId;
      if (response?.success && response.data) {
        const newTextbook = response.data.find(t => t.id === collectionId);
        if (newTextbook) {
          newTextbookName = newTextbook.name;
        }
      }

      // 只更新本地游戏数据中的教材信息，不重新加载整个页面
      const updatedGames = games.map(game => {
        if (game.id === gameId) {
          const homepageGame = game as HomepageGameData;
          if (homepageGame.collection) {
            return {
              ...game,
              collection: {
                ...homepageGame.collection,
                id: collectionId,
                name: newTextbookName,
                // 重置进度数据，因为切换了教材
                mastered_count: 0,
                learning_count: 0,
                remaining_count: homepageGame.collection.total_count,
              }
            };
          }
        }
        return game;
      });

      // 更新本地状态
      useAppStore.setState({ games: updatedGames });

    } catch (error) {
      console.error('切换教材失败:', error);
      // 可以在这里添加用户友好的错误提示
    } finally {
      setSwitchingTextbook(null);
    }
  };

  // 开始游戏函数 - 检查登录状态
  const handleStartGame = async (game: Game | HomepageGameData) => {
    playSound('click');
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

    // 从首页数据中获取当前教材ID
    const homepageGame = game as HomepageGameData;
    if (homepageGame.collection && homepageGame.collection.id) {
      finalSettings.collectionId = homepageGame.collection.id;
    }

    // 如果仍然没有 collectionId，尝试自动获取
    if (!finalSettings.collectionId) {
      try {
        const response = await wordAPI.getCollections?.(game.id);
        if (response?.success && response.data && response.data.length > 0) {
          const defaultCollection = response.data[0];
          console.log('Smart Start: Auto-selecting collection', defaultCollection.name);
          finalSettings.collectionId = defaultCollection.id;
        } else {
          // 如果没有可用教材，跳转到设置页面
          navigate(`/games/${game.id}/settings`);
          return;
        }
      } catch (err) {
        console.error('Smart Start failed:', err);
        navigate(`/games/${game.id}/settings`);
        return;
      }
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
        iconBg: 'bg-gradient-to-br from-blue-400 to-blue-600',
        iconColor: 'text-white'
      },
      {
        color: 'from-green-400 to-green-600',
        bgColor: 'from-green-50 to-green-100',
        borderColor: 'border-green-200',
        iconBg: 'bg-gradient-to-br from-green-400 to-green-600',
        iconColor: 'text-white'
      },
      {
        color: 'from-purple-400 to-purple-600',
        bgColor: 'from-purple-50 to-purple-100',
        borderColor: 'border-purple-200',
        iconBg: 'bg-gradient-to-br from-purple-400 to-purple-600',
        iconColor: 'text-white'
      },
      {
        color: 'from-orange-400 to-orange-600',
        bgColor: 'from-orange-50 to-orange-100',
        borderColor: 'border-orange-200',
        iconBg: 'bg-gradient-to-br from-orange-400 to-orange-600',
        iconColor: 'text-white'
      },
      {
        color: 'from-pink-400 to-pink-600',
        bgColor: 'from-pink-50 to-pink-100',
        borderColor: 'border-pink-200',
        iconBg: 'bg-gradient-to-br from-pink-400 to-pink-600',
        iconColor: 'text-white'
      },
      {
        color: 'from-teal-400 to-teal-600',
        bgColor: 'from-teal-50 to-teal-100',
        borderColor: 'border-teal-200',
        iconBg: 'bg-gradient-to-br from-teal-400 to-teal-600',
        iconColor: 'text-white'
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
      <div className="mb-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-primary-500 to-secondary-500 rounded-full"></div>
            <h2 className="text-xl font-semibold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent" style={{ fontFamily: 'Noto Sans SC, Fredoka, sans-serif' }}>
              热门游戏
            </h2>
          </div>
        </div>
      </div>

      {/* 游戏列表 */}
      <div className="max-w-6xl mx-auto">
        {gamesLoading ? (
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
                    'relative overflow-hidden transition-all duration-normal hover:scale-105 hover:shadow-xl group bg-white/80 backdrop-blur-sm border-2',
                    styles.borderColor
                  )}
                  onMouseEnter={() => playSound('hover')}
                >
                  {/* 背景渐变 */}
                  <div className={cn(
                    'absolute inset-0 opacity-5 transition-opacity group-hover:opacity-15',
                    styles.bgColor
                  )} />

                  {/* 装饰性圆点 */}
                  <div className="absolute top-4 right-4 w-2 h-2 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full opacity-30"></div>
                  <div className="absolute top-6 right-6 w-1 h-1 bg-gradient-to-r from-secondary-400 to-accent-500 rounded-full opacity-50"></div>

                  {/* 左上角装饰线 */}
                  <div className="absolute top-0 left-0 w-8 h-1 bg-gradient-to-r from-primary-400 to-transparent opacity-40"></div>
                  <div className="absolute top-0 left-0 w-1 h-8 bg-gradient-to-b from-primary-400 to-transparent opacity-40"></div>

                  <div className="relative p-md">
                    {/* 游戏图标 */}
                    <div className="text-center mb-md">
                      <div className={cn(
                        'w-20 h-20 mx-auto mb-md rounded-full flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110',
                        styles.iconBg
                      )}>
                        <Icon size={40} className={styles.iconColor} />
                      </div>
                      <h3 className="text-h3 font-bold text-text-primary mb-sm" style={{ fontFamily: 'Noto Sans SC, Fredoka, sans-serif' }}>
                        {game.title}
                      </h3>
                      <p className="text-body text-text-secondary line-clamp-2 h-12" style={{ fontFamily: 'Noto Sans SC, Fredoka, sans-serif' }}>
                        {game.description}
                      </p>
                    </div>

                    {/* 教材信息和进度条 */}
                    <div className="mb-sm space-y-xs">
                      {(game as HomepageGameData).collection ? (
                        <>
                          {/* 教材选择器 */}
                          <div className="flex items-center justify-center">
                            {switchingTextbook === game.id ? (
                              <div className="flex items-center gap-xs text-small text-text-secondary">
                                <LucideIcons.Loader size={14} className="animate-spin" />
                                <span>切换中...</span>
                              </div>
                            ) : (
                              <TextbookSelector
                                currentTextbook={(game as HomepageGameData).collection.id}
                                currentTextbookName={(game as HomepageGameData).collection.name}
                                gameId={game.id}
                                onSelect={(collectionId) => handleTextbookChange(game.id, collectionId)}
                              />
                            )}
                          </div>

                          {/* 学习进度条 */}
                          <div className="px-xs">
                            <LearningProgressBar
                              mastered={(game as HomepageGameData).collection.mastered_count}
                              learning={(game as HomepageGameData).collection.learning_count}
                              remaining={(game as HomepageGameData).collection.remaining_count}
                              total={(game as HomepageGameData).collection.total_count}
                              className="h-1.5"
                            />
                          </div>
                        </>
                      ) : (
                        /* 教材数据不可用时的后备内容 */
                        <div className="flex items-center justify-center text-small text-text-tertiary">
                          <LucideIcons.BookOpen size={14} className="mr-xs" />
                          <span>暂无教材数据</span>
                        </div>
                      )}
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
                          <button
                            className="flex items-center justify-center p-3 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-105"
                            title="游戏设置"
                          >
                            <LucideIcons.Settings
                              size={36}
                              className="text-gray-500 hover:text-gray-700 gear-3d"
                            />
                          </button>
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
              <h3 className="text-h3 font-bold text-text-primary" style={{ fontFamily: 'Noto Sans SC, Fredoka, sans-serif' }}>学习成就系统</h3>
            </div>
            <p className="text-body text-text-secondary" style={{ fontFamily: 'Noto Sans SC, Fredoka, sans-serif' }}>
              完成游戏获得积分，解锁成就徽章，追踪你的学习进度
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export { HomePage };