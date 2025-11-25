import React, { useState, useEffect } from 'react';
import { X, Save, Brain, Book, Star, Gamepad2, Puzzle, Lightbulb, GraduationCap, Trophy, Target, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { Game } from '../types';

interface GameFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<Game, 'id' | 'created_at'>) => Promise<void>;
    initialData?: Game;
}

// 可用的图标列表
const AVAILABLE_ICONS = [
    { name: 'Brain', icon: Brain, label: '大脑' },
    { name: 'Book', icon: Book, label: '书籍' },
    { name: 'Star', icon: Star, label: '星星' },
    { name: 'Gamepad2', icon: Gamepad2, label: '手柄' },
    { name: 'Puzzle', icon: Puzzle, label: '拼图' },
    { name: 'Lightbulb', icon: Lightbulb, label: '灯泡' },
    { name: 'GraduationCap', icon: GraduationCap, label: '学位帽' },
    { name: 'Trophy', icon: Trophy, label: '奖杯' },
    { name: 'Target', icon: Target, label: '目标' },
    { name: 'Sparkles', icon: Sparkles, label: '闪光' },
];

export const GameFormModal: React.FC<GameFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData
}) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        icon: 'Brain',
        type: 'guess_word' as 'guess_word' | 'fill_blank',
        default_config: {
            questionType: 'text' as 'text' | 'audio',
            answerType: 'choice' as 'choice' | 'fill'
        },
        is_active: true
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    title: initialData.title,
                    description: initialData.description,
                    icon: initialData.icon,
                    type: initialData.type,
                    default_config: {
                        questionType: (initialData.default_config?.questionType as 'text' | 'audio') || 'text',
                        answerType: (initialData.default_config?.answerType as 'choice' | 'fill') || 'choice'
                    },
                    is_active: initialData.is_active
                });
            } else {
                // 重置为默认值
                setFormData({
                    title: '',
                    description: '',
                    icon: 'Brain',
                    type: 'guess_word' as 'guess_word' | 'fill_blank',
                    default_config: {
                        questionType: 'text',
                        answerType: 'choice'
                    },
                    is_active: true
                });
            }
            setError(null);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            setError('请输入游戏名称');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await onSubmit(formData);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : '保存失败');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {initialData ? '编辑游戏' : '创建新游戏'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* 基本信息 */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                游戏名称 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="例如：高级拼写挑战"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                游戏描述
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                rows={3}
                                placeholder="简要描述游戏的玩法或目标受众..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                选择图标
                            </label>
                            <div className="grid grid-cols-5 gap-2">
                                {AVAILABLE_ICONS.map((item) => {
                                    const Icon = item.icon;
                                    const isSelected = formData.icon === item.name;
                                    return (
                                        <button
                                            key={item.name}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, icon: item.name })}
                                            className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${isSelected
                                                ? 'border-primary-500 bg-primary-50 text-primary-600'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-500'
                                                }`}
                                            title={item.label}
                                        >
                                            <Icon size={24} />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* 默认配置 */}
                    <div className="border-t border-gray-100 pt-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">默认游戏设置</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    题目类型
                                </label>
                                <select
                                    value={formData.default_config.questionType}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        default_config: { ...formData.default_config, questionType: e.target.value as 'text' | 'audio' }
                                    })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="text">文字题干</option>
                                    <option value="audio">音频题干</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    答题方式
                                </label>
                                <select
                                    value={formData.default_config.answerType}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        default_config: { ...formData.default_config, answerType: e.target.value as 'choice' | 'fill' }
                                    })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="choice">选择题</option>
                                    <option value="fill">填空题</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            取消
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2"
                        >
                            <Save size={20} />
                            {isSubmitting ? '保存中...' : '保存游戏'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
