# 管理员数据审阅增强功能设计文档

## 概述

本设计文档描述了管理员数据管理页面的增强功能，主要包括在单词列表中增加序号列显示、新增按序号排序功能，以及创建专门的横版审阅弹框来提高题目审阅和编辑的效率。该功能将显著改善管理员的工作流程，使其能够更快速地浏览、编辑和管理教材中的题目。

## 架构

### 整体架构
系统采用现有的三层架构模式：
- **表现层**: React组件负责UI渲染和用户交互
- **业务逻辑层**: 自定义Hooks和工具函数处理业务逻辑
- **数据访问层**: SupabaseAPI处理数据库操作

### 新增组件架构
```
DataManagementPage (现有)
├── WordListTable (增强)
│   ├── OrderColumn (新增)
│   └── SortControls (增强)
└── WordReviewModal (新增)
    ├── WordNavigator (新增)
    ├── WordEditor (新增)
    └── BatchSaveManager (新增)
```

## 组件和接口

### 1. 增强的单词列表组件 (WordListTable)

#### 新增Props
```typescript
interface WordListTableProps {
  // 现有props...
  showOrderColumn?: boolean;
  onReviewClick?: () => void;
}
```

#### 新增状态
```typescript
interface WordListState {
  // 现有状态...
  sortBy: 'word' | 'created_at' | 'word_order';
}
```

### 2. 审阅弹框组件 (WordReviewModal)

```typescript
interface WordReviewModalProps {
  isOpen: boolean;
  collectionId: string;
  gameId: string;
  onClose: () => void;
  onDataChange?: () => void;
}

interface WordReviewState {
  currentIndex: number;
  words: WordData[];
  pendingChanges: Map<number, Partial<WordData>>;
  isLoading: boolean;
  isSaving: boolean;
}
```

### 3. 单词导航器组件 (WordNavigator)

```typescript
interface WordNavigatorProps {
  currentIndex: number;
  totalCount: number;
  onPrevious: () => void;
  onNext: () => void;
  hasUnsavedChanges: boolean;
}
```

### 4. 单词编辑器组件 (WordEditor)

```typescript
interface WordEditorProps {
  word: WordData;
  onChange: (field: keyof WordData, value: any) => void;
  errors?: Partial<Record<keyof WordData, string>>;
}
```

### 5. 批量保存管理器 (BatchSaveManager)

```typescript
interface BatchSaveManagerProps {
  pendingChanges: Map<number, Partial<WordData>>;
  onSave: () => Promise<void>;
  onClear: () => void;
}
```

## 数据模型

### 增强的WordData接口
```typescript
interface WordData {
  id: number;
  word: string;
  definition: string;
  audioText: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: string[];
  answer: string;
  hint: string;
  word_order?: number; // 新增字段
  created_at?: string;
}
```

### 批量修改数据结构
```typescript
interface PendingChange {
  wordId: number;
  changes: Partial<WordData>;
  timestamp: number;
}

interface BatchUpdateRequest {
  collectionId: string;
  updates: Array<{
    id: number;
    data: Partial<WordData>;
  }>;
}
```

## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上，是关于系统应该做什么的正式声明。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### 属性反思

在生成最终属性之前，我需要识别和消除冗余：

**冗余分析:**
- 属性2.2和2.3都涉及排序功能，但2.3是2.2的特殊情况，可以合并为一个更全面的排序属性
- 属性5.1和5.4都涉及编辑状态管理，可以合并为一个编辑行为属性
- 属性6.5和9.2都涉及状态保持，但作用于不同场景，保持独立
- 属性7.3和7.5都涉及删除操作，但7.5是7.3的数据一致性验证，保持独立
- 属性8.1和8.2涉及批量操作的不同阶段，保持独立

**合并决策:**
- 合并2.2和2.3为综合排序属性
- 合并5.1和5.4为编辑状态管理属性
- 其他属性提供独特的验证价值，保持独立

### 属性1: 序号列数据显示一致性
*对于任何*单词列表和word_order值，显示的序号应该与数据库中存储的word_order字段值完全一致
**验证: 需求 1.2**

### 属性2: 序号排序完整性
*对于任何*包含word_order字段的单词集合，按序号排序应该正确处理所有数值（包括null/undefined值排在最后）并保持排序方向一致性
**验证: 需求 2.2, 2.3**

### 属性3: 编辑状态管理一致性
*对于任何*字段编辑操作，系统应该正确维护编辑状态、暂存修改内容，并在界面上反映修改状态
**验证: 需求 5.1, 5.4**

### 属性4: 输入验证规则完整性
*对于任何*字段类型和输入值，系统应该根据字段类型应用正确的验证规则并提供相应的错误反馈
**验证: 需求 5.2, 5.3**

### 属性5: 导航状态边界处理
*对于任何*题目索引位置，导航按钮的启用/禁用状态应该正确反映当前位置（第一个/最后一个）的边界条件
**验证: 需求 6.2, 6.3**

### 属性6: 题目切换状态重置
*对于任何*题目切换操作，新题目应该显示完整信息并重置所有编辑状态到初始状态
**验证: 需求 6.5**

### 属性7: 删除操作数据一致性
*对于任何*删除操作，系统应该正确更新教材计数、调整当前索引位置，并保持数据的一致性
**验证: 需求 7.3, 7.5**

### 属性8: 批量操作原子性
*对于任何*批量修改操作，所有暂存的修改应该作为一个原子操作提交，要么全部成功要么全部失败
**验证: 需求 8.1, 8.2**

### 属性9: 状态保持一致性
*对于任何*刷新操作，系统应该保持用户的排序、分页等界面设置，并正确调整分页以避免显示空页
**验证: 需求 9.2, 9.3**

### 属性10: 界面数据同步性
*对于任何*数据变更操作完成后，界面显示的状态应该与实际数据状态完全一致
**验证: 需求 9.4**

## 错误处理

### 1. 网络错误处理
- **连接超时**: 提供重试机制，最多重试3次
- **服务器错误**: 显示具体错误信息，保护用户修改内容

### 2. 数据验证错误
- **字段验证失败**: 实时显示验证错误，阻止无效数据提交
- **数据类型错误**: 提供类型转换提示和修正建议
- **必填字段缺失**: 高亮显示缺失字段，提供填写指导

### 3. 操作失败处理
- **提交失败**: 显示错误信息，保留用户修改内容
- **数据加载失败**: 提供重新加载选项

### 4. 用户操作错误
- **误操作防护**: 删除等危险操作提供确认对话框
- **数据丢失防护**: 未保存修改时提供离开确认
- **操作撤销**: 提供最近操作的撤销功能

## 测试策略

### 单元测试
本功能将采用双重测试方法，结合单元测试和属性测试：

**单元测试覆盖范围:**
- 组件渲染测试：验证UI元素正确显示
- 用户交互测试：验证点击、输入等操作响应
- 边界条件测试：验证空数据、极值等特殊情况
- 错误处理测试：验证各种错误场景的处理

**重点测试场景:**
- 序号列的显示和隐藏
- 排序功能的切换和状态保持
- 审阅弹框的打开和关闭
- 字段编辑的状态管理
- 导航按钮的状态控制

### 属性测试
使用**fast-check**库进行属性测试，每个属性测试运行最少100次迭代：

**属性测试配置:**
- 测试库：fast-check (JavaScript/TypeScript属性测试库)
- 迭代次数：每个属性测试最少100次
- 数据生成：智能生成器约束到有效输入空间

**属性测试实现要求:**
- 每个正确性属性必须对应一个属性测试
- 每个属性测试必须用注释标记对应的设计文档属性
- 使用格式：`**Feature: admin-data-review-enhancement, Property {number}: {property_text}**`
- 避免使用模拟数据，测试真实功能逻辑

**测试数据生成策略:**
- WordData生成器：生成包含所有字段的有效单词数据
- 排序数据生成器：生成包含各种word_order值的数据集
- 编辑操作生成器：生成各种字段修改操作序列
- 边界条件生成器：生成空值、极值等边界情况

### 集成测试
- **API集成测试**: 验证与Supabase API的交互
- **组件集成测试**: 验证组件间的数据传递和状态同步
- **用户流程测试**: 验证完整的用户操作流程

### 性能测试
- **大数据量测试**: 测试处理大量题目时的性能表现
- **批量操作测试**: 测试批量修改和提交的性能
- **内存使用测试**: 监控长时间使用时的内存占用