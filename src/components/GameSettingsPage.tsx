import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Card } from './Card';
import { Button } from './Button';
import { QuizSettings, TTSSettings, Game } from '../types';
import { useQuizSettings } from '../stores/appStore';
import { useAvailableVoices } from '../hooks/useAvailableVoices';
// useAuth 已替换为直接使用 Zustand store
import { Volume2, Type, MousePointer, Edit3, Database, BookOpen, ListOrdered, Shuffle, RotateCcw, TrendingUp, Speaker, Loader, Gamepad2, GraduationCap, Info, VolumeX, AlertCircle } from 'lucide-react';
import { isTTSSupported } from '../utils/tts';
import { cn } from '../lib/utils';
import { wordAPI } from '../utils/api';
import { useAppStore, useGameTexts } from '../stores/appStore';
import { ConfirmDialog } from './ConfirmDialog';
import { Tooltip, TooltipProvider } from './Tooltip';

interface GameSettingsPageProps {
    selectedCollectionId?: string;
}

const GameSettingsPage: React.FC<GameSettingsPageProps> = () => {
    const navigate = useNavigate();
    const { gameId } = useParams<{ gameId: string }>();
    const location = useLocation();

    // 辅助函数：确保设置类型安全
    const ensureSafeSettings = (settings: any): QuizSettings => ({
        ...settings,
        gameMode: (settings.gameMode === 'exam' ? 'exam' : 'practice') as 'practice' | 'exam'
    });

    // 从 location state 获取 selectedCollectionId (如果有)
    const selectedCollectionId = location.state?.selectedCollectionId;

    // 游戏信息
    const [gameInfo, setGameInfo] = useState<Game | null>(null);
    const [loadingGame, setLoadingGame] = useState(true);

    // 使用 gameId 获取设置，传入 gameInfo 中的默认配置作为兜底
    // 注意：gameInfo 加载前 default_config 为 undefined，加载后会触发 settings 更新
    const { settings, setSettings } = useQuizSettings(gameId, gameInfo?.default_config);

    // 辅助函数：深度规范化配置对象，用于稳定对比
    const normalizeSettings = React.useCallback((s: any): QuizSettings => {
        if (!s) return {} as QuizSettings;

        // 核心字段提取与规范化，排除旧字段如 learningStrategy
        const base = {
            gameMode: s.gameMode === 'exam' ? 'exam' : 'practice',
            questionType: s.questionType === 'audio' ? 'audio' : 'text',
            answerType: s.answerType === 'fill' ? 'fill' : 'choice',
            selectionStrategy: s.selectionStrategy || s.learningStrategy || 'sequential',
            collectionId: s.collectionId || '',
            showPinyin: !!s.showPinyin,
            tts: {
                lang: s.tts?.lang || 'en-US',
                rate: typeof s.tts?.rate === 'number' ? s.tts.rate : 0.8,
                pitch: typeof s.tts?.pitch === 'number' ? s.tts.pitch : 1.0,
                volume: typeof s.tts?.volume === 'number' ? s.tts.volume : 1.0,
                voiceName: s.tts?.voiceName || ''
            }
        };

        // 确保属性顺序一致（通过重新构建对象）
        return JSON.parse(JSON.stringify(base));
    }, []);

    // 状态管理：对比基准
    const [baselineSettings, setBaselineSettings] = useState<QuizSettings | null>(null);

    const { voices, isLoaded: isVoicesLoaded } = useAvailableVoices();
    // 直接使用 Zustand store
    const { session, profile, playSound } = useAppStore();
    const user = session?.user ?? null;
    const isLoggedIn = !!(user && profile);
    const isAdmin = profile?.role === 'admin';

    // 使用 Zustand 管理学习进度
    const { userProgress, getProgress, refreshProgress, openLoginModal } = useAppStore();

    // 获取文本配置
    const texts = useGameTexts(gameId || '');



    const [textbookInfo, setTextbookInfo] = useState<{ name: string; grade_level?: string | null; word_count?: number } | null>(null);
    const [pendingSettings, setPendingSettings] = useState<Partial<QuizSettings> | null>(null);
    const [isResetting, setIsResetting] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [resetResult, setResetResult] = useState<{ show: boolean; success: boolean; message: string }>({ show: false, success: true, message: '' });

    // 加载游戏信息
    useEffect(() => {
        const loadGameInfo = async () => {
            if (!gameId) return;

            // 从store获取游戏信息，避免重复请求
            const { games } = useAppStore.getState();
            if (games && games.length > 0) {
                const game = games.find(g => g.id === gameId);
                if (game) {
                    setGameInfo(game);
                } else {
                    console.error(`Game not found: ${gameId}`);
                }
                setLoadingGame(false);
            } else {
                // 如果store中还没有游戏数据，等待Gatekeeper加载完成
                console.log('等待游戏数据加载...');
                setLoadingGame(false);
            }
        };

        loadGameInfo();
    }, [gameId]);

    // 页面加载时检查登录状态
    useEffect(() => {
        if (!isLoggedIn) {
            // 未登录，弹出登录框
            openLoginModal('访问设置');
            // 跳转到主页
            navigate('/');
        }
    }, [isLoggedIn, openLoginModal, navigate]);

    // 初始化 collectionId 和 pendingSettings
    useEffect(() => {
        if (selectedCollectionId && selectedCollectionId !== (pendingSettings || settings).collectionId) {
            setSettings((prevSettings) => ({
                ...prevSettings,
                collectionId: selectedCollectionId,
            }));
        }
    }, [selectedCollectionId]);

    // 初始化 pendingSettings 和 baseline
    useEffect(() => {
        // 只有当 pendingSettings 为空且游戏已加载完成时才初始化
        // 这样可以确保我们使用了正确的默认配置（来自 gameInfo）
        if (!pendingSettings && !loadingGame) {
            const normalized = normalizeSettings(settings);
            setPendingSettings(normalized);
            setBaselineSettings(normalized);
        }
    }, [settings, loadingGame, normalizeSettings]);

    // 检查配置是否发生更改
    const isChanged = React.useMemo(() => {
        if (!pendingSettings || !baselineSettings) return false;
        // 深度比较规范化后的对象
        return JSON.stringify(normalizeSettings(pendingSettings)) !== JSON.stringify(baselineSettings);
    }, [pendingSettings, baselineSettings, normalizeSettings]);

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
                        const newCollectionId = collections[0].id;

                        setPendingSettings(prev => {
                            const current = prev || normalizeSettings(settings);
                            return { ...current, collectionId: newCollectionId };
                        });

                        // 重要：如果这是初始加载时的自动选择，我们同步更新基准
                        // 这样“保存”按钮就不会因为系统自动纠错而立即点亮
                        setBaselineSettings(prev => {
                            const current = prev || normalizeSettings(settings);
                            return { ...current, collectionId: newCollectionId };
                        });

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
            description: `根据提示填写完整${texts.itemName}`,
            icon: Edit3,
            color: 'from-orange-400 to-orange-600',
        },
    ];

    const selectionStrategies = [
        {
            id: 'sequential' as const,
            name: '顺序选取',
            description: '按添加时间顺序依次出题',
            detail: `${texts.itemName}将按照添加的时间顺序排列，新添加的${texts.itemName}优先出现`,
            icon: ListOrdered,
            color: 'from-blue-400 to-blue-600',
        },
        {
            id: 'random' as const,
            name: '随机选取',
            description: `从${texts.itemName}池中随机抽取题目`,
            detail: '每次练习题目顺序都不同，增加趣味性和挑战性',
            icon: Shuffle,
            color: 'from-purple-400 to-purple-600',
        },
    ];


    const gameModes = [
        {
            id: 'practice' as const,
            name: '练习模式',
            description: '答题后即时显示正误',
            detail: '适合初学者，随时掌握学习进度',
            icon: Gamepad2,
            color: 'from-green-400 to-green-600',
        },
        {
            id: 'exam' as const,
            name: '考试模式',
            description: '答题完毕后统一显示结果',
            detail: '隐藏提交按钮，模拟真实考试环境',
            icon: GraduationCap,
            color: 'from-red-400 to-red-600',
        },
    ];

    const handleQuestionTypeSelect = (type: string) => {
        // 如果选择音频题干但不支持 TTS，显示提示
        if (type === 'audio' && !isTTSSupported()) {
            return;
        }

        playSound('toggle');
        setPendingSettings((prev) => ({
            ...(prev || ensureSafeSettings(settings)),
            questionType: type as 'text' | 'audio'
        }));
    };

    const handleGameModeSelect = (mode: 'practice' | 'exam') => {
        playSound('toggle');
        setPendingSettings((prev) => ({
            ...(prev || ensureSafeSettings(settings)),
            gameMode: mode
        }));
    };

    const handleAnswerTypeSelect = (type: string) => {
        playSound('toggle');
        setPendingSettings((prev) => ({
            ...(prev || ensureSafeSettings(settings)),
            answerType: type as 'choice' | 'fill'
        }));
    };

    const handleStrategySelect = (strategy: string) => {
        playSound('toggle');
        setPendingSettings((prev) => ({
            ...(prev || ensureSafeSettings(settings)),
            selectionStrategy: strategy as 'sequential' | 'random'
        }));
    };

    const handleTtsSettingChange = (key: keyof TTSSettings, value: string | number) => {
        setPendingSettings((prev) => {
            const current = prev || ensureSafeSettings(settings);
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
            const ttsSettings = (pendingSettings || settings).tts || {
                lang: 'en-US',
                rate: 0.8,
                pitch: 1.0,
                volume: 1.0,
            };

            // 根据语言选择测试文本
            // 优先使用当前选择的语音语言，如果没有则使用游戏语言
            const currentLang = ttsSettings.lang || gameInfo?.language || 'en';
            const isChinese = currentLang.toLowerCase().startsWith('zh') ||
                (gameInfo?.language === 'zh' && (!ttsSettings.lang || ttsSettings.lang === 'en-US'));

            const testText = isChinese
                ? "这是一个语音合成功能的测试。"
                : "This is a test of the text-to-speech feature.";

            const utterance = new SpeechSynthesisUtterance(testText);

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

    // 处理重置学习进度 - 显示确认弹框
    const handleResetProgress = () => {
        const collectionId = selectedCollectionId || (pendingSettings || settings).collectionId;
        if (!collectionId) return;

        setShowResetConfirm(true);
    };

    // 确认重置学习进度
    const confirmResetProgress = async () => {
        const collectionId = selectedCollectionId || (pendingSettings || settings).collectionId;
        if (!collectionId) return;

        setShowResetConfirm(false);
        setIsResetting(true);

        try {
            console.log('[Settings] 开始重置学习进度:', collectionId);

            const resp = await wordAPI.resetCollectionProgress?.(collectionId);
            if (!resp || !resp.success) {
                setResetResult({
                    show: true,
                    success: false,
                    message: `重置失败${resp?.error ? `: ${resp.error}` : ''}`
                });
            } else {
                console.log('[Settings] 学习进度重置成功');
                // 使用 Zustand 刷新学习进度缓存
                await refreshProgress(collectionId);
                setResetResult({
                    show: true,
                    success: true,
                    message: '学习进度已重置!'
                });
            }
        } catch (err) {
            console.error('重置学习进度时发生错误:', err);
            setResetResult({
                show: true,
                success: false,
                message: '重置进度时发生错误,请稍后重试'
            });
        } finally {
            setIsResetting(false);
        }
    };

    const handleSaveSettings = async () => {
        playSound('click');
        // 【服务器优先】保存待处理的设置
        // 仅在发生实质性更改时调用后端
        if (isChanged && pendingSettings) {
            console.log(`💾 [GameSettings] 用户点击保存设置 [${gameId}] (服务器优先):`, pendingSettings);

            // 调用 setSettings（现在是异步的，会先更新服务器再更新本地缓存）
            await setSettings(pendingSettings);
        }

        // 优化点2：回到首页时回到顶部
        window.scrollTo(0, 0);
        navigate('/');
    };

    const handleDataManagement = () => {
        playSound('click');
        navigate('/admin/data');
    };

    const handleSelectTextbook = () => {
        playSound('click');
        // 传递 gameId 给教材选择页，以便过滤教材
        navigate('/textbook-selection', { state: { gameId } });
    };

    const handleBackToHome = () => {
        window.scrollTo(0, 0);
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
                                                    已掌握 {userProgress.mastered_words} 个{texts.itemName}
                                                </p>
                                                <p className="text-xs text-text-tertiary">
                                                    正在学习 {userProgress.learning_words} 个{texts.itemName}
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
                                            总{texts.itemName}: {userProgress.total_words} 个
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
                {/* 游戏模式选择 */}
                <section>
                    <div className="flex items-center gap-lg">
                        <h2 className="text-h3 font-bold text-text-primary whitespace-nowrap">
                            游戏模式
                        </h2>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-md">
                            {gameModes.map((mode) => {
                                const Icon = mode.icon;
                                const currentMode = (pendingSettings || settings).gameMode || 'practice';
                                const isSelected = currentMode === mode.id;

                                return (
                                    <div
                                        key={mode.id}
                                        className={cn(
                                            'flex items-center gap-md p-md rounded-lg cursor-pointer transition-all duration-normal border-2',
                                            isSelected
                                                ? 'border-primary-500 bg-primary-50'
                                                : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                                        )}
                                        onClick={() => handleGameModeSelect(mode.id)}
                                    >
                                        {/* 单选指示器 */}
                                        <div className="flex-shrink-0">
                                            <div className={cn(
                                                'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                                                isSelected
                                                    ? 'border-primary-500 bg-primary-500'
                                                    : 'border-gray-300'
                                            )}>
                                                {isSelected && (
                                                    <div className="w-2 h-2 rounded-full bg-white" />
                                                )}
                                            </div>
                                        </div>

                                        {/* 图标 */}
                                        <div className={cn(
                                            'w-10 h-10 rounded-full bg-gradient-to-r flex items-center justify-center flex-shrink-0',
                                            mode.color
                                        )}>
                                            <Icon size={20} className="text-white" />
                                        </div>

                                        {/* 名称 */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-body font-bold text-text-primary">
                                                {mode.name}
                                            </h3>
                                        </div>

                                        {/* 提示图标 */}
                                        <TooltipProvider>
                                            <Tooltip
                                                content={
                                                    <div className="max-w-xs">
                                                        <p className="font-semibold mb-1">{mode.description}</p>
                                                        <p className="text-xs opacity-90">{mode.detail}</p>
                                                    </div>
                                                }
                                                side="left"
                                            >
                                                <div className="flex-shrink-0 text-gray-400 hover:text-primary-500 transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Info size={18} />
                                                </div>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* 题干类型选择 */}
                <section>
                    <div className="flex items-center gap-lg">
                        <h2 className="text-h3 font-bold text-text-primary whitespace-nowrap">
                            题目类型
                        </h2>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-md">
                            {questionTypes.map((type) => {
                                const Icon = type.icon;
                                const isSelected = (pendingSettings || settings).questionType === type.id;

                                return (
                                    <div
                                        key={type.id}
                                        className={cn(
                                            'flex items-center gap-md p-md rounded-lg transition-all duration-normal border-2',
                                            isSelected
                                                ? 'border-primary-500 bg-primary-50'
                                                : (type.id === 'audio' && !isTTSSupported())
                                                    ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                                                    : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50 cursor-pointer'
                                        )}
                                        onClick={() => handleQuestionTypeSelect(type.id)}
                                        title={type.id === 'audio' && !isTTSSupported() ? '您的浏览器不支持语音朗读' : ''}
                                    >
                                        {/* 单选指示器 */}
                                        <div className="flex-shrink-0">
                                            <div className={cn(
                                                'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                                                isSelected
                                                    ? 'border-primary-500 bg-primary-500'
                                                    : 'border-gray-300'
                                            )}>
                                                {isSelected && (
                                                    <div className="w-2 h-2 rounded-full bg-white" />
                                                )}
                                            </div>
                                        </div>

                                        {/* 图标 */}
                                        <div className={cn(
                                            'w-10 h-10 rounded-full bg-gradient-to-r flex items-center justify-center flex-shrink-0',
                                            type.color
                                        )}>
                                            <Icon size={20} className="text-white" />
                                        </div>

                                        {/* 名称 */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-body font-bold text-text-primary">
                                                {type.name}
                                            </h3>
                                        </div>

                                        {/* 提示图标 */}
                                        <TooltipProvider>
                                            <Tooltip
                                                content={
                                                    <div className="max-w-xs">
                                                        <p>{type.description}</p>
                                                    </div>
                                                }
                                                side="left"
                                            >
                                                <div className="flex-shrink-0 text-gray-400 hover:text-primary-500 transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Info size={18} />
                                                </div>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* 答题方式选择 */}
                <section>
                    <div className="flex items-center gap-lg">
                        <h2 className="text-h3 font-bold text-text-primary whitespace-nowrap">
                            答题方式
                        </h2>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-md">
                            {answerTypes.map((type) => {
                                const Icon = type.icon;
                                const isSelected = (pendingSettings || settings).answerType === type.id;

                                return (
                                    <div
                                        key={type.id}
                                        className={cn(
                                            'flex items-center gap-md p-md rounded-lg cursor-pointer transition-all duration-normal border-2',
                                            isSelected
                                                ? 'border-primary-500 bg-primary-50'
                                                : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                                        )}
                                        onClick={() => handleAnswerTypeSelect(type.id)}
                                    >
                                        {/* 单选指示器 */}
                                        <div className="flex-shrink-0">
                                            <div className={cn(
                                                'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                                                isSelected
                                                    ? 'border-primary-500 bg-primary-500'
                                                    : 'border-gray-300'
                                            )}>
                                                {isSelected && (
                                                    <div className="w-2 h-2 rounded-full bg-white" />
                                                )}
                                            </div>
                                        </div>

                                        {/* 图标 */}
                                        <div className={cn(
                                            'w-10 h-10 rounded-full bg-gradient-to-r flex items-center justify-center flex-shrink-0',
                                            type.color
                                        )}>
                                            <Icon size={20} className="text-white" />
                                        </div>

                                        {/* 名称 */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-body font-bold text-text-primary">
                                                {type.name}
                                            </h3>
                                        </div>

                                        {/* 提示图标 */}
                                        <TooltipProvider>
                                            <Tooltip
                                                content={
                                                    <div className="max-w-xs">
                                                        <p>{type.description}</p>
                                                    </div>
                                                }
                                                side="left"
                                            >
                                                <div className="flex-shrink-0 text-gray-400 hover:text-primary-500 transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Info size={18} />
                                                </div>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* 出题策略选择 */}
                <section>
                    <div className="flex items-center gap-lg">
                        <h2 className="text-h3 font-bold text-text-primary whitespace-nowrap">
                            出题策略
                        </h2>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-md">
                            {selectionStrategies.map((strategy) => {
                                const Icon = strategy.icon;
                                const isSelected = (pendingSettings || settings).selectionStrategy === strategy.id;

                                return (
                                    <div
                                        key={strategy.id}
                                        className={cn(
                                            'flex items-center gap-md p-md rounded-lg cursor-pointer transition-all duration-normal border-2',
                                            isSelected
                                                ? 'border-primary-500 bg-primary-50'
                                                : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                                        )}
                                        onClick={() => handleStrategySelect(strategy.id)}
                                    >
                                        {/* 单选指示器 */}
                                        <div className="flex-shrink-0">
                                            <div className={cn(
                                                'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                                                isSelected
                                                    ? 'border-primary-500 bg-primary-500'
                                                    : 'border-gray-300'
                                            )}>
                                                {isSelected && (
                                                    <div className="w-2 h-2 rounded-full bg-white" />
                                                )}
                                            </div>
                                        </div>

                                        {/* 图标 */}
                                        <div className={cn(
                                            'w-10 h-10 rounded-full bg-gradient-to-r flex items-center justify-center flex-shrink-0',
                                            strategy.color
                                        )}>
                                            <Icon size={20} className="text-white" />
                                        </div>

                                        {/* 名称 */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-body font-bold text-text-primary">
                                                {strategy.name}
                                            </h3>
                                        </div>

                                        {/* 提示图标 */}
                                        <TooltipProvider>
                                            <Tooltip
                                                content={
                                                    <div className="max-w-xs">
                                                        <p className="font-semibold mb-1">{strategy.description}</p>
                                                        <p className="text-xs opacity-90">{strategy.detail}</p>
                                                    </div>
                                                }
                                                side="left"
                                            >
                                                <div className="flex-shrink-0 text-gray-400 hover:text-primary-500 transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Info size={18} />
                                                </div>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* 语音朗读设置 */}
                <section>
                    <h2 className="text-h2 font-bold text-text-primary mb-lg text-center">
                        语音朗读设置
                    </h2>
                    <Card className="p-lg">
                        {!isTTSSupported() && (
                            <div className="mb-lg p-md bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-md text-orange-700">
                                <AlertCircle size={24} className="flex-shrink-0" />
                                <div>
                                    <p className="font-bold">您的浏览器不支持语音播放功能</p>
                                    <p className="text-sm">无法使用语音引擎选择和朗读测试，部分音频相关游戏模式将受限。</p>
                                </div>
                            </div>
                        )}
                        <div className={cn("space-y-lg", !isTTSSupported() && "opacity-50 pointer-events-none")}>
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
                                            const current = prev || ensureSafeSettings(settings);
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
                                        .filter(voice => {
                                            // 默认只显示英语语音，除非明确是中文游戏
                                            const gameLang = gameInfo?.language || 'en';
                                            const voiceLang = voice.lang.toLowerCase();

                                            if (gameLang === 'zh') {
                                                return voiceLang.startsWith('zh') || voiceLang.includes('chinese');
                                            } else {
                                                return voiceLang.startsWith('en') || voiceLang.includes('english');
                                            }
                                        })
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
                                    语言：{(pendingSettings || settings).tts?.lang || gameInfo?.language || 'en-US'}
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
                                    min="0"
                                    max="2.0"
                                    step="0.1"
                                    value={(pendingSettings || settings).tts?.rate || 1.0}
                                    onChange={(e) => handleTtsSettingChange('rate', parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                                />
                                <div className="flex justify-between text-xs text-text-tertiary mt-xs">
                                    <span>0x</span>
                                    <span>1.0x (正常)</span>
                                    <span>2.0x</span>
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
                                    min="0"
                                    max="2.0"
                                    step="0.1"
                                    value={(pendingSettings || settings).tts?.pitch || 1.0}
                                    onChange={(e) => handleTtsSettingChange('pitch', parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                                />
                                <div className="flex justify-between text-xs text-text-tertiary mt-xs">
                                    <span>0x</span>
                                    <span>1.0x (正常)</span>
                                    <span>2.0x</span>
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
                                    <span>0%</span>
                                    <span>50%</span>
                                    <span>100%</span>
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

                {/* 拼音设置 (仅中文游戏显示) */}
                {gameInfo?.language === 'zh' && (
                    <section>
                        <h2 className="text-h2 font-bold text-text-primary mb-lg text-center">
                            显示设置
                        </h2>
                        <Card className="p-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-h3 font-bold text-text-primary mb-xs">显示拼音</h3>
                                    <p className="text-body text-text-secondary">在汉字上方显示拼音注音</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={(pendingSettings || settings).showPinyin || false}
                                        onChange={(e) => setPendingSettings(prev => ({
                                            ...(prev || ensureSafeSettings(settings)),
                                            showPinyin: e.target.checked
                                        }))}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                </label>
                            </div>
                        </Card>
                    </section>
                )}

                {/* 保存设置按钮 */}
                <section className="text-center mt-xl">
                    <Button
                        variant="success"
                        size="large"
                        onClick={handleSaveSettings}
                        disabled={!isChanged}
                        className={cn(
                            "px-2xl py-md text-h2 font-bold shadow-lg transition-all duration-normal",
                            !isChanged ? "opacity-50 cursor-not-allowed shadow-none" : "hover:shadow-xl"
                        )}
                    >
                        保存设置
                    </Button>
                </section>

            </div>



            {/* 重置确认弹框 */}
            <ConfirmDialog
                isOpen={showResetConfirm}
                title="重置学习进度"
                message="确定要重置学习进度吗?此操作不可撤销,将清除所有学习记录。"
                confirmText="确认重置"
                cancelText="取消"
                variant="danger"
                onConfirm={confirmResetProgress}
                onCancel={() => setShowResetConfirm(false)}
            />

            {/* 重置结果弹框 */}
            <ConfirmDialog
                isOpen={resetResult.show}
                title={resetResult.success ? "重置成功" : "重置失败"}
                message={resetResult.message}
                confirmText="确定"
                cancelText=""
                variant={resetResult.success ? "info" : "danger"}
                onConfirm={() => setResetResult({ show: false, success: true, message: '' })}
                onCancel={() => setResetResult({ show: false, success: true, message: '' })}
            />
        </div>
    );
};

export { GameSettingsPage };
