import React, { useState, useEffect, useRef } from 'react';
import { GameConfig, UserProgress } from './types';
import { Button } from '../Button';
import { ChevronDown, ChevronRight, LogOut, X, List, Lock, Check, Star } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

interface LevelSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    config: GameConfig;
    currentChapterIndex: number;
    currentLevelIndex: number;
    userProgress: UserProgress;
    onSelectLevel: (chapterIndex: number, levelIndex: number) => void;
}

export const LevelSidebar: React.FC<LevelSidebarProps> = ({
    isOpen,
    onClose,
    config,
    currentChapterIndex,
    currentLevelIndex,
    userProgress,
    onSelectLevel
}) => {
    const navigate = useNavigate();
    const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set([currentChapterIndex]));
    const [focusedIndex, setFocusedIndex] = useState<{ c: number, l: number } | null>(null);

    // Flatten logic for keyboard nav
    const flatLevels = React.useMemo(() => {
        const levels: { c: number, l: number, locked: boolean }[] = [];
        config.chapters.forEach((chap, cIdx) => {
            // Only if chapter is expanded? Or should keys expand? 
            // Let's assume keys navigate visible items, but for simplicity, let's allow traversing all.
            // Actually, user wants "Select level via keyboard".
            // Let's implement simple focus that follows visual order.
            if (expandedChapters.has(cIdx)) {
                chap.levels.forEach((lvl, lIdx) => {
                    const key = `${cIdx}-${lIdx}`;
                    const record = userProgress.records[key];
                    const isLocked = !record?.unlocked;
                    levels.push({ c: cIdx, l: lIdx, locked: isLocked });
                });
            }
        });
        return levels;
    }, [config, expandedChapters, userProgress]);

    useEffect(() => {
        if (isOpen) {
            setFocusedIndex({ c: currentChapterIndex, l: currentLevelIndex });
        }
    }, [isOpen, currentChapterIndex, currentLevelIndex]);

    // Keyboard handler
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusedIndex(prev => {
                    if (!prev) return flatLevels[0] ? { c: flatLevels[0].c, l: flatLevels[0].l } : null;
                    const idx = flatLevels.findIndex(x => x.c === prev.c && x.l === prev.l);
                    if (idx < flatLevels.length - 1) {
                        const next = flatLevels[idx + 1];
                        return { c: next.c, l: next.l };
                    }
                    return prev;
                });
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusedIndex(prev => {
                    if (!prev) return flatLevels[0] ? { c: flatLevels[0].c, l: flatLevels[0].l } : null;
                    const idx = flatLevels.findIndex(x => x.c === prev.c && x.l === prev.l);
                    if (idx > 0) {
                        const next = flatLevels[idx - 1];
                        return { c: next.c, l: next.l };
                    }
                    return prev;
                });
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (focusedIndex) {
                    const key = `${focusedIndex.c}-${focusedIndex.l}`;
                    const unlocked = userProgress.records[key]?.unlocked;
                    if (unlocked) {
                        onSelectLevel(focusedIndex.c, focusedIndex.l);
                        onClose();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, flatLevels, focusedIndex, onSelectLevel, onClose, userProgress]);


    const toggleChapter = (index: number) => {
        setExpandedChapters(prev => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    const handleExit = () => {
        navigate('/');
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90]"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                className={cn(
                    "fixed left-0 top-0 h-full w-80 bg-white/90 backdrop-blur-md shadow-2xl z-[100] transition-transform duration-300 ease-out flex flex-col border-r border-white/50",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/50">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <List className="w-5 h-5" />
                        关卡列表
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {config.chapters.map((chapter, cIdx) => (
                        <div key={chapter.id} className="bg-white/50 rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                            <button
                                onClick={() => toggleChapter(cIdx)}
                                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                            >
                                <span className="font-bold text-slate-700">{chapter.title}</span>
                                {expandedChapters.has(cIdx) ? (
                                    <ChevronDown size={16} className="text-slate-400" />
                                ) : (
                                    <ChevronRight size={16} className="text-slate-400" />
                                )}
                            </button>

                            {expandedChapters.has(cIdx) && (
                                <div className="border-t border-slate-100 bg-slate-50/50">
                                    {chapter.levels.map((level, lIdx) => {
                                        const key = `${cIdx}-${lIdx}`;
                                        const record = userProgress.records[key] || { unlocked: false, completed: false, maxAccuracy: 0 };
                                        const isLocked = !record.unlocked;
                                        const isActive = cIdx === currentChapterIndex && lIdx === currentLevelIndex;
                                        const isFocused = focusedIndex?.c === cIdx && focusedIndex?.l === lIdx;

                                        return (
                                            <button
                                                key={level.id}
                                                disabled={isLocked}
                                                onClick={() => {
                                                    if (!isLocked) {
                                                        onSelectLevel(cIdx, lIdx);
                                                        onClose();
                                                    }
                                                }}
                                                className={cn(
                                                    "w-full text-left p-3 pl-4 text-sm transition-all border-l-4 flex items-center justify-between group",
                                                    isActive
                                                        ? "border-orange-500 bg-orange-50 text-orange-700 font-medium"
                                                        : isLocked
                                                            ? "border-transparent text-slate-400 bg-slate-100/50 cursor-not-allowed"
                                                            : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-white",
                                                    isFocused && !isActive && "bg-slate-200"
                                                )}
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    {isLocked ? (
                                                        <Lock size={14} className="shrink-0 text-slate-400" />
                                                    ) : record.maxAccuracy === 100 ? (
                                                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                                            <Star size={12} className="text-green-500 fill-green-500" />
                                                        </div>
                                                    ) : record.completed ? (
                                                        <div className="w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
                                                            <Check size={12} className="text-yellow-500" />
                                                        </div>
                                                    ) : (
                                                        <div className={cn(
                                                            "w-1.5 h-1.5 rounded-full ml-1.5 mr-2",
                                                            isActive ? "bg-orange-500" : "bg-slate-300"
                                                        )} />
                                                    )}

                                                    <div className="min-w-0">
                                                        <div className="truncate font-medium">{level.title}</div>
                                                        <div className="text-[10px] text-slate-400 truncate opacity-70">
                                                            {level.desc}
                                                        </div>
                                                    </div>
                                                </div>

                                                {!isLocked && record.completed && (
                                                    <div className={cn(
                                                        "text-xs font-mono font-bold ml-2",
                                                        record.maxAccuracy === 100 ? "text-green-600" : "text-yellow-500"
                                                    )}>
                                                        {record.maxAccuracy}%
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-white/50">
                    <Button
                        onClick={handleExit}
                        variant="secondary"
                        className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 hover:text-red-600 border-red-100"
                    >
                        <LogOut size={18} />
                        退出游戏
                    </Button>
                </div>
            </div>
        </>
    );
};
