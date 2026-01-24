
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTypingGame } from '../../hooks/useTypingGame';
import { useAppStore } from '../../stores/appStore';
import { VirtualKeyboard } from './VirtualKeyboard';
import { HandGuides } from './HandGuides';
import { TypingStream } from './TypingStream';
import { LevelSidebar } from './LevelSidebar';
import { SettingsModal } from './SettingsModal';
import { Button } from '../Button';
import { ArrowLeft, RefreshCw, Trophy, Target, Menu, Play, Settings, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';

export const TypingGamePage: React.FC = () => {
    const navigate = useNavigate();
    const {
        gameState,
        config,
        userProgress,
        settings,
        startLevel,
        nextLevel,
        restartLevel,
        updateSettings
    } = useTypingGame();

    const { playSound, games, loadHomepageData, gamesLoading } = useAppStore();

    // Ensure data is loaded if accessed directly / refreshed
    useEffect(() => {
        if (games.length === 0 && !gamesLoading) {
            loadHomepageData();
        }
    }, [games.length, gamesLoading, loadHomepageData]);

    const [showStartModal, setShowStartModal] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const settingsChangedRef = React.useRef(false);

    // Preload hand images
    useEffect(() => {
        const leftHand = new Image();
        leftHand.src = '/img/left_hand.png';
        const rightHand = new Image();
        rightHand.src = '/img/right_hand.png';
    }, []);

    // Determines if there is a next level available
    const hasNextLevel = () => {
        const currentChap = config.chapters[gameState.currentChapterIndex];
        if (!currentChap) return false;

        // If not last level in chapter
        if (gameState.currentLevelIndex < currentChap.levels.length - 1) return true;

        // If last level, check if next chapter exists
        return gameState.currentChapterIndex < config.chapters.length - 1;
    };

    const currentChapter = config.chapters[gameState.currentChapterIndex];
    const currentLevel = currentChapter?.levels[gameState.currentLevelIndex];

    const getTargetChar = () => {
        if (!gameState.targetSequence || gameState.cursorPosition >= gameState.targetSequence.length) return '';
        return gameState.targetSequence[gameState.cursorPosition];
    };

    const handleStart = () => {
        setShowStartModal(false);
        if (gameState.status === 'level-success' || gameState.status === 'level-failed' || gameState.status === 'idle') {
            restartLevel();
        }
    };

    const handleNextLevel = () => {
        nextLevel();
    };

    const handleSelectLevel = (cIdx: number, lIdx: number) => {
        startLevel(cIdx, lIdx);
        setShowStartModal(true);
    };

    const handleUpdateSettings = (newSettings: any) => {
        updateSettings(newSettings);
        settingsChangedRef.current = true;
    };

    const handleCloseSettings = () => {
        setIsSettingsOpen(false);
        if (settingsChangedRef.current) {
            restartLevel();
            settingsChangedRef.current = false;
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Skip repeated keydown events when a key is held down
            if (e.repeat) return;

            // Ignore if modals are open
            if (isSettingsOpen || isSidebarOpen) return;

            if (gameState.status === 'level-success') {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (hasNextLevel()) handleNextLevel();
                }
            } else if (gameState.status === 'level-failed') {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    restartLevel();
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [gameState.status, handleNextLevel, restartLevel, isSettingsOpen, isSidebarOpen]);

    if (!currentChapter || !currentLevel) return <div>Loading...</div>;

    const progress = Math.min(100, (gameState.cursorPosition / (gameState.targetSequence.length || 1)) * 100);

    return (
        <div className="h-[calc(100vh-64px)] bg-slate-50 flex flex-col items-center justify-start font-sans overflow-hidden relative">

            <LevelSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                config={config}
                currentChapterIndex={gameState.currentChapterIndex}
                currentLevelIndex={gameState.currentLevelIndex}
                userProgress={userProgress}
                onSelectLevel={handleSelectLevel}
            />

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={handleCloseSettings}
                settings={settings}
                onUpdate={handleUpdateSettings}
                playSound={playSound}
            />

            {/* Unified Glass Workstation Container */}
            <div className="flex-none w-full max-w-7xl px-4 z-10 flex flex-col overflow-hidden mt-8">
                <div className="w-full bg-white/60 backdrop-blur-sm rounded-[40px] shadow-xl p-4 sm:p-6 lg:p-10 border border-white/50 flex flex-col gap-6 items-center">

                    {/* Dashboard Section */}
                    <div className="w-full bg-white/50 rounded-3xl border border-white/60 p-6 space-y-4 shadow-sm relative">
                        {/* Header Row */}
                        <div className="flex justify-between items-center relative">
                            {/* Left: Controls Group */}
                            <div className="w-1/3 flex gap-2">
                                <Button
                                    variant="primary" // Changed to primary
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="flex items-center gap-2 bg-slate-800 text-white hover:bg-slate-900 border-0 shadow-sm transition-all"
                                    title="关卡列表"
                                >
                                    <Menu size={18} />
                                    <span className="hidden sm:inline">关卡</span>
                                </Button>
                                <Button
                                    variant="ghost" // Changed to ghost/secondary
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 transition-all"
                                    title="游戏设置"
                                >
                                    <Settings size={18} />
                                    {/* <span className="hidden sm:inline">设置</span> */}
                                </Button>
                            </div>

                            {/* Center: Title */}
                            <div className="flex-1 flex flex-col items-center justify-center text-center absolute left-1/2 -translate-x-1/2">
                                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 whitespace-nowrap">
                                    <Trophy className="text-yellow-500" size={24} />
                                    {currentLevel.title}
                                </h2>
                                <p className="text-slate-500 font-medium text-sm flex items-center gap-1 whitespace-nowrap">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                    {currentChapter.title}
                                </p>
                            </div>

                            {/* Right: Stats */}
                            <div className="w-1/3 flex justify-end gap-6">
                                <div className="text-center">
                                    <div className="text-xs text-blue-500 font-bold uppercase tracking-wider mb-1">WPM</div>
                                    <div className="text-2xl font-black text-blue-600 font-mono leading-none tabular-nums">
                                        {gameState.stats.wpm}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xs text-green-500 font-bold uppercase tracking-wider mb-1">准确率</div>
                                    <div className={cn(
                                        "text-2xl font-black font-mono leading-none tabular-nums",
                                        gameState.stats.accuracy >= 90 ? "text-green-600" :
                                            gameState.stats.accuracy >= 80 ? "text-orange-500" : "text-red-500"
                                    )}>
                                        {gameState.stats.accuracy}%
                                    </div>
                                </div>

                                {/* Far Right: Exit */}
                                <div className="ml-4 border-l border-slate-100 pl-4 h-10 flex items-center">
                                    <Button
                                        variant="ghost"
                                        onClick={() => navigate('/')}
                                        className="w-10 h-10 p-0 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-full flex items-center justify-center"
                                        title="退出游戏"
                                    >
                                        <LogOut size={20} />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden mt-4 shadow-inner">
                            <div
                                className="h-full bg-orange-500 transition-all duration-300 ease-out rounded-full shadow-[0_2px_5px_rgba(249,115,22,0.3)] animate-progress-stripes"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        {/* Typing Stream */}
                        <div className="py-2">
                            <TypingStream
                                targetSequence={gameState.targetSequence}
                                inputSequence={gameState.inputSequence}
                                cursorPosition={gameState.cursorPosition}
                                className="rounded-2xl border-0 bg-white/40 shadow-inner"
                            />
                        </div>
                    </div>

                    {/* Keyboard Section - Full Width */}
                    <div className="w-full relative flex justify-center items-center py-2">
                        {/* Virtual Keyboard */}
                        <div className="relative z-10 w-full flex justify-center transform scale-100 origin-top">
                            {/* Make keyboard w-full inside if needed, or just centered */}
                            <VirtualKeyboard
                                targetChar={getTargetChar()}
                                showHint={gameState.showHint}
                                className="bg-white/80 shadow-lg border-white/50 rounded-2xl w-full max-w-none"
                            />
                        </div>

                        {/* Hand Guides Overlay */}
                        <div className="absolute inset-0 z-20 pointer-events-none">
                            <HandGuides
                                targetChar={getTargetChar()}
                                showHint={gameState.showHint}
                            />
                        </div>
                    </div>

                </div>
            </div>

            {/* Level Start Overlay */}
            {showStartModal && gameState.status !== 'level-success' && gameState.status !== 'level-failed' && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto text-orange-500 mb-4 shadow-inner">
                            <Play size={32} strokeWidth={2.5} className="ml-1" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">{currentLevel.title}</h2>
                            <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                                {currentLevel.desc}
                            </p>
                        </div>

                        <div className="pt-2">
                            <Button size="large" onClick={handleStart} className="w-full text-lg h-14 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-white border-0">
                                开始挑战
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Overlay */}
            {gameState.status === 'level-success' && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 duration-300 border-4 border-yellow-300 relative overflow-hidden">
                        {/* Shimmer effect bg */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-yellow-50/50 to-transparent pointer-events-none" />

                        <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto text-yellow-500 mb-2 animate-bounce shadow-md">
                            <Trophy size={48} fill="currentColor" />
                        </div>
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black text-slate-800 mb-1">挑战成功!</h2>
                            <p className="text-slate-500 text-sm">太棒了！你的手指越来越灵活了。</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-2 relative z-10">
                            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                                <div className="text-xs text-blue-500 font-bold uppercase mb-1">速度</div>
                                <div className="text-2xl font-black text-blue-700">{gameState.stats.wpm} <span className="text-xs text-blue-400 font-normal">WPM</span></div>
                            </div>
                            <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                                <div className="text-xs text-green-500 font-bold uppercase mb-1">准确率</div>
                                <div className="text-2xl font-black text-green-700">{gameState.stats.accuracy}%</div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 relative z-10">
                            {hasNextLevel() ? (
                                <Button size="large" onClick={handleNextLevel} className="w-full text-lg h-14 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all border-0">
                                    下一关 <ArrowLeft className="rotate-180 ml-2" size={20} />
                                </Button>
                            ) : (
                                <div className="p-4 bg-green-100 text-green-700 rounded-xl font-bold">
                                    🎉 恭喜！你已完成所有关卡！
                                </div>
                            )}

                            <Button
                                variant="secondary"
                                onClick={restartLevel}
                                className="w-full border-2 border-slate-200 hover:border-slate-300 text-slate-600 font-bold"
                            >
                                <RefreshCw size={18} className="mr-2" />
                                再试一次 (刷高分)
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Failure Overlay */}
            {gameState.status === 'level-failed' && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 duration-300 border-4 border-red-300">
                        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-500 mb-2">
                            <RefreshCw size={48} className="animate-spin-slow" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 mb-1">挑战失败</h2>
                            <p className="text-slate-500 font-medium">准确率未达标，再试一次吧！</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-2">
                            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                                <div className="text-xs text-blue-500 font-bold uppercase mb-1">速度</div>
                                <div className="text-2xl font-black text-blue-700">{gameState.stats.wpm} <span className="text-xs text-blue-400 font-normal">WPM</span></div>
                            </div>
                            <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                                <div className="text-xs text-red-500 font-bold uppercase mb-1">准确率</div>
                                <div className="text-2xl font-black text-red-700">{gameState.stats.accuracy}%</div>
                            </div>
                        </div>

                        <Button size="large" onClick={restartLevel} className="w-full text-lg h-14 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all border-0">
                            <RefreshCw size={20} className="mr-2" />
                            重试当前关卡
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
