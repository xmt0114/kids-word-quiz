/**
 * **Feature: context-to-zustand-migration, Property 9: UI状态管理集中性**
 * **Validates: Requirements 6.1, 6.2, 6.3**
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import fc from 'fast-check';
import { create } from 'zustand';
import { createUISlice, UISlice } from '../stores/slices/uiSlice';

// 创建测试用的 store
const createTestStore = () => {
  return create<UISlice>((set, get) => ({
    ...createUISlice(set, get)
  }));
};

// 生成器：创建通知类型
const notificationTypeArb = fc.oneof(
  fc.constant('success'),
  fc.constant('error'),
  fc.constant('warning'),
  fc.constant('info')
);

// 生成器：创建通知对象
const notificationArb = fc.record({
  type: notificationTypeArb,
  message: fc.string({ minLength: 1, maxLength: 100 }),
  duration: fc.option(fc.integer({ min: 100, max: 10000 }))
});

// 生成器：创建模态框动作文本
const modalActionArb = fc.oneof(
  fc.constant('登录'),
  fc.constant('开始游戏'),
  fc.constant('保存设置'),
  fc.string({ minLength: 1, maxLength: 20 })
);

// 生成器：创建密码设置模式
const passwordModeArb = fc.oneof(
  fc.constant('setup'),
  fc.constant('reset')
);

describe('UISlice Property Tests', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('Property 9: UI状态管理集中性', () => {
    it('对于任何全局UI状态（模态框、加载、通知），应该通过UI slice管理', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          modalActionArb,
          passwordModeArb,
          fc.string(),
          (loginOpen, action, passwordMode, loadingMessage) => {
            // 测试登录模态框状态管理
            if (loginOpen) {
              store.getState().openLoginModal(action);
              expect(store.getState().loginModal.isOpen).toBe(true);
              expect(store.getState().loginModal.action).toBe(action);
            } else {
              store.getState().closeLoginModal();
              expect(store.getState().loginModal.isOpen).toBe(false);
            }

            // 测试密码设置模态框状态管理
            store.getState().openPasswordSetupModal(passwordMode);
            expect(store.getState().passwordSetupModal.isOpen).toBe(true);
            expect(store.getState().passwordSetupModal.mode).toBe(passwordMode);

            store.getState().closePasswordSetupModal();
            expect(store.getState().passwordSetupModal.isOpen).toBe(false);

            // 测试全局加载状态管理
            store.getState().setGlobalLoading(true, loadingMessage);
            expect(store.getState().globalLoading).toBe(true);
            expect(store.getState().loadingMessage).toBe(loadingMessage);

            store.getState().setGlobalLoading(false);
            expect(store.getState().globalLoading).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('通知系统应该正确管理通知的添加和移除', () => {
      fc.assert(
        fc.property(notificationArb, (notification) => {
          // 初始状态应该没有通知
          const initialCount = store.getState().notifications.length;

          // 添加通知
          store.getState().addNotification(notification);
          
          // 通知数量应该增加
          const afterAddCount = store.getState().notifications.length;
          expect(afterAddCount).toBe(initialCount + 1);

          // 最新添加的通知应该包含正确的信息
          const addedNotification = store.getState().notifications[afterAddCount - 1];
          expect(addedNotification.type).toBe(notification.type);
          expect(addedNotification.message).toBe(notification.message);
          expect(addedNotification.duration).toBe(notification.duration);
          expect(addedNotification.id).toBeDefined();

          // 移除通知
          store.getState().removeNotification(addedNotification.id);
          
          // 通知数量应该减少
          const afterRemoveCount = store.getState().notifications.length;
          expect(afterRemoveCount).toBe(initialCount);
        }),
        { numRuns: 100 }
      );
    });

    it('清除所有通知应该移除所有现有通知', () => {
      fc.assert(
        fc.property(fc.array(notificationArb, { minLength: 1, maxLength: 5 }), (notifications) => {
          // 添加多个通知
          notifications.forEach(notification => {
            store.getState().addNotification(notification);
          });

          // 确认通知已添加
          expect(store.getState().notifications.length).toBeGreaterThan(0);

          // 清除所有通知
          store.getState().clearAllNotifications();

          // 应该没有通知了
          expect(store.getState().notifications.length).toBe(0);
        }),
        { numRuns: 50 }
      );
    });

    it('模态框状态应该独立管理，不相互影响', () => {
      fc.assert(
        fc.property(
          modalActionArb,
          passwordModeArb,
          (action, passwordMode) => {
            // 打开登录模态框
            store.getState().openLoginModal(action);
            expect(store.getState().loginModal.isOpen).toBe(true);
            
            // 打开密码设置模态框不应该影响登录模态框
            store.getState().openPasswordSetupModal(passwordMode);
            expect(store.getState().loginModal.isOpen).toBe(true);
            expect(store.getState().passwordSetupModal.isOpen).toBe(true);

            // 关闭登录模态框不应该影响密码设置模态框
            store.getState().closeLoginModal();
            expect(store.getState().loginModal.isOpen).toBe(false);
            expect(store.getState().passwordSetupModal.isOpen).toBe(true);

            // 关闭密码设置模态框
            store.getState().closePasswordSetupModal();
            expect(store.getState().passwordSetupModal.isOpen).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('全局加载状态应该正确管理加载消息', () => {
      fc.assert(
        fc.property(fc.string(), (message) => {
          // 设置加载状态和消息
          store.getState().setGlobalLoading(true, message);
          expect(store.getState().globalLoading).toBe(true);
          expect(store.getState().loadingMessage).toBe(message);

          // 关闭加载状态
          store.getState().setGlobalLoading(false);
          expect(store.getState().globalLoading).toBe(false);
          // 消息可能保留或清空，这取决于实现
        }),
        { numRuns: 100 }
      );
    });
  });
});