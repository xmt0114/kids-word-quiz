# RLS (Row Level Security) 策略分析

## 问题症状

用户登录后可以进入游戏页面，但无法获取教材和单词数据，从网络请求看数据为空。

**原因**: 数据库表启用了RLS（行级安全），但缺少允许用户访问数据的策略。

## RLS 概述

### 什么是RLS？

Row Level Security (RLS) 是PostgreSQL/Supabase的安全功能，可以控制用户对表中每一行的访问权限。

- **启用RLS**: 表级安全策略开关
- **RLS策略**: 定义哪些用户可以访问哪些数据行
- **影响范围**: 启用了RLS的表，默认情况下**拒绝所有访问**，直到添加允许策略

## 当前数据库表结构分析

### 1. user_profiles (用户资料)
- **用途**: 存储用户基本信息和角色
- **典型字段**: id, display_name, role, avatar_url, settings
- **RLS状态**: 可能已启用

### 2. word_collections (教材集合)
- **用途**: 存储教材/词库信息
- **典型字段**: id, name, description, grade_level, word_count, is_public
- **RLS状态**: **高概率已启用** - 这就是问题所在！

### 3. words (单词表)
- **用途**: 存储具体单词数据
- **典型字段**: id, collection_id, word, definition, example
- **RLS状态**: **高概率已启用** - 数据无法获取的直接原因！

### 4. user_settings (用户设置)
- **用途**: 存储用户个性化设置
- **RLS状态**: 可能有RLS保护

### 5. user_statistics (用户统计)
- **用途**: 存储学习进度和统计
- **RLS状态**: 可能有RLS保护

## RLS 策略设计

### 策略1: 公共数据访问 (word_collections, words)

```sql
-- 允许所有人读取公共词库数据
CREATE POLICY "Allow public read access on word_collections"
ON word_collections FOR SELECT
USING (is_public = true);

-- 允许访问属于公共词库的单词
CREATE POLICY "Allow public read access on words"
ON words FOR SELECT
USING (
  collection_id IN (
    SELECT id FROM word_collections WHERE is_public = true
  )
);
```

### 策略2: 用户私有数据访问 (user_profiles, user_settings, user_statistics)

```sql
-- 用户只能访问自己的资料
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = id);

-- 用户只能更新自己的资料
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = id);

-- 用户只能访问自己的设置
CREATE POLICY "Users can view own settings"
ON user_settings FOR SELECT
USING (auth.uid() = user_id);

-- 用户只能访问自己的统计
CREATE POLICY "Users can view own statistics"
ON user_statistics FOR SELECT
USING (auth.uid() = user_id);
```

### 策略3: 管理员访问

```sql
-- 管理员可以访问所有数据
CREATE POLICY "Admins can view all data"
ON word_collections FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

## 立即解决方案

### 方案1: 在Supabase后台执行SQL (推荐)

**步骤1: 检查当前RLS状态**

```sql
-- 查看哪些表启用了RLS
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 查看每个表的策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**步骤2: 添加公共数据访问策略**

```sql
-- 为 word_collections 表添加策略
CREATE POLICY "Allow read access to all word collections"
ON word_collections FOR SELECT
USING (true);

-- 为 words 表添加策略
CREATE POLICY "Allow read access to all words"
ON words FOR SELECT
USING (true);
```

**步骤3: 验证数据访问**

```sql
-- 测试查询
SELECT COUNT(*) FROM word_collections;
SELECT COUNT(*) FROM words;
```

### 方案2: 临时禁用RLS (仅用于调试)

```sql
-- 临时禁用RLS（不推荐生产环境使用）
ALTER TABLE word_collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE words DISABLE ROW LEVEL SECURITY;
```

**注意**: 禁用RLS会降低安全性，仅用于快速验证问题。

## 推荐的生产环境策略

### 1. 公共词库 + 用户私有数据

```sql
-- word_collections 表
CREATE POLICY "Public collections are viewable by everyone"
ON word_collections FOR SELECT
USING (is_public = true);

CREATE POLICY "Admins can manage all collections"
ON word_collections FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- words 表
CREATE POLICY "Words in public collections are viewable"
ON words FOR SELECT
USING (
  collection_id IN (
    SELECT id FROM word_collections WHERE is_public = true
  )
);

-- user_profiles 表
CREATE POLICY "Users can view all profiles"
ON user_profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = id);

-- user_settings 表
CREATE POLICY "Users can manage own settings"
ON user_settings FOR ALL
USING (auth.uid() = user_id);

-- user_statistics 表
CREATE POLICY "Users can manage own statistics"
ON user_statistics FOR ALL
USING (auth.uid() = user_id);
```

### 2. 严格权限控制

```sql
-- 仅允许认证用户访问数据
CREATE POLICY "Authenticated users can read word_collections"
ON word_collections FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can read words"
ON words FOR SELECT
TO authenticated
USING (true);
```

## 调试步骤

### 1. 检查RLS是否启用

```sql
-- 在Supabase SQL Editor中执行
SELECT
  t.tablename,
  t.rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.tablename IN ('word_collections', 'words', 'user_profiles')
ORDER BY t.tablename;
```

### 2. 检查当前用户身份

```sql
-- 查看当前认证用户
SELECT
  auth.uid() as current_user_id,
  auth.role() as current_role;
```

### 3. 测试数据访问

```sql
-- 测试查询 word_collections
SELECT id, name, grade_level, is_public
FROM word_collections
LIMIT 5;

-- 测试查询 words
SELECT id, word, definition, collection_id
FROM words
LIMIT 5;
```

### 4. 查看详细错误

在浏览器开发者工具中：
- Network标签页
- 查看失败的API请求
- 查看Supabase返回的详细错误信息

## 常见错误及解决

### 错误1: "new row violates row-level security policy"

**原因**: 插入/更新操作被RLS策略阻止
**解决**: 检查INSERT/UPDATE策略，或临时禁用RLS

### 错误2: "permission denied for table word_collections"

**原因**: 用户没有访问该表的权限
**解决**: 确保用户是authenticated角色，并添加SELECT策略

### 错误3: "auth.uid() is not defined"

**原因**: 策略中使用了auth.uid()，但用户未认证
**解决**: 确保用户已登录，或使用TO authenticated限定策略

## 最佳实践

1. **明确数据分类**:
   - 公共数据 (如词库): 允许所有人或所有认证用户读取
   - 私有数据 (如用户设置): 仅允许用户访问自己的数据
   - 管理员数据: 管理员可以访问所有数据

2. **最小权限原则**:
   - 只给用户必要的访问权限
   - 敏感表启用RLS
   - 定期审查策略

3. **测试策略**:
   - 在开发环境充分测试
   - 验证不同角色的访问权限
   - 测试数据边界情况

4. **文档化**:
   - 记录每个表的RLS策略
   - 说明数据访问流程
   - 维护权限变更历史

## 总结

当前问题最可能的解决方案是：

1. **立即修复**: 在Supabase后台执行SQL，添加允许读取word_collections和words的策略
2. **长期方案**: 设计完整的RLS策略体系，确保数据安全的同时提供必要访问

需要我帮你执行具体的SQL语句来修复这个问题吗？
