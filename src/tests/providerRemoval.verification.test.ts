/**
 * Provider移除验证测试
 * 
 * 验证Context代码完全移除和状态访问统一性
 * 对应属性1和属性2的测试
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { useAppStore } from '../stores/appStore';
import * as fs from 'fs';
import * as path from 'path';

describe('Provider移除验证测试', () => {
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
    });
    store = useAppStore.getState();
  });

  describe('属性1: Context代码完全移除', () => {
    it('应该不存在AuthContext的使用', () => {
      // 检查源代码中是否还有AuthContext的引用
      const srcPath = path.join(process.cwd(), 'src');
      const hasAuthContextUsage = checkForPatternInFiles(srcPath, /AuthContext(?!\.Provider)/);
      
      expect(hasAuthContextUsage).toBe(false);
    });

    it('应该不存在AppContext的使用', () => {
      // 检查源代码中是否还有AppContext的引用
      const srcPath = path.join(process.cwd(), 'src');
      const hasAppContextUsage = checkForPatternInFiles(srcPath, /AppContext(?!Provider)/);
      
      expect(hasAppContextUsage).toBe(false);
    });

    it('应该不存在useContext的直接使用', () => {
      // 检查源代码中是否还有useContext的直接使用
      const srcPath = path.join(process.cwd(), 'src');
      const hasUseContextUsage = checkForPatternInFiles(srcPath, /useContext\(/);
      
      expect(hasUseContextUsage).toBe(false);
    });

    it('App.tsx应该不包含AuthProvider', () => {
      const appPath = path.join(process.cwd(), 'src', 'App.tsx');
      if (fs.existsSync(appPath)) {
        const appContent = fs.readFileSync(appPath, 'utf-8');
        expect(appContent).not.toContain('AuthProvider');
        expect(appContent).not.toContain('<AuthProvider>');
      }
    });

    it('App.tsx应该不包含ConfigProvider', () => {
      const appPath = path.join(process.cwd(), 'src', 'App.tsx');
      if (fs.existsSync(appPath)) {
        const appContent = fs.readFileSync(appPath, 'utf-8');
        expect(appContent).not.toContain('ConfigProvider');
        expect(appContent).not.toContain('<ConfigProvider>');
      }
    });
  });

  describe('属性2: 状态访问统一性', () => {
    it('所有认证状态应该通过Zustand store访问', () => {
      // 设置测试数据
      const testSession = { user: { id: 'test-user' } } as any;
      const testProfile = { id: 'test-user', role: 'student', display_name: 'Test User' } as any;

      store.setAuth(testSession);
      store.setAuthProfile(testProfile);

      // 验证状态可以通过store访问
      expect(store.session).toEqual(testSession);
      expect(store.profile).toEqual(testProfile);
      expect(store.authLoading).toBe(false);
    });

    it('所有配置状态应该通过Zustand store访问', () => {
      // 设置测试配置
      const testGuestConfig = { app_settings: { theme: 'light' } };
      const testUserConfig = { app_settings: { theme: 'dark' } };

      store.setGuestConfig(testGuestConfig);
      store.setUserConfig(testUserConfig);

      // 验证配置可以通过store访问
      expect(store.guestConfig).toEqual(testGuestConfig);
      expect(store.userConfig).toEqual(testUserConfig);
      expect(store.getConfig('app_settings')).toEqual({ theme: 'dark' });
    });

    it('所有UI状态应该通过Zustand store访问', () => {
      // 设置UI状态
      store.openLoginModal('测试操作');

      // 验证UI状态可以通过store访问
      expect(store.loginModal.isOpen).toBe(true);
      expect(store.loginModal.action).toBe('测试操作');

      // 关闭模态框
      store.closeLoginModal();
      expect(store.loginModal.isOpen).toBe(false);
    });

    it('状态更新应该是响应式的', () => {
      // 创建状态订阅
      const stateChanges: any[] = [];
      const unsubscribe = useAppStore.subscribe((state) => {
        stateChanges.push({
          session: state.session,
          profile: state.profile,
          guestConfig: state.guestConfig,
          loginModal: state.loginModal
        });
      });

      // 触发状态变化
      store.setAuth({ user: { id: 'test' } } as any);
      store.setAuthProfile({ id: 'test', role: 'student', display_name: 'Test' } as any);
      store.setGuestConfig({ test: 'config' });
      store.openLoginModal('test');

      // 验证状态变化被记录
      expect(stateChanges.length).toBeGreaterThan(0);

      // 清理订阅
      unsubscribe();
    });

    it('状态访问应该是同步的', () => {
      // 设置状态
      const testData = { test: 'value' };
      store.setGuestConfig(testData);

      // 立即访问应该返回最新值
      expect(store.guestConfig).toEqual(testData);
      expect(store.getConfig('test')).toBe('value');
    });

    it('不应该存在状态访问的异步依赖', () => {
      // 验证关键状态访问方法都是同步的
      expect(typeof store.getConfig).toBe('function');
      expect(typeof store.getConfigCategory).toBe('function');
      expect(typeof store.setAuth).toBe('function');
      expect(typeof store.setAuthProfile).toBe('function');
      expect(typeof store.setGuestConfig).toBe('function');
      expect(typeof store.setUserConfig).toBe('function');

      // 这些方法应该立即返回结果，不返回Promise
      const result1 = store.getConfig('test');
      const result2 = store.getConfigCategory('test');
      
      expect(result1).not.toBeInstanceOf(Promise);
      expect(result2).not.toBeInstanceOf(Promise);
    });
  });

  describe('集成验证', () => {
    it('应用应该能够在没有Context的情况下正常初始化', () => {
      // 模拟应用初始化过程
      expect(() => {
        // 设置初始状态
        store.setAuthLoading(true);
        store.setConfigLoading(true);

        // 模拟数据加载
        store.setGuestConfig({ app_settings: { theme: 'light' } });
        store.setConfigLoading(false);

        // 模拟认证完成
        store.setAuth({ user: { id: 'test' } } as any);
        store.setAuthProfile({ id: 'test', role: 'student', display_name: 'Test' } as any);
        store.setAuthLoading(false);

        // 验证状态正确
        expect(store.configLoading).toBe(false);
        expect(store.authLoading).toBe(false);
        expect(store.guestConfig).toBeDefined();
        expect(store.session).toBeDefined();
        expect(store.profile).toBeDefined();
      }).not.toThrow();
    });

    it('状态管理应该是完全独立的', () => {
      // 验证store可以独立工作，不依赖任何Context
      const initialState = store;
      
      // 执行各种状态操作
      store.setAuth({ user: { id: 'test1' } } as any);
      store.setAuthProfile({ id: 'test1', role: 'admin', display_name: 'Admin' } as any);
      store.setGuestConfig({ setting1: 'value1' });
      store.setUserConfig({ setting2: 'value2' });
      store.openLoginModal('test action');

      // 验证所有操作都成功
      expect(store.session?.user?.id).toBe('test1');
      expect(store.profile?.role).toBe('admin');
      expect(store.guestConfig?.setting1).toBe('value1');
      expect(store.userConfig?.setting2).toBe('value2');
      expect(store.loginModal.isOpen).toBe(true);

      // 清理状态
      store.clearAuthData();
      store.setGuestConfig(null);
      store.setUserConfig(null);
      store.closeLoginModal();

      // 验证清理成功
      expect(store.session).toBeNull();
      expect(store.profile).toBeNull();
      expect(store.guestConfig).toBeNull();
      expect(store.userConfig).toBeNull();
      expect(store.loginModal.isOpen).toBe(false);
    });
  });
});

/**
 * 辅助函数：在文件中检查特定模式
 */
function checkForPatternInFiles(dirPath: string, pattern: RegExp): boolean {
  if (!fs.existsSync(dirPath)) {
    return false;
  }

  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // 跳过 node_modules, .git 等目录
      if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') {
        continue;
      }
      
      // 递归检查子目录
      if (checkForPatternInFiles(filePath, pattern)) {
        return true;
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      // 检查 TypeScript 文件
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (pattern.test(content)) {
          console.log(`Found pattern in file: ${filePath}`);
          return true;
        }
      } catch (error) {
        // 忽略读取错误
        console.warn(`Could not read file: ${filePath}`);
      }
    }
  }
  
  return false;
}