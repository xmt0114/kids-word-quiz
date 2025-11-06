import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../lib/utils';

interface CollectionFormData {
  name: string;
  description: string;
  category: string;
  textbook_type: string;
  grade_level: string;
  theme: string;
  is_public: boolean;
}

interface CollectionFormModalProps {
  isOpen: boolean;
  collection?: any; // 编辑时传入现有数据
  onClose: () => void;
  onSubmit: (data: CollectionFormData) => Promise<void>;
}

const CollectionFormModal: React.FC<CollectionFormModalProps> = ({
  isOpen,
  collection,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CollectionFormData>({
    name: '',
    description: '',
    category: 'textbook',
    textbook_type: '',
    grade_level: '',
    theme: '',
    is_public: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 当collection变化时更新表单数据
  useEffect(() => {
    if (collection) {
      setFormData({
        name: collection.name || '',
        description: collection.description || '',
        category: collection.category || 'textbook',
        textbook_type: collection.textbook_type || '',
        grade_level: collection.grade_level || '',
        theme: collection.theme || '',
        is_public: collection.is_public !== undefined ? collection.is_public : true,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'textbook',
        textbook_type: '',
        grade_level: '',
        theme: '',
        is_public: true,
      });
    }
    setErrors({});
  }, [collection]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '教材名称不能为空';
    }

    if (!formData.description.trim()) {
      newErrors.description = '教材描述不能为空';
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
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      setIsSubmitting(false);
    }
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
            {collection ? '编辑教材' : '添加教材'}
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
          {/* 教材名称 */}
          <div>
            <label className="block text-body font-bold text-text-primary mb-sm">
              教材名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={cn(
                'w-full px-md py-sm border-2 rounded-lg text-body',
                errors.name ? 'border-red-500' : 'border-gray-300 focus:border-primary-500',
                'outline-none transition-colors'
              )}
              placeholder="请输入教材名称"
            />
            {errors.name && (
              <p className="text-small text-red-500 mt-xs">{errors.name}</p>
            )}
          </div>

          {/* 教材描述 */}
          <div>
            <label className="block text-body font-bold text-text-primary mb-sm">
              教材描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={cn(
                'w-full px-md py-sm border-2 rounded-lg text-body',
                errors.description ? 'border-red-500' : 'border-gray-300 focus:border-primary-500',
                'outline-none transition-colors'
              )}
              rows={3}
              placeholder="请输入教材描述"
            />
            {errors.description && (
              <p className="text-small text-red-500 mt-xs">{errors.description}</p>
            )}
          </div>

          {/* 分类 */}
          <div>
            <label className="block text-body font-bold text-text-primary mb-sm">
              分类
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-md py-sm border-2 border-gray-300 focus:border-primary-500 rounded-lg text-body outline-none transition-colors"
            >
              <option value="textbook">教材</option>
              <option value="custom">课外</option>
              <option value="system">系统</option>
            </select>
          </div>

          {/* 教材类型 */}
          <div>
            <label className="block text-body font-bold text-text-primary mb-sm">
              教材类型
            </label>
            <input
              type="text"
              value={formData.textbook_type}
              onChange={(e) => setFormData({ ...formData, textbook_type: e.target.value })}
              className="w-full px-md py-sm border-2 border-gray-300 focus:border-primary-500 rounded-lg text-body outline-none transition-colors"
              placeholder="如：人教版、牛津版等"
            />
          </div>

          {/* 年级 */}
          <div>
            <label className="block text-body font-bold text-text-primary mb-sm">
              年级
            </label>
            <select
              value={formData.grade_level}
              onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
              className="w-full px-md py-sm border-2 border-gray-300 focus:border-primary-500 rounded-lg text-body outline-none transition-colors"
            >
              <option value="">请选择年级</option>
              <option value="1">一年级</option>
              <option value="2">二年级</option>
              <option value="3">三年级</option>
              <option value="4">四年级</option>
              <option value="5">五年级</option>
              <option value="6">六年级</option>
              <option value="7">初一</option>
              <option value="8">初二</option>
              <option value="9">初三</option>
            </select>
          </div>

          {/* 主题 */}
          <div>
            <label className="block text-body font-bold text-text-primary mb-sm">
              主题
            </label>
            <input
              type="text"
              value={formData.theme}
              onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
              className="w-full px-md py-sm border-2 border-gray-300 focus:border-primary-500 rounded-lg text-body outline-none transition-colors"
              placeholder="如：动物、颜色、数字等"
            />
          </div>

          {/* 公开状态 */}
          <div>
            <label className="flex items-center gap-sm cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                className="w-5 h-5 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-body text-text-primary">公开教材（其他用户可见）</span>
            </label>
          </div>

          {/* 按钮 */}
          <div className="flex gap-md justify-end pt-md border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '提交中...' : collection ? '保存' : '添加'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { CollectionFormModal };
