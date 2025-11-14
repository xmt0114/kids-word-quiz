# localStorage数据同步到数据库设计方案

## 1. 问题分析

### 当前localStorage中可能存储的数据

#### 1.1 用户设置相关
```javascript
// quiz-settings
{
  questionType: 'text',
  answerType: 'choice',
  selectionStrategy: 'sequential',
  collectionId: 'uuid',
  tts: {
    lang: 'en-US',
    rate: 0.8,
    pitch: 1.0,
    volume: 1.0,
  }
}

// last-selected-textbook: 'uuid'
```

#### 1.2 学习进度相关
```javascript
// learning-progress
{
  'collection-id-1': {
    offset: 15,
    total: 100,
    lastUpdated: '2024-01-01T00:00:00.000Z',
    completedWords: ['word1', 'word2', ...]
  }
}
```

#### 1.3 游戏统计相关
```javascript
// quiz-stats
{
  totalGames: 25,
  correctAnswers: 180,
  totalQuestions: 220,
  accuracy: 81.8,
  timeSpent: 3600,
  averageTime: 144,
  score: 2500,
  streak: 5,
  lastPlayed: '2024-01-01T00:00:00.000Z',
  gameHistory: [
    {
      date: '2024-01-01',
      correct: 8,
      total: 10,
      accuracy: 80
    }
  ]
}
```

### 需要同步的数据类型
- ✅ **高价值数据**: 学习进度、游戏统计、用户偏好
- ⚠️ **中等价值数据**: 教材选择、TTS设置
- ❌ **低价值数据**: 临时UI状态、缓存数据

## 2. 数据库表设计

### 2.1 现有表结构分析

```sql
-- user_profiles (已存在)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT NOT NULL DEFAULT 'student',
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- user_settings (已存在)
CREATE TABLE user_settings (
  user_id UUID REFERENCES auth.users(id),
  settings JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- user_statistics (已存在)
CREATE TABLE user_statistics (
  user_id UUID REFERENCES auth.users(id),
  total_games INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  accuracy DECIMAL(5,2) DEFAULT 0,
  time_spent INTEGER DEFAULT 0,
  average_time INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  last_played TIMESTAMP WITH TIME ZONE,
  game_history JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.2 需要新增的表

#### 2.2.1 用户学习进度表
```sql
CREATE TABLE user_learning_progress (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL,
  word_id UUID,
  word TEXT,
  offset INTEGER NOT NULL DEFAULT 0,
  total_words INTEGER NOT NULL,
  completed_words JSONB DEFAULT '[]'::jsonb,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, collection_id)
);

-- 索引
CREATE INDEX idx_user_learning_progress_user_id ON user_learning_progress(user_id);
CREATE INDEX idx_user_learning_progress_collection ON user_learning_progress(collection_id);
```

#### 2.2.2 数据迁移状态表
```sql
CREATE TABLE user_data_migration (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  migration_type TEXT NOT NULL, -- 'settings', 'progress', 'statistics'
  source_data JSONB NOT NULL, -- 原始localStorage数据
  migrated BOOLEAN DEFAULT FALSE,
  migrated_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, migration_type)
);

-- 索引
CREATE INDEX idx_user_data_migration_user ON user_data_migration(user_id);
CREATE INDEX idx_user_data_migration_status ON user_data_migration(migrated);
```

#### 2.2.3 用户教材选择表
```sql
CREATE TABLE user_textbook_selections (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL,
  selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, collection_id)
);

-- 索引
CREATE INDEX idx_user_textbook_user_id ON user_textbook_selections(user_id);
CREATE INDEX idx_user_textbook_active ON user_textbook_selections(user_id, is_active);
```

## 3. 同步策略设计

### 3.1 同步触发时机

#### 方案1: 登录时自动检测并迁移 (推荐)
```
用户登录 → 检测localStorage数据 → 显示迁移提示 → 执行迁移
```

**优势**:
- 用户体验好，有明确提示
- 一次性完成，不会遗漏
- 可以显示迁移进度

**实现**:
```javascript
// 在useAuth中检测
useEffect(() => {
  if (user && profile && !hasMigrated) {
    detectAndMigrateLocalData();
  }
}, [user, profile]);
```

#### 方案2: 实时同步
```
数据变更 → 立即同步到云端 → 更新localStorage标记
```

**优势**:
- 数据实时性最好
- 不需要迁移过程

**劣势**:
- 复杂，容易出错
- 需要处理网络异常

**实现**:
```javascript
// 修改localStorage操作函数
const updateLocalStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
  // 同时发送到云端
  syncToCloud(key, value);
};
```

### 3.2 数据迁移流程

#### 阶段1: 检测本地数据
```javascript
// 扫描localStorage中的用户数据
const detectLocalData = () => {
  const data = {
    settings: JSON.parse(localStorage.getItem('quiz-settings') || '{}'),
    progress: JSON.parse(localStorage.getItem('learning-progress') || '{}'),
    stats: JSON.parse(localStorage.getItem('quiz-stats') || '{}'),
    lastTextbook: localStorage.getItem('last-selected-textbook')
  };
  return data;
};
```

#### 阶段2: 数据验证
```javascript
// 验证数据格式和完整性
const validateData = (data) => {
  const errors = [];
  const warnings = [];

  // 验证设置
  if (data.settings && !isValidSettings(data.settings)) {
    errors.push('Settings format invalid');
  }

  // 验证进度
  if (data.progress) {
    for (const [collectionId, progress] of Object.entries(data.progress)) {
      if (!isValidProgress(progress)) {
        warnings.push(`Invalid progress for collection ${collectionId}`);
      }
    }
  }

  return { errors, warnings, validData };
};
```

#### 阶段3: 数据转换
```javascript
// 将localStorage数据格式转换为数据库格式
const transformData = (localData) => {
  return {
    settings: {
      user_id: currentUser.id,
      settings: localData.settings,
    },
    progress: Object.entries(localData.progress).map(([collectionId, progress]) => ({
      user_id: currentUser.id,
      collection_id: collectionId,
      offset: progress.offset || 0,
      total_words: progress.total || 0,
      completed_words: progress.completedWords || [],
      last_updated: progress.lastUpdated || new Date().toISOString(),
    })),
    statistics: {
      user_id: currentUser.id,
      total_games: localData.stats?.totalGames || 0,
      correct_answers: localData.stats?.correctAnswers || 0,
      total_questions: localData.stats?.totalQuestions || 0,
      accuracy: localData.stats?.accuracy || 0,
      time_spent: localData.stats?.timeSpent || 0,
      average_time: localData.stats?.averageTime || 0,
      score: localData.stats?.score || 0,
      streak: localData.stats?.streak || 0,
      last_played: localData.stats?.lastPlayed || null,
      game_history: localData.stats?.gameHistory || [],
    },
    textbookSelection: localData.lastTextbook ? {
      user_id: currentUser.id,
      collection_id: localData.lastTextbook,
    } : null,
  };
};
```

#### 阶段4: 批量插入数据库
```javascript
// 使用Supabase RPC进行批量插入
const migrateToDatabase = async (transformedData) => {
  const { error } = await supabase.rpc('batch_migrate_user_data', {
    user_data: transformedData
  });

  if (error) {
    throw new Error(`Migration failed: ${error.message}`);
  }
};
```

#### 阶段5: 标记迁移完成
```javascript
// 记录迁移状态
const markMigrationComplete = (migrationType) => {
  localStorage.setItem(`migrated_${migrationType}`, 'true');
  localStorage.setItem(`migrated_at_${migrationType}`, new Date().toISOString());
};
```

### 3.3 冲突处理

#### 数据冲突场景
1. **用户在不同设备上都有数据**
   - 策略: 以最新的时间戳为准
   - 实现: 比较lastUpdated字段

2. **数据格式不兼容**
   - 策略: 跳过无效数据，记录错误
   - 实现: 详细的错误日志

3. **网络异常导致部分迁移失败**
   - 策略: 重试机制
   - 实现: 指数退避重试

#### 冲突解决代码示例
```javascript
const resolveConflicts = async (localData, cloudData) => {
  const resolved = {};

  // 合并设置（以最新的为准）
  resolved.settings = mergeByTimestamp(localData.settings, cloudData.settings);

  // 合并学习进度
  resolved.progress = {};
  for (const collectionId of new Set([...Object.keys(localData), ...Object.keys(cloudData)])) {
    const local = localData[collectionId];
    const cloud = cloudData[collectionId];

    if (!local) {
      resolved.progress[collectionId] = cloud;
    } else if (!cloud) {
      resolved.progress[collectionId] = local;
    } else {
      // 比较最后更新时间
      resolved.progress[collectionId] =
        new Date(local.lastUpdated) > new Date(cloud.lastUpdated) ? local : cloud;
    }
  }

  return resolved;
};
```

## 4. 迁移界面设计

### 4.1 迁移提示页面
```
┌─────────────────────────────────┐
│  📦 数据迁移                     │
├─────────────────────────────────┤
│                                 │
│ 我们检测到您在本地保存了一些学习 │
│ 数据，包括：                    │
│  • 学习进度 (3个教材)          │
│  • 游戏统计                     │
│  • 个人设置                     │
│                                 │
│ 是否需要将这些数据迁移到云端？   │
│ 这样可以在其他设备上继续学习。   │
│                                 │
│  [ 立即迁移 ]  [ 暂不迁移 ]     │
│                                 │
└─────────────────────────────────┘
```

### 4.2 迁移进度页面
```
┌─────────────────────────────────┐
│  ⏳ 正在迁移数据...              │
├─────────────────────────────────┤
│                                 │
│ ✓ 检测本地数据...               │
│ ✓ 验证数据格式...               │
│ ✓ 迁移用户设置...               │
│ ⏳ 迁移学习进度...               │
│ ○ 迁移游戏统计...               │
│ ○ 清理本地数据...               │
│                                 │
│ 迁移进度: 50%                   │
│                                 │
│ [ 取消迁移 ]                    │
│                                 │
└─────────────────────────────────┘
```

### 4.3 迁移完成页面
```
┌─────────────────────────────────┐
│  ✅ 迁移完成！                   │
├─────────────────────────────────┤
│                                 │
│ 成功迁移了以下数据：            │
│  ✓ 3个教材的学习进度             │
│  ✓ 25场游戏的统计信息            │
│  ✓ 个人偏好设置                 │
│                                 │
│ 您现在可以在任何设备上访问这些  │
│ 数据了！                        │
│                                 │
│  [ 开始学习 ]  [ 查看详情 ]     │
│                                 │
└─────────────────────────────────┘
```

## 5. 技术实现方案

### 5.1 创建Supabase RPC函数

#### 批量迁移数据
```sql
CREATE OR REPLACE FUNCTION batch_migrate_user_data(user_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_val UUID;
  result JSONB;
BEGIN
  -- 获取当前用户ID
  user_id_val := auth.uid();

  -- 迁移设置
  INSERT INTO user_settings (user_id, settings)
  VALUES (user_id_val, user_data->'settings')
  ON CONFLICT (user_id)
  DO UPDATE SET
    settings = EXCLUDED.settings,
    updated_at = NOW();

  -- 迁移学习进度
  INSERT INTO user_learning_progress (
    user_id, collection_id, offset, total_words, completed_words, last_updated
  )
  SELECT
    user_id_val,
    (value->>'collection_id')::UUID,
    (value->>'offset')::INTEGER,
    (value->>'total_words')::INTEGER,
    (value->>'completed_words')::JSONB,
    (value->>'last_updated')::TIMESTAMPTZ
  FROM jsonb_array_elements(user_data->'progress') AS value
  ON CONFLICT (user_id, collection_id)
  DO UPDATE SET
    offset = EXCLUDED.offset,
    total_words = EXCLUDED.total_words,
    completed_words = EXCLUDED.completed_words,
    last_updated = EXCLUDED.last_updated,
    updated_at = NOW();

  -- 迁移统计数据
  INSERT INTO user_statistics (user_id, total_games, correct_answers, ...)
  VALUES (user_id_val, ...)
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_games = EXCLUDED.total_games,
    ...;

  -- 记录迁移状态
  INSERT INTO user_data_migration (user_id, migration_type, migrated, migrated_at)
  VALUES (user_id_val, 'all', TRUE, NOW());

  RETURN jsonb_build_object('success', true, 'message', 'Data migrated successfully');
END;
$$;
```

#### 检查迁移状态
```sql
CREATE OR REPLACE FUNCTION check_migration_status(user_id_val UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT jsonb_agg(
    jsonb_build_object(
      'migration_type', migration_type,
      'migrated', migrated,
      'migrated_at', migrated_at
    )
  )
  FROM user_data_migration
  WHERE user_id = user_id_val;
$$;
```

### 5.2 React Hook设计

```typescript
// hooks/useDataMigration.ts
export const useDataMigration = () => {
  const { user, profile } = useAuth();
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'detecting' | 'migrating' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const detectLocalData = useCallback(() => {
    // 检测localStorage数据
    const localData = {
      settings: localStorage.getItem('quiz-settings'),
      progress: localStorage.getItem('learning-progress'),
      stats: localStorage.getItem('quiz-stats'),
      lastTextbook: localStorage.getItem('last-selected-textbook'),
    };
    return localData;
  }, []);

  const migrateData = useCallback(async (data: any) => {
    try {
      setMigrationStatus('migrating');
      setProgress(0);

      // 步骤1: 验证数据
      setProgress(20);
      const { data: validData } = await validateData(data);

      // 步骤2: 转换数据
      setProgress(40);
      const transformedData = transformData(validData);

      // 步骤3: 发送到云端
      setProgress(60);
      const { error } = await supabase.rpc('batch_migrate_user_data', {
        user_data: transformedData
      });
      if (error) throw error;

      // 步骤4: 标记完成
      setProgress(100);
      setMigrationStatus('completed');

      return true;
    } catch (err) {
      setError(err.message);
      setMigrationStatus('error');
      return false;
    }
  }, []);

  const skipMigration = useCallback(() => {
    // 记录用户选择跳过
    localStorage.setItem('migration_skipped', 'true');
    setMigrationStatus('completed');
  }, []);

  return {
    migrationStatus,
    progress,
    error,
    detectLocalData,
    migrateData,
    skipMigration,
  };
};
```

### 5.3 迁移组件实现

```typescript
// components/DataMigration.tsx
export const DataMigration: React.FC = () => {
  const { migrateData, skipMigration, detectLocalData, migrationStatus, progress } = useDataMigration();
  const [showMigration, setShowMigration] = useState(false);

  useEffect(() => {
    // 检测是否有未迁移的数据
    const localData = detectLocalData();
    if (hasDataToMigrate(localData)) {
      setShowMigration(true);
    }
  }, []);

  const handleMigrate = async () => {
    const localData = detectLocalData();
    await migrateData(localData);
    setShowMigration(false);
  };

  const handleSkip = () => {
    skipMigration();
    setShowMigration(false);
  };

  if (!showMigration) return null;

  return (
    <Modal>
      {migrationStatus === 'idle' && (
        <MigrationPrompt
          onMigrate={handleMigrate}
          onSkip={handleSkip}
          dataInfo={getDataInfo(detectLocalData())}
        />
      )}
      {migrationStatus === 'migrating' && (
        <MigrationProgress progress={progress} />
      )}
      {migrationStatus === 'completed' && (
        <MigrationComplete />
      )}
    </Modal>
  );
};
```

## 6. RLS策略配置

### 6.1 user_learning_progress表RLS
```sql
-- 用户只能访问自己的学习进度
CREATE POLICY "Users can view own learning progress"
ON user_learning_progress FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own learning progress"
ON user_learning_progress FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning progress"
ON user_learning_progress FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

### 6.2 user_textbook_selections表RLS
```sql
-- 用户只能管理自己的教材选择
CREATE POLICY "Users can manage own textbook selections"
ON user_textbook_selections FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### 6.3 user_data_migration表RLS
```sql
-- 用户只能查看自己的迁移状态
CREATE POLICY "Users can view own migration status"
ON user_data_migration FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

## 7. 实施计划

### 7.1 开发阶段
- [ ] **阶段1**: 创建数据库表和RLS策略
- [ ] **阶段2**: 实现Supabase RPC函数
- [ ] **阶段3**: 开发迁移Hook和组件
- [ ] **阶段4**: 集成到认证流程
- [ ] **阶段5**: 编写测试用例

### 7.2 测试阶段
- [ ] **单元测试**: 数据验证和转换逻辑
- [ ] **集成测试**: 完整迁移流程
- [ ] **手动测试**: 各种边界情况
- [ ] **数据测试**: 确保不丢失数据

### 7.3 部署阶段
- [ ] 部署数据库更改
- [ ] 部署前端代码
- [ ] 监控迁移执行
- [ ] 收集用户反馈

## 8. 风险评估

### 8.1 数据丢失风险
- **风险**: 迁移过程中数据丢失
- **缓解**: 分步骤迁移，每步完成后验证
- **恢复**: 保留localStorage备份30天

### 8.2 性能影响
- **风险**: 大量数据迁移导致页面卡顿
- **缓解**: 分批迁移，显示进度条
- **优化**: 使用Web Workers进行后台处理

### 8.3 用户体验
- **风险**: 强制迁移打断用户操作
- **缓解**: 可选迁移，可跳过
- **优化**: 迁移完成后有明确提示

## 9. 总结

### 推荐方案
1. **登录时自动检测**: 不干扰用户初次体验
2. **可选迁移**: 用户可选择是否迁移
3. **实时同步**: 迁移后实时同步新数据
4. **分步执行**: 降低失败风险
5. **详细反馈**: 让用户了解迁移进度

### 关键成功因素
- 完善的数据验证机制
- 详细的错误处理和日志
- 用户友好的界面设计
- 全面的测试覆盖
- 清晰的回滚方案

这个方案确保了数据安全性和用户体验，是最稳妥的迁移策略。
