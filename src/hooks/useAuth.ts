import { User, Session } from '@supabase/supabase-js'
import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../stores/appStore'

interface UserProfile {
  id: string
  role: 'admin' | 'teacher' | 'parent' | 'student'
  display_name: string
  avatar_url?: string
  settings?: any // JSONB 格式，可存储用户偏好，如 preferred_textbook_id
  has_password_set?: boolean // 是否已设置密码
}

export interface RegisterFormData {
  email: string
  password: string
  displayName: string
  inviteCode: string
}

interface AuthResult {
  success: boolean
  error?: string
}

// useAuth 现在直接使用 useAuthState，不再需要 Context
export function useAuth() {
  return useAuthState();
}

export function useAuthState() {
  // 从 Zustand Store 读取认证状态（由 Gatekeeper 管理）
  const {
    session,
    profile: authProfile,
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
    if (error.includes('Email not confirmed')) {
      return '请先验证您的邮箱后再登录'
    }
    if (error.includes('Password should be at least')) {
      return '密码至少需要6个字符'
    }
    if (error.includes('Unable to validate email address')) {
      return '邮箱格式不正确，请检查后重试'
    }
    return error
  }

  // 登录
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
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

  // 注册
  const signUp = async (formData: RegisterFormData): Promise<AuthResult> => {
    try {
      console.log('📝 [useAuth] 开始用户注册:', { email: formData.email, displayName: formData.displayName })

      // 调用 user-signup Edge Function
      const { data, error } = await supabase.functions.invoke('user-signup', {
        body: {
          email: formData.email,
          password: formData.password,
          display_name: formData.displayName,
          invite_code: formData.inviteCode
        }
      })

      console.log('📝 [useAuth] Edge Function 响应:', { 
        data, 
        error, 
        dataType: typeof data,
        errorType: typeof error,
        errorContext: error?.context 
      })

      // 处理 Edge Function 错误
      if (error) {
        console.error('❌ [useAuth] 注册失败 - Edge Function 错误:', error)
        
        // 尝试从 Response 对象中读取错误信息
        if (error.context && error.context instanceof Response) {
          try {
            // 克隆 Response 对象以避免重复读取
            const response = error.context.clone()
            const responseText = await response.text()
            console.log('📝 [useAuth] Response 内容:', responseText)
            
            try {
              const responseJson = JSON.parse(responseText)
              if (responseJson.error) {
                return { success: false, error: responseJson.error }
              } else if (responseJson.message) {
                return { success: false, error: responseJson.message }
              }
            } catch (jsonError) {
              // 如果不是 JSON，直接使用文本内容
              if (responseText.trim()) {
                return { success: false, error: responseText }
              }
            }
          } catch (readError) {
            console.error('❌ [useAuth] 读取 Response 失败:', readError)
          }
        }
        
        // 备用错误处理逻辑
        let errorMessage = '注册失败，请检查输入信息'
        
        // 1. 检查 data 中的错误信息
        if (data && typeof data === 'object') {
          if (data.error) {
            errorMessage = data.error
          } else if (data.message) {
            errorMessage = data.message
          }
        }
        // 2. 如果 data 是字符串
        else if (typeof data === 'string' && data.trim()) {
          try {
            const parsedData = JSON.parse(data)
            if (parsedData.error) {
              errorMessage = parsedData.error
            } else {
              errorMessage = data
            }
          } catch (e) {
            errorMessage = data
          }
        }
        // 3. 检查其他 error 属性
        else if (error.message && !error.message.includes('non-2xx status code') && !error.message.includes('FunctionsHttpError')) {
          errorMessage = error.message
        }
        
        return { success: false, error: errorMessage }
      }

      // 检查响应数据中的错误
      if (data && data.error) {
        console.error('❌ [useAuth] 注册失败 - 服务器错误:', data.error)
        return { success: false, error: data.error }
      }

      console.log('✅ [useAuth] 注册成功')
      return { success: true }
    } catch (error) {
      console.error('❌ [useAuth] 注册异常:', error)
      return { success: false, error: '注册失败，请重试' }
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
      console.log('🔄 [useAuth.updateUserSettings] 更新用户设置:', { userId: authUser.id, updates })

      // 获取当前用户资料
      const { data: currentProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('settings')
        .eq('id', authUser.id)
        .single()

      if (fetchError) {
        console.error('❌ [useAuth.updateUserSettings] 获取用户资料失败:', fetchError)
        return { success: false, error: fetchError.message }
      }

      console.log('📖 [useAuth.updateUserSettings] 当前数据库设置:', currentProfile.settings);

      // 深度合并设置
      const updatedSettings = {
        ...(currentProfile.settings || {}),
        ...updates
      }

      console.log('💾 [useAuth.updateUserSettings] 合并后的设置:', updatedSettings);

      const { data, error } = await supabase
        .from('user_profiles')
        .update({ settings: updatedSettings })
        .eq('id', authUser.id)
        .select()
        .single()

      if (error) {
        console.error('❌ [useAuth.updateUserSettings] 更新用户设置失败:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ [useAuth.updateUserSettings] 数据库更新成功:', data.settings)
      setAuthProfile(data as UserProfile)

      // 同步更新 Zustand store 中的 userSettings
      const { useAppStore } = await import('../stores/appStore')
      console.log('🔄 [useAuth.updateUserSettings] 准备同步 Zustand store...');
      useAppStore.getState().updateSettings(updatedSettings)
      console.log('✅ [useAuth.updateUserSettings] Zustand store 已同步更新')

      return { success: true }
    } catch (error) {
      console.error('❌ [useAuth.updateUserSettings] 更新失败:', error)
      return { success: false, error: '更新用户设置失败' }
    }
  }

  // 检查用户是否已设置密码
  const checkPasswordSet = useCallback(async (): Promise<boolean> => {
    if (!authUser || !authProfile) {
      return false;
    }

    try {
      // 从 authProfile 中直接读取 has_password_set 字段
      const hasPasswordSet = Boolean(authProfile.has_password_set);
      console.log('🔍 [useAuth] 密码检查结果:', {
        userId: authUser.id,
        email: authUser.email,
        has_password_set: hasPasswordSet
      });

      return hasPasswordSet;
    } catch (error) {
      console.error('检查密码设置失败:', error);
      return false;
    }
  }, [authUser, authProfile]);

  // 设置密码
  const setPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!authUser) {
      return { success: false, error: '用户未登录' };
    }

    try {
      console.log('🔐 [useAuth] 开始设置用户密码...');

      // 步骤 1: 更新 Supabase Auth 的密码
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (authError) {
        console.error('❌ [useAuth] 设置密码失败:', authError);
        return { success: false, error: authError.message };
      }

      console.log('✅ [useAuth] Supabase Auth 密码设置成功');

      // 步骤 2: 更新 user_profiles 表中的 has_password_set 字段
      const { error: dbError } = await supabase
        .from('user_profiles')
        .update({ has_password_set: true })
        .eq('id', authUser.id);

      if (dbError) {
        console.error('❌ [useAuth] 更新 has_password_set 失败:', dbError);
        // 即使数据库更新失败，密码也已设置成功，只记录错误日志
      } else {
        console.log('✅ [useAuth] has_password_set 更新成功');
      }

      return { success: true };
    } catch (error) {
      console.error('❌ [useAuth] 设置密码异常:', error);
      return { success: false, error: '设置密码失败，请重试' };
    }
  };

  return {
    user: authUser,
    profile: authProfile,
    session,
    loading: authLoading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    updatePreferredTextbook,
    updateUserSettings,
    setPassword,
    checkPasswordSet,
    setAuthProfile
  }
}
