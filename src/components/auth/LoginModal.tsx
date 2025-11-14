import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../Button'
import { X } from 'lucide-react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  action: string
}

export function LoginModal({ isOpen, onClose, action }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn(email, password)

    if (result.success) {
      onClose()
      setEmail('')
      setPassword('')
    } else {
      setError(result.error || '登录失败')
    }

    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-sm md:p-lg z-50">
      <div className="bg-white rounded-lg p-lg max-w-md w-full animate-scale-in">
        <div className="flex justify-between items-center mb-lg">
          <h3 className="text-h3 font-bold text-text-primary">
            登录以继续{action}
          </h3>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-lg">
          {error && (
            <div className="rounded-sm bg-red-50 p-md text-center">
              <p className="text-small text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-md">
            <div>
              <label htmlFor="modal-email" className="block text-body font-semibold text-text-primary mb-sm">
                邮箱地址
              </label>
              <input
                id="modal-email"
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
              <label htmlFor="modal-password" className="block text-body font-semibold text-text-primary mb-sm">
                密码
              </label>
              <input
                id="modal-password"
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

          <div className="pt-md space-y-md">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? '登录中...' : '登录'}
            </Button>

            <div className="text-center">
              <p className="text-small text-text-tertiary">
                需要账户请联系管理员获取邀请
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
