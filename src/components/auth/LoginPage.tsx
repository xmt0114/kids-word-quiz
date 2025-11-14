import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../Button'
import { Card } from '../Card'
import { supabase } from '../../lib/supabase'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const { signIn, user, profile } = useAuth()
  const navigate = useNavigate()

  // 持续监听用户状态变化
  useEffect(() => {
    if (user && profile) {
      navigate('/', { replace: true })
    }
  }, [user, profile, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // 如果已经登录，直接跳转
    if (user && profile) {
      navigate('/', { replace: true })
      setLoading(false)
      return
    }

    const result = await signIn(email, password)

    if (result.success) {
      // 不再手动跳转，等待 useEffect 监听状态变化后自动跳转
      console.log('✅ [LoginPage] 登录成功，等待状态更新...');
      // 注意：这里不调用 setLoading(false)，让它保持 loading 状态
      // 直到 Gatekeeper 完成状态更新并触发页面跳转
    } else {
      setError(result.error || '登录失败')
      setLoading(false)
    }
  }

  // 发送重置密码邮件
  const handleForgotPassword = async () => {
    if (!email) {
      setError('请先输入邮箱地址')
      return
    }

    setResetLoading(true)
    setError('')

    try {
      // 首先检查用户是否存在（通过 user_profiles 表查询）
      const { data: users, error: userError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (userError || !users) {
        // 用户不存在，返回错误
        setError('该邮箱地址未注册')
        setResetLoading(false)
        return
      }

      const userId = users.id

      // 更新用户的 has_password_set 字段（表示用户已设置过密码）
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ has_password_set: true })
        .eq('id', userId)

      if (updateError) {
        console.warn('更新 has_password_set 字段失败:', updateError)
        // 即使更新失败，也继续发送邮件
      }

      // 发送重置密码邮件
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      })

      if (error) {
        setError(error.message || '发送重置邮件失败')
      } else {
        // 显示成功状态
        setResetSuccess(true)
        // 3秒后自动隐藏成功提示
        setTimeout(() => {
          setResetSuccess(false)
        }, 3000)
      }
    } catch (err) {
      setError('发送重置邮件失败，请重试')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 p-sm md:p-lg">
      <div className="max-w-md mx-auto pt-xl">
        <div className="text-center mb-lg animate-slide-in-right">
          <h1 className="text-hero font-bold text-text-primary mb-md">
            欢迎回来！
          </h1>
          <p className="text-h2 text-text-secondary font-semibold">
            登录您的账户继续学习
          </p>
        </div>

        <Card className="p-lg">
          <form onSubmit={handleSubmit} className="space-y-lg">
            {error && (
              <div className="rounded-sm bg-red-50 p-md text-center">
                <p className="text-small text-red-600">{error}</p>
              </div>
            )}

            {resetSuccess && (
              <div className="rounded-sm bg-green-50 p-md text-center">
                <p className="text-small text-green-600">
                  ✓ 重置密码邮件已发送，请检查您的邮箱
                </p>
              </div>
            )}

            <div className="space-y-md">
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
                  placeholder="请输入邮箱地址"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-sm">
                  <label htmlFor="password" className="block text-body font-semibold text-text-primary">
                    密码
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={resetLoading || !email}
                    className="text-small text-primary-600 hover:text-primary-700 hover:underline disabled:text-gray-400 disabled:hover:no-underline disabled:cursor-not-allowed"
                  >
                    {resetLoading ? '发送中...' : '忘记密码？'}
                  </button>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full px-md py-md rounded-sm border-2 border-gray-200 text-body text-text-primary focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-md">
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? '登录中...' : '登录'}
              </Button>
            </div>

            <div className="text-center pt-md">
              <p className="text-small text-text-tertiary">
                需要账户请联系管理员获取邀请
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
