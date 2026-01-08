/**
 * FinalTransition Component
 * 最终过渡组件 - 测试完成后的可爱提示界面
 */

import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, Heart, Star } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import type { FinalTransitionProps } from './types';

export const FinalTransition: React.FC<FinalTransitionProps> = ({
    onComplete,
}) => {
    const { playSound } = useAppStore();
    const [dots, setDots] = useState('');

    useEffect(() => {
        // 播放轻快的音效
        playSound('success');

        // 加载动画的点点点
        const dotsInterval = setInterval(() => {
            setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
        }, 500);

        // 3秒后自动进入结果页
        const timer = setTimeout(() => {
            onComplete();
        }, 3000);

        return () => {
            clearInterval(dotsInterval);
            clearTimeout(timer);
        };
    }, [onComplete, playSound]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-purple-400 to-fuchsia-500 flex items-center justify-center p-4 relative overflow-hidden">
            {/* 背景浮动装饰 */}
            <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 15 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute animate-float-gentle opacity-30"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${5 + Math.random() * 5}s`,
                        }}
                    >
                        <Star className="text-white" size={15 + Math.random() * 20} fill="currentColor" />
                    </div>
                ))}
            </div>

            {/* 主内容卡片 */}
            <div className="relative z-10 max-w-xl w-full">
                <div className="bg-white/90 backdrop-blur-md rounded-[3rem] shadow-2xl p-10 md:p-14 text-center animate-scale-in border-4 border-white/50">
                    {/* 动画图标组 */}
                    <div className="flex justify-center items-center gap-6 mb-10">
                        <div className="animate-bounce-gentle" style={{ animationDelay: '0s' }}>
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center rotate-[-10deg]">
                                <Sparkles className="w-10 h-10 text-blue-500" />
                            </div>
                        </div>
                        <div className="animate-bounce-gentle" style={{ animationDelay: '0.2s' }}>
                            <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center shadow-lg">
                                <CheckCircle2 className="w-14 h-14 text-green-500" />
                            </div>
                        </div>
                        <div className="animate-bounce-gentle" style={{ animationDelay: '0.4s' }}>
                            <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center rotate-[15deg]">
                                <Heart className="w-10 h-10 text-pink-500" fill="currentColor" />
                            </div>
                        </div>
                    </div>

                    {/* 文字内容 */}
                    <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-6 font-alimama">
                        测试完成啦！
                    </h2>

                    <div className="space-y-4">
                        <p className="text-xl md:text-2xl font-bold text-slate-600 font-alimama">
                            结果马上就来{dots}
                        </p>
                        <p className="text-lg text-slate-500 animate-pulse font-alimama">
                            正在为你生成精美的测评报告
                        </p>
                    </div>

                    {/* 底部加载条装饰 */}
                    <div className="mt-12 flex justify-center gap-2">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-bounce"
                                style={{ animationDelay: `${i * 0.15}s` }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* 局部动画样式 */}
            <style>{`
        @keyframes scale-in {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes float-gentle {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(20deg); }
        }
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-scale-in { animation: scale-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-float-gentle { animation: float-gentle infinite ease-in-out; }
        .animate-bounce-gentle { animation: bounce-gentle infinite ease-in-out; }
      `}</style>
        </div>
    );
};
