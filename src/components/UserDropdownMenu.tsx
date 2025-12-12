import { useRef, useEffect } from 'react';
import { UserProfile } from '../stores/slices/authSlice';
import { MembershipInfo } from '../types';
import { MembershipService } from '../utils/membershipService';
import { User, Crown, UserX } from 'lucide-react';

interface UserDropdownMenuProps {
  user: UserProfile;
  membershipInfo: MembershipInfo;
  onRenewal?: () => void;
  onClose?: () => void;
  isOpen: boolean;
}

/**
 * 用户下拉菜单组件
 * 
 * 显示用户详细信息，包括昵称、身份、会员状态和到期时间
 * 根据会员状态条件显示续费按钮
 */
export function UserDropdownMenu({ 
  user, 
  membershipInfo, 
  onRenewal, 
  onClose, 
  isOpen 
}: UserDropdownMenuProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 角色映射函数
  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: '管理员',
      teacher: '教师',
      parent: '家长',
      student: '学生'
    };
    return roleMap[role] || role;
  };

  // 点击外部区域关闭菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      ref={dropdownRef}
      className="user-dropdown-menu absolute right-0 top-full mt-2 w-80 bg-white rounded-lg border border-gray-200 z-50 overflow-hidden"
    >
      {/* 用户基本信息 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3 mb-3">
          <div className="flex-shrink-0">
            <User size={20} className="text-purple-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user.display_name}
            </p>
            <p className="text-xs text-gray-500">
              {getRoleDisplayName(user.role)}
            </p>
          </div>
        </div>
      </div>

      {/* 会员状态信息 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3 mb-2">
          <div className="flex-shrink-0">
            {membershipInfo.status === 'active' ? (
              <Crown size={18} className="text-yellow-500" />
            ) : (
              <UserX size={18} className="text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              会员状态
            </p>
            <p className={`text-xs ${
              membershipInfo.status === 'active' 
                ? 'text-yellow-600' 
                : 'text-gray-500'
            }`}>
              {MembershipService.getStatusDisplayText(membershipInfo)}
            </p>
          </div>
        </div>



        {/* 剩余天数提示 */}
        {membershipInfo.status === 'active' && membershipInfo.daysRemaining !== undefined && (
          <div className={`mt-2 p-2 rounded-md ${
            membershipInfo.daysRemaining <= 7 
              ? 'membership-warning expiry-warning' 
              : 'membership-success'
          }`}>
            <p className={`text-xs font-medium ${
              membershipInfo.daysRemaining <= 7 
                ? 'text-orange-800' 
                : 'text-green-800'
            }`}>
              {membershipInfo.daysRemaining <= 7 
                ? `⚠️ 即将到期，还有 ${membershipInfo.daysRemaining} 天`
                : `✅ 会员有效，还有 ${membershipInfo.daysRemaining} 天`
              }
            </p>
          </div>
        )}
      </div>

      {/* 续费按钮 */}
      {MembershipService.shouldShowRenewalButton(membershipInfo) && (
        <div className="p-4">
          <button
            onClick={() => {
              onRenewal?.();
              onClose?.();
            }}
            className="renewal-button w-full text-white py-2 px-4 rounded-md text-sm font-medium"
          >
            续费会员
          </button>
        </div>
      )}
    </div>
  );
}

export default UserDropdownMenu;