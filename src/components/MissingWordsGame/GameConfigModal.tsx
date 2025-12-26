/**
 * GameConfigModal Component
 * 游戏配置弹窗组件 - 用于"哪个词语不见了？"游戏
 * 
 * 职责：
 * - 提供游戏参数配置界面
 * - 处理配置保存和取消
 * - 验证配置参数
 */

import React, { useState, useEffect } from 'react';
import type { GameConfigModalProps, GameConfig } from '../../types/missingWordsGame';
import { Button } from '../Button';
import { cn } from '../../lib/utils';

export const GameConfigModal: React.FC<GameConfigModalProps> = ({
  isOpen,
  currentConfig,
  onClose,
  onSave,
}) => {
  // 本地配置状态
  const [localConfig, setLocalConfig] = useState<GameConfig>(currentConfig);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 当弹窗打开时，重置本地配置为当前配置
  useEffect(() => {
    if (isOpen) {
      setLocalConfig(currentConfig);
      setErrors({});
    }
  }, [isOpen, currentConfig]);

  // 验证配置
  const validateConfig = (config: GameConfig): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    // 验证词语数量
    if (config.wordCount < 3 || config.wordCount > 8) {
      newErrors.wordCount = '词语数量必须在3-8之间';
    }

    // 验证消失数量
    if (config.hiddenCount < 1 || config.hiddenCount > 3) {
      newErrors.hiddenCount = '消失数量必须在1-3之间';
    }

    // 验证观察时间（挑战模式）
    if (config.observationTime < 3 || config.observationTime > 10) {
      newErrors.observationTime = '观察时间必须在3-10秒之间';
    }

    return newErrors;
  };

  // 处理配置变更
  const handleConfigChange = (key: keyof GameConfig, value: any) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);

    // 实时验证
    const newErrors = validateConfig(newConfig);
    setErrors(newErrors);
  };

  // 处理保存
  const handleSave = () => {
    const validationErrors = validateConfig(localConfig);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSave(localConfig);
  };

  // 处理取消
  const handleCancel = () => {
    setLocalConfig(currentConfig);
    setErrors({});
    onClose();
  };

  // 如果弹窗未打开，不渲染
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleCancel}
      data-testid="config-modal-overlay"
    >
      <div
        className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full mx-4 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        data-testid="config-modal"
      >
        {/* 标题 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">游戏设置</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        {/* 配置表单 */}
        <div className="space-y-6">

          {/* 词语数量 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              词语数量 (3-8)
            </label>
            <input
              type="number"
              min="3"
              max="8"
              value={localConfig.wordCount}
              onChange={(e) => handleConfigChange('wordCount', parseInt(e.target.value) || 3)}
              className={cn(
                'w-full p-3 border-2 rounded-xl transition-colors',
                errors.wordCount
                  ? 'border-red-500 focus:border-red-600'
                  : 'border-gray-300 focus:border-primary-500'
              )}
            />
            {errors.wordCount && (
              <p className="text-red-500 text-sm mt-1">{errors.wordCount}</p>
            )}
          </div>

          {/* 消失数量 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              消失数量 (1-3)
            </label>
            <input
              type="number"
              min="1"
              max="3"
              value={localConfig.hiddenCount}
              onChange={(e) => handleConfigChange('hiddenCount', parseInt(e.target.value) || 1)}
              className={cn(
                'w-full p-3 border-2 rounded-xl transition-colors',
                errors.hiddenCount
                  ? 'border-red-500 focus:border-red-600'
                  : 'border-gray-300 focus:border-primary-500'
              )}
            />
            {errors.hiddenCount && (
              <p className="text-red-500 text-sm mt-1">{errors.hiddenCount}</p>
            )}
          </div>

          {/* 观察时间（仅挑战模式） */}
          {localConfig.gameMode === 'challenge' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                观察时间 (3-10秒)
              </label>
              <input
                type="number"
                min="3"
                max="10"
                value={localConfig.observationTime}
                onChange={(e) => handleConfigChange('observationTime', parseInt(e.target.value) || 3)}
                className={cn(
                  'w-full p-3 border-2 rounded-xl transition-colors',
                  errors.observationTime
                    ? 'border-red-500 focus:border-red-600'
                    : 'border-gray-300 focus:border-primary-500'
                )}
              />
              {errors.observationTime && (
                <p className="text-red-500 text-sm mt-1">{errors.observationTime}</p>
              )}
            </div>
          )}
        </div>

        {/* 按钮 */}
        <div className="flex gap-3 mt-8">
          <Button
            onClick={handleCancel}
            variant="secondary"
            className="flex-1"
          >
            取消
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
            className="flex-1"
            disabled={Object.keys(errors).length > 0}
          >
            保存
          </Button>
        </div>
      </div>
    </div>
  );
};

GameConfigModal.displayName = 'GameConfigModal';
