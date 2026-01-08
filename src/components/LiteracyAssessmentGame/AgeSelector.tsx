/**
 * AgeSelector Component
 * 年龄选择组件 - 用于儿童识字量测试的出生日期选择
 */

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, AlertCircle, Sparkles, ArrowLeft } from 'lucide-react';
import { loadSavedBirthDate } from './useLiteracyAssessmentGame';
import { useAppStore } from '../../stores/appStore';
import type { AgeSelectorProps } from './types';

// ==================== WheelPicker Component ====================

interface WheelPickerProps {
  value: number;
  onChange: (value: number) => void;
  options: number[];
  label: string;
}

const WheelPicker: React.FC<WheelPickerProps> = ({ value, onChange, options, label }) => {
  const { playSound } = useAppStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const alimamaFont = { fontFamily: '"AlimamaFangYuanTiVF", "PingFang SC", "Microsoft YaHei", sans-serif' };
  const itemHeight = 44;

  // 用一个 ref 记录上一次播放声音的时间，避免高频触发
  const lastSoundPlayedRef = useRef(0);

  // 初始滚动到选中项
  useEffect(() => {
    const index = options.indexOf(value);
    if (index !== -1 && scrollRef.current) {
      scrollRef.current.scrollTop = index * itemHeight;
    }
  }, []);

  // 当值改变时播放音效（限流）
  useEffect(() => {
    const now = Date.now();
    if (now - lastSoundPlayedRef.current > 100) {
      playSound('hover');
      lastSoundPlayedRef.current = now;
    }
  }, [value, playSound]);

  // 用一个 ref 记录滚轮累积位移，防止跳动过快
  const wheelDeltaRef = useRef(0);
  const WHEEL_THRESHOLD = 120; // 进一步降低灵敏度，累计到 120 像素移动一次

  // 处理滚轮事件：接管原生滚动，使其更精准和受控
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!scrollRef.current) return;

    wheelDeltaRef.current += e.deltaY;

    if (Math.abs(wheelDeltaRef.current) >= WHEEL_THRESHOLD) {
      const direction = wheelDeltaRef.current > 0 ? 1 : -1;
      wheelDeltaRef.current = 0; // 重置累积

      const currentIndex = options.indexOf(value);
      let nextIndex = currentIndex + direction;
      nextIndex = Math.max(0, Math.min(nextIndex, options.length - 1));

      if (nextIndex !== currentIndex) {
        scrollRef.current.scrollTo({
          top: nextIndex * itemHeight,
          behavior: 'smooth'
        });
        onChange(options[nextIndex]);
      }
    }
  };

  // 点击选项滚动
  const handleItemClick = (index: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: index * itemHeight,
        behavior: 'smooth'
      });
    }
    onChange(options[index]);
  };

  return (
    <div className="flex flex-col items-center">
      <span className="text-base font-bold text-purple-800/80 mb-3">{label}</span>
      <div className="relative w-20 md:w-24 h-[132px] overflow-hidden group">
        {/* 指示器背景 */}
        <div className="absolute top-1/2 left-0 right-0 h-[44px] -translate-y-1/2 bg-purple-100/50 rounded-xl pointer-events-none border border-purple-200/50 shadow-inner"></div>

        {/* 渐变遮罩 */}
        <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white via-white/80 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none"></div>

        {/* 滚动容器 */}
        <div
          ref={scrollRef}
          onWheel={handleWheel}
          className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar scroll-smooth"
          style={{ scrollbarWidth: 'none', touchAction: 'pan-y' }}
        >
          {/* 顶部占位 */}
          <div className="h-[44px]" />

          {options.map((opt, i) => {
            const isSelected = value === opt;
            return (
              <div
                key={opt}
                onClick={() => handleItemClick(i)}
                className={`h-[44px] flex items-center justify-center snap-center cursor-pointer transition-all duration-300 ${isSelected
                  ? 'text-2xl font-bold text-purple-700 scale-110'
                  : 'text-lg md:text-xl text-gray-400 font-medium hover:text-purple-400'
                  }`}
              >
                {opt}
              </div>
            );
          })}

          {/* 底部占位 */}
          <div className="h-[44px]" />
        </div>
      </div>
    </div>
  );
};

// ==================== FloatingPatterns Component ====================

const FloatingPatterns: React.FC = () => {
  const patterns = [
    { char: '字', x: '10%', y: '15%', delay: '0s', duration: '8s', size: 'text-4xl' },
    { char: '书', x: '85%', y: '20%', delay: '1s', duration: '10s', size: 'text-3xl' },
    { char: '读', x: '20%', y: '75%', delay: '2s', duration: '9s', size: 'text-5xl' },
    { char: '学', x: '75%', y: '80%', delay: '0.5s', duration: '11s', size: 'text-4xl' },
    { char: '☁', x: '30%', y: '10%', delay: '0s', duration: '12s', size: 'text-6xl' },
    { char: '☁', x: '60%', y: '85%', delay: '3s', duration: '14s', size: 'text-5xl' },
    { char: '✨', x: '15%', y: '35%', delay: '1s', duration: '6s', size: 'text-2xl' },
    { char: '✨', x: '80%', y: '40%', delay: '2s', duration: '7s', size: 'text-3xl' },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {patterns.map((p, i) => (
        <div
          key={i}
          className={`absolute ${p.size} text-white/10 animate-float-pattern`}
          style={{
            left: p.x,
            top: p.y,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        >
          {p.char}
        </div>
      ))}
    </div>
  );
};

// ==================== AgeSelector Component ====================

export const AgeSelector: React.FC<AgeSelectorProps> = ({
  onStartAssessment,
  onBack,
  isLoading,
  error,
}) => {
  const { addNotification } = useAppStore.getState();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentDay = new Date().getDate();

  // 限制年份范围为当前年减 20 到当前年（虽然目标是 3-10，但允许用户滚动）
  const years = Array.from({ length: 15 }, (_, i) => currentYear - 2 - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const [year, setYear] = useState<number>(currentYear - 5);
  const [month, setMonth] = useState<number>(currentMonth);
  const [day, setDay] = useState<number>(currentDay);
  const [age, setAge] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string>('');
  const [isShaking, setIsShaking] = useState(false);
  const { playSound } = useAppStore();

  const calculateAge = (birthYear: number, birthMonth: number, birthDay: number): number => {
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthYear;
    const monthDiff = today.getMonth() + 1 - birthMonth;
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDay)) {
      calculatedAge--;
    }
    return calculatedAge;
  };

  useEffect(() => {
    const savedBirthDate = loadSavedBirthDate();
    if (savedBirthDate) {
      const [savedYear, savedMonth, savedDay] = savedBirthDate.split('-').map(Number);
      if (savedYear && savedMonth && savedDay) {
        setYear(savedYear);
        setMonth(savedMonth);
        setDay(savedDay);
      }
    }
  }, []);

  useEffect(() => {
    const calculatedAge = calculateAge(year, month, day);
    setAge(calculatedAge);

    if (calculatedAge < 3) {
      setValidationError(`小朋友还太小啦（${calculatedAge}岁），建议 3 岁后再来尝试哦`);
    } else if (calculatedAge > 10) {
      setValidationError(`大朋友了（${calculatedAge}岁），本测试主要针对 10 岁以下学龄前及低年级儿童`);
    } else {
      setValidationError('');
    }
  }, [year, month, day]);

  const handleStart = () => {
    if (validationError) {
      playSound('wrong');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);

      addNotification({
        type: 'warning',
        message: validationError,
        duration: 3000
      });
      return;
    }
    const birthDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onStartAssessment(birthDate);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // 当月份变化导致天数变小时，自动修正当前选中的日期
  useEffect(() => {
    if (day > daysInMonth) {
      setDay(daysInMonth);
    }
  }, [daysInMonth, month, year]);

  const alimamaFont = { fontFamily: '"AlimamaFangYuanTiVF", "PingFang SC", "Microsoft YaHei", sans-serif' };

  return (
    <div
      className="relative min-h-screen bg-gradient-to-br from-purple-500 via-pink-400 to-orange-400 flex flex-col items-center justify-start pt-[4vh] pb-10 px-6 overflow-hidden"
      style={alimamaFont}
    >
      {/* 漂浮图案背景 */}
      <FloatingPatterns />

      <div className="relative z-10 max-w-lg w-full flex flex-col items-center max-h-[94%]">
        {/* 标题区域 - 比例收紧 */}
        <div className="text-center mb-4 md:mb-6 transform scale-90 md:scale-100 flex-shrink-0">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/90 backdrop-blur rounded-3xl shadow-2xl mb-3 animate-bounce-gentle border-4 border-white/50">
            <Sparkles className="w-8 h-8 text-yellow-500 drop-shadow-md" />
          </div>
          <h1 className="text-3xl md:text-3xl font-bold text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)] tracking-wide">
            儿童识字量测试
          </h1>
          <p className="mt-1 text-white/80 text-sm md:text-base font-medium tracking-wider">
            发现孩子的识字潜能
          </p>
        </div>

        {/* 主卡片 - 更加紧凑 */}
        <div className="bg-white/95 backdrop-blur-md rounded-[32px] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.2)] p-6 md:p-8 w-full border border-white/50 overflow-y-auto max-h-full no-scrollbar flex-shrink flex flex-col items-center relative">
          {/* 返回按钮 */}
          {onBack && (
            <button
              onClick={onBack}
              className="absolute top-4 left-4 p-2.5 rounded-full text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 group"
              title="返回主页"
            >
              <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          )}

          {/* 说明文字 */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 text-gray-800">
              <Calendar className="w-6 h-6 text-purple-600" />
              <span className="text-lg md:text-xl font-bold">
                请选择出生日期
              </span>
            </div>
          </div>

          {/* 滚轮式日期选择器 */}
          <div className="flex justify-center gap-4 md:gap-8 mb-6 bg-gray-50/50 p-4 rounded-3xl border border-gray-100 shadow-inner w-full max-w-sm">
            <WheelPicker
              value={year}
              onChange={setYear}
              options={years}
              label="年"
            />
            <WheelPicker
              value={month}
              onChange={setMonth}
              options={months}
              label="月"
            />
            <WheelPicker
              value={day}
              onChange={setDay}
              options={days}
              label="日"
            />
          </div>

          {/* 年龄显示 badge */}
          {age !== null && (
            <div className={`mb-6 text-center transition-all ${isShaking ? 'animate-shake' : ''}`}>
              <div className={`inline-flex items-center gap-2 px-6 py-2 rounded-2xl transition-all shadow-sm ${validationError
                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                : 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-200'
                }`}>
                <span className="text-base md:text-lg font-bold flex items-center gap-2">
                  {validationError ? <AlertCircle className="w-5 h-5" /> : <Sparkles className="w-5 h-5 animate-pulse" />}
                  当前年龄：{age} 岁
                </span>
              </div>
            </div>
          )}

          {/* 开始按钮 - 宽度自适应 + 阴影减轻 */}
          <button
            onClick={handleStart}
            disabled={isLoading}
            className={`w-auto min-w-[240px] px-12 py-4 text-xl md:text-2xl font-black rounded-3xl transition-all transform flex-shrink-0 ${isLoading
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-b from-blue-400 via-blue-600 to-blue-800 text-white shadow-[0_6px_0_0_#1e40af,0_10px_20px_rgba(30,64,175,0.3)] hover:shadow-[0_4px_0_0_#1e40af,0_8px_15px_rgba(30,64,175,0.3)] hover:translate-y-[2px] active:shadow-[0_1px_0_0_#1e40af,0_3px_8px_rgba(30,64,175,0.3)] active:translate-y-[5px]'
              }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                正在出发...
              </span>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-3">
                  <span>🚀 开启识字大冒险</span>
                </div>
                <span className="text-sm font-medium opacity-80 bg-black/10 px-3 py-0.5 rounded-full">约 5-10 分钟</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* CSS 动画 & 隐藏滚动条 */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @keyframes float-pattern {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); opacity: 0.1; }
          50% { transform: translateY(-30px) rotate(5deg) scale(1.1); opacity: 0.2; }
        }

        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }

        .animate-float-pattern {
          animation: float-pattern ease-in-out infinite;
        }

        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }

        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
};
