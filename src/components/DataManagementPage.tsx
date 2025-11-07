import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './Card';
import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';
import { WordFormModal } from './WordFormModal';
import { CollectionFormModal } from './CollectionFormModal';
import { BatchAddWordsModal } from './BatchAddWordsModal';
import { ArrowLeft, Database, BookOpen, BookMarked, Plus, Edit, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { wordAPI } from '../utils/api';
import { WordCollection } from '../types';
import { toast, Toaster } from 'sonner';
import { SupabaseWordAPI } from '../utils/supabaseApi';

interface DataManagementPageProps {
  onBack?: () => void;
}

interface WordData {
  id: number;
  word: string;
  definition: string;
  audioText: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: string[];
  answer: string;
  hint: string;
}

const DataManagementPage: React.FC<DataManagementPageProps> = ({ onBack }) => {
  const navigate = useNavigate();

  // 如果提供了onBack回调则使用，否则使用路由导航
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/');
    }
  };
  const [activeTab, setActiveTab] = useState<'collections' | 'words'>('collections');
  const [collections, setCollections] = useState<WordCollection[]>([]);
  const [words, setWords] = useState<WordData[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<WordCollection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWordIds, setSelectedWordIds] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<'word' | 'created_at'>('word');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 模态框状态
  const [isWordModalOpen, setIsWordModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isBatchAddModalOpen, setIsBatchAddModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<WordData | null>(null);
  const [editingCollection, setEditingCollection] = useState<WordCollection | null>(null);

  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const supabaseAPI = wordAPI as SupabaseWordAPI;

  // 加载教材列表
  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await wordAPI.getCollections?.();
      if (response?.success && response.data) {
        setCollections(response.data);
        // 默认选择第一个教材
        if (response.data.length > 0 && !selectedCollectionId) {
          setSelectedCollectionId(response.data[0].id);
          setSelectedCollection(response.data[0]);
        }
      } else {
        setError(response?.error || '加载教材失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const loadWords = async (collectionId: string, page: number = 1, limit: number = 20) => {
    setIsLoading(true);
    setError(null);
    try {
      const offset = (page - 1) * limit;
      console.log('[DataManagement] loadWords:', { collectionId, page, limit, offset, sortBy, sortOrder });
      const response = await wordAPI.getWords({
        collectionId,
        limit,
        offset,
        sortBy,
        sortOrder,
      });
      if (response.success && response.data) {
        setWords(response.data);
      } else {
        setError(response.error || '加载词汇失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const WORDS_PER_PAGE = 20;

  // 计算总页数（使用word_count字段）
  const calculateTotalPages = () => {
    if (!selectedCollection) return 1;
    const wordCount = selectedCollection.word_count;
    const pages = Math.ceil(wordCount / WORDS_PER_PAGE);
    const newTotalPages = Math.max(pages, 1); // 至少1页
    setTotalPages(newTotalPages);

    // 如果当前页超出范围，调整到最后一页
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages);
      console.log('[DataManagement] 调整当前页:', { oldPage: currentPage, newPage: newTotalPages });
    }

    console.log('[DataManagement] 估算分页:', { wordCount, pages, currentPage, newTotalPages });
  };

  // 当教材变化时，更新总页数
  useEffect(() => {
    calculateTotalPages();
  }, [selectedCollectionId, selectedCollection?.word_count]);

  // 当选择教材或排序变化时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCollectionId, sortBy, sortOrder]);

  // 加载词汇（带分页）
  useEffect(() => {
    if (selectedCollectionId && activeTab === 'words') {
      loadWords(selectedCollectionId, currentPage, WORDS_PER_PAGE);
    }
  }, [selectedCollectionId, activeTab, currentPage, sortBy, sortOrder]);

  const handleCollectionSelect = async (collection: WordCollection) => {
    setSelectedCollectionId(collection.id);
    setSelectedCollection(collection);
    setActiveTab('words');
  };

  // 教材CRUD操作
  const handleAddCollection = () => {
    setEditingCollection(null);
    setIsCollectionModalOpen(true);
  };

  const handleEditCollection = (e: React.MouseEvent, collection: WordCollection) => {
    e.stopPropagation();
    setEditingCollection(collection);
    setIsCollectionModalOpen(true);
  };

  const handleDeleteCollection = (e: React.MouseEvent, collection: WordCollection) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: '确认删除教材',
      message: `确定要删除教材"${collection.name}"吗？如果教材下有词汇，将无法删除。`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          const response = await supabaseAPI.deleteCollection(collection.id);
          if (response.success) {
            toast.success('删除教材成功');
            loadCollections();
            if (selectedCollectionId === collection.id) {
              setSelectedCollectionId(null);
              setSelectedCollection(null);
            }
          } else {
            toast.error(response.error || '删除教材失败');
          }
        } catch (err) {
          toast.error('删除教材失败');
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const handleSubmitCollection = async (data: any) => {
    try {
      if (editingCollection) {
        const response = await supabaseAPI.updateCollection(editingCollection.id, data);
        if (response.success) {
          toast.success('更新教材成功');
          loadCollections();
        } else {
          toast.error(response.error || '更新教材失败');
          throw new Error(response.error);
        }
      } else {
        const response = await supabaseAPI.createCollection(data);
        if (response.success) {
          toast.success('添加教材成功');
          loadCollections();
        } else {
          toast.error(response.error || '添加教材失败');
          throw new Error(response.error);
        }
      }
    } catch (err) {
      console.error('提交教材失败:', err);
      throw err;
    }
  };

  // 词汇CRUD操作
  const handleAddWord = () => {
    if (!selectedCollectionId) {
      toast.error('请先选择教材');
      return;
    }
    setEditingWord(null);
    setIsWordModalOpen(true);
  };

  const handleBatchAddWords = () => {
    if (!selectedCollectionId) {
      toast.error('请先选择教材');
      return;
    }
    setIsBatchAddModalOpen(true);
  };

  const handleBatchSubmitWords = async (batchWords: any[]) => {
    if (!selectedCollectionId) {
      toast.error('请先选择教材');
      throw new Error('未选择教材');
    }

    try {
      // 准备数据
      const preparedData = batchWords.map(wordData => ({
        ...wordData,
        collectionId: selectedCollectionId,
        audioText: wordData.audioText || wordData.definition, // 默认使用定义作为音频文本
      }));

      // 分批处理（Supabase 建议每批不超过 100 个单词）
      const BATCH_SIZE = 100;
      let totalSuccess = 0;
      let totalErrors: string[] = [];

      for (let i = 0; i < preparedData.length; i += BATCH_SIZE) {
        const batch = preparedData.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(preparedData.length / BATCH_SIZE);

        // 显示进度
        toast.loading(`正在插入第 ${batchNum}/${totalBatches} 批 (${batch.length} 个单词)...`, { id: 'batch-add' });

        const response = await supabaseAPI.batchAddWords(batch);

        if (response.success) {
          totalSuccess += response.data?.count || 0;
          // 记录部分失败的单词
          if (response.data?.errors && response.data.errors.length > 0) {
            totalErrors.push(`第${batchNum}批: ${response.data.errors.map(e => e.word).join(', ')}`);
          }
        } else {
          totalErrors.push(`第${batchNum}批完全失败: ${response.error}`);
        }
      }

      // 隐藏进度提示
      toast.dismiss('batch-add');

      // 显示结果
      if (totalSuccess > 0) {
        toast.success(`成功添加 ${totalSuccess} 个词汇`);
      }
      if (totalErrors.length > 0) {
        toast.error(`${totalErrors.length} 个批次有问题`, {
          duration: 5000, // 显示5秒
        });
        console.error('批量添加错误详情:', totalErrors);
      }

      // 重新加载词汇列表
      if (selectedCollectionId) {
        // 手动更新当前选中教材的 word_count
        if (selectedCollection && totalSuccess > 0) {
          const newWordCount = selectedCollection.word_count + totalSuccess;
          setSelectedCollection({
            ...selectedCollection,
            word_count: newWordCount
          });

          // 批量添加后，如果当前是最后一页或增加了新页，刷新数据
          const newTotalPages = Math.ceil(newWordCount / WORDS_PER_PAGE);
          if (currentPage === newTotalPages || newTotalPages > totalPages) {
            loadWords(selectedCollectionId, currentPage, WORDS_PER_PAGE);
          }
        } else {
          loadWords(selectedCollectionId);
        }

        // 重新加载教材列表（数据库触发器会自动更新 word_count）
        loadCollections();
      }
    } catch (err) {
      console.error('批量添加失败:', err);
      toast.error('批量添加失败，请重试');
      throw err;
    }
  };

  const handleEditWord = (word: WordData) => {
    setEditingWord(word);
    setIsWordModalOpen(true);
  };

  const handleDeleteWord = (word: WordData) => {
    setConfirmDialog({
      isOpen: true,
      title: '确认删除词汇',
      message: `确定要删除词汇"${word.word}"吗？此操作不可恢复。`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          const response = await wordAPI.deleteWord(word.id);
          if (response.success) {
            toast.success('删除词汇成功');
            if (selectedCollectionId) {
              // 手动更新当前选中教材的 word_count
              if (selectedCollection) {
                const newWordCount = Math.max(selectedCollection.word_count - 1, 0);
                setSelectedCollection({
                  ...selectedCollection,
                  word_count: newWordCount
                });

                // 更新总页数
                const newTotalPages = Math.ceil(newWordCount / WORDS_PER_PAGE);
                setTotalPages(newTotalPages);

                // 检查当前页是否需要调整
                if (currentPage > newTotalPages) {
                  setCurrentPage(newTotalPages);
                  console.log('[DataManagement] 删除后调整页码:', { oldPage: currentPage, newPage: newTotalPages });
                }
              }

              // 重新加载词汇列表
              loadWords(selectedCollectionId, currentPage, WORDS_PER_PAGE);
              // 重新加载教材列表（数据库触发器会自动更新 word_count）
              loadCollections();
            }
          } else {
            toast.error(response.error || '删除词汇失败');
          }
        } catch (err) {
          toast.error('删除词汇失败');
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  // 批量删除词汇
  const handleBatchDelete = () => {
    if (selectedWordIds.length === 0) {
      toast.error('请先选择要删除的词汇');
      return;
    }

    const selectedWords = words.filter(w => selectedWordIds.includes(w.id));
    const wordNames = selectedWords.slice(0, 3).map(w => w.word).join('、');
    const displayNames = selectedWords.length > 3 ? `${wordNames}等` : wordNames;

    setConfirmDialog({
      isOpen: true,
      title: '确认批量删除',
      message: `确定要删除选中的 ${selectedWordIds.length} 个词汇（${displayNames}）吗？此操作不可恢复。`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          const response = await supabaseAPI.batchDeleteWords(selectedWordIds);
          if (response.success) {
            toast.success(`成功删除 ${selectedWordIds.length} 个词汇`);
            setSelectedWordIds([]);
            if (selectedCollectionId) {
              // 手动更新当前选中教材的 word_count
              if (selectedCollection) {
                const newWordCount = Math.max(selectedCollection.word_count - selectedWordIds.length, 0);
                setSelectedCollection({
                  ...selectedCollection,
                  word_count: newWordCount
                });

                // 更新总页数并同步到状态
                const newTotalPages = Math.ceil(newWordCount / WORDS_PER_PAGE);
                setTotalPages(newTotalPages);

                // 检查当前页是否需要调整
                if (currentPage > newTotalPages) {
                  setCurrentPage(newTotalPages);
                  console.log('[DataManagement] 批量删除后调整页码:', { oldPage: currentPage, newPage: newTotalPages });
                }
              }

              // 重新加载词汇列表
              loadWords(selectedCollectionId, currentPage, WORDS_PER_PAGE);
              // 重新加载教材列表（数据库触发器会自动更新 word_count）
              loadCollections();
            }
          } else {
            toast.error(response.error || '批量删除失败');
          }
        } catch (err) {
          toast.error('批量删除失败');
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  // 切换单个词汇选中状态
  const toggleWordSelection = (wordId: number) => {
    setSelectedWordIds(prev => 
      prev.includes(wordId)
        ? prev.filter(id => id !== wordId)
        : [...prev, wordId]
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedWordIds.length === words.length) {
      setSelectedWordIds([]);
    } else {
      setSelectedWordIds(words.map(w => w.id));
    }
  };

  const handleSubmitWord = async (data: any) => {
    if (!selectedCollectionId) {
      toast.error('请先选择教材');
      throw new Error('未选择教材');
    }

    try {
      const wordData = {
        ...data,
        collectionId: selectedCollectionId,
      };

      if (editingWord) {
        const response = await wordAPI.updateWord(editingWord.id, wordData);
        if (response.success) {
          toast.success('更新词汇成功');
          loadWords(selectedCollectionId);
        } else {
          toast.error(response.error || '更新词汇失败');
          throw new Error(response.error);
        }
      } else {
        const response = await wordAPI.addWord(wordData);
        if (response.success) {
          toast.success('添加词汇成功');

          // 手动更新当前选中教材的 word_count
          if (selectedCollection) {
            const newWordCount = selectedCollection.word_count + 1;
            setSelectedCollection({
              ...selectedCollection,
              word_count: newWordCount
            });

            // 添加后，如果当前页数据量不足，补充数据
            // 新添加的单词会出现在最后一页，如果当前是最后一页，需要刷新
            const newTotalPages = Math.ceil(newWordCount / WORDS_PER_PAGE);
            if (currentPage === newTotalPages || newTotalPages > totalPages) {
              // 重新加载当前页（可能显示新数据）
              loadWords(selectedCollectionId, currentPage, WORDS_PER_PAGE);
            }
          } else {
            loadWords(selectedCollectionId);
          }

          // 重新加载教材列表（数据库触发器会自动更新 word_count）
          loadCollections();
        } else {
          toast.error(response.error || '添加词汇失败');
          throw new Error(response.error);
        }
      }
    } catch (err) {
      console.error('提交词汇失败:', err);
      throw err;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  // 生成页码数组（最多显示5页，其余用...表示）
  const getPageNumbers = (current: number, total: number) => {
    const delta = 2; // 当前页前后显示的页数
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i);
    }

    if (current - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (current + delta < total - 1) {
      rangeWithDots.push('...', total);
    } else if (total > 1) {
      rangeWithDots.push(total);
    }

    return rangeWithDots;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 p-sm md:p-lg">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-md mb-lg">
          <Button
            variant="secondary"
            onClick={handleBack}
            className="flex items-center gap-sm"
          >
            <ArrowLeft size={20} />
            返回首页
          </Button>
          <div className="flex items-center gap-sm">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <Database size={24} className="text-white" />
            </div>
            <h1 className="text-h1 font-bold text-text-primary">数据管理</h1>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-card p-sm mb-lg">
          <div className="flex gap-md">
            <button
              className={cn(
                'flex items-center gap-sm px-lg py-md rounded-lg font-bold transition-all duration-normal',
                activeTab === 'collections'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md'
                  : 'text-text-secondary hover:bg-gray-100'
              )}
              onClick={() => setActiveTab('collections')}
            >
              <BookOpen size={20} />
              教材管理
            </button>
            <button
              className={cn(
                'flex items-center gap-sm px-lg py-md rounded-lg font-bold transition-all duration-normal',
                activeTab === 'words'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md'
                  : 'text-text-secondary hover:bg-gray-100'
              )}
              onClick={() => setActiveTab('words')}
            >
              <BookMarked size={20} />
              词汇管理
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-md mb-lg text-center">
            <p className="text-body text-red-600">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-2xl">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-md" />
            <p className="text-body text-text-secondary">加载中...</p>
          </div>
        )}

        {/* Collections Tab */}
        {activeTab === 'collections' && !isLoading && (
          <div>
            {/* Action Bar */}
            <div className="flex justify-between items-center mb-lg">
              <p className="text-body text-text-secondary">
                共 {collections.length} 个教材
              </p>
              <Button
                variant="primary"
                className="flex items-center gap-sm"
                onClick={handleAddCollection}
              >
                <Plus size={20} />
                添加教材
              </Button>
            </div>

            {/* Collections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
              {collections.map((collection) => (
                <Card
                  key={collection.id}
                  className="cursor-pointer border-2 border-gray-200 hover:border-purple-500"
                  onClick={() => handleCollectionSelect(collection)}
                >
                  <div className="flex items-start justify-between mb-md">
                    <div className="flex items-center gap-sm">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-blue-400 rounded-lg flex items-center justify-center">
                        <BookOpen size={20} className="text-white" />
                      </div>
                      <h3 className="text-h3 font-bold text-text-primary">
                        {collection.name}
                      </h3>
                    </div>
                  </div>
                  
                  <p className="text-body text-text-secondary mb-md line-clamp-2">
                    {collection.description || '暂无描述'}
                  </p>
                  
                  <div className="flex flex-wrap gap-sm mb-md">
                    {collection.grade_level && (
                      <span className="px-sm py-xs bg-blue-100 text-blue-600 text-small rounded-full">
                        {collection.grade_level}年级
                      </span>
                    )}
                    {collection.category && (
                      <span className="px-sm py-xs bg-purple-100 text-purple-600 text-small rounded-full">
                        {collection.category}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-small text-text-tertiary border-t border-gray-200 pt-md">
                    <span>词汇数量: {collection.word_count}</span>
                    <span>{formatDate(collection.created_at)}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-sm mt-md">
                    <button
                      className="flex-1 flex items-center justify-center gap-xs px-md py-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      onClick={(e) => handleEditCollection(e, collection)}
                    >
                      <Edit size={16} />
                      <span className="text-small">编辑</span>
                    </button>
                    <button
                      className="flex-1 flex items-center justify-center gap-xs px-md py-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      onClick={(e) => handleDeleteCollection(e, collection)}
                    >
                      <Trash2 size={16} />
                      <span className="text-small">删除</span>
                    </button>
                  </div>
                </Card>
              ))}
            </div>

            {collections.length === 0 && (
              <div className="text-center py-2xl">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-md">
                  <BookOpen size={48} className="text-gray-400" />
                </div>
                <p className="text-body text-text-secondary">暂无教材数据</p>
              </div>
            )}
          </div>
        )}

        {/* Words Tab */}
        {activeTab === 'words' && !isLoading && (
          <div>
            {/* Collection Info & Filters */}
            <Card className="mb-lg bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
                <div className="flex items-center gap-md">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <BookOpen size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-h3 font-bold text-text-primary">
                      {selectedCollection?.name || '请选择教材'}
                    </h3>
                    <p className="text-small text-text-secondary">
                      共 {selectedCollection?.word_count || 0} 个词汇
                    </p>
                  </div>
                </div>

                {/* Sort Options */}
                <div className="flex items-center gap-sm">
                  <span className="text-small font-bold text-text-secondary">排序:</span>
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [newSortBy, newSortOrder] = e.target.value.split('-') as ['word' | 'created_at', 'asc' | 'desc'];
                      setSortBy(newSortBy);
                      setSortOrder(newSortOrder);
                    }}
                    className="px-md py-sm bg-white border-2 border-gray-200 rounded-lg text-small font-bold text-text-primary focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="word-asc">单词 A-Z</option>
                    <option value="word-desc">单词 Z-A</option>
                    <option value="created_at-asc">添加时间 旧→新</option>
                    <option value="created_at-desc">添加时间 新→旧</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Action Bar */}
            <div className="flex justify-between items-center mb-lg">
              <div className="flex items-center gap-md">
                <p className="text-body text-text-secondary">
                  显示全部词汇
                </p>
                {selectedWordIds.length > 0 && (
                  <span className="px-md py-sm bg-blue-50 text-blue-600 rounded-full text-small font-bold">
                    已选中 {selectedWordIds.length} 个
                  </span>
                )}
              </div>
              <div className="flex gap-sm">
                {selectedWordIds.length > 0 && (
                  <Button
                    variant="secondary"
                    className="flex items-center gap-sm bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                    onClick={handleBatchDelete}
                  >
                    <Trash2 size={20} />
                    批量删除
                  </Button>
                )}
                <Button
                  variant="secondary"
                  className="flex items-center gap-sm bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
                  onClick={handleBatchAddWords}
                  disabled={!selectedCollectionId}
                >
                  <Plus size={20} />
                  批量添加
                </Button>
                <Button
                  variant="primary"
                  className="flex items-center gap-sm"
                  onClick={handleAddWord}
                  disabled={!selectedCollectionId}
                >
                  <Plus size={20} />
                  添加词汇
                </Button>
              </div>
            </div>

            {/* Words Table */}
            <Card className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="py-md px-md w-12">
                      <input
                        type="checkbox"
                        checked={words.length > 0 && selectedWordIds.length === words.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                      />
                    </th>
                    <th className="text-left py-md px-md text-body font-bold text-text-primary">单词</th>
                    <th className="text-left py-md px-md text-body font-bold text-text-primary">定义</th>
                    <th className="text-left py-md px-md text-body font-bold text-text-primary">选项数量</th>
                    <th className="text-center py-md px-md text-body font-bold text-text-primary">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {words.map((word) => (
                    <tr key={word.id} className={cn(
                      "border-b border-gray-100 hover:bg-gray-50 transition-colors",
                      selectedWordIds.includes(word.id) && "bg-blue-50"
                    )}>
                      <td className="py-md px-md">
                        <input
                          type="checkbox"
                          checked={selectedWordIds.includes(word.id)}
                          onChange={() => toggleWordSelection(word.id)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                        />
                      </td>
                      <td className="py-md px-md">
                        <span className="font-bold text-text-primary">{word.word}</span>
                      </td>
                      <td className="py-md px-md text-text-secondary">
                        <span className="line-clamp-2">{word.definition}</span>
                      </td>
                      <td className="py-md px-md text-text-secondary">
                        {word.options?.length || 0} 个选项
                      </td>
                      <td className="py-md px-md">
                        <div className="flex items-center justify-center gap-sm">
                          <button
                            className="p-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            onClick={() => handleEditWord(word)}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="p-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            onClick={() => handleDeleteWord(word)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 分页控件 */}
              {words.length > 0 && totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-md mt-lg border-t border-gray-200 pt-md">
                  <div className="text-small text-text-secondary">
                    第 {currentPage} 页，共 {totalPages} 页
                  </div>
                  <div className="flex items-center gap-xs flex-wrap justify-center">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-sm py-xs bg-white border-2 border-gray-200 rounded-lg text-small font-bold text-text-secondary hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      上一页
                    </button>

                    {/* 页码按钮 - 优化显示 */}
                    {getPageNumbers(currentPage, totalPages).map((page, index) => (
                      page === '...' ? (
                        <span key={`dots-${index}`} className="px-sm py-xs text-text-tertiary">...</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page as number)}
                          className={cn(
                            'w-8 h-8 rounded-lg text-small font-bold transition-colors',
                            currentPage === page
                              ? 'bg-blue-500 text-white'
                              : 'bg-white border-2 border-gray-200 text-text-secondary hover:border-blue-500'
                          )}
                        >
                          {page}
                        </button>
                      )
                    ))}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-sm py-xs bg-white border-2 border-gray-200 rounded-lg text-small font-bold text-text-secondary hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              )}

              {words.length === 0 && selectedCollectionId && (
                <div className="text-center py-2xl">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-md">
                    <BookMarked size={48} className="text-gray-400" />
                  </div>
                  <p className="text-body text-text-secondary">
                    该教材暂无词汇数据
                  </p>
                </div>
              )}

              {!selectedCollectionId && (
                <div className="text-center py-2xl">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-md">
                    <BookOpen size={48} className="text-gray-400" />
                  </div>
                  <p className="text-body text-text-secondary">请先选择教材</p>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Modals */}
      <WordFormModal
        isOpen={isWordModalOpen}
        word={editingWord}
        collectionId={selectedCollectionId || ''}
        onClose={() => {
          setIsWordModalOpen(false);
          setEditingWord(null);
        }}
        onSubmit={handleSubmitWord}
      />

      <CollectionFormModal
        isOpen={isCollectionModalOpen}
        collection={editingCollection}
        onClose={() => {
          setIsCollectionModalOpen(false);
          setEditingCollection(null);
        }}
        onSubmit={handleSubmitCollection}
      />

      <BatchAddWordsModal
        isOpen={isBatchAddModalOpen}
        collectionId={selectedCollectionId || ''}
        onClose={() => setIsBatchAddModalOpen(false)}
        onSubmit={handleBatchSubmitWords}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

export { DataManagementPage };
