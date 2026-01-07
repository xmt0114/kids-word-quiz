/**
 * AgeSelector Component
 * 年龄选择组件 - 用于儿童识字量测试的出生日期选择
 */

import React, { useState, useEffect } from 'react';
import { Calendar, AlertCircle, Sparkles, ChevronDown } from 'lucide-react';
import { loadSavedBirthDate } from './useLiteracyAssessmentGame';
import type { AgeSelectorProps } from './types';

// 漂浮图案组件
const FloatingPatterns: React.FC = () => {
  const patterns = [
    { char: '字', x: '10%', y: '15%', delay: '0s', duration: '8s', size: 'text-4xl' },
    { char: '书', x: '85%', y: '20%', delay: '1s', duration: '10s', size: 'text-3xl' },
    { char: '读', x: '20%', y: '75%', delay: '2s', duration: '9s', size: 'text-5xl' },
    { char: '学', x: '75%', y: '80%', delay: '0.5s', duration: '11s', size: 'text-4xl' },
    { char: 'A', x: '5%', y: '45%', delay: '1.5s', duration: '7s', size: 'text-3xl' },
    { char: 'B', x: '90%', y: '55%', delay: '2.5s', duration: '8s', size: 'text-2xl' },
    { char: '☁', x: '30%', y: '10%', delay: '0s', duration: '12s', size: 'text-6xl' },
    { char: '☁', x: '60%', y: '85%', delay: '3s', duration: '14s', size: 'text-5xl' },
    { char: '✨', x: '15%', y: '35%', delay: '1s', duration: '6s', size: 'text-2xl' },
    { char: '✨', x: '80%', y: '40%', delay: '2s', duration: '7s', size: 'text-3xl' },
    { char: '拼', x: '45%', y: '5%', delay: '0.5s', duration: '9s', size: 'text-3xl' },
    { char: '音', x: '55%', y: '90%', delay: '1.5s', duration: '10s', size: 'text-4xl' },
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

// 自定义选择器组件
interface CustomSelectProps {
  value: number;
  onChange: (value: number) => void;
  options: number[];
  label: string;
  disabled?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, label, disabled }) => {
  const alimamafangyuantiFont = { fontFamily: '"AlimamaFangYuanTiVF", "PingFang SC", "Microsoft YaHei", sans-serif' };
  
  return (
    <div className="flex flex-col items-center">
      <label 
        className="text-sm font-medium text-gray-600 mb-2" 
        style={alimamafangyuantiFont}
      >
        {label}
      </label>
      <div className="relative w-full">
        <select
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full px-6 py-3 text-lg font-semibold text-center bg-amber-50 border-2 border-amber-200 rounded-full appearance-none cursor-pointer transition-all duration-300 hover:border-purple-400 hover:bg-amber-100 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ ...alimamafangyuantiFont }}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600 pointer-events-none" />
      </div>
    </div>
  );
};

export const AgeSelector: React.FC<AgeSelectorProps> = ({
  onStartAssessment,
  isLoading,
  error,
}) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentDay = new Date().getDate();

  const years = Array.from({ length: 10 }, (_, i) => currentYear - 3 - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const [year, setYear] = useState<number>(currentYear - 5);
  const [month, setMonth] = useState<number>(currentMonth);
  const [day, setDay] = useState<number>(currentDay);
  const [age, setAge] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string>('');

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
      setValidationError(`年龄不能小于3岁，当前年龄为${calculatedAge}岁`);
    } else if (calculatedAge > 10) {
      setValidationError(`年龄不能大于10岁，当前年龄为${calculatedAge}岁`);
    } else {
      setValidationError('');
    }
  }, [year, month, day]);

  const handleStart = () => {
    if (validationError) return;
    const birthDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onStartAssessment(birthDate);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    if (day > daysInMonth) {
      setDay(daysInMonth);
    }
  }, [daysInMonth, day]);

  const alimamafangyuantiFont = { fontFamily: '"AlimamaFangYuanTiVF", "PingFang SC", "Microsoft YaHei", sans-serif' };

  return (
    <div 
      className="relative bg-gradient-to-br from-purple-500 via-pink-400 to-orange-400 flex items-center justify-center px-6"
      style={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}
    >
      {/* 漂浮图案背景 */}
      <FloatingPatterns />

      <div className="relative z-10 max-w-xl w-full">
        {/* 标题区域 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-18 h-18 bg-white/90 backdrop-blur rounded-full shadow-xl mb-4 animate-bounce-gentle">
            <Sparkles className="w-10 h-10 text-yellow-500" />
          </div>
          <h1 
            className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg"
            style={alimamafangyuantiFont}
          >
            儿童识字量测试
          </h1>
        </div>

        {/* 主卡片 */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 md:p-8">
          {/* 说明文字 */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 text-gray-700">
              <Calendar className="w-6 h-6 text-purple-500" />
              <span className="text-lg font-semibold" style={alimamafangyuantiFont}>
                请选择你的出生日期
              </span>
            </div>
          </div>

          {/* 日期选择器 */}
          <div className="grid grid-cols-3 gap-5 mb-6">
            <CustomSelect
              value={year}
              onChange={setYear}
              options={years}
              label="年"
              disabled={isLoading}
            />
            <CustomSelect
              value={month}
              onChange={setMonth}
              options={months}
              label="月"
              disabled={isLoading}
            />
            <CustomSelect
              value={day}
              onChange={setDay}
              options={days}
              label="日"
              disabled={isLoading}
            />
          </div>

          {/* 年龄显示 */}
          {age !== null && (
            <div className="mb-6 text-center">
              <div className={`inline-block px-6 py-2 rounded-full transition-all ${
                validationError 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700'
              }`}>
                <span className="font-semibold" style={alimamafangyuantiFont}>
                  {validationError ? '⚠️ ' : '✨ '}
                  当前年龄：{age} 岁
                </span>
              </div>
            </div>
          )}

          {/* 验证错误提示 */}
          {validationError && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-700 font-medium text-sm" style={alimamafangyuantiFont}>{validationError}</p>
                <p className="text-red-600 text-xs" style={alimamafangyuantiFont}>本测试适合 3-10 岁的小朋友</p>
              </div>
            </div>
          )}

          {/* API错误提示 */}
          {error && (
            <div className="mb-5 p-3 bg-orange-50 border border-orange-200 rounded-2xl flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-orange-700 font-medium text-sm" style={alimamafangyuantiFont}>出错了</p>
                <p className="text-orange-600 text-xs" style={alimamafangyuantiFont}>{error}</p>
              </div>
            </div>
          )}

          {/* 开始按钮 - 3D效果 + 脉冲动画 */}
          <button
            onClick={handleStart}
            disabled={isLoading || !!validationError}
            className={`w-full py-4 px-8 text-xl font-bold rounded-2xl transition-all transform ${
              isLoading || validationError
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-md'
                : 'bg-gradient-to-b from-blue-400 via-blue-500 to-blue-700 text-white shadow-[0_6px_0_0_#1e40af,0_8px_20px_rgba(30,64,175,0.4)] hover:shadow-[0_4px_0_0_#1e40af,0_6px_15px_rgba(30,64,175,0.4)] hover:translate-y-[2px] active:shadow-[0_0px_0_0_#1e40af,0_2px_5px_rgba(30,64,175,0.4)] active:translate-y-[6px] animate-pulse-button'
            }`}
            style={alimamafangyuantiFont}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                正在准备题目...
              </span>
            ) : (
              <span className="flex flex-col items-center">
                <span>🚀 开始测试</span>
                <span className="text-sm font-normal opacity-90">约 5-10 分钟</span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* CSS动画定义 */}
      <style>{`
        @keyframes float-pattern {
          0%, 100% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 0.1;
          }
          25% {
            transform: translateY(-20px) rotate(5deg) scale(1.05);
            opacity: 0.15;
          }
          50% {
            transform: translateY(-10px) rotate(-3deg) scale(1);
            opacity: 0.12;
          }
          75% {
            transform: translateY(-25px) rotate(3deg) scale(1.02);
            opacity: 0.08;
          }
        }

        @keyframes bounce-gentle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes pulse-button {
          0%, 90%, 100% {
            transform: scale(1) translateY(0);
          }
          95% {
            transform: scale(1.02) translateY(-2px);
          }
        }

        .animate-float-pattern {
          animation: float-pattern ease-in-out infinite;
        }

        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }

        .animate-pulse-button {
          animation: pulse-button 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
