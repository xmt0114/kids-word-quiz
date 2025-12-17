import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Howl } from 'howler';

// Define sound types
export type SoundType =
    | 'click'
    | 'correct'
    | 'wrong'
    | 'success'
    | 'toggle'
    | 'pop'
    | 'close'
    | 'start'
    | 'hover';

// Map logical names to file paths
// Note: Files are in public/sounds/, so path is /sounds/...
const SOUND_VARIANTS: Record<SoundType, string[]> = {
    click: [
        '/sounds/click_001.ogg',
        '/sounds/click_002.ogg',
        '/sounds/click_003.ogg',
        '/sounds/click_004.ogg',
        '/sounds/click_005.ogg',
    ],
    correct: [
        '/sounds/confirmation_001.ogg',
        '/sounds/confirmation_002.ogg',
        '/sounds/confirmation_003.ogg',
        '/sounds/confirmation_004.ogg',
    ],
    wrong: [
        '/sounds/error_001.ogg',
        '/sounds/error_002.ogg',
        '/sounds/error_003.ogg',
        '/sounds/error_004.ogg',
    ],
    success: ['/sounds/maximize_005.ogg'],
    toggle: ['/sounds/switch_002.ogg'],
    pop: ['/sounds/drop_002.ogg'],
    close: ['/sounds/close_002.ogg'],
    start: ['/sounds/maximize_004.ogg'],
    hover: [
        '/sounds/select_001.ogg',
        '/sounds/select_002.ogg',
        '/sounds/select_003.ogg',
    ],
};

interface SoundContextType {
    playSound: (type: SoundType) => void;
    isMuted: boolean;
    toggleMute: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Load muted state from localStorage, default to false (sound on)
    const [isMuted, setIsMuted] = useState<boolean>(() => {
        const saved = localStorage.getItem('kids-quiz-muted');
        return saved ? JSON.parse(saved) : false;
    });

    // Store Howl instances keyed by file path
    const soundsRef = useRef<Record<string, Howl>>({});
    const bgmRef = useRef<Howl | null>(null);

    // Initialize sounds & BGM
    useEffect(() => {
        const sounds: Record<string, Howl> = {};
        const allPaths = new Set(Object.values(SOUND_VARIANTS).flat());

        // Preload all unique sound files
        allPaths.forEach((src) => {
            sounds[src] = new Howl({
                src: [src],
                preload: true,
                volume: 0.5, // Default volume
            });
        });

        soundsRef.current = sounds;

        // Initialize BGM
        bgmRef.current = new Howl({
            src: ['/sounds/bgm.ogg'],
            html5: true,
            loop: true,
            volume: 0.1,
            preload: true
        });

        // Try to play BGM if not muted
        const playBgm = () => {
            // We access the *current* isMuted value via the state setter or checking localStorage if we were inside the component body,
            // but here we are in a closure.
            // Ideally we just want to start it. Mute state will handle audibility.
            // Actually, Howl instances themselves have a mute() method.
            // Let's just start playing. If global mute is managed, we'll handle it.

            if (bgmRef.current && !bgmRef.current.playing()) {
                bgmRef.current.play();
                // Once successfully engaged we can remove listeners
                document.removeEventListener('click', playBgm);
                document.removeEventListener('touchstart', playBgm);
            }
        };

        // Add global listeners to unlock audio context
        document.addEventListener('click', playBgm);
        document.addEventListener('touchstart', playBgm);

        return () => {
            // Unload sounds on unmount
            Object.values(soundsRef.current).forEach(sound => sound.unload());
            if (bgmRef.current) {
                bgmRef.current.unload();
            }
            document.removeEventListener('click', playBgm);
            document.removeEventListener('touchstart', playBgm);
        };
    }, []);

    // Sync mute state
    useEffect(() => {
        localStorage.setItem('kids-quiz-muted', JSON.stringify(isMuted));

        // Manage BGM mute state
        if (bgmRef.current) {
            bgmRef.current.mute(isMuted);

            // If we are unmuting and it's not playing (e.g. user hasn't interacted yet, or we explicitly stopped it),
            // we should try to ensure it plays. 
            // However, the interaction listener handles the initial start. 
            // If isMuted was true initially, we might still want it 'playing' but muted? 
            // Yes, standard game BGM behavior is usually "always playing, just volume 0 if muted" 
            // or "paused if muted". Detailed logic:
            // 1. If muted: cancel/pause? Or just .mute(true)? .mute(true) is better for uninterrupted loop.

            if (!isMuted && !bgmRef.current.playing()) {
                // Try to play if unmuted and not playing. 
                // This might fail if no user interaction yet, but that's fine (listeners are still there).
                bgmRef.current.play();
            }
        }
    }, [isMuted]);

    const playSound = useCallback((type: SoundType) => {
        if (isMuted) return;

        const variants = SOUND_VARIANTS[type];
        if (!variants || variants.length === 0) {
            console.warn(`No sound variants found for type "${type}"`);
            return;
        }

        // Pick a random variant
        const path = variants[Math.floor(Math.random() * variants.length)];
        const sound = soundsRef.current[path];

        if (sound) {
            // Create a new ID for each play to allow overlapping
            sound.play();
        } else {
            console.warn(`Sound file "${path}" not loaded.`);
        }
    }, [isMuted]);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);

    return (
        <SoundContext.Provider value={{ playSound, isMuted, toggleMute }}>
            {children}
        </SoundContext.Provider>
    );
};

export const useSound = () => {
    const context = useContext(SoundContext);
    if (context === undefined) {
        throw new Error('useSound must be used within a SoundProvider');
    }
    return context;
};
