import React from 'react';
import { cn } from '../../lib/utils';
import { KEYBOARD_MAP, FingerName } from './KeyboardMap';

interface HandGuidesProps {
    targetChar: string;
    showHint: boolean;
    className?: string;
}

// 指甲位置配置 - 相对于单张手部图片左上角的百分比位置
type FingerPositionKey = FingerName | 'left-thumb' | 'right-thumb';

const FINGER_POSITIONS: Record<FingerPositionKey | 'thumb', { top: string; left: string }> = {
    'left-pinky': { top: '35%', left: '16%' },
    'left-ring': { top: '25%', left: '35%' },
    'left-middle': { top: '22%', left: '54%' },
    'left-index': { top: '26%', left: '72%' },
    'left-thumb': { top: '65%', left: '88%' },
    'right-index': { top: '26%', left: '28%' },
    'right-middle': { top: '22%', left: '48%' },
    'right-ring': { top: '25%', left: '68%' },
    'right-pinky': { top: '35%', left: '88%' },
    'right-thumb': { top: '65%', left: '12%' },
    'thumb': { top: '65%', left: '88%' },
};

// 手部全局位置配置 - 用于调整手在键盘容器上的百分比位置
// 调整这里即可移动整只手
const HAND_CONFIG = {
    left: {
        top: '85%',    // 纵向：数值越大越靠下
        left: '25%',   // 横向：数值越小越靠左
        scale: 1.15    // 大小
    },
    right: {
        top: '86%',    // 纵向
        left: '70%',   // 横向：数值越大越靠右
        scale: 1.15
    }
};

export const HandGuides: React.FC<HandGuidesProps> = ({ targetChar, showHint, className }) => {
    const activeFingers = React.useMemo(() => {
        if (!showHint || !targetChar || !KEYBOARD_MAP[targetChar]) return [];
        return KEYBOARD_MAP[targetChar].fingers;
    }, [showHint, targetChar]);

    const isFingerActive = (finger: FingerPositionKey): boolean => {
        if (finger === 'left-thumb' || finger === 'right-thumb') return activeFingers.includes('thumb');
        return activeFingers.includes(finger as FingerName);
    };

    const leftFingers: FingerPositionKey[] = ['left-pinky', 'left-ring', 'left-middle', 'left-index', 'left-thumb'];
    const rightFingers: FingerPositionKey[] = ['right-index', 'right-middle', 'right-ring', 'right-pinky', 'right-thumb'];

    const renderGlow = (finger: FingerPositionKey) => {
        const pos = FINGER_POSITIONS[finger];
        return (
            <div key={finger} className="absolute inset-0 z-30">
                <div className="absolute w-16 h-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/25 blur-2xl animate-pulse-slow" style={{ top: pos.top, left: pos.left }} />
                <div className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-orange-400/50 to-orange-200/50 blur-lg animate-pulse" style={{ top: pos.top, left: pos.left, animationDelay: '0.1s' }} />
                <div className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white blur-[1px] shadow-[0_0_12px_#fff,0_0_20px_#f97316] animate-bounce-subtle" style={{ top: pos.top, left: pos.left }} />
            </div>
        );
    };

    return (
        <div className={cn("relative w-full h-full pointer-events-none overflow-hidden", className)}>
            {/* Left Hand */}
            <div
                className="absolute w-[350px] md:w-[420px] transition-all duration-300 origin-center"
                style={{
                    top: HAND_CONFIG.left.top,
                    left: HAND_CONFIG.left.left,
                    transform: `translate(-50%, -50%) scale(${HAND_CONFIG.left.scale})`,
                }}
            >
                <div className="relative w-full">
                    <img src="/img/left_hand.png" alt="" className="w-full h-auto opacity-40 grayscale-[0.1]" />
                    {leftFingers.map(f => isFingerActive(f) && renderGlow(f))}
                </div>
            </div>

            {/* Right Hand */}
            <div
                className="absolute w-[350px] md:w-[420px] transition-all duration-300 origin-center"
                style={{
                    top: HAND_CONFIG.right.top,
                    left: HAND_CONFIG.right.left,
                    transform: `translate(-50%, -50%) scale(${HAND_CONFIG.right.scale})`,
                }}
            >
                <div className="relative w-full">
                    <img src="/img/right_hand.png" alt="" className="w-full h-auto opacity-40 grayscale-[0.1]" />
                    {rightFingers.map(f => isFingerActive(f) && renderGlow(f))}
                </div>
            </div>
        </div>
    );
};
