/**
 * UI状态管理 Slice
 * 
 * 职责：
 * - 管理全局UI状态（模态框、加载指示器、通知等）
 * - 集中管理应用级UI交互状态
 * - 提供UI状态的统一访问接口
 */

// 通知接口
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

/**
 * UI状态管理 Slice 接口
 */
export interface UISlice {
  // 模态框状态
  loginModal: {
    isOpen: boolean;
    action: string;
  };
  passwordSetupModal: {
    isOpen: boolean;
    mode: 'setup' | 'reset';
  };
  
  // 全局加载状态
  globalLoading: boolean;
  loadingMessage: string;
  
  // 通知状态
  notifications: Notification[];

  // Actions
  openLoginModal: (action?: string) => void;
  closeLoginModal: () => void;
  openPasswordSetupModal: (mode: 'setup' | 'reset') => void;
  closePasswordSetupModal: () => void;
  setGlobalLoading: (loading: boolean, message?: string) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

/**
 * 创建UI状态管理 Slice
 */
export const createUISlice = (
  set: any,
  get: any
): UISlice => ({
  // 初始状态
  loginModal: {
    isOpen: false,
    action: '登录',
  },
  passwordSetupModal: {
    isOpen: false,
    mode: 'setup',
  },
  globalLoading: false,
  loadingMessage: '',
  notifications: [],

  // 登录模态框 Actions
  openLoginModal: (action = '登录') => {
    console.log('🔓 [UISlice] 打开登录模态框:', action);
    set({ loginModal: { isOpen: true, action } });
  },

  closeLoginModal: () => {
    console.log('🔒 [UISlice] 关闭登录模态框');
    set({ loginModal: { isOpen: false, action: '登录' } });
  },

  // 密码设置模态框 Actions
  openPasswordSetupModal: (mode: 'setup' | 'reset') => {
    console.log('🔐 [UISlice] 打开密码设置模态框:', mode);
    set({ passwordSetupModal: { isOpen: true, mode } });
  },

  closePasswordSetupModal: () => {
    console.log('🔐 [UISlice] 关闭密码设置模态框');
    set({ passwordSetupModal: { isOpen: false, mode: 'setup' } });
  },

  // 全局加载状态 Actions
  setGlobalLoading: (loading: boolean, message = '') => {
    console.log('⏳ [UISlice] 设置全局加载状态:', { loading, message });
    set({ globalLoading: loading, loadingMessage: message });
  },

  // 通知 Actions
  addNotification: (notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = { ...notification, id };
    
    console.log('📢 [UISlice] 添加通知:', newNotification);
    
    set((state: UISlice) => ({
      notifications: [...state.notifications, newNotification]
    }));

    // 如果设置了持续时间，自动移除通知（仅在非测试环境）
    if (notification.duration && notification.duration > 0 && typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
      setTimeout(() => {
        get().removeNotification(id);
      }, notification.duration);
    }
  },

  removeNotification: (id: string) => {
    console.log('🗑️ [UISlice] 移除通知:', id);
    set((state: UISlice) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },

  clearAllNotifications: () => {
    console.log('🧹 [UISlice] 清除所有通知');
    set({ notifications: [] });
  },
});