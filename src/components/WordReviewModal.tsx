import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Button } from './Button';
import { WordEditor } from './WordEditor';
import { WordNavigator } from './WordNavigator';
import { BatchSaveManager } from './BatchSaveManager';
import { wordAPI } from '../utils/api';
import { toast } from 'sonner';

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

interface WordReviewModalProps {
  isOpen: boolean;
  collectionId: string;
  onClose: () => void;
  onDataChange?: () => void;
}

export const WordReviewModal: React.FC<WordReviewModalProps> = ({
  isOpen,
  collectionId,
  onClose,
  onDataChange
}) => {
  const [words, setWords] = useState<WordData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Map<number, Partial<WordData>>>(new Map());
  const [errors, setErrors] = useState<Partial<Record<keyof WordData, string>>>({});
  const [showNavigationConfirm, setShowNavigationConfirm] = useState<{
    show: boolean;
    direction: 'previous' | 'next';
    action?: 'step' | 'jump-first' | 'jump-last';
  }>({ show: false, direction: 'previous' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveError, setLastSaveError] = useState<string>('');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // 加载单词数据
  const loadWords = async () => {
    if (!collectionId) return;
    
    setIsLoading(true);
    try {
      const response = await wordAPI.getWords({
        collectionId,
        limit: 1000, // 加载所有单词用于审阅
        sortBy: 'word_order',
        sortOrder: 'asc'
      });
      
      if (response.success && response.data) {
        setWords(response.data);
        setCurrentIndex(0);
      } else {
        toast.error(response.error || '加载单词失败');
      }
    } catch (error) {
      toast.error('加载单词失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 当弹框打开时加载数据
  useEffect(() => {
    if (isOpen && collectionId) {
      loadWords();
    }
  }, [isOpen, collectionId]);

  // 当前单词（合并待保存的修改）
  const currentWord = words[currentIndex];
  const currentWordWithChanges = currentWord ? {
    ...currentWord,
    ...(pendingChanges.get(currentWord.id) || {})
  } : null;

  // 字段修改处理
  const handleFieldChange = (field: keyof WordData, value: any) => {
    if (!currentWord) return;

    // 验证输入
    const newErrors = { ...errors };
    delete newErrors[field];

    if (field === 'word_order' && value !== null && value !== undefined) {
      if (isNaN(Number(value)) || Number(value) < 0) {
        newErrors[field] = '序号必须是非负数字';
        setErrors(newErrors);
        return;
      }
    }

    if (field === 'word' && !value?.trim()) {
      newErrors[field] = '单词不能为空';
      setErrors(newErrors);
      return;
    }

    if (field === 'definition' && !value?.trim()) {
      newErrors[field] = '定义不能为空';
      setErrors(newErrors);
      return;
    }

    setErrors(newErrors);

    // 更新待保存的修改
    const newPendingChanges = new Map(pendingChanges);
    const currentChanges = newPendingChanges.get(currentWord.id) || {};
    
    if (value === currentWord[field]) {
      // 如果值恢复到原始值，移除这个字段的修改
      delete currentChanges[field];
      if (Object.keys(currentChanges).length === 0) {
        newPendingChanges.delete(currentWord.id);
      } else {
        newPendingChanges.set(currentWord.id, currentChanges);
      }
    } else {
      // 添加或更新修改
      newPendingChanges.set(currentWord.id, {
        ...currentChanges,
        [field]: value
      });
    }

    setPendingChanges(newPendingChanges);
  };

  // 检查当前单词是否有未保存的修改
  const hasUnsavedChanges = currentWord ? pendingChanges.has(currentWord.id) : false;

  // 确认导航处理
  const handleConfirmNavigation = (direction: 'previous' | 'next', action?: 'step' | 'jump-first' | 'jump-last') => {
    setShowNavigationConfirm({ show: true, direction, action });
  };

  const confirmNavigation = () => {
    // 清除当前单词的未保存修改
    if (currentWord) {
      const newPendingChanges = new Map(pendingChanges);
      newPendingChanges.delete(currentWord.id);
      setPendingChanges(newPendingChanges);
    }

    const { direction, action } = showNavigationConfirm;
    setShowNavigationConfirm({ show: false, direction: 'previous' });
    
    if (action === 'jump-first') {
      goToFirst();
    } else if (action === 'jump-last') {
      goToLast();
    } else if (direction === 'previous') {
      goToPrevious();
    } else {
      goToNext();
    }
  };

  const cancelNavigation = () => {
    setShowNavigationConfirm({ show: false, direction: 'previous' });
  };

  // 导航函数
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetEditingState();
    }
  };

  const goToNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetEditingState();
    }
  };

  const goToFirst = () => {
    setCurrentIndex(0);
    resetEditingState();
  };

  const goToLast = () => {
    setCurrentIndex(words.length - 1);
    resetEditingState();
  };

  // 重置编辑状态
  const resetEditingState = () => {
    setErrors({}); // 清除错误状态
    // 注意：不清除pendingChanges，因为用户可能想要保留其他单词的修改
  };

  // 删除处理
  const handleDeleteWord = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!currentWord) return;

    setIsDeleting(true);
    try {
      const response = await wordAPI.deleteWord(currentWord.id);
      if (response.success) {
        toast.success('删除单词成功');
        
        // 从本地状态中移除单词
        const newWords = words.filter(w => w.id !== currentWord.id);
        setWords(newWords);
        
        // 清除该单词的待保存修改
        const newPendingChanges = new Map(pendingChanges);
        newPendingChanges.delete(currentWord.id);
        setPendingChanges(newPendingChanges);
        
        // 调整当前索引
        if (newWords.length === 0) {
          // 没有单词了，关闭弹框
          handleClose();
          return;
        } else if (currentIndex >= newWords.length) {
          // 当前索引超出范围，跳转到最后一个
          setCurrentIndex(newWords.length - 1);
        }
        // 如果当前索引仍然有效，保持不变（显示下一个单词）
        
        resetEditingState();
        
        // 通知父组件数据已更改（这将触发教材计数的更新）
        if (onDataChange) {
          onDataChange();
        }
      } else {
        toast.error(response.error || '删除单词失败');
      }
    } catch (error) {
      console.error('删除单词失败:', error);
      toast.error('删除单词失败');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // 批量保存处理
  const handleBatchSave = async () => {
    if (pendingChanges.size === 0) return;

    setIsSaving(true);
    const updates = Array.from(pendingChanges.entries()).map(([id, changes]) => ({
      id,
      data: changes
    }));

    let successCount = 0;
    let failedCount = 0;
    const failedUpdates: Array<{ id: number; error: string }> = [];
    const successfulIds: number[] = [];

    try {
      // 逐个更新单词
      for (const update of updates) {
        try {
          const response = await wordAPI.updateWord(update.id, update.data);
          if (response.success) {
            successCount++;
            successfulIds.push(update.id);
            // 更新本地words数组
            setWords(prevWords => 
              prevWords.map(word => 
                word.id === update.id ? { ...word, ...update.data } : word
              )
            );
          } else {
            failedCount++;
            failedUpdates.push({
              id: update.id,
              error: response.error || '未知错误'
            });
          }
        } catch (error) {
          failedCount++;
          const errorMessage = error instanceof Error ? error.message : '网络错误';
          failedUpdates.push({
            id: update.id,
            error: errorMessage
          });
        }
      }

      // 清除成功保存的修改
      const newPendingChanges = new Map(pendingChanges);
      successfulIds.forEach(id => {
        newPendingChanges.delete(id);
      });
      setPendingChanges(newPendingChanges);

      // 显示结果
      if (failedCount === 0) {
        toast.success(`成功保存 ${successCount} 个修改`);
        setLastSaveError(''); // 清除错误状态
      } else if (successCount > 0) {
        toast.warning(`保存完成：成功 ${successCount} 个，失败 ${failedCount} 个`);
        
        // 显示失败的详细信息
        if (failedUpdates.length > 0) {
          console.error('保存失败的单词:', failedUpdates);
          const firstError = failedUpdates[0];
          setLastSaveError(firstError.error);
          toast.error(`部分保存失败：${firstError.error}`, {
            description: failedUpdates.length > 1 ? `还有 ${failedUpdates.length - 1} 个其他错误` : undefined
          });
        }
      } else {
        toast.error('所有修改保存失败');
        
        // 显示第一个错误的详细信息
        if (failedUpdates.length > 0) {
          const firstError = failedUpdates[0];
          setLastSaveError(firstError.error);
          toast.error(`保存失败：${firstError.error}`, {
            description: '请检查网络连接或稍后重试'
          });
        }
      }

      // 通知父组件数据已更改（即使部分失败也要通知，因为可能有成功的修改）
      if (successCount > 0 && onDataChange) {
        onDataChange();
      }
    } catch (error) {
      console.error('批量保存过程中发生意外错误:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setLastSaveError(errorMessage);
      toast.error('保存过程中发生意外错误，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 清除所有修改
  const handleClearChanges = () => {
    setPendingChanges(new Map());
    setErrors({});
    toast.info('已放弃所有未保存的修改');
  };

  // 关闭确认处理
  const confirmClose = () => {
    setShowCloseConfirm(false);
    onClose();
    if (onDataChange) {
      onDataChange();
    }
  };

  const cancelClose = () => {
    setShowCloseConfirm(false);
  };

  // 关闭弹框
  const handleClose = () => {
    if (pendingChanges.size > 0) {
      // 有未保存的修改，显示确认对话框
      setShowCloseConfirm(true);
    } else {
      // 没有未保存的修改，直接关闭
      onClose();
      if (onDataChange) {
        onDataChange();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800">审阅教材</h2>
          </div>
          <div className="flex items-center gap-4">
            <WordNavigator
              currentIndex={currentIndex}
              totalCount={words.length}
              onPrevious={goToPrevious}
              onNext={goToNext}
              hasUnsavedChanges={hasUnsavedChanges}
              onConfirmNavigation={handleConfirmNavigation}
              onJumpToFirst={goToFirst}
              onJumpToLast={goToLast}
            />
            <div className="w-px h-6 bg-gray-300" />
            <Button
              variant="secondary"
              onClick={handleClose}
              className="p-2"
            >
              <X size={20} />
            </Button>
          </div>
        </div>

        {/* 内容区域 - 固定高度避免编辑时变化 */}
        <div className="p-6 overflow-y-auto h-[calc(90vh-200px)]">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-200 border-t-primary-500"></div>
            </div>
          ) : !currentWordWithChanges ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p>没有找到单词数据</p>
            </div>
          ) : (
            <WordEditor
              word={currentWordWithChanges}
              onChange={handleFieldChange}
              errors={errors}
            />
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <BatchSaveManager
            pendingChanges={pendingChanges}
            onSave={handleBatchSave}
            onClear={handleClearChanges}
            isSaving={isSaving}
            lastSaveError={lastSaveError}
          />
          <div className="flex items-center gap-2">
            <Button
              variant="error"
              onClick={handleDeleteWord}
              disabled={!currentWord || isDeleting || isSaving}
              className="flex items-center gap-2"
            >
              <Trash2 size={16} />
              {isDeleting ? '删除中...' : '删除'}
            </Button>
          </div>
        </div>
      </div>

      {/* 导航确认对话框 */}
      {showNavigationConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">确认导航</h3>
            <p className="text-gray-600 mb-6">
              当前单词有未保存的修改，确定要离开吗？未保存的修改将会丢失。
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={cancelNavigation}
              >
                取消
              </Button>
              <Button
                variant="error"
                onClick={confirmNavigation}
              >
                确定离开
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">确认删除</h3>
            <p className="text-gray-600 mb-6">
              确定要删除单词 "<span className="font-bold">{currentWord?.word}</span>" 吗？此操作无法撤销。
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={cancelDelete}
                disabled={isDeleting}
              >
                取消
              </Button>
              <Button
                variant="error"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? '删除中...' : '确定删除'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 关闭确认对话框 */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">确认关闭</h3>
            <p className="text-gray-600 mb-6">
              您有 {pendingChanges.size} 个未保存的修改，确定要关闭吗？未保存的修改将会丢失。
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={cancelClose}
              >
                取消
              </Button>
              <Button
                variant="error"
                onClick={confirmClose}
              >
                确定关闭
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};