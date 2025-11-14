# 管理员RLS权限设置指南

## 问题

用户账号已改为admin角色，但需要为管理员添加完整的word_collections和words表操作权限（增删改查）。

## 解决方案

### 立即执行（推荐）

在Supabase后台执行以下SQL脚本：

**文件**: `RLS_ADMIN_POLICIES.sql`

执行步骤：
1. 访问 https://supabase.com/dashboard
2. 进入项目 → **SQL Editor**
3. 创建新查询
4. 复制粘贴 `RLS_ADMIN_POLICIES.sql` 文件内容
5. 点击 **Run** 执行

## 关键策略说明

### 1. is_admin() 函数
```sql
-- 创建管理员检查函数
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1 FROM user_profiles
    WHERE id = user_id AND role = 'admin'
  );
$$;
```

**作用**: 检查指定用户ID是否为管理员

### 2. word_collections 表策略

#### 读取权限 (SELECT)
```sql
CREATE POLICY "Allow read access to word_collections"
ON word_collections FOR SELECT
USING (
  is_public = true
  OR auth.uid() = created_by
  OR is_admin(auth.uid())
);
```
✅ 允许读取：公开数据 + 自己创建的数据 + 管理员可读取所有

#### 插入权限 (INSERT)
```sql
CREATE POLICY "Allow admin to insert word_collections"
ON word_collections FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));
```
✅ 只有管理员可以插入新词库

#### 更新权限 (UPDATE)
```sql
CREATE POLICY "Allow admin or creator to update word_collections"
ON word_collections FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by
  OR is_admin(auth.uid())
)
WITH CHECK (
  auth.uid() = created_by
  OR is_admin(auth.uid())
);
```
✅ 管理员或创建者可以更新

#### 删除权限 (DELETE)
```sql
CREATE POLICY "Allow admin to delete word_collections"
ON word_collections FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));
```
✅ 只有管理员可以删除

### 3. words 表策略

类似地，words表也有完整的管理员权限：
- ✅ 管理员可以读取所有单词
- ✅ 管理员可以插入新单词
- ✅ 管理员可以更新单词
- ✅ 管理员可以删除单词

## 验证步骤

执行脚本后，在SQL Editor中运行验证查询：

```sql
-- 1. 检查管理员身份
SELECT is_admin(auth.uid()) as is_admin;

-- 2. 检查word_collections访问
SELECT COUNT(*) FROM word_collections;

-- 3. 检查words访问
SELECT COUNT(*) FROM words;

-- 4. 查看当前用户信息
SELECT display_name, role FROM user_profiles WHERE id = auth.uid();
```

## 测试结果

如果验证查询都成功，说明：

✅ **管理员权限已正确配置**
- 可以读取所有词库和单词
- 可以插入新的词库和单词
- 可以更新任何词库和单词
- 可以删除词库和单词

✅ **普通用户权限正常**
- 只能读取公开词库
- 只能管理自己的设置和统计

## 常见问题

### Q: 执行脚本后仍然无法访问数据？

**A**: 检查以下几点：
1. 确认账号的role字段确实是'admin'（大写）
2. 刷新页面重新登录
3. 查看SQL执行结果是否有错误

### Q: 如何确认我是管理员？

**A**: 执行查询：
```sql
SELECT display_name, role FROM user_profiles WHERE id = auth.uid();
```
如果返回role = 'admin'，说明已经是管理员。

### Q: 可以临时禁用RLS吗？

**A**: 可以，但仅用于调试：
```sql
ALTER TABLE word_collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE words DISABLE ROW LEVEL SECURITY;
```
**注意**: 禁用RLS会降低安全性，完成调试后记得重新启用并配置策略。

## 注意事项

1. **安全性**: is_admin()函数使用`SECURITY DEFINER`确保安全
2. **性能**: 函数标记为`STABLE`以优化性能
3. **兼容性**: 策略兼容现有的非管理员用户
4. **维护性**: 脚本包含清理步骤，可重复执行

## 下一步

完成RLS配置后，你可以：

1. **管理词库**: 在应用中添加、编辑、删除词库
2. **管理单词**: 在应用中添加、编辑、删除单词
3. **数据导入**: 从外部数据源导入词库数据
4. **用户管理**: 管理系统中的所有用户

需要我协助你执行其他操作吗？
