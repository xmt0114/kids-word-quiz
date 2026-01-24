import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { KEYBOARD_MAP, getShiftKey, KeyConfig } from './KeyboardMap';

interface VirtualKeyboardProps {
    targetChar: string;
    showHint: boolean;
    className?: string;
}

const ROWS = [
    ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
    ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
    ['CapsLock', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\'', 'Enter'],
    ['ShiftLeft', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'ShiftRight'],
    ['Space']
];

const KEY_LABELS: Record<string, string> = {
    'ShiftLeft': 'Shift',
    'ShiftRight': 'Shift',
    'Backspace': '←',
    'Tab': 'Tab',
    'CapsLock': 'Caps',
    'Enter': 'Enter',
    'Space': ' ',
    'ArrowUp': '↑',
    'ArrowLeft': '←',
    'ArrowDown': '↓',
    'ArrowRight': '→'
};

const getBaseKey = (keyChar: string) => {
    // Map uppercase/symbols back to their base key on the keyboard for highlighting
    // e.g. '!' -> '1', 'A' -> 'a'

    // Reverse lookup in KEYBOARD_MAP? 
    // Actually KEYBOARD_MAP keys are the characters themselves (e.g. '!' or 'A')
    // We want to know which PHYSICAL key to light up on render.
    // The render loop iterates over ROWS which contains '1', 'a' etc.

    // If target is '!', KEYBOARD_MAP['!'] gives code 'Digit1'.
    // We need to match 'Digit1' to the key in ROWS.
    // The keys in ROWS are mostly characters, but some are special names (ShiftLeft).
    // Let's rely on `code` from KeyboardEvents for mapping Row items to physical IDs.
    return keyChar;
};

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ targetChar, showHint, className }) => {
    const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return;
            setPressedKeys(prev => {
                const newSet = new Set(prev);
                newSet.add(e.code);
                return newSet;
            });
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            setPressedKeys(prev => {
                const newSet = new Set(prev);
                newSet.delete(e.code);
                return newSet;
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Determine which keys to highlight based on targetChar
    const getTargetKeyData = () => {
        if (!targetChar) return null;
        return KEYBOARD_MAP[targetChar];
    };

    const targetKeyData = getTargetKeyData();
    const targetCode = targetKeyData?.code;
    const requiredShift = targetKeyData?.isShift;

    // Determine which shift key to highlight specifically
    let targetShiftCode: string | null = null;
    if (requiredShift && targetKeyData) {
        const fingers = targetKeyData.fingers;
        const isLeftHand = fingers.some(f => f.startsWith('left'));
        targetShiftCode = isLeftHand ? 'ShiftRight' : 'ShiftLeft';
    }

    const getCodeFromKeyLabel = (keyLabel: string, rowIndex: number): string => {
        // Special mappings for the visual layout array
        if (keyLabel === 'ShiftLeft') return 'ShiftLeft';
        if (keyLabel === 'ShiftRight') return 'ShiftRight';
        if (keyLabel === 'Backspace') return 'Backspace';
        if (keyLabel === 'Tab') return 'Tab';
        if (keyLabel === 'CapsLock') return 'CapsLock';
        if (keyLabel === 'Enter') return 'Enter';
        if (keyLabel === 'Space') return 'Space';
        if (keyLabel === '\\') return 'Backslash';

        // For standard keys based on row position and label
        if (rowIndex === 0) {
            if (!isNaN(parseInt(keyLabel))) return `Digit${keyLabel}`;
            if (keyLabel === '`') return 'Backquote';
            if (keyLabel === '-') return 'Minus';
            if (keyLabel === '=') return 'Equal';
        }
        if (rowIndex === 1) {
            if (keyLabel === '[') return 'BracketLeft';
            if (keyLabel === ']') return 'BracketRight';
        }
        if (rowIndex === 2) {
            if (keyLabel === ';') return 'Semicolon';
            if (keyLabel === '\'') return 'Quote';
        }
        if (rowIndex === 3) {
            if (keyLabel === ',') return 'Comma';
            if (keyLabel === '.') return 'Period';
            if (keyLabel === '/') return 'Slash';
        }

        if (/^[a-z]$/.test(keyLabel)) return `Key${keyLabel.toUpperCase()}`;

        // Fallback
        return keyLabel;
    };

    const getRowStyle = () => {
        return "flex justify-center w-full gap-1 md:gap-2 lg:gap-3 mb-1 md:mb-2 lg:mb-3";
    };

    const getKeyClass = (keyLabel: string, code: string) => {
        const isPressed = pressedKeys.has(code);
        const isTarget = showHint && (code === targetCode || code === targetShiftCode);

        // Responsive Sizing Map
        // Standard: w-8 h-10 text-xs -> sm:w-10 sm:h-12 sm:text-sm -> md:w-12 md:h-14 md:text-base -> lg:w-14 lg:h-16 lg:text-lg -> xl:w-16 xl:h-18 xl:text-xl

        let widthClass = "w-8 sm:w-10 md:w-12 lg:w-14 xl:w-16"; // Default key width

        if (keyLabel === 'Space') {
            // ~8x standard width
            widthClass = "w-64 sm:w-80 md:w-96 lg:w-[28rem] xl:w-[32rem]";
        } else if (['ShiftLeft', 'ShiftRight', 'Enter', 'CapsLock'].includes(keyLabel)) {
            // ~2x standard width
            widthClass = "w-16 sm:w-20 md:w-24 lg:w-28 xl:w-32";
        } else if (['Tab', 'Backspace', '\\'].includes(keyLabel)) {
            // ~1.5/1.7x standard width
            widthClass = "w-12 sm:w-[3.75rem] md:w-[4.5rem] lg:w-24 xl:w-28";
        }

        return cn(
            "relative flex items-center justify-center rounded-lg sm:rounded-xl shadow-sm transition-all duration-75 border-b-[3px] md:border-b-[4px] lg:border-b-[5px] select-none font-bold",
            // Responsive Dimensions
            widthClass,
            "h-10 sm:h-12 md:h-14 lg:h-16 xl:h-[4.5rem]", // h-18 doesn't exist by default, using arbitrary
            // Responsive Text
            "text-[10px] sm:text-xs md:text-sm lg:text-lg xl:text-xl",

            // Colors & States
            isTarget
                ? cn(
                    "bg-orange-500 border-orange-600 text-white font-bold shadow-[0_0_10px_rgba(249,115,22,0.4)] md:shadow-[0_0_20px_rgba(249,115,22,0.6)] drop-shadow-md z-10",
                    isPressed ? "translate-y-1 border-b-0 bg-orange-600 scale-100" : "animate-pulse-slow scale-105"
                )
                : isPressed
                    ? "bg-slate-200 border-slate-400 translate-y-1 border-b-0 shadow-inner text-slate-900"
                    : "bg-white border-gray-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300"
        );
    };

    return (
        <div className={cn("flex flex-col select-none", className)}>
            {ROWS.map((row, rowIndex) => (
                <div key={rowIndex} className={getRowStyle()}>
                    {row.map((keyLabel) => {
                        const code = getCodeFromKeyLabel(keyLabel, rowIndex);

                        // Handle special display labels
                        let displayLabel = keyLabel;
                        if (keyLabel === 'Backspace') displayLabel = '⌫';
                        else if (keyLabel === 'Enter') displayLabel = '↵';
                        else if (keyLabel === 'ShiftLeft' || keyLabel === 'ShiftRight') displayLabel = '⇧';
                        else if (keyLabel === 'CapsLock') displayLabel = '⇪';
                        else if (keyLabel === 'Tab') displayLabel = '↹';
                        else if (keyLabel === 'Space') displayLabel = '';
                        else if (keyLabel.length === 1) displayLabel = keyLabel.toUpperCase();

                        return (
                            <button
                                key={keyLabel}
                                className={getKeyClass(keyLabel, code)}
                                onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
                            >
                                {displayLabel}
                            </button>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};
