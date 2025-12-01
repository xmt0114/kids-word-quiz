import React, { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './Card';
import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';
import { WordFormModal } from './WordFormModal';
import { CollectionFormModal } from './CollectionFormModal';
import { BatchAddWordsModal } from './BatchAddWordsModal';
import { GameFormModal } from './GameFormModal';
import { ArrowLeft, BookOpen, BookMarked, Plus, Edit, Edit2, Trash2, Database, Gamepad2, Filter, Upload, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { wordAPI } from '../utils/api';
import { WordCollection, Game } from '../types';
import { toast, Toaster } from 'sonner';
import { SupabaseWordAPI } from '../utils/supabaseApi';
import { supabase } from '../lib/supabase';
import { useGameTexts, formatMessage } from '../stores/appStore';

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

// 优化的单词行组件（memo化以避免不必要的重新渲染）
const WordRow = memo<{
  word: WordData;
  selectedWordIds: number[];
  onToggleSelection: (id: number) => void;
  onEdit: (word: WordData) => void;
  onDelete: (word: WordData) => void;
}>(({ word, selectedWordIds, onToggleSelection, onEdit, onDelete }) => {
  return (
    <tr className={cn(
      "border-b border-gray-100 hover:bg-gray-50 transition-colors",
      selectedWordIds.includes(word.id) && "bg-blue-50"
    )}>
      <td className="py-md px-md">
        <input
          type="checkbox"
          checked={selectedWordIds.includes(word.id)}
          onChange={() => onToggleSelection(word.id)}
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
            onClick={() => onEdit(word)}
          >
            <Edit size={16} />
          </button>
          <button
            className="p-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            onClick={() => onDelete(word)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
});

WordRow.displayName = 'WordRow';

export const DataManagementPage: React.FC<DataManagementPageProps> = ({ onBack }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/');
    }
  };

  // Selection State
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  // 获取当前游戏的文本配置
  const texts = useGameTexts(selectedGameId || '');

  // Data State
  const [games, setGames] = useState<Game[]>([]);
  const [collections, setCollections] = useState<WordCollection[]>([]);
  const [words, setWords] = useState<WordData[]>([]);

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWordIds, setSelectedWordIds] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<'word' | 'created_at'>('word');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals State
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [isWordModalOpen, setIsWordModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isBatchAddModalOpen, setIsBatchAddModalOpen] = useState(false);

  // Editing State
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [editingWord, setEditingWord] = useState<WordData | null>(null);
  const [editingCollection, setEditingCollection] = useState<WordCollection | null>(null);

  // Confirm Dialog State
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
    onConfirm: () => { },
  });

  const supabaseAPI = wordAPI as SupabaseWordAPI;

  // Initial Load
  useEffect(() => {
    loadGames();
  }, []);

  // Load Collections when Game changes
  useEffect(() => {
    if (selectedGameId) {
      loadCollections(selectedGameId);
      setSelectedCollectionId(null);
      setWords([]);
    } else {
      setCollections([]);
      setSelectedCollectionId(null);
      setWords([]);
    }
  }, [selectedGameId]);

  // Load Words when Collection changes
  useEffect(() => {
    if (selectedCollectionId) {
      // Reset pagination
      setCurrentPage(1);
      loadWords(selectedCollectionId, 1, wordsPerPage);
    } else {
      setWords([]);
    }
  }, [selectedCollectionId]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [wordsPerPage, setWordsPerPage] = useState(20);

  // Load Games
  const loadGames = async () => {
    try {
      if (wordAPI.getGames) {
        const response = await wordAPI.getGames();
        if (response.success && response.data) {
          setGames(response.data);
          // Optional: Auto-select first game if none selected? 
          // For now, let user select.
        }
      }
    } catch (error) {
      console.error('Failed to load games:', error);
    }
  };

  // Load Collections
  const loadCollections = async (gameId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await wordAPI.getCollections?.(gameId);
      if (response?.success && response.data) {
        setCollections(response.data);
      } else {
        setError(response?.error || '加载教材失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // Load Words
  const loadWords = async (collectionId: string, page: number = 1, limit: number = 20) => {
    setIsLoading(true);
    setError(null);
    try {
      const offset = (page - 1) * limit;
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
        setError(response.error || formatMessage(texts.messages.loadError, { itemName: texts.itemName }));
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate Total Pages
  useEffect(() => {
    const collection = collections.find(c => c.id === selectedCollectionId);
    if (collection) {
      const wordCount = collection.word_count || 0;
      const pages = Math.ceil(wordCount / wordsPerPage);
      setTotalPages(Math.max(pages, 1));
    }
  }, [selectedCollectionId, collections, wordsPerPage]);

  // Reload words when sort/page changes
  useEffect(() => {
    if (selectedCollectionId) {
      loadWords(selectedCollectionId, currentPage, wordsPerPage);
    }
  }, [currentPage, wordsPerPage, sortBy, sortOrder]);


  // --- Handlers ---

  // Game Handlers
  const handleAddGame = () => {
    setEditingGame(null);
    setIsGameModalOpen(true);
  };

  const handleEditGame = (e: React.MouseEvent, game: Game) => {
    e.stopPropagation();
    setEditingGame(game);
    setIsGameModalOpen(true);
  };

  const handleSubmitGame = async (data: any) => {
    try {
      if (editingGame) {
        const response = await wordAPI.updateGame?.(editingGame.id, data);
        if (response?.success) {
          toast.success('更新游戏成功');
          loadGames();
        } else {
          toast.error(response?.error || '更新游戏失败');
        }
      } else {
        const response = await wordAPI.createGame?.(data);
        if (response?.success) {
          toast.success('创建游戏成功');
          loadGames();
        } else {
          toast.error(response?.error || '创建游戏失败');
        }
      }
    } catch (err) {
      console.error('提交游戏失败:', err);
      toast.error('操作失败');
    }
  };

  const handleDeleteGame = (e: React.MouseEvent, game: Game) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: '确认删除游戏',
      message: `确定要删除游戏"${game.title}"吗？如果游戏下有教材，将无法删除。`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          const response = await supabaseAPI.deleteGame(game.id);
          if (response.success) {
            toast.success('删除游戏成功');
            loadGames();
            if (selectedGameId === game.id) {
              setSelectedGameId(null);
            }
          } else {
            toast.error(response.error || '删除游戏失败');
          }
        } catch (err) {
          toast.error('删除游戏失败');
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  // Collection Handlers
  const handleAddCollection = () => {
    if (!selectedGameId) {
      toast.error('请先选择游戏');
      return;
    }
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
      message: `确定要删除教材"${collection.name}"吗？如果教材下有${texts.itemName}，将无法删除。`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          const response = await supabaseAPI.deleteCollection(collection.id);
          if (response.success) {
            toast.success('删除教材成功');
            if (selectedGameId) loadCollections(selectedGameId);
            if (selectedCollectionId === collection.id) {
              setSelectedCollectionId(null);
            }
          } else {
            // 替换错误消息中的"词汇"为配置化文本
            let errorMsg = response.error || '删除教材失败';
            if (errorMsg.includes('词汇')) {
              errorMsg = errorMsg.replace(/词汇/g, texts.itemName);
            }
            toast.error(errorMsg);
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
      // Ensure game_id is set
      const submissionData = {
        ...data,
        game_id: selectedGameId || data.game_id
      };

      if (editingCollection) {
        const response = await supabaseAPI.updateCollection(editingCollection.id, submissionData);
        if (response.success) {
          toast.success('更新教材成功');
          if (selectedGameId) loadCollections(selectedGameId);
        } else {
          toast.error(response.error || '更新教材失败');
        }
      } else {
        const response = await supabaseAPI.createCollection(submissionData);
        if (response.success) {
          toast.success('添加教材成功');
          if (selectedGameId) loadCollections(selectedGameId);
        } else {
          toast.error(response.error || '添加教材失败');
        }
      }
    } catch (err) {
      console.error('提交教材失败:', err);
      toast.error('操作失败');
    }
  };

  // Word Handlers
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

  const handleBatchSubmitWords = async (
    batchWords: any[],
    onProgress?: (progress: { current: number; total: number; batchNumber: number; totalBatches: number; }) => void
  ): Promise<any[]> => {
    if (!selectedCollectionId) {
      toast.error('请先选择教材');
      throw new Error('未选择教材');
    }

    const MAX_BATCH_SIZE = 200;
    const failedWordIndices: number[] = [];
    let submittedCount = 0;

    try {
      const chunks: { words: any[]; startIndex: number }[] = [];
      for (let i = 0; i < batchWords.length; i += MAX_BATCH_SIZE) {
        chunks.push({ words: batchWords.slice(i, i + MAX_BATCH_SIZE), startIndex: i });
      }

      if (onProgress) onProgress({ current: submittedCount, total: batchWords.length, batchNumber: 0, totalBatches: chunks.length });

      for (let batchIndex = 0; batchIndex < chunks.length; batchIndex++) {
        const { words: batchData, startIndex } = chunks[batchIndex];
        if (onProgress) onProgress({ current: submittedCount, total: batchWords.length, batchNumber: batchIndex + 1, totalBatches: chunks.length });

        const preparedData = batchData.map((wordData: any) => ({
          word: wordData.word,
          definition: wordData.definition,
          audio_text: wordData.audioText || wordData.definition,
          difficulty: wordData.difficulty || 'easy',
          answer: wordData.answer || '',
          hint: wordData.hint || null,
          ...(wordData.options && { options: wordData.options }),
        }));

        const batchParams = { p_collection_id: selectedCollectionId, p_words_batch: preparedData };
        toast.loading(`正在提交第 ${batchIndex + 1}/${chunks.length} 批...`, { id: 'batch-add' });

        try {
          const { data: newWordsList, error } = await supabase.rpc('add_batch_words', batchParams);
          if (error) throw error;

          const successCount = newWordsList?.length || 0;
          toast.success(`第 ${batchIndex + 1} 批提交成功`);
          submittedCount += successCount;
        } catch (err) {
          for (let i = 0; i < batchData.length; i++) failedWordIndices.push(startIndex + i);
          // Stop on error for now to keep it simple or implement retry logic if needed
          // For brevity in this refactor, we catch and continue or stop. 
          // Let's just mark these as failed and continue to next chunk? 
          // Original logic stopped. Let's stop.
          break;
        }
      }

      toast.dismiss('batch-add');
      const totalSuccess = submittedCount;
      const failedCount = batchWords.length - totalSuccess;

      if (failedCount === 0) {
        toast.success(`所有单词提交成功！共 ${totalSuccess} 个`);
      } else {
        toast.warning(`提交完成！成功: ${totalSuccess}，失败: ${failedCount}`);
      }

      // Update UI
      if (selectedCollectionId) {
        // Update collection word count locally
        setCollections(prev => prev.map(c => {
          if (c.id === selectedCollectionId) {
            return { ...c, word_count: c.word_count + totalSuccess };
          }
          return c;
        }));
        // Reload words
        loadWords(selectedCollectionId, currentPage, wordsPerPage);
      }

      // Return failed words
      return failedWordIndices.map(idx => batchWords[idx]);

    } catch (err) {
      toast.dismiss('batch-add');
      toast.error('批量添加失败');
      return batchWords;
    }
  };

  const handleEditWord = (word: WordData) => {
    setEditingWord(word);
    setIsWordModalOpen(true);
  };

  const handleDeleteWord = (word: WordData) => {
    setConfirmDialog({
      isOpen: true,
      title: `确认删除${texts.itemName}`,
      message: `确定要删除${texts.itemName}"${word.word}"吗？`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          const response = await wordAPI.deleteWord(word.id);
          if (response.success) {
            toast.success(`删除${texts.itemName}成功`);
            if (selectedCollectionId) {
              setCollections(prev => prev.map(c =>
                c.id === selectedCollectionId ? { ...c, word_count: Math.max(c.word_count - 1, 0) } : c
              ));
              loadWords(selectedCollectionId, currentPage, wordsPerPage);
            }
          } else {
            toast.error(response.error || `删除${texts.itemName}失败`);
          }
        } catch (err) {
          toast.error(`删除${texts.itemName}失败`);
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const handleBatchDelete = () => {
    if (selectedWordIds.length === 0) return;

    setConfirmDialog({
      isOpen: true,
      title: '确认批量删除',
      message: `确定要删除选中的 ${selectedWordIds.length} 个${texts.itemName}吗？`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          const response = await supabaseAPI.batchDeleteWords(selectedWordIds);
          if (response.success) {
            toast.success(`成功删除 ${selectedWordIds.length} 个${texts.itemName}`);
            setSelectedWordIds([]);
            if (selectedCollectionId) {
              setCollections(prev => prev.map(c =>
                c.id === selectedCollectionId ? { ...c, word_count: Math.max(c.word_count - selectedWordIds.length, 0) } : c
              ));
              loadWords(selectedCollectionId, currentPage, wordsPerPage);
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

  const toggleWordSelection = (wordId: number) => {
    setSelectedWordIds(prev =>
      prev.includes(wordId) ? prev.filter(id => id !== wordId) : [...prev, wordId]
    );
  };

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
      if (editingWord) {
        const wordData = { ...data, collectionId: selectedCollectionId };
        const response = await wordAPI.updateWord(editingWord.id, wordData);
        if (response.success) {
          toast.success(`更新${texts.itemName}成功`);
          loadWords(selectedCollectionId);
        } else {
          toast.error(response.error || `更新${texts.itemName}失败`);
        }
      } else {
        const wordParams = {
          p_collection_id: selectedCollectionId,
          p_word: data.word,
          p_definition: data.definition,
          p_audio_text: data.audioText || data.definition,
          p_difficulty: data.difficulty || 'easy',
          p_answer: data.answer || '',
          p_hint: data.hint || null,
          p_options: data.options || null,
        };

        const { error } = await supabase.rpc('add_single_word', wordParams);

        if (error) {
          toast.error(`添加失败: ${error.message}`);
        } else {
          toast.success(`添加${texts.itemName}成功`);
          setCollections(prev => prev.map(c =>
            c.id === selectedCollectionId ? { ...c, word_count: c.word_count + 1 } : c
          ));
          loadWords(selectedCollectionId, currentPage, wordsPerPage);
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

  const selectedCollection = collections.find(c => c.id === selectedCollectionId);

  const handleWordsPerPageChange = (value: number) => {
    setWordsPerPage(value);
    setCurrentPage(1); // Reset to first page when words per page changes
  };

  return (
    <div className="min-h-screen bg-background-primary p-sm md:p-lg font-body">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="max-w-[1920px] mx-auto mb-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-md">
            <Button
              variant="secondary"
              onClick={handleBack}
              className="flex items-center gap-sm"
            >
              <ArrowLeft size={20} />
              返回首页
            </Button>
            <div className="flex items-center gap-sm">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-md">
                <Database size={24} className="text-white" />
              </div>
              <h1 className="text-h2 font-display font-bold text-text-primary">数据管理</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 flex gap-md h-[calc(100vh-140px)] overflow-hidden">

        {/* Column 1: Games List */}
        <div className="w-1/4 min-w-[280px] max-w-[350px] flex flex-col bg-white/50 rounded-lg border-2 border-white shadow-sm backdrop-blur-sm">
          <div className="p-md border-b-2 border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-display font-bold text-text-primary flex items-center gap-2">
              <Gamepad2 className="text-primary-500" size={24} />
              游戏列表
            </h2>
            <Button
              onClick={handleAddGame}
              className="w-10 h-10 p-0 rounded-full min-w-0 min-h-0"
              title="添加游戏"
            >
              <Plus size={20} />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-sm space-y-sm">
            {games.map(game => {
              const IconComponent = (window as any).LucideIcons?.[game.icon] || Gamepad2;
              const isSelected = selectedGameId === game.id;

              return (
                <div
                  key={game.id}
                  onClick={() => setSelectedGameId(game.id)}
                  className={cn(
                    "p-md rounded-md cursor-pointer transition-all duration-normal border-2 relative group",
                    isSelected
                      ? "bg-white border-primary-500 shadow-card scale-102 z-10"
                      : "bg-white border-transparent hover:border-primary-200 hover:shadow-md hover:-translate-y-1"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={cn(
                        "p-2 rounded-full",
                        isSelected ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-500"
                      )}>
                        <IconComponent size={20} />
                      </div>
                      <span className={cn(
                        "font-display font-bold truncate text-lg",
                        isSelected ? "text-primary-600" : "text-text-primary"
                      )}>
                        {game.title}
                      </span>
                    </div>
                    <div className={cn(
                      "flex gap-1 transition-opacity",
                      isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}>
                      <button
                        onClick={(e) => handleEditGame(e, game)}
                        className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-primary-500 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteGame(e, game)}
                        className="p-1.5 hover:bg-red-50 rounded-full text-gray-400 hover:text-error transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-text-secondary truncate pl-[52px]">
                    {game.description || '暂无描述'}
                  </div>
                </div>
              );
            })}

            {games.length === 0 && (
              <div className="text-center py-xl text-text-tertiary">
                <Gamepad2 size={48} className="mx-auto mb-md opacity-20" />
                <p>暂无游戏，请添加</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Collections List */}
        <div className="w-1/4 min-w-[280px] max-w-[350px] flex flex-col bg-white/50 rounded-lg border-2 border-white shadow-sm backdrop-blur-sm">
          <div className="p-md border-b-2 border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-display font-bold text-text-primary flex items-center gap-2">
              <BookOpen className="text-secondary-500" size={24} />
              教材列表
            </h2>
            <Button
              onClick={handleAddCollection}
              disabled={!selectedGameId}
              className={cn(
                "w-10 h-10 p-0 rounded-full min-w-0 min-h-0",
                !selectedGameId && "opacity-50 cursor-not-allowed"
              )}
              title="添加教材"
            >
              <Plus size={20} />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-sm space-y-sm">
            {!selectedGameId ? (
              <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
                <Gamepad2 size={48} className="mb-md opacity-20 animate-bounce" />
                <p className="font-display">请先选择一个游戏</p>
              </div>
            ) : (
              <>
                {collections.map(collection => {
                  const isSelected = selectedCollectionId === collection.id;
                  return (
                    <div
                      key={collection.id}
                      onClick={() => {
                        setSelectedCollectionId(collection.id);
                        setCurrentPage(1);
                      }}
                      className={cn(
                        "p-md rounded-md cursor-pointer transition-all duration-normal border-2 relative group",
                        isSelected
                          ? "bg-white border-secondary-500 shadow-card scale-102 z-10"
                          : "bg-white border-transparent hover:border-secondary-200 hover:shadow-md hover:-translate-y-1"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={cn(
                            "p-2 rounded-full",
                            isSelected ? "bg-secondary-100 text-secondary-600" : "bg-gray-100 text-gray-400 group-hover:bg-secondary-50 group-hover:text-secondary-500"
                          )}>
                            <BookOpen size={20} />
                          </div>
                          <span className={cn(
                            "font-display font-bold truncate text-lg",
                            isSelected ? "text-secondary-600" : "text-text-primary"
                          )}>
                            {collection.name}
                          </span>
                        </div>
                        <div className={cn(
                          "flex gap-1 transition-opacity",
                          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}>
                          <button
                            onClick={(e) => handleEditCollection(e, collection)}
                            className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-secondary-500 transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteCollection(e, collection)}
                            className="p-1.5 hover:bg-red-50 rounded-full text-gray-400 hover:text-error transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm text-text-secondary pl-[52px]">
                        <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                          {collection.grade_level ? `${collection.grade_level}年级` : '未设置'}
                        </span>
                        <span>{collection.word_count || 0} 词</span>
                      </div>
                    </div>
                  );
                })}

                {collections.length === 0 && (
                  <div className="text-center py-xl text-text-tertiary">
                    <BookOpen size={48} className="mx-auto mb-md opacity-20" />
                    <p>该游戏下暂无教材</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Column 3: Words List */}
        <div className="flex-1 flex flex-col bg-white/50 rounded-lg border-2 border-white shadow-sm backdrop-blur-sm min-w-[400px]">
          <div className="p-md border-b-2 border-gray-100 flex justify-between items-center bg-white/50 rounded-t-lg">
            <div className="flex items-center gap-md">
              <h2 className="text-xl font-display font-bold text-text-primary flex items-center gap-2">
                <BookMarked className="text-accent-500" size={24} />
                {texts.itemName}列表
              </h2>
              {selectedCollection && (
                <span className="text-sm font-bold text-secondary-500 bg-secondary-50 px-3 py-1 rounded-full">
                  共 {selectedCollection.word_count || 0} 个{texts.itemName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-sm">
              {selectedWordIds.length > 0 && (
                <Button
                  variant="error"
                  onClick={handleBatchDelete}
                  className="flex items-center gap-1 mr-2 px-3 py-1 min-h-[40px]"
                >
                  <Trash2 size={16} />
                  删除 ({selectedWordIds.length})
                </Button>
              )}

              <div className="flex bg-white rounded-full p-1 border-2 border-gray-100 shadow-sm mr-2">
                <button
                  onClick={() => setSortBy('word')}
                  className={cn(
                    "px-3 py-1 text-xs font-bold rounded-full transition-all",
                    sortBy === 'word' ? "bg-accent-500 text-text-primary shadow-sm" : "text-text-tertiary hover:text-text-primary"
                  )}
                >
                  按字母
                </button>
                <button
                  onClick={() => setSortBy('created_at')}
                  className={cn(
                    "px-3 py-1 text-xs font-bold rounded-full transition-all",
                    sortBy === 'created_at' ? "bg-accent-500 text-text-primary shadow-sm" : "text-text-tertiary hover:text-text-primary"
                  )}
                >
                  按时间
                </button>
                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="px-2 py-1 text-text-tertiary hover:text-text-primary ml-1"
                  title={sortOrder === 'asc' ? "升序" : "降序"}
                >
                  {sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                </button>
              </div>

              <Button
                variant="secondary"
                onClick={handleBatchAddWords}
                disabled={!selectedCollectionId}
                className="flex items-center gap-1 px-3 py-1 min-h-[40px]"
              >
                <Upload size={16} />
                批量
              </Button>
              <Button
                onClick={handleAddWord}
                disabled={!selectedCollectionId}
                className="flex items-center gap-1 px-3 py-1 min-h-[40px]"
              >
                <Plus size={16} />
                添加
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-md bg-white/30 custom-scrollbar">
            {!selectedCollectionId ? (
              <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
                <BookOpen size={48} className="mb-md opacity-20 animate-bounce" />
                <p className="font-display">请先选择一本教材</p>
              </div>
            ) : (
              <>
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-200 border-t-primary-500"></div>
                  </div>
                ) : words.length === 0 ? (
                  <div className="text-center py-12 text-text-tertiary bg-white rounded-lg border-2 border-dashed border-gray-200 m-4">
                    <p className="mb-md font-display">暂无{texts.itemName}数据</p>
                    <Button variant="secondary" onClick={handleAddWord}>
                      立即添加
                    </Button>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border-2 border-gray-100 overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 p-sm bg-gray-50 border-b-2 border-gray-100 text-xs font-bold text-text-secondary uppercase tracking-wider">
                      <div className="col-span-1 flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={words.length > 0 && selectedWordIds.length === words.length}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                        />
                      </div>
                      <div className="col-span-3">{texts.itemFieldLabel}</div>
                      <div className="col-span-4">{texts.definitionLabel}</div>
                      <div className="col-span-2">难度</div>
                      <div className="col-span-2 text-right">操作</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-100">
                      {words.map((word) => (
                        <div key={word.id} className="grid grid-cols-12 gap-4 p-sm hover:bg-primary-50 transition-colors group items-center text-sm">
                          <div className="col-span-1 flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={selectedWordIds.includes(word.id)}
                              onChange={() => toggleWordSelection(word.id)}
                              className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                            />
                          </div>
                          <div className="col-span-3 font-bold text-text-primary truncate font-display text-lg" title={word.word}>
                            {word.word}
                          </div>
                          <div className="col-span-4 text-text-secondary truncate" title={word.definition}>
                            {word.definition}
                          </div>
                          <div className="col-span-2">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-xs font-bold",
                              word.difficulty === 'easy' ? "bg-success/10 text-success" :
                                word.difficulty === 'medium' ? "bg-warning/10 text-warning" :
                                  "bg-error/10 text-error"
                            )}>
                              {word.difficulty === 'easy' ? '简单' : word.difficulty === 'medium' ? '中等' : '困难'}
                            </span>
                          </div>
                          <div className="col-span-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditWord(word)}
                              className="p-1.5 text-secondary-500 hover:bg-secondary-50 rounded-full transition-colors"
                              title="编辑"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteWord(word)}
                              className="p-1.5 text-error hover:bg-error/10 rounded-full transition-colors"
                              title="删除"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pagination */}
                {words.length > 0 && totalPages > 1 && (
                  <div className="mt-4 p-md border-t-2 border-gray-100 bg-white rounded-lg flex items-center justify-between">
                    <div className="text-sm text-text-secondary font-medium">
                      显示 {(currentPage - 1) * wordsPerPage + 1} - {Math.min(currentPage * wordsPerPage, selectedCollection?.word_count || 0)} 共 {selectedCollection?.word_count || 0} 条
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={wordsPerPage}
                        onChange={(e) => handleWordsPerPageChange(Number(e.target.value))}
                        className="text-sm border-2 border-gray-200 rounded-md px-2 py-1 focus:border-primary-500 focus:ring-0"
                      >
                        <option value="20">20条/页</option>
                        <option value="50">50条/页</option>
                        <option value="100">100条/页</option>
                      </select>

                      <div className="flex gap-1">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="p-1 rounded-md border-2 border-gray-200 disabled:opacity-50 hover:border-primary-500 hover:text-primary-500 transition-colors"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span className="px-3 py-1 text-sm font-bold text-text-primary">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="p-1 rounded-md border-2 border-gray-200 disabled:opacity-50 hover:border-primary-500 hover:text-primary-500 transition-colors"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <GameFormModal
        isOpen={isGameModalOpen}
        onClose={() => setIsGameModalOpen(false)}
        onSubmit={handleSubmitGame}
        initialData={editingGame || undefined}
      />

      <CollectionFormModal
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
        onSubmit={handleSubmitCollection}
        collection={editingCollection}
        games={games}
      />

      <WordFormModal
        isOpen={isWordModalOpen}
        onClose={() => setIsWordModalOpen(false)}
        onSubmit={handleSubmitWord}
        word={editingWord || undefined}
        collectionId={selectedCollectionId || ''}
        gameId={selectedGameId || ''}
      />

      <BatchAddWordsModal
        isOpen={isBatchAddModalOpen}
        onClose={() => setIsBatchAddModalOpen(false)}
        onSubmit={handleBatchSubmitWords}
        collectionId={selectedCollectionId || ''}
        gameId={selectedGameId || ''}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        variant={confirmDialog.variant}
      />
    </div>
  );
};
