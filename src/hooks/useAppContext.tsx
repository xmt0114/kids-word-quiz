import React, { createContext, useContext, ReactNode } from 'react';
import { useAppConfig, AppConfig } from './useAppConfig';

interface AppContextType {
  config: AppConfig;
  loading: boolean;
  error: string | null;
  dataSource: 'cloud' | 'builtin' | null;
  getConfig: (key: string) => any;
  getConfigCategory: (key: string) => string;
  refreshConfig: () => void;
}

// 创建 Context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider 组件
interface AppContextProviderProps {
  children: ReactNode;
}

export function AppContextProvider({ children }: AppContextProviderProps) {
  const appConfigData = useAppConfig();

  return (
    <AppContext.Provider value={appConfigData}>
      {children}
    </AppContext.Provider>
  );
}

// 自定义 Hook，用于使用 AppContext
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
}
