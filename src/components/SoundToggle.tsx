import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
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
                "p-2 rounded-full transition-all duration-300 hover:bg-gray-100/50  active:scale-95 focus:outline-none",
                variant !== 'icon' && "border border-transparent",
                className
            )}
            title={isMuted ? "开启音效" : "静音"}
            aria-label={isMuted ? "开启音效" : "静音"}
        >
            {isMuted ? (
                <VolumeX className="w-8 h-8 text-gray-500" />
            ) : (
                <Volume2 className="w-8 h-8 text-primary-500" />
            )}
        </button>
    );
};
