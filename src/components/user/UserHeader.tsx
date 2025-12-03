import { useAuthState } from '../../hooks/useAuth'
import { useAppStore } from '../../stores/appStore'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../Button'
import { LogIn, User, LogOut, Mail, Database } from 'lucide-react'

export function UserHeader() {
  // 直接使用 Zustand store 和 useAuthState
  const { session, profile } = useAppStore();
  const user = session?.user ?? null;
  const { signOut } = useAuthState();
  const { openLoginModal } = useAppStore()
  const navigate = useNavigate()

  // 角色映射函数
  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: '管理员',
      teacher: '教师',
      parent: '家长',
      student: '学生'
    }
    return roleMap[role] || role
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to="/" className="title-font hover:scale-105 transition-transform duration-200">
              语智乐园
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            {user && profile ? (
              // 已登录状态
              <>
                {/* 管理员专用菜单 */}
                {profile.role === 'admin' && (
                  <div className="flex items-center space-x-3 mr-6">
                    <Link to="/admin/data">
                      <button className="header-button header-button-admin flex items-center gap-2">
                        <Database size={16} />
                        数据管理
                      </button>
                    </Link>
                    <Link to="/admin/invite">
                      <button className="header-button header-button-admin flex items-center gap-2">
                        <Mail size={16} />
                        邀请用户
                      </button>
                    </Link>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <User size={18} className="text-purple-500" />
                  <span className="user-info font-semibold">
                    {profile.display_name}
                  </span>
                  <span className="user-role-badge">
                    {getRoleDisplayName(profile.role)}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="header-button header-button-secondary flex items-center gap-2"
                >
                  <LogOut size={16} />
                  登出
                </button>
              </>
            ) : (
              // 未登录状态
              <>
                <button
                  className="header-button header-button-primary flex items-center gap-2"
                  onClick={() => openLoginModal('登录')}
                >
                  <LogIn size={16} />
                  登录
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
