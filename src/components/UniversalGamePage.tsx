import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Card } from './Card';
import { Button } from './Button';
import { OptionButton } from './OptionButton';
import { Input } from './Input';
import { ProgressBar } from './ProgressBar';
import { StarExplosion } from './StarExplosion';
import { QuizSettings, Game } from '../types';
import { CheckCircle, XCircle, ArrowRight, ArrowLeft, Home, Trophy, Smile, BookOpen, AlertCircle, Gamepad2 } from 'lucide-react';
import { TextToSpeechButton } from './TextToSpeechButton';
import { PinyinText } from './PinyinText';
import { AutoSizeText } from './AutoSizeText';
import { GameTimer } from './GameTimer';
import { cn } from '../lib/utils';
import { useQuiz } from '../hooks/useQuiz';
// localStorage统计已移除，使用后端进度系统
import { wordAPI } from '../utils/api';
import useAppStore from '@/stores/appStore';

const UniversalGamePage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { gameId } = useParams<{ gameId: string }>();
    // 使用后端进度系统，不再需要本地统计

    // 从路由状态获取设置 - 只信任路由传递的设置
    const { settings: routeSettings, collectionId, questions: passedQuestions, isReplay } = location.state || {};

    // 检查是否有有效的路由设置
    const hasValidRouteSettings = routeSettings && collectionId;

    const {
        quizState,
        isLoading,
        error,
        retryCount,
        initializeQuiz,
        submitAnswer,
        submitResults,
        nextQuestion,
        previousQuestion,
        getCurrentQuestion,
        getResult,
        restartQuiz,
        setError,
    } = useQuiz();

    const [selectedAnswer, setSelectedAnswer] = useState<string>('');
    const [inputAnswer, setInputAnswer] = useState<string>('');
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [showStarExplosion, setShowStarExplosion] = useState(false);
    const [viewportHeight, setViewportHeight] = useState(0);
    const [isInitializing, setIsInitializing] = useState(false);
    const [gameInfo, setGameInfo] = useState<Game | null>(null);

    // 从store获取游戏信息
    const { games } = useAppStore();

    useEffect(() => {
        if (!gameId || !games) return;

        const game = games.find(g => g.id === gameId);
        if (game) {
            setGameInfo(game);
        }
    }, [gameId, games]);

    // 获取教材信息并初始化游戏
    useEffect(() => {
        if (!hasValidRouteSettings) {
            // 如果没有有效的路由设置，显示错误提示
            alert('错误：无效的路由访问！请从首页正确进入游戏。');
            navigate('/');
            return;
        }

        // 防止重复初始化
        if (isInitializing) {
            return;
        }

        setIsInitializing(true);

        const initializeGame = async () => {
            try {
                // 使用路由传递的设置
                const finalSettings: QuizSettings = {
                    questionType: routeSettings.questionType || 'text',
                    answerType: routeSettings.answerType || 'choice',
                    selectionStrategy: routeSettings.selectionStrategy || 'sequential',
                    showPinyin: routeSettings.showPinyin,
                    tts: routeSettings.tts,
                    collectionId
                };

                console.log('🎮 [UniversalGamePage] 初始化游戏设置:', finalSettings);

                // 如果是重新学习（使用相同单词）
                if (isReplay && passedQuestions && passedQuestions.length > 0) {
                    console.log('[GamePage] 使用相同单词重新学习:', passedQuestions.length);

                    // 直接使用传递过来的单词，不更新进度
                    await initializeQuiz(finalSettings, collectionId, 0, passedQuestions);
                    return;
                }

                // 正常流程：使用新的RPC函数获取学习会话
                console.log('[GamePage] 使用 get_my_study_session RPC 获取题目:', {
                    collectionId,
                    sessionSize: 10,
                    studyMode: finalSettings.selectionStrategy
                });

                // 调用新的RPC函数获取学习会话
                const sessionResp = await (wordAPI.getStudySession?.({
                    collectionId,
                    sessionSize: 10,
                    studyMode: finalSettings.selectionStrategy,
                }))

                if (!sessionResp || !sessionResp.success) {
                    throw new Error(`获取学习会话失败${sessionResp?.error ? `: ${sessionResp.error}` : ''}`);
                }

                const words = sessionResp.data || [];

                // 处理空列表情况：区分"今日无词"和"教材学完"
                if (words.length === 0) {
                    console.log('[GamePage] 获取到的单词列表为空，检查教材进度...');

                    // 获取教材进度
                    const progressResp = await wordAPI.getCollectionProgress?.(collectionId);

                    if (progressResp?.success && progressResp.data) {
                        const progress = progressResp.data;
                        console.log('[GamePage] 教材进度:', progress);

                        // 情况1: 教材本身没有单词 (total_words === 0)
                        if (progress.total_words === 0) {
                            throw new Error('本教材暂时还没有添加单词哦！');
                        }
                        // 情况2: 所有单词都已掌握 (mastered_words === total_words)
                        else if (progress.mastered_words === progress.total_words) {
                            throw new Error('恭喜！你已经学完了本教材的所有单词！');
                        }
                        // 情况3: 还有单词没掌握，但今天没有新词/复习词 (remaining_words === 0 && learning_words > 0)
                        // 或者单纯就是今天任务完成了
                        else {
                            throw new Error('您今天的学习内容完成了哦，建议您换一个教材或者去玩其他游戏吧');
                        }
                    } else {
                        // 如果获取进度失败，显示通用提示
                        throw new Error('当前没有可用的学习内容');
                    }
                }

                console.log('[GamePage] 获取到学习会话:', {
                    wordCount: words.length,
                    studyMode: finalSettings.selectionStrategy
                });

                // 直接使用RPC返回的单词数据初始化Quiz
                // RPC已经处理了offset和随机化逻辑
                await initializeQuiz(finalSettings, collectionId, 0, words);
            } catch (err) {
                console.error('Failed to initialize quiz:', err);
                const errorMessage = err instanceof Error ? err.message : '初始化游戏失败';
                // 使用 setError 更新 UI 状态
                setError(errorMessage);
            } finally {
                setIsInitializing(false);
            }
        };

        initializeGame();
    }, [routeSettings, collectionId, hasValidRouteSettings, navigate, isReplay, passedQuestions]);

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

        // 小屏幕 (< 600px) 使用紧凑布局
        if (viewportHeight > 0 && viewportHeight < 600) {
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
            spacing = {
                container: 'p-xs',
                navbar: 'mb-xs',
                content: 'mb-xs',
                cardPadding: 'p-md',
                questionArea: 'mb-xs',
                buttonArea: 'pt-xs'
            };
        }

        return spacing;
    };

    const spacing = getDynamicSpacing();

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
    const handleNextQuestion = async () => {
        if (quizState.currentQuestionIndex >= quizState.questions.length - 1) {
            // 所有题目完成，显示结果
            const result = getResult();
            // 统计数据现在通过后端进度系统管理，无需本地更新

            // 提交答题结果到后端 - 只在非replay模式下提交
            if (!isReplay) {
                console.log('[GamePage] 提交答题结果到后端...', quizState.results);
                const submitResult = await submitResults(quizState.results);

                if (!submitResult.success) {
                    console.warn('[GamePage] 提交答题结果失败:', submitResult.error);
                } else {
                    console.log('[GamePage] 答题结果提交成功');
                }
            }

            // 构建详细的题目结果数据
            const questionResults = quizState.results?.map((result, index) => ({
                questionIndex: index,
                question: quizState.questions[index],
                userAnswer: result?.answer || '未作答',
                isCorrect: result?.isCorrect || false,
                timeSpent: result?.timeSpent // 使用真实的单题计时
            })) || [];

            // 计算总用时
            const totalTimeSpent = quizState.startTime 
                ? (Date.now() - quizState.startTime) / 1000 
                : undefined;

            // 导航到结果页
            navigate(`/games/${gameId}/result`, {
                state: {
                    result,
                    settings: routeSettings,
                    collectionId,
                    questions: quizState.questions, // 传递本轮单词列表
                    questionResults, // 传递真实的答题结果
                    gameId, // 传递 gameId
                    startTime: quizState.startTime, // 传递开始时间
                    endTime: Date.now(), // 传递结束时间
                    timeSpent: totalTimeSpent // 传递总用时
                }
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
        // 根据错误信息判断显示类型
        let icon = <AlertCircle size={80} className="text-red-500" />;
        let title = "哎呀，出现问题了";
        let titleColor = "text-red-500";
        let showRetry = true;
        let bgGradient = "from-red-50 to-orange-50";

        if (error.includes('学完了本教材')) {
            icon = <Trophy size={80} className="text-yellow-500 drop-shadow-lg" />;
            title = "太棒了！";
            titleColor = "text-yellow-600";
            showRetry = false;
            bgGradient = "from-yellow-50 to-orange-50";
        } else if (error.includes('今天的学习内容完成了')) {
            icon = <Smile size={80} className="text-green-500 drop-shadow-lg" />;
            title = "今日任务完成";
            titleColor = "text-green-600";
            showRetry = false;
            bgGradient = "from-green-50 to-emerald-50";
        } else if (error.includes('还没有添加单词')) {
            icon = <BookOpen size={80} className="text-blue-500 drop-shadow-lg" />;
            title = "教材为空";
            titleColor = "text-blue-600";
            showRetry = false;
            bgGradient = "from-blue-50 to-indigo-50";
        }

        return (
            <div className={`min-h-screen bg-gradient-to-b ${bgGradient} flex items-center justify-center p-lg`}>
                <Card className="max-w-md w-full text-center p-xl md:p-2xl shadow-card-hover border-2 border-white/50 backdrop-blur-sm">
                    <div className="flex justify-center mb-lg animate-bounce-slow">
                        <div className="p-md bg-white rounded-full shadow-md">
                            {icon}
                        </div>
                    </div>
                    <h2 className={`text-3xl font-bold ${titleColor} mb-md tracking-tight`}>
                        {title}
                    </h2>
                    <p className="text-lg text-text-secondary mb-xl leading-relaxed">
                        {error}
                    </p>

                    {showRetry && retryCount > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-md mb-lg animate-pulse">
                            <p className="text-small text-yellow-700 font-medium">
                                正在重试... (第 {retryCount} 次尝试)
                            </p>
                        </div>
                    )}

                    <div className="space-y-md">
                        {showRetry && (
                            <button
                                className="w-full bg-primary-500 text-white px-xl py-lg rounded-full font-bold text-lg hover:bg-primary-600 transition-all shadow-button hover:shadow-button-hover active:scale-95 transform"
                                onClick={() => restartQuiz()}
                            >
                                重新开始
                            </button>
                        )}

                        {/* 如果是今日任务完成，显示去玩其他游戏的建议 */}
                        {error.includes('今天的学习内容完成了') && (
                            <button
                                className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white px-xl py-lg rounded-full font-bold text-lg hover:from-green-500 hover:to-emerald-600 transition-all shadow-button hover:shadow-button-hover active:scale-95 transform flex items-center justify-center gap-md mb-md"
                                onClick={() => navigate('/')}
                            >
                                <Gamepad2 size={24} />
                                去玩其他游戏
                            </button>
                        )}

                        <button
                            className="w-full bg-white border-2 border-gray-200 text-gray-600 px-xl py-lg rounded-full font-bold text-lg hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 transform"
                            onClick={handleBackToHome}
                        >
                            返回首页
                        </button>
                    </div>

                    {showRetry && (
                        <div className="mt-xl text-sm text-text-tertiary">
                            如果问题持续出现，请尝试刷新页面
                        </div>
                    )}
                </Card>
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
                            className="flex items-center gap-2 px-6 py-3 text-base font-medium"
                            style={{ fontFamily: 'Noto Sans SC, Fredoka, sans-serif' }}
                        >
                            <Home size={22} />
                            返回首页
                        </Button>
                        <div className="text-center">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent" style={{ fontFamily: 'Noto Sans SC, Fredoka, sans-serif' }}>
                                游戏加载中
                            </h1>
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
                        className="flex items-center gap-2 px-6 py-3 text-base font-medium"
                        style={{ fontFamily: 'Noto Sans SC, Fredoka, sans-serif' }}
                    >
                        <Home size={22} />
                        返回首页
                    </Button>

                    <div className="text-center">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent" style={{ fontFamily: 'Noto Sans SC, Fredoka, sans-serif' }}>
                            {gameInfo?.title || '猜单词'}
                        </h1>
                    </div>

                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-4 mb-2">
                            <GameTimer 
                                startTime={quizState.startTime}
                                size="medium"
                                className="text-text-secondary"
                            />
                            <p className="text-sm font-medium text-text-secondary" style={{ fontFamily: 'Noto Sans SC, Fredoka, sans-serif' }}>
                                第 {quizState.currentQuestionIndex + 1} 题 / 共 {quizState.questions.length} 题
                            </p>
                        </div>
                        <ProgressBar
                            current={quizState.currentQuestionIndex + 1}
                            total={quizState.questions.length}
                            className="w-40 h-3"
                        />
                    </div>
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
                                <div className="relative">
                                    {/* 朗读按钮 - 浮动在右上角 */}
                                    <div className="absolute -top-2 -right-2 z-10">
                                        <TextToSpeechButton
                                            text={currentWord.definition}
                                            size="large"
                                            ttsSettings={quizState.settings.tts}
                                        />
                                    </div>

                                    {/* 题干内容区域 */}
                                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl px-6 py-10 mb-8 shadow-sm">
                                        {quizState.settings.showPinyin ? (
                                            <PinyinText
                                                text={currentWord.definition}
                                                showPinyin={quizState.settings.showPinyin}
                                                size="xl"
                                                language={gameInfo?.language as 'zh' | 'en'}
                                                className={cn(
                                                    "block text-center",
                                                    gameInfo?.language === 'zh'
                                                        ? "font-serif font-bold text-3xl leading-relaxed"
                                                        : "text-4xl leading-tight"
                                                )}
                                                style={gameInfo?.language === 'en' ? {
                                                    fontFamily: 'Nunito, sans-serif',
                                                    lineHeight: '1.2',
                                                    letterSpacing: '0.01em',
                                                    fontSize: '2.25rem',
                                                    fontWeight: '400',
                                                    minHeight: '5.5rem'
                                                } : {}}
                                            />
                                        ) : (
                                            <AutoSizeText
                                                text={currentWord.definition}
                                                maxLines={2}
                                                minFontSize={18}
                                                maxFontSize={gameInfo?.language === 'zh' ? 32 : 36}
                                                language={gameInfo?.language as 'zh' | 'en'}
                                                className="font-medium"
                                                style={gameInfo?.language === 'zh' ? {
                                                    fontWeight: '600'
                                                } : {
                                                    fontWeight: '400',
                                                    letterSpacing: '0.01em'
                                                }}
                                            />
                                        )}
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
                                            option={
                                                <PinyinText
                                                    text={option}
                                                    showPinyin={quizState.settings.showPinyin}
                                                    size="medium"
                                                    language={gameInfo?.language as 'zh' | 'en'}
                                                    className={cn(
                                                        "text-3xl font-bold",
                                                        gameInfo?.language === 'zh' ? "font-serif" : ""
                                                    )}
                                                    style={gameInfo?.language === 'en' ? {
                                                        fontFamily: 'Fredoka, sans-serif',
                                                        letterSpacing: '0.02em',
                                                        fontWeight: '800'
                                                    } : {
                                                        fontFamily: 'KaiTi, STKaiti, 楷体, serif',
                                                        fontWeight: '700'
                                                    }}
                                                />
                                            }
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
            </div >
        </div >
    );
};

export { UniversalGamePage };
