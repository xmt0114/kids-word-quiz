# Design Document

## Overview

儿童识字量测试游戏（Literacy Assessment Game）是一个独立的游戏类型，采用自适应测试算法评估3-10岁儿童的汉字识字量。游戏通过TTS语音播报题目、多选项选择的方式进行测试，根据用户表现动态调整难度等级，最终生成正态分布图展示测试结果。

设计遵循以下原则：
- 独立性：与现有游戏类型（universal、typing、observe）完全隔离
- 儿童友好：色彩鲜艳、即时反馈、清晰引导
- 自适应：根据答题表现动态调整测试难度
- 无依赖：不依赖教材系统，不需要独立设置页面

## Architecture

### 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        HomePage                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Game Card: 儿童识字量测试 (type: shizi_test)        │  │
│  │  - 点击"开始游戏" → 导航到游戏页面                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              LiteracyAssessmentGamePage                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Phase 1: Age Selection (年龄选择)                    │  │
│  │  - 出生日期选择器                                      │  │
│  │  - 年龄验证 (3-10岁)                                  │  │
│  │  - 保存上次选择的日期                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                              ↓                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Phase 2: Assessment (测试进行中)                     │  │
│  │  - 显示当前题目 (4个选项)                             │  │
│  │  - TTS播放audio_prompt_text                           │  │
│  │  - 用户选择答案                                        │  │
│  │  - 即时反馈 (正确/错误音效+视觉)                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                              ↓                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Phase 3: Level Transition (等级过渡)                 │  │
│  │  - 显示level_info的pass_message                       │  │
│  │  - 庆祝动画                                            │  │
│  │  - 后台请求下一级题目                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                              ↓                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Phase 4: Result (结果展示)                           │  │
│  │  - 正态分布图                                          │  │
│  │  - 识字量分数、百分位、等级                            │  │
│  │  - 结论文本                                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 数据流

```
用户选择出生日期
    ↓
调用 start_assessment_v6(birth_date)
    ↓
接收 packets (level, base_set, rescue_set, config, level_info)
    ↓
进行 base_set 测试
    ↓
计算正确率 → 判断是否触发 rescue_set
    ↓
构造 results 数组
    ↓
调用 submit_packet_v6(session_id, results)
    ↓
if status === "active": 接收新 packets，继续测试
if status === "completed": 显示最终结果
```

## Components and Interfaces

### 1. 路由配置

**文件**: `src/App.tsx`

添加新路由：
```typescript
<Route path="/literacy-assessment" element={<LiteracyAssessmentGamePage />} />
```

### 2. 游戏类型定义

**文件**: `src/types/index.ts`

更新 Game 类型：
```typescript
export interface Game {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'universal' | 'observe' | 'typing' | 'shizi_test'; // 添加新类型
  // ... 其他字段
}
```

### 3. 主游戏页面组件

**文件**: `src/components/LiteracyAssessmentGame/LiteracyAssessmentGamePage.tsx`

```typescript
interface LiteracyAssessmentGamePageProps {}

export const LiteracyAssessmentGamePage: React.FC<LiteracyAssessmentGamePageProps>
```

组件结构：
- 顶部导航栏（返回首页按钮）
- 主内容区域（根据phase渲染不同内容）
- 音效控制

### 4. 年龄选择组件

**文件**: `src/components/LiteracyAssessmentGame/AgeSelector.tsx`

```typescript
interface AgeSelectorProps {
  onAgeConfirm: (birthDate: string) => void;
  savedBirthDate?: string;
}

export const AgeSelector: React.FC<AgeSelectorProps>
```

功能：
- 日期选择器（年/月/日）
- 实时年龄计算和验证
- 错误提示（年龄超出范围）
- 保存/读取上次选择的日期

### 5. 题目展示组件

**文件**: `src/components/LiteracyAssessmentGame/QuestionDisplay.tsx`

```typescript
interface QuestionDisplayProps {
  question: AssessmentQuestion;
  onAnswer: (answer: string) => void;
  showFeedback: boolean;
  isCorrect?: boolean;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps>
```

功能：
- 显示4个选项（1个正确答案 + 最多3个混淆项）
- TTS自动播放audio_prompt_text
- 选项点击处理
- 即时视觉反馈（正确/错误）

### 6. 等级过渡组件

**文件**: `src/components/LiteracyAssessmentGame/LevelTransition.tsx`

```typescript
interface LevelTransitionProps {
  levelInfo: LevelInfo;
  onComplete: () => void;
}

export const LevelTransition: React.FC<LevelTransitionProps>
```

功能：
- 显示pass_message
- 显示title和vocab_milestone
- 庆祝动画（星星爆炸效果）
- 自动过渡到下一阶段

### 7. 结果展示组件

**文件**: `src/components/LiteracyAssessmentGame/ResultDisplay.tsx`

```typescript
interface ResultDisplayProps {
  report: AssessmentReport;
  onRestart: () => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps>
```

功能：
- 正态分布图绘制
- 显示识字量分数
- 显示百分位和等级
- 显示结论文本
- 重新测试按钮

### 8. 正态分布图组件

**文件**: `src/components/LiteracyAssessmentGame/NormalDistributionChart.tsx`

```typescript
interface NormalDistributionChartProps {
  chartData: ChartData;
  userScore: number;
}

export const NormalDistributionChart: React.FC<NormalDistributionChartProps>
```

功能：
- 绘制正态分布曲线
- 标记用户位置
- 显示四个等级区间（新手级、标准级、高手级、大师级）
- 处理超出最大值的情况

## Data Models

### 1. 游戏阶段 (GamePhase)

```typescript
type GamePhase = 
  | 'age-selection'    // 年龄选择
  | 'assessment'       // 测试进行中
  | 'level-transition' // 等级过渡
  | 'result';          // 结果展示
```

### 2. 测试会话 (AssessmentSession)

```typescript
interface AssessmentSession {
  sessionId: string;
  birthDate: string;
  currentPacketIndex: number;
  packets: LevelPacket[];
  allResults: PacketResult[];
}
```

### 3. 等级题包 (LevelPacket)

```typescript
interface LevelPacket {
  level: number;
  config: {
    drop_threshold: number;  // 失败阈值
    pass_threshold: number;  // 通过阈值
  };
  base_set: AssessmentQuestion[];
  rescue_set: AssessmentQuestion[];
  level_info: LevelInfo;
}
```

### 4. 测试题目 (AssessmentQuestion)

```typescript
interface AssessmentQuestion {
  id: number;
  character: string;
  audio_prompt_text: string;
  confusion_options: string[];
}
```

### 5. 等级信息 (LevelInfo)

```typescript
interface LevelInfo {
  title: string;
  pass_message: string;
  vocab_milestone: number;
}
```

### 6. 题包结果 (PacketResult)

```typescript
interface PacketResult {
  level: number;
  passed: boolean;
  correct: number;
  total: number;
}
```

### 7. 测试报告 (AssessmentReport)

```typescript
interface AssessmentReport {
  score: number;
  user_age: number;
  chart_data: ChartData;
  conclusion: Conclusion;
}

interface ChartData {
  mean: number;
  max_val: number;
  std_dev: number;
  user_percentile: number;
}

interface Conclusion {
  text: string;
  level_title: string;
  comparison_text: string;
}
```

### 8. 游戏状态 (GameState)

```typescript
interface GameState {
  phase: GamePhase;
  session: AssessmentSession | null;
  currentQuestion: AssessmentQuestion | null;
  currentQuestionIndex: number;
  currentSetType: 'base' | 'rescue';
  currentSetAnswers: boolean[];
  showFeedback: boolean;
  isCorrect: boolean | null;
  report: AssessmentReport | null;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Age Validation Boundary

*For any* birth date input, if the calculated age is less than 3 years or greater than 10 years, the system should reject the input and display an error message without proceeding to assessment.

**Validates: Requirements 1.2, 1.3**

### Property 2: Question Options Completeness

*For any* assessment question, the displayed options should contain exactly the correct answer (character field) plus the confusion_options, and the total number of options should not exceed 4.

**Validates: Requirements 3.1**

### Property 3: Base Set Threshold Logic

*For any* completed base_set, if the accuracy is greater than or equal to pass_threshold, the system should mark the level as passed without triggering rescue_set; if accuracy is less than or equal to drop_threshold, the system should mark as failed without triggering rescue_set; otherwise, rescue_set should be triggered.

**Validates: Requirements 4.2, 4.3, 4.4**

### Property 4: Rescue Set Total Accuracy

*For any* rescue_set that is triggered, the final pass/fail determination should be based on the combined accuracy of base_set and rescue_set against the pass_threshold.

**Validates: Requirements 5.2, 5.3, 5.4**

### Property 5: Early Termination on Failure

*For any* packet result with passed: false, the system should immediately stop processing remaining packets in the current submission and prepare to submit results.

**Validates: Requirements 7.2**

### Property 6: Session Continuation Logic

*For any* submit_packet_v6 response, if status is "active", the system should parse new packets and continue the assessment loop; if status is "completed", the system should transition to result display.

**Validates: Requirements 7.3, 7.4**

### Property 7: Chart Boundary Handling

*For any* user score that exceeds chart_data.max_val, the normal distribution chart should position the user marker at the rightmost edge of the chart without extending beyond the chart boundaries.

**Validates: Requirements 8.3**

### Property 8: Birth Date Persistence

*For any* valid birth date selection, after completing or exiting the game, when the user returns to the game, the previously selected birth date should be pre-filled in the age selector.

**Validates: Requirements 1.4, 1.5**

### Property 9: TTS Audio Playback

*For any* question display, the TTS engine should automatically play the audio_prompt_text when the question is loaded.

**Validates: Requirements 3.2**

### Property 10: Option Randomization

*For any* question display, the order of the 4 options (correct answer + confusion options) should be randomized to prevent position bias.

**Validates: Requirements 3.5**

### Property 11: Sound Effect Mapping

*For any* user interaction (correct answer, wrong answer, level pass, button click), the system should play the corresponding sound effect from the existing sound library.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

## Error Handling

### 1. 网络错误处理

**场景**: API调用失败（start_assessment_v6, submit_packet_v6）

**处理策略**:
- 显示友好的错误提示
- 提供重试按钮
- 最多重试3次
- 记录错误日志

### 2. 年龄验证错误

**场景**: 用户输入的年龄超出3-10岁范围

**处理策略**:
- 实时显示错误提示
- 禁用"开始测试"按钮
- 提供清晰的年龄要求说明

### 3. TTS播放失败

**场景**: 浏览器不支持TTS或播放失败

**处理策略**:
- 显示文本提示（fallback）
- 提供手动播放按钮
- 记录错误但不阻止游戏继续

### 4. 数据格式错误

**场景**: 后端返回的数据格式不符合预期

**处理策略**:
- 验证数据结构
- 使用默认值填充缺失字段
- 记录错误并显示通用错误提示

### 5. 会话过期

**场景**: session_id失效或过期

**处理策略**:
- 提示用户重新开始测试
- 清除本地会话数据
- 返回年龄选择阶段

## Testing Strategy

### 单元测试 (Unit Tests)

使用 Jest + React Testing Library 进行单元测试。

**测试范围**:
1. 年龄计算和验证逻辑
2. 题目选项随机化
3. 正确率计算
4. 阈值判断逻辑（pass/fail/rescue）
5. 结果构造逻辑
6. 正态分布图数据处理

**示例测试**:
```typescript
describe('Age Validation', () => {
  it('should reject age less than 3', () => {
    const birthDate = '2022-01-01';
    const result = validateAge(birthDate);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('年龄不能小于3岁');
  });

  it('should accept age between 3 and 10', () => {
    const birthDate = '2018-06-15';
    const result = validateAge(birthDate);
    expect(result.isValid).toBe(true);
  });
});
```

### 属性测试 (Property-Based Tests)

使用 fast-check 库进行属性测试，每个测试运行至少100次迭代。

**测试配置**:
```typescript
import fc from 'fast-check';

// 配置
const testConfig = {
  numRuns: 100,
  verbose: true
};
```

**Property 1: Age Validation Boundary**
```typescript
// Feature: literacy-assessment-game, Property 1: Age Validation Boundary
it('should reject ages outside 3-10 range', () => {
  fc.assert(
    fc.property(
      fc.date({ min: new Date('2000-01-01'), max: new Date('2025-12-31') }),
      (birthDate) => {
        const age = calculateAge(birthDate);
        const result = validateAge(birthDate.toISOString().split('T')[0]);
        
        if (age < 3 || age > 10) {
          expect(result.isValid).toBe(false);
        } else {
          expect(result.isValid).toBe(true);
        }
      }
    ),
    testConfig
  );
});
```

**Property 2: Question Options Completeness**
```typescript
// Feature: literacy-assessment-game, Property 2: Question Options Completeness
it('should always include correct answer in options', () => {
  fc.assert(
    fc.property(
      fc.record({
        character: fc.string({ minLength: 1, maxLength: 1 }),
        confusion_options: fc.array(fc.string({ minLength: 1, maxLength: 1 }), { minLength: 1, maxLength: 3 })
      }),
      (question) => {
        const options = generateOptions(question);
        
        expect(options).toContain(question.character);
        expect(options.length).toBeLessThanOrEqual(4);
      }
    ),
    testConfig
  );
});
```

**Property 3: Base Set Threshold Logic**
```typescript
// Feature: literacy-assessment-game, Property 3: Base Set Threshold Logic
it('should correctly determine pass/fail/rescue based on thresholds', () => {
  fc.assert(
    fc.property(
      fc.record({
        correct: fc.integer({ min: 0, max: 10 }),
        total: fc.constant(10),
        pass_threshold: fc.double({ min: 0.5, max: 1.0 }),
        drop_threshold: fc.double({ min: 0, max: 0.5 })
      }),
      (data) => {
        const accuracy = data.correct / data.total;
        const result = evaluateBaseSet(data);
        
        if (accuracy >= data.pass_threshold) {
          expect(result.status).toBe('pass');
          expect(result.triggerRescue).toBe(false);
        } else if (accuracy <= data.drop_threshold) {
          expect(result.status).toBe('fail');
          expect(result.triggerRescue).toBe(false);
        } else {
          expect(result.triggerRescue).toBe(true);
        }
      }
    ),
    testConfig
  );
});
```

**Property 10: Option Randomization**
```typescript
// Feature: literacy-assessment-game, Property 10: Option Randomization
it('should randomize option order', () => {
  fc.assert(
    fc.property(
      fc.record({
        character: fc.constant('字'),
        confusion_options: fc.constant(['学', '习', '好'])
      }),
      (question) => {
        const runs = 20;
        const orders = new Set();
        
        for (let i = 0; i < runs; i++) {
          const options = generateOptions(question);
          orders.add(options.join(','));
        }
        
        // 至少应该有2种不同的顺序
        expect(orders.size).toBeGreaterThan(1);
      }
    ),
    testConfig
  );
});
```

### 集成测试

**测试场景**:
1. 完整的测试流程（从年龄选择到结果展示）
2. API调用和响应处理
3. 状态管理和阶段转换
4. TTS播放和音效系统集成

### 端到端测试

使用 Playwright 或 Cypress 进行端到端测试。

**测试场景**:
1. 用户完整测试流程
2. 不同年龄段的测试体验
3. 网络错误恢复
4. 浏览器兼容性

## Implementation Notes

### 1. 样式实现

- 使用 Tailwind CSS utility classes
- 不创建新的 .css 文件
- 参考 MissingWordsGame 的色彩鲜艳风格
- 使用 cn() 工具函数组合类名

### 2. 状态管理

- 使用 Custom Hook: `useLiteracyAssessmentGame`
- 不依赖全局 store（除了音效系统）
- 本地状态管理游戏流程

### 3. TTS实现

- 复用现有的 `useSpeechSynthesis` hook
- 参考 UniversalGamePage 的 TTS 使用方式
- 自动播放 + 手动重播按钮

### 4. 音效系统

- 使用 `useAppStore` 的 `playSound` 方法
- 音效类型：
  - 'correct': 答对
  - 'wrong': 答错
  - 'success': 通过等级
  - 'click': 按钮点击

### 5. 路由和导航

- 路由路径: `/literacy-assessment`
- 从首页卡片点击进入
- 返回首页使用 `navigate('/')`

### 6. 数据持久化

- 使用 localStorage 保存上次选择的出生日期
- key: `literacy-assessment-birth-date`
- 格式: `YYYY-MM-DD`

### 7. API调用

- 使用 `wordAPI` 或直接使用 supabase client
- RPC函数：
  - `start_assessment_v6`
  - `submit_packet_v6`
- 错误处理和重试逻辑

### 8. 组件文件结构

```
src/components/LiteracyAssessmentGame/
├── index.ts
├── LiteracyAssessmentGamePage.tsx
├── AgeSelector.tsx
├── QuestionDisplay.tsx
├── LevelTransition.tsx
├── ResultDisplay.tsx
└── NormalDistributionChart.tsx

src/hooks/
└── useLiteracyAssessmentGame.ts

src/types/
└── literacyAssessment.ts
```

### 9. 首页集成

在 HomePage 中添加游戏卡片：
- 游戏类型: `shizi_test`
- 标题: "儿童识字量测试"
- 描述: "测测你认识多少汉字"
- 图标: 使用合适的 emoji 或图标
- 点击跳转到 `/literacy-assessment`
