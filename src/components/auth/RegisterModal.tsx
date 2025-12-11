import { useState } from 'react'
import { useAuthState, RegisterFormData } from '../../hooks/useAuth'
import { useAppStore } from '../../stores/appStore'
import { Button } from '../Button'
import { X } from 'lucide-react'

interface RegisterModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToLogin: () => void
}

interface ValidationErrors {
  email?: string
  password?: string
  displayName?: string
  inviteCode?: string
}

export function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    displayName: '',
    inviteCode: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const { signUp } = useAuthState()
  const { addNotification } = useAppStore()

  // 验证单个字段
  const validateField = (field: keyof RegisterFormData, value: string): string | undefined => {
    switch (field) {
      case 'email': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!value.trim()) return '请输入邮箱地址'
        if (!emailRegex.test(value)) return '请输入有效的邮箱地址'
        break
      }
      case 'password':
        if (!value) return '请输入密码'
        if (value.length < 6) return '密码至少需要6个字符'
        break
      case 'displayName':
        if (!value.trim()) return '请输入昵称'
        if (value.trim().length < 2) return '昵称至少需要2个字符'
        if (value.trim().length > 20) return '昵称不能超过20个字符'
        break
      case 'inviteCode':
        if (!value.trim()) return '请输入邀请码'
        break
    }
    return undefined
  }

  // 验证所有字段
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {}
    let isValid = true

    Object.keys(formData).forEach(key => {
      const field = key as keyof RegisterFormData
      const error = validateField(field, formData[field])
      if (error) {
        errors[field] = error
        isValid = false
      }
    })

    setValidationErrors(errors)
    return isValid
  }

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // 清除全局错误消息
    if (error) setError('')
    
    // 实时验证当前字段
    const fieldError = validateField(field, value)
    setValidationErrors(prev => ({
      ...prev,
      [field]: fieldError
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 验证表单
    if (!validateForm()) {
      return
    }

    setLoading(true)

    const result = await signUp(formData)

    if (result.success) {
      // 显示成功消息
      addNotification({
        type: 'success',
        message: '注册邮件已发送！请去邮箱点击链接完成注册。',
        duration: 5000
      })
      
      // 关闭模态框并清空表单
      onClose()
      setFormData({
        email: '',
        password: '',
        displayName: '',
        inviteCode: ''
      })
      setValidationErrors({})
    } else {
      // 直接显示服务端返回的错误信息
      setError(result.error || '注册失败')
    }

    setLoading(false)
  }

  const handleClose = () => {
    onClose()
    // 清空表单和错误状态
    setFormData({
      email: '',
      password: '',
      displayName: '',
      inviteCode: ''
    })
    setError('')
    setValidationErrors({})
  }

  const handleSwitchToLogin = () => {
    // 清空表单和错误状态
    setFormData({
      email: '',
      password: '',
      displayName: '',
      inviteCode: ''
    })
    setError('')
    setValidationErrors({})
    onSwitchToLogin()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-sm md:p-lg z-50">
      <div className="bg-white rounded-lg p-lg max-w-md w-full animate-scale-in">
        <div className="flex justify-between items-center mb-lg">
          <h3 className="text-h3 font-bold text-text-primary">
            注册新账户
          </h3>
          <button
            onClick={handleClose}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-md">
          {error && (
            <div className="rounded-sm bg-red-50 p-md text-center">
              <p className="text-small text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-sm">
            <div>
              <div className="flex justify-between items-center mb-xs">
                <label htmlFor="register-email" className="text-body font-semibold text-text-primary">
                  邮箱地址 <span className="text-red-500">*</span>
                </label>
                {validationErrors.email && (
                  <span className="text-xs text-red-600">{validationErrors.email}</span>
                )}
              </div>
              <input
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`w-full px-md py-sm rounded-sm border-2 text-body text-text-primary focus:outline-none transition-colors ${
                  validationErrors.email 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-200 focus:border-primary-500'
                }`}
                placeholder="请输入邮箱地址"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-xs">
                <label htmlFor="register-password" className="text-body font-semibold text-text-primary">
                  密码 <span className="text-red-500">*</span>
                </label>
                {validationErrors.password && (
                  <span className="text-xs text-red-600">{validationErrors.password}</span>
                )}
              </div>
              <input
                id="register-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className={`w-full px-md py-sm rounded-sm border-2 text-body text-text-primary focus:outline-none transition-colors ${
                  validationErrors.password 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-200 focus:border-primary-500'
                }`}
                placeholder="请输入密码（至少6位）"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-xs">
                <label htmlFor="register-displayName" className="text-body font-semibold text-text-primary">
                  昵称 <span className="text-red-500">*</span>
                </label>
                {validationErrors.displayName && (
                  <span className="text-xs text-red-600">{validationErrors.displayName}</span>
                )}
              </div>
              <input
                id="register-displayName"
                name="displayName"
                type="text"
                autoComplete="name"
                required
                className={`w-full px-md py-sm rounded-sm border-2 text-body text-text-primary focus:outline-none transition-colors ${
                  validationErrors.displayName 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-200 focus:border-primary-500'
                }`}
                placeholder="请输入昵称"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-xs">
                <label htmlFor="register-inviteCode" className="text-body font-semibold text-text-primary">
                  邀请码 <span className="text-red-500">*</span>
                </label>
                {validationErrors.inviteCode && (
                  <span className="text-xs text-red-600">{validationErrors.inviteCode}</span>
                )}
              </div>
              <input
                id="register-inviteCode"
                name="inviteCode"
                type="text"
                required
                className={`w-full px-md py-sm rounded-sm border-2 text-body text-text-primary focus:outline-none transition-colors ${
                  validationErrors.inviteCode 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-200 focus:border-primary-500'
                }`}
                placeholder="请输入邀请码"
                value={formData.inviteCode}
                onChange={(e) => handleInputChange('inviteCode', e.target.value)}
              />
            </div>
          </div>

          <div className="pt-sm space-y-sm">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? '注册中...' : '注册'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleSwitchToLogin}
                className="text-small text-primary-600 hover:text-primary-700 hover:underline"
              >
                已有账户？登录
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}