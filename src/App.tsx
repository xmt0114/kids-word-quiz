import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { GuessWordSettingsPage } from './components/GuessWordSettingsPage';
import { GuessWordGamePage } from './components/GuessWordGamePage';
import { GuessWordResultPage } from './components/GuessWordResultPage';
import { DataManagementPage } from './components/DataManagementPage';
import { TextbookSelectionPage } from './components/TextbookSelectionPage';

// 数据管理页面路由保护 - 仅在开发环境可用
const ProtectedDataManagement = () => {
  if (import.meta.env.DEV) {
    return <DataManagementPage />;
  }
  // 生产环境下重定向到首页
  return <Navigate to="/" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/guess-word/settings" element={<GuessWordSettingsPage />} />
        <Route path="/guess-word/game" element={<GuessWordGamePage />} />
        <Route path="/guess-word/result" element={<GuessWordResultPage />} />
        <Route path="/guess-word/data" element={<ProtectedDataManagement />} />
        <Route path="/textbook-selection" element={<TextbookSelectionPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
