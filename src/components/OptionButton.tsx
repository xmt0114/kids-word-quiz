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
    'w-full min-h-[80px]',
    'p-6',
    'bg-white',
    'border-4 border-gray-200',
    'rounded-2xl',
    'font-bold text-text-primary',
    'transition-all duration-300',
    'focus:outline-none focus:ring-4 focus:ring-primary-500 focus:ring-opacity-50',
    'active:scale-95',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'shadow-lg hover:shadow-xl',
  ];

  const stateClasses = {
    default: [
      'hover:border-orange-400 hover:scale-105 hover:bg-orange-50',
    ],
    selected: [
      'bg-gradient-to-br from-orange-400 to-red-400',
      'text-white',
      'border-orange-500',
      'shadow-xl transform scale-105',
    ],
    correct: [
      'bg-gradient-to-br from-green-400 to-green-600',
      'text-white',
      'border-green-500',
      'animate-bounce-in shadow-xl',
    ],
    wrong: [
      'bg-gradient-to-br from-red-400 to-red-600',
      'text-white',
      'border-red-500',
      'animate-shake shadow-xl',
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
      <span 
        className={cn(
          "flex items-center gap-3 text-center",
          (isSelected || isCorrect || isWrong) && "drop-shadow-sm"
        )}
        style={(isSelected || isCorrect || isWrong) ? {
          textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
        } : {}}
      >
        {option}
        {isCorrect && <CheckCircle size={28} className="animate-bounce" />}
        {isWrong && <XCircle size={28} className="animate-pulse" />}
      </span>
    </button>
  );
};

export { OptionButton };