import React, { useState } from 'react';
import { X, CreditCard, Loader2 } from 'lucide-react';
import { MembershipRenewalModalProps } from '../types';
import { MembershipService } from '../utils/membershipService';
import { Button } from './Button';

/**
 * 续费模态框组件
 * 
 * 提供激活码输入界面，处理续费操作
 * 包含输入验证、加载状态和错误处理
 */
export function MembershipRenewalModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: MembershipRenewalModalProps) {
  const [activationCode, setActivationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 重置表单状态
  const resetForm = () => {
    setActivationCode('');
    setError('');
    setLoading(false);
  };

  // 关闭模态框
  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  // 处理激活码输入
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setActivationCode(value);
    
    // 清除之前的错误信息
    if (error) {
      setError('');
    }
  };

  // 处理续费提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading) return;

    // 客户端验证
    if (!activationCode.trim()) {
      setError('请输入激活码');
      return;
    }

    if (!MembershipService.validateActivationCode(activationCode)) {
      setError('激活码格式无效，请检查后重试');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await MembershipService.renewMembership(activationCode);
      
      if (result.success) {
        // 续费成功
        onSuccess(result.newExpiryDate || '');
        resetForm();
        onClose();
      } else {
        // 续费失败
        setError(result.message);
      }
    } catch (error) {
      console.error('续费过程中发生错误:', error);
      setError('续费过程中发生未知错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="renewal-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="renewal-modal-content bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <CreditCard className="text-purple-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">
              续费会员
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* 内容 */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              请输入您的激活码来续费会员服务。激活码通常由6-32位字母数字组成。
            </p>
            
            <label htmlFor="activationCode" className="block text-sm font-medium text-gray-700 mb-2">
              激活码
            </label>
            <input
              id="activationCode"
              type="text"
              value={activationCode}
              onChange={handleInputChange}
              disabled={loading}
              placeholder="请输入激活码"
              className="activation-code-input w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              autoComplete="off"
            />
            
            {/* 错误信息 */}
            {error && (
              <p className="mt-2 text-sm text-red-600">
                {error}
              </p>
            )}
          </div>

          {/* 按钮组 */}
          <div className="flex space-x-3">
            <Button
              type="button"
              onClick={handleClose}
              disabled={loading}
              variant="secondary"
              className="flex-1"
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={loading || !activationCode.trim()}
              variant="primary"
              className="flex-1 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="loading-spinner" />
                  <span>处理中...</span>
                </>
              ) : (
                <span>确认续费</span>
              )}
            </Button>
          </div>
        </form>

        {/* 提示信息 */}
        <div className="px-6 pb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-xs text-blue-700">
              💡 提示：激活码区分大小写，请确保输入正确。如有问题请联系客服。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MembershipRenewalModal;