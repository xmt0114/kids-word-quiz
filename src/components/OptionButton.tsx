import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { OptionButtonProps } from '../types';
import { cn } from '../lib/utils';

const OptionButton: React.FC<OptionButtonProps> = ({
  option,
  isSelected = false,
  isCorrect = false,
  isWrong = false,
  onClick,
  disabled = false,
}) => {
  const baseClasses = [
    'inline-flex items-center justify-center',
    'w-full min-h-touch min-w-touch',
    'p-md',
    'bg-background-secondary',
    'border-4 border-gray-200',
    'rounded-md',
    'text-h1 font-bold text-text-primary',
    'transition-all duration-fast',
    'focus:outline-none focus:ring-4 focus:ring-primary-500 focus:ring-opacity-50',
    'active:scale-95',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ];

  const stateClasses = {
    default: [
      'hover:border-primary-500 hover:scale-105',
    ],
    selected: [
      'bg-gradient-to-r from-primary-500 to-primary-600',
      'text-text-inverse',
      'border-primary-500',
      'shadow-md',
    ],
    correct: [
      'bg-success',
      'text-text-inverse',
      'border-success',
      'animate-bounce-in',
    ],
    wrong: [
      'bg-error',
      'text-text-inverse',
      'border-error',
      'animate-shake',
    ],
  };

  // 确定当前状态
  let currentState: keyof typeof stateClasses = 'default';
  if (isCorrect) {
    currentState = 'correct';
  } else if (isWrong) {
    currentState = 'wrong';
  } else if (isSelected) {
    currentState = 'selected';
  }

  const classes = cn(
    baseClasses,
    stateClasses[currentState]
  );

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isSelected}
    >
      <span className="flex items-center gap-sm text-h1">
        {option}
        {isCorrect && <CheckCircle size={24} />}
        {isWrong && <XCircle size={24} />}
      </span>
    </button>
  );
};

export { OptionButton };