# 设计文档

## 概述

本设计文档描述了如何清理和整合guess_word游戏的遗留代码，将其完全迁移到通用多游戏架构中。项目最初是单游戏架构（只有guess_word），后来发展为多游戏架构，但在转换过程中留下了一些guess_word特定的遗留代码。

清理的目标是：
1. 识别所有guess_word特定的遗留代码
2. 将guess_word路由迁移到通用路由系统
3. 移除冗余的guess_word特定组件
4. 更新应用配置以使用通用游戏系统
5. 彻底清理所有guess_word特定代码
6. 验证清理的完整性和成功性

## 架构

### 当前架构问题

通过代码分析，发现以下guess_word特定的遗留代码：

**路由层面:**
- `/guess-word/settings` - 应该使用 `/games/guess-word/settings`
- `/guess-word/game` - 应该使用 `/games/guess-word/play`
- `/guess-word/result` - 应该使用通用结果页面
- `/guess-word/data` - 管理员数据管理页面
- `/guess-word/invite` - 管理员邀请用户页面

**组件层面:**
- `GuessWordSettingsPage` - 与 `GameSettingsPage` 功能重复
- `GuessWordGamePage` - 与 `UniversalGamePage` 功能重复
- `GuessWordResultPage` - 可以使用通用结果页面
- `GuessWordSettingsSimple` - 简化版设置页面（未使用）
- `GuessWordSettingsMinimal` - 最小版设置页面（未使用）
- `HomePageSimple` - 简化版首页（未使用）

**导航层面:**
- 硬编码的 `/guess-word/*` 导航链接
- 特殊的guess_word处理逻辑

### 目标架构

**统一路由系统:**
```
/games/:gameId/settings  - 通用游戏设置页面
/games/:gameId/play      - 通用游戏页面
/games/:gameId/result    - 通用结果页面（如果需要）
```

**通用组件系统:**
- `GameSettingsPage` - 处理所有游戏的设置
- `UniversalGamePage` - 处理所有游戏的游戏逻辑
- `HomePage` - 动态显示所有可用游戏

**动态游戏管理:**
- 游戏通过数据库配置管理
- guess_word作为游戏列表中的一个游戏
- 所有游戏使用相同的组件和路由模式

## 组件和接口

### 需要保留的通用组件

1. **GameSettingsPage** - 已经支持多游戏的设置页面
2. **UniversalGamePage** - 已经支持多游戏的游戏页面
3. **HomePage** - 动态显示游戏列表的首页

### 需要移除的guess_word特定组件

1. **GuessWordSettingsPage** - 功能已被GameSettingsPage覆盖
2. **GuessWordGamePage** - 功能已被UniversalGamePage覆盖
3. **GuessWordResultPage** - 可以使用通用结果处理
4. **GuessWordSettingsSimple** - 未使用的简化版本
5. **GuessWordSettingsMinimal** - 未使用的最小版本
6. **HomePageSimple** - 未使用的简化版本

### 需要更新的组件

1. **App.tsx** - 移除guess_word特定路由
2. **UserHeader.tsx** - 移除硬编码的guess_word链接
3. **各种导航组件** - 使用动态游戏导航

## 数据模型

### 游戏配置模型

```typescript
interface Game {
  id: string;           // 'guess-word'
  title: string;        // '猜单词'
  description: string;  // 游戏描述
  icon: string;         // 图标名称
  type: string;         // 游戏类型
  language: string;     // 游戏语言
  default_config: any;  // 默认配置
  is_active: boolean;   // 是否激活
}
```

### 路由映射

```typescript
// 旧路由 -> 新路由映射
const routeMapping = {
  '/guess-word/settings': '/games/guess-word/settings',
  '/guess-word/game': '/games/guess-word/play',
  '/guess-word/result': '/games/guess-word/result', // 或使用通用结果页
  '/guess-word/data': '/admin/data',     // 管理员功能
  '/guess-word/invite': '/admin/invite'  // 管理员功能
};
```

## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式声明。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### 路由迁移属性

**属性 1: 路由模式一致性**
*对于任何* 游戏ID，所有游戏路由都应该遵循 `/games/:gameId/*` 模式，不应该存在游戏特定的路由模式
**验证: 需求 2.1**

**属性 2: 功能等价性**
*对于任何* guess_word功能，在通用组件中应该能够实现相同的功能，不应该丢失任何原有功能
**验证: 需求 2.2, 2.4**

**属性 3: 导航一致性**
*对于任何* 导航操作，所有游戏都应该使用相同的导航模式，不应该存在硬编码的游戏特定导航
**验证: 需求 2.3**

### 组件清理属性

**属性 4: 组件功能覆盖**
*对于任何* 被移除的guess_word特定组件，其所有功能都应该在通用组件中得到覆盖
**验证: 需求 3.2**

**属性 5: 导入引用完整性**
*对于任何* 代码文件，不应该存在对已移除组件的导入引用，所有引用都应该指向有效的组件
**验证: 需求 3.3**

### 配置统一属性

**属性 6: 游戏系统一致性**
*对于任何* 游戏（包括guess_word），都应该通过相同的游戏系统进行管理，不应该有特殊处理逻辑
**验证: 需求 4.2, 4.3, 4.5**

**属性 7: 认证模式一致性**
*对于任何* 游戏的认证流程，都应该使用相同的认证模式，不应该有游戏特定的认证逻辑
**验证: 需求 4.4**

### 清理完整性属性

**属性 8: 代码清理完整性**
*对于任何* 代码搜索，不应该找到未使用的guess_word特定代码，所有遗留代码都应该被清理
**验证: 需求 5.5, 6.3**

**属性 9: 应用程序稳定性**
*对于任何* 应用程序启动，系统应该无错误启动，所有游戏都应该可访问
**验证: 需求 6.1**

**属性 10: 集成完整性**
*对于任何* guess_word游戏操作，都应该通过通用架构正确执行，与其他游戏的集成方式一致
**验证: 需求 6.2, 6.5**

## 错误处理

### 迁移过程中的错误处理

1. **路由迁移错误**
   - 检查所有路由定义的语法正确性
   - 验证路由参数的正确传递
   - 确保路由处理器能正确处理新的路由模式

2. **组件移除错误**
   - 在移除组件前检查所有引用
   - 确保替代组件能提供相同功能
   - 验证导入语句的正确更新

3. **配置更新错误**
   - 验证游戏配置的完整性
   - 检查默认配置的正确性
   - 确保配置更新不影响其他游戏

### 运行时错误处理

1. **游戏加载错误**
   - 如果guess_word游戏配置缺失，提供默认配置
   - 处理游戏数据加载失败的情况
   - 提供用户友好的错误信息

2. **路由错误**
   - 处理无效的游戏ID
   - 提供404页面或重定向到首页
   - 记录路由错误以便调试

## 测试策略

### 单元测试

**组件测试:**
- 测试通用组件能正确处理guess_word游戏
- 验证组件属性和状态的正确性
- 测试错误边界和异常处理

**路由测试:**
- 测试新路由模式的正确性
- 验证路由参数的传递
- 测试路由守卫和权限控制

**配置测试:**
- 测试游戏配置的加载和解析
- 验证默认配置的正确性
- 测试配置更新的持久化

### 属性测试

每个正确性属性都需要对应的属性测试：

**属性测试 1: 路由模式验证**
- 生成随机游戏ID，验证路由模式的一致性
- **功能: guess-word-cleanup, 属性 1: 路由模式一致性**

**属性测试 2: 功能等价性验证**
- 比较guess_word在旧组件和新组件中的功能表现
- **功能: guess-word-cleanup, 属性 2: 功能等价性**

**属性测试 3: 导航一致性验证**
- 测试所有游戏的导航操作，确保一致性
- **功能: guess-word-cleanup, 属性 3: 导航一致性**

**属性测试 4: 组件功能覆盖验证**
- 验证通用组件覆盖所有被移除组件的功能
- **功能: guess-word-cleanup, 属性 4: 组件功能覆盖**

**属性测试 5: 导入引用完整性验证**
- 扫描所有代码文件，确保没有无效的导入引用
- **功能: guess-word-cleanup, 属性 5: 导入引用完整性**

**属性测试 6: 游戏系统一致性验证**
- 验证所有游戏都通过相同的系统管理
- **功能: guess-word-cleanup, 属性 6: 游戏系统一致性**

**属性测试 7: 认证模式一致性验证**
- 测试所有游戏的认证流程一致性
- **功能: guess-word-cleanup, 属性 7: 认证模式一致性**

**属性测试 8: 代码清理完整性验证**
- 搜索代码库，确保没有遗留的guess_word特定代码
- **功能: guess-word-cleanup, 属性 8: 代码清理完整性**

**属性测试 9: 应用程序稳定性验证**
- 测试应用程序启动和游戏访问的稳定性
- **功能: guess-word-cleanup, 属性 9: 应用程序稳定性**

**属性测试 10: 集成完整性验证**
- 验证guess_word与通用架构的集成完整性
- **功能: guess-word-cleanup, 属性 10: 集成完整性**

### 集成测试

**端到端测试:**
- 测试完整的guess_word游戏流程
- 验证从首页到游戏结束的完整用户体验
- 测试不同用户角色的访问权限

**回归测试:**
- 确保清理过程不影响其他游戏
- 验证现有功能的正确性
- 测试性能没有显著下降

### 测试工具和框架

**属性测试库:** 使用适合TypeScript/React的属性测试库（如fast-check）
**单元测试:** Jest + React Testing Library
**集成测试:** Cypress 或 Playwright
**静态分析:** ESLint + TypeScript编译器检查