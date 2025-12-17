import { StateCreator } from 'zustand';
import { Howl } from 'howler';

// ==================== Constants & Types ====================

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

// Module-level variables to hold Howl instances (non-reactive)
const soundInstances: Record<string, Howl> = {};
let bgmInstance: Howl | null = null;
let isInitialized = false;

// ==================== Slice Definition ====================

export interface SoundSlice {
    isMuted: boolean;
    initSounds: () => void;
    playSound: (type: SoundType) => void;
    toggleMute: () => void;
}

export const createSoundSlice = (set: any, get: any): SoundSlice => ({
    isMuted: false, // Default value, will be updated in initSounds

    initSounds: () => {
        if (isInitialized) return;

        // 1. Initialize Muted State from LocalStorage
        const savedMute = localStorage.getItem('kids-quiz-muted');
        const initialMute = savedMute ? JSON.parse(savedMute) : false;
        set({ isMuted: initialMute });

        // 2. Preload Sounds
        const allPaths = new Set(Object.values(SOUND_VARIANTS).flat());
        allPaths.forEach((src) => {
            soundInstances[src] = new Howl({
                src: [src],
                preload: true,
                volume: 0.5,
            });
        });

        // 3. Initialize BGM
        bgmInstance = new Howl({
            src: ['/sounds/bgm.ogg'],
            html5: true,
            loop: true,
            volume: 0.1, // Low volume for BGM
            preload: true
        });

        // Apply initial mute state to BGM
        bgmInstance.mute(initialMute);

        // 4. BGM Autoplay Logic (unlock audio context)
        const playBgm = () => {
            if (bgmInstance && !bgmInstance.playing()) {
                bgmInstance.play();
                // Remove listeners once activated
                document.removeEventListener('click', playBgm);
                document.removeEventListener('touchstart', playBgm);
            }
        };

        // If not muted, try to play immediately (might fail if no interaction)
        if (!initialMute) {
            // We still need the listener for the first interaction to strict browsers
        }

        document.addEventListener('click', playBgm);
        document.addEventListener('touchstart', playBgm);

        isInitialized = true;
        console.log('🎵 [SoundSlice] Sound system initialized');
    },

    playSound: (type: SoundType) => {
        const { isMuted } = get();
        if (isMuted) return;

        const variants = SOUND_VARIANTS[type];
        if (!variants || variants.length === 0) {
            console.warn(`No sound variants found for type "${type}"`);
            return;
        }

        // Pick a random variant
        const path = variants[Math.floor(Math.random() * variants.length)];
        const sound = soundInstances[path];

        if (sound) {
            sound.play();
        } else {
            console.warn(`Sound file "${path}" not loaded.`);
        }
    },

    toggleMute: () => {
        const newMuted = !get().isMuted;
        set({ isMuted: newMuted });

        // Persist
        localStorage.setItem('kids-quiz-muted', JSON.stringify(newMuted));

        // Update BGM
        if (bgmInstance) {
            bgmInstance.mute(newMuted);
            if (!newMuted && !bgmInstance.playing()) {
                bgmInstance.play();
            }
        }
    }
});
