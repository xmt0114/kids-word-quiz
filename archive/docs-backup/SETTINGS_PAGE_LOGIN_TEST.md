# 设置页面登录保护测试指南

## 测试场景

### 场景1：未登录用户访问设置页面

**操作步骤**:
1. 确保用户未登录（登出状态）
2. 在主页点击任意游戏的设置按钮（齿轮图标）

**预期结果**:
- ❌ **页面不应该直接进入设置页面**
- ✅ 应该立即弹出登录弹框，提示"登录以继续访问设置"
- ✅ 弹框标题应为"登录以继续访问设置"
- ✅ 用户可以点击右上角❌关闭弹框
- ✅ 关闭弹框后，**自动跳转到主页**
- ✅ 用户也可以在弹框中登录，登录成功后设置页面正常显示

### 场景2：已登录用户访问设置页面

**操作步骤**:
1. 登录用户账户
2. 在主页点击任意游戏的设置按钮

**预期结果**:
- ✅ 直接进入设置页面，无弹框
- ✅ 设置页面正常显示所有功能
- ✅ 可以修改设置并保存

### 场景3：未登录用户在设置页面尝试保存

**注意**: 由于页面级别保护，未登录用户根本无法进入设置页面，所以此场景不会发生。

## 技术实现细节

### 登录检查逻辑

```typescript
// 1. 获取登录状态
const { user, profile } = useAuth();
const isLoggedIn = !!(user && profile);

// 2. 页面加载时检查
useEffect(() => {
  if (!isLoggedIn) {
    setShowLoginModal(true);
  }
}, [isLoggedIn]);

// 3. 弹框关闭处理
const handleCloseLoginModal = () => {
  setShowLoginModal(false);
  if (!isLoggedIn) {
    navigate('/');
  }
};
```

### 弹框组件

```jsx
<LoginModal
  isOpen={showLoginModal}
  onClose={handleCloseLoginModal}
  action="访问设置"
/>
```

## 关键行为

### 1. 页面级保护 vs 操作级保护

- **页面级保护** (设置页面): 在页面加载时立即检查，未登录用户无法进入
- **操作级保护** (主页游戏按钮): 允许进入页面，但在操作时提示登录

### 2. 关闭弹框的逻辑

- **已登录用户关闭弹框**: 仅关闭弹框，留在当前页面
- **未登录用户关闭弹框**: 关闭弹框 + 跳转到主页

这是通过在`handleCloseLoginModal`中检查`isLoggedIn`状态实现的。

### 3. 登录成功后的处理

- LoginModal内部监听认证状态变化
- 当用户登录成功时，弹框自动关闭
- useEffect检测到`isLoggedIn`变为true，不再显示弹框
- 页面重新渲染为已登录状态

## 常见问题

### Q: 关闭弹框后页面没有跳转？

**A**: 检查`handleCloseLoginModal`中的逻辑：
```typescript
if (!isLoggedIn) {
  navigate('/');  // 必须执行
}
```

### Q: 弹框一直显示，登录后不关闭？

**A**: 检查：
1. LoginModal是否正确接收`isOpen`参数
2. useAuth是否正确返回用户状态
3. 是否有JavaScript错误阻止状态更新

### Q: 可以绕过登录直接访问URL吗？

**A**: 不能。页面级保护会在组件加载时立即检查登录状态，强制显示登录弹框。

## 测试检查清单

- [ ] 未登录用户点击设置按钮，弹出登录弹框
- [ ] 弹框标题显示"登录以继续访问设置"
- [ ] 关闭弹框后自动跳转到主页
- [ ] 在弹框中登录后，设置页面正常显示
- [ ] 已登录用户可以直接访问设置页面
- [ ] 在设置页面修改设置并保存功能正常
- [ ] 登出后重新访问设置页面，再次提示登录

## 调试技巧

### 1. 检查状态

在浏览器控制台中：
```javascript
// 检查当前用户状态
console.log('User:', window.__REACT_DEVTOOLS_GLOBAL_HOOK__ ? 'Available' : 'Check manually');
```

### 2. 查看网络请求

打开浏览器开发者工具：
- Network标签页
- 查看Supabase认证请求
- 确认`email_confirmed_at`字段已设置

### 3. 打开React DevTools

查看组件状态：
- 检查`showLoginModal`状态
- 检查`isLoggedIn`值
- 检查`user`和`profile`对象

## 边界情况

### 1. 网络异常

如果登录时网络异常：
- LoginModal显示错误信息
- 弹框不关闭
- 用户可以重试

### 2. 邮箱未验证

如果用户邮箱未验证：
- 登录失败，显示友好错误信息
- 弹框不关闭
- 引导用户检查邮箱

### 3. 快速连续操作

如果用户快速多次点击设置按钮：
- 多次触发useEffect
- 但useEffect有依赖项保护`[isLoggedIn]`
- 避免重复显示弹框

## 相关文件

- `src/components/GuessWordSettingsPage.tsx` - 设置页面主文件
- `src/components/auth/LoginModal.tsx` - 登录弹框组件
- `src/hooks/useAuth.ts` - 认证Hook
- `docs/LOGIN_PROTECTION_GUIDE.md` - 完整登录保护指南
