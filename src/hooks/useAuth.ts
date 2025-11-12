import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

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
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

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

  // 获取用户资料
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        return null
      }

      return data as UserProfile
    } catch (error) {
      throw error
    }
  }

  // 初始化时检查会话
  useEffect(() => {
    // 获取当前会话
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const userProfile = await fetchProfile(session.user.id)
          setProfile(userProfile)
        } else {
          setProfile(null)
        }
      } catch (err) {
        // Silent fail
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        // 异步处理profile获取
        if (session?.user) {
          fetchProfile(session.user.id)
            .then(userProfile => {
              setProfile(userProfile)
              setLoading(false)
            })
            .catch(() => {
              setProfile(null)
              setLoading(false)
            })
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

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
    await supabase.auth.signOut()
  }

  // 更新用户资料
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      return { success: false, error: '未登录' }
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      setProfile(data as UserProfile)
      return { success: true }
    } catch (error) {
      console.error('Update profile error:', error)
      return { success: false, error: '更新资料失败' }
    }
  }

  // 更新用户教材偏好 - 使用settings字段存储
  const updatePreferredTextbook = async (textbookId: string) => {
    if (!user) {
      return { success: false, error: '未登录' }
    }

    try {
      console.log('🔄 [useAuth] 更新用户教材偏好:', { userId: user.id, textbookId })

      // 获取当前用户资料
      const { data: currentProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('settings')
        .eq('id', user.id)
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
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        console.error('❌ [useAuth] 更新教材偏好失败:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ [useAuth] 教材偏好更新成功:', data)
      setProfile(data as UserProfile)
      return { success: true }
    } catch (error) {
      console.error('❌ [useAuth] 更新教材偏好失败:', error)
      return { success: false, error: '更新教材偏好失败' }
    }
  }

  return {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    updatePreferredTextbook
  }
}
