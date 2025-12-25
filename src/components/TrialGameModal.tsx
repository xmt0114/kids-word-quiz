import React, { useState, useEffect, useCallback } from 'react';
import { X, MapPin, ChevronRight, AlertCircle, Loader2, VolumeX } from 'lucide-react';
import { isTTSSupported } from '../utils/tts';
import { ConfirmDialog } from './ConfirmDialog';
import { Card } from './Card';
import { Button } from './Button';
import { wordAPI } from '../utils/api';
import { cn } from '../lib/utils';
import useAppStore from '@/stores/appStore';
import { TextToSpeechButton } from './TextToSpeechButton';
import { PinyinText } from './PinyinText';
interface TrialWord {
    id: string;
    word: string;
    theme: string;
    answer: string;
    options: string[];
    audio_text: string;
    definition: string;
    hint: string;
}

interface TrialConfig {
    title: string;
    gameMode: "practice" | "exam";
    questionType: "text" | "audio";
    answerType: "choice" | "fill";
    ttsLang: "en-US" | "zh-CN" | "en-CN";
    showPinyin: boolean;
}

const TRIAL_CONFIG_MAP: Record<string, TrialConfig> = {
    'zh_puzzle': { title: "趣猜字", gameMode: "practice", questionType: "text", answerType: "choice", ttsLang: "zh-CN", showPinyin: true },
    'en_object': { title: "听音辨物", gameMode: "practice", questionType: "audio", answerType: "choice", ttsLang: "en-US", showPinyin: false },
    'en_spell': { title: "字母侦探", gameMode: "practice", questionType: "text", answerType: "fill", ttsLang: "en-US", showPinyin: false },
    'zh_poetry': { title: "古诗聆赏", gameMode: "practice", questionType: "audio", answerType: "choice", ttsLang: "zh-CN", showPinyin: true },
    'zh_idiom': { title: "成语点睛", gameMode: "practice", questionType: "text", answerType: "choice", ttsLang: "zh-CN", showPinyin: true },
};

interface TrialGameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginClick: () => void;
}

const TrialGameModal: React.FC<TrialGameModalProps> = ({ isOpen, onClose, onLoginClick }) => {
    const [words, setWords] = useState<TrialWord[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showVictory, setShowVictory] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [showTTSWarning, setShowTTSWarning] = useState(false);

    const { playSound } = useAppStore();

    const fetchTrialData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // 这里假设 wordAPI 有 getTrialGameData 或者通过 rpc 库调用
            // 实际上由用户提供的需求得知是通过 RPC get_trial_game_data
            const response = await (wordAPI as any).getTrialGameData?.();
            if (response?.success && response.data?.words) {
                setWords(response.data.words);
            } else {
                setError("无法加载试炼题目，请稍后再试。");
            }
        } catch (err) {
            setError("加载失败，请检查网络连接。");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchTrialData();
            setCurrentIndex(0);
            setUserAnswers({});
            setShowVictory(false);
            setIsCorrect(null);
            setShowExitConfirm(false); // 确保打开时重置
        }
    }, [isOpen, fetchTrialData]);

    if (!isOpen) return null;

    const handleCloseClick = () => {
        playSound('close');
        if (showVictory) {
            onClose();
        } else {
            setShowExitConfirm(true);
        }
    };

    const handleAnswerSubmit = (answer: string) => {
        const currentWord = words[currentIndex];
        const config = TRIAL_CONFIG_MAP[currentWord.theme];
        const correct = answer.toLowerCase().trim() === currentWord.answer.toLowerCase().trim();

        setIsCorrect(correct);
        setUserAnswers(prev => ({ ...prev, [currentIndex]: answer }));

        if (correct) {
            playSound('correct');
        } else {
            playSound('wrong');
        }
    };

    const handleNext = () => {
        playSound('click');
        if (currentIndex < words.length - 1) {
            const nextWord = words[currentIndex + 1];
            const nextConfig = TRIAL_CONFIG_MAP[nextWord.theme];

            // 检查下一个关卡是否是音频题且不支持 TTS
            if (nextConfig.questionType === 'audio' && !isTTSSupported()) {
                setShowTTSWarning(true);
                return;
            }

            setCurrentIndex(prev => prev + 1);
            setIsCorrect(null);
        } else {
            setShowVictory(true);
            playSound('success');
        }
    };

    const renderHeader = () => (
        <div className="flex items-center p-4 md:p-6 bg-white/10 backdrop-blur-md border-b border-white/20 relative">
            {/* 左侧标识 */}
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg transform -rotate-6">
                    <MapPin size={20} className="text-white" />
                </div>
                <div className="flex flex-col">
                    <span className="text-white font-black text-lg md:text-xl tracking-tighter" style={{ fontFamily: '"Noto Sans SC", "KaiTi", "STKaiti", serif' }}>
                        试炼场
                    </span>
                    <span className="text-white/60 text-[10px] uppercase font-bold tracking-widest leading-none">
                        TRIAL MODE
                    </span>
                </div>
            </div>

            {/* 中间玩法地图 */}
            <div className="flex-1 flex justify-center px-4 overflow-x-auto no-scrollbar">
                <div className="flex items-center">
                    {words.map((word, idx) => {
                        const config = TRIAL_CONFIG_MAP[word.theme];
                        const isPassed = userAnswers[idx] !== undefined; // 修正逻辑：只要作答过就变绿
                        const isCurrent = idx === currentIndex;
                        return (
                            <div key={word.id} className="flex items-center">
                                <button
                                    onClick={() => {
                                        const targetWord = words[idx];
                                        const targetConfig = TRIAL_CONFIG_MAP[targetWord.theme];

                                        if (targetConfig.questionType === 'audio' && !isTTSSupported()) {
                                            setShowTTSWarning(true);
                                            return;
                                        }

                                        playSound('pop');
                                        setCurrentIndex(idx);
                                        setIsCorrect(null);
                                    }}
                                    className={cn(
                                        "flex flex-col items-center gap-1 transition-all group",
                                        "cursor-pointer"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all",
                                        isCurrent ? "bg-white text-primary-500 border-white scale-110 shadow-lg ring-4 ring-white/20" :
                                            isPassed ? "bg-green-500 text-white border-green-400" : "bg-white/20 text-white border-white/30"
                                    )}>
                                        {idx + 1}
                                    </div>
                                    <span className={cn(
                                        "text-[11px] md:text-sm font-bold transition-colors",
                                        isCurrent ? "text-white" : "text-white/60 group-hover:text-white"
                                    )} style={{ fontFamily: '"Noto Sans SC", "KaiTi", "STKaiti", serif' }}>
                                        {config?.title || "???"}
                                    </span>
                                </button>
                                {idx < words.length - 1 && (
                                    <div className={cn(
                                        "w-4 md:w-8 h-[2px] mx-1 md:mx-2",
                                        idx < currentIndex ? "bg-green-400" : "bg-white/20"
                                    )} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 右侧关闭按钮 */}
            <div className="w-10 flex justify-end">
                <button
                    onClick={handleCloseClick}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                >
                    <X size={28} />
                </button>
            </div>
        </div>
    );

    const renderFooter = () => (
        <div className="p-4 bg-black/20 text-center text-white/60 text-sm">
            游客体验模式：进度不保存
        </div>
    );

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center text-white space-y-4">
                    <Loader2 size={48} className="animate-spin opacity-50" />
                    <p className="text-lg animate-pulse">正在进入试炼场...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center text-white p-6 text-center space-y-6">
                    <AlertCircle size={64} className="text-red-400" />
                    <h3 className="text-xl font-bold">{error}</h3>
                    <Button onClick={fetchTrialData} variant="secondary">重试</Button>
                </div>
            );
        }

        if (showVictory) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-2xl max-w-lg w-full space-y-8 border-4 border-yellow-400">
                        <div className="space-y-4">
                            <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">试炼完成！</h2>
                            <p className="text-xl md:text-2xl font-bold text-gray-700">太棒了，你刚才体验的只是 0.1% 的内容。</p>
                            <p className="text-gray-500 leading-relaxed">
                                登录即可解锁 <span className="text-primary-600 font-bold">5000+</span> 进阶词汇、<br />
                                <span className="text-secondary-600 font-bold">AI 智能解析</span> 以及海量趣味教育资源。
                            </p>
                        </div>

                        <div className="space-y-4">
                            <Button
                                onClick={onLoginClick}
                                className="w-full py-6 text-xl rounded-2xl bg-gradient-to-r from-primary-500 to-secondary-500 hover:scale-105 transition-transform shadow-xl"
                            >
                                注册开启冒险
                            </Button>
                            <button
                                onClick={() => { setShowVictory(false); setCurrentIndex(0); setIsCorrect(null); setUserAnswers({}); }}
                                className="text-gray-400 hover:text-gray-600 transition-colors font-medium flex items-center justify-center gap-2 mx-auto"
                            >
                                <ChevronRight className="rotate-180" size={18} /> 再玩一次
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        const currentWord = words[currentIndex];
        const config = TRIAL_CONFIG_MAP[currentWord.theme];

        return (
            <div className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col justify-center gap-8">
                {/* 模拟 QuestionStem */}
                <Card className="p-8 md:p-12 bg-white/95 rounded-3xl shadow-xl relative group">
                    <div className="absolute top-0 left-0 w-2 h-full bg-primary-500 rounded-l-3xl" />
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="px-4 py-1.5 bg-primary-100 text-primary-600 rounded-xl text-sm md:text-base font-black uppercase tracking-wider shadow-sm">
                                    {config.title}
                                </span>
                                <span className="text-gray-400 text-xs font-bold tracking-widest">Question {currentIndex + 1}/5</span>
                            </div>

                            {/* 文字题模式，将喇叭放在右上角 */}
                            {config.questionType === 'text' && (
                                <TextToSpeechButton
                                    text={currentWord.audio_text} // 修正：文字题也朗读 audio_text
                                    size="medium"
                                    gameId="" // 试用模式使用空字符串
                                    ttsSettings={{
                                        lang: config.ttsLang,
                                        rate: config.ttsLang.startsWith('zh') ? 0.75 : 0.9, // 中文稍微慢一点
                                        pitch: config.ttsLang.startsWith('zh') ? 1.1 : 1.0,  // 中文音调稍微提一点，更自然
                                        volume: 1.0
                                    }}
                                />
                            )}
                        </div>

                        {/* 这里需要实现类似于 UniversalGamePage 的渲染逻辑，但要更简洁 */}
                        <div className="text-center py-6">
                            {config.questionType === 'audio' ? (
                                <div className="flex flex-col items-center py-8">
                                    <TextToSpeechButton
                                        text={currentWord.audio_text}
                                        size="large"
                                        gameId="" // 试用模式使用空字符串
                                        autoPlay={true} // 自动播放一次
                                        key={`audio-${currentIndex}`} // 题号变化时触发重新挂载/播放
                                        ttsSettings={{
                                            lang: config.ttsLang,
                                            rate: 0.8,
                                            pitch: 1.0,
                                            volume: 1.0
                                        }}
                                        className="scale-150 transition-transform hover:scale-[1.6]"
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <PinyinText
                                        text={currentWord.definition}
                                        showPinyin={config.showPinyin}
                                        size="xl"
                                        className="text-gray-800"
                                        style={{
                                            fontSize: '2.5rem',
                                            lineHeight: '1.4',
                                            fontWeight: '600',
                                            fontFamily: config.ttsLang.startsWith('zh') ? '"KaiTi", "STKaiti", serif' : '"Fredoka", sans-serif'
                                        }}
                                        language={config.ttsLang.startsWith('zh') ? 'zh' : 'en'}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* 模拟 AnswerArea */}
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                    {isCorrect === null ? (
                        config.answerType === 'choice' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {currentWord.options.map((opt, i) => (
                                    <Button
                                        key={opt}
                                        variant="secondary"
                                        onClick={() => handleAnswerSubmit(opt)}
                                        onMouseEnter={() => playSound('hover')}
                                        className="py-10 text-3xl font-bold rounded-2xl hover:scale-[1.02] shadow-sm bg-white hover:bg-white text-gray-700 hover:text-primary-600 border-2 border-transparent hover:border-primary-300 transition-all"
                                        style={{
                                            fontFamily: config.ttsLang.startsWith('zh') ? '"KaiTi", "STKaiti", serif' : '"Fredoka", sans-serif'
                                        }}
                                    >
                                        <span className="mr-3 opacity-20 italic">#{i + 1}</span> {opt}
                                    </Button>
                                ))}
                            </div>
                        ) : (
                            <div className="max-w-md mx-auto w-full flex flex-col gap-4">
                                <div className="text-center text-gray-400 font-medium">提示: {currentWord.hint}</div>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        autoFocus
                                        className="w-full text-center py-6 text-4xl font-black bg-white rounded-2xl border-4 border-gray-100 shadow-xl focus:border-primary-400 focus:ring-8 focus:ring-primary-100 outline-none transition-all tracking-widest text-primary-600"
                                        style={{ fontFamily: '"Fredoka", sans-serif' }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleAnswerSubmit((e.target as HTMLInputElement).value);
                                        }}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">按回车提交</div>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="text-center space-y-6 animate-in fade-in zoom-in">
                            <div className={cn(
                                "inline-flex items-center gap-3 px-8 py-4 rounded-full text-2xl font-black shadow-lg",
                                isCorrect ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                            )}>
                                {isCorrect ? "✨ 回答正确！" : "💔 哎呀，答错啦"}
                            </div>
                            <div>
                                <Button size="large" onClick={handleNext} className="px-12 py-4 rounded-full shadow-xl">
                                    {currentIndex < words.length - 1 ? "下一关" : "查看成就"} <ChevronRight className="inline ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-indigo-500 via-primary-500 to-purple-600 overflow-hidden">
            {renderHeader()}

            {renderContent()}

            {renderFooter()}

            {/* 退出确认弹窗 */}
            {showExitConfirm && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="max-w-sm w-full p-8 text-center space-y-6 transform animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto text-yellow-500">
                            <AlertCircle size={32} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold">确定要离开吗？</h3>
                            <p className="text-gray-500">现在离开将错过【体验勋章】和后续大奖。</p>
                        </div>
                        <div className="flex gap-4">
                            <Button variant="secondary" onClick={() => { playSound('click'); setShowExitConfirm(false); }} className="flex-1">继续挑战</Button>
                            <button
                                onClick={() => {
                                    setShowExitConfirm(false); // 先归位状态
                                    setTimeout(onClose, 50);   // 略微延迟确保状态同步
                                }}
                                className="flex-1 px-4 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full font-bold transition-all"
                            >
                                残忍离开
                            </button>
                        </div>
                    </Card>
                </div>
            )}

            {/* TTS 支持警告弹窗 */}
            <ConfirmDialog
                isOpen={showTTSWarning}
                title="语音功能受限"
                message="您的浏览器不支持语音播放功能，无法进行该试炼关卡。建议更换 Chrome 或 Edge 浏览器以获得完整体验。"
                confirmText="我知道了"
                cancelText=""
                variant="warning"
                onConfirm={() => setShowTTSWarning(false)}
                onCancel={() => setShowTTSWarning(false)}
            />
        </div>
    );
};

export default TrialGameModal;
