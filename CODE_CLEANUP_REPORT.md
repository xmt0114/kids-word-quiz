# 📋 代码清理报告

## 🚨 发现的废弃代码和不一致问题

### 1. **严重问题：重复的学习进度管理**

**问题描述：**
GuessWordGamePage.tsx中仍在使用`advanceProgress`更新本地localStorage，但学习进度现在应该由后端RPC函数管理。

**位置：**
- `src/components/GuessWordGamePage.tsx:222-223`

**当前代码：**
```javascript
// 更新学习进度 - 只在非replay模式下更新
if (collectionId && totalWords > 0 && !isReplay) {
  const completedQuestions = result.totalQuestions;
  advanceProgress(collectionId, completedQuestions, totalWords);
}
```

**问题分析：**
- `get_my_study_session` RPC函数内部应该已经处理了学习进度
- `record_session_results` RPC函数应该已经记录了答题结果
- 本地localStorage的更新可能导致数据不一致
- **解决方案：删除此段代码**

---

### 2. **废弃的wordAPI.getWords调用**

**问题描述：**
useQuiz.ts中的`fetchWordsWithRetry`函数和`wordAPI.getWords`不再被使用，因为题目现在通过RPC函数获取。

**位置：**
- `src/hooks/useQuiz.ts:28-71` (fetchWordsWithRetry函数)
- `src/hooks/useQuiz.ts:42` (wordAPI.getWords调用)

**当前代码：**
```javascript
const requestPromise = wordAPI.getWords({
  limit: TOTAL_QUESTIONS,
  offset: offset,
  collectionId: collectionId,
  selectionStrategy: settings.selectionStrategy,
});
```

**调用位置：**
- `src/hooks/useQuiz.ts:96` - 但只在提供预加载题目时不会执行
- 实际上不再被调用，因为GuessWordGamePage直接使用RPC

**解决方案：**
- 删除`fetchWordsWithRetry`函数
- 删除`wordAPI`导入
- 删除`getRandomWords`导入（如果不再使用）

---

### 3. **未使用的useLearningProgress函数**

**问题描述：**
useLearningProgress hook中的多个函数不再被使用，因为学习进度现在由后端管理。

**位置：**
`src/hooks/useLearningProgress.ts`

**不再使用的函数：**
- `getProgress` - 被RPC `get_collection_progress`替代
- `getOffset` - 被RPC `get_my_study_session`内部处理
- `updateProgress` - 不再需要手动更新
- `advanceProgress` - 应该由后端处理
- `resetProgress` - 可能还需要（用户主动重置）
- `resetAllProgress` - 可能还需要

**仍需保留的函数：**
- `resetProgress` - 用户可能想手动重置单个教材进度
- `resetAllProgress` - 用户可能想重置所有进度

---

### 4. **localStorage数据保留性分析**

#### 4.1 quiz-settings（答题设置）
**存储位置：** `src/hooks/useLocalStorage.ts:107`
**用途：** 保存用户的答题设置（题型、答题方式、策略、TTS等）
**状态：** ✅ **应该保留**
**理由：**
- 这些是用户偏好设置，不需要实时同步到后端
- 用户可能希望离线也能保存设置
- 优先级：用户设置 > 服务器配置

#### 4.2 quiz-stats（答题统计）
**存储位置：** `src/hooks/useLocalStorage.ts:184`
**用途：** 保存用户的答题统计（总游戏数、总正确数、最佳成绩等）
**状态：** ⚠️ **需要确认**
**理由：**
- 目前只保存在本地localStorage
- 如果需要跨设备同步，应该也同步到后端
- 当前实现：仅本地存储

#### 4.3 learning-progress（学习进度）
**存储位置：** `src/hooks/useLearningProgress.ts:23`
**用途：** 保存每个教材的学习进度
**状态：** ❌ **应该删除**
**理由：**
- 学习进度现在完全由后端管理
- RPC函数 `get_my_study_session` 和 `get_collection_progress` 提供真实进度
- 本地存储可能导致数据不一致
- **解决方案：删除此localStorage使用**

#### 4.4 device_id（设备ID）
**存储位置：** `src/hooks/useLocalStorage.ts:20-31`
**用途：** 为未登录用户生成唯一设备标识
**状态：** ✅ **应该保留**
**理由：**
- 用于区分不同设备的localStorage数据
- 确保未登录用户的数据隔离
- **不应该删除**

---

### 5. **需要删除的导入**

#### GuessWordGamePage.tsx
- ❌ `{ advanceProgress }` from useLearningProgress - 因为不再使用

#### useQuiz.ts
- ❌ `wordAPI` import - 不再使用
- ❌ `getRandomWords` from '../utils/dataUtils' - 需要检查是否在其他地方使用

---

## 📝 清理计划

### 阶段1：删除重复的学习进度更新
```bash
# 修改 GuessWordGamePage.tsx
- 删除 import { advanceProgress } from './useLearningProgress'
- 删除 advanceProgress 调用代码
```

### 阶段2：清理useQuiz.ts
```bash
# 修改 useQuiz.ts
- 删除 fetchWordsWithRetry 函数
- 删除 wordAPI 导入
- 删除 getRandomWords 导入（如果不再使用）
- 删除相关代码（第28-71行，第96行）
```

### 阶段3：简化useLearningProgress.ts
```bash
# 修改 useLearningProgress.ts
- 只保留 resetProgress 和 resetAllProgress 函数
- 删除其他不需要的函数
- 删除 localStorage 逻辑
- 重命名为 useProgressReset 或删除此hook
```

### 阶段4：确认localStorage保留项
```bash
保留：
- quiz-settings（用户设置）
- device_id（设备标识）
- quiz-stats（如果不需要跨设备同步）

删除：
- learning-progress（学习进度）
```

---

## ✅ 建议的修改

### 修改1：GuessWordGamePage.tsx
```diff
- import { advanceProgress } from './useLearningProgress';

  // ...

- // 更新学习进度 - 只在非replay模式下更新
- if (collectionId && totalWords > 0 && !isReplay) {
-   const completedQuestions = result.totalQuestions;
-   advanceProgress(collectionId, completedQuestions, totalWords);
- }
```

### 修改2：useQuiz.ts
```diff
- import { wordAPI } from '../utils/api';
- import { getRandomWords } from '../utils/dataUtils';

  // 删除整个 fetchWordsWithRetry 函数 (行28-71)
  // 删除 initializeQuiz 中对 fetchWordsWithRetry 的调用 (行96)
```

### 修改3：useLearningProgress.ts
```diff
- // 删除整个localStorage逻辑
- // 只保留 resetProgress 和 resetAllProgress
- // 或完全删除此文件，如果其他地方不使用
```

---

## 🔍 验证清单

- [ ] 删除GuessWordGamePage.tsx中的advanceProgress调用
- [ ] 删除useQuiz.ts中的wordAPI相关代码
- [ ] 确认quiz-settings仍保存在localStorage
- [ ] 确认device_id仍保存在localStorage
- [ ] 确认learning-progress不再保存到localStorage
- [ ] 测试答题流程，确保功能正常
- [ ] 测试学习进度显示，确保使用RPC数据
- [ ] 测试"重置进度"功能（如果保留）

---

## ⚠️ 注意事项

1. **向后兼容性**：如果删除localStorage中的learning-progress，现有用户的数据不会丢失，只是后续不再使用
2. **功能测试**：修改后需要全面测试答题流程，确保RPC调用正常工作
3. **数据一致性**：确保前端显示的学习进度与后端RPC返回的数据一致
4. **"再玩一次"功能**：确保不影响现有的重复学习功能

---

## 📊 修改影响范围

**高影响：**
- `src/components/GuessWordGamePage.tsx` - 移除学习进度更新
- `src/hooks/useLearningProgress.ts` - 删除localStorage逻辑

**中影响：**
- `src/hooks/useQuiz.ts` - 删除废弃的API调用

**无影响：**
- `src/components/GuessWordSettingsPage.tsx` - 保持不变（使用RPC）
- `src/components/TextbookSelectionPage.tsx` - 保持不变

---

**优先级：HIGH** - 建议尽快清理这些废弃代码，避免数据不一致问题。
