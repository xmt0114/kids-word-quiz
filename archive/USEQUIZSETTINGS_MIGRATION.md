# useQuizSettings Hook 迁移总结

## 迁移概述

成功将 `useQuizSettings` Hook 从 `useLocalStorage.ts` 迁移到 `appStore.ts`，实现了状态管理架构的统一。

## 迁移原因

1. **职责清晰**：`useQuizSettings` 实际使用的是 Zustand Store，而非 localStorage，放在 `useLocalStorage.ts` 中会造成职责不清和命名混淆
2. **架构统一**：将所有状态管理逻辑集中到 Zustand Store 中，减少依赖和复杂度
3. **命名准确**：迁移后的位置更符合实际功能，避免误导

## 变更详情

### 1. 新增文件：`src/stores/appStore.ts`

在 `appStore.ts` 文件末尾添加了 `useQuizSettings` 函数：

```typescript
export const useQuizSettings = () => {
  const { user } = useAuth();
  const { profile, updateUserSettings } = useAuthState();

  // 从 Zustand Store 订阅设置
  const userSettings = useAppStore(state => state.userSettings);
  const guestConfig = useAppStore(state => state.guestConfig);

  // 合并获取完整设置
  const settings = useMemo(() => {
    // 优先级：userSettings > guestConfig > 默认值
    // ...
  }, [userSettings, guestConfig]);

  // 【服务器优先】更新设置的函数
  const setSettings = async (newSettings) => {
    // 服务器优先策略：先更新服务器，再更新本地缓存
    // ...
  };

  return { settings, setSettings };
};
```

### 2. 修改的文件列表

以下文件已更新导入路径：

| 文件 | 旧导入路径 | 新导入路径 |
|------|-----------|-----------|
| src/components/GuessWordSettingsPage.tsx | `../hooks/useLocalStorage` | `../stores/appStore` |
| src/components/TextbookSelectionPage.tsx | `../hooks/useLocalStorage` | `../stores/appStore` |
| src/components/HomePage.tsx | `../hooks/useLocalStorage` | `../stores/appStore` |
| src/components/TextToSpeechButton.tsx | `../hooks/useLocalStorage` | `../stores/appStore` |

### 3. 清理的文件：`src/hooks/useLocalStorage.ts`

- 移除了 `useQuizSettings` 函数实现
- 保留了 `useLocalStorage` 和 `useQuizStats` 函数
- 清理了不再需要的导入：`useMemo` 和 `QuizSettings`

## 功能保持不变

✅ 所有原有功能完全保持不变：
- 设置优先级：userSettings > guestConfig > 默认值
- 服务器优先更新策略
- 游客模式支持
- TypeScript 类型安全

## 验证结果

### 构建验证
```bash
✓ built in 3.87s
# 无 TypeScript 错误
```

### 开发服务器验证
```
Local:   http://localhost:5177/
# 成功启动，无错误
```

### 功能验证
- ✅ 所有页面正常加载
- ✅ Zustand Store 状态管理正常
- ✅ 认证流程正常
- ✅ 设置读写正常

## 架构改进

### 迁移前
```
useLocalStorage.ts
├── useLocalStorage()
├── useQuizSettings()  ❌ 实际使用 Zustand
└── useQuizStats()

appStore.ts
├── Zustand Store 定义
└── 其他状态管理逻辑
```

### 迁移后
```
useLocalStorage.ts
├── useLocalStorage()
└── useQuizStats()

appStore.ts
├── Zustand Store 定义
├── 状态选择器 (appStoreSelectors)
├── useQuizSettings()  ✅ 位置正确
└── 其他状态管理逻辑
```

## 总结

本次迁移成功实现了：

1. ✅ **职责分离**：每个文件都有明确的职责
2. ✅ **命名准确**：文件名与实际功能匹配
3. ✅ **架构统一**：状态管理集中在 Zustand Store
4. ✅ **功能完整**：所有原有功能保持不变
5. ✅ **代码质量**：无 TypeScript 错误，构建成功

迁移后代码更加清晰，职责更加明确，符合单一职责原则和关注点分离的架构原则。
