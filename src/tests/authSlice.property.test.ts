/**
 * **Feature: context-to-zustand-migration, Property 8: 认证状态访问直接性**
 * **Validates: Requirements 5.1**
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import fc from 'fast-check';
import { create } from 'zustand';

import { createAuthSlice, AuthSlice, UserProfile } from '../stores/slices/authSlice';

// 创建测试用的 store
const createTestStore = () => {
  return create<AuthSlice>((set, get) => ({
    ...createAuthSlice(set, get)
  }));
};

// 生成器：创建用户角色
const userRoleArb = fc.oneof(
  fc.constant('admin'),
  fc.constant('teacher'),
  fc.constant('parent'),
  fc.constant('student')
);

// 生成器：创建用户资料
const userProfileArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  role: userRoleArb,
  display_name: fc.string({ minLength: 1, maxLength: 100 }),
  avatar_url: fc.option(fc.webUrl()),
  settings: fc.option(fc.object()),
  has_password_set: fc.option(fc.boolean())
});

// 生成器：创建会话对象（简化版）
const sessionArb = fc.record({
  user: fc.record({
    id: fc.string({ minLength: 1, maxLength: 50 }),
    email: fc.emailAddress()
  }),
  access_token: fc.string({ minLength: 10, maxLength: 100 })
});

describe('AuthSlice Property Tests', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('Property 8: 认证状态访问直接性', () => {
    it('对于任何认证状态需求，组件应该直接从Zustand store获取而非通过Provider包装', () => {
      fc.assert(
        fc.property(
          sessionArb,
          userProfileArb,
          fc.boolean(),
          (session, profile, loading) => {
            // 测试会话状态管理
            store.getState().setAuth(session as any);
            expect(store.getState().session).toEqual(session);
            expect(store.getState().authLoading).toBe(false);

            // 测试用户资料状态管理
            store.getState().setAuthProfile(profile as UserProfile);
            expect(store.getState().profile).toEqual(profile);

            // 测试加载状态管理
            store.getState().setAuthLoading(loading);
            expect(store.getState().authLoading).toBe(loading);

            // 测试清理认证数据
            store.getState().clearAuthData();
            expect(store.getState().session).toBeNull();
            expect(store.getState().profile).toBeNull();
            expect(store.getState().authLoading).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('认证状态应该独立管理，不依赖外部Provider', () => {
      fc.assert(
        fc.property(sessionArb, (session) => {
          // 设置认证状态
          store.getState().setAuth(session as any);
          
          // 状态应该直接可访问
          expect(store.getState().session).toBeDefined();
          expect(store.getState().session?.user?.id).toBe(session.user.id);
          expect(store.getState().authLoading).toBe(false);

          // 清理状态
          store.getState().setAuth(null);
          expect(store.getState().session).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('用户资料状态应该正确管理', () => {
      fc.assert(
        fc.property(userProfileArb, (profile) => {
          // 设置用户资料
          store.getState().setAuthProfile(profile as UserProfile);
          
          // 资料应该正确存储
          expect(store.getState().profile).toEqual(profile);
          expect(store.getState().profile?.id).toBe(profile.id);
          expect(store.getState().profile?.role).toBe(profile.role);

          // 清理资料
          store.getState().setAuthProfile(null);
          expect(store.getState().profile).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('密码设置检查应该基于用户资料状态', () => {
      fc.assert(
        fc.property(
          sessionArb,
          userProfileArb,
          (session, profile) => {
            // 设置会话和用户资料
            store.getState().setAuth(session as any);
            store.getState().setAuthProfile(profile as UserProfile);

            // 检查密码设置状态（同步版本用于测试）
            const state = store.getState();
            const hasPasswordSet = Boolean(state.profile?.has_password_set);
            
            // 结果应该基于用户资料中的 has_password_set 字段
            if (profile.has_password_set !== undefined) {
              expect(hasPasswordSet).toBe(Boolean(profile.has_password_set));
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('加载状态应该正确管理', () => {
      fc.assert(
        fc.property(fc.boolean(), (loading) => {
          // 设置加载状态
          store.getState().setAuthLoading(loading);
          
          // 状态应该正确反映
          expect(store.getState().authLoading).toBe(loading);
        }),
        { numRuns: 100 }
      );
    });

    it('清理认证数据应该重置所有认证相关状态', () => {
      fc.assert(
        fc.property(
          sessionArb,
          userProfileArb,
          (session, profile) => {
            // 设置认证状态
            store.getState().setAuth(session as any);
            store.getState().setAuthProfile(profile as UserProfile);
            store.getState().setAuthLoading(true);

            // 确认状态已设置
            expect(store.getState().session).not.toBeNull();
            expect(store.getState().profile).not.toBeNull();

            // 清理认证数据
            store.getState().clearAuthData();

            // 所有认证状态应该被重置
            expect(store.getState().session).toBeNull();
            expect(store.getState().profile).toBeNull();
            expect(store.getState().authLoading).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});