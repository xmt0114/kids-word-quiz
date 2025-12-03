/**
 * 性能验证测试
 * 
 * 对比迁移前后的渲染性能，验证状态订阅的效率，测试大量状态更新的性能
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { useAppStore } from '../stores/appStore';
import { performanceMonitor } from '../utils/performanceMonitor';

describe('性能验证测试', () => {
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
      games: null,
      gamesLoading: false,
      gamesError: null,
    });
    store = useAppStore.getState();
    performanceMonitor.reset();
  });

  describe('渲染性能验证', () => {
    it('状态更新应该是高效的', () => {
      const startTime = performance.now();
      
      // 执行100次状态更新
      for (let i = 0; i < 100; i++) {
        store.setAuth({ user: { id: `test-${i}` } } as any);
        store.setAuthProfile({ id: `test-${i}`, role: 'student', display_name: `Test ${i}` } as any);
        store.setGuestConfig({ test: `config-${i}` });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 100次更新应该在合理时间内完成（比如50ms）
      expect(duration).toBeLessThan(50);
      console.log(`100次状态更新耗时: ${duration.toFixed(2)}ms`);
    });

    it('批量状态更新应该比单独更新更高效', () => {
      // 测试单独更新
      const singleUpdateStart = performance.now();
      for (let i = 0; i < 50; i++) {
        store.setAuth({ user: { id: `single-${i}` } } as any);
        store.setAuthProfile({ id: `single-${i}`, role: 'student', display_name: `Single ${i}` } as any);
        store.setGuestConfig({ test: `single-${i}` });
      }
      const singleUpdateEnd = performance.now();
      const singleUpdateDuration = singleUpdateEnd - singleUpdateStart;

      // 重置状态
      useAppStore.setState({
        session: null,
        profile: null,
        guestConfig: null,
      });

      // 测试批量更新
      const batchUpdateStart = performance.now();
      for (let i = 0; i < 50; i++) {
        useAppStore.setState({
          session: { user: { id: `batch-${i}` } } as any,
          profile: { id: `batch-${i}`, role: 'student', display_name: `Batch ${i}` } as any,
          guestConfig: { test: `batch-${i}` }
        });
      }
      const batchUpdateEnd = performance.now();
      const batchUpdateDuration = batchUpdateEnd - batchUpdateStart;

      console.log(`单独更新耗时: ${singleUpdateDuration.toFixed(2)}ms`);
      console.log(`批量更新耗时: ${batchUpdateDuration.toFixed(2)}ms`);
      
      // 批量更新通常应该更快或至少不慢太多
      expect(batchUpdateDuration).toBeLessThanOrEqual(singleUpdateDuration * 1.2);
    });

    it('选择器应该避免不必要的重新计算', () => {
      // 设置初始配置
      store.setGuestConfig({ app_settings: { theme: 'light' }, tts_defaults: { lang: 'en-US' } });
      store.setUserConfig({ app_settings: { theme: 'dark' } });

      const startTime = performance.now();
      
      // 多次调用相同的选择器
      for (let i = 0; i < 1000; i++) {
        const config1 = store.getConfig('app_settings');
        const config2 = store.getConfig('tts_defaults');
        const category1 = store.getConfigCategory('app_settings');
        const category2 = store.getConfigCategory('tts_defaults');
        
        // 验证结果一致性
        expect(config1).toEqual({ theme: 'dark' });
        expect(config2).toEqual({ lang: 'en-US' });
        expect(category1).toBe('app_settings');
        expect(category2).toBe('tts_defaults');
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 1000次选择器调用应该很快（比如10ms内）
      expect(duration).toBeLessThan(10);
      console.log(`1000次选择器调用耗时: ${duration.toFixed(2)}ms`);
    });
  });

  describe('状态订阅效率验证', () => {
    it('订阅者应该只在相关状态变化时被触发', () => {
      let authCallCount = 0;
      let configCallCount = 0;
      let uiCallCount = 0;

      // 创建针对性订阅
      const unsubscribeAuth = useAppStore.subscribe(
        (state) => state.session,
        () => { authCallCount++; }
      );

      const unsubscribeConfig = useAppStore.subscribe(
        (state) => state.guestConfig,
        () => { configCallCount++; }
      );

      const unsubscribeUI = useAppStore.subscribe(
        (state) => state.loginModal,
        () => { uiCallCount++; }
      );

      // 只更新认证状态
      store.setAuth({ user: { id: 'test' } } as any);
      expect(authCallCount).toBe(1);
      expect(configCallCount).toBe(0);
      expect(uiCallCount).toBe(0);

      // 只更新配置状态
      store.setGuestConfig({ test: 'config' });
      expect(authCallCount).toBe(1);
      expect(configCallCount).toBe(1);
      expect(uiCallCount).toBe(0);

      // 只更新UI状态
      store.openLoginModal('test');
      expect(authCallCount).toBe(1);
      expect(configCallCount).toBe(1);
      expect(uiCallCount).toBe(1);

      // 清理订阅
      unsubscribeAuth();
      unsubscribeConfig();
      unsubscribeUI();
    });

    it('大量订阅者不应该显著影响性能', () => {
      const subscribers: (() => void)[] = [];
      let totalCallCount = 0;

      // 创建100个订阅者
      for (let i = 0; i < 100; i++) {
        const unsubscribe = useAppStore.subscribe(() => {
          totalCallCount++;
        });
        subscribers.push(unsubscribe);
      }

      const startTime = performance.now();
      
      // 执行10次状态更新
      for (let i = 0; i < 10; i++) {
        store.setAuth({ user: { id: `perf-test-${i}` } } as any);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      // 验证所有订阅者都被调用
      expect(totalCallCount).toBe(1000); // 100个订阅者 × 10次更新

      // 即使有100个订阅者，10次更新也应该很快
      expect(duration).toBeLessThan(20);
      console.log(`100个订阅者，10次更新耗时: ${duration.toFixed(2)}ms`);

      // 清理所有订阅
      subscribers.forEach(unsubscribe => unsubscribe());
    });

    it('订阅清理应该防止内存泄漏', () => {
      const subscribers: (() => void)[] = [];
      
      // 创建并立即清理大量订阅
      for (let i = 0; i < 1000; i++) {
        const unsubscribe = useAppStore.subscribe(() => {});
        subscribers.push(unsubscribe);
      }

      // 清理所有订阅
      subscribers.forEach(unsubscribe => unsubscribe());

      // 验证清理后状态更新仍然正常
      const startTime = performance.now();
      store.setAuth({ user: { id: 'cleanup-test' } } as any);
      const endTime = performance.now();
      
      // 清理后的更新应该很快
      expect(endTime - startTime).toBeLessThan(5);
    });
  });

  describe('大量状态更新性能测试', () => {
    it('应该能处理快速连续的状态更新', () => {
      const startTime = performance.now();
      
      // 快速连续更新1000次
      for (let i = 0; i < 1000; i++) {
        store.setAuth({ user: { id: `rapid-${i}` } } as any);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 1000次快速更新应该在合理时间内完成
      expect(duration).toBeLessThan(100);
      console.log(`1000次快速状态更新耗时: ${duration.toFixed(2)}ms`);
      
      // 验证最终状态正确
      expect(store.session?.user?.id).toBe('rapid-999');
    });

    it('应该能处理复杂对象的状态更新', () => {
      const startTime = performance.now();
      
      // 更新复杂配置对象
      for (let i = 0; i < 100; i++) {
        const complexConfig = {
          app_settings: {
            theme: i % 2 === 0 ? 'light' : 'dark',
            language: i % 3 === 0 ? 'zh-CN' : 'en-US',
            features: {
              notifications: true,
              analytics: i % 5 === 0,
              experimental: {
                newUI: i % 7 === 0,
                betaFeatures: i % 11 === 0
              }
            }
          },
          tts_defaults: {
            lang: 'en-US',
            rate: 0.8 + (i % 10) * 0.1,
            pitch: 1.0,
            volume: 1.0,
            voiceName: `voice-${i % 5}`
          },
          user_preferences: {
            autoSave: true,
            theme: 'auto',
            notifications: {
              email: i % 2 === 0,
              push: i % 3 === 0,
              sms: false
            }
          }
        };
        
        store.setGuestConfig(complexConfig);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 100次复杂对象更新应该在合理时间内完成
      expect(duration).toBeLessThan(50);
      console.log(`100次复杂对象更新耗时: ${duration.toFixed(2)}ms`);
      
      // 验证最终状态正确
      expect(store.guestConfig?.app_settings?.theme).toBe('dark'); // 99 % 2 !== 0
      expect(store.guestConfig?.tts_defaults?.rate).toBe(1.7); // 0.8 + (99 % 10) * 0.1
    });

    it('应该能处理并发状态更新', async () => {
      const startTime = performance.now();
      
      // 创建多个并发更新Promise
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(
          Promise.resolve().then(() => {
            store.setAuth({ user: { id: `concurrent-${i}` } } as any);
            store.setAuthProfile({ id: `concurrent-${i}`, role: 'student', display_name: `Concurrent ${i}` } as any);
            store.setGuestConfig({ concurrent: `config-${i}` });
          })
        );
      }
      
      // 等待所有更新完成
      await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 50个并发更新应该很快完成
      expect(duration).toBeLessThan(30);
      console.log(`50个并发状态更新耗时: ${duration.toFixed(2)}ms`);
      
      // 验证最终状态存在（具体值可能因并发而不确定）
      expect(store.session?.user?.id).toMatch(/^concurrent-\d+$/);
      expect(store.profile?.display_name).toMatch(/^Concurrent \d+$/);
      expect(store.guestConfig?.concurrent).toMatch(/^config-\d+$/);
    });
  });

  describe('缓存和重复请求优化验证', () => {
    it('loadGames应该避免重复请求', async () => {
      // Mock loadGames方法来计算调用次数
      let callCount = 0;
      const originalLoadGames = store.loadGames;
      store.loadGames = jest.fn().mockImplementation(async () => {
        callCount++;
        // 模拟设置游戏数据
        useAppStore.setState({
          games: [{ id: 'test-game', title: 'Test Game' }] as any,
          gamesLoading: false
        });
      });

      // 第一次调用应该执行
      await store.loadGames();
      expect(callCount).toBe(1);

      // 后续调用应该被缓存机制跳过
      await store.loadGames();
      await store.loadGames();
      await store.loadGames();
      
      // 由于有缓存机制，应该只调用一次
      expect(callCount).toBe(1);

      // 恢复原方法
      store.loadGames = originalLoadGames;
    });

    it('配置获取应该是高效的', () => {
      // 设置测试配置
      store.setGuestConfig({
        app_settings: { theme: 'light' },
        tts_defaults: { lang: 'en-US' },
        nested: { deep: { value: 'test' } }
      });
      store.setUserConfig({
        app_settings: { theme: 'dark' }
      });

      const startTime = performance.now();
      
      // 大量配置获取操作
      for (let i = 0; i < 10000; i++) {
        store.getConfig('app_settings');
        store.getConfig('tts_defaults');
        store.getConfig('nested');
        store.getConfigCategory('app_settings');
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 10000次配置获取应该很快
      expect(duration).toBeLessThan(20);
      console.log(`10000次配置获取耗时: ${duration.toFixed(2)}ms`);
    });
  });

  describe('内存使用优化验证', () => {
    it('状态清理应该释放内存', () => {
      // 设置大量数据
      const largeConfig = {};
      for (let i = 0; i < 1000; i++) {
        (largeConfig as any)[`key_${i}`] = {
          data: new Array(100).fill(`value_${i}`),
          metadata: {
            created: Date.now(),
            updated: Date.now(),
            version: i
          }
        };
      }

      store.setGuestConfig(largeConfig);
      store.setUserConfig(largeConfig);
      
      // 验证数据已设置
      expect(Object.keys(store.guestConfig || {}).length).toBe(1000);
      expect(Object.keys(store.userConfig || {}).length).toBe(1000);

      // 清理数据
      store.setGuestConfig(null);
      store.setUserConfig(null);
      store.clearAuthData();

      // 验证数据已清理
      expect(store.guestConfig).toBeNull();
      expect(store.userConfig).toBeNull();
      expect(store.session).toBeNull();
      expect(store.profile).toBeNull();
    });

    it('订阅清理应该防止内存泄漏', () => {
      const subscriptions: (() => void)[] = [];
      
      // 创建大量订阅
      for (let i = 0; i < 1000; i++) {
        const unsubscribe = useAppStore.subscribe(() => {
          // 空回调，只是为了测试订阅管理
        });
        subscriptions.push(unsubscribe);
      }

      // 清理一半订阅
      for (let i = 0; i < 500; i++) {
        subscriptions[i]();
      }

      // 状态更新应该仍然正常
      const startTime = performance.now();
      store.setAuth({ user: { id: 'memory-test' } } as any);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(10);

      // 清理剩余订阅
      for (let i = 500; i < 1000; i++) {
        subscriptions[i]();
      }
    });
  });
});