import { createContext, useContext } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../stores/appStore'

interface UserProfile {
  id: string
  role: 'admin' | 'teacher' | 'parent' | 'student'
  display_name: string
  avatar_url?: string
  settings?: any // JSONB 格式，可存储用户偏好，如 preferred_textbook_id
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>
  updatePreferredTextbook: (textbookId: string) => Promise<{ success: boolean; error?: string }>
  updateUserSettings: (updates: any) => Promise<{ success: boolean; error?: string }>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function useAuthState() {
  // 从 Zustand Store 读取认证状态（由 Gatekeeper 管理）
  const {
    session,
    authProfile,
    authLoading,
    setAuthProfile
  } = useAppStore();

  // 从 session 中提取 user
  const authUser = session?.user ?? null;

  // 将技术错误转换为用户友好的中文提示
  const getFriendlyError = (error: string) => {
    if (error.includes('Invalid login credentials')) {
      return '邮箱或密码错误，请检查后重试'
    }
    if (error.includes('User already registered')) {
      return '该邮箱已被注册，请直接登录'
    }
    if (error.includes('Email not confirmed')) {
      return '请先验证您的邮箱后再登录'
    }
    if (error.includes('Password should be at least')) {
      return '密码至少需要6个字符'
    }
    if (error.includes('Unable to validate email address')) {
      return '邮箱格式不正确，请检查后重试'
    }
    if (error.includes('Signup is disabled')) {
      return '注册功能暂时关闭，请联系管理员'
    }
    return error
  }

  // 注册
  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })

      if (error) {
        return { success: false, error: getFriendlyError(error.message) }
      }

      // 如果注册成功且有用户信息，创建用户资料
      if (data.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            role: 'student', // 默认角色
            display_name: displayName,
            settings: {}
          })

        if (profileError) {
          return { success: false, error: '该邮箱已被注册，请直接登录' }
        }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: '注册失败，请重试' }
    }
  }

  // 登录
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { success: false, error: getFriendlyError(error.message) }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: '登录失败，请重试' }
    }
  }

  // 登出
  const signOut = async () => {
    console.log('🚪 [useAuth] 用户登出，清理本地数据...');
    // **关键修复**：登出时直接清理本地用户数据
    // 确保在 Supabase 清理 session 之前，先清理本地状态
    useAppStore.getState().clearAllData();
    await supabase.auth.signOut();
    console.log('✅ [useAuth] 登出完成');
  }

  // 更新用户资料
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!authUser) {
      return { success: false, error: '未登录' }
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', authUser.id)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      setAuthProfile(data as UserProfile)
      return { success: true }
    } catch (error) {
      console.error('Update profile error:', error)
      return { success: false, error: '更新资料失败' }
    }
  }

  // 更新用户教材偏好 - 使用settings字段存储
  const updatePreferredTextbook = async (textbookId: string) => {
    if (!authUser) {
      return { success: false, error: '未登录' }
    }

    try {
      console.log('🔄 [useAuth] 更新用户教材偏好:', { userId: authUser.id, textbookId })

      // 获取当前用户资料
      const { data: currentProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('settings')
        .eq('id', authUser.id)
        .single()

      if (fetchError) {
        console.error('❌ [useAuth] 获取用户资料失败:', fetchError)
        return { success: false, error: fetchError.message }
      }

      // 更新 settings 字段，添加 preferred_textbook_id
      const updatedSettings = {
        ...(currentProfile.settings || {}),
        preferred_textbook_id: textbookId
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update({ settings: updatedSettings })
        .eq('id', authUser.id)
        .select()
        .single()

      if (error) {
        console.error('❌ [useAuth] 更新教材偏好失败:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ [useAuth] 教材偏好更新成功:', data)
      setAuthProfile(data as UserProfile)
      return { success: true }
    } catch (error) {
      console.error('❌ [useAuth] 更新教材偏好失败:', error)
      return { success: false, error: '更新教材偏好失败' }
    }
  }

  // 更新用户设置 - 通用方法
  const updateUserSettings = async (updates: any) => {
    if (!authUser) {
      return { success: false, error: '未登录' }
    }

    try {
      console.log('🔄 [useAuth] 更新用户设置:', { userId: authUser.id, updates })

      // 获取当前用户资料
      const { data: currentProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('settings')
        .eq('id', authUser.id)
        .single()

      if (fetchError) {
        console.error('❌ [useAuth] 获取用户资料失败:', fetchError)
        return { success: false, error: fetchError.message }
      }

      // 深度合并设置
      const updatedSettings = {
        ...(currentProfile.settings || {}),
        ...updates
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update({ settings: updatedSettings })
        .eq('id', authUser.id)
        .select()
        .single()

      if (error) {
        console.error('❌ [useAuth] 更新用户设置失败:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ [useAuth] 用户设置更新成功:', data)
      setAuthProfile(data as UserProfile)
      return { success: true }
    } catch (error) {
      console.error('❌ [useAuth] 更新用户设置失败:', error)
      return { success: false, error: '更新用户设置失败' }
    }
  }

  return {
    user: authUser,
    profile: authProfile,
    session,
    loading: authLoading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    updatePreferredTextbook,
    updateUserSettings
  }
}
