# Context到Zustand迁移设计文档

## 概述

本设计文档描述了将React Context状态管理完全迁移到Zustand的详细方案。当前项目已部分使用Zustand（appStore.ts和gameTextsSlice.ts），但仍保留了AppContextProvider和AuthProvider。本迁移将统一状态管理架构，采用slice模式组织代码，提高性能和可维护性。

## 架构设计

### 当前架构分析

**现有Zustand实现**：
- `appStore.ts`: 主要store，包含认证、数据、UI状态管理
- `gameTextsSlice.ts`: 游戏文本配置slice

**待迁移的Context实现**：
- `AppContextProvider` + `useAppContext`: 配置管理
- `AuthProvider`: 认证状态包装（内部已使用Zustand）
- `ConfigProvider`: 配置加载和显示逻辑

### 目标架构

```
src/stores/
├── appStore.ts              # 主store（整合所有slice）
├── slices/
│   ├── authSlice.ts         # 认证状态slice
│   ├── configSlice.ts       # 配置管理slice  
│   ├── uiSlice.ts          # UI状态slice
│   ├── gameTextsSlice.ts   # 游戏文本slice（已存在）
│   └── index.ts            # slice导出
└── selectors/
    ├── authSelectors.ts     # 认证相关选择器
    ├── configSelectors.ts   # 配置相关选择器
    └── index.ts            # 选择器导出
```

## 组件和接口设计

### 1. 配置管理Slice (configSlice.ts)

**职责**：
- 管理应用配置数据（游客配置和用户配置）
- 处理配置加载状态和错误
- 提供配置获取和更新方法
- 替代当前的useAppConfig和AppContext

**接口设计**：
```typescript
interface ConfigSlice {
  // 状态
  guestConfig: AppConfig | null;
  userConfig: AppConfig | null;
  configLoading: boolean;
  configError: string | null;
  dataSource: 'cloud' | 'builtin' | null;

  // Actions
  setGuestConfig: (config: AppConfig) => void;
  setUserConfig: (config: AppConfig) => void;
  setConfigLoading: (loading: boolean) => void;
  setConfigError: (error: string | null) => void;
  
  // 业务方法
  loadGuestConfig: () => Promise<void>;
  loadUserConfig: () => Promise<void>;
  getConfig: (key: string) => any;
  getConfigCategory: (key: string) => string;
  refreshConfig: () => Promise<void>;
}
```

### 2. UI状态Slice (uiSlice.ts)

**职责**：
- 管理全局UI状态（模态框、加载指示器、通知等）
- 集中管理应用级UI交互状态
- 提供UI状态的统一访问接口

**接口设计**：
```typescript
interface UISlice {
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
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
  }>;

  // Actions
  openLoginModal: (action?: string) => void;
  closeLoginModal: () => void;
  openPasswordSetupModal: (mode: 'setup' | 'reset') => void;
  closePasswordSetupModal: () => void;
  setGlobalLoading: (loading: boolean, message?: string) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}
```

### 3. 认证Slice优化 (authSlice.ts)

**职责**：
- 从现有appStore中提取认证相关逻辑
- 简化认证状态管理
- 移除对AuthProvider的依赖

**接口设计**：
```typescript
interface AuthSlice {
  // 状态
  authLoading: boolean;
  session: Session | null;
  profile: UserProfile | null;
  
  // Actions
  setAuth: (session: Session | null) => void;
  setAuthProfile: (profile: UserProfile | null) => void;
  setAuthLoading: (loading: boolean) => void;
  
  // 业务方法
  loadUserData: (session: Session) => Promise<void>;
  clearAuthData: () => void;
  checkPasswordSet: () => Promise<boolean>;
}
```

## 数据模型

### AppConfig接口
```typescript
interface AppConfig {
  app_settings: {
    defaultLanguage: string;
    theme: string;
    enableSound: boolean;
    autoSave: boolean;
  };
  default_stats: {
    totalGames: number;
    totalCorrect: number;
    bestScore: number;
    averageScore: number;
    lastPlayed: string | null;
  };
  game_constants: {
    totalQuestions: number;
    optionCount: number;
    shuffleWords: boolean;
    defaultTimeLimit: number;
  };
  // ... 其他配置项
}
```

### 配置优先级模型
```typescript
type ConfigPriority = {
  userConfig: AppConfig | null;    // 最高优先级
  guestConfig: AppConfig | null;   // 中等优先级  
  builtinDefaults: AppConfig;      // 最低优先级（兜底）
}
```

## 正确性属性

*属性是应该在系统所有有效执行中保持为真的特征或行为——本质上是关于系统应该做什么的正式声明。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

基于需求分析，以下是关键的正确性属性：

**属性 1: Context代码完全移除**
*对于任何*代码搜索查询，项目中不应包含createContext、useContext或Context.Provider的使用
**验证: 需求 1.1**

**属性 2: 状态访问统一性**
*对于任何*需要访问应用状态的组件，都应该通过Zustand hooks而非Context获取状态
**验证: 需求 1.3**

**属性 3: 状态更新统一性**
*对于任何*状态更新操作，都应该通过Zustand actions而非Context setter执行
**验证: 需求 1.4**

**属性 4: 功能完整性保持**
*对于任何*现有功能，迁移后应该保持与迁移前相同的行为和用户体验
**验证: 需求 1.5, 3.1, 3.5**

**属性 5: Slice组织规范性**
*对于任何*新的状态管理功能，相关状态和actions应该组织在独立的slice中
**验证: 需求 2.1**

**属性 6: 配置获取一致性**
*对于任何*配置数据需求，应该从配置slice获取而非其他来源
**验证: 需求 4.1**

**属性 7: 配置优先级正确性**
*对于任何*配置项，用户配置应该优先于游客配置，游客配置应该优先于内置默认值
**验证: 需求 4.5**

**属性 8: 认证状态访问直接性**
*对于任何*认证状态需求，组件应该直接从Zustand store获取而非通过Provider包装
**验证: 需求 5.1**

**属性 9: UI状态管理集中性**
*对于任何*全局UI状态（模态框、加载、通知），应该通过UI slice管理
**验证: 需求 6.1, 6.2, 6.3**

## 错误处理

### 迁移过程错误处理
- **配置加载失败**: 使用内置默认配置作为兜底
- **状态迁移失败**: 提供回滚机制到上一个稳定状态
- **组件迁移失败**: 保持原有Context实现直到修复完成

### 运行时错误处理
- **Slice初始化失败**: 使用默认状态值
- **状态更新失败**: 记录错误并保持当前状态
- **选择器错误**: 返回安全的默认值

## 测试策略

### 单元测试
- 测试每个slice的状态管理逻辑
- 测试选择器的正确性
- 测试actions的副作用

### 集成测试
- 测试slice之间的交互
- 测试组件与store的集成
- 测试配置优先级逻辑

### 属性测试
- 验证配置获取的一致性属性
- 验证状态更新的原子性属性
- 验证功能完整性属性

**测试库选择**: Jest + React Testing Library + @testing-library/jest-dom
**属性测试库**: fast-check (JavaScript属性测试库)
**测试配置**: 每个属性测试运行最少100次迭代

### 迁移验证测试
- 静态代码分析测试（检查Context残留）
- 功能回归测试（确保功能完整性）
- 性能对比测试（验证性能改进）

## 实现策略

### 迁移阶段划分

**阶段1: 创建新的Slice结构**
- 创建configSlice.ts
- 创建uiSlice.ts  
- 重构authSlice.ts
- 更新主store集成

**阶段2: 迁移配置管理**
- 将useAppConfig逻辑迁移到configSlice
- 更新ConfigProvider使用新的slice
- 测试配置功能完整性

**阶段3: 移除Context依赖**
- 移除AppContextProvider
- 移除AuthProvider包装
- 更新所有组件使用Zustand hooks

**阶段4: 验证和清理**
- 运行完整性测试
- 清理未使用的Context代码
- 性能优化和文档更新

### 向后兼容策略
- 保持现有API接口不变
- 渐进式迁移，避免破坏性变更
- 提供迁移期间的兼容层

### 性能优化
- 使用选择器避免不必要的重渲染
- 合理拆分slice避免状态过度集中
- 使用浅比较优化状态订阅

## 依赖关系

### 外部依赖
- zustand: 状态管理核心库
- @supabase/supabase-js: 数据库访问
- react: UI框架

### 内部依赖
- src/lib/supabase.ts: 数据库连接
- src/types/index.ts: 类型定义
- src/utils/api.ts: API工具函数

### 迁移依赖顺序
1. configSlice → uiSlice → authSlice
2. 主store集成 → 组件更新
3. Provider移除 → 清理工作