# 清除测试用户指南

## 方法1：Supabase后台操作（推荐）

1. **登录Supabase Dashboard**
   - 访问：https://supabase.com/dashboard
   - 进入项目：**apgzgtfxkkzygkkmsywg**
   - 左侧菜单点击 **"Authentication"**
   - 点击 **"Users"** 子菜单

2. **删除用户**
   - 找到要删除的用户
   - 点击用户行右侧的 **"⋮"** 三个点按钮
   - 选择 **"Delete user"**
   - 确认删除

3. **自动清理**
   由于有外键约束，删除auth.users记录时会自动删除：
   - user_profiles表中的记录
   - user_settings表中的记录
   - user_statistics表中的记录
   - learning_progress表中的记录

---

## 方法2：通过SQL查询

### 查询所有测试用户
```sql
SELECT
  u.id,
  u.email,
  u.created_at,
  p.display_name
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
```

### 批量删除特定用户（根据邮箱）
```sql
-- 删除特定邮箱的用户及其所有关联数据
DELETE FROM auth.users
WHERE email IN (
  'test1@example.com',
  'test2@example.com',
  'test3@example.com'
);
```

### 删除特定时间段的用户
```sql
-- 删除24小时内创建的所有用户（谨慎使用！）
DELETE FROM auth.users
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### 清空所有用户数据（⚠️危险⚠️）
```sql
-- 警告：这会删除所有用户数据！
DELETE FROM auth.users;
```

---

## 方法3：检查数据完整性

删除用户后，可以检查是否有孤儿数据：

```sql
-- 检查是否有孤立的user_profiles记录
SELECT COUNT(*) as orphaned_profiles
FROM user_profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- 检查是否有孤立的user_settings记录
SELECT COUNT(*) as orphaned_settings
FROM user_settings s
LEFT JOIN auth.users u ON s.user_id = u.id
WHERE u.id IS NULL;

-- 检查是否有孤立的user_statistics记录
SELECT COUNT(*) as orphaned_statistics
FROM user_statistics st
LEFT JOIN auth.users u ON st.user_id = u.id
WHERE u.id IS NULL;

-- 检查是否有孤立的learning_progress记录
SELECT COUNT(*) as orphaned_progress
FROM learning_progress lp
LEFT JOIN auth.users u ON lp.user_id = u.id
WHERE u.id IS NULL;
```

---

## 注意事项

1. **删除不可逆**：一旦删除用户，无法恢复
2. **外键约束**：删除auth.users会自动删除关联数据（由于有CASCADE约束）
3. **测试环境**：建议在开发环境先测试删除流程
4. **备份**：删除重要用户前，建议先备份数据
