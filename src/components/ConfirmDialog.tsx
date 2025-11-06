import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
  variant = 'warning',
}) => {
  if (!isOpen) return null;

  const variantColors = {
    danger: 'text-red-600',
    warning: 'text-orange-600',
    info: 'text-blue-600',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 animate-fade-in"
        onClick={onCancel}
      />

      {/* 对话框 */}
      <div className="relative bg-white rounded-lg shadow-2xl p-xl max-w-md w-full animate-scale-in">
        {/* 关闭按钮 */}
        <button
          className="absolute top-md right-md p-sm hover:bg-gray-100 rounded-full transition-colors"
          onClick={onCancel}
        >
          <X size={20} className="text-gray-500" />
        </button>

        {/* 图标 */}
        <div className="flex items-center gap-md mb-lg">
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              variant === 'danger' && 'bg-red-100',
              variant === 'warning' && 'bg-orange-100',
              variant === 'info' && 'bg-blue-100'
            )}
          >
            <AlertTriangle size={24} className={variantColors[variant]} />
          </div>
          <h2 className="text-h2 font-bold text-text-primary">{title}</h2>
        </div>

        {/* 消息 */}
        <p className="text-body text-text-secondary mb-xl">{message}</p>

        {/* 按钮 */}
        <div className="flex gap-md justify-end">
          <Button variant="secondary" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'error' : 'primary'}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export { ConfirmDialog };
