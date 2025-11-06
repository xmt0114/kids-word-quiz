-- Migration: add_anonymous_user_support_to_user_profiles
-- Created at: 1762306971

-- 添加匿名用户字段到user_profiles表
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS anonymous_expires_at TIMESTAMPTZ;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_anonymous 
ON user_profiles(is_anonymous);

CREATE INDEX IF NOT EXISTS idx_user_profiles_anonymous_expires 
ON user_profiles(anonymous_expires_at) 
WHERE is_anonymous = TRUE;;