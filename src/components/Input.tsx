import React, { useState, useRef, useEffect } from 'react';
import { InputProps } from '../types';
import { cn } from '../lib/utils';
import { CheckCircle, XCircle } from 'lucide-react';

const Input: React.FC<InputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder,
  hint,
  isCorrect = false,
  isWrong = false,
  disabled = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const baseClasses = [
    'w-full',
    'min-h-input',
    'pl-lg pr-xl', // 增加右侧内边距以容纳图标
    'py-md',
    'bg-background-secondary',
    'border-4',
    'rounded-md',
    'text-h2 font-bold text-text-primary',
    'transition-all duration-fast',
    'focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-opacity-50', // 改为蓝色聚焦环
    'placeholder:text-text-tertiary',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ];

  const stateClasses = {
    default: [
      'border-gray-200',
      'shadow-sm',
    ],
    focused: [
      'border-blue-500', // 改为蓝色边框
      'shadow-md',
    ],
    correct: [
      'border-success',
      'bg-green-50',
      'shadow-md',
      'animate-bounce-in',
      'text-green-600', // 文字也变绿
    ],
    wrong: [
      'border-error',
      'bg-red-50',
      'shadow-md',
      'animate-shake',
      'text-red-500', // 文字变红
    ],
  };

  // 确定当前状态
  let currentState: keyof typeof stateClasses = 'default';
  if (isCorrect) {
    currentState = 'correct';
  } else if (isWrong) {
    currentState = 'wrong';
  } else if (isFocused) {
    currentState = 'focused';
  }

  const classes = cn(
    baseClasses,
    stateClasses[currentState]
  );

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit();
    }
  };

  // 自动聚焦到输入框
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  return (
    <div className="w-full flex flex-col items-center space-y-lg">
      {hint && (
        <div className="text-h1 font-bold text-text-primary text-center">
          {hint}
        </div>
      )}
      <div className="w-full max-w-xs relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className={classes}
          aria-label="输入答案"
        />

        {/* 状态图标 */}
        {isCorrect && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 animate-in zoom-in spin-in-90 duration-300">
            <CheckCircle size={32} strokeWidth={3} />
          </div>
        )}

        {isWrong && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 animate-in zoom-in duration-300">
            <XCircle size={32} strokeWidth={3} />
          </div>
        )}
      </div>
    </div>
  );
};

export { Input };