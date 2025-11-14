import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from './Button';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface SetPasswordModalProps {
  isOpen: boolean;
}

export function SetPasswordModal({ isOpen }: SetPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setPassword: updatePassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 密码验证
    if (password.length < 6) {
      setError('密码至少需要6个字符');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);

    try {
      const result = await updatePassword(password);

      if (result.success) {
        // 密码设置成功，清空表单
        setPassword('');
        setConfirmPassword('');
        setError('');
        alert('密码设置成功！您现在可以使用邮箱和密码登录了。');
      } else {
        setError(result.error || '设置密码失败');
      }
    } catch (err) {
      setError('设置密码失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-sm md:p-lg z-[100]">
      <div className="bg-white rounded-lg p-lg max-w-md w-full animate-scale-in">
        <div className="flex items-center justify-center mb-lg">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Lock size={32} className="text-blue-600" />
          </div>
        </div>

        <div className="text-center mb-lg">
          <h3 className="text-h3 font-bold text-text-primary mb-sm">
            设置登录密码
          </h3>
          <p className="text-body text-text-secondary">
            您好！您需要设置一个登录密码，以便下次能够正常登录。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-lg">
          {error && (
            <div className="rounded-sm bg-red-50 p-md text-center">
              <p className="text-small text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-md">
            <div>
              <label htmlFor="password" className="block text-body font-semibold text-text-primary mb-sm">
                新密码
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="w-full px-md py-md pr-md rounded-sm border-2 border-gray-200 text-body text-text-primary focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="请输入新密码（至少6位）"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-body font-semibold text-text-primary mb-sm">
                确认密码
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                className="w-full px-md py-md rounded-sm border-2 border-gray-200 text-body text-text-primary focus:outline-none focus:border-primary-500 transition-colors"
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-md">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !password || !confirmPassword}
            >
              {loading ? '设置中...' : '设置密码'}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-small text-text-tertiary">
              设置密码后，您将可以使用邮箱和密码登录系统
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
