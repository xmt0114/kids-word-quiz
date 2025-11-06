-- Migration: create_word_collections_table
-- Created at: 1761792937

-- 创建词汇集合表
CREATE TABLE IF NOT EXISTS word_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('textbook', 'theme', 'custom')),
  textbook_type TEXT,
  grade_level TEXT,
  theme TEXT,
  is_public BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  icon_url TEXT,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_collections_category ON word_collections(category);
CREATE INDEX IF NOT EXISTS idx_collections_textbook ON word_collections(textbook_type);
CREATE INDEX IF NOT EXISTS idx_collections_theme ON word_collections(theme);
CREATE INDEX IF NOT EXISTS idx_collections_creator ON word_collections(created_by);
CREATE INDEX IF NOT EXISTS idx_collections_public ON word_collections(is_public);

-- 添加更新时间触发器
CREATE TRIGGER update_word_collections_updated_at BEFORE UPDATE ON word_collections
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();;