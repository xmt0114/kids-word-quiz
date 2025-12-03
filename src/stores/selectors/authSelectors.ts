/**
 * 认证相关选择器
 * 
 * 提供便捷的认证状态访问方法
 */

import { AuthSlice } from '../slices/authSlice';

/**
 * 认证选择器集合
 */
export const authSelectors = {
  /**
   * 检查用户是否已登录
   */
  isAuthenticated: (state: AuthSlice) => {
    return state.session !== null && state.profile !== null;
  },

  /**
   * 获取当前用户
   */
  getCurrentUser: (state: AuthSlice) => {
    return state.session?.user || null;
  },

  /**
   * 获取用户资料
   */
  getUserProfile: (state: AuthSlice) => {
    return state.profile;
  },

  /**
   * 检查是否正在加载认证状态
   */
  isAuthLoading: (state: AuthSlice) => {
    return state.authLoading;
  },

  /**
   * 获取用户角色
   */
  getUserRole: (state: AuthSlice) => {
    return state.profile?.role || null;
  },

  /**
   * 检查用户是否已设置密码
   */
  hasPasswordSet: (state: AuthSlice) => {
    return Boolean(state.profile?.has_password_set);
  },

  /**
   * 获取用户显示名称
   */
  getDisplayName: (state: AuthSlice) => {
    return state.profile?.display_name || state.session?.user?.email || '未知用户';
  },

  /**
   * 检查用户是否为管理员
   */
  isAdmin: (state: AuthSlice) => {
    return state.profile?.role === 'admin';
  },

  /**
   * 检查用户是否为教师
   */
  isTeacher: (state: AuthSlice) => {
    return state.profile?.role === 'teacher';
  },
};