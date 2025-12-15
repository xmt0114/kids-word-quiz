import React from 'react';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../lib/utils';

interface WordNavigatorProps {
  currentIndex: number;
  totalCount: number;
  onPrevious: () => void;
  onNext: () => void;
  hasUnsavedChanges: boolean;
  onConfirmNavigation?: (direction: 'previous' | 'next', action?: 'step' | 'jump-first' | 'jump-last') => void;
  onJumpToFirst?: () => void;
  onJumpToLast?: () => void;
}

export const WordNavigator: React.FC<WordNavigatorProps> = ({
  currentIndex,
  totalCount,
  onPrevious,
  onNext,
  hasUnsavedChanges,
  onConfirmNavigation,
  onJumpToFirst,
  onJumpToLast
}) => {
  const handlePrevious = () => {
    if (hasUnsavedChanges && onConfirmNavigation) {
      onConfirmNavigation('previous');
    } else {
      onPrevious();
    }
  };

  const handleNext = () => {
    if (hasUnsavedChanges && onConfirmNavigation) {
      onConfirmNavigation('next');
    } else {
      onNext();
    }
  };

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalCount - 1;

  return (
    <div className="flex items-center gap-2">
      {/* 位置指示 */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className="font-medium">
          {totalCount > 0 ? currentIndex + 1 : 0} / {totalCount}
        </span>
        {hasUnsavedChanges && (
          <div className="flex items-center gap-1 text-orange-600">
            <AlertTriangle size={14} />
            <span className="text-xs">有未保存修改</span>
          </div>
        )}
      </div>

      {/* 导航按钮 */}
      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          onClick={handlePrevious}
          disabled={isFirst}
          className={cn(
            "p-2 min-w-0",
            hasUnsavedChanges && !isFirst && "border-orange-300 hover:border-orange-400"
          )}
          title={isFirst ? "已是第一个" : hasUnsavedChanges ? "上一个（有未保存修改）" : "上一个"}
        >
          <ChevronLeft size={20} />
        </Button>
        
        <Button
          variant="secondary"
          onClick={handleNext}
          disabled={isLast}
          className={cn(
            "p-2 min-w-0",
            hasUnsavedChanges && !isLast && "border-orange-300 hover:border-orange-400"
          )}
          title={isLast ? "已是最后一个" : hasUnsavedChanges ? "下一个（有未保存修改）" : "下一个"}
        >
          <ChevronRight size={20} />
        </Button>
      </div>

      {/* 快速跳转 */}
      {totalCount > 10 && (
        <div className="flex items-center gap-1 ml-2">
          <Button
            variant="secondary"
            onClick={() => {
              if (hasUnsavedChanges && onConfirmNavigation) {
                onConfirmNavigation('previous', 'jump-first');
              } else {
                onJumpToFirst?.();
              }
            }}
            disabled={isFirst}
            className="px-2 py-1 text-xs"
            title="跳转到第一个"
          >
            首个
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => {
              if (hasUnsavedChanges && onConfirmNavigation) {
                onConfirmNavigation('next', 'jump-last');
              } else {
                onJumpToLast?.();
              }
            }}
            disabled={isLast}
            className="px-2 py-1 text-xs"
            title="跳转到最后一个"
          >
            末个
          </Button>
        </div>
      )}
    </div>
  );
};