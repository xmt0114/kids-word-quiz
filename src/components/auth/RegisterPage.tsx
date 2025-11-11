import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../Button'
import { Card } from '../Card'

export function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password.length < 6) {
      setError('密码至少需要6个字符')
      setLoading(false)
      return
    }

    const result = await signUp(email, password, displayName)

    if (result.success) {
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } else {
      setError(result.error || '注册失败')
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 p-sm md:p-lg">
        <div className="max-w-md mx-auto pt-xl">
          <div className="text-center animate-slide-in-right">
            <h1 className="text-hero font-bold text-success mb-md">
              注册成功！
            </h1>
            <p className="text-h2 text-text-secondary font-semibold">
              正在跳转到登录页面...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 p-sm md:p-lg">
      <div className="max-w-md mx-auto pt-xl">
        <div className="text-center mb-lg animate-slide-in-right">
          <h1 className="text-hero font-bold text-text-primary mb-md">
            开始学习之旅
          </h1>
          <p className="text-h2 text-text-secondary font-semibold">
            创建您的账户
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
                <label htmlFor="displayName" className="block text-body font-semibold text-text-primary mb-sm">
                  显示名称
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  className="w-full px-md py-md rounded-sm border-2 border-gray-200 text-body text-text-primary focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="请输入您的昵称"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

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
                  autoComplete="new-password"
                  required
                  className="w-full px-md py-md rounded-sm border-2 border-gray-200 text-body text-text-primary focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="至少6个字符"
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
                {loading ? '注册中...' : '注册'}
              </Button>
            </div>

            <div className="text-center pt-md">
              <p className="text-small text-text-tertiary">
                已有账户？{' '}
                <Link
                  to="/login"
                  className="font-semibold text-primary-500 hover:text-primary-600 transition-colors"
                >
                  立即登录
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
