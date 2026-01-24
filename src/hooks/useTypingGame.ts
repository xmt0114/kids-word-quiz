import { useState, useEffect, useRef, useCallback } from 'react';
import { GameConfig, GameState, TypingGameSettings, Level, UserProgress } from '../components/TypingGame/types';
import { useAppStore } from '../stores/appStore';

// Helper to generate weighted random string
const generateTargetString = (level: Level, length: number): string => {
    const { new_keys, review_keys, weights } = level.config;
    // Normalize weights
    const totalWeight = weights.new + weights.review;
    const newWeight = weights.new / totalWeight;

    let result = '';

    // Ensure at least one new key is present if available
    if (new_keys.length > 0) {
        result += new_keys[Math.floor(Math.random() * new_keys.length)];
    }

    // Fill the rest
    while (result.length < length) {
        const isNew = Math.random() < newWeight;
        if (isNew && new_keys.length > 0) {
            result += new_keys[Math.floor(Math.random() * new_keys.length)];
        } else if (review_keys.length > 0) {
            result += review_keys[Math.floor(Math.random() * review_keys.length)];
        } else if (new_keys.length > 0) {
            // Fallback if no review keys
            result += new_keys[Math.floor(Math.random() * new_keys.length)];
        }
    }

    // Shuffle the result (simple shuffle)
    return result.split('').sort(() => 0.5 - Math.random()).join('');
};

const DEFAULT_SETTINGS: TypingGameSettings = {
    lineLength: 30,
    minAccuracy: 90,
    hintDelay: 3
};

const INITIAL_STATS = {
    wpm: 0,
    accuracy: 100,
    totalChars: 0,
    correctChars: 0,
    errors: 0,
    startTime: null
};

export const useTypingGame = () => {
    const { playSound } = useAppStore();

    // Game Configuration State
    const { games } = useAppStore();
    const typingGame = games.find(g => g.type === 'typing' || g.id === 'typing-practice');

    // Use config from store if available, otherwise an empty initial structure to avoid crashes
    const [config, setConfig] = useState<GameConfig>(() => {
        if (typingGame?.default_config) {
            return typingGame.default_config as unknown as GameConfig;
        }
        return {
            game_settings: { type: 'typing', version: '1.0' },
            chapters: []
        };
    });

    // Keep config in sync if games list updates later
    useEffect(() => {
        if (typingGame?.default_config) {
            setConfig(typingGame.default_config as unknown as GameConfig);
        }
    }, [typingGame]);

    // Settings State with Persistence
    const [settings, setSettings] = useState<TypingGameSettings>(() => {
        const saved = localStorage.getItem('typing-game-settings');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse settings", e);
            }
        }
        return DEFAULT_SETTINGS;
    });

    useEffect(() => {
        localStorage.setItem('typing-game-settings', JSON.stringify(settings));
    }, [settings]);

    // Persistence State
    const [userProgress, setUserProgress] = useState<UserProgress>(() => {
        const saved = localStorage.getItem('typing-game-progress');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse progress", e);
            }
        }
        // Default init: unlock first level
        return {
            records: {
                "0-0": { unlocked: true, completed: false, maxAccuracy: 0, maxWpm: 0 }
            },
            lastChapterIndex: 0,
            lastLevelIndex: 0
        };
    });

    // Save progress effect
    useEffect(() => {
        localStorage.setItem('typing-game-progress', JSON.stringify(userProgress));
    }, [userProgress]);

    // Game Runtime State
    const [gameState, setGameState] = useState<GameState>({
        status: 'idle',
        currentChapterIndex: userProgress.lastChapterIndex,
        currentLevelIndex: userProgress.lastLevelIndex,
        inputSequence: '',
        targetSequence: '',
        cursorPosition: 0,
        stats: INITIAL_STATS,
        showHint: false,
        hintTimer: null
    });

    const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Hint Timer Logic
    const resetHintTimer = useCallback(() => {
        if (hintTimeoutRef.current) {
            clearTimeout(hintTimeoutRef.current);
        }
        setGameState(prev => ({ ...prev, showHint: false }));

        hintTimeoutRef.current = setTimeout(() => {
            setGameState(prev => ({ ...prev, showHint: true }));
        }, settings.hintDelay * 1000);
    }, [settings.hintDelay]);

    useEffect(() => {
        return () => {
            if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
        };
    }, []);

    // Initializer for a level
    const startLevel = useCallback((chapterIdx: number, levelIdx: number) => {
        const chapter = config.chapters[chapterIdx];
        if (!chapter) return;
        const level = chapter.levels[levelIdx];
        if (!level) return;

        // Verify if unlocked? (Optional, but UI should enforce)
        // const recordKey = `${chapterIdx}-${levelIdx}`;
        // if (!userProgress.records[recordKey]?.unlocked) return; 

        // Always generate new target string
        const target = generateTargetString(level, settings.lineLength);

        setGameState(prev => ({
            ...prev,
            status: 'playing',
            currentChapterIndex: chapterIdx,
            currentLevelIndex: levelIdx,
            inputSequence: '',
            targetSequence: target,
            cursorPosition: 0,
            stats: { ...INITIAL_STATS, startTime: Date.now() },
            showHint: false
        }));

        // Update last played
        setUserProgress(prev => ({
            ...prev,
            lastChapterIndex: chapterIdx,
            lastLevelIndex: levelIdx
        }));

        resetHintTimer();
    }, [config, settings, resetHintTimer]); // Added resetHintTimer to deps

    // Update Settings Handler
    const updateSettings = useCallback((newSettings: TypingGameSettings) => {
        setSettings(newSettings);
        // We'll trust the UI to trigger restart if needed, OR we can do it here. 
        // Requirements said "If settings changed, restart".
        // To allow smooth sliding, maybe we don't restart IMMEDIATELY on every slide event, but the modal will save on close.
        // Actually the prompt said: "Logic: Sliding updates real-time. Close autosaves. If config changed, restart".
        // So `updateSettings` will be called real-time. We shouldn't restart mid-drag.
        // We will expose a separate `restartLevel` which relies on the LATEST settings.
        // But `startLevel` uses `settings` from closure. `settings` is a dependency of `startLevel`.
        // So changing settings WILL recreate `startLevel`.
        // So if we call `restartLevel` after modal close, it will pick up new settings.
    }, []);

    // Handling Input
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (gameState.status !== 'playing') return;

        // Skip repeated keydown events when a key is held down
        if (e.repeat) return;

        if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) return;
        if (e.key === ' ' && e.target === document.body) e.preventDefault();

        const currentTargetChar = gameState.targetSequence[gameState.cursorPosition];
        const inputChar = e.key;
        let isCorrect = false;

        if (inputChar === currentTargetChar) {
            isCorrect = true;
            playSound('click');
        } else {
            playSound('wrong');
        }

        setGameState(prev => {
            const newStats = { ...prev.stats };
            newStats.totalChars += 1;
            if (isCorrect) newStats.correctChars += 1;
            else newStats.errors += 1;

            const timeElapsedMin = (Date.now() - (prev.stats.startTime || Date.now())) / 60000;
            const grossWPM = (newStats.totalChars / 5) / (timeElapsedMin || 0.0001);
            newStats.wpm = Math.floor(grossWPM);
            newStats.accuracy = Math.floor((newStats.correctChars / newStats.totalChars) * 100);

            let nextCursor = prev.cursorPosition;
            let nextInput = prev.inputSequence;
            let nextStatus = prev.status;

            nextCursor += 1;
            nextInput += inputChar;

            if (nextCursor >= prev.targetSequence.length) {
                if (newStats.accuracy >= settings.minAccuracy) {
                    nextStatus = 'level-success';
                    playSound('success');

                    // Unlock next level logic here (updated via useEffect or directly? directly is safer for preventing race conditions with nextLevel)
                    // Actually better to do it in a useEffect that watches status change, or here.
                    // But we are inside setGameState updater. We can't update userProgress here directly cleanly without refs or another effect.
                    // Let's use an effect to handle "Level Completed" logic.
                } else {
                    nextStatus = 'level-failed';
                    playSound('wrong');
                }
                if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
            }

            return {
                ...prev,
                stats: newStats,
                inputSequence: nextInput,
                lastErrorTime: isCorrect ? prev.lastErrorTime : Date.now(),
                cursorPosition: nextCursor,
                status: nextStatus
            };
        });

        if (isCorrect) resetHintTimer();
    }, [gameState.status, gameState.cursorPosition, gameState.targetSequence, playSound, resetHintTimer, settings.minAccuracy]);

    // Effect to handle Level Success -> Unlock Next
    useEffect(() => {
        if (gameState.status === 'level-success') {
            const currentRecKey = `${gameState.currentChapterIndex}-${gameState.currentLevelIndex}`;

            // Calculate next level key
            let nextChap = gameState.currentChapterIndex;
            let nextLvl = gameState.currentLevelIndex + 1;
            const currentChapConfig = config.chapters[gameState.currentChapterIndex];

            if (nextLvl >= currentChapConfig.levels.length) {
                nextChap++;
                nextLvl = 0;
            }

            const nextRecKey = `${nextChap}-${nextLvl}`;
            const hasNextLevel = nextChap < config.chapters.length;

            setUserProgress(prev => {
                const nextRecords = { ...prev.records };

                // Update current level record
                const currRec = nextRecords[currentRecKey] || { unlocked: true, completed: false, maxAccuracy: 0, maxWpm: 0 };
                nextRecords[currentRecKey] = {
                    ...currRec,
                    completed: true,
                    maxAccuracy: Math.max(currRec.maxAccuracy, gameState.stats.accuracy),
                    maxWpm: Math.max(currRec.maxWpm, gameState.stats.wpm)
                };

                // Unlock next level if exists
                if (hasNextLevel) {
                    const nextRec = nextRecords[nextRecKey] || { unlocked: false, completed: false, maxAccuracy: 0, maxWpm: 0 };
                    nextRecords[nextRecKey] = { ...nextRec, unlocked: true };
                }

                return { ...prev, records: nextRecords };
            });
        }
    }, [gameState.status, gameState.currentChapterIndex, gameState.currentLevelIndex, gameState.stats, config.chapters]);


    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const nextLevel = useCallback(() => {
        const currentChap = config.chapters[gameState.currentChapterIndex];
        const nextLvlIdx = gameState.currentLevelIndex + 1;

        if (nextLvlIdx < currentChap.levels.length) {
            startLevel(gameState.currentChapterIndex, nextLvlIdx);
        } else {
            const nextChapIdx = gameState.currentChapterIndex + 1;
            if (nextChapIdx < config.chapters.length) {
                startLevel(nextChapIdx, 0);
            } else {
                setGameState(prev => ({ ...prev, status: 'completed' }));
            }
        }
    }, [config, gameState.currentChapterIndex, gameState.currentLevelIndex, startLevel]);

    const restartLevel = useCallback(() => {
        // startLevel always regenerates sequence
        startLevel(gameState.currentChapterIndex, gameState.currentLevelIndex);
    }, [gameState.currentChapterIndex, gameState.currentLevelIndex, startLevel]);

    return {
        gameState,
        config,
        userProgress,
        settings,
        startLevel,
        nextLevel,
        restartLevel,
        updateSettings
    };
};
