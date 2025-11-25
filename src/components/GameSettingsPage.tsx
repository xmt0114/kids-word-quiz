import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Card } from './Card';
import { Button } from './Button';
import { QuizSettings, TTSSettings, Game } from '../types';
import { useQuizSettings } from '../stores/appStore';
import { useAvailableVoices } from '../hooks/useAvailableVoices';
import { useAuth } from '../hooks/useAuth';
import { Volume2, Type, MousePointer, Edit3, Database, BookOpen, ListOrdered, Shuffle, RotateCcw, TrendingUp, Speaker, Loader } from 'lucide-react';
import { cn } from '../lib/utils';
import { wordAPI } from '../utils/api';
import { useAppStore } from '../stores/appStore';
import { LoginModal } from './auth/LoginModal';

interface GameSettingsPageProps {
    selectedCollectionId?: string;
}

const GameSettingsPage: React.FC<GameSettingsPageProps> = () => {
    const navigate = useNavigate();
    const { gameId } = useParams<{ gameId: string }>();
    const location = useLocation();

    // 从 location state 获取 selectedCollectionId (如果有)
    const selectedCollectionId = location.state?.selectedCollectionId;

    // 游戏信息
    const [gameInfo, setGameInfo] = useState<Game | null>(null);
    const [loadingGame, setLoadingGame] = useState(true);

    // 使用 gameId 获取设置，传入 gameInfo 中的默认配置作为兜底
    // 注意：gameInfo 加载前 default_config 为 undefined，加载后会触发 settings 更新
    const { settings, setSettings } = useQuizSettings(gameId, gameInfo?.default_config);

    const { voices, isLoaded: isVoicesLoaded } = useAvailableVoices();
    const { user, profile } = useAuth();
    const isLoggedIn = !!(user && profile);
    const isAdmin = profile?.role === 'admin';

    // 使用 Zustand 管理学习进度
    const { userProgress, getProgress, refreshProgress } = useAppStore();

    const [showLoginModal, setShowLoginModal] = useState(false);
    const [textbookInfo, setTextbookInfo] = useState<{ name: string; grade_level?: string | null; word_count?: number } | null>(null);
    const [pendingSettings, setPendingSettings] = useState<Partial<QuizSettings> | null>(null);
    const [isResetting, setIsResetting] = useState(false);

    // 加载游戏信息
    useEffect(() => {
        const loadGameInfo = async () => {
            if (!gameId) return;

            setLoadingGame(true);
            try {
                if (wordAPI.getGames) {
                    const response = await wordAPI.getGames();
                    if (response.success && response.data) {
                        const game = response.data.find(g => g.id === gameId);
                        if (game) {
                            setGameInfo(game);
                        } else {
                            // 如果找不到游戏，可能是旧的 guess-word 路由，或者 ID 错误
                            if (gameId === 'guess-word') {
                                setGameInfo({
                                    id: 'guess-word',
                                    title: '猜单词',
                                    description: '根据提示猜测单词',
                                    icon: 'Brain',
                                    type: 'guess_word',
                                    default_config: { questionType: 'text', answerType: 'choice' } as any,
                                    is_active: true
                                });
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to load game info:', error);
            } finally {
                setLoadingGame(false);
            }
        };

        loadGameInfo();
    }, [gameId]);

    // 页面加载时检查登录状态
    useEffect(() => {
        if (!isLoggedIn) {
            // 未登录，弹出登录框
            setShowLoginModal(true);
        }
    }, [isLoggedIn]);

    // 处理弹框关闭
    const handleCloseLoginModal = () => {
        setShowLoginModal(false);
        if (!isLoggedIn) {
            // 未登录，关闭弹框后跳转到主页
            navigate('/');
        }
    };

    // 初始化 collectionId 和 pendingSettings
    useEffect(() => {
        if (selectedCollectionId && selectedCollectionId !== (pendingSettings || settings).collectionId) {
            setSettings((prevSettings) => ({
                ...prevSettings,
                collectionId: selectedCollectionId,
            }));
        }
    }, [selectedCollectionId]);

    // 初始化 pendingSettings
    useEffect(() => {
        // 只有当 pendingSettings 为空且游戏已加载完成时才初始化
        // 这样可以确保我们使用了正确的默认配置（来自 gameInfo）
        // 如果 loadingGame 为 true，settings 可能还是通用的默认值，所以要等加载完
        if (!pendingSettings && !loadingGame) {
            setPendingSettings(settings);
        }
    }, [settings, loadingGame]);

    // 加载当前选择的教材信息和进度，并执行智能默认选择
    useEffect(() => {
        const currentCollectionId = selectedCollectionId || (pendingSettings || settings).collectionId;

        // 1. 获取教材列表以验证当前选择或执行智能默认
        if (gameId) {
            wordAPI.getCollections?.(gameId).then(response => {
                if (response.success && response.data) {
                    const collections = response.data;

                    // 检查当前 collectionId 是否有效
                    const isValid = currentCollectionId && collections.some(c => c.id === currentCollectionId);

                    // 如果无效（为空或不在列表中）且有可用教材，自动选择第一个
                    if (!isValid && collections.length > 0) {
                        console.log('Smart Default: Auto-selecting first collection', collections[0].name);
                        setPendingSettings(prev => ({
                            ...(prev || settings),
                            collectionId: collections[0].id
                        }));
                        // 同时更新 textbookInfo 以便即时显示
                        setTextbookInfo({
                            name: collections[0].name,
                            grade_level: collections[0].grade_level,
                            word_count: collections[0].word_count
                        });
                        // 获取新选择的进度
                        getProgress(collections[0].id);
                    } else if (currentCollectionId) {
                        // 如果有效，获取当前教材信息
                        const current = collections.find(c => c.id === currentCollectionId);
                        if (current) {
                            setTextbookInfo({
                                name: current.name,
                                grade_level: current.grade_level,
                                word_count: current.word_count
                            });
                            getProgress(currentCollectionId);
                        }
                    } else {
                        // 既无效也没有可用教材（或列表为空）
                        setTextbookInfo(null);
                    }
                }
            });
        }
    }, [selectedCollectionId, (pendingSettings || settings).collectionId, gameId]);

    const questionTypes = [
        {
            id: 'text',
            name: '文字题干',
            description: '在屏幕上显示题目描述',
            icon: Type,
            color: 'from-blue-400 to-blue-600',
        },
        {
            id: 'audio',
            name: '音频题干',
            description: '通过语音朗读题目描述',
            icon: Volume2,
            color: 'from-green-400 to-green-600',
        },
    ];

    const answerTypes = [
        {
            id: 'choice',
            name: '选择题',
            description: '从多个选项中选择正确答案',
            icon: MousePointer,
            color: 'from-purple-400 to-purple-600',
        },
        {
            id: 'fill',
            name: '填空题',
            description: '根据提示填写完整单词',
            icon: Edit3,
            color: 'from-orange-400 to-orange-600',
        },
    ];

    const selectionStrategies = [
        {
            id: 'sequential' as const,
            name: '顺序选取',
            description: '按添加时间顺序依次出题',
            detail: '单词将按照添加的时间顺序排列，新添加的单词优先出现',
            icon: ListOrdered,
            color: 'from-blue-400 to-blue-600',
        },
        {
            id: 'random' as const,
            name: '随机选取',
            description: '从词汇池中随机抽取题目',
            detail: '每次练习题目顺序都不同，增加趣味性和挑战性',
            icon: Shuffle,
            color: 'from-purple-400 to-purple-600',
        },
    ];

    const handleQuestionTypeSelect = (type: string) => {
        setPendingSettings((prev) => ({
            ...(prev || settings),
            questionType: type as 'text' | 'audio'
        }));
    };

    const handleAnswerTypeSelect = (type: string) => {
        setPendingSettings((prev) => ({
            ...(prev || settings),
            answerType: type as 'choice' | 'fill'
        }));
    };

    const handleStrategySelect = (strategy: string) => {
        setPendingSettings((prev) => ({
            ...(prev || settings),
            selectionStrategy: strategy as 'sequential' | 'random'
        }));
    };

    const handleTtsSettingChange = (key: keyof TTSSettings, value: string | number) => {
        setPendingSettings((prev) => {
            const current = prev || settings;
            return {
                ...current,
                tts: {
                    ...(current.tts || {
                        lang: 'en-US',
                        rate: 0.8,
                        pitch: 1.0,
                        volume: 1.0,
                    }),
                    [key]: value,
                },
            };
        });
    };

    const handleTtsTest = () => {
        // 首先取消任何正在进行的语音
        window.speechSynthesis.cancel();

        // 等待一小段时间确保之前的语音完全停止
        setTimeout(() => {
            // 测试朗读功能
            const testText = "This is a test of the text-to-speech feature.";
            const utterance = new SpeechSynthesisUtterance(testText);
            const ttsSettings = (pendingSettings || settings).tts || {
                lang: 'en-US',
                rate: 0.8,
                pitch: 1.0,
                volume: 1.0,
            };

            // 设置基础参数
            utterance.lang = ttsSettings.lang;
            utterance.rate = ttsSettings.rate;
            utterance.pitch = ttsSettings.pitch;
            utterance.volume = ttsSettings.volume;

            // 如果选择了特定语音，尝试使用它
            // 直接从浏览器获取语音列表，确保名称匹配
            const availableVoices = window.speechSynthesis.getVoices();

            if (ttsSettings.voiceName && availableVoices.length > 0) {
                // 使用完全匹配（trim并比较）
                const selectedVoice = availableVoices.find(voice => {
                    const trimmedName = voice.name.trim();
                    const searchName = ttsSettings.voiceName!.trim();
                    return trimmedName === searchName || trimmedName.includes(searchName) || searchName.includes(trimmedName);
                });

                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                }
            } else if (availableVoices.length === 0) {
                // 语音列表尚未加载
            }

            window.speechSynthesis.speak(utterance);
        }, 100);
    };

    // 处理重置学习进度
    const handleResetProgress = async () => {
        const collectionId = selectedCollectionId || (pendingSettings || settings).collectionId;
        if (!collectionId) return;

        if (!confirm('确定要重置学习进度吗？此操作不可撤销。')) {
            return;
        }

        setIsResetting(true);
        try {
            console.log('[Settings] 开始重置学习进度:', collectionId);

            const resp = await wordAPI.resetCollectionProgress?.(collectionId);
            if (!resp || !resp.success) {
                alert(`重置失败${resp?.error ? `: ${resp.error}` : ''}`);
            } else {
                console.log('[Settings] 学习进度重置成功');
                // 使用 Zustand 刷新学习进度缓存
                await refreshProgress(collectionId);
                alert('学习进度已重置！');
            }
        } catch (err) {
            console.error('重置学习进度时发生错误:', err);
            alert('重置进度时发生错误，请稍后重试');
        } finally {
            setIsResetting(false);
        }
    };

    const handleSaveSettings = async () => {
        // 【服务器优先】保存待处理的设置
        if (pendingSettings) {
            console.log(`💾 [GameSettings] 用户点击保存设置 [${gameId}] (服务器优先):`, pendingSettings);

            // 调用 setSettings（现在是异步的，会先更新服务器再更新本地缓存）
            await setSettings(pendingSettings);
        }
        navigate('/');
    };

    const handleDataManagement = () => {
        navigate('/guess-word/data');
    };

    const handleSelectTextbook = () => {
        // 传递 gameId 给教材选择页，以便过滤教材
        navigate('/textbook-selection', { state: { gameId } });
    };

    const handleBackToHome = () => {
        navigate('/');
    };

    if (loadingGame) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader size={48} className="text-primary-500 animate-spin mb-md mx-auto" />
                    <p className="text-body text-text-secondary">加载游戏信息...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 p-sm md:p-lg">
            {/* 顶部导航按钮 */}
            <div className="flex justify-between items-center mb-xl max-w-4xl mx-auto">
                <Button
                    variant="secondary"
                    onClick={handleBackToHome}
                    className="flex items-center gap-sm"
                >
                    <span>←</span>
                    返回主页
                </Button>

                {/* 数据管理按钮 - 仅管理员显示 */}
                {isAdmin && (
                    <Button
                        variant="secondary"
                        onClick={handleDataManagement}
                        className="flex items-center gap-sm"
                    >
                        <Database size={20} />
                        数据管理
                    </Button>
                )}
            </div>

            {/* 页面标题 */}
            <div className="text-center mb-xl">
                <h1 className="text-hero font-bold text-text-primary mb-md animate-slide-in-right">
                    {gameInfo?.title || '游戏'}设置
                </h1>
                <p className="text-h2 text-text-secondary font-semibold">
                    配置你的游戏参数
                </p>

                {/* 装饰元素 */}
                <div className="relative mt-lg">
                    <div className="absolute -top-4 -left-8 w-16 h-16 bg-accent-500 rounded-full opacity-20 animate-float" />
                    <div className="absolute -top-2 -right-12 w-12 h-12 bg-secondary-500 rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-4 left-1/2 w-8 h-8 bg-primary-500 rounded-full opacity-20 animate-float" style={{ animationDelay: '2s' }} />
                </div>
            </div>

            {/* 教材选择区域 */}
            <div className="max-w-2xl mx-auto mb-xl">
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-md">
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                                <BookOpen size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-h3 font-bold text-text-primary">当前教材</h3>
                                <p className="text-body text-text-secondary">
                                    {textbookInfo ? (
                                        <>
                                            {textbookInfo.name}
                                            {textbookInfo.grade_level && ` (${textbookInfo.grade_level}年级)`}
                                        </>
                                    ) : (
                                        '请选择教材'
                                    )}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            onClick={handleSelectTextbook}
                            className="flex items-center gap-sm"
                        >
                            <BookOpen size={20} />
                            选择教材
                        </Button>
                    </div>

                    {/* 学习进度信息 */}
                    {textbookInfo && (pendingSettings || settings).collectionId && (
                        <div className="mt-md pt-md border-t border-blue-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-md">
                                    <TrendingUp size={20} className="text-blue-500" />
                                    <div>
                                        {userProgress ? (
                                            <>
                                                <p className="text-small font-semibold text-text-primary">
                                                    已掌握 {userProgress.mastered_words} 个单词
                                                </p>
                                                <p className="text-xs text-text-tertiary">
                                                    正在学习 {userProgress.learning_words} 个单词
                                                </p>
                                            </>
                                        ) : (
                                            <p className="text-small text-text-tertiary">正在加载进度...</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-md">
                                    {userProgress && (
                                        <p className="text-xs text-text-tertiary">
                                            总词汇: {userProgress.total_words} 个
                                        </p>
                                    )}
                                    <Button
                                        variant="secondary"
                                        onClick={handleResetProgress}
                                        disabled={!userProgress || isResetting}
                                        className="flex items-center gap-xs"
                                    >
                                        <RotateCcw size={16} />
                                        {isResetting ? '重置中...' : '重置进度'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* 设置选项 */}
            <div className="max-w-4xl mx-auto space-y-xl">
                {/* 题干类型选择 */}
                <section>
                    <h2 className="text-h2 font-bold text-text-primary mb-lg text-center">
                        选择题目类型
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                        {questionTypes.map((type) => {
                            const Icon = type.icon;
                            const isSelected = (pendingSettings || settings).questionType === type.id;

                            return (
                                <Card
                                    key={type.id}
                                    className={cn(
                                        'cursor-pointer transition-all duration-normal border-4',
                                        isSelected
                                            ? 'border-primary-500 bg-primary-50 scale-105 shadow-lg'
                                            : 'border-gray-200 hover:border-primary-300 hover:scale-102'
                                    )}
                                    onClick={() => handleQuestionTypeSelect(type.id)}
                                >
                                    <div className="text-center">
                                        <div className={cn(
                                            'w-16 h-16 mx-auto mb-md rounded-full bg-gradient-to-r flex items-center justify-center',
                                            type.color
                                        )}>
                                            <Icon size={32} className="text-white" />
                                        </div>
                                        <h3 className="text-h3 font-bold text-text-primary mb-sm">
                                            {type.name}
                                        </h3>
                                        <p className="text-body text-text-secondary">
                                            {type.description}
                                        </p>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </section>

                {/* 答题方式选择 */}
                <section>
                    <h2 className="text-h2 font-bold text-text-primary mb-lg text-center">
                        选择答题方式
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                        {answerTypes.map((type) => {
                            const Icon = type.icon;
                            const isSelected = (pendingSettings || settings).answerType === type.id;

                            return (
                                <Card
                                    key={type.id}
                                    className={cn(
                                        'cursor-pointer transition-all duration-normal border-4',
                                        isSelected
                                            ? 'border-primary-500 bg-primary-50 scale-105 shadow-lg'
                                            : 'border-gray-200 hover:border-primary-300 hover:scale-102'
                                    )}
                                    onClick={() => handleAnswerTypeSelect(type.id)}
                                >
                                    <div className="text-center">
                                        <div className={cn(
                                            'w-16 h-16 mx-auto mb-md rounded-full bg-gradient-to-r flex items-center justify-center',
                                            type.color
                                        )}>
                                            <Icon size={32} className="text-white" />
                                        </div>
                                        <h3 className="text-h3 font-bold text-text-primary mb-sm">
                                            {type.name}
                                        </h3>
                                        <p className="text-body text-text-secondary">
                                            {type.description}
                                        </p>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </section>

                {/* 出题策略选择 */}
                <section>
                    <h2 className="text-h2 font-bold text-text-primary mb-lg text-center">
                        选择出题策略
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                        {selectionStrategies.map((strategy) => {
                            const Icon = strategy.icon;
                            const isSelected = (pendingSettings || settings).selectionStrategy === strategy.id;

                            return (
                                <Card
                                    key={strategy.id}
                                    className={cn(
                                        'cursor-pointer transition-all duration-normal border-4',
                                        isSelected
                                            ? 'border-primary-500 bg-primary-50 scale-105 shadow-lg'
                                            : 'border-gray-200 hover:border-primary-300 hover:scale-102'
                                    )}
                                    onClick={() => handleStrategySelect(strategy.id)}
                                >
                                    <div className="text-center">
                                        <div className={cn(
                                            'w-16 h-16 mx-auto mb-md rounded-full bg-gradient-to-r flex items-center justify-center',
                                            strategy.color
                                        )}>
                                            <Icon size={32} className="text-white" />
                                        </div>
                                        <h3 className="text-h3 font-bold text-text-primary mb-sm">
                                            {strategy.name}
                                        </h3>
                                        <p className="text-body text-text-secondary mb-sm">
                                            {strategy.description}
                                        </p>
                                        <div className="bg-gray-50 rounded-lg p-sm">
                                            <p className="text-small text-text-tertiary">
                                                {strategy.detail}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </section>

                {/* 语音朗读设置 */}
                <section>
                    <h2 className="text-h2 font-bold text-text-primary mb-lg text-center">
                        语音朗读设置
                    </h2>
                    <Card className="p-lg">
                        <div className="space-y-lg">
                            {/* 语音引擎选择 */}
                            <div>
                                <label className="text-body font-bold text-text-primary mb-sm block">
                                    语音引擎
                                    {!isVoicesLoaded && <span className="text-xs text-text-tertiary ml-sm">(加载中...)</span>}
                                </label>
                                <select
                                    value={(pendingSettings || settings).tts?.voiceName || ''}
                                    onChange={(e) => {
                                        const voiceName = e.target.value;
                                        let newLang = (pendingSettings || settings).tts?.lang;

                                        // 自动更新语言为选中语音的语言
                                        if (voiceName) {
                                            // 使用灵活匹配，处理名称差异
                                            const selectedVoice = voices.find(voice => {
                                                const trimmedName = voice.name.trim();
                                                const searchName = voiceName.trim();
                                                return trimmedName === searchName || trimmedName.includes(searchName) || searchName.includes(trimmedName);
                                            });

                                            if (selectedVoice) {
                                                newLang = selectedVoice.lang;
                                            }
                                        }

                                        // 一次性更新两个值，避免状态更新冲突
                                        setPendingSettings((prev) => {
                                            const current = prev || settings;
                                            return {
                                                ...current,
                                                tts: {
                                                    ...(current.tts || {
                                                        lang: 'en-US',
                                                        rate: 0.8,
                                                        pitch: 1.0,
                                                        volume: 1.0,
                                                    }),
                                                    voiceName: voiceName,
                                                    lang: newLang,
                                                },
                                            };
                                        });
                                    }}
                                    className="w-full px-md py-sm border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none"
                                    disabled={!isVoicesLoaded}
                                >
                                    <option value="">默认语音（系统自动选择）</option>
                                    {voices
                                        .filter(voice => voice.lang.startsWith('en') || voice.lang.startsWith('zh'))
                                        .map((voice) => (
                                            <option key={voice.name} value={voice.name}>
                                                {voice.displayName}
                                            </option>
                                        ))}
                                </select>
                                {/* 显示当前选择的语音信息 */}
                                {(() => {
                                    const tts = (pendingSettings || settings).tts;
                                    if (!tts?.voiceName) return null;
                                    const voiceName = tts.voiceName;
                                    const selectedVoice = voices.find(v => {
                                        const trimmedName = v.name.trim();
                                        const searchName = voiceName.trim();
                                        return trimmedName === searchName || trimmedName.includes(searchName) || searchName.includes(trimmedName);
                                    });
                                    return (
                                        <p className="text-small text-text-tertiary mt-xs">
                                            当前语音：{selectedVoice ? selectedVoice.displayName : voiceName}
                                        </p>
                                    );
                                })()}
                                {/* 显示当前语言 */}
                                <p className="text-small text-text-tertiary mt-xs">
                                    语言：{(pendingSettings || settings).tts?.lang || 'en-US'}
                                </p>
                            </div>

                            {/* 语速控制 */}
                            <div>
                                <div className="flex items-center justify-between mb-sm">
                                    <label className="text-body font-bold text-text-primary">
                                        语速
                                    </label>
                                    <span className="text-small text-text-secondary">
                                        {(pendingSettings || settings).tts?.rate?.toFixed(1) || '0.8'}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="2.0"
                                    step="0.1"
                                    value={(pendingSettings || settings).tts?.rate || 0.8}
                                    onChange={(e) => handleTtsSettingChange('rate', parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                                />
                                <div className="flex justify-between text-xs text-text-tertiary mt-xs">
                                    <span>慢</span>
                                    <span>正常</span>
                                    <span>快</span>
                                </div>
                            </div>

                            {/* 音调控制 */}
                            <div>
                                <div className="flex items-center justify-between mb-sm">
                                    <label className="text-body font-bold text-text-primary">
                                        音调
                                    </label>
                                    <span className="text-small text-text-secondary">
                                        {(pendingSettings || settings).tts?.pitch?.toFixed(1) || '1.0'}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="2.0"
                                    step="0.1"
                                    value={(pendingSettings || settings).tts?.pitch || 1.0}
                                    onChange={(e) => handleTtsSettingChange('pitch', parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                                />
                                <div className="flex justify-between text-xs text-text-tertiary mt-xs">
                                    <span>低</span>
                                    <span>正常</span>
                                    <span>高</span>
                                </div>
                            </div>

                            {/* 音量控制 */}
                            <div>
                                <div className="flex items-center justify-between mb-sm">
                                    <label className="text-body font-bold text-text-primary">
                                        音量
                                    </label>
                                    <span className="text-small text-text-secondary">
                                        {Math.round(((pendingSettings || settings).tts?.volume || 1.0) * 100)}%
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0.0"
                                    max="1.0"
                                    step="0.1"
                                    value={(pendingSettings || settings).tts?.volume || 1.0}
                                    onChange={(e) => handleTtsSettingChange('volume', parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                                />
                                <div className="flex justify-between text-xs text-text-tertiary mt-xs">
                                    <span>小</span>
                                    <span>正常</span>
                                    <span>大</span>
                                </div>
                            </div>

                            {/* 测试按钮 */}
                            <div className="pt-md border-t border-gray-200">
                                <Button
                                    variant="secondary"
                                    onClick={handleTtsTest}
                                    className="w-full flex items-center justify-center gap-sm"
                                >
                                    <Speaker size={20} />
                                    测试朗读效果
                                </Button>
                            </div>
                        </div>
                    </Card>
                </section>

                {/* 保存设置按钮 */}
                <section className="text-center mt-xl">
                    <Button
                        variant="success"
                        size="large"
                        onClick={handleSaveSettings}
                        className="px-2xl py-md text-h2 font-bold shadow-lg hover:shadow-xl transition-all duration-normal"
                    >
                        保存设置
                    </Button>
                </section>

            </div>

            {/* 登录弹框 */}
            <LoginModal
                isOpen={showLoginModal}
                onClose={handleCloseLoginModal}
                action="访问设置"
            />
        </div>
    );
};

export { GameSettingsPage };
