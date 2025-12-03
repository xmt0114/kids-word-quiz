import { Session } from '@supabase/supabase-js';

// 用户资料接口
export interface UserProfile {
  id: string;
  role: 'admin' | 'teacher' | 'parent' | 'student';
  display_name: string;
  avatar_url?: string;
  settings?: any; // JSONB 格式，可存储用户偏好
  has_password_set?: boolean; // 是否已设置密码
}

/**
 * 认证状态管理 Slice 接口
 * 
 * 职责：
 * - 从现有appStore中提取认证相关逻辑
 * - 简化认证状态管理
 * - 移除对AuthProvider的依赖
 */
export interface AuthSlice {
  // 状态
  authLoading: boolean;
  session: Session | null;
  profile: UserProfile | null;
  
  // Actions
  setAuth: (session: Session | null) => void;
  setAuthProfile: (profile: UserProfile | null) => void;
  setAuthLoading: (loading: boolean) => void;
  
  // 业务方法
  loadUserData: (session: Session) => Promise<void>;
  clearAuthData: () => void;
  checkPasswordSet: () => Promise<boolean>;
}

/**
 * 创建认证状态管理 Slice
 * 
 * 从现有appStore中提取认证相关逻辑到独立slice
 */
export const createAuthSlice = (
  set: any,
  get: any
): AuthSlice => ({
  // 初始状态
  authLoading: true, // 认证加载默认 true
  session: null,
  profile: null,

  // 基础 Actions
  setAuth: (session: Session | null) => {
    console.log('🔑 [AuthSlice] 设置认证状态:', session?.user?.id);
    set({ session, authLoading: false });
  },

  setAuthProfile: (profile: UserProfile | null) => {
    console.log('👤 [AuthSlice] 设置用户资料:', profile?.id);
    set({ profile });
  },

  setAuthLoading: (loading: boolean) => {
    set({ authLoading: loading });
  },

  // 业务方法

  /**
   * 加载用户数据（占位符实现，实际实现将在集成时完成）
   */
  loadUserData: async (session: Session) => {
    console.log('👤 [AuthSlice] 开始加载用户数据...');
    try {
      set({ authLoading: true });

      // 占位符实现 - 实际实现将在集成时完成
      // 这里只是设置加载状态
      console.log('✅ [AuthSlice] 用户数据加载完成');
      set({ authLoading: false });
    } catch (error) {
      console.error('❌ [AuthSlice] 用户数据加载失败:', error);
      set({ authLoading: false });
    }
  },

  /**
   * 清理认证数据（登出时调用）
   */
  clearAuthData: () => {
    console.log('🧹 [AuthSlice] 清除认证数据...');
    set({
      session: null,
      profile: null,
      authLoading: false,
    });
    console.log('✅ [AuthSlice] 认证数据清理完成');
  },

  /**
   * 检查用户是否已设置密码
   */
  checkPasswordSet: async (): Promise<boolean> => {
    const state = get();
    if (!state.session?.user || !state.profile) {
      return false;
    }

    try {
      // 从 profile 中直接读取 has_password_set 字段
      const hasPasswordSet = Boolean(state.profile.has_password_set);
      console.log('🔍 [AuthSlice] 密码检查结果:', {
        userId: state.session.user.id,
        email: state.session.user.email,
        has_password_set: hasPasswordSet
      });

      return hasPasswordSet;
    } catch (error) {
      console.error('❌ [AuthSlice] 检查密码设置失败:', error);
      return false;
    }
  },
});