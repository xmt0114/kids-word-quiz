-- Migration: create_user_settings_table
-- Created at: 1762306981

-- 创建user_settings表（用户个性化设置）
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  preferred_question_type TEXT DEFAULT 'text',
  preferred_answer_type TEXT DEFAULT 'choice',
  preferred_difficulty TEXT DEFAULT 'easy',
  preferred_strategy TEXT DEFAULT 'sequential',
  audio_volume FLOAT DEFAULT 0.8,
  auto_play_audio BOOLEAN DEFAULT TRUE,
  show_hints BOOLEAN DEFAULT TRUE,
  session_length INTEGER DEFAULT 10,
  daily_goal INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id 
ON user_settings(user_id);

-- 启用RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 删除已存在的策略（如果有）
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON user_settings;

-- 创建RLS策略
CREATE POLICY "Users can view their own settings" 
ON user_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" 
ON user_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
ON user_settings FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" 
ON user_settings FOR DELETE 
USING (auth.uid() = user_id);;