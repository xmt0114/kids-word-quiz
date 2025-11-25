import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthProvider';
import { Gatekeeper } from './components/Gatekeeper';
import { SetPasswordModal } from './components/SetPasswordModal';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './components/auth/LoginPage';
import { HomePage } from './components/HomePage';
import { GuessWordSettingsPage } from './components/GuessWordSettingsPage';
import { GuessWordGamePage } from './components/GuessWordGamePage';
import { GuessWordResultPage } from './components/GuessWordResultPage';
import { DataManagementPage } from './components/DataManagementPage';
import { InviteUserPage } from './components/InviteUserPage';
import { TextbookSelectionPage } from './components/TextbookSelectionPage';
import { UserHeader } from './components/user/UserHeader';
import { GameSettingsPage } from './components/GameSettingsPage';
import { UniversalGamePage } from './components/UniversalGamePage';

// 数据管理页面路由保护 - 仅管理员可访问
const ProtectedDataManagement = () => {
  const { user, profile, loading } = useAuth();

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
  const { user, profile, loading } = useAuth();

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
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);
  const { user, profile, loading, checkPasswordSet } = useAuth();

  // 检查用户是否需要设置密码或重置密码
  useEffect(() => {
    const checkPassword = async () => {
      // 检查 URL 是否包含重置密码参数
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const type = urlParams.get('type');

      if (token && type === 'recovery') {
        console.log('🔑 [App] 检测到密码重置请求');
        setNeedsPasswordReset(true);
        setCheckingPassword(false);
        return;
      }

      // 普通密码设置检查
      if (!loading && user && profile) {
        setCheckingPassword(true);
        try {
          const hasPassword = await checkPasswordSet();
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
    };

    checkPassword();
  }, [user, profile, loading, checkPasswordSet]);

  // 处理密码设置成功的回调
  const handlePasswordSetupSuccess = () => {
    console.log('✅ [App] 密码设置成功，关闭弹框');
    setNeedsPasswordSetup(false);
  };

  // 处理密码重置成功的回调
  const handlePasswordResetSuccess = () => {
    console.log('✅ [App] 密码重置成功，关闭弹框');
    setNeedsPasswordReset(false);
    // 重置成功后清理 URL 参数
    window.history.replaceState({}, '', window.location.pathname);
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
          <Route path="/" element={<HomePage />} />
          <Route path="/guess-word/settings" element={<GuessWordSettingsPage />} />
          <Route path="/guess-word/game" element={<GuessWordGamePage />} />
          <Route path="/guess-word/result" element={<GuessWordResultPage />} />
          <Route path="/guess-word/data" element={<ProtectedDataManagement />} />
          <Route path="/guess-word/invite" element={<ProtectedInviteUser />} />
          <Route path="/textbook-selection" element={<TextbookSelectionPage />} />
          <Route path="/games/:gameId/settings" element={<GameSettingsPage />} />
          <Route path="/games/:gameId/play" element={<UniversalGamePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* 密码设置弹框 */}
        <SetPasswordModal
          isOpen={needsPasswordSetup}
          onSuccess={handlePasswordSetupSuccess}
          mode="setup"
        />

        {/* 密码重置弹框 */}
        <SetPasswordModal
          isOpen={needsPasswordReset}
          onSuccess={handlePasswordResetSuccess}
          mode="reset"
        />
      </div>
    </Router>
  );
}

// 根组件
function App() {
  return (
    <AuthProvider>
      <Gatekeeper>
        <AppContent />
      </Gatekeeper>
    </AuthProvider>
  );
}

export default App;
