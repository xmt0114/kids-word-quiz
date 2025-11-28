import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../Button';
import { Card } from '../Card';
import { ArrowLeft } from 'lucide-react';

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [cooldown, setCooldown] = useState(0);

    // 倒计时效果
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (cooldown > 0) {
            return;
        }

        setLoading(true);

        try {
            // 直接发送重置密码邮件
            // Supabase 会处理用户是否存在的情况（出于安全考虑，即使邮箱不存在通常也会返回成功，防止枚举攻击）
            // 且非登录态下无法查询 user_profiles 表 (RLS)
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                setError(error.message || '发送重置邮件失败');
            } else {
                setSuccess(true);
                setCooldown(60); // 设置60秒冷却时间
            }
        } catch (err) {
            setError('发送重置邮件失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 p-sm md:p-lg flex items-center justify-center">
            <div className="max-w-md w-full">
                <div className="text-center mb-lg animate-slide-in-right">
                    <h1 className="text-hero font-bold text-text-primary mb-md">
                        忘记密码？
                    </h1>
                    <p className="text-h2 text-text-secondary font-semibold">
                        输入您的邮箱以重置密码
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
                            <h3 className="text-h3 font-bold text-text-primary">邮件已发送</h3>
                            <p className="text-body text-text-secondary">
                                请检查您的邮箱 {email}，点击邮件中的链接重置密码。
                            </p>
                            <div className="pt-md">
                                <Link to="/login">
                                    <Button variant="secondary" className="w-full">
                                        返回登录
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-lg">
                            {error && (
                                <div className="rounded-sm bg-red-50 p-md text-center">
                                    <p className="text-small text-red-600">{error}</p>
                                </div>
                            )}

                            <div>
                                <label htmlFor="email" className="block text-body font-semibold text-text-primary mb-sm">
                                    邮箱地址
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="w-full px-md py-md rounded-sm border-2 border-gray-200 text-body text-text-primary focus:outline-none focus:border-primary-500 transition-colors"
                                    placeholder="请输入注册时的邮箱"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="pt-md space-y-md">
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={loading || !email || cooldown > 0}
                                >
                                    {loading ? '发送中...' : cooldown > 0 ? `${cooldown}秒后可重试` : '发送重置链接'}
                                </Button>

                                <Link to="/login" className="flex items-center justify-center text-primary-600 hover:text-primary-700 font-semibold transition-colors">
                                    <ArrowLeft size={16} className="mr-xs" />
                                    返回登录
                                </Link>
                            </div>
                        </form>
                    )}
                </Card>
            </div>
        </div>
    );
}
