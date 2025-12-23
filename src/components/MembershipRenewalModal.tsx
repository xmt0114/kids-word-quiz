import React, { useState } from 'react';
import { X, CreditCard, Loader2, Zap } from 'lucide-react';
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

  // Placeholder for handleActivate, assuming it's similar to handleSubmit
  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    // Re-using handleSubmit logic for now, as the instruction implies a rename/refactor
    await handleSubmit(e);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-[modalFadeIn_0.3s_ease-out]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-[modalSlideUp_0.3s_ease-out] relative">
        {/* 顶部装饰条 */}
        <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500" />
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
              onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
              placeholder="请输入 12 位激活码"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all duration-200 tracking-[0.05em] font-mono text-center text-lg md:text-xl"
              maxLength={12}
              disabled={loading}
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
            <button
              onClick={handleActivate}
              disabled={loading || activationCode.length < 5}
              className="w-full text-white py-3 px-4 rounded-lg font-bold text-lg shadow-lg transition-all duration-300 ease-in-out relative overflow-hidden bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(139,92,246,0.3)] disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none before:content-[''] before:absolute before:top-0 before:left-[-100%] before:w-full before:height-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:transition-[left] before:duration-500 hover:enabled:before:left-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Zap size={20} />
              )}
              {loading ? '正在激活...' : '立即激活会员'}
            </button>
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