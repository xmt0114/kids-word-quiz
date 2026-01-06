import React from 'react';
import { X, Settings } from 'lucide-react';
import { Button } from '../Button';
import { TypingGameSettings } from './types';
import { cn } from '../../lib/utils';
import { SoundType } from '../../stores/slices/soundSlice';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: TypingGameSettings;
    onUpdate: (newSettings: TypingGameSettings) => void;
    playSound?: (type: SoundType) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    settings,
    onUpdate,
    playSound
}) => {
    if (!isOpen) return null;

    const handleChange = (key: keyof TypingGameSettings, value: number) => {
        onUpdate({
            ...settings,
            [key]: value
        });
        playSound?.('click');
    };

    const handleClose = () => {
        playSound?.('click');
        onClose();
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-md w-full animate-in zoom-in-95 duration-300 relative border border-white/50">
                <button
                    onClick={handleClose}
                    className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 rounded-full p-2 hover:bg-slate-100 transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600">
                        <Settings size={28} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">游戏设置</h2>
                </div>

                <div className="space-y-8">
                    {/* Sequence Length */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">
                                练习长度
                            </label>
                            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-mono font-bold text-sm">
                                {settings.lineLength} 字
                            </span>
                        </div>
                        <input
                            type="range"
                            min="20"
                            max="100"
                            step="5"
                            value={settings.lineLength}
                            onChange={(e) => handleChange('lineLength', Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all hover:bg-slate-300"
                        />
                        <div className="flex justify-between text-xs text-slate-400 font-medium px-1">
                            <span>20</span>
                            <span>100</span>
                        </div>
                    </div>

                    {/* Accuracy Requirement */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">
                                及格线
                            </label>
                            <span className={cn(
                                "px-3 py-1 rounded-lg font-mono font-bold text-sm",
                                settings.minAccuracy >= 95 ? "bg-green-50 text-green-600" :
                                    settings.minAccuracy >= 90 ? "bg-orange-50 text-orange-600" :
                                        "bg-red-50 text-red-600"
                            )}>
                                {settings.minAccuracy}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min="80"
                            max="100"
                            step="5"
                            value={settings.minAccuracy}
                            onChange={(e) => handleChange('minAccuracy', Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-500 focus:outline-none focus:ring-2 focus:ring-green-300 transition-all hover:bg-slate-300"
                        />
                        <div className="flex justify-between text-xs text-slate-400 font-medium px-1">
                            <span>80%</span>
                            <span>100%</span>
                        </div>
                    </div>

                    {/* Hint Delay */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">
                                提示延迟
                            </label>
                            <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-lg font-mono font-bold text-sm">
                                {settings.hintDelay} 秒
                            </span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="5"
                            step="0.5"
                            value={settings.hintDelay}
                            onChange={(e) => handleChange('hintDelay', Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all hover:bg-slate-300"
                        />
                        <div className="flex justify-between text-xs text-slate-400 font-medium px-1">
                            <span>1s</span>
                            <span>5s</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
                    <Button
                        size="large"
                        onClick={handleClose}
                        className="w-full sm:w-auto min-w-[200px] bg-slate-800 hover:bg-slate-900 text-white shadow-lg justify-center"
                    >
                        完成设置
                    </Button>
                </div>
            </div>
        </div>
    );
};
