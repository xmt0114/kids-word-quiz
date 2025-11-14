import { useAuth } from '../../hooks/useAuth'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../Button'
import { LogIn, User, LogOut, Mail, Database } from 'lucide-react'

export function UserHeader() {
  const { user, profile, signOut } = useAuth()
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-lg font-semibold text-gray-900">
              儿童单词测验
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user && profile ? (
              // 已登录状态
              <>
                {/* 管理员专用菜单 */}
                {profile.role === 'admin' && (
                  <div className="flex items-center space-x-2 mr-4">
                    <Link to="/guess-word/data">
                      <Button
                        variant="secondary"
                        className="flex items-center gap-1 !py-2 !px-3 text-xs"
                      >
                        <Database size={14} />
                        数据管理
                      </Button>
                    </Link>
                    <Link to="/guess-word/invite">
                      <Button
                        variant="secondary"
                        className="flex items-center gap-1 !py-2 !px-3 text-xs"
                      >
                        <Mail size={14} />
                        邀请用户
                      </Button>
                    </Link>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <User size={16} className="text-gray-600" />
                  <span className="text-sm text-gray-700">
                    {profile.display_name}
                  </span>
                  <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                    {getRoleDisplayName(profile.role)}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  onClick={handleSignOut}
                  className="flex items-center gap-2 !py-2 !px-4"
                >
                  <LogOut size={16} />
                  登出
                </Button>
              </>
            ) : (
              // 未登录状态
              <>
                <Link to="/login">
                  <Button
                    variant="secondary"
                    className="flex items-center gap-2 !py-2 !px-4"
                  >
                    <LogIn size={16} />
                    登录
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
