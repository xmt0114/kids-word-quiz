-- Migration: fix_anonymous_write_permissions
-- Created at: 1761827029

-- 为匿名用户添加写入权限

-- 1. 为 word_collections 表添加匿名用户写入权限
CREATE POLICY "Allow anonymous insert on word_collections" 
ON word_collections 
FOR INSERT 
TO anon 
WITH CHECK (true);

CREATE POLICY "Allow anonymous update on word_collections" 
ON word_collections 
FOR UPDATE 
TO anon 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on word_collections" 
ON word_collections 
FOR DELETE 
TO anon 
USING (true);

-- 2. 为 words 表添加匿名用户写入权限
CREATE POLICY "Allow anonymous insert on words" 
ON words 
FOR INSERT 
TO anon 
WITH CHECK (true);

CREATE POLICY "Allow anonymous update on words" 
ON words 
FOR UPDATE 
TO anon 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on words" 
ON words 
FOR DELETE 
TO anon 
USING (true);

-- 3. 验证权限设置
COMMENT ON POLICY "Allow anonymous insert on word_collections" ON word_collections IS '允许匿名用户创建教材';
COMMENT ON POLICY "Allow anonymous update on word_collections" ON word_collections IS '允许匿名用户更新教材';
COMMENT ON POLICY "Allow anonymous delete on word_collections" ON word_collections IS '允许匿名用户删除教材';

COMMENT ON POLICY "Allow anonymous insert on words" ON words IS '允许匿名用户创建词汇';
COMMENT ON POLICY "Allow anonymous update on words" ON words IS '允许匿名用户更新词汇';
COMMENT ON POLICY "Allow anonymous delete on words" ON words IS '允许匿名用户删除词汇';;