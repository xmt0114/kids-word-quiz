import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

interface UseLoginPromptOptions {
  action?: string; // 登录后要执行的操作描述，如"访问设置"
  redirectTo?: string; // 登录成功后跳转的页面
  onLoginSuccess?: () => void; // 登录成功后的回调
}

/**
 * 通用的登录提示Hook
 * 用于需要登录才能访问的页面，提供弹框登录功能
 * 当用户登录成功后，会自动执行之前pending的回调
 */
export function useLoginPrompt(options: UseLoginPromptOptions = {}) {
  const { user, profile } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    onLoginSuccess?: () => void;
  } | null>(null);
  const prevUserRef = useRef<typeof user>(null);

  const promptLogin = useCallback((onLoginSuccess?: () => void) => {
    // 如果用户已经登录，执行回调
    if (user && profile) {
      onLoginSuccess?.();
      return false; // 表示不需要登录（已登录）
    }

    // 用户未登录，显示登录弹框
    setPendingAction({ onLoginSuccess });
    setIsLoginModalOpen(true);
    return true; // 表示需要登录
  }, [user, profile]);

  const handleCloseModal = useCallback(() => {
    setIsLoginModalOpen(false);
    setPendingAction(null);
  }, []);

  // 监听用户状态变化，登录成功后自动执行pending的回调
  useEffect(() => {
    const prevUser = prevUserRef.current;
    const isLoggingIn = prevUser === null && user !== null;

    if (isLoggingIn && profile && pendingAction) {
      // 用户刚登录，执行pending的回调
      pendingAction.onLoginSuccess?.();
      setPendingAction(null);
    }

    prevUserRef.current = user;
  }, [user, profile, pendingAction]);

  return {
    user,
    profile,
    isLoggedIn: !!(user && profile),
    isLoginModalOpen,
    promptLogin,
    handleCloseModal,
  };
}
