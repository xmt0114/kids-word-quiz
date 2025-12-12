import { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

// 用户资料接口
export interface UserProfile {
  id: string;
  role: 'admin' | 'teacher' | 'parent' | 'student';
  display_name: string;
  avatar_url?: string;
  settings?: any; // JSONB 格式，可存储用户偏好
  has_password_set?: boolean; // 是否已设置密码
  membership_expires_at?: string | null; // 会员到期时间戳
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
  refreshUserProfile: () => Promise<void>; // 刷新用户资料（包括会员信息）
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

  /**
   * 刷新用户资料（包括会员信息）
   */
  refreshUserProfile: async (): Promise<void> => {
    const state = get();
    if (!state.session?.user) {
      console.warn('🔍 [AuthSlice] 无法刷新用户资料：用户未登录');
      return;
    }

    try {
      console.log('🔄 [AuthSlice] 开始刷新用户资料...');
      
      // 从数据库获取最新的用户资料
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', state.session.user.id)
        .single();

      if (error) {
        console.error('❌ [AuthSlice] 刷新用户资料失败:', error);
        throw error;
      }

      if (profile) {
        // 转换数据库字段到前端格式
        const updatedProfile: UserProfile = {
          id: profile.id,
          role: profile.role,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          settings: profile.settings,
          has_password_set: profile.has_password_set,
          membership_expires_at: profile.membership_expires_at
        };

        // 更新状态
        set({ profile: updatedProfile });
        console.log('✅ [AuthSlice] 用户资料刷新成功:', {
          userId: updatedProfile.id,
          membershipExpiresAt: updatedProfile.membership_expires_at
        });
      } else {
        console.warn('⚠️ [AuthSlice] 未找到用户资料');
      }
    } catch (error) {
      console.error('❌ [AuthSlice] 刷新用户资料过程中发生错误:', error);
      throw error;
    }
  },
});