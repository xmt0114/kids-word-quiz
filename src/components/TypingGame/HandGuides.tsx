import React from 'react';
import { cn } from '../../lib/utils';
import { KEYBOARD_MAP, getShiftKey } from './KeyboardMap';

interface HandGuidesProps {
    targetChar: string;
    showHint: boolean;
    className?: string;
}

// Map finger names to SVG paths IDs or classes
const FINGER_IDS = {
    'left-pinky': 'finger-l-5',
    'left-ring': 'finger-l-4',
    'left-middle': 'finger-l-3',
    'left-index': 'finger-l-2',
    'thumb': 'finger-thumb', // Both thumbs usually
    'right-index': 'finger-r-2',
    'right-middle': 'finger-r-3',
    'right-ring': 'finger-r-4',
    'right-pinky': 'finger-r-5',
};

export const HandGuides: React.FC<HandGuidesProps> = ({ targetChar, showHint, className }) => {
    // Determine active fingers
    const activeFingers: string[] = [];

    if (showHint && targetChar && KEYBOARD_MAP[targetChar]) {
        const config = KEYBOARD_MAP[targetChar];
        config.fingers.forEach(f => activeFingers.push(f));
    }

    const isFingerActive = (fingerId: string) => {
        return activeFingers.some(f => {
            if (f === 'thumb') return fingerId.includes('thumb');
            // @ts-ignore
            return FINGER_IDS[f] === fingerId;
        });
    };

    const getFingerStyle = (id: string, type: 'body' | 'outline') => {
        const active = isFingerActive(id);
        if (type === 'outline') {
            return cn(
                "transition-all duration-500 fill-none",
                active
                    ? "stroke-orange-500 stroke-[1.5px] opacity-100 filter drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]"
                    : "stroke-orange-400/30 stroke-[0.8px] opacity-50" // Constant silhouette
            );
        }
        return cn(
            "transition-all duration-500",
            active ? "opacity-100" : "opacity-0"
        );
    }

    return (
        <div className={cn("relative w-full h-full pointer-events-none flex justify-center gap-20 md:gap-32", className)}>
            <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
                <defs>
                    <linearGradient id="holo-gradient-active" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#f97316" stopOpacity="0.05" />
                        <stop offset="60%" stopColor="#f97316" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#fb923c" stopOpacity="0.45" />
                    </linearGradient>
                    <radialGradient id="tip-focal-point" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                    </radialGradient>
                </defs>
            </svg>

            {/* Left Hand SVG */}
            <div className="relative w-1/2 max-w-[240px] aspect-square">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 200 200">
                    <g transform="translate(10,10) scale(1.2)">
                        {/* Finger Group L5 */}
                        <g>
                            <path d="M10,80 C10,60 20,50 25,50 C30,50 40,60 40,80 L40,110 L10,110 Z"
                                fill="url(#holo-gradient-active)" className={getFingerStyle('finger-l-5', 'body')} />
                            <path d="M10,80 C10,60 20,50 25,50 C30,50 40,60 40,80 L40,110 L10,110 Z"
                                className={getFingerStyle('finger-l-5', 'outline')} />
                            {isFingerActive('finger-l-5') && <circle cx="25" cy="55" r="8" fill="url(#tip-focal-point)" className="animate-pulse" />}
                        </g>

                        {/* Finger Group L4 */}
                        <g>
                            <path d="M42,70 C42,40 52,30 57,30 C62,30 72,40 72,70 L72,110 L42,110 Z"
                                fill="url(#holo-gradient-active)" className={getFingerStyle('finger-l-4', 'body')} />
                            <path d="M42,70 C42,40 52,30 57,30 C62,30 72,40 72,70 L72,110 L42,110 Z"
                                className={getFingerStyle('finger-l-4', 'outline')} />
                            {isFingerActive('finger-l-4') && <circle cx="57" cy="35" r="8" fill="url(#tip-focal-point)" className="animate-pulse" />}
                        </g>

                        {/* Finger Group L3 */}
                        <g>
                            <path d="M74,60 C74,20 84,10 89,10 C94,10 104,20 104,60 L104,110 L74,110 Z"
                                fill="url(#holo-gradient-active)" className={getFingerStyle('finger-l-3', 'body')} />
                            <path d="M74,60 C74,20 84,10 89,10 C94,10 104,20 104,60 L104,110 L74,110 Z"
                                className={getFingerStyle('finger-l-3', 'outline')} />
                            {isFingerActive('finger-l-3') && <circle cx="89" cy="15" r="8" fill="url(#tip-focal-point)" className="animate-pulse" />}
                        </g>

                        {/* Finger Group L2 */}
                        <g>
                            <path d="M106,65 C106,35 116,30 121,30 C126,30 136,35 136,70 L136,110 L106,110 Z"
                                fill="url(#holo-gradient-active)" className={getFingerStyle('finger-l-2', 'body')} />
                            <path d="M106,65 C106,35 116,30 121,30 C126,30 136,35 136,70 L136,110 L106,110 Z"
                                className={getFingerStyle('finger-l-2', 'outline')} />
                            {isFingerActive('finger-l-2') && <circle cx="121" cy="35" r="8" fill="url(#tip-focal-point)" className="animate-pulse" />}
                        </g>

                        {/* Thumb Group L */}
                        <g>
                            <path d="M140,110 C160,110 180,130 170,150 C160,160 130,150 130,140 Z"
                                fill="url(#holo-gradient-active)" className={getFingerStyle('finger-thumb', 'body')} />
                            <path d="M140,110 C160,110 180,130 170,150 C160,160 130,150 130,140 Z"
                                className={getFingerStyle('finger-thumb', 'outline')} />
                            {isFingerActive('finger-thumb') && <circle cx="160" cy="135" r="8" fill="url(#tip-focal-point)" className="animate-pulse" />}
                        </g>

                        {/* Faint Palm Silhouette */}
                        <path d="M20,110 L140,110 L140,150 C140,180 40,180 20,150 Z" className="fill-orange-400/5 stroke-orange-400/20 stroke-[0.5px]" />
                    </g>
                    <text x="90" y="195" textAnchor="middle" className="fill-orange-400/60 font-mono text-[8px] font-bold tracking-[0.2em]">HOLO L-CORE</text>
                </svg>
            </div>

            {/* Right Hand SVG */}
            <div className="relative w-1/2 max-w-[240px] aspect-square">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 200 200">
                    <g transform="translate(10,10) scale(-1.2, 1.2) translate(-165, 0)">
                        {/* Finger Group R5 */}
                        <g>
                            <path d="M10,80 C10,60 20,50 25,50 C30,50 40,60 40,80 L40,110 L10,110 Z"
                                fill="url(#holo-gradient-active)" className={getFingerStyle('finger-r-5', 'body')} />
                            <path d="M10,80 C10,60 20,50 25,50 C30,50 40,60 40,80 L40,110 L10,110 Z"
                                className={getFingerStyle('finger-r-5', 'outline')} />
                            {isFingerActive('finger-r-5') && <circle cx="25" cy="55" r="8" fill="url(#tip-focal-point)" className="animate-pulse" />}
                        </g>

                        {/* Finger Group R4 */}
                        <g>
                            <path d="M42,70 C42,40 52,30 57,30 C62,30 72,40 72,70 L72,110 L42,110 Z"
                                fill="url(#holo-gradient-active)" className={getFingerStyle('finger-r-4', 'body')} />
                            <path d="M42,70 C42,40 52,30 57,30 C62,30 72,40 72,70 L72,110 L42,110 Z"
                                className={getFingerStyle('finger-r-4', 'outline')} />
                            {isFingerActive('finger-r-4') && <circle cx="57" cy="35" r="8" fill="url(#tip-focal-point)" className="animate-pulse" />}
                        </g>

                        {/* Finger Group R3 */}
                        <g>
                            <path d="M74,60 C74,20 84,10 89,10 C94,10 104,20 104,60 L104,110 L74,110 Z"
                                fill="url(#holo-gradient-active)" className={getFingerStyle('finger-r-3', 'body')} />
                            <path d="M74,60 C74,20 84,10 89,10 C94,10 104,20 104,60 L104,110 L74,110 Z"
                                className={getFingerStyle('finger-r-3', 'outline')} />
                            {isFingerActive('finger-r-3') && <circle cx="89" cy="15" r="8" fill="url(#tip-focal-point)" className="animate-pulse" />}
                        </g>

                        {/* Finger Group R2 */}
                        <g>
                            <path d="M106,65 C106,35 116,30 121,30 C126,30 136,35 136,70 L136,110 L106,110 Z"
                                fill="url(#holo-gradient-active)" className={getFingerStyle('finger-r-2', 'body')} />
                            <path d="M106,65 C106,35 116,30 121,30 C126,30 136,35 136,70 L136,110 L106,110 Z"
                                className={getFingerStyle('finger-r-2', 'outline')} />
                            {isFingerActive('finger-r-2') && <circle cx="121" cy="35" r="8" fill="url(#tip-focal-point)" className="animate-pulse" />}
                        </g>

                        {/* Thumb Group R */}
                        <g>
                            <path d="M140,110 C160,110 180,130 170,150 C160,160 130,150 130,140 Z"
                                fill="url(#holo-gradient-active)" className={getFingerStyle('finger-thumb', 'body')} />
                            <path d="M140,110 C160,110 180,130 170,150 C160,160 130,150 130,140 Z"
                                className={getFingerStyle('finger-thumb', 'outline')} />
                            {isFingerActive('finger-thumb') && <circle cx="160" cy="135" r="8" fill="url(#tip-focal-point)" className="animate-pulse" />}
                        </g>

                        <path d="M20,110 L140,110 L140,150 C140,180 40,180 20,150 Z" className="fill-orange-400/5 stroke-orange-400/20 stroke-[0.5px]" />
                    </g>
                    <text x="110" y="195" textAnchor="middle" className="fill-orange-400/60 font-mono text-[8px] font-bold tracking-[0.2em]">HOLO R-CORE</text>
                </svg>
            </div>
        </div>
    );
};
