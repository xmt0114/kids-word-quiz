import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './Card';
import { Button } from './Button';
import { WordCollection } from '../types';
import { wordAPI } from '../utils/api';
import { useQuizSettings } from '../hooks/useLocalStorage';
import { BookOpen, ArrowLeft, Loader } from 'lucide-react';
import { cn } from '../lib/utils';

interface TextbookSelectionPageProps {
  onSelectTextbook?: (collectionId: string) => void;
  onBack?: () => void;
  currentCollectionId?: string;
}

const TextbookSelectionPage: React.FC<TextbookSelectionPageProps> = ({
  onSelectTextbook,
  onBack,
  currentCollectionId
}) => {
  const navigate = useNavigate();
  const { setSettings } = useQuizSettings(); // 获取setSettings函数
  const [collections, setCollections] = useState<WordCollection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(currentCollectionId || null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 处理返回
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  // 处理确认选择
  const handleConfirm = () => {
    if (selectedId) {
      // 保存选择的教材ID到 localStorage
      localStorage.setItem('last-selected-textbook', selectedId);

      // 同时更新 quiz-settings 中的 collectionId
      setSettings((prevSettings) => ({
        ...prevSettings,
        collectionId: selectedId
      }));

      // 延迟跳转，确保状态更新完成
      setTimeout(() => {
        if (onSelectTextbook) {
          onSelectTextbook(selectedId);
        } else {
          navigate(-1);
        }
      }, 500);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (wordAPI.getCollections) {
        const response = await wordAPI.getCollections();
        
        if (response.success && response.data) {
          setCollections(response.data);
        } else {
          setError(response.error || '获取教材列表失败');
        }
      }
    } catch (err) {
      setError('加载教材时出错');
      console.error('Load collections error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (collectionId: string) => {
    setSelectedId(collectionId);
  };

  // 获取年级显示文本
  const getGradeText = (gradeLevel: string | null) => {
    if (!gradeLevel) return '';
    return `${gradeLevel}年级`;
  };

  // 获取教材类型显示文本
  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      'textbook': 'bg-blue-500',
      'custom': 'bg-purple-500',
      'system': 'bg-green-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 p-sm md:p-lg">
      {/* 顶部导航 */}
      <div className="max-w-6xl mx-auto mb-lg">
        <Button
          variant="secondary"
          onClick={handleBack}
          className="flex items-center gap-sm"
        >
          <ArrowLeft size={20} />
          返回主页
        </Button>
      </div>

      {/* 标题区域 */}
      <div className="text-center mb-xl">
        <h1 className="text-hero font-bold text-text-primary mb-md animate-slide-in-right">
          选择教材
        </h1>
        <p className="text-h2 text-text-secondary font-semibold">
          选择你想要学习的教材
        </p>
      </div>

      {/* 教材列表 */}
      <div className="max-w-6xl mx-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-3xl">
            <Loader size={48} className="text-primary-500 animate-spin mb-md" />
            <p className="text-h3 text-text-secondary">加载教材中...</p>
          </div>
        ) : error ? (
          <div className="text-center py-3xl">
            <p className="text-h3 text-error mb-lg">{error}</p>
            <Button onClick={loadCollections}>重试</Button>
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-3xl">
            <BookOpen size={64} className="text-text-secondary mx-auto mb-md opacity-50" />
            <p className="text-h3 text-text-secondary">暂无可用教材</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg mb-xl">
              {collections.map((collection) => {
                const isSelected = selectedId === collection.id;
                
                return (
                  <Card
                    key={collection.id}
                    className={cn(
                      'cursor-pointer transition-all duration-normal border-4',
                      isSelected 
                        ? 'border-primary-500 bg-primary-50 scale-105 shadow-lg' 
                        : 'border-gray-200 hover:border-primary-300 hover:scale-102'
                    )}
                    onClick={() => handleSelect(collection.id)}
                  >
                    <div className="space-y-md">
                      {/* 教材图标和标题 */}
                      <div className="flex items-start gap-md">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                            <BookOpen size={32} className="text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-h3 font-bold text-text-primary mb-xs truncate">
                            {collection.name}
                          </h3>
                          {collection.description && (
                            <p className="text-body text-text-secondary line-clamp-2">
                              {collection.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* 教材信息 */}
                      <div className="flex flex-wrap gap-sm">
                        {/* 分类标签 */}
                        <span className={cn(
                          'px-sm py-xs rounded-full text-white text-sm font-semibold',
                          getCategoryBadgeColor(collection.category)
                        )}>
                          {collection.textbook_type || '自定义教材'}
                        </span>
                        
                        {/* 年级标签 */}
                        {collection.grade_level && (
                          <span className="px-sm py-xs rounded-full bg-gray-200 text-text-primary text-sm font-semibold">
                            {getGradeText(collection.grade_level)}
                          </span>
                        )}
                      </div>

                      {/* 词汇数量 */}
                      <div className="pt-md border-t border-gray-200">
                        <p className="text-body text-text-secondary">
                          词汇数量：
                          <span className="font-bold text-primary-500 ml-xs">
                            {collection.word_count}
                          </span>
                          {' '}个
                        </p>
                      </div>

                      {/* 选中指示 */}
                      {isSelected && (
                        <div className="flex items-center justify-center pt-md">
                          <div className="bg-primary-500 text-white px-md py-sm rounded-full text-sm font-bold">
                            已选择
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* 确认按钮 */}
            <div className="text-center">
              <Button
                size="large"
                onClick={handleConfirm}
                disabled={!selectedId}
                className="animate-bounce-in"
              >
                {selectedId ? '保存选择' : '请选择教材'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export { TextbookSelectionPage };
