-- 创建默认管理员账户的SQL脚本
-- 注意：这个脚本需要在Supabase后台执行
-- 步骤：
-- 1. 先在应用注册一个管理员账户
-- 2. 获取该账户的ID
-- 3. 执行此脚本将该账户提升为管理员

-- 示例：设置特定用户为管理员（替换 'user-uuid-here' 为实际的用户ID）
-- UPDATE user_profiles
-- SET role = 'admin'
-- WHERE id = 'user-uuid-here';

-- 查询当前所有用户
-- SELECT id, email, display_name, role, created_at
-- FROM user_profiles
-- ORDER BY created_at DESC;

-- 批量设置多个管理员（根据email地址）
-- UPDATE user_profiles
-- SET role = 'admin'
-- WHERE email IN (
--   'admin@example.com',
--   'admin2@example.com'
-- );

-- 为管理员用户添加特殊标记的函数
-- CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
-- RETURNS boolean
-- LANGUAGE sql
-- SECURITY DEFINER
-- AS $$
--   SELECT EXISTS(
--     SELECT 1 FROM user_profiles
--     WHERE id = user_id AND role = 'admin'
--   );
-- $$;
