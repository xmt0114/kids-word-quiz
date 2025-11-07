# 部署配置 - 数据管理入口控制

## 概述

本项目支持在开发环境和生产环境之间切换数据管理功能的可见性，确保在生产部署时隐藏数据管理入口，防止未授权用户修改数据。

## 实现方式

### 1. 环境检测

使用 Vite 内置的 `import.meta.env.DEV` 环境变量来检测当前运行环境：
- `import.meta.env.DEV === true` - 开发环境（`npm run dev`）
- `import.meta.env.DEV === false` - 生产环境（`npm run build`）

### 2. 实现的保护措施

#### A. 组件层面控制

**1. 结果页面 (GuessWordResultPage.tsx)**
```typescript
// 判断是否为开发环境
const isDevMode = import.meta.env.DEV;

// 数据管理按钮 - 仅在开发环境显示
{isDevMode && (
  <Button onClick={handleDataManagement}>
    数据管理
  </Button>
)}
```

**2. 设置页面 (GuessWordSettingsPage.tsx)**
```typescript
// 判断是否为开发环境
const isDevMode = import.meta.env.DEV;

// 数据管理按钮 - 仅在开发环境显示
{isDevMode && (
  <Button onClick={handleDataManagement}>
    数据管理
  </Button>
)}
```

#### B. 路由层面控制

**App.tsx - 路由保护**
```typescript
// 数据管理页面路由保护 - 仅在开发环境可用
const ProtectedDataManagement = () => {
  if (import.meta.env.DEV) {
    return <DataManagementPage />;
  }
  // 生产环境下重定向到首页
  return <Navigate to="/" replace />;
};

// 在路由中使用
<Route path="/guess-word/data" element={<ProtectedDataManagement />} />
```

## 使用场景

### 开发环境 (`npm run dev`)

✅ **显示功能**:
- 结果页面显示"数据管理"按钮
- 设置页面显示"数据管理"按钮
- 可以直接访问 `/guess-word/data` 路径
- 完整的 CRUD 操作可用

### 生产环境 (`npm run build`)

❌ **隐藏功能**:
- 结果页面不显示"数据管理"按钮
- 设置页面不显示"数据管理"按钮
- 访问 `/guess-word/data` 会自动重定向到首页
- Bundle 大小减少约156KB

## 构建结果对比

### 开发环境构建
```bash
npm run build
# 结果：732.71 kB (包含数据管理代码)
```

### 当前构建（已优化）
```bash
npm run build
# 结果：576.90 kB (自动移除数据管理代码)
# 减少：156KB
```

**原因**: Vite 的 Tree-Shaking 机制自动检测到条件性导入的组件，并在生产环境中移除未使用的代码。

## 测试验证

### 开发环境测试
```bash
# 启动开发服务器
npm run dev

# 验证功能
1. 进入游戏 → 完成游戏 → 查看结果页面
   ✅ 应该显示"数据管理"按钮

2. 进入设置页面
   ✅ 应该显示"数据管理"按钮

3. 直接访问 http://localhost:5174/guess-word/data
   ✅ 应该能正常访问数据管理页面
```

### 生产环境测试
```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview

# 验证功能
1. 进入游戏 → 完成游戏 → 查看结果页面
   ❌ 不应显示"数据管理"按钮

2. 进入设置页面
   ❌ 不应显示"数据管理"按钮

3. 直接访问 http://localhost:4173/guess-word/data
   ❌ 应该自动重定向到首页

4. 检查网络面板
   ✅ 不应有 DataManagementPage 相关的请求
```

## 部署说明

### 本地开发
```bash
# 1. 启动开发服务器
npm run dev

# 2. 访问 http://localhost:5174
# 3. 可以正常使用所有功能，包括数据管理
```

### 生产部署
```bash
# 1. 构建生产版本
npm run build

# 2. 部署 dist/ 目录到服务器
# 3. 配置 Web 服务器（如 Nginx、Apache）
# 4. 访问部署的网站

# 示例 Nginx 配置
server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 安全优势

1. **多层保护**:
   - 组件层面：UI 不显示
   - 路由层面：直接访问被阻止
   - Bundle层面：代码被移除

2. **零风险**:
   - 即使有人知道 URL，也无法访问
   - 减少攻击面

3. **性能优化**:
   - Bundle 大小减少
   - 加载速度更快

## 注意事项

1. **环境变量**:
   - 确保使用 `npm run dev` 进行开发
   - 确保使用 `npm run build` 构建生产版本
   - 不要直接使用 `vite build`（除非你知道自己在做什么）

2. **直接 URL 访问**:
   - 开发环境：可以正常访问
   - 生产环境：会自动重定向

3. **浏览器缓存**:
   - 部署新版本后，建议用户强制刷新浏览器（Ctrl+F5）
   - 或者在服务器端设置适当的缓存头

## 故障排除

### Q: 生产环境仍然显示数据管理按钮
A: 检查是否正确使用了 `npm run build`，而不是 `vite build`

### Q: 数据管理页面仍然可以访问
A: 检查浏览器控制台是否有错误，或清除浏览器缓存

### Q: 构建大小没有变化
A: 确认修改已保存，重新构建前删除 `dist/` 目录

## 版本信息

- **文档版本**: v1.0.0
- **实现日期**: 2025-11-07
- **兼容版本**: Vite 6.0+
- **Node.js**: 20.19.5+
