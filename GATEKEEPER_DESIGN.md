# 🚪 Gatekeeper（守门人）设计文档

## 📋 概述

Gatekeeper 是数据加载的**单一入口点**，负责监听 `supabase.auth.onAuthStateChange` 事件，并根据认证状态的变化相应地填充 Zustand Store。

## 🎯 核心职责

- ✅ 监听认证状态变化
- ✅ 实现单一设备登录
- ✅ 拉取和缓存用户数据
- ✅ 拉取和缓存游客配置
- ✅ 清理登出数据

---

## 🔄 数据流架构

```
┌─────────────────────────────────────────┐
│         Gatekeeper (单一触发器)           │
│  • 监听 onAuthStateChange               │
│  • 决定数据加载策略                      │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│            Zustand Store                │
│  • guestConfig (游客配置)               │
│  • userSettings (用户设置)              │
│  • userProgress (用户进度)              │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│            应用组件                      │
│  • 从Store读取数据                      │
│  • 不直接调用数据API                    │
└─────────────────────────────────────────┘
```

---

## 🔍 事件处理逻辑

### 1. SIGNED_IN / INITIAL_SESSION（有session）

```typescript
// 当用户登录或初始session存在时触发
async function handleSignedIn(session) {
  // 步骤1：单设备登录
  await supabase.auth.signOut({ scope: 'others' });

  // 步骤2：拉取用户数据
  const userData = await fetchUserData();

  // 步骤3：填充缓存
  useAppStore.getState().loadUserData(userData.settings);
}
```

**数据来源：**
- `fetchUserData()` → `user_profiles` 表 → `settings.quiz_settings`

### 2. INITIAL_SESSION（无session）

```typescript
// 当无session（游客模式）时触发
async function handleNoSession() {
  // 步骤1：拉取游客配置
  const guestConfig = await fetchGuestConfig();

  // 步骤2：填充缓存
  useAppStore.getState().loadGuestData(guestConfig);
}
```

**数据来源：**
- `fetchGuestConfig()` → 原有 `useAppConfig` 逻辑 → `app_settings`, `tts_defaults`, 等

### 3. SIGNED_OUT

```typescript
// 当用户登出时触发
async function handleSignedOut() {
  // 清理所有缓存
  useAppStore.getState().clearAllData();
}
```

**操作：**
- 清除 `userSettings`
- 清除 `userProgress`
- 设置 `isLoading: false`

---

## 📦 数据结构

### Zustand Store 状态

```typescript
interface AppState {
  // 状态槽位
  isLoading: boolean;                    // 加载状态
  guestConfig: GuestConfig | null;       // 游客配置（来自 AppConfig）
  userSettings: Partial<QuizSettings> | null; // 用户设置（来自 user_profiles）
  userProgress: UserProgress | null;     // 用户进度（来自 RPC）
}
```

### 游客配置（GuestConfig）

```typescript
{
  questionType: 'text' | 'audio',
  answerType: 'choice' | 'fill',
  selectionStrategy: 'sequential' | 'random',
  collectionId: string,
  tts: {
    lang: string,
    rate: number,
    pitch: number,
    volume: number,
    voiceId: string,
  },
  // ... 其他配置项
}
```

### 用户设置（UserSettings）

```typescript
{
  questionType: 'text' | 'audio',
  answerType: 'choice' | 'fill',
  selectionStrategy: 'sequential' | 'random',
  collectionId: string,
  tts: {
    lang: string,
    rate: number,
    pitch: number,
    volume: number,
    voiceId: string,
  },
}
```

---

## 🔐 单一设备登录

当用户登录时，Gatekeeper 会立即执行：

```typescript
await supabase.auth.signOut({ scope: 'others' });
```

**作用：**
- 踢出其他设备上的会话
- 确保同一时间只有一个活跃设备
- 防止数据冲突

**时机：**
- `SIGNED_IN` 事件触发时
- `INITIAL_SESSION` 且有 session 时

---

## 📡 数据加载函数

### fetchUserData()

拉取用户设置数据：

```typescript
async function fetchUserData() {
  // 获取当前用户
  const { data: { user } } = await supabase.auth.getUser();

  // 从 user_profiles 表获取设置
  const { data } = await supabase
    .from('user_profiles')
    .select('settings')
    .eq('id', user.id)
    .single();

  return {
    settings: data?.settings?.quiz_settings || {},
  };
}
```

### fetchGuestConfig()

拉取游客配置（模拟原有AppConfig逻辑）：

```typescript
async function fetchGuestConfig() {
  // 动态导入 useAppConfig
  const { useAppConfig } = await import('../hooks/useAppConfig');
  const configData = useAppConfig();

  return {
    ...configData.config,
    // 添加默认值
    questionType: 'text',
    answerType: 'choice',
    selectionStrategy: 'sequential',
    tts: { /* ... */ },
  };
}
```

---

## 🔗 与现有组件的集成

### App.tsx 集成

```typescript
function App() {
  return (
    <ConfigProvider>
      <AuthProvider>
        {/* 守门人：数据加载的唯一触发器 */}
        <Gatekeeper>
          <Router>
            {/* 路由配置 */}
          </Router>
        </Gatekeeper>
      </AuthProvider>
    </ConfigProvider>
  );
}
```

**组件层级：**
```
App
├── ConfigProvider
└── AuthProvider
    └── Gatekeeper (数据加载触发器)
        └── Router (路由)
            └── Routes (各页面组件)
```

### 组件中使用数据

**旧方式（直接调用 API）：**
```typescript
// 在组件中
const { settings } = useQuizSettings();
```

**新方式（从Store读取）：**
```typescript
// 在组件中
const { userSettings, guestConfig } = useAppStore();
const settings = userSettings || guestConfig || {};
```

---

## 📊 日志输出

Gatekeeper 在每个关键步骤都会输出日志：

```typescript
console.log('🚪 [Gatekeeper] 初始化认证监听');
console.log('🔄 [Gatekeeper] 认证状态变化:', event, session?.user?.id);
console.log('👤 [Gatekeeper] 处理登录状态:', session.user.id);
console.log('🔒 [Gatekeeper] 执行单设备登录，踢出其他设备...');
console.log('📊 [Gatekeeper] 拉取用户数据...');
console.log('✅ [Gatekeeper] 用户数据拉取完成:', userData);
console.log('💾 [Gatekeeper] 填充用户缓存...');
console.log('✅ [Gatekeeper] 用户缓存填充完成');
```

这些日志用于调试和监控数据加载过程。

---

## ⚠️ 错误处理

### fetchUserData 失败

```typescript
try {
  const userData = await fetchUserData();
} catch (error) {
  console.error('❌ [Gatekeeper] 处理登录状态失败:', error);
  // 不会抛出错误，应用继续运行
}
```

### fetchGuestConfig 失败

```typescript
try {
  const guestConfig = await fetchGuestConfig();
} catch (error) {
  console.warn('⚠️ [Gatekeeper] 使用内置默认配置:', error);
  // 返回硬编码默认值
  return {
    questionType: 'text',
    answerType: 'choice',
    // ...
  };
}
```

---

## 🔄 数据更新流程

### 用户在设置页面修改配置

```
用户修改设置
    ↓
组件调用 useAppStore().updateSettings(newSettings)
    ↓
updateSettings 内部：
  1. 更新本地 state (Zustand Store)
  2. 保存到 localStorage
  3. 异步同步到服务器
    ↓
服务器响应
    ↓
更新用户配置（user_profiles 表）
```

**注意：** 组件不再直接调用服务器API，而是通过Store更新。

---

## 🎯 优势

1. **单一数据入口**：所有数据加载都通过Gatekeeper
2. **自动同步**：认证状态变化自动触发数据加载
3. **单设备登录**：自动踢出其他设备会话
4. **统一缓存**：所有数据都缓存在Zustand Store
5. **类型安全**：完整的 TypeScript 支持
6. **易于调试**：详细的日志输出

---

## 📝 测试要点

### 测试1：游客模式

```typescript
// 步骤：
1. 清除 localStorage 中的 session
2. 刷新页面
3. 查看控制台日志

// 预期日志：
🚪 [Gatekeeper] 初始化认证监听
🚶 [Gatekeeper] 处理游客模式
📦 [Gatekeeper] 拉取游客配置...
✅ [Gatekeeper] 游客配置拉取完成
💾 [Gatekeeper] 填充游客缓存...
✅ [Gatekeeper] 游客缓存填充完成
```

### 测试2：登录模式

```typescript
// 步骤：
1. 在游客模式下进行操作
2. 登录
3. 查看控制台日志

// 预期日志：
🔄 [Gatekeeper] 认证状态变化: SIGNED_IN
👤 [Gatekeeper] 处理登录状态: user-id
🔒 [Gatekeeper] 执行单设备登录，踢出其他设备...
📊 [Gatekeeper] 拉取用户数据...
✅ [Gatekeeper] 用户数据拉取完成
💾 [Gatekeeper] 填充用户缓存...
✅ [Gatekeeper] 用户缓存填充完成
```

### 测试3：登出模式

```typescript
// 步骤：
1. 登录状态
2. 点击登出
3. 查看控制台日志

// 预期日志：
🔄 [Gatekeeper] 认证状态变化: SIGNED_OUT
👋 [Gatekeeper] 处理登出状态
🧹 [Gatekeeper] 清理所有缓存...
✅ [Gatekeeper] 缓存清理完成
```

---

## 🎉 总结

Gatekeeper 实现了：

1. ✅ **单一数据入口** - 所有数据加载都通过它
2. ✅ **认证状态驱动** - 基于 `onAuthStateChange`
3. ✅ **单设备登录** - 自动踢出其他设备
4. ✅ **统一缓存** - Zustand Store
5. ✅ **错误容错** - 失败不影响应用运行
6. ✅ **详细日志** - 便于调试和监控

现在，整个应用的数据管理变得清晰、可控和易于维护！
