import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../Button';
import { Card } from '../Card';
import { Lock, Eye, EyeOff } from 'lucide-react';

export function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    // 检查是否在恢复会话中
    useEffect(() => {
        // Supabase 的 magic link 会自动处理 session，所以这里我们只需要检查是否有 session
        // 或者直接允许用户尝试重置，如果没 session 会报错
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // 如果没有 session，可能是链接失效或直接访问
                // 这里可以不做强制跳转，让用户在提交时发现错误，或者提示链接失效
                // 但为了体验，如果完全没 session，最好提示一下
                // 不过由于 Gatekeeper 可能会干扰，我们先假设流程是正常的
            }
        };
        checkSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

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
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) {
                setError(error.message || '重置密码失败');
            } else {
                setSuccess(true);

                // 更新 user_profiles 中的 has_password_set 标记
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase
                        .from('user_profiles')
                        .update({ has_password_set: true })
                        .eq('id', user.id);
                }

                // 3秒后跳转到登录页或首页
                setTimeout(() => {
                    navigate('/');
                }, 3000);
            }
        } catch (err) {
            setError('重置密码失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 p-sm md:p-lg flex items-center justify-center">
            <div className="max-w-md w-full">
                <div className="text-center mb-lg animate-slide-in-right">
                    <h1 className="text-hero font-bold text-text-primary mb-md">
                        重置密码
                    </h1>
                    <p className="text-h2 text-text-secondary font-semibold">
                        请设置您的新密码
                    </p>
                </div>

                <Card className="p-lg">
                    {success ? (
                        <div className="text-center space-y-md">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-h3 font-bold text-text-primary">密码重置成功</h3>
                            <p className="text-body text-text-secondary">
                                您的密码已更新，正在跳转到首页...
                            </p>
                        </div>
                    ) : (
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
                                    {loading ? '提交中...' : '重置密码'}
                                </Button>
                            </div>
                        </form>
                    )}
                </Card>
            </div>
        </div>
    );
}
