-- ========================================
-- App Config 表结构
-- ========================================

CREATE TABLE app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_app_config_category ON app_config(category);
CREATE INDEX idx_app_config_updated_at ON app_config(updated_at);

-- ========================================
-- 插入默认配置数据
-- ========================================

INSERT INTO app_config (key, value, description, category) VALUES

-- ========== 应用级配置 (app) ==========
-- 1. 应用默认设置
('app_settings', '{
  "defaultLanguage": "zh-CN",
  "theme": "light",
  "enableSound": true,
  "autoSave": true
}', '应用级默认设置', 'app'),

-- 2. 默认游戏统计
('default_stats', '{
  "totalGames": 0,
  "totalCorrect": 0,
  "bestScore": 0,
  "averageScore": 0,
  "lastPlayed": null
}', '所有游戏的默认统计配置', 'app'),

-- 3. 游戏通用常量
('game_constants', '{
  "totalQuestions": 10,
  "optionCount": 3,
  "shuffleWords": true,
  "defaultTimeLimit": 300
}', '所有游戏通用的常量配置', 'app'),

-- 4. 默认教材ID
('default_collection_id', '"11111111-1111-1111-1111-111111111111"', '默认教材集合ID', 'app'),

-- 5. TTS语音配置
('tts_defaults', '{
  "lang": "en-US",
  "rate": 0.8,
  "pitch": 1.0,
  "volume": 1.0,
  "voiceId": "default"
}', 'TTS语音合成的默认配置', 'app'),

-- ========== 游戏类型配置 (games) ==========
-- 6. 支持的游戏列表
('supported_games', '[
  {
    "id": "guess_word",
    "name": "猜单词",
    "description": "根据提示猜测单词",
    "category": "vocabulary",
    "enabled": true
  },
  {
    "id": "spelling_bee",
    "name": "拼写蜜蜂",
    "description": "听音拼词游戏",
    "category": "spelling",
    "enabled": false
  },
  {
    "id": "word_match",
    "name": "单词匹配",
    "description": "单词与释义匹配",
    "category": "comprehension",
    "enabled": false
  }
]', '应用中支持的游戏类型列表', 'games'),

-- 7. 猜单词游戏特定设置
('guess_word_settings', '{
  "questionType": "text",
  "answerType": "choice",
  "learningStrategy": "sequential",
  "hintsEnabled": true,
  "showPhonetic": true,
  "showDefinition": true
}', '猜单词游戏的特定配置', 'games'),

-- ========== 通用配置 (universal) ==========
-- 8. 难度等级
('difficulty_levels', '[
  {"id": "easy", "name": "简单", "description": "适合初学者"},
  {"id": "medium", "name": "中等", "description": "适合有一定基础的学习者"},
  {"id": "hard", "name": "困难", "description": "适合高级学习者"}
]', '所有游戏通用的难度等级', 'universal'),

-- 9. 题目类型
('question_types', '[
  {"id": "text", "name": "文字题干", "description": "在屏幕上显示题目描述"},
  {"id": "image", "name": "图片题干", "description": "通过图片显示题目"},
  {"id": "audio", "name": "音频题干", "description": "通过语音播放题目"}
]', '所有游戏通用的题目类型', 'universal'),

-- 10. 答案类型
('answer_types', '[
  {"id": "choice", "name": "选择题", "description": "从选项中选择答案"},
  {"id": "input", "name": "填空题", "description": "手动输入答案"},
  {"id": "audio", "name": "语音答题", "description": "通过语音回答"}
]', '所有游戏通用的答案类型', 'universal'),

-- 11. 学习策略
('learning_strategies', '[
  {"id": "sequential", "name": "顺序学习", "description": "按顺序学习内容"},
  {"id": "random", "name": "随机学习", "description": "随机选择内容"},
  {"id": "spaced_repetition", "name": "间隔重复", "description": "根据记忆曲线重复学习"},
  {"id": "adaptive", "name": "自适应学习", "description": "根据表现调整难度"}
]', '所有游戏通用的学习策略', 'universal');

-- ========================================
-- 验证查询
-- ========================================

-- 查看所有配置（按分类分组）
SELECT category, key, description FROM app_config ORDER BY category, key;

-- 按分类统计配置数量
SELECT category, COUNT(*) as count FROM app_config GROUP BY category ORDER BY category;

-- 查看应用级配置
SELECT * FROM app_config WHERE category = 'app';

-- 查看游戏类型配置
SELECT * FROM app_config WHERE category = 'games';

-- 查看通用配置
SELECT * FROM app_config WHERE category = 'universal';

-- 查看支持的游戏列表
SELECT value->'supported_games' FROM app_config WHERE key = 'supported_games';
