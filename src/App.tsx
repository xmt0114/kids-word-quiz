import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// AuthProvider 已移除，直接使用 Zustand store
import { Gatekeeper } from './components/Gatekeeper';
import { cleanupLegacyQuizStats, debugStorageUsage } from './utils/storageCleanup';
import { SetPasswordModal } from './components/SetPasswordModal';
import { useAuthState } from './hooks/useAuth';
import { LoginPage } from './components/auth/LoginPage';
import { HomePage } from './components/HomePage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';

import { DataManagementPage } from './components/DataManagementPage';
import { InviteUserPage } from './components/InviteUserPage';
import { TextbookSelectionPage } from './components/TextbookSelectionPage';
import { UserHeader } from './components/user/UserHeader';
import { GameSettingsPage } from './components/GameSettingsPage';
import { UniversalGamePage } from './components/UniversalGamePage';
import { UniversalResultPage } from './components/UniversalResultPage';
import { LoginModal } from './components/auth/LoginModal';
import { RegisterModal } from './components/auth/RegisterModal';
import { useAppStore } from './stores/appStore';

// 数据管理页面路由保护 - 仅管理员可访问
const ProtectedDataManagement = () => {
  const { session, profile, authLoading: loading } = useAppStore();
  const user = session?.user ?? null;

  // 如果正在加载认证状态，显示加载指示器
  if (loading) {
    return <div>Loading...</div>;
  }

  // 如果未登录，重定向到首页
  if (!user || !profile) {
    return <Navigate to="/" replace />;
  }

  // 如果不是管理员，重定向到首页
  if (profile.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // 是管理员，允许访问
  return <DataManagementPage />;
};

// 邀请用户页面路由保护 - 仅管理员可访问
const ProtectedInviteUser = () => {
  const { session, profile, authLoading: loading } = useAppStore();
  const user = session?.user ?? null;

  // 如果正在加载认证状态，显示加载指示器
  if (loading) {
    return <div>Loading...</div>;
  }

  // 如果未登录，重定向到首页
  if (!user || !profile) {
    return <Navigate to="/" replace />;
  }

  // 如果不是管理员，重定向到首页
  if (profile.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // 是管理员，允许访问
  return <InviteUserPage />;
};

// 内部应用组件（在 AuthProvider 内部，在 Gatekeeper 外部）
function AppContent() {
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const [checkingPassword, setCheckingPassword] = useState(true);
  // const [needsPasswordReset, setNeedsPasswordReset] = useState(false); // 已移除：使用 ResetPasswordPage 替代
  // 直接使用 Zustand store 替代 useAuth
  const { session, profile, authLoading: loading } = useAppStore();
  const user = session?.user ?? null;

  const {
    loginModal,
    closeLoginModal,
    registerModal,
    closeRegisterModal,
    openLoginModal,
    openRegisterModal
  } = useAppStore();

  // 检查用户是否需要设置密码或重置密码
  useEffect(() => {
    // 检查 URL 是否包含重置密码参数
    // 检查 URL 是否包含重置密码参数
    // 注意：新的重置密码流程使用 /reset-password 页面，不再使用模态框
    // const urlParams = new URLSearchParams(window.location.search);
    // const token = urlParams.get('token');
    // const type = urlParams.get('type');
    //
    // if (token && type === 'recovery') {
    //   console.log('🔑 [App] 检测到密码重置请求');
    //   setNeedsPasswordReset(true);
    //   setCheckingPassword(false);
    //   return;
    // }

    // 普通密码设置检查
    if (!loading && user && profile) {
      setCheckingPassword(true);
      try {
        // 直接从 profile 中读取 has_password_set 字段，避免函数依赖导致的无限重渲染
        const hasPassword = Boolean(profile.has_password_set);
        console.log('🔐 [App] 密码检查结果:', hasPassword);
        setNeedsPasswordSetup(!hasPassword);
      } catch (error) {
        console.error('检查密码失败:', error);
        // 如果检查失败，暂时允许访问
        setNeedsPasswordSetup(false);
      } finally {
        setCheckingPassword(false);
      }
    } else if (!loading) {
      setCheckingPassword(false);
    }
  }, [user, profile, loading]);

  // 处理密码设置成功的回调
  const handlePasswordSetupSuccess = () => {
    console.log('✅ [App] 密码设置成功，关闭弹框');
    setNeedsPasswordSetup(false);
  };

  // 已移除：handlePasswordResetSuccess

  // 处理登录注册模态框切换
  const handleSwitchToRegister = () => {
    closeLoginModal();
    openRegisterModal();
  };

  const handleSwitchToLogin = () => {
    closeRegisterModal();
    openLoginModal();
  };

  // 如果正在加载认证或检查密码，显示加载状态
  if (loading || checkingPassword) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-md"></div>
          <p className="text-body text-text-secondary">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <UserHeader />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/admin/data" element={<ProtectedDataManagement />} />
          <Route path="/admin/invite" element={<ProtectedInviteUser />} />
          <Route path="/textbook-selection" element={<TextbookSelectionPage />} />
          <Route path="/games/:gameId/settings" element={<GameSettingsPage />} />
          <Route path="/games/:gameId/play" element={<UniversalGamePage />} />
          <Route path="/games/:gameId/result" element={<UniversalResultPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* 密码设置弹框 */}
        <SetPasswordModal
          isOpen={needsPasswordSetup}
          onSuccess={handlePasswordSetupSuccess}
          mode="setup"
        />

        {/* 密码重置弹框 - 已移除，使用 ResetPasswordPage */}
        {/* <SetPasswordModal
          isOpen={needsPasswordReset}
          onSuccess={handlePasswordResetSuccess}
          mode="reset"
        /> */}

        {/* 全局登录弹框 */}
        <LoginModal
          isOpen={loginModal.isOpen}
          onClose={closeLoginModal}
          action={loginModal.action}
          onSwitchToRegister={handleSwitchToRegister}
        />

        {/* 全局注册弹框 */}
        <RegisterModal
          isOpen={registerModal.isOpen}
          onClose={closeRegisterModal}
          onSwitchToLogin={handleSwitchToLogin}
        />
      </div>
    </Router>
  );
}

// 根组件
function App() {
  // 应用启动时清理旧的localStorage数据
  useEffect(() => {
    cleanupLegacyQuizStats();
    debugStorageUsage();
  }, []);

  return (
    <Gatekeeper>
      <AppContent />
    </Gatekeeper>
  );
}

export default App;
