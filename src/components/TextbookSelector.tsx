import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, BookOpen, Loader } from 'lucide-react';
import { cn } from '../lib/utils';
import { WordCollection } from '../types';
import { wordAPI } from '../utils/api';

export interface TextbookSelectorProps {
  currentTextbook: string;
  currentTextbookName?: string; // 从首页数据中传入的教材名称
  gameId: string;
  onSelect: (collectionId: string) => void;
  className?: string;
}

const TextbookSelector: React.FC<TextbookSelectorProps> = ({
  currentTextbook,
  currentTextbookName,
  gameId,
  onSelect,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availableTextbooks, setAvailableTextbooks] = useState<WordCollection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // 检查点击是否在按钮内
      if (buttonRef.current && buttonRef.current.contains(target)) {
        return;
      }
      
      // 检查点击是否在下拉菜单内（由于使用Portal，需要通过class或其他方式识别）
      const dropdownElement = document.querySelector('[data-textbook-dropdown="true"]');
      if (dropdownElement && dropdownElement.contains(target)) {
        return;
      }
      
      // 如果点击在外部，关闭菜单
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 加载教材列表
  const loadTextbooks = async () => {
    if (availableTextbooks.length > 0) return; // 已加载过，不重复加载

    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await wordAPI.getCollections?.(gameId);
      if (response?.success && response.data) {
        setAvailableTextbooks(response.data);
      } else {
        setLoadError(response?.error || '加载教材失败');
      }
    } catch (error) {
      console.error('加载教材列表失败:', error);
      setLoadError('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理点击教材名称
  const handleToggle = async () => {
    if (!isOpen) {
      await loadTextbooks();
      // 计算下拉菜单位置
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: Math.max(rect.width, 192) // 最小宽度192px
        });
      }
    }
    setIsOpen(!isOpen);
  };

  // 处理选择教材
  const handleSelect = (collectionId: string) => {
    console.log('TextbookSelector: 选择教材', collectionId);
    onSelect(collectionId);
    setIsOpen(false);
  };

  // 获取当前教材名称
  const getCurrentTextbookName = () => {
    // 优先使用从首页数据传入的教材名称
    if (currentTextbookName) {
      return currentTextbookName;
    }
    
    // 如果没有传入名称，尝试从已加载的教材列表中查找
    if (availableTextbooks.length > 0) {
      const current = availableTextbooks.find(t => t.id === currentTextbook);
      return current?.name || currentTextbook;
    }
    
    // 最后兜底显示ID
    return currentTextbook;
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* 教材名称按钮 */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="flex items-center gap-xs text-body text-text-secondary hover:text-primary-500 transition-colors duration-200 group"
        style={{ fontFamily: 'Noto Sans SC, Fredoka, sans-serif' }}
      >
        <BookOpen size={16} className="text-primary-400 group-hover:text-primary-500 transition-colors" />
        <span className="truncate max-w-32 font-medium text-shadow-sm bg-gradient-to-r from-gray-700 to-gray-600 bg-clip-text text-transparent">
          {getCurrentTextbookName()}
        </span>
        <ChevronDown 
          size={14} 
          className={cn(
            "text-gray-400 group-hover:text-primary-500 transition-all duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {/* 下拉菜单 - 使用Portal渲染到body */}
      {isOpen && createPortal(
        <div 
          data-textbook-dropdown="true"
          className="fixed z-[9999] bg-white rounded-lg shadow-xl border-2 border-primary-200 overflow-hidden animate-in slide-in-from-top-2 duration-200"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
          }}
        >
          {isLoading ? (
            <div className="p-md flex items-center justify-center gap-sm text-text-secondary">
              <Loader size={16} className="animate-spin" />
              <span className="text-small">加载中...</span>
            </div>
          ) : loadError ? (
            <div className="p-md text-center">
              <div className="text-small text-red-500 mb-sm">{loadError}</div>
              <button
                onClick={() => {
                  setAvailableTextbooks([]);
                  loadTextbooks();
                }}
                className="text-xs text-primary-500 hover:text-primary-600 transition-colors"
              >
                重试
              </button>
            </div>
          ) : availableTextbooks.length > 0 ? (
            <div className="max-h-64 overflow-y-auto">
              {availableTextbooks.map((textbook) => (
                <button
                  key={textbook.id}
                  onClick={() => handleSelect(textbook.id)}
                  className={cn(
                    "w-full px-md py-sm text-left hover:bg-primary-50 transition-colors duration-150 flex items-center gap-sm",
                    textbook.id === currentTextbook && "bg-primary-100 text-primary-700"
                  )}
                  style={{ fontFamily: 'Noto Sans SC, Fredoka, sans-serif' }}
                >
                  <BookOpen size={14} className="text-primary-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-small font-medium truncate">
                      {textbook.name}
                    </div>
                    {textbook.grade_level && (
                      <div className="text-xs text-text-tertiary">
                        {textbook.grade_level}年级
                      </div>
                    )}
                  </div>
                  {textbook.word_count > 0 && (
                    <div className="text-xs text-text-tertiary bg-gray-100 px-xs py-0.5 rounded">
                      {textbook.word_count}词
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-md text-center text-text-tertiary text-small">
              暂无可用教材
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export { TextbookSelector };