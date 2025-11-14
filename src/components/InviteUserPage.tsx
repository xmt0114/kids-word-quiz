import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, User, Send } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { supabase } from '../lib/supabase';
import { toast, Toaster } from 'sonner';

const InviteUserPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证输入
    if (!email.trim()) {
      toast.error('请输入邮箱地址');
      return;
    }

    if (!displayName.trim()) {
      toast.error('请输入用户昵称');
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('请输入有效的邮箱地址');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-invite-user', {
        body: {
          email: email,
          display_name: displayName
        }
      });

      if (error) {
        console.error('邀请用户失败:', error);
        toast.error(`邀请失败: ${error.message}`);
        return;
      }

      // 成功！
      toast.success('邀请邮件已发送!');
      console.log('邀请成功:', data);

      // 清空表单
      setEmail('');
      setDisplayName('');

    } catch (err) {
      console.error('发生未知错误:', err);
      toast.error('发生未知错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 p-sm md:p-lg">
      <Toaster position="top-center" richColors />
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-md mb-lg">
          <Button
            variant="secondary"
            onClick={() => navigate('/')}
            className="flex items-center gap-sm"
          >
            <ArrowLeft size={20} />
            返回首页
          </Button>
          <div className="flex items-center gap-sm">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <Mail size={24} className="text-white" />
            </div>
            <h1 className="text-h1 font-bold text-text-primary">邀请新用户</h1>
          </div>
        </div>

        {/* 邀请表单 */}
        <Card className="p-xl">
          <div className="mb-lg">
            <h2 className="text-h2 font-bold text-text-primary mb-sm">
              发送邀请邮件
            </h2>
            <p className="text-body text-text-secondary">
              输入要邀请的用户邮箱和昵称，系统将自动发送邀请邮件。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-lg">
            {/* 邮箱输入 */}
            <div>
              <label className="block text-body font-bold text-text-primary mb-sm">
                邮箱地址 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none">
                  <Mail size={20} className="text-text-tertiary" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入用户邮箱地址"
                  className="w-full pl-xl pr-md py-md border-2 border-gray-200 rounded-lg text-body font-bold text-text-primary focus:border-blue-500 focus:outline-none"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* 昵称输入 */}
            <div>
              <label className="block text-body font-bold text-text-primary mb-sm">
                用户昵称 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none">
                  <User size={20} className="text-text-tertiary" />
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="请输入用户显示名称"
                  className="w-full pl-xl pr-md py-md border-2 border-gray-200 rounded-lg text-body font-bold text-text-primary focus:border-blue-500 focus:outline-none"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* 提示信息 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-md">
              <h4 className="font-bold text-blue-800 mb-xs">温馨提示：</h4>
              <ul className="text-small text-blue-700 space-y-xs">
                <li>• 被邀请的用户将收到一封包含注册链接的邮件</li>
                <li>• 邀请链接24小时内有效</li>
                <li>• 每个邮箱地址只能被邀请一次</li>
              </ul>
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-end gap-md pt-md border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/')}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !email.trim() || !displayName.trim()}
                className="flex items-center gap-sm"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    发送中...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    发送邀请
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>

        {/* 底部说明 */}
        <div className="mt-lg text-center">
          <p className="text-small text-text-tertiary">
            只有管理员才能访问此页面
          </p>
        </div>
      </div>
    </div>
  );
};

export { InviteUserPage };
