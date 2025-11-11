import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../Button'
import { Card } from '../Card'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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
      // 等待状态更新完成
      setTimeout(() => {
        navigate('/', { replace: true })
      }, 100)
    } else {
      setError(result.error || '登录失败')
    }

    setLoading(false)
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
                <label htmlFor="password" className="block text-body font-semibold text-text-primary mb-sm">
                  密码
                </label>
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
                还没有账户？{' '}
                <Link
                  to="/register"
                  className="font-semibold text-primary-500 hover:text-primary-600 transition-colors"
                >
                  立即注册
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
