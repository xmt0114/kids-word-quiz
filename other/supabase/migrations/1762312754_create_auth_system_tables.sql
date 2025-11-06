-- Migration: create_auth_system_tables
-- Created at: 1762312754


-- Apply auth system tables migration
-- Based on auth_system_tables.sql

-- 1. Update user_profiles table for anonymous support (if columns don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='user_profiles' AND column_name='is_anonymous') THEN
    ALTER TABLE user_profiles ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='user_profiles' AND column_name='anonymous_expires_at') THEN
    ALTER TABLE user_profiles ADD COLUMN anonymous_expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_anonymous ON user_profiles(is_anonymous);
CREATE INDEX IF NOT EXISTS idx_user_profiles_anonymous_expires ON user_profiles(anonymous_expires_at) WHERE is_anonymous = TRUE;

-- 2. Create user_statistics table (if not exists)
CREATE TABLE IF NOT EXISTS user_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_user_statistics_user_id ON user_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_statistics_last_played ON user_statistics(last_played_at);

ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_statistics
DROP POLICY IF EXISTS "Users can view their own statistics" ON user_statistics;
CREATE POLICY "Users can view their own statistics"
  ON user_statistics FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own statistics" ON user_statistics;
CREATE POLICY "Users can insert their own statistics"
  ON user_statistics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own statistics" ON user_statistics;
CREATE POLICY "Users can update their own statistics"
  ON user_statistics FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow anonymous users to read/write their stats
DROP POLICY IF EXISTS "Anonymous can manage statistics" ON user_statistics;
CREATE POLICY "Anonymous can manage statistics"
  ON user_statistics FOR ALL
  USING (true);

-- 3. Create data_migration_log table
CREATE TABLE IF NOT EXISTS data_migration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  migration_type TEXT NOT NULL,
  data_type TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  migration_status TEXT DEFAULT 'pending' CHECK (migration_status IN ('pending', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_migration_log_user_id ON data_migration_log(user_id);
CREATE INDEX IF NOT EXISTS idx_data_migration_log_status ON data_migration_log(migration_status);

ALTER TABLE data_migration_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own migration logs" ON data_migration_log;
CREATE POLICY "Users can view their own migration logs"
  ON data_migration_log FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own migration logs" ON data_migration_log;
CREATE POLICY "Users can insert their own migration logs"
  ON data_migration_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow anonymous access
DROP POLICY IF EXISTS "Anonymous can manage migration logs" ON data_migration_log;
CREATE POLICY "Anonymous can manage migration logs"
  ON data_migration_log FOR ALL
  USING (true);
;