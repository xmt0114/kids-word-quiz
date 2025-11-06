import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../lib/utils';

interface WordFormData {
  word: string;
  definition: string;
  audioText: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: string[];
  answer: string;
  hint: string;
}

interface WordFormModalProps {
  isOpen: boolean;
  word?: any; // 编辑时传入现有数据
  collectionId: string;
  onClose: () => void;
  onSubmit: (data: WordFormData) => Promise<void>;
}

const WordFormModal: React.FC<WordFormModalProps> = ({
  isOpen,
  word,
  collectionId,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<WordFormData>({
    word: '',
    definition: '',
    audioText: '',
    difficulty: 'easy',
    options: ['', '', '', ''],
    answer: '',
    hint: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 当word变化时更新表单数据
  useEffect(() => {
    if (word) {
      setFormData({
        word: word.word || '',
        definition: word.definition || '',
        audioText: word.audioText || word.definition || '',
        difficulty: word.difficulty || 'easy',
        options: word.options || ['', '', '', ''],
        answer: word.answer || '',
        hint: word.hint || '',
      });
    } else {
      setFormData({
        word: '',
        definition: '',
        audioText: '',
        difficulty: 'easy',
        options: ['', '', '', ''],
        answer: '',
        hint: '',
      });
    }
    setErrors({});
  }, [word]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.word.trim()) {
      newErrors.word = '单词不能为空';
    }

    if (!formData.definition.trim()) {
      newErrors.definition = '定义不能为空';
    }

    if (!formData.audioText.trim()) {
      newErrors.audioText = '音频文本不能为空';
    }

    const validOptions = formData.options.filter(opt => opt.trim());
    if (validOptions.length < 3) {
      newErrors.options = '至少需要3个选项';
    }

    if (!formData.answer.trim()) {
      newErrors.answer = '答案不能为空';
    } else if (!formData.options.includes(formData.answer)) {
      newErrors.answer = '答案必须是选项之一';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        options: formData.options.filter(opt => opt.trim()), // 过滤空选项
      });
      onClose();
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, ''],
    });
  };

  const removeOption = (index: number) => {
    if (formData.options.length <= 3) return;
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md overflow-y-auto">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 animate-fade-in"
        onClick={onClose}
      />

      {/* 模态框 */}
      <div className="relative bg-white rounded-lg shadow-2xl p-xl max-w-2xl w-full my-8 animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-lg sticky top-0 bg-white pb-md border-b border-gray-200">
          <h2 className="text-h2 font-bold text-text-primary">
            {word ? '编辑词汇' : '添加词汇'}
          </h2>
          <button
            className="p-sm hover:bg-gray-100 rounded-full transition-colors"
            onClick={onClose}
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-lg">
          {/* 单词 */}
          <div>
            <label className="block text-body font-bold text-text-primary mb-sm">
              单词 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.word}
              onChange={(e) => setFormData({ ...formData, word: e.target.value })}
              className={cn(
                'w-full px-md py-sm border-2 rounded-lg text-body',
                errors.word ? 'border-red-500' : 'border-gray-300 focus:border-primary-500',
                'outline-none transition-colors'
              )}
              placeholder="请输入单词"
            />
            {errors.word && (
              <p className="text-small text-red-500 mt-xs">{errors.word}</p>
            )}
          </div>

          {/* 定义 */}
          <div>
            <label className="block text-body font-bold text-text-primary mb-sm">
              定义 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.definition}
              onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
              className={cn(
                'w-full px-md py-sm border-2 rounded-lg text-body',
                errors.definition ? 'border-red-500' : 'border-gray-300 focus:border-primary-500',
                'outline-none transition-colors'
              )}
              rows={3}
              placeholder="请输入定义"
            />
            {errors.definition && (
              <p className="text-small text-red-500 mt-xs">{errors.definition}</p>
            )}
          </div>

          {/* 音频文本 */}
          <div>
            <label className="block text-body font-bold text-text-primary mb-sm">
              音频文本 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.audioText}
              onChange={(e) => setFormData({ ...formData, audioText: e.target.value })}
              className={cn(
                'w-full px-md py-sm border-2 rounded-lg text-body',
                errors.audioText ? 'border-red-500' : 'border-gray-300 focus:border-primary-500',
                'outline-none transition-colors'
              )}
              placeholder="朗读文本（默认与单词相同）"
            />
            {errors.audioText && (
              <p className="text-small text-red-500 mt-xs">{errors.audioText}</p>
            )}
          </div>

          {/* 难度 */}
          <div>
            <label className="block text-body font-bold text-text-primary mb-sm">
              难度 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-md">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  className={cn(
                    'px-lg py-sm rounded-full text-body font-bold transition-all',
                    formData.difficulty === level
                      ? level === 'easy'
                        ? 'bg-green-500 text-white'
                        : level === 'medium'
                        ? 'bg-orange-500 text-white'
                        : 'bg-red-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  )}
                  onClick={() => setFormData({ ...formData, difficulty: level })}
                >
                  {level === 'easy' ? '简单' : level === 'medium' ? '中等' : '困难'}
                </button>
              ))}
            </div>
          </div>

          {/* 选项 */}
          <div>
            <div className="flex items-center justify-between mb-sm">
              <label className="text-body font-bold text-text-primary">
                选项 <span className="text-red-500">*</span> (至少3个)
              </label>
              <button
                type="button"
                className="flex items-center gap-xs text-small text-primary-500 hover:text-primary-600"
                onClick={addOption}
              >
                <Plus size={16} />
                添加选项
              </button>
            </div>
            <div className="space-y-sm">
              {formData.options.map((option, index) => (
                <div key={index} className="flex gap-sm">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-1 px-md py-sm border-2 border-gray-300 focus:border-primary-500 rounded-lg text-body outline-none transition-colors"
                    placeholder={`选项 ${index + 1}`}
                  />
                  {formData.options.length > 3 && (
                    <button
                      type="button"
                      className="p-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      onClick={() => removeOption(index)}
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {errors.options && (
              <p className="text-small text-red-500 mt-xs">{errors.options}</p>
            )}
          </div>

          {/* 答案 */}
          <div>
            <label className="block text-body font-bold text-text-primary mb-sm">
              正确答案 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              className={cn(
                'w-full px-md py-sm border-2 rounded-lg text-body',
                errors.answer ? 'border-red-500' : 'border-gray-300 focus:border-primary-500',
                'outline-none transition-colors'
              )}
            >
              <option value="">请选择答案</option>
              {formData.options.filter(opt => opt.trim()).map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.answer && (
              <p className="text-small text-red-500 mt-xs">{errors.answer}</p>
            )}
          </div>

          {/* 提示 */}
          <div>
            <label className="block text-body font-bold text-text-primary mb-sm">
              提示（可选）
            </label>
            <input
              type="text"
              value={formData.hint}
              onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
              className="w-full px-md py-sm border-2 border-gray-300 focus:border-primary-500 rounded-lg text-body outline-none transition-colors"
              placeholder="填空题的提示信息"
            />
          </div>

          {/* 按钮 */}
          <div className="flex gap-md justify-end pt-md border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '提交中...' : word ? '保存' : '添加'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { WordFormModal };
