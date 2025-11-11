-- RLS 快速修复脚本
-- 在Supabase后台 -> SQL Editor -> New query -> 粘贴此脚本 -> 执行

-- ==========================================
-- 步骤1: 检查当前RLS状态
-- ==========================================

-- 查看哪些表启用了RLS
SELECT
  t.tablename,
  t.rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.tablename IN ('word_collections', 'words', 'user_profiles', 'user_settings', 'user_statistics')
ORDER BY t.tablename;

-- 查看当前认证用户
SELECT
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- ==========================================
-- 步骤2: 修复 word_collections 表
-- ==========================================

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Allow public read access on word_collections" ON word_collections;
DROP POLICY IF EXISTS "Allow read access to all word collections" ON word_collections;
DROP POLICY IF EXISTS "Authenticated users can read word_collections" ON word_collections;

-- 添加新策略 - 允许所有认证用户读取
CREATE POLICY "Allow all authenticated users to read word_collections"
ON word_collections FOR SELECT
TO authenticated
USING (true);

-- 如果需要，也可以允许匿名用户读取（如果表有is_public字段）
-- CREATE POLICY "Allow public read on public collections"
-- ON word_collections FOR SELECT
-- USING (is_public = true);

-- ==========================================
-- 步骤3: 修复 words 表
-- ==========================================

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Allow public read access on words" ON words;
DROP POLICY IF EXISTS "Allow read access to all words" ON words;
DROP POLICY IF EXISTS "Authenticated users can read words" ON words;

-- 添加新策略 - 允许所有认证用户读取
CREATE POLICY "Allow all authenticated users to read words"
ON words FOR SELECT
TO authenticated
USING (true);

-- ==========================================
-- 步骤4: 修复 user_profiles 表
-- ==========================================

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- 添加策略 - 用户可以查看所有资料（显示用户名）
CREATE POLICY "Allow all authenticated users to read user_profiles"
ON user_profiles FOR SELECT
TO authenticated
USING (true);

-- 添加策略 - 用户只能更新自己的资料
CREATE POLICY "Allow users to update own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- ==========================================
-- 步骤5: 修复 user_settings 表
-- ==========================================

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Users can manage own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;

-- 添加策略 - 用户只能访问自己的设置
CREATE POLICY "Allow users to manage own settings"
ON user_settings FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- ==========================================
-- 步骤6: 修复 user_statistics 表
-- ==========================================

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Users can manage own statistics" ON user_statistics;
DROP POLICY IF EXISTS "Users can view own statistics" ON user_statistics;

-- 添加策略 - 用户只能访问自己的统计
CREATE POLICY "Allow users to manage own statistics"
ON user_statistics FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- ==========================================
-- 步骤7: 验证修复结果
-- ==========================================

-- 测试查询 - 应该返回数据而不是错误
SELECT 'word_collections' as table_name, COUNT(*) as row_count FROM word_collections
UNION ALL
SELECT 'words' as table_name, COUNT(*) as row_count FROM words
UNION ALL
SELECT 'user_profiles' as table_name, COUNT(*) as row_count FROM user_profiles;

-- 查看当前用户资料
SELECT id, display_name, role, created_at
FROM user_profiles
WHERE id = auth.uid();

-- 如果上面查询成功，说明RLS策略已正确设置
