import React, { useRef } from 'react';
import { cn } from '../../lib/utils';

interface TypingStreamProps {
    targetSequence: string;
    inputSequence: string;
    cursorPosition: number; // 0-based index of the NEXT character to type
    className?: string;
}

export const TypingStream: React.FC<TypingStreamProps> = ({ targetSequence, inputSequence, cursorPosition, className }) => {
    // We want the cursor character to always be in the center.
    // The "stream" moves left as we type.

    // Split into:
    // 1. Typed Correctly (scrolled off to left or just left of center)
    // 2. Exact Current Cursor (Center, Highlighted)
    // 3. Upcoming (Right)

    // For better visual, we can render a window of characters around the cursor.
    // E.g. 15 chars before, 15 chars after.

    // Or simpler: Render the whole line in a flex container, and translate it left based on cursorPosition.
    // Assuming each char has fixed width.

    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <div className={cn("relative h-32 w-full overflow-hidden bg-white/50 backdrop-blur-sm border-y-2 border-primary-200 flex items-center shadow-inner", className)} ref={containerRef}>
            {/* Center Marker/Highlight Box */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-24 border-b-4 border-orange-500 rounded-lg bg-orange-50/50 z-10 shadow-[0_0_20px_rgba(249,115,22,0.2)] animate-pulse" />

            <div
                className="flex items-center absolute left-1/2 transition-transform duration-300 ease-out"
                style={{ transform: `translateX(${-(cursorPosition * 64) - (64 / 2)}px)` }} // Adjusted for 60px width + 4px margin
            >
                {targetSequence.split('').map((char, index) => {
                    // Determine state of this char
                    let status = 'upcoming'; // default
                    let isWrong = false;

                    if (index < cursorPosition) {
                        status = 'completed';
                        // Check strict correctness
                        const inputted = inputSequence[index];
                        if (inputted !== char) {
                            isWrong = true;
                        }
                    } else if (index === cursorPosition) {
                        status = 'current';
                    }

                    return (
                        <div
                            key={index}
                            style={{ width: '60px' }}
                            className={cn(
                                "h-24 flex items-center justify-center text-5xl font-['Ubuntu_Mono'] font-medium transition-all duration-200 shrink-0 mx-0.5",
                                status === 'completed' && "opacity-40",
                                status === 'completed' && !isWrong && "text-green-500",
                                status === 'completed' && isWrong && "text-red-600 bg-red-100 rounded",
                                status === 'current' && "text-orange-600 font-bold scale-110 drop-shadow-md text-6xl", // Heavier and slightly larger
                                status === 'upcoming' && "text-slate-800"
                            )}
                        >
                            {char === ' ' ? '␣' : char}
                        </div>
                    );
                })}
            </div>

            {/* Gradient Masks for edges */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-gray-100 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-gray-100 to-transparent pointer-events-none" />
        </div>
    );
};
