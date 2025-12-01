-- ========================================
-- 游戏文本配置系统 - 数据库迁移脚本
-- ========================================

-- 步骤 1: 检查并添加 text_config 字段(如果不存在)
-- 注意: 如果字段已存在,此语句会被忽略

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'games' 
    AND column_name = 'text_config'
  ) THEN
    ALTER TABLE games ADD COLUMN text_config JSONB;
    RAISE NOTICE 'text_config 字段已添加';
  ELSE
    RAISE NOTICE 'text_config 字段已存在,跳过添加';
  END IF;
END $$;

-- 步骤 2: 为现有游戏添加默认 text_config
-- 只更新 text_config 为 NULL 的记录

UPDATE games
SET text_config = jsonb_build_object(
  'itemName', '单词',
  'itemFieldLabel', '单词',
  'definitionLabel', '定义',
  'audioTextLabel', '音频文本',
  'messages', jsonb_build_object(
    'addSuccess', '添加{itemName}成功',
    'addError', '添加{itemName}失败',
    'updateSuccess', '更新{itemName}成功',
    'updateError', '更新{itemName}失败',
    'deleteConfirm', '确定要删除{itemName}"{name}"吗?',
    'deleteSuccess', '删除{itemName}成功',
    'deleteError', '删除{itemName}失败',
    'loadError', '加载{itemName}失败',
    'batchAddTitle', '批量添加{itemName}',
    'masteredCount', '已掌握 {count} 个{itemName}',
    'learningCount', '正在学习 {count} 个{itemName}'
  )
)
WHERE text_config IS NULL;

-- 步骤 3: 验证更新结果
SELECT 
  id, 
  title, 
  text_config->>'itemName' as item_name,
  text_config IS NOT NULL as has_config
FROM games
ORDER BY created_at;
