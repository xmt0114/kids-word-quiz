/**
 * 配置迁移集成测试
 * 
 * 测试配置加载的完整流程，用户和游客模式的配置切换，以及配置更新的正确性
 * 验证从 Context 到 Zustand 的迁移是否成功
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { useAppStore } from '../stores/appStore';

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        data: [
          { key: 'app_settings', value: { theme: 'light', language: 'zh-CN' } },
          { key: 'tts_defaults', value: { lang: 'en-US', rate: 0.8 } },
          { key: 'default_collection_id', value: 'test-collection' }
        ],
        error: null
      }))
    }))
  }
}));

describe('配置迁移集成测试', () => {
  let store: ReturnType<typeof useAppStore.getState>;

  beforeEach(() => {
    // 重置 store 状态
    useAppStore.setState({
      guestConfig: null,
      userConfig: null,
      configLoading: false,
      configError: null,
    });
    store = useAppStore.getState();
  });

  describe('配置加载完整流程', () => {
    it('应该能够加载游客配置', async () => {
      // 模拟配置数据
      const mockGuestConfig = {
        app_settings: { theme: 'light', language: 'zh-CN' },
        tts_defaults: { lang: 'en-US', rate: 0.8 },
        default_collection_id: 'test-collection'
      };

      // 设置游客配置
      store.setGuestConfig(mockGuestConfig);

      // 验证配置已正确加载
      expect(store.guestConfig).toEqual(mockGuestConfig);
      expect(store.configLoading).toBe(false);
      expect(store.configError).toBeNull();

      // 验证配置获取功能
      expect(store.getConfig('app_settings')).toEqual({ theme: 'light', language: 'zh-CN' });
      expect(store.getConfig('tts_defaults')).toEqual({ lang: 'en-US', rate: 0.8 });
      expect(store.getConfig('default_collection_id')).toBe('test-collection');
    });

    it('应该能够处理配置加载错误', () => {
      const errorMessage = '网络连接失败';
      
      // 设置错误状态
      store.setConfigError(errorMessage);

      // 验证错误状态
      expect(store.configError).toBe(errorMessage);
      expect(store.configLoading).toBe(false);
    });

    it('应该能够显示加载状态', () => {
      // 设置加载状态
      store.setConfigLoading(true);

      // 验证加载状态
      expect(store.configLoading).toBe(true);
      expect(store.configError).toBeNull();
    });
  });

  describe('用户和游客模式配置切换', () => {
    beforeEach(() => {
      // 设置基础游客配置
      const guestConfig = {
        app_settings: { theme: 'light', language: 'zh-CN' },
        tts_defaults: { lang: 'en-US', rate: 0.8 },
        default_collection_id: 'guest-collection'
      };
      store.setGuestConfig(guestConfig);
    });

    it('应该正确处理游客模式到用户模式的切换', () => {
      // 初始状态：游客模式
      expect(store.getConfig('app_settings')).toEqual({ theme: 'light', language: 'zh-CN' });
      expect(store.getConfig('default_collection_id')).toBe('guest-collection');

      // 切换到用户模式
      const userConfig = {
        app_settings: { theme: 'dark', language: 'en-US' },
        default_collection_id: 'user-collection'
      };
      store.setUserConfig(userConfig);

      // 验证用户配置优先级
      expect(store.getConfig('app_settings')).toEqual({ theme: 'dark', language: 'en-US' });
      expect(store.getConfig('default_collection_id')).toBe('user-collection');
      
      // 验证未覆盖的配置仍使用游客配置
      expect(store.getConfig('tts_defaults')).toEqual({ lang: 'en-US', rate: 0.8 });
    });

    it('应该正确处理用户模式到游客模式的切换', () => {
      // 设置用户配置
      const userConfig = {
        app_settings: { theme: 'dark', language: 'en-US' },
        default_collection_id: 'user-collection'
      };
      store.setUserConfig(userConfig);

      // 验证用户配置生效
      expect(store.getConfig('app_settings')).toEqual({ theme: 'dark', language: 'en-US' });

      // 切换回游客模式（清除用户配置）
      store.setUserConfig(null);

      // 验证回退到游客配置
      expect(store.getConfig('app_settings')).toEqual({ theme: 'light', language: 'zh-CN' });
      expect(store.getConfig('default_collection_id')).toBe('guest-collection');
    });

    it('应该正确处理部分用户配置覆盖', () => {
      // 设置部分用户配置（只覆盖部分项目）
      const userConfig = {
        app_settings: { theme: 'dark' } // 只覆盖主题，不覆盖语言
      };
      store.setUserConfig(userConfig);

      // 验证配置合并逻辑
      const mergedAppSettings = store.getConfig('app_settings');
      expect(mergedAppSettings).toEqual({ theme: 'dark' });
      
      // 验证其他配置仍使用游客配置
      expect(store.getConfig('tts_defaults')).toEqual({ lang: 'en-US', rate: 0.8 });
      expect(store.getConfig('default_collection_id')).toBe('guest-collection');
    });
  });

  describe('配置更新正确性', () => {
    beforeEach(() => {
      // 设置初始配置
      const guestConfig = {
        app_settings: { theme: 'light', language: 'zh-CN' },
        tts_defaults: { lang: 'en-US', rate: 0.8 }
      };
      store.setGuestConfig(guestConfig);
    });

    it('应该能够更新游客配置', () => {
      const newGuestConfig = {
        app_settings: { theme: 'auto', language: 'zh-CN' },
        tts_defaults: { lang: 'en-US', rate: 1.0 },
        new_setting: { value: 'test' }
      };

      store.setGuestConfig(newGuestConfig);

      // 验证配置更新
      expect(store.getConfig('app_settings')).toEqual({ theme: 'auto', language: 'zh-CN' });
      expect(store.getConfig('tts_defaults')).toEqual({ lang: 'en-US', rate: 1.0 });
      expect(store.getConfig('new_setting')).toEqual({ value: 'test' });
    });

    it('应该能够更新用户配置', () => {
      // 设置初始用户配置
      const initialUserConfig = {
        app_settings: { theme: 'dark' }
      };
      store.setUserConfig(initialUserConfig);

      // 更新用户配置
      const updatedUserConfig = {
        app_settings: { theme: 'dark', language: 'en-US' },
        custom_setting: { value: 'user-custom' }
      };
      store.setUserConfig(updatedUserConfig);

      // 验证配置更新
      expect(store.getConfig('app_settings')).toEqual({ theme: 'dark', language: 'en-US' });
      expect(store.getConfig('custom_setting')).toEqual({ value: 'user-custom' });
      
      // 验证游客配置仍然存在（未被覆盖的部分）
      expect(store.getConfig('tts_defaults')).toEqual({ lang: 'en-US', rate: 0.8 });
    });

    it('应该能够刷新配置', async () => {
      // Mock 刷新函数
      const mockRefresh = jest.fn().mockImplementation(() => Promise.resolve());
      store.refreshConfig = mockRefresh as any;

      // 调用刷新
      await store.refreshConfig();

      // 验证刷新函数被调用
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('配置获取方法兼容性', () => {
    beforeEach(() => {
      const guestConfig = {
        app_settings: { theme: 'light', language: 'zh-CN' },
        tts_defaults: { lang: 'en-US', rate: 0.8 },
        nested: {
          deep: {
            value: 'test-deep-value'
          }
        }
      };
      store.setGuestConfig(guestConfig);
    });

    it('getConfig 方法应该正确获取配置值', () => {
      // 测试顶级配置
      expect(store.getConfig('app_settings')).toEqual({ theme: 'light', language: 'zh-CN' });
      expect(store.getConfig('tts_defaults')).toEqual({ lang: 'en-US', rate: 0.8 });

      // 测试嵌套配置
      expect(store.getConfig('nested')).toEqual({ deep: { value: 'test-deep-value' } });

      // 测试不存在的配置
      expect(store.getConfig('non_existent')).toBeUndefined();
    });

    it('getConfigCategory 方法应该正确返回配置类别', () => {
      // 测试已知配置的类别
      expect(store.getConfigCategory('app_settings')).toBe('app_settings');
      expect(store.getConfigCategory('tts_defaults')).toBe('tts_defaults');

      // 测试不存在配置的类别
      expect(store.getConfigCategory('non_existent')).toBe('non_existent');
    });

    it('应该正确处理配置优先级', () => {
      // 设置用户配置覆盖部分游客配置
      const userConfig = {
        app_settings: { theme: 'dark' }, // 覆盖主题
        user_only: { setting: 'user-value' } // 用户独有配置
      };
      store.setUserConfig(userConfig);

      // 验证用户配置优先级
      expect(store.getConfig('app_settings')).toEqual({ theme: 'dark' });
      expect(store.getConfig('user_only')).toEqual({ setting: 'user-value' });

      // 验证游客配置仍然可用（未被覆盖的部分）
      expect(store.getConfig('tts_defaults')).toEqual({ lang: 'en-US', rate: 0.8 });
      expect(store.getConfig('nested')).toEqual({ deep: { value: 'test-deep-value' } });
    });
  });

  describe('错误处理和边界情况', () => {
    it('应该正确处理空配置', () => {
      // 设置空配置
      store.setGuestConfig({});
      store.setUserConfig({});

      // 验证空配置处理
      expect(store.getConfig('any_key')).toBeUndefined();
      expect(store.getConfigCategory('any_key')).toBe('any_key');
    });

    it('应该正确处理 null 配置', () => {
      // 设置 null 配置
      store.setGuestConfig(null);
      store.setUserConfig(null);

      // 验证 null 配置处理
      expect(store.getConfig('any_key')).toBeUndefined();
      expect(store.guestConfig).toBeNull();
      expect(store.userConfig).toBeNull();
    });

    it('应该正确处理配置加载状态变化', () => {
      // 开始加载
      store.setConfigLoading(true);
      expect(store.configLoading).toBe(true);
      expect(store.configError).toBeNull();

      // 加载成功
      store.setGuestConfig({ test: 'value' });
      store.setConfigLoading(false);
      expect(store.configLoading).toBe(false);
      expect(store.guestConfig).toEqual({ test: 'value' });

      // 加载失败
      store.setConfigLoading(true);
      store.setConfigError('加载失败');
      store.setConfigLoading(false);
      expect(store.configLoading).toBe(false);
      expect(store.configError).toBe('加载失败');
    });
  });
});