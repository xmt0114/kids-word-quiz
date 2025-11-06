-- Migration: enable_public_read_access_to_words
-- Created at: 1761805779

-- 为words表创建允许匿名用户读取的策略
CREATE POLICY "Allow anonymous read access to words" ON words
  FOR SELECT 
  TO anon
  USING (true);

-- 为word_collections表也创建同样的策略
CREATE POLICY "Allow anonymous read access to word_collections" ON word_collections
  FOR SELECT 
  TO anon
  USING (true);;