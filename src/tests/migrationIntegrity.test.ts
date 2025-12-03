/**
 * 迁移完整性测试
 * 
 * 验证状态更新统一性和功能完整性保持
 * 对应属性3和属性4的测试
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { useAppStore } from '../stores/appStore';

describe('迁移完整性测试', () => {
  let store: ReturnType<typeof useAppStore.getState>;

  beforeEach(() => {
    // 重置 store 状态
    useAppStore.setState({
      session: null,
      profile: null,
      authLoading: false,
      guestConfig: null,
      userConfig: null,
      configLoading: false,
      configError: null,
      loginModal: { isOpen: false, action: '' },
      notifications: [],
      globalLoading: false,
      userSettings: null,
      userProgress: null,
      dataLoading: false,
    });
    store = useAppStore.getState();
  });

  describe('属性3: 状态更新统一性', () => {
    it('所有状态更新应该通过统一的Zustand store', () => {
      // 验证认证状态更新
      const testSession = { user: { id: 'test-user', email: 'test@example.com' } } as any;
      const testProfile = { id: 'test-user', role: 'student', display_name: 'Test User' } as any;

      store.setAuth(testSession);
      store.setAuthProfile(testProfile);

      expect(store.session).toEqual(testSession);
      expect(store.profile).toEqual(testProfile);

      // 验证配置状态更新
      const testGuestConfig = { app_settings: { theme: 'light' }, tts_defaults: { lang: 'en-US' } };
      const testUserConfig = { app_settings: { theme: 'dark' } };

      store.setGuestConfig(testGuestConfig);
      store.setUserConfig(testUserConfig);

      expect(store.guestConfig).toEqual(testGuestConfig);
      expect(store.userConfig).toEqual(testUserConfig);

      // 验证UI状态更新
      store.openLoginModal('测试操作');
      expect(store.loginModal.isOpen).toBe(true);
      expect(store.loginModal.action).toBe('测试操作');

      store.closeLoginModal();
      expect(store.loginModal.isOpen).toBe(false);
    });

    it('状态更新应该是原子性的', () => {
      // 测试批量状态更新
      const initialState = { ...store };

      // 执行批量更新
      useAppStore.setState({
        session: { user: { id: 'batch-test' } } as any,
        profile: { id: 'batch-test', role: 'admin', display_name: 'Batch Test' } as any,
        guestConfig: { test: 'batch-config' },
        loginModal: { isOpen: true, action: 'batch-action' }
      });

      const updatedStore = useAppStore.getState();

      // 验证所有更新都生效
      expect(updatedStore.session?.user?.id).toBe('batch-test');
      expect(updatedStore.profile?.role).toBe('admin');
      expect(updatedStore.guestConfig?.test).toBe('batch-config');
      expect(updatedStore.loginModal.isOpen).toBe(true);
    });

    it('状态更新应该触发订阅者', () => {
      const stateChanges: any[] = [];
      
      // 订阅状态变化
      const unsubscribe = useAppStore.subscribe((state) => {
        stateChanges.push({
          timestamp: Date.now(),
          session: state.session?.user?.id,
          profile: state.profile?.id,
          configLoading: state.configLoading,
          loginModal: state.loginModal.isOpen
        });
      });

      // 触发多个状态更新
      store.setAuth({ user: { id: 'sub-test' } } as any);
      store.setAuthProfile({ id: 'sub-test', role: 'teacher', display_name: 'Sub Test' } as any);
      store.setConfigLoading(true);
      store.openLoginModal('订阅测试');

      // 验证订阅者被正确触发
      expect(stateChanges.length).toBeGreaterThan(0);
      
      // 验证最后的状态是正确的
      const lastChange = stateChanges[stateChanges.length - 1];
      expect(lastChange.session).toBe('sub-test');
      expect(lastChange.loginModal).toBe(true);

      unsubscribe();
    });

    it('状态更新应该保持数据一致性', () => {
      // 设置相关联的状态
      store.setAuth({ user: { id: 'consistency-test' } } as any);
      store.setAuthProfile({ id: 'consistency-test', role: 'parent', display_name: 'Consistency Test' } as any);
      store.setUserConfig({ user_setting: 'test-value' });

      // 验证相关状态的一致性
      expect(store.session?.user?.id).toBe(store.profile?.id);
      expect(store.userConfig).toBeDefined();

      // 清理认证数据应该保持一致性
      store.clearAuthData();
      expect(store.session).toBeNull();
      expect(store.profile).toBeNull();
      expect(store.authLoading).toBe(false);
    });
  });

  describe('属性4: 功能完整性保持', () => {
    it('认证功能应该完整保持', () => {
      // 验证认证状态管理
      expect(typeof store.setAuth).toBe('function');
      expect(typeof store.setAuthProfile).toBe('function');
      expect(typeof store.setAuthLoading).toBe('function');
      expect(typeof store.clearAuthData).toBe('function');

      // 验证认证流程
      store.setAuthLoading(true);
      expect(store.authLoading).toBe(true);

      const testSession = { user: { id: 'auth-test', email: 'auth@test.com' } } as any;
      store.setAuth(testSession);
      expect(store.session).toEqual(testSession);

      const testProfile = { id: 'auth-test', role: 'student', display_name: 'Auth Test' } as any;
      store.setAuthProfile(testProfile);
      expect(store.profile).toEqual(testProfile);

      store.setAuthLoading(false);
      expect(store.authLoading).toBe(false);

      // 验证登出功能
      store.clearAuthData();
      expect(store.session).toBeNull();
      expect(store.profile).toBeNull();
    });

    it('配置管理功能应该完整保持', () => {
      // 验证配置管理方法
      expect(typeof store.setGuestConfig).toBe('function');
      expect(typeof store.setUserConfig).toBe('function');
      expect(typeof store.getConfig).toBe('function');
      expect(typeof store.getConfigCategory).toBe('function');
      expect(typeof store.setConfigLoading).toBe('function');
      expect(typeof store.setConfigError).toBe('function');

      // 验证配置加载流程
      store.setConfigLoading(true);
      expect(store.configLoading).toBe(true);

      const guestConfig = {
        app_settings: { theme: 'light', language: 'zh-CN' },
        tts_defaults: { lang: 'en-US', rate: 0.8 },
        default_collection_id: 'test-collection'
      };
      store.setGuestConfig(guestConfig);
      expect(store.guestConfig).toEqual(guestConfig);

      store.setConfigLoading(false);
      expect(store.configLoading).toBe(false);

      // 验证配置获取功能
      expect(store.getConfig('app_settings')).toEqual({ theme: 'light', language: 'zh-CN' });
      expect(store.getConfig('tts_defaults')).toEqual({ lang: 'en-US', rate: 0.8 });
      expect(store.getConfigCategory('app_settings')).toBe('app_settings');

      // 验证用户配置优先级
      const userConfig = { app_settings: { theme: 'dark' } };
      store.setUserConfig(userConfig);
      expect(store.getConfig('app_settings')).toEqual({ theme: 'dark' });
      expect(store.getConfig('tts_defaults')).toEqual({ lang: 'en-US', rate: 0.8 }); // 仍使用游客配置
    });

    it('UI状态管理功能应该完整保持', () => {
      // 验证UI状态管理方法
      expect(typeof store.openLoginModal).toBe('function');
      expect(typeof store.closeLoginModal).toBe('function');
      expect(typeof store.setGlobalLoading).toBe('function');
      expect(typeof store.addNotification).toBe('function');
      expect(typeof store.removeNotification).toBe('function');
      expect(typeof store.clearAllNotifications).toBe('function');

      // 验证登录模态框功能
      store.openLoginModal('功能测试');
      expect(store.loginModal.isOpen).toBe(true);
      expect(store.loginModal.action).toBe('功能测试');

      store.closeLoginModal();
      expect(store.loginModal.isOpen).toBe(false);

      // 验证全局加载状态
      store.setGlobalLoading(true);
      expect(store.globalLoading).toBe(true);

      store.setGlobalLoading(false);
      expect(store.globalLoading).toBe(false);

      // 验证通知系统
      const testNotification = { type: 'success' as const, message: '测试通知' };
      store.addNotification(testNotification);
      expect(store.notifications.length).toBe(1);
      expect(store.notifications[0].message).toBe('测试通知');

      const notificationId = store.notifications[0].id;
      store.removeNotification(notificationId);
      expect(store.notifications.length).toBe(0);
    });

    it('数据加载功能应该完整保持', () => {
      // 验证数据加载方法存在
      expect(typeof store.loadGuestData).toBe('function');
      expect(typeof store.loadUserData).toBe('function');
      expect(typeof store.clearAllData).toBe('function');
      expect(typeof store.updateSettings).toBe('function');

      // 验证数据状态管理
      expect(store.dataLoading).toBe(false);
      expect(store.userSettings).toBeNull();
      expect(store.userProgress).toBeNull();

      // 模拟数据更新
      const testSettings = { game_settings: { difficulty: 'medium' } };
      store.updateSettings(testSettings);
      expect(store.userSettings).toEqual(testSettings);
    });

    it('状态选择器功能应该完整保持', () => {
      // 设置测试数据
      const guestConfig = { app_settings: { theme: 'light' }, tts_defaults: { lang: 'en-US' } };
      const userConfig = { app_settings: { theme: 'dark' } };
      
      store.setGuestConfig(guestConfig);
      store.setUserConfig(userConfig);

      // 验证选择器功能
      expect(store.getConfig('app_settings')).toEqual({ theme: 'dark' });
      expect(store.getConfig('tts_defaults')).toEqual({ lang: 'en-US' });
      expect(store.getConfig('non_existent')).toBeUndefined();

      // 验证配置类别
      expect(store.getConfigCategory('app_settings')).toBe('app_settings');
      expect(store.getConfigCategory('unknown')).toBe('unknown');
    });

    it('错误处理功能应该完整保持', () => {
      // 验证错误状态管理
      const testError = '配置加载失败';
      store.setConfigError(testError);
      expect(store.configError).toBe(testError);

      // 清除错误
      store.setConfigError(null);
      expect(store.configError).toBeNull();

      // 验证加载状态错误处理
      store.setConfigLoading(true);
      store.setConfigError('网络错误');
      store.setConfigLoading(false);
      
      expect(store.configLoading).toBe(false);
      expect(store.configError).toBe('网络错误');
    });
  });

  describe('集成功能验证', () => {
    it('完整的用户登录流程应该正常工作', () => {
      // 模拟完整的登录流程
      
      // 1. 开始加载
      store.setAuthLoading(true);
      store.setConfigLoading(true);
      
      // 2. 加载游客配置
      const guestConfig = { app_settings: { theme: 'light' }, tts_defaults: { lang: 'en-US' } };
      store.setGuestConfig(guestConfig);
      store.setConfigLoading(false);
      
      // 3. 用户登录
      const session = { user: { id: 'integration-test', email: 'integration@test.com' } } as any;
      const profile = { id: 'integration-test', role: 'student', display_name: 'Integration Test' } as any;
      
      store.setAuth(session);
      store.setAuthProfile(profile);
      
      // 4. 加载用户配置
      const userConfig = { app_settings: { theme: 'dark' } };
      store.setUserConfig(userConfig);
      
      // 5. 完成加载
      store.setAuthLoading(false);
      
      // 验证最终状态
      expect(store.session).toEqual(session);
      expect(store.profile).toEqual(profile);
      expect(store.guestConfig).toEqual(guestConfig);
      expect(store.userConfig).toEqual(userConfig);
      expect(store.getConfig('app_settings')).toEqual({ theme: 'dark' }); // 用户配置优先
      expect(store.getConfig('tts_defaults')).toEqual({ lang: 'en-US' }); // 游客配置兜底
      expect(store.authLoading).toBe(false);
      expect(store.configLoading).toBe(false);
    });

    it('完整的用户登出流程应该正常工作', () => {
      // 设置登录状态
      store.setAuth({ user: { id: 'logout-test' } } as any);
      store.setAuthProfile({ id: 'logout-test', role: 'teacher', display_name: 'Logout Test' } as any);
      store.setUserConfig({ user_setting: 'test' });
      store.setGuestConfig({ guest_setting: 'test' });
      
      // 执行登出
      store.clearAuthData();
      store.setUserConfig(null);
      
      // 验证登出后状态
      expect(store.session).toBeNull();
      expect(store.profile).toBeNull();
      expect(store.userConfig).toBeNull();
      expect(store.guestConfig).toEqual({ guest_setting: 'test' }); // 游客配置保留
      expect(store.getConfig('guest_setting')).toBe('test');
      expect(store.getConfig('user_setting')).toBeUndefined();
    });

    it('应用初始化流程应该正常工作', () => {
      // 模拟应用启动
      expect(store.authLoading).toBe(false);
      expect(store.configLoading).toBe(false);
      expect(store.session).toBeNull();
      expect(store.profile).toBeNull();
      expect(store.guestConfig).toBeNull();
      expect(store.userConfig).toBeNull();
      
      // 开始初始化
      store.setAuthLoading(true);
      store.setConfigLoading(true);
      
      // 加载基础配置
      store.setGuestConfig({ app_settings: { theme: 'light' } });
      store.setConfigLoading(false);
      
      // 检查认证状态（无用户）
      store.setAuthLoading(false);
      
      // 验证初始化完成状态
      expect(store.authLoading).toBe(false);
      expect(store.configLoading).toBe(false);
      expect(store.guestConfig).toEqual({ app_settings: { theme: 'light' } });
      expect(store.getConfig('app_settings')).toEqual({ theme: 'light' });
    });
  });
});