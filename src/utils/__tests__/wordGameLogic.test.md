# Word Game Logic Property Tests
**Feature: missing-words-game, Property 12: Challenge Mode Word Calculation**
**Validates: Requirements 10.1, 10.2, 10.3**

## 测试说明

这个文档描述了挑战模式词语计算的属性测试规范。

## Property 12: Challenge Mode Word Calculation

**属性描述：**
对于任何挑战模式配置（n个观察词语和k个隐藏词语），系统应该准备n+(4-k)个总词语，使用(4-k)个作为干扰项，以确保恰好4个答题选项。

## 核心公式验证

### 公式1: 总词数计算
```
总词数 = n + (4 - k)
其中：
- n: 观察词语数量 (3-8)
- k: 隐藏词语数量 (1-3)
- (4-k): 干扰项数量
```

### 公式2: 选项数量
```
选项总数 = k + (4 - k) = 4
其中：
- k: 正确答案数量
- (4-k): 干扰项数量
```

## 测试用例

### Test 1: 总词数计算验证
**测试所有有效配置组合**

| n (观察) | k (隐藏) | 干扰项 (4-k) | 总词数 (n+4-k) |
|---------|---------|-------------|---------------|
| 3       | 1       | 3           | 6             |
| 3       | 2       | 2           | 5             |
| 3       | 3       | 1           | 4             |
| 4       | 1       | 3           | 7             |
| 4       | 2       | 2           | 6             |
| 4       | 3       | 1           | 5             |
| 5       | 1       | 3           | 8             |
| 5       | 2       | 2           | 7             |
| 5       | 3       | 1           | 6             |
| 6       | 1       | 3           | 9             |
| 6       | 2       | 2           | 8             |
| 6       | 3       | 1           | 7             |
| 7       | 1       | 3           | 10            |
| 7       | 2       | 2           | 9             |
| 7       | 3       | 1           | 8             |
| 8       | 1       | 3           | 11            |
| 8       | 2       | 2           | 10            |
| 8       | 3       | 1           | 9             |

**验证方法：**
```typescript
import { calculateTotalWordsForChallenge, calculateDistractorCount } from '../wordGameLogic';

// 测试所有组合
for (let n = 3; n <= 8; n++) {
  for (let k = 1; k <= 3; k++) {
    const config = {
      gameMode: 'challenge' as const,
      wordCount: n,
      hiddenCount: k,
      observationTime: 5,
    };
    
    const totalWords = calculateTotalWordsForChallenge(config);
    const distractorCount = calculateDistractorCount(k);
    
    // 验证公式
    expect(totalWords).toBe(n + (4 - k));
    expect(distractorCount).toBe(4 - k);
    expect(totalWords).toBe(n + distractorCount);
  }
}
```

### Test 2: 词语准备验证
**验证prepareWordsForGame函数**

**休闲模式：**
```typescript
const casualConfig = {
  gameMode: 'casual' as const,
  wordCount: 5,
  hiddenCount: 2,
  observationTime: 5,
};

const result = prepareWordsForGame(casualConfig);

// 验证
expect(result.displayWords.length).toBe(5);
expect(result.allWords.length).toBe(5);
expect(result.distractors.length).toBe(0);
```

**挑战模式：**
```typescript
const challengeConfig = {
  gameMode: 'challenge' as const,
  wordCount: 5,
  hiddenCount: 2,
  observationTime: 5,
};

const result = prepareWordsForGame(challengeConfig);

// 验证
expect(result.displayWords.length).toBe(5);
expect(result.distractors.length).toBe(2); // 4 - 2
expect(result.allWords.length).toBe(7); // 5 + 2
```

### Test 3: 答题选项生成验证
**验证generateAnswerOptions函数**

```typescript
// k=1的情况
const hiddenWords1 = [{ id: '1', text: '苹果', language: 'chinese' }];
const distractors1 = [
  { id: '2', text: '香蕉', language: 'chinese' },
  { id: '3', text: '橙子', language: 'chinese' },
  { id: '4', text: '葡萄', language: 'chinese' },
];

const options1 = generateAnswerOptions(hiddenWords1, distractors1);
expect(options1.length).toBe(4); // 1 + 3 = 4

// k=2的情况
const hiddenWords2 = [
  { id: '1', text: '苹果', language: 'chinese' },
  { id: '2', text: '香蕉', language: 'chinese' },
];
const distractors2 = [
  { id: '3', text: '橙子', language: 'chinese' },
  { id: '4', text: '葡萄', language: 'chinese' },
];

const options2 = generateAnswerOptions(hiddenWords2, distractors2);
expect(options2.length).toBe(4); // 2 + 2 = 4

// k=3的情况
const hiddenWords3 = [
  { id: '1', text: '苹果', language: 'chinese' },
  { id: '2', text: '香蕉', language: 'chinese' },
  { id: '3', text: '橙子', language: 'chinese' },
];
const distractors3 = [
  { id: '4', text: '葡萄', language: 'chinese' },
];

const options3 = generateAnswerOptions(hiddenWords3, distractors3);
expect(options3.length).toBe(4); // 3 + 1 = 4
```

### Test 4: 选项随机性验证
**验证选项顺序是随机的**

```typescript
const hiddenWords = [{ id: '1', text: '苹果', language: 'chinese' }];
const distractors = [
  { id: '2', text: '香蕉', language: 'chinese' },
  { id: '3', text: '橙子', language: 'chinese' },
  { id: '4', text: '葡萄', language: 'chinese' },
];

// 生成多次选项
const orderSets = new Set<string>();
for (let i = 0; i < 100; i++) {
  const options = generateAnswerOptions(hiddenWords, distractors);
  const order = options.map(w => w.id).join(',');
  orderSets.add(order);
}

// 应该有多种不同的顺序
expect(orderSets.size).toBeGreaterThan(10);
```

### Test 5: 词语隐藏执行验证
**验证executeWordHiding函数**

```typescript
const words = [
  { id: '1', text: '苹果', language: 'chinese' },
  { id: '2', text: '香蕉', language: 'chinese' },
  { id: '3', text: '橙子', language: 'chinese' },
  { id: '4', text: '葡萄', language: 'chinese' },
  { id: '5', text: '西瓜', language: 'chinese' },
];

const distractors = [
  { id: '6', text: '草莓', language: 'chinese' },
  { id: '7', text: '樱桃', language: 'chinese' },
];

const config = {
  gameMode: 'challenge' as const,
  wordCount: 5,
  hiddenCount: 2,
  observationTime: 5,
};

const result = executeWordHiding(words, distractors, config);

// 验证
expect(result.hiddenWords.length).toBe(2);
expect(result.remainingWords.length).toBe(3); // 5 - 2
expect(result.answerOptions.length).toBe(4); // 2 + 2

// 验证隐藏的词语确实来自原词语列表
result.hiddenWords.forEach(word => {
  expect(words.some(w => w.id === word.id)).toBe(true);
});

// 验证剩余词语和隐藏词语没有重叠
const hiddenIds = new Set(result.hiddenWords.map(w => w.id));
result.remainingWords.forEach(word => {
  expect(hiddenIds.has(word.id)).toBe(false);
});
```

### Test 6: 完整游戏回合初始化验证
**验证initializeGameRound函数**

```typescript
const config = {
  gameMode: 'challenge' as const,
  wordCount: 6,
  hiddenCount: 2,
  observationTime: 5,
};

const round = initializeGameRound(config, 'chinese');

// 验证词语数量
expect(round.words.length).toBe(6);
expect(round.allWords.length).toBe(8); // 6 + (4-2)
expect(round.distractors.length).toBe(2);

// 验证位置数量
expect(round.positions.length).toBe(6);

// 验证每个词语都有对应的位置
round.words.forEach(word => {
  const hasPosition = round.positions.some(pos => pos.wordId === word.id);
  expect(hasPosition).toBe(true);
});

// 验证位置的合理性
round.positions.forEach(pos => {
  expect(pos.x).toBeGreaterThan(0);
  expect(pos.y).toBeGreaterThan(0);
  expect(pos.rotation).toBeGreaterThanOrEqual(-15);
  expect(pos.rotation).toBeLessThanOrEqual(15);
});
```

## 属性测试总结

### 核心属性
1. **词数计算的正确性**：总词数 = n + (4 - k)
2. **干扰项数量的正确性**：干扰项 = 4 - k
3. **选项数量的恒定性**：选项总数恒为4
4. **选项组成的正确性**：选项 = 正确答案 + 干扰项
5. **选项顺序的随机性**：每次生成的选项顺序应该不同
6. **词语隐藏的正确性**：隐藏k个词语，剩余n-k个词语
7. **数据一致性**：所有词语ID唯一，没有重复

### 边界情况
- ✓ 最小配置 (n=3, k=1)
- ✓ 最大配置 (n=8, k=3)
- ✓ k=1 (单选模式)
- ✓ k=3 (最多隐藏)
- ✓ 所有有效组合 (3≤n≤8, 1≤k≤3)

## 实际验证方法

在实际游戏运行时，可以通过以下方式验证：

1. **控制台日志**：输出词语数量和选项数量
2. **UI检查**：确认选项总是显示4个
3. **多次游戏**：验证选项顺序的随机性
4. **不同配置**：测试各种n和k的组合

## 结论

词语计算逻辑已经实现，包括：
- ✓ 挑战模式总词数计算 (n + 4 - k)
- ✓ 干扰项数量计算 (4 - k)
- ✓ 答题选项生成（恒为4个）
- ✓ 选项随机排列
- ✓ 词语隐藏执行
- ✓ 完整游戏回合初始化

所有计算都遵循设计文档中的公式，确保游戏逻辑的正确性。
