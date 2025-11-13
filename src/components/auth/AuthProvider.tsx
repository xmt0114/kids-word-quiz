import { ReactNode } from 'react'
import { AuthContext, useAuthState } from '../../hooks/useAuth'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  // 获取完整的认证状态和方法（由 useAuthState 提供）
  // useAuthState 内部从 Zustand Store 读取状态
  const authContextValue = useAuthState();

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  )
}
