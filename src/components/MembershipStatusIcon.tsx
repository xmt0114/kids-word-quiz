import { MembershipStatusIconProps } from '../types';

/**
 * 会员状态徽章组件
 * 
 * 根据会员状态显示不同的徽章：
 * - active: 金色实心VIP徽章
 * - expired/unknown: 灰色实心VIP徽章
 */
export function MembershipStatusIcon({ status, className = '' }: MembershipStatusIconProps) {
  const baseClasses = 'membership-status-icon inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white rounded shadow-sm';
  
  switch (status) {
    case 'active':
      return (
        <div 
          className={`${baseClasses} bg-gradient-to-r from-yellow-400 to-yellow-600 vip-badge-pulse ${className}`}
          title="VIP会员"
        >
          VIP
        </div>
      );
    
    case 'expired':
    case 'unknown':
    default:
      return (
        <div 
          className={`${baseClasses} bg-gray-500 ${className}`}
          title="会员已过期"
        >
          VIP
        </div>
      );
  }
}

export default MembershipStatusIcon;