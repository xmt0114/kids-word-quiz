import { FingerName } from './KeyboardMap';

export interface LevelConfig {
    new_keys: string[];
    review_keys: string[];
    weights: {
        new: number;
        review: number;
    };
}

export interface Level {
    id: string;
    title: string;
    desc: string;
    config: LevelConfig;
}

export interface Chapter {
    id: string;
    title: string;
    description: string;
    levels: Level[];
}

export interface GameConfig {
    game_settings: {
        type: string;
        version: string;
    };
    chapters: Chapter[];
}

export interface GameStats {
    wpm: number;
    accuracy: number;
    totalChars: number;
    correctChars: number;
    errors: number;
    startTime: number | null;
}

export interface GameState {
    status: 'idle' | 'playing' | 'completed' | 'level-success' | 'level-failed';
    currentChapterIndex: number;
    currentLevelIndex: number;
    inputSequence: string;
    targetSequence: string; // The full string to type for the current "line" or "segment"
    cursorPosition: number; // Index in targetSequence
    stats: GameStats;
    showHint: boolean; // Whether to show visual hints
    hintTimer: number | null;
    lastErrorTime?: number; // Last time a wrong key was pressed
}

export interface TypingGameSettings {
    lineLength: number;
    minAccuracy: number;
    hintDelay: number; // seconds
}

export interface LevelRecord {
    unlocked: boolean;
    completed: boolean;
    maxAccuracy: number;
    maxWpm: number;
}

export interface UserProgress {
    records: Record<string, LevelRecord>; // Key is "chapterIndex_levelIndex" or level.id
    lastChapterIndex: number;
    lastLevelIndex: number;
}
