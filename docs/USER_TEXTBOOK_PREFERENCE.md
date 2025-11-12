# 用户教材偏好同步功能

## 功能描述

本功能实现了用户教材选择的自动同步，确保用户在登录时能够自动加载自己偏好的教材，同时提供优先级管理机制。

## 核心特性

1. **数据库字段**: 在 `user_profiles` 表中添加 `preferred_textbook_id` 字段
2. **自动同步**: 用户选择教材时自动同步到后端数据库
3. **优先级管理**: 用户个人偏好具有最高优先级
4. **登录恢复**: 登录时自动加载用户的教材偏好

## 优先级体系

```
1️⃣ 用户个人偏好 (profile.preferred_textbook_id) - 最高优先级
   ↓ 如果不存在，回退到
2️⃣ 服务器配置 (app_config.default_collection_id)
   ↓ 如果不存在，回退到
3️⃣ 硬编码默认值 (11111111-1111-1111-1111-111111111111)
```

## 实现细节

### 1. 数据库迁移

**文件**: `other/supabase/migrations/1762486000_add_preferred_textbook.sql`

```sql
-- 添加用户偏好教材ID字段
ALTER TABLE user_profiles
ADD COLUMN preferred_textbook_id UUID REFERENCES word_collections(id);

-- 创建索引提高查询性能
CREATE INDEX idx_user_profiles_preferred_textbook
ON user_profiles(preferred_textbook_id);

-- 添加注释
COMMENT ON COLUMN user_profiles.preferred_textbook_id IS '用户当前选择的教材ID，用于存储用户偏好';
```

### 2. 认证系统更新

**文件**: `src/hooks/useAuth.ts`

#### 类型定义更新
```typescript
interface UserProfile {
  id: string
  role: 'admin' | 'teacher' | 'parent' | 'student'
  display_name: string
  avatar_url?: string
  settings?: any
  preferred_textbook_id?: string // 用户当前选择的教材ID
}

interface AuthContextType {
  // ...
  updatePreferredTextbook: (textbookId: string) => Promise<{ success: boolean; error?: string }>
}
```

#### 新增方法: `updatePreferredTextbook`
```typescript
const updatePreferredTextbook = async (textbookId: string) => {
  if (!user) {
    return { success: false, error: '未登录' }
  }

  try {
    console.log('🔄 [useAuth] 更新用户教材偏好:', { userId: user.id, textbookId })

    const { data, error } = await supabase
      .from('user_profiles')
      .update({ preferred_textbook_id: textbookId })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('❌ [useAuth] 更新教材偏好失败:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ [useAuth] 教材偏好更新成功:', data)
    setProfile(data as UserProfile)
    return { success: true }
  } catch (error) {
    console.error('❌ [useAuth] 更新教材偏好失败:', error)
    return { success: false, error: '更新教材偏好失败' }
  }
}
```

### 3. 设置 Hook 更新

**文件**: `src/hooks/useLocalStorage.ts`

更新 `useQuizSettings` 实现优先级逻辑：

```typescript
export function useQuizSettings() {
  const { getConfig, loading } = useAppDefaults();
  const { profile } = useAuth();

  const getDefaultSettings = () => {
    const guessWordSettings = getConfig('guess_word_settings') || {};
    const ttsDefaults = getConfig('tts_defaults') || {};
    const defaultCollectionId = getConfig('default_collection_id') || '11111111-1111-1111-1111-111111111111';

    // 优先级：用户个人偏好 > 服务器配置中的默认值 > 硬编码默认值
    const finalCollectionId =
      profile?.preferred_textbook_id || // 1️⃣ 用户个人偏好（最高优先级）
      defaultCollectionId ||           // 2️⃣ 服务器配置
      '11111111-1111-1111-1111-111111111111'; // 3️⃣ 硬编码默认值（最低优先级）

    return {
      questionType: guessWordSettings.questionType || 'text',
      answerType: guessWordSettings.answerType || 'choice',
      selectionStrategy: guessWordSettings.learningStrategy || 'sequential',
      collectionId: finalCollectionId,
      tts: {
        lang: ttsDefaults.lang || 'en-US',
        rate: ttsDefaults.rate || 0.8,
        pitch: ttsDefaults.pitch || 1.0,
        volume: ttsDefaults.volume || 1.0,
        voiceId: ttsDefaults.voiceId || 'default',
      },
    };
  };

  const [settings, setSettings] = useLocalStorage<Partial<QuizSettings>>('quiz-settings', defaultSettings);
  return { settings, setSettings };
}
```

### 4. 教材选择组件更新

**文件**: `src/components/TextbookSelectionPage.tsx`

更新 `handleConfirm` 方法：

```typescript
const handleConfirm = async () => {
  if (selectedId) {
    console.log('📚 [TextbookSelection] 用户选择教材:', selectedId);

    // 保存选择的教材ID到 localStorage
    localStorage.setItem('last-selected-textbook', selectedId);

    // 同时更新 quiz-settings 中的 collectionId
    setSettings((prevSettings) => ({
      ...prevSettings,
      collectionId: selectedId
    }));

    // 如果用户已登录，同步更新到后端用户偏好
    if (user) {
      try {
        console.log('🔄 [TextbookSelection] 同步用户教材偏好到后端...');
        const result = await updatePreferredTextbook(selectedId);

        if (result.success) {
          console.log('✅ [TextbookSelection] 用户教材偏好已保存');
        } else {
          console.warn('⚠️ [TextbookSelection] 保存教材偏好失败:', result.error);
        }
      } catch (error) {
        console.error('❌ [TextbookSelection] 同步教材偏好失败:', error);
      }
    }

    // 延迟跳转，确保状态更新完成
    setTimeout(() => {
      if (onSelectTextbook) {
        onSelectTextbook(selectedId);
      } else {
        navigate(-1);
      }
    }, 500);
  }
};
```

## 使用方法

### 应用迁移

1. **执行数据库迁移**
```bash
# 方法1: 使用 Supabase CLI
supabase db push

# 方法2: 在 Supabase Dashboard 的 SQL Editor 中执行
# 复制 other/supabase/migrations/1762486000_add_preferred_textbook.sql 的内容
```

### 测试功能

#### 测试步骤 1: 登录用户选择教材

1. 启动应用
2. 登录现有账户（或注册新账户）
3. 进入"猜单词" → "设置"
4. 点击"选择教材"
5. 从列表中选择一个教材
6. 点击"确认选择"
7. 检查控制台日志：
```
📚 [TextbookSelection] 用户选择教材: [教材ID]
🔄 [TextbookSelection] 同步用户教材偏好到后端...
✅ [TextbookSelection] 用户教材偏好已保存
🔄 [useAuth] 更新用户教材偏好: {userId: "...", textbookId: "..."}
✅ [useAuth] 教材偏好更新成功: {...}
```

#### 测试步骤 2: 验证登录时加载偏好

1. 退出登录
2. 重新登录
3. 进入"猜单词" → "设置"
4. 检查当前选择的教材是否为您刚才选择的教材

#### 测试步骤 3: 验证优先级

1. 登录用户
2. 打开浏览器控制台
3. 查看 `useQuizSettings` 加载的默认值：
```javascript
// 在控制台中执行：
console.log('当前用户偏好:', profile?.preferred_textbook_id);
console.log('当前设置:', settings);
```
4. 应该显示：
   - `profile.preferred_textbook_id` 等于您选择的教材ID
   - `settings.collectionId` 也等于该教材ID（优先级生效）

#### 测试步骤 4: 验证无登录用户

1. 退出登录（或使用隐私模式）
2. 进入"猜单词" → "设置"
3. 检查当前选择的教材
4. 应该是服务器配置的默认值（app_config）而不是用户偏好

## 数据流程

```
用户选择教材
    ↓
TextbookSelectionPage.handleConfirm()
    ↓
localStorage 保存
    ↓
useQuizSettings 更新 localStorage
    ↓
检查是否登录
    ↓ 是
    ↓ 否
useAuth.updatePreferredTextbook()
    ↓
Supabase 更新 user_profiles
    ↓
profile 状态更新
    ↓
下一次登录时自动加载
```

## 错误处理

1. **网络错误**: 错误日志输出，不影响 localStorage 更新
2. **用户未登录**: 跳过同步，仅更新 localStorage
3. **数据库错误**: 显示错误信息，但不影响功能使用

## 监控和调试

### 控制台日志

#### 成功日志
- `📚 [TextbookSelection] 用户选择教材: [ID]` - 用户选择教材
- `🔄 [TextbookSelection] 同步用户教材偏好到后端...` - 开始同步
- `✅ [TextbookSelection] 用户教材偏好已保存` - 同步完成
- `🔄 [useAuth] 更新用户教材偏好: {...}` - 开始更新
- `✅ [useAuth] 教材偏好更新成功: {...}` - 更新成功

#### 错误日志
- `❌ [useAuth] 更新教材偏好失败: [error]` - 更新失败
- `⚠️ [TextbookSelection] 保存教材偏好失败: [error]` - 保存失败

### 数据库查询

```sql
-- 查看所有用户的教材偏好
SELECT id, display_name, preferred_textbook_id, role
FROM user_profiles
WHERE preferred_textbook_id IS NOT NULL;

-- 查看特定用户的偏好
SELECT * FROM user_profiles
WHERE id = '用户ID';
```

## 注意事项

1. **数据库约束**: `preferred_textbook_id` 必须引用 `word_collections` 表中存在的ID
2. **并发问题**: 如果多个设备同时使用同一个账户，后更新的偏好会覆盖之前的
3. **向后兼容**: 老用户没有 `preferred_textbook_id` 字段时，系统会自动使用服务器配置
4. **性能**: 添加了索引，但建议监控查询性能

## 相关文件

- `other/supabase/migrations/1762486000_add_preferred_textbook.sql` - 数据库迁移
- `src/hooks/useAuth.ts` - 认证逻辑和用户偏好更新
- `src/hooks/useLocalStorage.ts` - 设置优先级管理
- `src/components/TextbookSelectionPage.tsx` - 教材选择组件

## 总结

通过这个功能，用户可以：
1. 选择并保存自己的教材偏好
2. 在任何设备上登录时自动加载偏好
3. 享受优先级系统带来的个性化体验
4. 获得更好的学习连续性

系统设计遵循了最佳实践：
- 优先级明确
- 错误处理完善
- 日志便于调试
- 向后兼容
- 性能优化
