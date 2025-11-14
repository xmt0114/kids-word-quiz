import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthProvider';
import { Gatekeeper } from './components/Gatekeeper';
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

function App() {
  return (
    <AuthProvider>
      {/* 守门人：数据加载的唯一触发器 */}
      <Gatekeeper>
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </Gatekeeper>
    </AuthProvider>
  );
}

export default App;
