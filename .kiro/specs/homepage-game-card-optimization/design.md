# 设计文档

## 概述

首页游戏卡片优化功能旨在提供更紧凑、信息丰富的用户界面。通过移除冗余信息（"初级到高级"和"5-15分钟"），集成教材信息和学习进度可视化，同时保持适合儿童的UI设计风格。该优化将提高信息密度，让用户能够快速了解每个游戏的当前教材和学习进度。

## 架构

### 组件层次结构
```
HomePage
├── GameCard (优化版本)
│   ├── GameIcon
│   ├── GameTitle & Description
│   ├── TextbookInfo (新增)
│   │   ├── TextbookName (可点击)
│   │   └── TextbookDropdown (新增)
│   ├── ProgressBar (新增)
│   └── ActionButtons
│       ├── StartGameButton
│       └── SettingsButton
```

### 数据流
1. **首页数据获取**: 使用新的 `get_homepage_data` RPC函数一次性获取所有游戏及其教材和进度信息
2. **教材切换**: 使用现有的 `wordAPI.getCollections(gameId)` 获取特定游戏的完整教材列表（仅在下拉菜单时调用）
3. **设置更新**: 使用现有的 `useAppStore.setSettings()` 更新教材选择

## 组件和接口

### GameCard 组件增强

#### 新增 Props
```typescript
interface GameCardProps {
  game: EnhancedGame; // 使用包含collection字段的增强游戏数据
  onStartGame: (game: Game) => void;
  onTextbookChange?: (gameId: string, collectionId: string) => void;
}

interface EnhancedGame extends Game {
  collection: {
    id: string;
    name: string;
    total_count: number;
    learning_count: number;
    mastered_count: number;
    remaining_count: number;
  };
}
```

#### 新增组件

**TextbookSelector 组件**
```typescript
interface TextbookSelectorProps {
  currentTextbook: string;
  gameId: string;
  onSelect: (collectionId: string) => void;
  // availableTextbooks 将在点击时动态获取
}
```

**ProgressBar 组件**
```typescript
interface ProgressBarProps {
  mastered: number;
  learning: number;
  remaining: number;
  total: number;
  className?: string;
}
```

### 状态管理集成

利用现有的 Zustand store 结构：
- `useAppStore.games` - 存储从 `get_homepage_data` 获取的增强游戏数据
- `useAppStore.userSettings` - 存储每个游戏的教材选择
- 新增 `useAppStore.loadHomepageData()` - 调用新的RPC函数获取首页数据

## 数据模型

### 扩展现有数据结构

**HomepageGameData** (基于新API响应)
```typescript
interface HomepageGameData {
  id: string;
  icon: string;
  type: string;
  title: string;
  language: string;
  is_active: boolean;
  description: string;
  text_config: GameTextConfig;
  default_config: QuizSettings;
  collection: {
    id: string;
    name: string;
    total_count: number;
    learning_count: number;
    mastered_count: number;
    remaining_count: number;
  };
  created_at: string;
  updated_at: string;
}
```

**TextbookDropdownState** (新增)
```typescript
interface TextbookDropdownState {
  isOpen: boolean;
  gameId: string | null;
  availableTextbooks: WordCollection[];
  isLoading: boolean;
}
```

## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式声明。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

基于预分析，以下是可测试的正确性属性：

**属性 1: 冗余信息移除**
*对于任何*游戏卡片渲染，输出不应包含"初级到高级"或"5-15分钟"文本
**验证: 需求 1.1, 1.2**

**属性 2: 卡片尺寸保持**
*对于任何*游戏卡片，优化后的卡片尺寸应与原始实现保持一致
**验证: 需求 1.3**

**属性 3: 布局元素对齐**
*对于任何*优化的游戏卡片，所有剩余元素应保持适当的CSS间距和对齐类
**验证: 需求 1.5**

**属性 4: 教材名称显示**
*对于任何*有效的游戏和教材数据，卡片应显示正确的当前教材名称
**验证: 需求 2.1**

**属性 5: 教材信息限制**
*对于任何*教材信息显示，应仅包含教材名称，不包含年级或其他详细信息
**验证: 需求 2.2**

**属性 6: 默认教材选择**
*对于任何*教材列表，系统应自动选择第一个教材作为默认选项
**验证: 需求 2.3**

**属性 7: 加载状态布局稳定性**
*对于任何*加载状态，卡片布局应保持稳定不变形
**验证: 需求 2.4**

**属性 8: 数据不可用后备处理**
*对于任何*教材数据不可用的情况，应显示适当的后备内容
**验证: 需求 2.5**

**属性 9: 进度条渲染**
*对于任何*有效的学习进度数据，应渲染包含三个颜色段的进度条
**验证: 需求 3.1**

**属性 10: 进度条颜色正确性**
*对于任何*进度条，已掌握部分应使用深绿色，学习部分应使用浅绿色，剩余部分应使用灰色
**验证: 需求 3.2, 3.3, 3.4**

**属性 11: 进度条纯图形化**
*对于任何*进度条渲染，不应包含任何文字标注或数字
**验证: 需求 3.5**

**属性 12: 教材选择交互**
*对于任何*教材名称点击，应显示对应游戏的教材下拉菜单
**验证: 需求 4.1**

**属性 13: 教材切换更新**
*对于任何*教材选择操作，游戏设置应立即更新为新选择的教材
**验证: 需求 4.2**

**属性 14: 进度数据刷新**
*对于任何*教材切换，应触发新教材的学习进度数据获取
**验证: 需求 4.3**

**属性 15: 菜单外部点击关闭**
*对于任何*打开的下拉菜单，点击菜单区域外应关闭菜单
**验证: 需求 4.4**

**属性 16: 儿童UI风格保持**
*对于任何*UI元素，应保持现有的配色方案、字体样式和交互效果
**验证: 需求 5.1, 5.2, 5.4**

**属性 17: 进度条样式一致性**
*对于任何*进度条，应使用与当前UI风格一致的圆角和过渡效果
**验证: 需求 5.3**

## 错误处理

### 数据获取错误
- **教材列表获取失败**: 显示"暂无教材"并禁用教材选择功能
- **进度数据获取失败**: 隐藏进度条，不影响其他功能
- **网络超时**: 显示加载状态，提供重试机制

### 用户交互错误
- **快速点击防抖**: 防止用户快速点击导致的重复请求
- **并发状态管理**: 确保教材切换时的状态一致性
- **菜单定位错误**: 自动调整下拉菜单位置以适应屏幕边界

### 数据一致性
- **教材ID不匹配**: 自动回退到默认教材
- **进度数据过期**: 自动刷新最新进度
- **设置同步失败**: 保持本地状态，后台重试

## 测试策略

### 单元测试
- **组件渲染测试**: 验证GameCard组件正确渲染所有必需元素
- **交互测试**: 测试教材选择、菜单开关等用户交互
- **数据处理测试**: 验证教材和进度数据的正确处理

### 属性基础测试
使用 **fast-check** 库进行属性基础测试：
- **UI渲染属性**: 验证组件在各种数据输入下的正确渲染
- **状态管理属性**: 验证教材切换和进度更新的状态一致性
- **交互行为属性**: 验证用户交互的正确响应

### 集成测试
- **数据流测试**: 验证从API获取到UI显示的完整数据流
- **状态同步测试**: 验证多个组件间的状态同步
- **错误恢复测试**: 验证各种错误情况下的系统恢复能力

### 视觉回归测试
- **布局一致性**: 确保优化后的卡片布局与设计稿一致
- **响应式设计**: 验证在不同屏幕尺寸下的显示效果
- **动画效果**: 确保过渡动画和悬停效果正常工作