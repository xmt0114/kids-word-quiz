# 前端默认配置值整理

## 已发现的默认配置

### 1. QuizSettings (游戏设置)
**文件位置**: `src/hooks/useLocalStorage.ts:53-64`, `src/components/GuessWordSettingsPage.tsx:47-56`

```typescript
{
  questionType: 'text',              // 问题类型: 'text' | 'image' | 'audio'
  answerType: 'choice',              // 答案类型: 'choice' | 'input' | 'audio'
  selectionStrategy: 'sequential',   // 选词策略: 'sequential' | 'random' | 'spaced_repetition'
  collectionId: '11111111-1111-1111-1111-111111111111', // 默认教材ID
  tts: {
    lang: 'en-US',                   // TTS语言
    rate: 0.8,                       // 语速 0.1-2.0
    pitch: 1.0,                      // 音调 0-2
    volume: 1.0,                     // 音量 0-1
  }
}
```

### 2. QuizStats (游戏统计)
**文件位置**: `src/hooks/useLocalStorage.ts:71-77`

```typescript
{
  totalGames: 0,           // 总游戏次数
  totalCorrect: 0,         // 总正确数
  bestScore: 0,            // 最高分
  averageScore: 0,         // 平均分
  lastPlayed: null,        // 最后游戏时间
}
```

### 3. 游戏配置常量
**文件位置**: `src/utils/supabaseApi.ts:6`

```typescript
const TOTAL_QUESTIONS = 10;  // 每次游戏题目数
```

### 4. 教材ID常量
**文件位置**: `src/lib/supabase.ts:10`

```typescript
export const DEFAULT_COLLECTION_ID = '11111111-1111-1111-1111-111111111111'
```

### 5. 数据生成配置
**文件位置**: `src/utils/dataUtils.ts:126`

```typescript
generateOptions(correctAnswer: string, allWords: Word[], count: number = 3): string[]  // 选项数量
```

### 6. 单词随机选择配置
**文件位置**: `src/utils/dataUtils.ts:102`

```typescript
getRandomWords(words: Word[], count: number, difficulty?: string, shuffle: boolean = true): Word[]  // 是否打乱
```

## 建议的app_config表结构

```sql
CREATE TABLE app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 索引建议

```sql
-- 按分类查询的配置索引
CREATE INDEX idx_app_config_category ON app_config(category);

-- 更新时间的索引
CREATE INDEX idx_app_config_updated_at ON app_config(updated_at);
```

## 初始配置数据

```sql
-- 插入默认配置
INSERT INTO app_config (key, value, description, category) VALUES

-- 游戏设置默认配置
('default_quiz_settings', '{
  "questionType": "text",
  "answerType": "choice",
  "selectionStrategy": "sequential",
  "collectionId": "11111111-1111-1111-1111-111111111111",
  "tts": {
    "lang": "en-US",
    "rate": 0.8,
    "pitch": 1.0,
    "volume": 1.0
  }
}', '游戏设置的默认配置', 'game'),

-- 游戏统计默认配置
('default_quiz_stats', '{
  "totalGames": 0,
  "totalCorrect": 0,
  "bestScore": 0,
  "averageScore": 0,
  "lastPlayed": null
}', '游戏统计的默认配置', 'game'),

-- 游戏常量配置
('game_constants', '{
  "totalQuestions": 10,
  "optionCount": 3,
  "shuffleWords": true
}', '游戏常量配置', 'game'),

-- 默认教材ID
('default_collection_id', '"11111111-1111-1111-1111-111111111111"', '默认教材集合ID', 'app'),

-- TTS配置
('tts_defaults', '{
  "lang": "en-US",
  "rate": 0.8,
  "pitch": 1.0,
  "volume": 1.0,
  "voiceId": "default"
}', 'TTS语音合成的默认配置', 'audio'),

-- 难度配置
('difficulty_levels', '[
  {"id": "easy", "name": "简单", "description": "适合初学者"},
  {"id": "medium", "name": "中等", "description": "适合有一定基础的学习者"},
  {"id": "hard", "name": "困难", "description": "适合高级学习者"}
]', '难度等级配置', 'game'),

-- 题目类型配置
('question_types', '[
  {"id": "text", "name": "文字题干", "description": "在屏幕上显示题目描述"},
  {"id": "image", "name": "图片题干", "description": "通过图片显示题目"},
  {"id": "audio", "name": "音频题干", "description": "通过语音播放题目"}
]', '题目类型配置', 'game'),

-- 答案类型配置
('answer_types', '[
  {"id": "choice", "name": "选择题", "description": "从选项中选择答案"},
  {"id": "input", "name": "填空题", "description": "手动输入答案"},
  {"id": "audio", "name": "语音答题", "description": "通过语音回答"}
]', '答案类型配置', 'game'),

-- 选词策略配置
('selection_strategies', '[
  {"id": "sequential", "name": "顺序学习", "description": "按顺序学习单词"},
  {"id": "random", "name": "随机学习", "description": "随机选择单词"},
  {"id": "spaced_repetition", "name": "间隔重复", "description": "根据记忆曲线重复学习"}
]', '选词策略配置', 'game');
```

## 前端获取配置方案

```typescript
// hooks/useAppConfig.ts
export function useAppConfig() {
  const [config, setConfig] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('app_config')
          .select('key, value');

        if (error) throw error;

        // 转换为对象
        const configMap = data.reduce((acc, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {} as Record<string, any>);

        setConfig(configMap);
      } catch (error) {
        console.error('Failed to load app config:', error);
        // 使用内置默认值
        setConfig(getBuiltinDefaults());
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  return { config, loading };
}

// 内置默认值（fallback）
function getBuiltinDefaults() {
  return {
    default_quiz_settings: {
      questionType: 'text',
      answerType: 'choice',
      selectionStrategy: 'sequential',
      collectionId: '11111111-1111-1111-1111-111111111111',
      tts: {
        lang: 'en-US',
        rate: 0.8,
        pitch: 1.0,
        volume: 1.0
      }
    },
    game_constants: {
      totalQuestions: 10,
      optionCount: 3,
      shuffleWords: true
    },
    // ... 其他默认值
  };
}
```

## 使用示例

```typescript
// 获取默认游戏设置
const { config } = useAppConfig();
const defaultSettings = config.default_quiz_settings || getBuiltinDefaults().default_quiz_settings;

// 获取游戏常量
const TOTAL_QUESTIONS = config.game_constants?.totalQuestions || 10;

// 获取TTS配置
const ttsDefaults = config.tts_defaults || {
  lang: 'en-US',
  rate: 0.8,
  pitch: 1.0,
  volume: 1.0
};
```

## 优势

1. **统一管理**: 所有默认配置集中在数据库中
2. **热更新**: 无需重新部署即可修改配置
3. **分层配置**: 后端配置 > 前端默认 > 内置fallback
4. **可维护性**: 清晰的数据结构，易于管理
5. **可扩展性**: 支持JSONB，可以存储复杂对象
