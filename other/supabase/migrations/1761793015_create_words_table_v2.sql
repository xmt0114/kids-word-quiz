-- Migration: create_words_table_v2
-- Created at: 1761793015

-- 创建词汇表
CREATE TABLE IF NOT EXISTS words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL,
  word TEXT NOT NULL,
  definition TEXT NOT NULL,
  audio_text TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  options JSONB NOT NULL DEFAULT '[]',
  answer TEXT NOT NULL,
  hint TEXT,
  pronunciation TEXT,
  example_sentence TEXT,
  image_url TEXT,
  audio_url TEXT,
  word_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_words_collection ON words(collection_id);
CREATE INDEX IF NOT EXISTS idx_words_difficulty ON words(difficulty);
CREATE INDEX IF NOT EXISTS idx_words_word ON words(word);
CREATE INDEX IF NOT EXISTS idx_words_order ON words(collection_id, word_order);

-- 添加更新时间触发器
CREATE TRIGGER update_words_updated_at BEFORE UPDATE ON words
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();;