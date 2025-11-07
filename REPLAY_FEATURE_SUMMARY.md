# "再来一局"功能实现总结

## 功能描述

实现了"再来一局"按钮的重新学习功能，允许用户使用完全相同的单词进行再一轮学习，同时确保在重新学习过程中不会更新学习进度。

## 核心特性

### 1. 重复学习模式
- 点击"再来一局"按钮后，使用上一轮游戏中完全相同的单词
- 跳过设置页面，直接开始游戏
- 保持相同的题目顺序和选项

### 2. 进度保护
- 重新学习模式下**不会**更新学习进度
- 只有正常游戏模式才会推进学习进度
- 如果用户在重新学习过程中退出，这些单词被视为"未学习"

### 3. 数据流
```
游戏页面 → 结果页面 → 再次游戏页面
   ↑                      ↓
   └────── 传递题目列表 ────┘
```

## 实现细节

### 修改的文件

#### 1. `src/hooks/useQuiz.ts`
- 为 `initializeQuiz` 方法添加可选的 `questions` 参数
- 当提供预加载题目时，直接使用这些题目而不调用API
- 保持原有的API获取逻辑不变

#### 2. `src/components/GuessWordGamePage.tsx`
- 检测路由状态中的 `isReplay` 标志
- 在重新学习模式下，直接使用传递的题目列表初始化游戏
- 跳过从API获取单词的步骤
- 在游戏完成时，检查 `isReplay` 标志，只有在非replay模式下才更新学习进度

#### 3. `src/components/GuessWordResultPage.tsx`
- 在点击"再来一局"时，将本轮题目和 `isReplay` 标志传递给游戏页面
- 保持原有的导航逻辑

## 技术实现

### 题目传递机制
```typescript
// 结果页面 → 游戏页面
navigate('/guess-word/game', {
  state: {
    settings,
    collectionId,
    questions,      // 本轮使用的题目
    isReplay: true  // 重新学习标志
  }
});
```

### 初始化逻辑
```typescript
// 游戏页面检测replay模式
if (isReplay && passedQuestions && passedQuestions.length > 0) {
  // 使用预加载题目，不更新进度
  await initializeQuiz(finalSettings, collectionId, 0, passedQuestions);
  return;
}
```

### 进度保护
```typescript
// 只在非replay模式下更新进度
if (collectionId && totalWords > 0 && !isReplay) {
  advanceProgress(collectionId, completedQuestions, totalWords);
}
```

## 使用场景

1. **正常学习流程**
   - 从首页 → 设置页面 → 游戏 → 结果页面
   - 学习进度正常更新

2. **重新学习流程**
   - 从结果页面 → "再来一局" → 直接游戏（跳过设置）
   - 使用相同题目，不更新进度
   - 退出 = 视为未学习

## 优势

1. **用户体验优化**
   - 无需重复设置游戏参数
   - 可以专注练习特定单词

2. **学习效果**
   - 通过重复练习加深记忆
   - 避免不必要的进度推进

3. **数据完整性**
   - 清晰区分正常学习和重复练习
   - 进度数据更加准确

## 测试要点

1. 点击"再来一局"能否正确使用相同题目
2. 重新学习过程中退出是否未更新进度
3. 重新学习后的结果页面是否能再次点击"再来一局"
4. 从首页正常进入游戏是否仍然正常工作
5. 进度统计是否正确区分正常学习和重新学习

## 注意事项

- 重新学习模式下的题目数量限制为10题
- 如果传递的题目不足10题，则使用所有传递的题目
- 重新学习模式下仍会更新答题统计（正确/错误题数）
