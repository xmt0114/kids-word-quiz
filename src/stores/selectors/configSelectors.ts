/**
 * 配置相关的选择器函数
 * 提供便捷的配置访问方法，兼容原有的 useAppConfig API
 */

import { useAppStore } from '../appStore';

/**
 * 获取特定配置项（兼容 useAppConfig.getConfig）
 * 优先级：用户配置 > 游客配置 > 默认值
 */
export const useConfigValue = (key: string) => {
  return useAppStore(state => state.getConfig(key));
};

/**
 * 获取配置项的类别（兼容 useAppConfig.getConfigCategory）
 */
export const useConfigCategory = (key: string) => {
  return useAppStore(state => state.getConfigCategory(key));
};

/**
 * 获取完整的配置对象
 * 返回合并后的配置（用户配置覆盖游客配置）
 */
export const useFullConfig = () => {
  return useAppStore(state => {
    if (state.userConfig) {
      return {
        ...state.guestConfig,
        ...state.userConfig,
      };
    }
    return state.guestConfig;
  });
};

/**
 * 检查配置是否正在加载
 */
export const useConfigLoading = () => {
  return useAppStore(state => state.configLoading);
};

/**
 * 获取配置错误信息
 */
export const useConfigError = () => {
  return useAppStore(state => state.configError);
};

/**
 * 获取数据源信息
 * 返回 'user' | 'guest' | null
 */
export const useDataSource = () => {
  return useAppStore(state => {
    if (state.configLoading) return null;
    return state.userConfig ? 'user' : 'guest';
  });
};

/**
 * 检查是否已加载配置数据
 */
export const useConfigLoaded = () => {
  return useAppStore(state => !state.configLoading && state.guestConfig !== null);
};

/**
 * 刷新配置的函数
 */
export const useRefreshConfig = () => {
  return useAppStore(state => state.refreshConfig);
};

/**
 * 组合选择器：获取所有配置相关状态
 * 兼容原有的 useAppContext 返回格式
 */
export const useConfigState = () => {
  return useAppStore(state => ({
    config: state.userConfig ? { ...state.guestConfig, ...state.userConfig } : state.guestConfig,
    loading: state.configLoading,
    error: state.configError,
    dataSource: state.configLoading ? null : (state.userConfig ? 'user' : 'guest'),
    getConfig: state.getConfig,
    getConfigCategory: state.getConfigCategory,
    refreshConfig: state.refreshConfig,
  }));
};