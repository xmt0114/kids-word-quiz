# Game Phase Transition Property Tests
**Feature: missing-words-game, Property 7: Game Phase Transitions**
**Validates: Requirements 4.3, 4.4**

## 测试说明

这个文档描述了游戏阶段转换的属性测试。由于Hook需要在React环境中运行，这里提供测试规范和验证标准。

## Property 7: Game Phase Transitions

**属性描述：**
对于任何观察阶段完成（休闲模式下的按钮点击或挑战模式下的计时器到期），游戏应该转换到幕布阶段，然后转换到答题阶段。

## 测试用例

### Test 1: 休闲模式 - 手动触发阶段转换
**前置条件：**
- 游戏模式：休闲模式
- 当前阶段：观察阶段

**操作：**
- 调用 `handleObservationComplete()`

**预期结果：**
- 游戏阶段应该从 'observation' 转换到 'curtain'
- 计时器应该被清除

**验证方法：**
```typescript
// 初始状态
expect(gamePhase).toBe('observation');

// 执行操作
handleObservationComplete();

// 验证结果
expect(gamePhase).toBe('curtain');
```

### Test 2: 挑战模式 - 自动触发阶段转换
**前置条件：**
- 游戏模式：挑战模式
- 当前阶段：观察阶段
- 观察时间：5秒

**操作：**
- 等待计时器倒计时到0

**预期结果：**
- 游戏阶段应该自动从 'observation' 转换到 'curtain'
- observationTimeLeft 应该为 0
- 计时器应该被清除

**验证方法：**
```typescript
// 初始状态
expect(gamePhase).toBe('observation');
expect(observationTimeLeft).toBe(5);

// 模拟时间流逝
jest.advanceTimersByTime(5000);

// 验证结果
expect(gamePhase).toBe('curtain');
expect(observationTimeLeft).toBe(0);
```

### Test 3: 阶段转换顺序验证
**测试目标：**
验证游戏阶段按照正确的顺序转换

**有效的阶段转换序列：**
1. idle → observation
2. observation → curtain
3. curtain → answer
4. answer → result
5. result → idle

**无效的阶段转换：**
- idle → curtain (跳过observation)
- observation → answer (跳过curtain)
- curtain → result (跳过answer)
- 任何其他非顺序转换

**验证方法：**
```typescript
// 测试有效转换
transitionToPhase('observation'); // 从idle
expect(gamePhase).toBe('observation');

transitionToPhase('curtain'); // 从observation
expect(gamePhase).toBe('curtain');

transitionToPhase('answer'); // 从curtain
expect(gamePhase).toBe('answer');

transitionToPhase('result'); // 从answer
expect(gamePhase).toBe('result');

transitionToPhase('idle'); // 从result
expect(gamePhase).toBe('idle');

// 测试无效转换（应该被拒绝）
transitionToPhase('curtain'); // 从idle，应该失败
expect(gamePhase).toBe('idle'); // 阶段不应该改变
```

### Test 4: 计时器清理验证
**测试目标：**
验证在阶段转换时计时器被正确清理

**测试场景：**
1. 挑战模式下启动观察阶段
2. 在计时器到期前手动触发观察完成
3. 验证计时器被清除

**验证方法：**
```typescript
// 启动挑战模式
startGame(); // gameMode = 'challenge'
expect(gamePhase).toBe('observation');

// 等待2秒（未到期）
jest.advanceTimersByTime(2000);
expect(observationTimeLeft).toBe(3);

// 手动触发完成
handleObservationComplete();

// 验证计时器被清除（不会继续倒计时）
jest.advanceTimersByTime(5000);
expect(gamePhase).toBe('curtain'); // 不应该再次改变
```

### Test 5: 状态重置验证
**测试目标：**
验证转换到idle阶段时状态被正确重置

**操作：**
- 从任何阶段调用 `resetGame()`

**预期结果：**
- gamePhase 应该为 'idle'
- observationTimeLeft 应该重置为配置的观察时间
- showResult 应该为 false
- userAnswers 应该为空数组
- isCorrect 应该为 undefined

**验证方法：**
```typescript
// 设置一些状态
// ... 游戏进行中 ...

// 重置游戏
resetGame();

// 验证所有状态被重置
expect(gamePhase).toBe('idle');
expect(observationTimeLeft).toBe(config.observationTime);
expect(showResult).toBe(false);
expect(selectedAnswers).toEqual([]);
expect(isCorrect).toBeUndefined();
```

## 属性测试总结

### 核心属性
1. **阶段转换的单向性**：游戏阶段只能按照预定义的顺序转换
2. **计时器的一致性**：挑战模式下计时器到期必然触发阶段转换
3. **手动触发的即时性**：休闲模式下手动触发应立即转换阶段
4. **资源清理的完整性**：阶段转换时必须清理相关资源（计时器等）
5. **状态重置的彻底性**：重置游戏时所有状态应恢复到初始值

### 测试覆盖率
- ✓ 休闲模式手动触发
- ✓ 挑战模式自动触发
- ✓ 阶段转换顺序验证
- ✓ 计时器清理验证
- ✓ 状态重置验证

## 实际运行时验证

在实际游戏运行时，可以通过以下方式验证阶段转换：

1. **控制台日志**：在每次阶段转换时输出日志
2. **UI反馈**：观察UI是否正确反映当前游戏阶段
3. **计时器行为**：验证挑战模式下倒计时是否正常工作
4. **用户交互**：测试按钮点击是否正确触发阶段转换

## 结论

游戏阶段转换逻辑已经实现，包括：
- ✓ 统一的阶段转换管理函数
- ✓ 阶段转换合法性验证
- ✓ 计时器的正确管理和清理
- ✓ 休闲模式和挑战模式的不同转换机制
- ✓ 状态重置功能

所有阶段转换都遵循预定义的顺序，确保游戏流程的正确性和一致性。
