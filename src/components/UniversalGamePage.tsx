import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Card } from './Card';
import { Button } from './Button';
import { OptionButton } from './OptionButton';
import { Input } from './Input';
import { ProgressBar } from './ProgressBar';
import { StarExplosion } from './StarExplosion';
import { QuizSettings, Game } from '../types';
import { CheckCircle, XCircle, ArrowRight, ArrowLeft, Home } from 'lucide-react';
import { TextToSpeechButton } from './TextToSpeechButton';
import { PinyinText } from './PinyinText';
import { cn } from '../lib/utils';
import { useQuiz } from '../hooks/useQuiz';
import { useQuizStats } from '../hooks/useLocalStorage';
import { wordAPI } from '../utils/api';

const UniversalGamePage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { gameId } = useParams<{ gameId: string }>();
    const { updateStats } = useQuizStats();

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
    } = useQuiz();

    const [selectedAnswer, setSelectedAnswer] = useState<string>('');
    const [inputAnswer, setInputAnswer] = useState<string>('');
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [showStarExplosion, setShowStarExplosion] = useState(false);
    const [viewportHeight, setViewportHeight] = useState(0);
    // const questionTextRef = useRef<HTMLParagraphElement>(null); // Removed unused ref
    const [isInitializing, setIsInitializing] = useState(false);
    const [gameInfo, setGameInfo] = useState<Game | null>(null);

    // 加载游戏信息以获取语言设置
    useEffect(() => {
        const loadGameInfo = async () => {
            if (!gameId) return;
            try {
                if (wordAPI.getGames) {
                    const response = await wordAPI.getGames();
                    if (response.success && response.data) {
                        const game = response.data.find(g => g.id === gameId);
                        if (game) {
                            setGameInfo(game);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to load game info:', error);
            }
        };
        loadGameInfo();
    }, [gameId]);

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
                    showPinyin: routeSettings.showPinyin, // Fix: Pass showPinyin setting
                    tts: routeSettings.tts, // Fix: Pass TTS settings
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
                if (words.length === 0) {
                    throw new Error('没有可用的学习内容');
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
            updateStats(result.correctAnswers, result.totalQuestions);

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

            // 导航到结果页，注意这里我们可能需要一个通用的结果页，或者复用 GuessWordResultPage
            // 暂时复用 GuessWordResultPage，因为它比较通用
            navigate('/guess-word/result', {
                state: {
                    result,
                    settings: routeSettings,
                    collectionId,
                    questions: quizState.questions, // 传递本轮单词列表
                    gameId // 传递 gameId
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
                            <h1 className="text-h2 font-bold text-text-primary">游戏加载中</h1>
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
                                    <div className="pr-12">
                                        <PinyinText
                                            text={currentWord.definition}
                                            showPinyin={quizState.settings.showPinyin}
                                            size="xl"
                                            className={cn(
                                                "text-h2 leading-relaxed block",
                                                gameInfo?.language === 'zh' ? "font-serif" : "font-sans"
                                            )}
                                        />
                                    </div>
                                    <div className="absolute top-4 right-4">
                                        <TextToSpeechButton
                                            text={currentWord.definition}
                                            size="small"
                                            ttsSettings={quizState.settings.tts}
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
                                            option={
                                                <PinyinText
                                                    text={option}
                                                    showPinyin={quizState.settings.showPinyin}
                                                    size="medium"
                                                    className={cn(
                                                        "text-4xl", // Significantly increased font size for options
                                                        gameInfo?.language === 'zh' ? "font-serif" : "font-sans"
                                                    )}
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
