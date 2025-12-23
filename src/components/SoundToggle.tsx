import React from 'react';
import { Music, Slash } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { cn } from '../lib/utils';

interface SoundToggleProps {
    className?: string;
    variant?: 'default' | 'ghost' | 'icon';
}

export const SoundToggle: React.FC<SoundToggleProps> = ({ className, variant = 'ghost' }) => {
    const { isMuted, toggleMute, playSound } = useAppStore();

    const handleClick = () => {
        toggleMute();
        // Play a test sound if unmuting
        if (isMuted) {
            playSound('toggle');
        }
    };

    return (
        <button
            onClick={handleClick}
            className={cn(
                "p-2 rounded-full transition-all duration-300 hover:bg-gray-100/50 active:scale-95 focus:outline-none",
                variant !== 'icon' && "border border-transparent",
                className
            )}
            title={isMuted ? "开启音效" : "静音"}
            aria-label={isMuted ? "开启音效" : "静音"}
        >
            <div className="relative w-8 h-8 flex items-center justify-center">
                <Music
                    className={cn(
                        "w-full h-full transition-all duration-500",
                        isMuted
                            ? "text-gray-300 scale-90"
                            : "text-primary-500 animate-music-spin-slow"
                    )}
                    style={{
                        filter: isMuted
                            ? 'none'
                            : 'drop-shadow(1px 1px 0px #3b82f6) drop-shadow(2px 2px 0px #2563eb) drop-shadow(3px 3px 4px rgba(0,0,0,0.2))'
                    }}
                />
                {isMuted && (
                    <Slash
                        className="absolute inset-0 w-full h-full text-gray-400 opacity-70 pointer-events-none transform scale-x-[-1]"
                        strokeWidth={2.5}
                    />
                )}
            </div>
        </button>
    );
};
