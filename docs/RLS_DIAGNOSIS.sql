-- RLS 诊断脚本
-- 此脚本帮助诊断为什么登录后无法获取教材和单词数据

-- ==========================================
-- 诊断1: 检查当前用户状态
-- ==========================================

SELECT
  'AUTH_STATUS' as check_type,
  auth.uid() as user_id,
  auth.role() as user_role,
  CASE
    WHEN auth.uid() IS NULL THEN '❌ 未登录'
    ELSE '✅ 已登录'
  END as login_status;

-- ==========================================
-- 诊断2: 检查表是否存在
-- ==========================================

SELECT
  'TABLE_EXISTS' as check_type,
  t.tablename as table_name,
  'EXISTS' as status
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.tablename IN ('word_collections', 'words', 'user_profiles', 'user_settings', 'user_statistics')
ORDER BY t.tablename;

-- ==========================================
-- 诊断3: 检查RLS是否启用
-- ==========================================

SELECT
  'RLS_STATUS' as check_type,
  t.tablename as table_name,
  CASE t.rowsecurity
    WHEN true THEN '✅ RLS已启用'
    ELSE '❌ RLS未启用'
  END as rls_status,
  (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.tablename IN ('word_collections', 'words', 'user_profiles', 'user_settings', 'user_statistics')
ORDER BY t.tablename;

-- ==========================================
-- 诊断4: 检查现有RLS策略
-- ==========================================

SELECT
  'RLS_POLICIES' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('word_collections', 'words', 'user_profiles')
ORDER BY tablename, policyname;

-- ==========================================
-- 诊断5: 测试数据访问 - word_collections
-- ==========================================

SELECT
  'WORD_COLLECTIONS_ACCESS' as check_type,
  COUNT(*) as total_rows,
  CASE
    WHEN COUNT(*) = 0 THEN '❌ 无法访问数据 - RLS策略阻止或无数据'
    ELSE '✅ 可以访问数据'
  END as access_status
FROM word_collections;

-- 如果上面查询成功，显示部分数据
SELECT
  'WORD_COLLECTIONS_DATA' as check_type,
  id,
  name,
  grade_level,
  word_count,
  is_public
FROM word_collections
LIMIT 3;

-- ==========================================
-- 诊断6: 测试数据访问 - words
-- ==========================================

SELECT
  'WORDS_ACCESS' as check_type,
  COUNT(*) as total_rows,
  CASE
    WHEN COUNT(*) = 0 THEN '❌ 无法访问数据 - RLS策略阻止或无数据'
    ELSE '✅ 可以访问数据'
  END as access_status
FROM words;

-- 如果上面查询成功，显示部分数据
SELECT
  'WORDS_DATA' as check_type,
  id,
  word,
  definition,
  collection_id
FROM words
LIMIT 3;

-- ==========================================
-- 诊断7: 检查用户资料
-- ==========================================

SELECT
  'USER_PROFILE_ACCESS' as check_type,
  COUNT(*) as profile_count,
  CASE
    WHEN COUNT(*) = 0 THEN '❌ 无法访问用户资料'
    ELSE '✅ 可以访问用户资料'
  END as access_status
FROM user_profiles
WHERE id = auth.uid();

-- 如果上面查询成功，显示用户资料
SELECT
  'USER_PROFILE_DATA' as check_type,
  id,
  display_name,
  role,
  created_at
FROM user_profiles
WHERE id = auth.uid();

-- ==========================================
-- 诊断8: 错误信息查询
-- ==========================================

-- 如果上面的查询返回错误，请查看具体的错误信息
-- 常见错误：
-- 1. "permission denied for table word_collections" - 缺少SELECT权限
-- 2. "new row violates row-level security policy" - 插入/更新被阻止
-- 3. "auth.uid() is not defined" - 用户未认证

-- ==========================================
-- 诊断9: 权限检查
-- ==========================================

-- 检查用户角色
SELECT
  'USER_ROLE' as check_type,
  up.role,
  CASE up.role
    WHEN 'admin' THEN '管理员'
    WHEN 'teacher' THEN '教师'
    WHEN 'parent' THEN '家长'
    WHEN 'student' THEN '学生'
    ELSE '未知角色'
  END as role_description,
  up.display_name
FROM user_profiles up
WHERE up.id = auth.uid();

-- ==========================================
-- 总结和建议
-- ==========================================

-- 如果所有检查都显示✅，说明RLS配置正确
-- 如果有❌，请执行 RLS_QUICK_FIX.sql 脚本
