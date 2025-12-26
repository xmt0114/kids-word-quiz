/**
 * Missing Words Game Configuration Management
 * 游戏配置管理工具
 */

import type { GameConfig, ConfigValidationResult } from '../types/missingWordsGame';
import { DEFAULT_GAME_CONFIG } from '../types/missingWordsGame';

// 本地存储键名
const CONFIG_STORAGE_KEY = 'missing-words-game-config';

/**
 * 验证游戏配置是否有效
 */
export function validateGameConfig(config: GameConfig): ConfigValidationResult {
  const errors: string[] = [];

  // 验证wordCount范围 (3-8)
  if (config.wordCount < 3 || config.wordCount > 8) {
    errors.push('观察词语数量必须在3到8之间');
  }

  // 验证hiddenCount范围 (1-3)
  if (config.hiddenCount < 1 || config.hiddenCount > 3) {
    errors.push('消失词语数量必须在1到3之间');
  }

  // 验证observationTime范围 (3-10)
  if (config.observationTime < 3 || config.observationTime > 10) {
    errors.push('观察时间必须在3到10秒之间');
  }

  // 验证hiddenCount不能大于wordCount
  if (config.hiddenCount > config.wordCount) {
    errors.push('消失词语数量不能大于观察词语数量');
  }

  // 验证gameMode
  if (config.gameMode !== 'casual' && config.gameMode !== 'challenge') {
    errors.push('游戏模式必须是休闲模式或挑战模式');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 从本地存储加载配置
 */
export function loadConfig(): GameConfig {
  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!stored) {
      return DEFAULT_GAME_CONFIG;
    }

    const config = JSON.parse(stored) as GameConfig;
    
    // 验证加载的配置
    const validation = validateGameConfig(config);
    if (!validation.isValid) {
      console.warn('加载的配置无效，使用默认配置:', validation.errors);
      return DEFAULT_GAME_CONFIG;
    }

    return config;
  } catch (error) {
    console.error('加载配置失败:', error);
    return DEFAULT_GAME_CONFIG;
  }
}

/**
 * 保存配置到本地存储
 */
export function saveConfig(config: GameConfig): boolean {
  try {
    // 验证配置
    const validation = validateGameConfig(config);
    if (!validation.isValid) {
      console.error('配置验证失败:', validation.errors);
      return false;
    }

    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('保存配置失败:', error);
    return false;
  }
}

/**
 * 清除保存的配置
 */
export function clearConfig(): void {
  try {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
  } catch (error) {
    console.error('清除配置失败:', error);
  }
}

/**
 * 重置为默认配置
 */
export function resetToDefaultConfig(): GameConfig {
  clearConfig();
  return DEFAULT_GAME_CONFIG;
}

/**
 * 应用配置边界值约束
 * 确保配置值在有效范围内
 */
export function applyConfigConstraints(config: Partial<GameConfig>): Partial<GameConfig> {
  const constrained: Partial<GameConfig> = { ...config };

  // 约束wordCount (3-8)
  if (constrained.wordCount !== undefined) {
    constrained.wordCount = Math.max(3, Math.min(8, constrained.wordCount));
  }

  // 约束hiddenCount (1-3)
  if (constrained.hiddenCount !== undefined) {
    constrained.hiddenCount = Math.max(1, Math.min(3, constrained.hiddenCount));
  }

  // 约束observationTime (3-10)
  if (constrained.observationTime !== undefined) {
    constrained.observationTime = Math.max(3, Math.min(10, constrained.observationTime));
  }

  // 确保hiddenCount不大于wordCount
  if (constrained.wordCount !== undefined && constrained.hiddenCount !== undefined) {
    if (constrained.hiddenCount > constrained.wordCount) {
      constrained.hiddenCount = constrained.wordCount;
    }
  }

  return constrained;
}

/**
 * 合并配置（用于部分更新）
 */
export function mergeConfig(
  currentConfig: GameConfig,
  updates: Partial<GameConfig>
): GameConfig {
  // 应用约束
  const constrainedUpdates = applyConfigConstraints(updates);

  // 合并配置
  const merged: GameConfig = {
    ...currentConfig,
    ...constrainedUpdates,
  };

  // 再次验证合并后的配置
  const validation = validateGameConfig(merged);
  if (!validation.isValid) {
    console.warn('合并后的配置无效，返回当前配置:', validation.errors);
    return currentConfig;
  }

  return merged;
}

/**
 * 获取配置的显示文本
 */
export function getConfigDisplayText(config: GameConfig): {
  mode: string;
  wordCount: string;
  hiddenCount: string;
  observationTime: string;
} {
  return {
    mode: config.gameMode === 'casual' ? '休闲模式' : '挑战模式',
    wordCount: `${config.wordCount}个词语`,
    hiddenCount: `消失${config.hiddenCount}个`,
    observationTime: `${config.observationTime}秒观察时间`,
  };
}
