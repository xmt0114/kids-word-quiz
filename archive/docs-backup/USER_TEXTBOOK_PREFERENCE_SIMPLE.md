# ✅ 用户教材偏好同步功能 - 简化实现

## 🎯 功能概述

本功能实现了用户教材选择的自动同步，使用现有的 `user_profiles.settings` 字段（JSONB格式）存储用户的教材偏好，无需数据库迁移。

## ✨ 核心优势

- ✅ **无需数据库迁移** - 直接使用现有的 `settings` 字段
- ✅ **简单高效** - 使用 JSON 格式存储，可扩展
- ✅ **即时生效** - 登录后立即加载用户偏好
- ✅ **优先级明确** - 用户偏好具有最高优先级

## 📊 优先级体系

```
优先级顺序：
┌─────────────────────────────────────────┐
│ 1️⃣ 用户个人偏好 (profile.settings)        │  ← 最高优先级
│    ↓ 不存在时，回退到                      │
│ 2️⃣ 服务器配置 (app_config)               │
│    ↓ 不存在时，回退到                      │
│ 3️⃣ 硬编码默认值                          │  ← 最低优先级
└─────────────────────────────────────────┘
```

## 💾 数据存储格式

在 `user_profiles.settings` 字段中存储用户偏好：

```json
{
  "preferred_textbook_id": "11111111-1111-1111-1111-111111111111",
  "other_settings": {
    "theme": "light",
    "language": "zh"
  }
}
```

## 🔧 实现细节

### 1. 更新用户偏好

**文件**: `src/hooks/useAuth.ts`

```typescript
const updatePreferredTextbook = async (textbookId: string) => {
  // 获取当前 settings
  const { data: currentProfile } = await supabase
    .from('user_profiles')
    .select('settings')
    .eq('id', user.id)
    .single()

  // 更新 settings，添加 preferred_textbook_id
  const updatedSettings = {
    ...(currentProfile.settings || {}),
    preferred_textbook_id: textbookId
  }

  // 保存到数据库
  await supabase
    .from('user_profiles')
    .update({ settings: updatedSettings })
    .eq('id', user.id)
}
```

### 2. 加载用户偏好

**文件**: `src/hooks/useLocalStorage.ts`

```typescript
// 优先级：用户个人偏好 > 服务器配置 > 硬编码默认值
const finalCollectionId =
  profile?.settings?.preferred_textbook_id || // 1️⃣ 用户偏好
  defaultCollectionId ||                      // 2️⃣ 服务器配置
  '11111111-1111-1111-1111-111111111111';     // 3️⃣ 硬编码默认
```

### 3. 同步用户选择

**文件**: `src/components/TextbookSelectionPage.tsx`

```typescript
const handleConfirm = async () => {
  // 保存到 localStorage
  localStorage.setItem('last-selected-textbook', selectedId)

  // 如果用户已登录，同步到后端
  if (user) {
    await updatePreferredTextbook(selectedId)
  }
}
```

## 🧪 测试指南

### 测试步骤

#### 1. 登录用户选择教材
1. 启动应用: `npm run dev`
2. 登录用户账户
3. 进入"猜单词" → "设置"
4. 点击"选择教材"
5. 选择教材并确认
6. 检查控制台日志:
   ```
   📚 [TextbookSelection] 用户选择教材: [教材ID]
   🔄 [TextbookSelection] 同步用户教材偏好到后端...
   ✅ [TextbookSelection] 用户教材偏好已保存
   ```

#### 2. 验证登录时加载偏好
1. 退出登录
2. 重新登录
3. 进入"猜单词" → "设置"
4. 检查当前选择的教材是否为您之前选择的教材

#### 3. 验证优先级
1. 登录用户
2. 在浏览器控制台执行:
   ```javascript
   console.log('用户偏好:', profile?.settings?.preferred_textbook_id);
   console.log('当前设置:', settings);
   ```
3. 确认 `settings.collectionId` 等于 `profile.settings.preferred_textbook_id`

### 数据库查询验证

```sql
-- 查看用户的设置（包含教材偏好）
SELECT id, display_name, settings
FROM user_profiles
WHERE settings ? 'preferred_textbook_id';

-- 查看特定用户的详细设置
SELECT settings->'preferred_textbook_id' as preferred_textbook
FROM user_profiles
WHERE id = '用户ID';

-- 统计有教材偏好的用户数
SELECT COUNT(*) as user_count
FROM user_profiles
WHERE settings ? 'preferred_textbook_id';
```

## 🔄 数据流程

```
用户选择教材
    ↓
TextbookSelectionPage.handleConfirm()
    ↓
localStorage.setItem('last-selected-textbook', selectedId)
    ↓
setSettings({ collectionId: selectedId })
    ↓
if (user) {
  updatePreferredTextbook(selectedId)
}
    ↓
获取当前 profile.settings
    ↓
合并: { ...settings, preferred_textbook_id: textbookId }
    ↓
supabase.update({ settings: mergedSettings })
    ↓
profile 状态更新
    ↓
下一次登录时自动加载
```

## 📝 监控日志

### 成功日志
```
🔄 [useAuth] 更新用户教材偏好: {userId: "xxx", textbookId: "yyy"}
✅ [useAuth] 教材偏好更新成功: {settings: {...}}
```

### 错误日志
```
❌ [useAuth] 获取用户资料失败: [error]
❌ [useAuth] 更新教材偏好失败: [error]
```

## 🎓 总结

✅ **简化实现完成**

使用现有的 `settings` 字段存储用户教材偏好，无需数据库迁移：

- ✅ 直接使用 `user_profiles.settings.preferred_textbook_id`
- ✅ 用户选择教材时自动同步到后端
- ✅ 登录时自动加载用户偏好
- ✅ 优先级明确：用户偏好 > 服务器配置 > 硬编码默认值
- ✅ 构建成功，无 TypeScript 错误
- ✅ 开发服务器运行正常

**开发服务器**: http://localhost:5173/

---

**最后更新**: 2025-11-12
**状态**: ✅ 实现完成
