import { useState } from 'react'
import { useAuthState } from '../../hooks/useAuth'
import { useAppStore } from '../../stores/appStore'
import { Link, useNavigate } from 'react-router-dom'

import { LogIn, User, LogOut, Mail, Database } from 'lucide-react'
import { MembershipStatusIcon } from '../MembershipStatusIcon'
import { UserDropdownMenu } from '../UserDropdownMenu'
import { MembershipRenewalModal } from '../MembershipRenewalModal'
import { MembershipService } from '../../utils/membershipService'
import { SoundToggle } from '../SoundToggle'

export function UserHeader() {
  // 直接使用 Zustand store 和 useAuthState
  const { session, profile, refreshUserProfile } = useAppStore();
  const user = session?.user ?? null;
  const { signOut } = useAuthState();
  const { openLoginModal } = useAppStore()
  const navigate = useNavigate()

  // 会员功能状态
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false)

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

  // 计算会员状态
  const membershipInfo = profile
    ? MembershipService.getMembershipInfo(profile.membership_expires_at)
    : { status: 'expired' as const, isExpired: true }

  // 处理用户信息点击
  const handleUserInfoClick = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  // 处理续费按钮点击
  const handleRenewalClick = () => {
    setIsRenewalModalOpen(true)
  }

  // 处理续费成功
  const handleRenewalSuccess = async () => {
    const { addNotification } = useAppStore.getState();

    try {
      // 刷新用户资料以获取最新的会员信息
      await refreshUserProfile();

      // 显示成功消息
      addNotification({
        type: 'success',
        message: '续费成功！您的会员已延长。'
      });
    } catch (error) {
      console.error('刷新用户信息失败:', error);
      // 即使刷新失败，也显示成功消息，因为续费本身是成功的
      addNotification({
        type: 'success',
        message: '续费成功！您的会员已延长。'
      });
    }
  }

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="font-title text-[1.5rem] sm:text-[2rem] lg:text-[2.25rem] font-bold bg-gradient-to-r from-[#ff6b6b] via-[#4ecdc4] to-[#feca57] animate-title-slow bg-clip-text text-transparent tracking-widest drop-shadow-sm hover:scale-105 transition-transform duration-200"
            >
              语智乐园
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            <SoundToggle />
            {user && profile ? (
              // 已登录状态
              <>
                {/* 管理员专用菜单 */}
                {profile.role === 'admin' && (
                  <div className="flex items-center space-x-3 mr-6">
                    <Link to="/admin/data">
                      <button className="font-chinese text-[0.9rem] font-medium px-4 py-2 rounded-[1rem] transition-all duration-200 ease-in-out border-2 border-[#fed6e3] bg-gradient-to-br from-brand-mint-start to-brand-mint-end text-[#2d3748] shadow-[0_4px_15px_rgba(254,214,227,0.4)] hover:-translate-y-0.5 flex items-center gap-2">
                        <Database size={16} />
                        数据管理
                      </button>
                    </Link>
                    <Link to="/admin/invite">
                      <button className="font-chinese text-[0.9rem] font-medium px-4 py-2 rounded-[1rem] transition-all duration-200 ease-in-out border-2 border-[#fed6e3] bg-gradient-to-br from-brand-mint-start to-brand-mint-end text-[#2d3748] shadow-[0_4px_15px_rgba(254,214,227,0.4)] hover:-translate-y-0.5 flex items-center gap-2">
                        <Mail size={16} />
                        邀请用户
                      </button>
                    </Link>
                  </div>
                )}

                <div className="relative">
                  <div
                    className="flex items-center space-x-3 cursor-pointer px-3 py-2 transition-all duration-200 ease-in-out rounded-lg relative hover:bg-gray-100/80 hover:-translate-y-0.5 active:translate-y-0"
                    onClick={handleUserInfoClick}
                  >
                    <MembershipStatusIcon
                      status={membershipInfo.status}
                    />
                    <span className="font-chinese text-[0.9rem] text-[#4a5568] font-semibold">
                      {profile.display_name}
                    </span>
                    <span className="font-chinese text-[0.75rem] bg-gradient-to-br from-brand-purple-start to-brand-purple-end text-white px-3 py-1 rounded-[1rem] font-medium">
                      {getRoleDisplayName(profile.role)}
                    </span>
                  </div>

                  {/* 用户下拉菜单 */}
                  <UserDropdownMenu
                    user={profile}
                    membershipInfo={membershipInfo}
                    isOpen={isDropdownOpen}
                    onClose={() => setIsDropdownOpen(false)}
                    onRenewal={handleRenewalClick}
                  />
                </div>
                <button
                  onClick={handleSignOut}
                  className="font-chinese text-[0.9rem] font-medium px-4 py-2 rounded-[1rem] transition-all duration-200 ease-in-out border-2 border-[#fcb69f] bg-gradient-to-br from-brand-peach-start to-brand-peach-end text-[#8b4513] hover:bg-gradient-to-br hover:from-brand-peach-end hover:to-brand-peach-start hover:shadow-[0_4px_15px_rgba(252,182,159,0.4)] hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <LogOut size={16} />
                  登出
                </button>
              </>
            ) : (
              // 未登录状态
              <>
                <button
                  className="font-chinese text-[0.9rem] font-medium px-4 py-2 rounded-[1rem] transition-all duration-200 ease-in-out border-2 border-transparent bg-gradient-to-br from-brand-purple-start to-brand-purple-end text-white shadow-[0_4px_15px_rgba(102,126,234,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(102,126,234,0.4)] flex items-center gap-2"
                  onClick={() => openLoginModal('登录')}
                >
                  <LogIn size={16} />
                  登录
                </button>
                <button
                  className="font-chinese text-[0.9rem] font-medium px-4 py-2 rounded-[1rem] transition-all duration-200 ease-in-out border-2 border-[#fcb69f] bg-gradient-to-br from-brand-peach-start to-brand-peach-end text-[#8b4513] hover:bg-gradient-to-br hover:from-brand-peach-end hover:to-brand-peach-start hover:shadow-[0_4px_15px_rgba(252,182,159,0.4)] hover:-translate-y-0.5 flex items-center gap-2"
                  onClick={() => useAppStore.getState().openRegisterModal()}
                >
                  <User size={16} />
                  注册
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 续费模态框 */}
      <MembershipRenewalModal
        isOpen={isRenewalModalOpen}
        onClose={() => setIsRenewalModalOpen(false)}
        onSuccess={handleRenewalSuccess}
      />
    </header>
  )
}
