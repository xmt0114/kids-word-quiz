# 儿童答题系统数据库架构设计

## 设计原则
1. 符合Supabase免费额度限制（500MB数据库，50,000行数据）
2. 使用Row Level Security (RLS)实现权限控制
3. 不使用外键约束，手动处理关联数据
4. 优化查询性能，合理使用索引

## 用户权限层级
- `admin`: 管理员 - 系统配置、全部权限
- `teacher`: 老师 - 班级管理、题目创建
- `parent`: 家长 - 查看孩子进度
- `student`: 学生 - 答题学习

---

## 核心表结构

### 1. user_profiles (用户资料表)
扩展Supabase Auth用户信息

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'parent', 'student')),
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  parent_id UUID, -- 家长ID（学生专用）
  teacher_id UUID, -- 老师ID（学生专用）
  grade TEXT, -- 年级（学生专用）
  settings JSONB DEFAULT '{}', -- 用户设置
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_parent ON user_profiles(parent_id);
CREATE INDEX idx_user_profiles_teacher ON user_profiles(teacher_id);
```

### 2. word_collections (词汇集合表)
教材分类和自定义词汇集合

```sql
CREATE TABLE word_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- 集合名称
  description TEXT, -- 描述
  category TEXT NOT NULL, -- 分类：textbook/theme/custom
  textbook_type TEXT, -- 教材类型：pep/ket/oxford等
  grade_level TEXT, -- 年级：3-6
  theme TEXT, -- 主题：animals/verbs/food等
  is_public BOOLEAN DEFAULT true, -- 是否公开
  created_by UUID NOT NULL, -- 创建者ID
  icon_url TEXT, -- 图标URL
  word_count INTEGER DEFAULT 0, -- 词汇数量
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_collections_category ON word_collections(category);
CREATE INDEX idx_collections_textbook ON word_collections(textbook_type);
CREATE INDEX idx_collections_theme ON word_collections(theme);
CREATE INDEX idx_collections_creator ON word_collections(created_by);
```

### 3. words (词汇表)
单词数据和题型配置

```sql
CREATE TABLE words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL, -- 所属集合
  word TEXT NOT NULL, -- 单词
  definition TEXT NOT NULL, -- 文字题干
  audio_text TEXT NOT NULL, -- 音频题干
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  options JSONB NOT NULL DEFAULT '[]', -- 选择题选项
  answer TEXT NOT NULL, -- 正确答案
  hint TEXT, -- 填空题提示
  pronunciation TEXT, -- 音标
  example_sentence TEXT, -- 例句
  image_url TEXT, -- 配图URL
  audio_url TEXT, -- 音频URL
  word_order INTEGER DEFAULT 0, -- 词汇顺序
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_words_collection ON words(collection_id);
CREATE INDEX idx_words_difficulty ON words(difficulty);
CREATE INDEX idx_words_word ON words(word);
```

### 4. quiz_sessions (答题会话表)
记录每次答题会话

```sql
CREATE TABLE quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- 答题用户
  collection_id UUID NOT NULL, -- 词汇集合
  question_type TEXT NOT NULL CHECK (question_type IN ('text', 'audio')),
  answer_type TEXT NOT NULL CHECK (answer_type IN ('choice', 'fill')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  percentage INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER, -- 答题时长（秒）
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON quiz_sessions(user_id);
CREATE INDEX idx_sessions_collection ON quiz_sessions(collection_id);
CREATE INDEX idx_sessions_completed ON quiz_sessions(completed_at);
```

### 5. user_answers (用户答题记录表)
每道题的答题记录

```sql
CREATE TABLE user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL, -- 会话ID
  user_id UUID NOT NULL, -- 用户ID
  word_id UUID NOT NULL, -- 单词ID
  user_answer TEXT NOT NULL, -- 用户答案
  correct_answer TEXT NOT NULL, -- 正确答案
  is_correct BOOLEAN NOT NULL, -- 是否正确
  answer_time_seconds INTEGER, -- 答题时长
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_answers_session ON user_answers(session_id);
CREATE INDEX idx_answers_user ON user_answers(user_id);
CREATE INDEX idx_answers_word ON user_answers(word_id);
CREATE INDEX idx_answers_correct ON user_answers(is_correct);
```

### 6. learning_progress (学习进度表)
用户词汇学习进度统计

```sql
CREATE TABLE learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- 用户ID
  word_id UUID NOT NULL, -- 单词ID
  collection_id UUID NOT NULL, -- 集合ID
  practice_count INTEGER DEFAULT 0, -- 练习次数
  correct_count INTEGER DEFAULT 0, -- 答对次数
  last_practiced_at TIMESTAMPTZ, -- 最后练习时间
  mastery_level TEXT DEFAULT 'new' CHECK (mastery_level IN ('new', 'learning', 'familiar', 'mastered')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word_id)
);

CREATE INDEX idx_progress_user ON learning_progress(user_id);
CREATE INDEX idx_progress_word ON learning_progress(word_id);
CREATE INDEX idx_progress_collection ON learning_progress(collection_id);
CREATE INDEX idx_progress_mastery ON learning_progress(mastery_level);
```

### 7. question_types (题型配置表)
系统支持的题型定义

```sql
CREATE TABLE question_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Row Level Security (RLS) 策略

### user_profiles 表
```sql
-- 启用RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的资料
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- 用户可以更新自己的资料
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- 管理员可以查看所有用户
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 老师可以查看自己的学生
CREATE POLICY "Teachers can view their students"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
    AND teacher_id = auth.uid()
  );

-- 家长可以查看自己的孩子
CREATE POLICY "Parents can view their children"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'parent'
    )
    AND parent_id = auth.uid()
  );
```

### word_collections 表
```sql
ALTER TABLE word_collections ENABLE ROW LEVEL SECURITY;

-- 所有人可以查看公开集合
CREATE POLICY "Public collections are viewable by all"
  ON word_collections FOR SELECT
  USING (is_public = true);

-- 创建者可以查看自己的私有集合
CREATE POLICY "Creators can view own collections"
  ON word_collections FOR SELECT
  USING (created_by = auth.uid());

-- 管理员和老师可以创建集合
CREATE POLICY "Teachers and admins can create collections"
  ON word_collections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- 创建者和管理员可以更新集合
CREATE POLICY "Creators and admins can update collections"
  ON word_collections FOR UPDATE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### words 表
```sql
ALTER TABLE words ENABLE ROW LEVEL SECURITY;

-- 所有人可以查看单词
CREATE POLICY "Words are viewable by all authenticated users"
  ON words FOR SELECT
  TO authenticated
  USING (true);

-- 管理员和老师可以创建单词
CREATE POLICY "Teachers and admins can create words"
  ON words FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- 管理员和老师可以更新单词
CREATE POLICY "Teachers and admins can update words"
  ON words FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- 管理员和老师可以删除单词
CREATE POLICY "Teachers and admins can delete words"
  ON words FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### quiz_sessions 表
```sql
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的会话
CREATE POLICY "Users can view own sessions"
  ON quiz_sessions FOR SELECT
  USING (user_id = auth.uid());

-- 家长可以查看孩子的会话
CREATE POLICY "Parents can view children sessions"
  ON quiz_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = user_id AND parent_id = auth.uid()
    )
  );

-- 老师可以查看学生的会话
CREATE POLICY "Teachers can view student sessions"
  ON quiz_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = user_id AND teacher_id = auth.uid()
    )
  );

-- 用户可以创建自己的会话
CREATE POLICY "Users can create own sessions"
  ON quiz_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 用户可以更新自己的会话
CREATE POLICY "Users can update own sessions"
  ON quiz_sessions FOR UPDATE
  USING (user_id = auth.uid());
```

### user_answers 表
```sql
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的答题记录
CREATE POLICY "Users can view own answers"
  ON user_answers FOR SELECT
  USING (user_id = auth.uid());

-- 家长可以查看孩子的答题记录
CREATE POLICY "Parents can view children answers"
  ON user_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = user_id AND parent_id = auth.uid()
    )
  );

-- 老师可以查看学生的答题记录
CREATE POLICY "Teachers can view student answers"
  ON user_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = user_id AND teacher_id = auth.uid()
    )
  );

-- 用户可以创建自己的答题记录
CREATE POLICY "Users can create own answers"
  ON user_answers FOR INSERT
  WITH CHECK (user_id = auth.uid());
```

### learning_progress 表
```sql
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的学习进度
CREATE POLICY "Users can view own progress"
  ON learning_progress FOR SELECT
  USING (user_id = auth.uid());

-- 家长可以查看孩子的学习进度
CREATE POLICY "Parents can view children progress"
  ON learning_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = user_id AND parent_id = auth.uid()
    )
  );

-- 老师可以查看学生的学习进度
CREATE POLICY "Teachers can view student progress"
  ON learning_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = user_id AND teacher_id = auth.uid()
    )
  );

-- 用户可以更新自己的学习进度
CREATE POLICY "Users can update own progress"
  ON learning_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can modify own progress"
  ON learning_progress FOR UPDATE
  USING (user_id = auth.uid());
```

---

## 数据迁移计划

### 阶段1：创建初始数据
1. 创建管理员账号
2. 创建示例用户（老师、家长、学生各1个）
3. 创建默认词汇集合（从words.json导入）
4. 设置question_types基础数据

### 阶段2：导入现有数据
1. 创建"示例词汇集合"（10个单词）
2. 关联词汇到集合
3. 验证数据完整性

---

## 数据库优化策略

### 1. 索引优化
- 所有外键字段创建索引
- 频繁查询的字段（如role, difficulty等）创建索引
- 使用复合索引优化多条件查询

### 2. 查询优化
- 使用maybeSingle()替代single()
- 手动fetch关联数据，避免复杂JOIN
- 合理使用分页（limit + offset）

### 3. 免费额度管理
- 限制单个集合最多1000个单词
- 定期清理旧的答题会话（保留最近30天）
- 答题记录按需加载，避免一次性查询大量数据

---

## 扩展性设计

### 未来功能预留
1. `word_tags` 表 - 单词标签系统
2. `study_plans` 表 - 学习计划
3. `achievements` 表 - 成就系统
4. `class_groups` 表 - 班级管理
5. `notifications` 表 - 通知系统

### 题型扩展
通过`question_types`表的`settings` JSONB字段支持：
- 图片识别题
- 听力填空题
- 拼写组合题
- 句子翻译题
