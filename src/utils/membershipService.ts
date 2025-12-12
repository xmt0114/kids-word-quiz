import { supabase } from '../lib/supabase';
import { MembershipInfo, RenewalResponse } from '../types';

/**
 * 会员状态管理服务
 * 
 * 提供会员状态计算、格式化和续费等功能
 */
export class MembershipService {
  /**
   * 计算会员状态信息
   * 使用UTC时间进行比较，避免时区问题
   * @param membershipExpiresAt 会员到期时间戳
   * @returns 会员状态信息
   */
  static getMembershipInfo(membershipExpiresAt?: string | null): MembershipInfo {
    // null或undefined视为过期
    if (!membershipExpiresAt) {
      return {
        status: 'expired',
        isExpired: true
      };
    }

    const expiryDate = new Date(membershipExpiresAt);
    const now = new Date();

    // 无效日期视为未知状态
    if (isNaN(expiryDate.getTime())) {
      return {
        status: 'unknown',
        isExpired: true
      };
    }

    // 使用UTC日期进行比较，只比较日期部分
    const expiryUTCDate = new Date(Date.UTC(
      expiryDate.getUTCFullYear(),
      expiryDate.getUTCMonth(),
      expiryDate.getUTCDate()
    ));
    
    const nowUTCDate = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    ));

    const isExpired = expiryUTCDate < nowUTCDate;
    const daysRemaining = isExpired ? 0 : Math.ceil((expiryUTCDate.getTime() - nowUTCDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      status: isExpired ? 'expired' : 'active',
      expiresAt: expiryDate,
      isExpired,
      daysRemaining
    };
  }

  /**
   * 格式化到期时间显示（仅显示日期，不包含时分秒）
   * 使用UTC时间避免时区问题
   * @param expiresAt 到期时间
   * @returns 格式化的日期字符串
   */
  static formatExpiryDate(expiresAt: Date): string {
    const year = expiresAt.getUTCFullYear();
    const month = String(expiresAt.getUTCMonth() + 1).padStart(2, '0');
    const day = String(expiresAt.getUTCDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }

  /**
   * 验证激活码格式
   * @param code 激活码
   * @returns 是否有效
   */
  static validateActivationCode(code: string): boolean {
    // 基本格式验证：非空且长度合理
    if (!code || typeof code !== 'string') {
      return false;
    }

    // 去除首尾空格
    const trimmedCode = code.trim();
    
    // 检查长度（假设激活码长度在6-32字符之间）
    if (trimmedCode.length < 6 || trimmedCode.length > 32) {
      return false;
    }

    // 检查是否只包含字母数字和连字符
    const validPattern = /^[A-Za-z0-9\-]+$/;
    return validPattern.test(trimmedCode);
  }

  /**
   * 续费操作
   * @param code 激活码
   * @returns 续费结果
   */
  static async renewMembership(code: string): Promise<RenewalResponse> {
    try {
      // 客户端验证激活码格式
      if (!this.validateActivationCode(code)) {
        return {
          success: false,
          message: '激活码格式无效，请检查后重试'
        };
      }

      // 调用Supabase RPC函数进行续费
      const { data, error } = await supabase.rpc('redeem_membership', {
        invite_code: code.trim()
      });

      if (error) {
        console.error('续费失败:', error);
        return {
          success: false,
          message: `续费失败: ${error.message}`
        };
      }

      // 假设成功时返回新的到期时间
      return {
        success: true,
        message: '续费成功！您的会员已延长。',
        newExpiryDate: data?.new_expiry_date
      };
    } catch (error) {
      console.error('续费过程中发生错误:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '续费过程中发生未知错误'
      };
    }
  }

  /**
   * 获取会员状态显示文本
   * @param membershipInfo 会员信息
   * @returns 状态显示文本
   */
  static getStatusDisplayText(membershipInfo: MembershipInfo): string {
    switch (membershipInfo.status) {
      case 'active':
        if (membershipInfo.daysRemaining !== undefined) {
          if (membershipInfo.daysRemaining <= 7) {
            return `即将到期 (${membershipInfo.daysRemaining}天)`;
          }
          return `有效期至 ${membershipInfo.expiresAt ? this.formatExpiryDate(membershipInfo.expiresAt) : ''}`;
        }
        return '会员有效';
      case 'expired':
        return '会员已过期';
      case 'unknown':
        return '状态未知';
      default:
        return '状态未知';
    }
  }

  /**
   * 检查是否需要显示续费按钮
   * @param membershipInfo 会员信息
   * @returns 是否显示续费按钮
   */
  static shouldShowRenewalButton(membershipInfo: MembershipInfo): boolean {
    return membershipInfo.isExpired;
  }
}