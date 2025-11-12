import React, { useEffect } from 'react';
import { AppContextProvider, useAppContext } from '../hooks/useAppContext';

console.log('🚀 [ConfigProvider] 组件开始渲染');

function ConfigContent({ children }: { children: React.ReactNode }) {
  const { config, loading, error, dataSource } = useAppContext();

  // 在应用启动时打印配置加载信息
  useEffect(() => {
    console.log('🔄 [ConfigProvider] useAppConfig状态变化:', { loading, error, dataSource });

    if (!loading) {
      if (error) {
        console.error('❌ [ConfigProvider] 配置加载失败:', error);
      } else if (dataSource === 'cloud') {
        console.log('✅ [ConfigProvider] 从数据库加载配置成功');
        console.log('📊 [ConfigProvider] 配置项:', Object.keys(config));
        console.log('🔧 [ConfigProvider] 当前配置:', config);
      } else {
        console.log('⚠️ [ConfigProvider] 使用内置默认配置');
      }
    }
  }, [loading, error, dataSource, config]);

  // 可以在这里添加加载状态显示
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载配置中...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  return (
    <AppContextProvider>
      <ConfigContent>{children}</ConfigContent>
    </AppContextProvider>
  );
}
