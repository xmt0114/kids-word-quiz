# 🎯 应用配置系统验收测试指南

## 📋 概述

我们已经完成了从硬编码配置到数据库驱动配置的迁移。现在所有应用配置都从 Supabase 的 `app_config` 表动态加载。

## ✅ 已实现的功能

### 1. 数据库配置 (Supabase)
- ✅ `app_config` 表已创建
- ✅ 11 个配置项已插入
- ✅ 分为 3 个分类：app (5项)、games (2项)、universal (4项)

### 2. 前端配置管理
- ✅ `useAppConfig` Hook - 从数据库加载配置
- ✅ `ConfigProvider` 组件 - 应用级配置提供者
- ✅ `config.ts` - 默认常量管理
- ✅ `GuessWordSettingsPage` - 使用数据库配置

---

## 🧪 验收测试步骤

### **第一步：启动应用**

```bash
# 1. 确保后端已执行 schema.sql
# 2. 启动前端
npm run dev
```

**应该看到**：
- ✅ 应用正常启动，无导入错误
- ✅ 显示配置加载提示

### **第二步：检查控制台日志**

打开浏览器开发者工具 (F12 → Console)，**应该看到**：

```
🔄 [ConfigProvider] 从数据库加载配置成功
📊 [ConfigProvider] 配置项: ['app_settings', 'default_stats', ...]
🔧 [ConfigProvider] 当前配置: { ... }
🔄 [useAppConfig] 正在从数据库加载配置...
✅ [useAppConfig] 成功从数据库加载配置: 11 项
```

**如果看到错误**：
- ❌ `配置加载失败` - 请检查数据库连接
- ⚠️ `使用内置默认配置` - 说明数据库无配置数据

### **第三步：访问配置数据**

在浏览器控制台运行：

```javascript
// 查看当前加载的配置
console.log('当前配置:', window.__APP_CONFIG__);

// 查看游戏常量
console.log('游戏常量:', window.__APP_CONFIG__.game_constants);

// 查看猜单词设置
console.log('猜单词设置:', window.__APP_CONFIG__.guess_word_settings);
```

**预期结果**：
- ✅ 能看到完整的配置对象
- ✅ 包含 11 个配置项
- ✅ 数据类型和格式正确

### **第四步：测试猜单词设置页面**

1. 导航到"猜单词" → "设置"
2. 检查页面默认设置
3. 控制台应显示：`[ConfigProvider] 组件已加载`

**应该看到**：
- ✅ 页面使用数据库中的默认设置
- ✅ 题目类型、答案类型等设置正确加载

### **第五步：测试热更新功能**

1. **在 Supabase 后台修改配置**：

```sql
-- 修改游戏题目数量
UPDATE app_config 
SET value = '{"totalQuestions": 5, "optionCount": 3, "shuffleWords": true, "defaultTimeLimit": 300}'
WHERE key = 'game_constants';

-- 修改 TTS 默认语言
UPDATE app_config
SET value = '{"lang": "zh-CN", "rate": 1.0, "pitch": 1.0, "volume": 1.0, "voiceId": "default"}'
WHERE key = 'tts_defaults';
```

2. **刷新应用页面**

3. **检查控制台**：
   - 应该看到配置重新加载
   - `✅ [useAppConfig] 成功从数据库加载配置: 11 项`

4. **验证新配置生效**：
   - 新的游戏应该显示 5 题而不是 10 题
   - TTS 设置应该使用中文

### **第六步：测试错误处理**

1. **临时断网**：
   - 关闭网络连接
   - 刷新页面

2. **检查控制台**：
   ```
   ❌ [ConfigProvider] 配置加载失败: [网络错误]
   ⚠️ [useAppConfig] 加载配置失败: [错误信息]
   ⚠️ [useAppConfig] 使用内置默认值
   ```

3. **验证应用功能**：
   - ✅ 应用应该继续正常工作
   - ✅ 使用内置的默认配置
   - ✅ 不会崩溃

---

## 📊 配置项详情

### 应用级配置 (app)
1. `app_settings` - 应用默认设置
2. `default_stats` - 默认游戏统计
3. `game_constants` - 游戏通用常量
4. `default_collection_id` - 默认教材ID
5. `tts_defaults` - TTS语音配置

### 游戏类型配置 (games)
1. `supported_games` - 支持的游戏列表
2. `guess_word_settings` - 猜单词游戏特定设置

### 通用配置 (universal)
1. `difficulty_levels` - 难度等级
2. `question_types` - 题目类型
3. `answer_types` - 答案类型
4. `learning_strategies` - 学习策略

---

## 🔍 故障排除

### 问题 1: 控制台无配置加载日志
**原因**: `ConfigProvider` 未正确加载  
**解决**: 检查 App.tsx 是否正确导入和使用 ConfigProvider

### 问题 2: 配置加载失败
**原因**: 数据库连接问题或表不存在  
**解决**: 
1. 确认已在 Supabase 执行 schema.sql
2. 检查网络连接
3. 查看 Supabase 后台是否有 app_config 表和数据

### 问题 3: 配置更新后未生效
**原因**: 浏览器缓存  
**解决**: 强制刷新页面 (Ctrl+Shift+R)

### 问题 4: 硬编码值仍在使用
**原因**: 部分组件未更新使用配置  
**解决**: 逐步迁移所有硬编码值为配置

---

## 📝 测试检查清单

- [ ] ✅ 应用启动无错误
- [ ] ✅ 控制台显示配置加载日志
- [ ] ✅ 11 个配置项正确加载
- [ ] ✅ 猜单词设置页面使用数据库配置
- [ ] ✅ 热更新功能正常
- [ ] ✅ 断网时使用内置默认值
- [ ] ✅ 应用功能完全正常

---

## 🎯 成功标准

当所有测试通过后，您将看到：

1. **✅ 应用正常运行** - 无任何错误
2. **✅ 配置动态加载** - 所有配置从数据库获取
3. **✅ 热更新生效** - 修改数据库配置后刷新页面可看到新配置
4. **✅ 错误容错** - 即使数据库不可用，应用也能正常工作
5. **✅ 性能良好** - 配置加载速度快，用户体验流畅

**恭喜！您已经成功将应用从硬编码配置迁移到数据库驱动配置！** 🎉
