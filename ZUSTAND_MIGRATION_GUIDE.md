# 📦 Zustand 状态管理迁移指南

## 📋 概述

我们已将混乱的三套状态管理系统统一为单一的中央Zustand Store：
- ✅ **Context** (`useAppContext`) → `guestConfig`
- ✅ **localStorage** (`useQuizSettings`) → `userSettings`
- ✅ **RPC调用** (进度数据) → `userProgress`

---

## 🏗️ 新的状态架构

### 中央 Store 结构
```typescript
interface AppState {
  // 状态槽位
  isLoading: boolean;
  guestConfig: GuestConfig | null;      // 游客配置（之前在 AppConfigProvider）
  userSettings: Partial<QuizSettings> | null; // 用户设置（之前在 localStorage）
  userProgress: UserProgress | null;    // 用户进度（之前RPC调用）

  // Actions
  loadGuestData(config): void;          // 加载游客配置
  loadUserData(settings): void;         // 加载用户设置
  updateSettings(settings): Promise<void>; // 更新设置（服务器优先）
  updateProgress(progress): void;       // 更新进度
  clearAllData(): void;                 // 清除数据（登出）
}
```

---

## 🔄 迁移步骤

### 步骤1：替换 AppConfig Provider

**旧代码：**
```typescript
// App.tsx
import { AppContextProvider } from './hooks/useAppContext';

function App() {
  return (
    <AppContextProvider>
      {/* 应用内容 */}
    </AppContextProvider>
  );
}
```

**新代码：**
```typescript
// App.tsx
import { useEffect } from 'react';
import { useAppStore } from './stores/appStore';

function App() {
  const { isLoading, guestConfig, loadGuestData } = useAppStore();

  // 加载游客配置（替代 AppConfigProvider）
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { useAppConfig } = await import('./hooks/useAppConfig');
        const configData = useAppConfig();
        loadGuestData(configData.config);
      } catch (error) {
        console.error('加载配置失败:', error);
      }
    };
    loadConfig();
  }, [loadGuestData]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {/* 应用内容 */}
    </>
  );
}
```

### 步骤2：替换 useQuizSettings

**旧代码：**
```typescript
// 在组件中
import { useQuizSettings } from '../hooks/useLocalStorage';

function MyComponent() {
  const { settings, setSettings } = useQuizSettings();
  // 使用 settings 和 setSettings
}
```

**新代码：**
```typescript
// 在组件中
import { useAppStore } from '../stores/appStore';

function MyComponent() {
  const { userSettings, updateSettings } = useAppStore();
  const settings = userSettings || {}; // 获取设置

  const handleUpdate = (newSettings) => {
    updateSettings(newSettings); // 更新设置（自动localStorage + 服务器同步）
  };

  // 使用 settings 和 handleUpdate
}
```

### 步骤3：替换进度数据

**旧代码：**
```typescript
// GuessWordSettingsPage.tsx
const [textbookProgress, setTextbookProgress] = useState(null);

useEffect(() => {
  supabase.rpc('get_collection_progress', { p_collection_id })
    .then(({ data: progress }) => {
      setTextbookProgress(progress);
    });
}, []);
```

**新代码：**
```typescript
// GuessWordSettingsPage.tsx
import { useAppStore } from '../stores/appStore';

function MyComponent() {
  const { userProgress, updateProgress } = useAppStore();

  useEffect(() => {
    supabase.rpc('get_collection_progress', { p_collection_id })
      .then(({ data: progress }) => {
        updateProgress(progress); // 更新Store中的进度
      });
  }, []);

  // 使用 userProgress（从Store获取）
}
```

---

## 📝 使用示例

### 示例1：在组件中使用设置

```typescript
import React from 'react';
import { useAppStore } from '../stores/appStore';

export function SettingsPage() {
  const { userSettings, updateSettings, appStoreSelectors } = useAppStore();

  // 获取完整设置（合并游客和用户设置）
  const fullSettings = appStoreSelectors.getFullSettings();

  const handleQuestionTypeChange = (questionType) => {
    updateSettings({ questionType });
  };

  return (
    <div>
      <h1>设置页面</h1>

      <div>
        <label>题目类型:</label>
        <select
          value={fullSettings.questionType || 'text'}
          onChange={(e) => handleQuestionTypeChange(e.target.value)}
        >
          <option value="text">文字</option>
          <option value="audio">音频</option>
        </select>
      </div>

      <div>
        <label>答案类型:</label>
        <select
          value={fullSettings.answerType || 'choice'}
          onChange={(e) => updateSettings({ answerType: e.target.value })}
        >
          <option value="choice">选择题</option>
          <option value="fill">填空</option>
        </select>
      </div>
    </div>
  );
}
```

### 示例2：在组件中使用进度

```typescript
import React, { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { supabase } from '../lib/supabase';

export function ProgressDisplay({ collectionId }) {
  const { userProgress, updateProgress } = useAppStore();

  // 加载进度
  useEffect(() => {
    const loadProgress = async () => {
      const { data, error } = await supabase
        .rpc('get_collection_progress', { p_collection_id: collectionId });

      if (!error && data) {
        updateProgress(data);
      }
    };

    loadProgress();
  }, [collectionId, updateProgress]);

  if (!userProgress) {
    return <div>加载进度中...</div>;
  }

  return (
    <div>
      <p>总词汇: {userProgress.total_words}</p>
      <p>已掌握: {userProgress.mastered_words}</p>
      <p>剩余: {userProgress.remaining_words}</p>
    </div>
  );
}
```

### 示例3：登录/登出处理

```typescript
import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { useAuth } from '../hooks/useAuth';

export function AuthWrapper({ children }) {
  const { user, profile } = useAuth();
  const { loadUserData, clearAllData } = useAppStore();

  // 监听登录状态变化
  useEffect(() => {
    if (user && profile) {
      // 登录时：加载用户设置
      const userSettings = profile.settings?.quiz_settings || {};
      loadUserData(userSettings);
    } else {
      // 登出时：清除用户数据
      clearAllData();
    }
  }, [user, profile, loadUserData, clearAllData]);

  return <>{children}</>;
}
```

---

## 🎯 选择器辅助函数

```typescript
import { useAppStore, appStoreSelectors } from '../stores/appStore';

// 获取完整设置（推荐）
function MyComponent() {
  const fullSettings = appStoreSelectors.getFullSettings();
  // ... 使用 fullSettings
}

// 检查数据是否已加载
function MyComponent() {
  const isLoaded = appStoreSelectors.isDataLoaded();
  if (!isLoaded) {
    return <div>加载中...</div>;
  }
  // ... 渲染内容
}

// 检查是否登录
function MyComponent() {
  const isLoggedIn = appStoreSelectors.isLoggedIn();
  if (!isLoggedIn) {
    return <div>请登录</div>;
  }
  // ... 渲染登录内容
}
```

---

## 🚀 性能优化

### Zustand 的优势

1. **轻量级**：无额外开销，零依赖
2. **快速**：使用`shallow`比较，避免不必要的重渲染
3. **TypeScript友好**：完整的类型支持
4. **简单API**：易于理解和使用

### 最佳实践

```typescript
// ✅ 推荐：使用选择器，只订阅需要的数据
function MyComponent() {
  const settings = useAppStore(state => state.userSettings);
  const updateSettings = useAppStore(state => state.updateSettings);
}

// ❌ 避免：订阅整个Store
function MyComponent() {
  const { userSettings, updateSettings, userProgress } = useAppStore();
}
```

---

## 📦 安装检查

确保已安装 Zustand：
```bash
pnpm add zustand
```

---

## 🎉 迁移检查清单

- [ ] 创建 `src/stores/appStore.ts`
- [ ] 更新 `App.tsx` 使用新Store
- [ ] 更新 `GuessWordSettingsPage.tsx`
- [ ] 更新 `HomePage.tsx`
- [ ] 更新 `TextbookSelectionPage.tsx`
- [ ] 更新其他使用 `useQuizSettings` 的组件
- [ ] 更新 `useAuth.ts` 集成新Store
- [ ] 测试游客模式
- [ ] 测试登录模式
- [ ] 测试数据持久化
- [ ] 测试服务器同步

---

## 🔍 常见问题

### Q: 如何处理服务器同步？

**A:** 在 `updateSettings` 的异步逻辑中添加服务器调用：
```typescript
updateSettings: async (newSettings) => {
  // 本地更新
  set({ userSettings: { ...get().userSettings, ...newSettings } });

  // 服务器同步
  if (isLoggedIn) {
    const { supabase } = await import('../lib/supabase');
    await supabase.from('user_profiles')
      .update({ settings: { quiz_settings: newSettings } })
      .eq('id', user.id);
  }
}
```

### Q: 如何处理错误？

**A:** 在Actions中添加错误处理：
```typescript
updateSettings: async (newSettings) => {
  try {
    // 更新逻辑
  } catch (error) {
    console.error('更新设置失败:', error);
    // 可以添加 toast 通知用户
  }
}
```

### Q: 如何调试？

**A:** 使用 Zustand 的 devtools：
```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // ... Store 实现
    }),
    { name: 'app-store' }
  )
);
```

---

## 📚 参考资源

- [Zustand 官方文档](https://github.com/pmndrs/zustand)
- [Zustand 中文文档](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Zustand 最佳实践](https://docs.pmnd.rs/zustand/guides/typescript)

---

**迁移完成！🎉**

现在您有了一个统一的、类型安全的、性能优异的状态管理系统。
