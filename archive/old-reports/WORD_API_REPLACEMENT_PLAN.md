# 📋 数据管理页面单词API替换方案

## 📊 当前新增单词逻辑分析

### 1. 单条添加单词 (`handleSubmitWord`)
**位置：** `src/components/DataManagementPage.tsx:469-525`

**现有代码结构：**
```typescript
const wordData = {
  ...data,
  collectionId: selectedCollectionId,
};

// 调用 wordAPI.addWord()
const response = await wordAPI.addWord(wordData);
```

**现有参数结构（表单数据）：**
```typescript
{
  word: string;           // 单词
  definition: string;     // 定义
  audioText: string;      // 音频文本（可选，默认=definition）
  difficulty: 'easy' | 'medium' | 'hard';  // 难度（默认='easy'）
  options: string[];      // 选项数组（至少3个）
  answer: string;         // 正确答案
  hint: string;           // 提示（可选）
}
```

### 2. 批量添加单词 (`handleBatchSubmitWords`)
**位置：** `src/components/DataManagementPage.tsx:258-339`

**现有代码结构：**
```typescript
const preparedData = batchWords.map(wordData => ({
  ...wordData,
  collectionId: selectedCollectionId,
  audioText: wordData.audioText || wordData.definition,
}));

// 调用 supabaseAPI.batchAddWords()
const response = await supabaseAPI.batchAddWords(batch);
```

---

## 🔄 替换为新RPC函数

### 添加 Supabase 导入
```typescript
import { supabase } from '../lib/supabase';
```

---

## 📝 方案1：使用 `add_single_word` RPC（推荐）

### 替换 `handleSubmitWord` 函数

```typescript
const handleSubmitWord = async (data: any) => {
  if (!selectedCollectionId) {
    toast.error('请先选择教材');
    throw new Error('未选择教材');
  }

  try {
    // 准备 RPC 参数
    const wordParams = {
      // 必填参数（没有默认值）
      p_collection_id: selectedCollectionId,
      p_word: data.word,
      p_definition: data.definition,
      p_audio_text: data.audioText || data.definition,
      p_difficulty: data.difficulty || 'easy',

      // 可选参数（有默认值）
      p_answer: data.answer || '',
      p_hint: data.hint || null,
      p_options: data.options ? JSON.stringify(data.options) : null,
    };

    console.log('[DataManagement] 添加单词:', wordParams);

    if (editingWord) {
      // 编辑单词 - 仍使用原有 update API（因为没有 update RPC）
      const response = await wordAPI.updateWord(editingWord.id, { ...data, collectionId: selectedCollectionId });
      if (response.success) {
        toast.success('更新词汇成功');
        loadWords(selectedCollectionId);
      } else {
        toast.error(response.error || '更新词汇失败');
        throw new Error(response.error);
      }
    } else {
      // 添加单词 - 使用新的 RPC
      const { data: newWord, error } = await supabase.rpc('add_single_word', wordParams);

      if (error) {
        console.error('RPC add_single_word error:', error);
        toast.error(`添加失败: ${error.message}`);
        throw new Error(error.message);
      } else {
        console.log('[DataManagement] 添加成功:', newWord);
        toast.success('添加词汇成功');

        // 手动更新当前选中教材的 word_count
        if (selectedCollection) {
          const newWordCount = selectedCollection.word_count + 1;
          setSelectedCollection({
            ...selectedCollection,
            word_count: newWordCount
          });

          // 添加后，如果当前页数据量不足，补充数据
          const newTotalPages = Math.ceil(newWordCount / WORDS_PER_PAGE);
          if (currentPage === newTotalPages || newTotalPages > totalPages) {
            loadWords(selectedCollectionId, currentPage, WORDS_PER_PAGE);
          }
        } else {
          loadWords(selectedCollectionId);
        }

        // 重新加载教材列表（数据库触发器会自动更新 word_count）
        loadCollections();
      }
    }
  } catch (err) {
    console.error('提交词汇失败:', err);
    throw err;
  }
};
```

---

## 📝 方案2：使用 `add_batch_words` RPC

### 替换 `handleBatchSubmitWords` 函数

```typescript
const handleBatchSubmitWords = async (batchWords: any[]) => {
  if (!selectedCollectionId) {
    toast.error('请先选择教材');
    throw new Error('未选择教材');
  }

  try {
    // 准备批量数据 - 转换为 RPC 期望的格式
    const batchData = batchWords.map(wordData => ({
      word: wordData.word,
      definition: wordData.definition,
      audio_text: wordData.audioText || wordData.definition,
      difficulty: wordData.difficulty || 'easy',
      answer: wordData.answer || '',
      hint: wordData.hint || null,
      // 可选字段（如果提供才添加）
      ...(wordData.options && { options: JSON.stringify(wordData.options) }),
    }));

    // 准备 RPC 参数
    const batchParams = {
      p_collection_id: selectedCollectionId,
      p_words_batch: JSON.stringify(batchData)
    };

    console.log('[DataManagement] 批量添加单词:', batchParams);

    // 显示进度
    toast.loading(`正在添加 ${batchData.length} 个单词...`, { id: 'batch-add' });

    // 调用 RPC
    const { data: newWordsList, error } = await supabase.rpc('add_batch_words', batchParams);

    if (error) {
      console.error('RPC add_batch_words error:', error);
      toast.dismiss('batch-add');
      toast.error(`批量添加失败: ${error.message}`);
      throw new Error(error.message);
    } else {
      console.log('[DataManagement] 批量添加成功:', newWordsList);
      toast.dismiss('batch-add');

      const successCount = newWordsList?.length || 0;
      toast.success(`成功添加 ${successCount} 个词汇`);

      // 重新加载词汇列表
      if (selectedCollectionId) {
        // 手动更新当前选中教材的 word_count
        if (selectedCollection && successCount > 0) {
          const newWordCount = selectedCollection.word_count + successCount;
          setSelectedCollection({
            ...selectedCollection,
            word_count: newWordCount
          });

          // 批量添加后，如果当前是最后一页或增加了新页，刷新数据
          const newTotalPages = Math.ceil(newWordCount / WORDS_PER_PAGE);
          if (currentPage === newTotalPages || newTotalPages > totalPages) {
            loadWords(selectedCollectionId, currentPage, WORDS_PER_PAGE);
          }
        } else {
          loadWords(selectedCollectionId);
        }

        // 重新加载教材列表（数据库触发器会自动更新 word_count）
        loadCollections();
      }
    }
  } catch (err) {
    console.error('批量添加失败:', err);
    toast.dismiss('batch-add');
    toast.error('批量添加失败，请重试');
    throw err;
  }
};
```

---

## 🔍 参数映射对比

### 单条添加参数映射
| 现有字段 | 新RPC参数 | 必填 | 默认值 | 说明 |
|---------|-----------|------|--------|------|
| `data.word` | `p_word` | ✅ | - | 单词 |
| `data.definition` | `p_definition` | ✅ | - | 定义 |
| `data.audioText` | `p_audio_text` | ✅ | `data.definition` | 音频文本 |
| `data.difficulty` | `p_difficulty` | ✅ | `'easy'` | 难度 |
| `data.answer` | `p_answer` | ❌ | `''` | 答案 |
| `data.hint` | `p_hint` | ❌ | `null` | 提示 |
| `data.options` | `p_options` | ❌ | `null` | 选项数组（JSON字符串） |
| `selectedCollectionId` | `p_collection_id` | ✅ | - | 教材ID |

### 批量添加参数映射
| 现有字段 | 新RPC参数 | 说明 |
|---------|-----------|------|
| `wordData.word` | `word` | 单词 |
| `wordData.definition` | `definition` | 定义 |
| `wordData.audioText` | `audio_text` | 音频文本 |
| `wordData.difficulty` | `difficulty` | 难度 |
| `wordData.answer` | `answer` | 答案 |
| `wordData.hint` | `hint` | 提示 |
| `wordData.options` | `options` | 选项（JSON.stringify） |
| `selectedCollectionId` | `p_collection_id` | 教材ID |
| `[...batchWords]` | `p_words_batch` | 批量数据数组（JSON.stringify） |

---

## ✅ 替换后的优势

1. **更强的性能** - 后端处理批量插入，减少网络往返
2. **更好的并发控制** - RPC函数在数据库层面处理事务
3. **错误处理更精确** - 可以返回部分成功的单词列表
4. **自动递增** - `word_order` 由数据库自动计算
5. **数据验证** - 后端统一验证，避免前后端不一致

---

## 🎯 实施建议

### 推荐方案
- **单条添加**：使用 `add_single_word` RPC
- **批量添加**：使用 `add_batch_words` RPC
- **编辑功能**：继续使用原有 `wordAPI.updateWord()`（暂无RPC）

### 测试建议
1. 测试单条添加（正常流程）
2. 测试批量添加（大量数据）
3. 测试错误处理（重复数据、必填字段缺失）
4. 验证 `word_order` 自动递增
5. 验证数据库触发器更新 `word_count`

---

**下一步行动：**
选择方案并替换 `src/components/DataManagementPage.tsx` 中的相关函数

**预计修改时间：** 30分钟
**风险等级：** 低（编辑功能保持不变）
