-- Migration: remove_recursive_role_check_policy
-- Created at: 1761876316

-- 删除导致递归的角色检查策略
DROP POLICY IF EXISTS "Teachers and admins can create" ON word_collections;;