import React from 'react';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../lib/utils';

interface WordData {
  id: number;
  word: string;
  definition: string;
  audioText: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: string[];
  answer: string;
  hint: string;
  word_order?: number;
  created_at?: string;
}

interface BatchSaveManagerProps {
  pendingChanges: Map<number, Partial<WordData>>;
  onSave: () => Promise<void>;
  onClear: () => void;
  isSaving?: boolean;
  lastSaveError?: string;
  className?: string;
}

export const BatchSaveManager: React.FC<BatchSaveManagerProps> = ({
  pendingChanges,
  onSave,
  onClear,
  isSaving = false,
  lastSaveError,
  className
}) => {
  const changeCount = pendingChanges.size;
  const hasChanges = changeCount > 0;

  const handleSave = async () => {
    try {
      await onSave();
    } catch (error) {
      console.error('批量保存失败:', error);
    }
  };

  if (!hasChanges && !isSaving) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* 状态指示 */}
      <div className="flex items-center gap-2">
        {isSaving ? (
          <>
            <Loader2 size={16} className="animate-spin text-blue-600" />
            <span className="text-sm text-blue-600 font-medium">
              正在保存修改...
            </span>
          </>
        ) : hasChanges ? (
          <>
            <AlertCircle size={16} className="text-orange-600" />
            <span className="text-sm text-orange-600 font-medium">
              有 {changeCount} 个未保存的修改
            </span>
          </>
        ) : null}
      </div>

      {/* 操作按钮 */}
      {hasChanges && (
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={onClear}
            disabled={isSaving}
            className="px-3 py-1 text-sm"
          >
            放弃修改
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-1 text-sm"
            title={lastSaveError ? `上次保存失败：${lastSaveError}` : undefined}
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {isSaving ? '保存中...' : lastSaveError ? '重试保存' : '保存修改'}
          </Button>
        </div>
      )}
    </div>
  );
};