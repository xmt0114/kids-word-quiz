-- Migration: add_textbook_fields
-- Created at: 1761810524

-- 扩展word_collections表，添加教材相关字段
ALTER TABLE word_collections ADD COLUMN IF NOT EXISTS textbook_version VARCHAR(50);
ALTER TABLE word_collections ADD COLUMN IF NOT EXISTS grade_level VARCHAR(20);
ALTER TABLE word_collections ADD COLUMN IF NOT EXISTS semester VARCHAR(20);

-- 扩展words表，添加教材相关字段
ALTER TABLE words ADD COLUMN IF NOT EXISTS phonetic VARCHAR(100);
ALTER TABLE words ADD COLUMN IF NOT EXISTS unit_number INTEGER;
ALTER TABLE words ADD COLUMN IF NOT EXISTS theme VARCHAR(50);

-- 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_words_collection_unit ON words(collection_id, unit_number);
CREATE INDEX IF NOT EXISTS idx_words_theme ON words(theme);;