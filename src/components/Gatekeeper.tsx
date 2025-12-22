import React, { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore, UserProfile } from '../stores/appStore';
import { BUILTIN_DEFAULTS } from '../lib/config';

/**
 * 守门人（Gatekeeper）组件 - 唯一的状态源
 *
 * 职责：
 * 1. 监听 supabase.auth.onAuthStateChange 事件（唯一监听器）
 * 2. 管理认证状态：user, profile, session
 * 3. 管理应用数据：guestConfig, userSettings, userProgress
 * 4. 单设备登录处理
 */
export function Gatekeeper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log('🚪 [Gatekeeper] Hook 1 - Auth 监听器初始化');

    // Hook 1 - Auth 监听器（同步）
    // 只调用 supabase.auth.onAuthStateChange，回调函数必须是同步的
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // 同步处理认证状态变化
        console.log('🔄 [Gatekeeper] 认证状态变化:', event, session?.user?.id);
        useAppStore.getState().setAuth(session);
      }
    );

    return () => {
      console.log('🚪 [Gatekeeper] 清理认证监听');
      subscription.unsubscribe();
    };
  }, []);

  // Hook 2 - Data 抓取器（异步）
  // 订阅 session 变化，加载数据
  const session = useAppStore(state => state.session);
  const prevSessionId = useRef<string | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    const currentSessionId = session?.user?.id || null;

    // 首次加载时，执行一次数据加载（无论 session 是否为 null）
    if (!isInitialized.current) {
      console.log('🚀 [Gatekeeper] 首次加载，执行数据初始化:', currentSessionId);
      isInitialized.current = true;
      prevSessionId.current = currentSessionId;

      const loadData = async () => {
        try {
          if (session) {
            console.log('👤 [Gatekeeper] 加载用户数据...');
            await useAppStore.getState().loadUserData(session);
            console.log('✅ [Gatekeeper] 用户数据加载完成');
          } else {
            console.log('🚶 [Gatekeeper] 加载游客配置...');
            await useAppStore.getState().loadGuestData();
            console.log('✅ [Gatekeeper] 游客配置加载完成');
          }

          // 加载游戏列表(包含 text_config) - 只在首次加载时执行
          console.log('🎮 [Gatekeeper] 加载游戏列表...');
          await useAppStore.getState().loadGames();
          console.log('✅ [Gatekeeper] 游戏列表加载完成');
        } catch (error) {
          console.error('❌ [Gatekeeper] 数据加载失败:', error);
        }
      };

      loadData();
      return;
    }

    // 非首次加载：如果 session 没变化，不执行
    if (prevSessionId.current === currentSessionId) {
      console.log('⏭️ [Gatekeeper] Session 无变化，跳过数据加载');
      return;
    }

    console.log('🔄 [Gatekeeper] Hook 2 - Data 抓取器检测到 session 变化:', currentSessionId);

    // 更新上一次 session ID
    prevSessionId.current = currentSessionId;

    // 异步数据加载
    const loadData = async () => {
      try {
        if (session) {
          console.log('👤 [Gatekeeper] 加载用户数据...');
          await useAppStore.getState().loadUserData(session);
          console.log('✅ [Gatekeeper] 用户数据加载完成');
        } else {
          console.log('🚶 [Gatekeeper] 加载游客配置...');
          await useAppStore.getState().loadGuestData();
          console.log('✅ [Gatekeeper] 游客配置加载完成');
        }

        // 游戏列表已在首次加载时获取，无需重复加载
      } catch (error) {
        console.error('❌ [Gatekeeper] 数据加载失败:', error);
      }
    };

    loadData();
  }, [session?.user?.id]); // 只依赖 session.user.id 变化

  return <>{children}</>;
}

/**
 * 获取用户资料 - 导出供Store使用
 */
export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  console.log('🔍 [Gatekeeper] 开始获取用户资料, userId:', userId);
  try {
    console.log('📡 [Gatekeeper] 发送请求到 user_profiles 表...');
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    console.log('📨 [Gatekeeper] 收到响应:', { data, error });

    if (error) {
      console.error('❌ [Gatekeeper] 获取用户资料失败:', error);
      return null;
    }

    console.log('✅ [Gatekeeper] 用户资料获取成功:', data);
    return data as UserProfile;
  } catch (error) {
    console.error('❌ [Gatekeeper] 获取用户资料异常:', error);
    return null;
  }
}


/**
 * 拉取用户数据（从数据库）- 导出供Store使用
 * 包括：user_profile, user_settings 和 user_progress
 */
export async function fetchUserData() {
  console.log('📡 [Gatekeeper] 开始拉取用户数据...');

  // 获取当前用户
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('用户未登录');
  }

  // 并行拉取多个数据源
  const [
    profileResult,
  ] = await Promise.all([
    // 1. 获取用户资料和设置
    supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
  ]);

  if (profileResult.error) {
    console.error('❌ [Gatekeeper] 获取用户资料失败:', profileResult.error);
    throw profileResult.error;
  }

  // 直接使用 settings，不要查找 quiz_settings 子字段
  // 数据库中的 settings 字段结构是: { [gameId]: QuizSettings }
  const userSettings = profileResult.data?.settings || {};

  console.log('✅ [Gatekeeper] 用户数据拉取完成:', {
    profile: profileResult.data,
    settings: userSettings,
  });

  return {
    profile: profileResult.data,
    settings: userSettings,
  };
}

/**
 * 拉取游客配置（从 AppConfig）- 导出供Store使用
 * 完整迁移原有的 AppConfigProvider 和 useAppConfig 的逻辑
 */
export async function fetchGuestConfig() {
  console.log('📡 [Gatekeeper] 开始拉取游客配置...');

  try {
    console.log('🔄 [Gatekeeper] 正在从数据库加载配置...');

    // 从 app_config 表获取配置
    const { data, error: fetchError } = await supabase
      .from('app_config')
      .select('key, value');

    if (fetchError) {
      throw fetchError;
    }

    // 内置默认值已移动到 src/lib/config.ts

    let guestConfig: Record<string, any>;
    let dataSource: 'cloud' | 'builtin';

    if (data && data.length > 0) {
      // 转换数据格式：从 [{key, value}] 转换为 {key: value}
      const configMap = data.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, any>);

      // 合并内置默认值（确保所有必需的配置项都存在）
      guestConfig = { ...BUILTIN_DEFAULTS, ...configMap };
      dataSource = 'cloud';

      console.log('✅ [Gatekeeper] 成功从数据库加载配置:', data.length, '项');
      console.log('📊 [Gatekeeper] 配置项:', Object.keys(guestConfig));
    } else {
      // 数据库无配置，使用内置默认值
      console.warn('⚠️ [Gatekeeper] 数据库无配置，使用内置默认值');
      guestConfig = { ...BUILTIN_DEFAULTS };
      dataSource = 'builtin';
    }

    console.log('✅ [Gatekeeper] 游客配置拉取完成 (数据源:', dataSource, '):', guestConfig);

    return guestConfig;
  } catch (err) {
    // 出错时使用内置默认值
    const errorMessage = err instanceof Error ? err.message : '未知错误';
    console.error('❌ [Gatekeeper] 加载配置失败:', errorMessage);
    console.warn('⚠️ [Gatekeeper] 使用内置默认配置');

    return BUILTIN_DEFAULTS;
  }
}
