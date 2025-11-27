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

    // 浠庤矾鐢辩姸鎬佽幏鍙栬缃?- 鍙俊浠昏矾鐢变紶閫掔殑璁剧疆
    const { settings: routeSettings, collectionId, questions: passedQuestions, isReplay } = location.state || {};

    // 妫€鏌ユ槸鍚︽湁鏈夋晥鐨勮矾鐢辫缃?    const hasValidRouteSettings = routeSettings && collectionId;

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

    // 鍔犺浇娓告垙淇℃伅浠ヨ幏鍙栬瑷€璁剧疆
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

    // 鑾峰彇鏁欐潗淇℃伅骞跺垵濮嬪寲娓告垙
    useEffect(() => {
        if (!hasValidRouteSettings) {
            // 濡傛灉娌℃湁鏈夋晥鐨勮矾鐢辫缃紝鏄剧ず閿欒鎻愮ず
            alert('閿欒锛氭棤鏁堢殑璺敱璁块棶锛佽浠庨椤垫纭繘鍏ユ父鎴忋€?);
            navigate('/');
            return;
        }

        // 闃叉閲嶅鍒濆鍖?        if (isInitializing) {
            return;
        }

        setIsInitializing(true);

        const initializeGame = async () => {
            try {
                // 浣跨敤璺敱浼犻€掔殑璁剧疆
                const finalSettings: QuizSettings = {
                    questionType: routeSettings.questionType || 'text',
                    answerType: routeSettings.answerType || 'choice',
                    selectionStrategy: routeSettings.selectionStrategy || 'sequential',
                    showPinyin: routeSettings.showPinyin, // Fix: Pass showPinyin setting
                    tts: routeSettings.tts, // Fix: Pass TTS settings
                    collectionId
                };

                console.log('馃幃 [UniversalGamePage] 鍒濆鍖栨父鎴忚缃?', finalSettings);

                // 濡傛灉鏄噸鏂板涔狅紙浣跨敤鐩稿悓鍗曡瘝锛?                if (isReplay && passedQuestions && passedQuestions.length > 0) {
                    console.log('[GamePage] 浣跨敤鐩稿悓鍗曡瘝閲嶆柊瀛︿範:', passedQuestions.length);

                    // 鐩存帴浣跨敤浼犻€掕繃鏉ョ殑鍗曡瘝锛屼笉鏇存柊杩涘害
                    await initializeQuiz(finalSettings, collectionId, 0, passedQuestions);
                    return;
                }

                // 姝ｅ父娴佺▼锛氫娇鐢ㄦ柊鐨凴PC鍑芥暟鑾峰彇瀛︿範浼氳瘽
                console.log('[GamePage] 浣跨敤 get_my_study_session RPC 鑾峰彇棰樼洰:', {
                    collectionId,
                    sessionSize: 10,
                    studyMode: finalSettings.selectionStrategy
                });

                // 璋冪敤鏂扮殑RPC鍑芥暟鑾峰彇瀛︿範浼氳瘽
                const sessionResp = await (wordAPI.getStudySession?.({
                    collectionId,
                    sessionSize: 10,
                    studyMode: finalSettings.selectionStrategy,
                }))

                if (!sessionResp || !sessionResp.success) {
                    throw new Error(`鑾峰彇瀛︿範浼氳瘽澶辫触${sessionResp?.error ? `: ${sessionResp.error}` : ''}`);
                }

                const words = sessionResp.data || [];
                if (words.length === 0) {
                    throw new Error('娌℃湁鍙敤鐨勫涔犲唴瀹?);
                }

                console.log('[GamePage] 鑾峰彇鍒板涔犱細璇?', {
                    wordCount: words.length,
                    studyMode: finalSettings.selectionStrategy
                });

                // 鐩存帴浣跨敤RPC杩斿洖鐨勫崟璇嶆暟鎹垵濮嬪寲Quiz
                // RPC宸茬粡澶勭悊浜唎ffset鍜岄殢鏈哄寲閫昏緫
                await initializeQuiz(finalSettings, collectionId, 0, words);
            } catch (err) {
                console.error('Failed to initialize quiz:', err);
            } finally {
                setIsInitializing(false);
            }
        };

        initializeGame();
    }, [routeSettings, collectionId, hasValidRouteSettings, navigate, isReplay, passedQuestions]);

    // 妫€娴嬪睆骞曢珮搴﹀苟鍔ㄦ€佽皟鏁村竷灞€
    useEffect(() => {
        const updateViewportHeight = () => {
            setViewportHeight(window.innerHeight);
        };

        // 鍒濆妫€娴?        updateViewportHeight();

        // 鐩戝惉绐楀彛澶у皬鍙樺寲
        window.addEventListener('resize', updateViewportHeight);

        return () => {
            window.removeEventListener('resize', updateViewportHeight);
        };
    }, []);

    // 鏍规嵁灞忓箷楂樺害璁＄畻鍔ㄦ€侀棿璺?    const getDynamicSpacing = () => {
        // 榛樿澶у睆骞曞竷灞€
        let spacing = {
            container: 'p-sm md:p-lg',
            navbar: 'mb-lg',
            content: 'mb-lg',
            cardPadding: 'p-xl md:p-2xl',
            questionArea: 'mb-lg',
            buttonArea: 'pt-lg'
        };

        // 灏忓睆骞?(< 600px) 浣跨敤绱у噾甯冨眬
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
        // 涓瓑灞忓箷 (600px - 799px) 浣跨敤涓瓑甯冨眬
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

    // 澶勭悊鎻愪氦绛旀
    const handleSubmitAnswer = (answer: string) => {
        submitAnswer(answer);
        setShowResult(true);

        // 妫€鏌ョ瓟妗堟槸鍚︽纭?        const correct = answer.toLowerCase().trim() === currentWord.answer.toLowerCase().trim();
        setIsCorrect(correct);

        if (correct) {
            setShowStarExplosion(true);
            setTimeout(() => setShowStarExplosion(false), 2000);
        }
    };

    // 澶勭悊涓嬩竴棰?    const handleNextQuestion = async () => {
        if (quizState.currentQuestionIndex >= quizState.questions.length - 1) {
            // 鎵€鏈夐鐩畬鎴愶紝鏄剧ず缁撴灉
            const result = getResult();
            updateStats(result.correctAnswers, result.totalQuestions);

            // 鎻愪氦绛旈缁撴灉鍒板悗绔?- 鍙湪闈瀝eplay妯″紡涓嬫彁浜?            if (!isReplay) {
                console.log('[GamePage] 鎻愪氦绛旈缁撴灉鍒板悗绔?..', quizState.results);
                const submitResult = await submitResults(quizState.results);

                if (!submitResult.success) {
                    console.warn('[GamePage] 鎻愪氦绛旈缁撴灉澶辫触:', submitResult.error);
                } else {
                    console.log('[GamePage] 绛旈缁撴灉鎻愪氦鎴愬姛');
                }
            }

            // 瀵艰埅鍒扮粨鏋滈〉锛屾敞鎰忚繖閲屾垜浠彲鑳介渶瑕佷竴涓€氱敤鐨勭粨鏋滈〉锛屾垨鑰呭鐢?GuessWordResultPage
            // 鏆傛椂澶嶇敤 GuessWordResultPage锛屽洜涓哄畠姣旇緝閫氱敤
            navigate('/guess-word/result', {
                state: {
                    result,
                    settings: routeSettings,
                    collectionId,
                    questions: quizState.questions, // 浼犻€掓湰杞崟璇嶅垪琛?                    gameId // 浼犻€?gameId
                }
            });
        } else {
            nextQuestion();
            setShowResult(false);
            setSelectedAnswer('');
            setInputAnswer('');
        }
    };

    // 澶勭悊涓婁竴棰?    const handlePreviousQuestion = () => {
        previousQuestion();
        setShowResult(false);
        setSelectedAnswer('');
        setInputAnswer('');
    };

    // 澶勭悊杩斿洖棣栭〉
    const handleBackToHome = () => {
        navigate('/');
    };

    // 閿欒澶勭悊鐣岄潰
    if (error) {
        return (
            <div className="min-h-screen bg-background-primary flex items-center justify-center p-lg">
                <div className="bg-white rounded-lg p-xl shadow-card text-center max-w-md">
                    <div className="text-6xl mb-md">馃様</div>
                    <h2 className="text-h2 font-bold text-error mb-md">
                        鍝庡憖锛屽嚭鐜伴棶棰樹簡
                    </h2>
                    <p className="text-body text-text-secondary mb-lg">
                        {error}
                    </p>

                    {retryCount > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-md mb-lg">
                            <p className="text-small text-yellow-700">
                                姝ｅ湪閲嶈瘯... (绗?{retryCount} 娆″皾璇?
                            </p>
                        </div>
                    )}

                    <div className="space-y-md">
                        <button
                            className="w-full bg-primary-500 text-white px-lg py-md rounded-full font-bold hover:bg-primary-600 transition-colors"
                            onClick={() => restartQuiz()}
                        >
                            閲嶆柊寮€濮?                        </button>

                        <button
                            className="w-full bg-gray-200 text-gray-700 px-lg py-md rounded-full font-bold hover:bg-gray-300 transition-colors"
                            onClick={handleBackToHome}
                        >
                            杩斿洖棣栭〉
                        </button>
                    </div>

                    <div className="mt-lg text-small text-text-tertiary">
                        濡傛灉闂鎸佺画鍑虹幇锛岃灏濊瘯鍒锋柊椤甸潰
                    </div>
                </div>
            </div>
        );
    }

    // 鍔犺浇鐘舵€?    if (!currentWord || isLoading) {
        return (
            <div className={`min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 ${spacing.container}`}>
                <div className="max-w-4xl mx-auto">
                    {/* 瀵艰埅鏍?*/}
                    <div className={`flex items-center justify-between ${spacing.navbar}`}>
                        <Button
                            variant="secondary"
                            onClick={handleBackToHome}
                            className="flex items-center gap-sm"
                        >
                            <Home size={20} />
                            杩斿洖棣栭〉
                        </Button>
                        <div className="text-center">
                            <h1 className="text-h2 font-bold text-text-primary">娓告垙鍔犺浇涓?/h1>
                        </div>
                        <div></div>
                    </div>

                    <div className="text-center py-2xl">
                        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-md" />
                        <p className="text-body text-text-secondary">
                            {isLoading ? '姝ｅ湪鍔犺浇棰樼洰...' : '鍑嗗涓?..'}
                        </p>
                        {retryCount > 0 && (
                            <p className="text-small text-text-tertiary mt-sm">
                                姝ｅ湪閲嶈瘯杩炴帴... (绗?{retryCount} 娆?
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
            {/* 鏄熺┖鐖嗙偢鏁堟灉 */}
            {showStarExplosion && <StarExplosion isVisible={showStarExplosion} />}

            <div className="max-w-4xl mx-auto">
                {/* 瀵艰埅鏍?*/}
                <div className={`flex items-center justify-between ${spacing.navbar}`}>
                    <Button
                        variant="secondary"
                        onClick={handleBackToHome}
                        className="flex items-center gap-sm"
                    >
                        <Home size={20} />
                        杩斿洖棣栭〉
                    </Button>
                    <div className="text-center">
                        <h1 className="text-h2 font-bold text-text-primary">鐚滃崟璇?/h1>
                        <div className="flex items-center justify-center gap-md">
                            <p className="text-small text-text-secondary">
                                绗?{quizState.currentQuestionIndex + 1} 棰?/ 鍏?{quizState.questions.length} 棰?                            </p>
                            <ProgressBar
                                current={quizState.currentQuestionIndex + 1}
                                total={quizState.questions.length}
                                className="w-24"
                            />
                        </div>
                    </div>
                    <div></div>
                </div>

                {/* 棰樼洰鍗＄墖 */}
                <Card className={`${spacing.cardPadding} mb-lg`}>
                    {/* 棰樼洰鍖哄煙 */}
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

                        {/* 绛旈鍖哄煙 */}
                        <div className="space-y-lg">
                            {quizState.settings.answerType === 'choice' ? (
                                // 閫夋嫨棰?                                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
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
                                // 濉┖棰?                                <div className="space-y-md">
                                    <Input
                                        value={inputAnswer}
                                        onChange={(value) => setInputAnswer(value)}
                                        placeholder="璇疯緭鍏ヤ綘鐨勭瓟妗?.."
                                        disabled={showResult}
                                        onSubmit={() => {
                                            if (!showResult) {
                                                handleAnswerSubmit();
                                            }
                                        }}
                                    />

                                </div>
                            )}

                            {/* 绛旈缁撴灉 */}
                            {showResult && (
                                <div className={cn(
                                    'flex items-center justify-center gap-sm p-md rounded-lg',
                                    isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
                                )}>
                                    {isCorrect ? (
                                        <>
                                            <CheckCircle size={24} className="text-green-500" />
                                            <span className="text-h3 font-bold text-green-600">鍥炵瓟姝ｇ‘</span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle size={24} className="text-red-500" />
                                            <span className="text-h3 font-bold text-red-600">鍐嶈瘯涓€娆″惂</span>
                                        </>
                                    )}

                                    {/* 鍙湁濉┖棰樻墠鏄剧ず绛旀 */}
                                    {quizState.settings.answerType === 'fill' && (
                                        <span className={cn(
                                            'text-h3 font-bold',
                                            isCorrect ? 'text-green-600' : 'text-red-600'
                                        )}>
                                            姝ｇ‘绛旀锛歿currentWord.answer}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 鎿嶄綔鎸夐挳鍖哄煙 */}
                    <div className={`flex items-center justify-between ${spacing.buttonArea} border-t border-gray-200`}>
                        <Button
                            variant="secondary"
                            onClick={handlePreviousQuestion}
                            disabled={!canGoPrevious}
                            className="flex items-center gap-sm"
                        >
                            <ArrowLeft size={20} />
                            涓婁竴棰?                        </Button>

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
                                鎻愪氦绛旀
                            </Button>

                            <Button
                                onClick={handleNextQuestion}
                                className="flex items-center gap-sm"
                            >
                                {isLastQuestion ? '鏌ョ湅缁撴灉' : '涓嬩竴棰?}
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
