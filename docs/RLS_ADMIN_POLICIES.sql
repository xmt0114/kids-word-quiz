-- 管理员RLS策略完整脚本
-- 此脚本为管理员用户添加完整的word_collections和words表操作权限

-- ==========================================
-- 步骤1: 创建管理员检查函数
-- ==========================================

-- 创建函数判断用户是否为管理员
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

-- ==========================================
-- 步骤2: 删除可能存在的旧策略
-- ==========================================

-- word_collections表策略清理
DROP POLICY IF EXISTS "Allow all authenticated users to read word_collections" ON word_collections;
DROP POLICY IF EXISTS "Allow public read access on word_collections" ON word_collections;
DROP POLICY IF EXISTS "Allow read access to all word collections" ON word_collections;
DROP POLICY IF EXISTS "Authenticated users can read word_collections" ON word_collections;
DROP POLICY IF EXISTS "Admins can manage all collections" ON word_collections;
DROP POLICY IF EXISTS "Admin can do everything on word_collections" ON word_collections;
DROP POLICY IF EXISTS "Public collections are viewable by everyone" ON word_collections;

-- words表策略清理
DROP POLICY IF EXISTS "Allow all authenticated users to read words" ON words;
DROP POLICY IF EXISTS "Allow public read access on words" ON words;
DROP POLICY IF EXISTS "Allow read access to all words" ON words;
DROP POLICY IF EXISTS "Authenticated users can read words" ON words;
DROP POLICY IF EXISTS "Words in public collections are viewable" ON words;
DROP POLICY IF EXISTS "Admin can do everything on words" ON words;
DROP POLICY IF EXISTS "Public collections words are viewable" ON words;

-- ==========================================
-- 步骤3: word_collections表策略
-- ==========================================

-- 策略1: 所有人可以读取公开或由管理员创建的数据
CREATE POLICY "Allow read access to word_collections"
ON word_collections FOR SELECT
USING (
  -- 允许读取条件：
  -- 1. 是公开数据 (is_public = true)
  -- 2. 或者创建者是当前用户
  -- 3. 或者当前用户是管理员
  is_public = true
  OR auth.uid() = created_by
  OR is_admin(auth.uid())
);

-- 策略2: 管理员可以插入数据
CREATE POLICY "Allow admin to insert word_collections"
ON word_collections FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

-- 策略3: 管理员或创建者可以更新数据
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

-- 策略4: 管理员可以删除数据
CREATE POLICY "Allow admin to delete word_collections"
ON word_collections FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- ==========================================
-- 步骤4: words表策略
-- ==========================================

-- 策略1: 所有人可以读取单词
CREATE POLICY "Allow read access to words"
ON words FOR SELECT
USING (
  -- 允许读取条件：
  -- 1. 所属词库是公开的
  -- 2. 或者用户是该词库的创建者
  -- 3. 或者当前用户是管理员
  collection_id IN (
    SELECT id FROM word_collections
    WHERE is_public = true
    OR created_by = auth.uid()
    OR is_admin(auth.uid())
  )
);

-- 策略2: 管理员可以插入单词
CREATE POLICY "Allow admin to insert words"
ON words FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

-- 策略3: 管理员可以更新单词
CREATE POLICY "Allow admin to update words"
ON words FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 策略4: 管理员可以删除单词
CREATE POLICY "Allow admin to delete words"
ON words FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- ==========================================
-- 步骤5: 其他表的策略（确保正常访问）
-- ==========================================

-- user_profiles表策略
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow all authenticated users to read user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON user_profiles;

CREATE POLICY "Allow read all user profiles"
ON user_profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow users to update own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- user_settings表策略
DROP POLICY IF EXISTS "Users can manage own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;

CREATE POLICY "Allow users to manage own settings"
ON user_settings FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- user_statistics表策略
DROP POLICY IF EXISTS "Users can manage own statistics" ON user_statistics;
DROP POLICY IF EXISTS "Users can view own statistics" ON user_statistics;

CREATE POLICY "Allow users to manage own statistics"
ON user_statistics FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 步骤6: 验证管理员权限
-- ==========================================

-- 测试查询1: 检查is_admin函数
SELECT
  'CHECK_ADMIN_FUNCTION' as test_name,
  is_admin(auth.uid()) as is_current_user_admin,
  auth.uid() as current_user_id;

-- 测试查询2: 验证word_collections表访问
SELECT
  'TEST_WORD_COLLECTIONS_ACCESS' as test_name,
  COUNT(*) as total_collections,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ 可以访问word_collections表'
    ELSE '❌ 无法访问word_collections表'
  END as access_status
FROM word_collections;

-- 测试查询3: 验证words表访问
SELECT
  'TEST_WORDS_ACCESS' as test_name,
  COUNT(*) as total_words,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ 可以访问words表'
    ELSE '❌ 无法访问words表'
  END as access_status
FROM words;

-- 测试查询4: 查看当前用户角色
SELECT
  'USER_ROLE_CHECK' as test_name,
  up.display_name,
  up.role,
  CASE
    WHEN up.role = 'admin' THEN '✅ 当前用户是管理员'
    ELSE '❌ 当前用户不是管理员'
  END as admin_status
FROM user_profiles up
WHERE up.id = auth.uid();

-- ==========================================
-- 步骤7: 管理员操作测试（可选）
-- ==========================================

-- 注意：以下语句是测试用的，可以选择性执行

-- 测试插入word_collections（需要替换值为实际值）
-- INSERT INTO word_collections (id, name, description, is_public, created_by)
-- VALUES (
--   gen_random_uuid(),
--   '测试词库',
--   '这是一个测试词库',
--   true,
--   auth.uid()
-- );

-- 测试插入words（需要替换collection_id为实际值）
-- INSERT INTO words (id, collection_id, word, definition, example)
-- VALUES (
--   gen_random_uuid(),
--   'collection-uuid-here',
--   'test',
--   '测试单词',
--   'This is a test example.'
-- );

-- ==========================================
-- 完成提示
-- ==========================================

-- 如果所有测试都显示✅，说明RLS策略已正确配置
-- 管理员现在可以：
-- 1. 读取所有公开和私有的词库数据
-- 2. 插入新的词库和单词
-- 3. 更新任何词库和单词
-- 4. 删除任何词库和单词

-- 普通用户可以：
-- 1. 读取公开的词库和单词
-- 2. 访问自己的用户资料
-- 3. 管理自己的设置和统计
