-- 用户认证系统数据库表结构

-- 1. 为user_profiles表添加匿名用户支持字段
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS anonymous_expires_at TIMESTAMPTZ;

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_anonymous ON user_profiles(is_anonymous);
CREATE INDEX IF NOT EXISTS idx_user_profiles_anonymous_expires ON user_profiles(anonymous_expires_at) WHERE is_anonymous = TRUE;

-- 2. 创建用户个性化设置表
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  preferred_question_type TEXT DEFAULT 'text' CHECK (preferred_question_type IN ('text', 'audio')),
  preferred_answer_type TEXT DEFAULT 'choice' CHECK (preferred_answer_type IN ('choice', 'fill')),
  preferred_difficulty TEXT DEFAULT 'easy' CHECK (preferred_difficulty IN ('easy', 'medium', 'hard')),
  preferred_strategy TEXT DEFAULT 'sequential' CHECK (preferred_strategy IN ('sequential', 'random')),
  audio_volume FLOAT DEFAULT 0.8 CHECK (audio_volume >= 0 AND audio_volume <= 1),
  auto_play_audio BOOLEAN DEFAULT TRUE,
  show_hints BOOLEAN DEFAULT TRUE,
  session_length INTEGER DEFAULT 10,
  daily_goal INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- 启用RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略：用户只能访问自己的设置
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
  USING (auth.uid() = user_id);

-- 3. 创建用户学习统计表
CREATE TABLE IF NOT EXISTS user_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  total_games INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  total_correct INTEGER DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  average_score FLOAT DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_study_time INTEGER DEFAULT 0,
  last_played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_user_statistics_user_id ON user_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_statistics_last_played ON user_statistics(last_played_at);

-- 启用RLS
ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略：用户只能访问自己的统计
CREATE POLICY "Users can view their own statistics"
  ON user_statistics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own statistics"
  ON user_statistics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own statistics"
  ON user_statistics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own statistics"
  ON user_statistics FOR DELETE
  USING (auth.uid() = user_id);

-- 4. 创建数据迁移日志表
CREATE TABLE IF NOT EXISTS data_migration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  migration_type TEXT NOT NULL,
  data_type TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  migration_status TEXT DEFAULT 'pending' CHECK (migration_status IN ('pending', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_data_migration_log_user_id ON data_migration_log(user_id);
CREATE INDEX IF NOT EXISTS idx_data_migration_log_status ON data_migration_log(migration_status);

-- 启用RLS
ALTER TABLE data_migration_log ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略：用户只能访问自己的迁移日志
CREATE POLICY "Users can view their own migration logs"
  ON data_migration_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own migration logs"
  ON data_migration_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);
