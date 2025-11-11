# 登录保护机制使用指南

## 概述

我们实现了一个通用的登录保护机制，允许未登录用户浏览主页，但要求登录后才能进行任何交互操作。

## 核心功能

### 1. useLoginPrompt Hook

这是一个可复用的Hook，提供登录检查和弹框功能。

**位置**: `src/hooks/useLoginPrompt.ts`

**使用方式**:

```typescript
import { useLoginPrompt } from '../hooks/useLoginPrompt';

const MyComponent = () => {
  // 使用Hook
  const { isLoggedIn, promptLogin, isLoginModalOpen, handleCloseModal } =
    useLoginPrompt({ action: '保存设置' });

  // 在需要登录的函数中检查登录状态
  const handleSave = () => {
    if (!isLoggedIn) {
      // 弹出登录框，登录成功后执行回调
      promptLogin(() => {
        // 登录成功后的操作
        saveData();
      });
      return;
    }

    // 已登录，直接执行
    saveData();
  };

  return (
    <div>
      {/* 你的组件内容 */}
      <button onClick={handleSave}>保存</button>

      {/* 在页面底部添加登录弹框 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={handleCloseModal}
        action="保存设置"
      />
    </div>
  );
};
```

**参数说明**:

- `action`: 登录后要执行的操作描述，用于弹框标题
- `onLoginSuccess`: 可选的登录成功回调

**返回值**:

- `user`: 当前用户对象
- `profile`: 用户资料
- `isLoggedIn`: 是否已登录的布尔值
- `isLoginModalOpen`: 登录弹框是否打开
- `promptLogin(onLoginSuccess?)`: 提示登录的函数
- `handleCloseModal`: 关闭弹框的函数

### 2. LoginModal 组件

**位置**: `src/components/auth/LoginModal.tsx`

**功能**:
- 弹框式登录界面
- 支持邮箱、密码输入
- 错误处理和用户友好提示
- 登录成功后自动关闭弹框
- 提供跳转到注册页面的链接

## 实际应用案例

### 案例1: 主页的"开始游戏"按钮

**文件**: `src/components/HomePage.tsx`

```typescript
const handleStartGame = (gameId: string) => {
  if (!user || !profile) {
    // 未登录，弹出登录框
    setPendingAction(gameId);
    setIsLoginModalOpen(true);
    return;
  }

  // 已登录，直接开始游戏
  navigate('/guess-word/game', { state: { settings, collectionId } });
};

// 监听登录状态，登录成功后自动执行pending操作
useEffect(() => {
  if (user && profile && pendingAction) {
    if (pendingAction === 'guess-word') {
      // 自动开始游戏
      handleStartGame('guess-word');
    }
    setPendingAction(null);
  }
}, [user, profile, pendingAction]);
```

### 案例2: 设置页面的"保存设置"按钮

**文件**: `src/components/GuessWordSettingsPage.tsx`

```typescript
const { isLoggedIn, promptLogin } = useLoginPrompt({ action: '保存设置' });

const handleSaveSettings = () => {
  // 检查登录状态
  if (!isLoggedIn) {
    promptLogin(() => {
      // 登录成功后执行保存
      setSettings(selectedSettings);
      navigate('/');
    });
    return;
  }

  // 已登录，直接保存
  setSettings(selectedSettings);
  navigate('/');
};
```

## 设计优势

### 1. 非侵入性
- 不改变现有页面结构
- 只在需要时添加登录检查
- 不影响已登录用户的体验

### 2. 可复用性强
- useLoginPrompt Hook可在任何组件中使用
- LoginModal组件通用
- 避免重复代码

### 3. 用户体验好
- 未登录用户可以浏览内容
- 只有在尝试交互时才提示登录
- 登录后自动继续之前的操作
- 弹框设计优雅，操作流畅

### 4. 灵活控制
- 可以为不同操作定制提示文案
- 支持登录成功后的自定义回调
- 弹框可以关闭，返回浏览状态

## 受保护的页面/操作

已应用登录保护的页面和操作：

1. **主页 (HomePage)**
   - ✅ "开始游戏"按钮

2. **设置页面 (GuessWordSettingsPage)**
   - ✅ "保存设置"按钮

未来需要保护的操作：

3. **游戏页面 (GuessWordGamePage)**
   - 🔄 从主页跳转时已经受保护

4. **数据管理页面 (DataManagementPage)**
   - ⚠️ 仅开发环境可用，已有保护

5. **教科书选择页面 (TextbookSelectionPage)**
   - ⚪ 从设置页面调用，已间接受保护

## 最佳实践

### 1. 在页面底部添加LoginModal
确保LoginModal组件在页面的JSX末尾：
```jsx
{/* 其他内容 */}
</div>

{/* 登录弹框 */}
<LoginModal
  isOpen={isLoginModalOpen}
  onClose={handleCloseModal}
  action="继续操作"
/>
</div>
```

### 2. 在需要登录的函数中检查状态
```typescript
const handleAction = () => {
  if (!isLoggedIn) {
    promptLogin(() => {
      // 登录成功后的操作
      doAction();
    });
    return;
  }

  doAction();
};
```

### 3. 使用有意义的action文案
```typescript
useLoginPrompt({ action: '保存设置' })
useLoginPrompt({ action: '开始游戏' })
useLoginPrompt({ action: '访问数据管理' })
```

## 注意事项

1. **确保导入LoginModal**: 在使用弹框的页面中导入`import { LoginModal } from './auth/LoginModal';`

2. **处理异步回调**: 登录成功后的回调在effect中执行，确保依赖项正确

3. **清理pending状态**: 在弹框关闭或登录成功后清理pending状态

4. **类型安全**: 使用TypeScript确保类型安全

## 故障排除

### 登录后不执行操作
- 检查useEffect的依赖项是否正确
- 确保pendingAction状态正确设置和清理

### 弹框不显示
- 检查isLoginModalOpen状态
- 确保LoginModal组件在JSX中
- 检查handleCloseModal函数是否正确

### 重复提示登录
- 确保promptLogin只在未登录时调用
- 检查isLoggedIn判断逻辑

## 扩展建议

未来可以考虑：
1. 添加"记住我"选项
2. 支持社交媒体登录
3. 添加登录倒计时
4. 实现登录状态持久化检查
5. 添加登录成功/失败的动画效果
