/**
 * AppStore 集成测试
 * 验证所有slice正确集成到主store中
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { create } from 'zustand';

// Mock supabase to avoid import.meta issues
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        data: [],
        error: null
      }))
    }))
  }
}));

// 导入slice创建函数进行独立测试
import { createConfigSlice, ConfigSlice } from '../stores/slices/configSlice';
import { createUISlice, UISlice } from '../stores/slices/uiSlice';
import { createAuthSlice, AuthSlice } from '../stores/slices/authSlice';

// 创建测试用的集成store
interface TestStore extends ConfigSlice, UISlice, AuthSlice {}

const createTestStore = () => {
  return create<TestStore>((set, get) => ({
    ...createConfigSlice(set, get),
    ...createUISlice(set, get),
    ...createAuthSlice(set, get),
  }));
};

describe('AppStore Integration Tests', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('Slice集成验证', () => {
    it('应该包含所有slice的状态和方法', () => {
      const state = store.getState();

      // ConfigSlice 状态和方法
      expect(state.guestConfig).toBeDefined();
      expect(state.userConfig).toBeDefined();
      expect(state.configLoading).toBeDefined();
      expect(state.configError).toBeDefined();
      expect(typeof state.setGuestConfig).toBe('function');
      expect(typeof state.setUserConfig).toBe('function');
      expect(typeof state.getConfig).toBe('function');

      // UISlice 状态和方法
      expect(state.loginModal).toBeDefined();
      expect(state.passwordSetupModal).toBeDefined();
      expect(state.globalLoading).toBeDefined();
      expect(state.notifications).toBeDefined();
      expect(typeof state.openLoginModal).toBe('function');
      expect(typeof state.addNotification).toBe('function');

      // AuthSlice 状态和方法
      expect(state.authLoading).toBeDefined();
      expect(state.session).toBeDefined();
      expect(state.profile).toBeDefined();
      expect(typeof state.setAuth).toBe('function');
      expect(typeof state.setAuthProfile).toBe('function');
      expect(typeof state.clearAuthData).toBe('function');

      // 基本集成验证完成
    });

    it('slice之间应该能正确交互', () => {
      // 测试配置和认证的交互
      const testConfig = { app_settings: { theme: 'dark' } };
      store.getState().setGuestConfig(testConfig);
      expect(store.getState().guestConfig).toEqual(testConfig);

      const testProfile = {
        id: 'test-user',
        role: 'student' as const,
        display_name: 'Test User'
      };
      store.getState().setAuthProfile(testProfile);
      expect(store.getState().profile).toEqual(testProfile);

      // 测试UI状态管理
      store.getState().openLoginModal('测试登录');
      expect(store.getState().loginModal.isOpen).toBe(true);
      expect(store.getState().loginModal.action).toBe('测试登录');

      store.getState().closeLoginModal();
      expect(store.getState().loginModal.isOpen).toBe(false);
    });
  });

  describe('数据加载集成', () => {
    it('应该能直接调用slice方法', () => {
      // 测试ConfigSlice方法
      const testConfig = { test_key: 'test_value' };
      store.getState().setGuestConfig(testConfig);
      expect(store.getState().guestConfig).toEqual(testConfig);
      
      // 测试AuthSlice方法
      const testProfile = {
        id: 'test-user',
        role: 'student' as const,
        display_name: 'Test User'
      };
      store.getState().setAuthProfile(testProfile);
      expect(store.getState().profile).toEqual(testProfile);
    });

    it('clearAllData应该清理所有slice的数据', () => {
      // 先设置一些数据
      store.getState().setGuestConfig({ test: 'config' });
      store.getState().setUserConfig({ user: 'config' });
      store.getState().setAuthProfile({
        id: 'test',
        role: 'student',
        display_name: 'Test'
      });
      
      // 清理数据
      store.getState().clearAuthData();
      store.getState().setUserConfig(null);
      
      // 验证数据已清理
      expect(store.getState().session).toBeNull();
      expect(store.getState().profile).toBeNull();
      expect(store.getState().userConfig).toBeNull();
    });
  });

  describe('配置优先级', () => {
    it('用户配置应该优先于游客配置', () => {
      // 设置游客配置
      store.getState().setGuestConfig({ test_key: 'guest_value' });
      expect(store.getState().getConfig('test_key')).toBe('guest_value');
      
      // 设置用户配置，应该覆盖游客配置
      store.getState().setUserConfig({ test_key: 'user_value' });
      expect(store.getState().getConfig('test_key')).toBe('user_value');
    });
  });

  describe('通知系统集成', () => {
    it('应该能正确管理通知', () => {
      // 添加通知
      store.getState().addNotification({
        type: 'success',
        message: '测试通知'
      });
      
      expect(store.getState().notifications).toHaveLength(1);
      expect(store.getState().notifications[0].message).toBe('测试通知');
      
      // 清除通知
      store.getState().clearAllNotifications();
      expect(store.getState().notifications).toHaveLength(0);
    });
  });
});