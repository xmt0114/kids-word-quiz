import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { openLoginModal } = useAppStore();

  useEffect(() => {
    // 打开登录弹框
    openLoginModal('登录');
    // 重定向到首页
    navigate('/', { replace: true });
  }, [navigate, openLoginModal]);

  return null; // 或者返回一个加载指示器
};
